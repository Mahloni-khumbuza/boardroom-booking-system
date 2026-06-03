import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarOptions, EventClickArg, EventInput } from '@fullcalendar/core';

import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { FullCalendarModule } from '@fullcalendar/angular';
import { forkJoin } from 'rxjs';

import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../auth/services/auth.service';
import { Boardroom } from '../../boardrooms/models/boardroom.model';
import { BoardroomsService } from '../../boardrooms/services/boardrooms.service';
import { Booking, BookingStatus } from '../../bookings/models/booking.model';
import { BookingsService } from '../../bookings/services/bookings.service';

const STATUS_COLORS: Record<BookingStatus, { bg: string; border: string; text: string }> = {
  confirmed:  { bg: '#dcfce7', border: '#16a34a', text: '#166534' },
  pending:    { bg: '#fef3c7', border: '#d97706', text: '#92400e' },
  cancelled:  { bg: '#f1f5f9', border: '#94a3b8', text: '#64748b' },
  completed:  { bg: '#dbeafe', border: '#2563eb', text: '#1e40af' },
};

interface SelectedBooking {
  booking: Booking;
  canApprove: boolean;
  canCancel: boolean;
  canEdit: boolean;
}

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, FullCalendarModule, SpinnerComponent],
  templateUrl: './calendar.page.html',
  styleUrl: './calendar.page.css'
})
export class CalendarPage {
  private readonly bookingsService = inject(BookingsService);
  private readonly boardroomsService = inject(BoardroomsService);
  private readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);

  readonly bookings = signal<Booking[]>([]);
  readonly boardrooms = signal<Boardroom[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly boardroomFilter = signal('');
  readonly mineOnly = signal(false);
  readonly selected = signal<SelectedBooking | null>(null);

  readonly isAdmin = this.auth.isAdmin;
  readonly isSuperAdmin = this.auth.isSuperAdmin;
  readonly currentUserId = () => this.auth.currentUser()?.id ?? null;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    height: 'auto',
    nowIndicator: true,
    editable: false,
    eventClick: (arg: EventClickArg) => this.onEventClick(arg),
    eventDisplay: 'block',
    events: [],
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    slotMinTime: '07:00:00',
    slotMaxTime: '20:00:00',
  };

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    const mine = (!this.isAdmin() && !this.isSuperAdmin()) || this.mineOnly() ? true : undefined;
    forkJoin({
      bookings: this.bookingsService.list({ mine }),
      boardrooms: this.boardroomsService.list({ activeOnly: true })
    }).subscribe({
      next: ({ bookings, boardrooms }) => {
        this.bookings.set(bookings);
        this.boardrooms.set(boardrooms);
        this.loading.set(false);
        this.updateEvents();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error.set(this.errorMessage(err));
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private updateEvents(): void {
    const filter = this.boardroomFilter();
    const events: EventInput[] = this.bookings()
      .filter((b) => !filter || b.boardroom.id === filter)
      .map((b) => {
        const colors = STATUS_COLORS[b.status];
        const booker = b.bookedBy
          ? `${b.bookedBy.firstName} ${b.bookedBy.lastName}`.trim() || b.bookedBy.email
          : '';
        return {
          id: b.id,
          title: b.title,
          start: b.startTime,
          end: b.endTime,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: colors.text,
          extendedProps: { booking: b, booker },
        };
      });

    this.calendarOptions = { ...this.calendarOptions, events };
  }

  setBoardroomFilter(value: string): void {
    this.boardroomFilter.set(value);
    this.updateEvents();
  }

  toggleMine(): void {
    this.mineOnly.update((v) => !v);
    this.refresh();
  }

  private onEventClick(arg: EventClickArg): void {
    const booking = arg.event.extendedProps['booking'] as Booking;
    const userId = this.currentUserId();
    const isAdminOrSuper = this.isAdmin() || this.isSuperAdmin();
    const isOwner = booking.bookedBy?.id === userId;
    const active = booking.status !== 'cancelled' && booking.status !== 'completed';

    this.selected.set({
      booking,
      canApprove: isAdminOrSuper && booking.status === 'pending',
      canCancel: active && (isAdminOrSuper || isOwner),
      canEdit: active && (isAdminOrSuper || isOwner),
    });
    this.cdr.markForCheck();
  }

  closeDetail(): void {
    this.selected.set(null);
  }

  approveBooking(): void {
    const s = this.selected();
    if (!s) return;
    this.bookingsService.approve(s.booking.id).subscribe({
      next: (updated) => { this.replaceBooking(updated); this.closeDetail(); },
      error: (err) => this.error.set(this.errorMessage(err))
    });
  }

  cancelBooking(): void {
    const s = this.selected();
    if (!s) return;
    this.dialog.confirm({
      title: 'Cancel Booking',
      message: `Cancel "${s.booking.title}"? This cannot be undone.`,
      confirmLabel: 'Cancel Booking',
      danger: true,
    }).subscribe((confirmed) => {
      if (!confirmed) return;
      this.bookingsService.cancel(s.booking.id).subscribe({
        next: (updated) => {
          this.replaceBooking(updated);
          this.closeDetail();
          this.toast.success('Booking cancelled.');
          this.cdr.markForCheck();
        },
        error: (err) => { this.error.set(this.errorMessage(err)); this.cdr.markForCheck(); }
      });
    });
  }

  private replaceBooking(updated: Booking): void {
    this.bookings.update((list) => list.map((b) => b.id === updated.id ? updated : b));
    this.updateEvents();
    this.cdr.markForCheck();
  }

  statusLabel(s: BookingStatus): string {
    return { pending: 'Pending', confirmed: 'Confirmed', cancelled: 'Cancelled', completed: 'Completed' }[s];
  }

  bookerName(b: Booking): string {
    if (!b.bookedBy) return '—';
    return `${b.bookedBy.firstName} ${b.bookedBy.lastName}`.trim() || b.bookedBy.email;
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  }

  private errorMessage(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || e?.message || 'Something went wrong.';
  }
}
