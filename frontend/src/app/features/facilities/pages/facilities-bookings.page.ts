import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { forkJoin } from 'rxjs';

import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { Amenity, Boardroom } from '../../boardrooms/models/boardroom.model';
import { BoardroomsService } from '../../boardrooms/services/boardrooms.service';
import { Booking, BookingStatus } from '../../bookings/models/booking.model';
import { BookingsService } from '../../bookings/services/bookings.service';
import { extractErrorMessage } from '../../../shared/utils/error.utils';

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending_approval: 'Pending Approval',
  approved:         'Confirmed',
  rejected:         'Rejected',
  cancelled:        'Cancelled',
  completed:        'Completed',
  no_show:          'No Show',
};

const MEETING_TYPES = [
  { value: 'internal', label: 'Internal' },
  { value: 'external', label: 'External' },
  { value: 'interview', label: 'Interview' },
  { value: 'training', label: 'Training' },
  { value: 'board', label: 'Board Meeting' },
  { value: 'other', label: 'Other' },
];

function roundedNow(intervalMinutes: number): Date {
  const d = new Date();
  d.setMinutes(Math.ceil(d.getMinutes() / intervalMinutes) * intervalMinutes, 0, 0);
  return d;
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

@Component({
  selector: 'app-facilities-bookings-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTabsModule, SpinnerComponent, StatusBadgeComponent],
  templateUrl: './facilities-bookings.page.html',
  styleUrl: './facilities-bookings.page.css'
})
export class FacilitiesBookingsPage {
  private readonly fb = inject(FormBuilder);
  private readonly bookingsService = inject(BookingsService);
  private readonly boardroomsService = inject(BoardroomsService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);

  readonly bookings = signal<Booking[]>([]);
  readonly boardrooms = signal<Boardroom[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly showCreate = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);
  readonly selectedAmenityIds = signal<Set<string>>(new Set());
  readonly selectedBoardroomId = signal<string>('');
  readonly boardroomFilter = signal('');
  readonly statusFilter = signal<BookingStatus | ''>('');
  readonly meetingTypes = MEETING_TYPES;

  readonly filtered = computed(() => {
    let list = this.bookings();
    if (this.boardroomFilter()) list = list.filter((b) => b.boardroom.id === this.boardroomFilter());
    if (this.statusFilter()) list = list.filter((b) => b.status === this.statusFilter());
    return list;
  });

  readonly todayBookings = computed(() => {
    const today = new Date();
    return this.filtered().filter((b) => {
      const d = new Date(b.startDateTime);
      return d.getFullYear() === today.getFullYear() &&
             d.getMonth() === today.getMonth() &&
             d.getDate() === today.getDate();
    });
  });

  readonly selectedBoardroom = computed<Boardroom | null>(() =>
    this.boardrooms().find((r) => r.id === this.selectedBoardroomId()) ?? null
  );

  readonly availableAmenities = computed<Amenity[]>(
    () => this.selectedBoardroom()?.amenities ?? []
  );

  readonly upcomingBookings = computed(() =>
    this.bookings().filter(
      (b) => (b.status === 'approved' || b.status === 'pending_approval') && new Date(b.endDateTime) >= new Date()
    )
  );
  readonly pendingBookings = computed(() => this.bookings().filter((b) => b.status === 'pending_approval'));
  readonly pastBookings = computed(() =>
    this.bookings().filter(
      (b) => b.status === 'completed' || (b.status === 'approved' && new Date(b.endDateTime) < new Date())
    )
  );
  readonly cancelledBookings = computed(() =>
    this.bookings().filter((b) => b.status === 'cancelled' || b.status === 'rejected')
  );

  readonly form = this.fb.nonNullable.group({
    title:           ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    description:     [''],
    boardroomId:     ['', [Validators.required]],
    startTime:       ['', [Validators.required]],
    endTime:         ['', [Validators.required]],
    attendeeCount:   new FormControl<number>(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    meetingType:     ['internal'],
    requiresCatering:[false],
    cateringNotes:   [''],
    requiresSetup:   [false],
    setupNotes:      [''],
  });

  constructor() {
    this.refresh();
    this.form.controls.boardroomId.valueChanges.subscribe((id) => {
      this.selectedBoardroomId.set(id);
      this.selectedAmenityIds.set(new Set());
    });
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      bookings: this.bookingsService.list({}),
      boardrooms: this.boardroomsService.list({ activeOnly: true })
    }).subscribe({
      next: ({ bookings, boardrooms }) => {
        this.bookings.set(bookings);
        this.boardrooms.set(boardrooms);
        this.loading.set(false);
      },
      error: (err) => { this.error.set(extractErrorMessage(err)); this.loading.set(false); }
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    const start = roundedNow(60);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    this.form.reset({
      title: '', description: '', boardroomId: '',
      startTime: toLocalInput(start), endTime: toLocalInput(end),
      attendeeCount: 1, meetingType: 'internal',
      requiresCatering: false, cateringNotes: '',
      requiresSetup: false, setupNotes: '',
    });
    this.form.controls.boardroomId.enable();
    this.selectedAmenityIds.set(new Set());
    this.selectedBoardroomId.set('');
    this.showCreate.set(true);
  }

  closeForm(): void {
    this.showCreate.set(false);
    this.editingId.set(null);
    this.form.controls.boardroomId.enable();
  }

  toggleAmenity(id: string): void {
    const set = new Set(this.selectedAmenityIds());
    set.has(id) ? set.delete(id) : set.add(id);
    this.selectedAmenityIds.set(set);
  }

  isAmenitySelected(id: string): boolean {
    return this.selectedAmenityIds().has(id);
  }

  submitForm(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();
    const amenityIds = Array.from(this.selectedAmenityIds());

    this.bookingsService.create({
      title:               raw.title.trim(),
      description:         raw.description?.trim() || undefined,
      boardroomId:         raw.boardroomId,
      startTime:           new Date(raw.startTime).toISOString(),
      endTime:             new Date(raw.endTime).toISOString(),
      attendeeCount:       Number(raw.attendeeCount),
      meetingType:         raw.meetingType as any,
      requiresCatering:    raw.requiresCatering,
      cateringNotes:       raw.cateringNotes?.trim() || undefined,
      requiresSetup:       raw.requiresSetup,
      setupNotes:          raw.setupNotes?.trim() || undefined,
      requestedAmenityIds: amenityIds.length > 0 ? amenityIds : undefined,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.refresh();
        this.toast.success('Booking created successfully.');
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err));
        this.saving.set(false);
      }
    });
  }

  cancel(booking: Booking): void {
    this.dialog.confirm({
      title: 'Cancel Booking',
      message: `Cancel "${booking.title}"? This cannot be undone.`,
      confirmLabel: 'Cancel Booking',
      danger: true,
    }).subscribe((confirmed) => {
      if (!confirmed) return;
      this.busyId.set(booking.id);
      this.bookingsService.cancel(booking.id).subscribe({
        next: (updated) => { this.replaceOne(updated); this.toast.success('Booking cancelled.'); },
        error: () => this.busyId.set(null)
      });
    });
  }

  approve(booking: Booking): void {
    this.busyId.set(booking.id);
    this.bookingsService.approve(booking.id).subscribe({
      next: (updated) => { this.replaceOne(updated); this.toast.success('Booking approved.'); },
      error: () => this.busyId.set(null)
    });
  }

  canApprove(b: Booking): boolean { return b.status === 'pending_approval' && new Date(b.endDateTime) >= new Date(); }
  canCancel(b: Booking): boolean  {
    return b.status !== 'cancelled' && b.status !== 'completed' && b.status !== 'rejected' && b.status !== 'no_show'
      && new Date(b.endDateTime) >= new Date();
  }

  statusLabel(s: BookingStatus): string { return STATUS_LABELS[s] ?? s; }
  bookerLabel(b: Booking): string {
    if (!b.bookedByUser) return '—';
    return `${b.bookedByUser.firstName} ${b.bookedByUser.lastName}`.trim() || b.bookedByUser.email;
  }

  private replaceOne(updated: Booking): void {
    this.bookings.update((list) => list.map((b) => (b.id === updated.id ? updated : b)));
    this.busyId.set(null);
  }

}
