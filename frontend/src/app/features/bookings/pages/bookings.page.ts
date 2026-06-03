import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { forkJoin } from 'rxjs';

import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../auth/services/auth.service';
import { Amenity, Boardroom } from '../../boardrooms/models/boardroom.model';
import { BoardroomsService } from '../../boardrooms/services/boardrooms.service';
import { Booking, BookingStatus } from '../models/booking.model';
import { BookingsService } from '../services/bookings.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending Approval',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed'
};

const MEETING_TYPES = [
  { value: 'internal', label: 'Internal' },
  { value: 'external', label: 'External' },
  { value: 'interview', label: 'Interview' },
  { value: 'training', label: 'Training' },
  { value: 'board', label: 'Board Meeting' },
  { value: 'other', label: 'Other' },
];

@Component({
  selector: 'app-bookings-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    SpinnerComponent,
  ],
  templateUrl: './bookings.page.html',
  styleUrl: './bookings.page.css'
})
export class BookingsPage {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(BookingsService);
  private readonly boardroomsService = inject(BoardroomsService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);

  readonly bookings = signal<Booking[]>([]);
  readonly boardrooms = signal<Boardroom[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly showCreate = signal(false);
  readonly saving = signal(false);
  readonly selectedAmenityIds = signal<Set<string>>(new Set());
  readonly selectedBoardroomId = signal<string>('');
  readonly boardroomFilter = signal('');
  readonly mineOnly = signal(false);
  readonly meetingTypes = MEETING_TYPES;

  readonly isAdmin = this.auth.isAdmin;
  readonly currentUserId = computed(() => this.auth.currentUser()?.id ?? null);

  readonly upcomingBookings = computed(() =>
    this.bookings().filter((b) => (b.status === 'confirmed' || b.status === 'pending') && new Date(b.endTime) >= new Date())
  );
  readonly pendingBookings = computed(() => this.bookings().filter((b) => b.status === 'pending'));
  readonly pastBookings = computed(() =>
    this.bookings().filter((b) => b.status === 'completed' || (b.status === 'confirmed' && new Date(b.endTime) < new Date()))
  );
  readonly cancelledBookings = computed(() => this.bookings().filter((b) => b.status === 'cancelled'));

  readonly selectedBoardroom = computed<Boardroom | null>(() => {
    const id = this.selectedBoardroomId();
    return this.boardrooms().find((r) => r.id === id) ?? null;
  });

  readonly availableAmenities = computed<Amenity[]>(
    () => this.selectedBoardroom()?.amenities ?? []
  );

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    description: [''],
    boardroomId: ['', [Validators.required]],
    startTime: ['', [Validators.required]],
    endTime: ['', [Validators.required]],
    attendeeCount: new FormControl<number>(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)]
    }),
    meetingType: ['internal'],
    requiresCatering: [false],
    cateringNotes: [''],
    requiresSetup: [false],
    setupNotes: [''],
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
    const mineQuery = !this.isAdmin() || this.mineOnly() ? true : undefined;
    forkJoin({
      bookings: this.service.list({ mine: mineQuery }),
      boardrooms: this.boardroomsService.list({ activeOnly: true })
    }).subscribe({
      next: ({ bookings, boardrooms }) => {
        this.bookings.set(bookings);
        this.boardrooms.set(boardrooms);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
  }

  toggleMine(): void {
    this.mineOnly.update((v) => !v);
    this.refresh();
  }

  toggleAmenity(id: string): void {
    const set = new Set(this.selectedAmenityIds());
    set.has(id) ? set.delete(id) : set.add(id);
    this.selectedAmenityIds.set(set);
  }

  isAmenitySelected(id: string): boolean {
    return this.selectedAmenityIds().has(id);
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

  openEdit(booking: Booking): void {
    this.editingId.set(booking.id);
    this.form.reset({
      title: booking.title,
      description: booking.description ?? '',
      boardroomId: booking.boardroom.id,
      startTime: toLocalInput(new Date(booking.startTime)),
      endTime: toLocalInput(new Date(booking.endTime)),
      attendeeCount: booking.attendeeCount,
      meetingType: (booking as any).meetingType ?? 'internal',
      requiresCatering: (booking as any).requiresCatering ?? false,
      cateringNotes: (booking as any).cateringNotes ?? '',
      requiresSetup: (booking as any).requiresSetup ?? false,
      setupNotes: (booking as any).setupNotes ?? '',
    });
    this.form.controls.boardroomId.disable();
    this.selectedBoardroomId.set(booking.boardroom.id);
    this.selectedAmenityIds.set(new Set(booking.requestedAmenities.map((a) => a.id)));
    this.showCreate.set(true);
  }

  closeForm(): void {
    this.showCreate.set(false);
    this.editingId.set(null);
    this.form.controls.boardroomId.enable();
  }

  submitForm(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const id = this.editingId();
    const amenityIds = Array.from(this.selectedAmenityIds());

    const request$ = id
      ? this.service.update(id, {
          title: raw.title.trim(),
          description: raw.description?.trim() || undefined,
          startTime: new Date(raw.startTime).toISOString(),
          endTime: new Date(raw.endTime).toISOString(),
          attendeeCount: Number(raw.attendeeCount),
          requestedAmenityIds: amenityIds
        })
      : this.service.create({
          title: raw.title.trim(),
          description: raw.description?.trim() || undefined,
          boardroomId: raw.boardroomId,
          startTime: new Date(raw.startTime).toISOString(),
          endTime: new Date(raw.endTime).toISOString(),
          attendeeCount: Number(raw.attendeeCount),
          meetingType: raw.meetingType as any,
          requiresCatering: raw.requiresCatering,
          cateringNotes: raw.cateringNotes?.trim() || undefined,
          requiresSetup: raw.requiresSetup,
          setupNotes: raw.setupNotes?.trim() || undefined,
          requestedAmenityIds: amenityIds.length > 0 ? amenityIds : undefined
        });

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.refresh();
        this.toast.success(id ? 'Booking updated.' : 'Booking created successfully.');
      },
      error: (err) => {
        this.saving.set(false);
        const msg = this.errorMessage(err);
        if (err?.status < 500) this.error.set(msg);
      }
    });
  }

  approve(booking: Booking): void {
    this.busyId.set(booking.id);
    this.service.approve(booking.id).subscribe({
      next: (updated) => {
        this.replaceOne(updated);
        this.toast.success('Booking approved.');
      },
      error: () => this.busyId.set(null)
    });
  }

  complete(booking: Booking): void {
    this.dialog.confirm({
      title: 'Mark as Completed',
      message: `Mark "${booking.title}" as completed?`,
      confirmLabel: 'Complete',
    }).subscribe((confirmed) => {
      if (!confirmed) return;
      this.busyId.set(booking.id);
      this.service.complete(booking.id).subscribe({
        next: (updated) => { this.replaceOne(updated); this.toast.success('Booking marked as completed.'); },
        error: () => this.busyId.set(null)
      });
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
      this.service.cancel(booking.id).subscribe({
        next: (updated) => { this.replaceOne(updated); this.toast.success('Booking cancelled.'); },
        error: () => this.busyId.set(null)
      });
    });
  }

  private isFuture(b: Booking): boolean { return new Date(b.endTime) >= new Date(); }

  canApprove(b: Booking): boolean {
    return this.isAdmin() && b.status === 'pending' && this.isFuture(b);
  }
  canComplete(b: Booking): boolean {
    // Only past confirmed bookings can be marked complete (past tab only)
    return this.isAdmin() && b.status === 'confirmed' && !this.isFuture(b);
  }
  canEdit(b: Booking): boolean {
    if (b.status === 'cancelled' || b.status === 'completed') return false;
    if (!this.isFuture(b)) return false; // cannot edit a booking that has already ended
    return this.isAdmin() || b.bookedBy?.id === this.currentUserId();
  }
  canCancel(b: Booking): boolean {
    if (b.status === 'cancelled' || b.status === 'completed') return false;
    if (!this.isFuture(b)) return false; // cannot cancel a booking that has already ended
    return this.isAdmin() || b.bookedBy?.id === this.currentUserId();
  }

  statusLabel(s: BookingStatus): string { return STATUS_LABELS[s]; }
  bookerLabel(b: Booking): string {
    if (!b.bookedBy) return '—';
    return `${b.bookedBy.firstName} ${b.bookedBy.lastName}`.trim() || b.bookedBy.email;
  }

  private replaceOne(updated: Booking): void {
    this.bookings.update((list) => list.map((b) => (b.id === updated.id ? updated : b)));
    this.busyId.set(null);
  }

  private errorMessage(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || e?.message || 'Something went wrong.';
  }
}

function roundedNow(intervalMinutes: number): Date {
  const d = new Date();
  d.setMinutes(Math.ceil(d.getMinutes() / intervalMinutes) * intervalMinutes, 0, 0);
  return d;
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
