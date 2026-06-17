import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarModule } from '@fullcalendar/angular';

import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { ConfirmationModalComponent, ConfirmationModalConfig } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../auth/services/auth.service';
import { Boardroom } from '../../boardrooms/models/boardroom.model';
import { BoardroomsService } from '../../boardrooms/services/boardrooms.service';
import { BookingStatus } from '../../bookings/models/booking.model';
import { CalendarService } from '../services/calendar.service';
import { extractErrorMessage } from '../../../shared/utils/error.utils';

// The calendar endpoint returns CalendarEventResponseDto (start/end/boardroom as string),
// not a full Booking. Use a loose type here so the template can access both shapes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CalendarEvent = any;

interface SelectedBooking {
  booking: CalendarEvent;
  canApprove: boolean;
  canCancel: boolean;
}

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule, SpinnerComponent, ConfirmationModalComponent],
  templateUrl: './calendar.page.html',
  styleUrl: './calendar.page.css',
})
export class CalendarPage {
  private readonly calendarService   = inject(CalendarService);
  private readonly boardroomsService = inject(BoardroomsService);
  private readonly auth              = inject(AuthService);
  private readonly toast             = inject(ToastService);

  readonly loading         = signal(false);
  readonly error           = signal<string | null>(null);
  readonly boardrooms      = signal<Boardroom[]>([]);
  readonly boardroomFilter = signal('');
  readonly mineOnly        = signal(false);
  readonly selected        = signal<SelectedBooking | null>(null);

  readonly confirmOpen   = signal(false);
  readonly confirmConfig = signal<ConfirmationModalConfig>({ title: '', message: '' });
  private pendingConfirmAction: (() => void) | null = null;

  private bookingsCache: CalendarEvent[] = [];

  readonly isAdmin      = computed(() => this.auth.isAdmin());
  readonly isSuperAdmin = computed(() => this.auth.isSuperAdmin());

  readonly calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left:   'prev,next today',
      center: 'title',
      right:  'dayGridMonth,timeGridWeek,timeGridDay',
    },
    height: 'auto',
    eventClick: (arg: EventClickArg) => this.onEventClick(arg),
    events: [],
    eventClassNames: (arg) => [`event-status-${arg.event.extendedProps['status'] ?? 'unknown'}`],
  };

  constructor() {
    this.boardroomsService.list().subscribe({ next: (r) => this.boardrooms.set(r), error: () => {} });
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    this.calendarService.list({ boardroomId: this.boardroomFilter() || undefined }).subscribe({
      next: (bookings) => {
        this.bookingsCache = bookings;
        this.renderEvents();
        this.loading.set(false);
      },
      error: (e) => { this.error.set(extractErrorMessage(e)); this.loading.set(false); },
    });
  }

  setBoardroomFilter(id: string): void { this.boardroomFilter.set(id); this.refresh(); }

  closeDetail(): void { this.selected.set(null); }

  approveBooking(): void {
    const s = this.selected();
    if (!s) return;
    this.calendarService.approve(s.booking.id).subscribe({ next: () => { this.closeDetail(); this.refresh(); }, error: () => {} });
  }

  cancelBooking(): void {
    const s = this.selected();
    if (!s) return;
    this.confirmConfig.set({
      title: 'Cancel Booking',
      message: `Cancel "${s.booking.title}"?`,
      confirmLabel: 'Cancel booking',
      cancelLabel: 'Keep',
      danger: true,
    });
    this.pendingConfirmAction = () => {
      this.calendarService.cancel(s.booking.id).subscribe({
        next: () => { this.closeDetail(); this.refresh(); this.toast.success('Booking cancelled.'); },
        error: () => { this.toast.error('Failed to cancel booking.'); },
      });
    };
    this.confirmOpen.set(true);
  }

  onConfirmed(): void {
    this.confirmOpen.set(false);
    this.pendingConfirmAction?.();
    this.pendingConfirmAction = null;
  }

  onCancelled(): void {
    this.confirmOpen.set(false);
    this.pendingConfirmAction = null;
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
  }

  bookerName(b: CalendarEvent): string {
    if (b.owner) return b.owner;
    if (!b.bookedByUser) return '—';
    return `${b.bookedByUser.firstName} ${b.bookedByUser.lastName}`.trim();
  }

  roomName(b: CalendarEvent): string {
    if (b.boardroom && typeof b.boardroom === 'string') return b.boardroom;
    return b.boardroom?.name ?? '—';
  }

  startTime(b: CalendarEvent): string {
    return b.startDateTime ?? b.start ?? '';
  }

  endTime(b: CalendarEvent): string {
    return b.endDateTime ?? b.end ?? '';
  }

  statusLabel(status: BookingStatus | string): string {
    const map: Record<string, string> = {
      pending_approval: 'Pending Approval',
      approved:         'Confirmed',
      rejected:         'Rejected',
      cancelled:        'Cancelled',
      completed:        'Completed',
      no_show:          'No Show',
      ROOM_BLOCK:       'Room Block',
    };
    return map[status] ?? status;
  }

  private renderEvents(): void {
    const userId = this.auth.user()?.id;
    const filtered = this.mineOnly()
      ? this.bookingsCache.filter((b) => (b as any).bookedByUser?.id === userId)
      : this.bookingsCache;

    const colorMap: Record<string, string> = {
      approved:         '#16a34a',
      pending_approval: '#d97706',
      completed:        '#3b82f6',
      cancelled:        '#9ca3af',
      rejected:         '#ef4444',
      no_show:          '#6b7280',
      ROOM_BLOCK:       '#b45309',
    };

    const events = filtered.map((b: any) => ({
      id: b.id,
      title: b.status === 'ROOM_BLOCK' ? b.title : b.title,
      start: b.startDateTime ?? b.start,
      end: b.endDateTime ?? b.end,
      backgroundColor: colorMap[b.status] ?? '#6b7280',
      borderColor: colorMap[b.status] ?? '#6b7280',
      extendedProps: { booking: b, status: b.status },
    }));

    this.calendarOptions.events = events;
  }

  private onEventClick(arg: EventClickArg): void {
    const booking: CalendarEvent = arg.event.extendedProps['booking'];
    const canApprove = this.isAdmin() && booking?.status === 'pending_approval';
    const canCancel  = booking?.status === 'pending_approval' || booking?.status === 'approved';
    this.selected.set({ booking, canApprove, canCancel });
  }

}
