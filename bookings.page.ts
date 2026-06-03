import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../auth/services/auth.service';
import { Amenity, Boardroom } from '../../boardrooms/models/boardroom.model';
import { BoardroomsService } from '../../boardrooms/services/boardrooms.service';
import { Booking, BookingStatus } from '../models/booking.model';
import { BookingsService } from '../services/bookings.service';

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed'
};

@Component({
  selector: 'app-bookings-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bookings.page.html',
  styleUrl: './bookings.page.css'
})
export class BookingsPage {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(BookingsService);
  private readonly boardroomsService = inject(BoardroomsService);
  private readonly auth = inject(AuthService);

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

  readonly statusFilter = signal<BookingStatus | ''>('');
  readonly boardroomFilter = signal<string>('');
  readonly mineOnly = signal(false);

  readonly isAdmin = this.auth.isAdmin;
  readonly currentUserId = computed(() => this.auth.currentUser()?.id ?? null);

  readonly filteredBookings = computed(() => {
    let list = this.bookings();
    if (this.statusFilter()) {
      list = list.filter((b) => b.status === this.statusFilter());
    }
    if (this.boardroomFilter()) {
      list = list.filter((b) => b.boardroom.id === this.boardroomFilter());
    }
    return list;
  });

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
    })
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
      boardrooms: this.boardroomsService.list(true)
    }).subscribe({
      next: ({ bookings, boardrooms }) => {
        this.bookings.set(bookings);
        this.boardrooms.set(boardrooms);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  toggleMine(): void {
    this.mineOnly.update((v) => !v);
    this.refresh();
  }

  setStatusFilter(value: string): void {
    this.statusFilter.set(value as BookingStatus | '');
  }

  setBoardroomFilter(value: string): void {
    this.boardroomFilter.set(value);
  }

  toggleAmenity(id: string): void {
    const set = new Set(this.selectedAmenityIds());
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
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
      title: '',
      description: '',
      boardroomId: '',
      startTime: toLocalInput(start),
      endTime: toLocalInput(end),
      attendeeCount: 1
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
      attendeeCount: booking.attendeeCount
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
    this.error.set(null);

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
          requestedAmenityIds: amenityIds.length > 0 ? amenityIds : undefined
        });

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.refresh();
      },
      error: (err) => {
        this.error.set(this.errorMessage(err));
        this.saving.set(false);
      }
    });
  }

  approve(booking: Booking): void {
    this.busyId.set(booking.id);
    this.service.approve(booking.id).subscribe({
      next: (updated) => this.replaceOne(updated),
      error: (err) => {
        this.error.set(this.errorMessage(err));
        this.busyId.set(null);
      }
    });
  }

  cancel(booking: Booking): void {
    if (!confirm(`Cancel booking "${booking.title}"?`)) return;
    this.busyId.set(booking.id);
    this.service.cancel(booking.id).subscribe({
      next: (updated) => this.replaceOne(updated),
      error: (err) => {
        this.error.set(this.errorMessage(err));
        this.busyId.set(null);
      }
    });
  }

  canApprove(booking: Booking): boolean {
    return this.isAdmin() && booking.status === 'pending';
  }

  canEdit(booking: Booking): boolean {
    if (booking.status === 'cancelled' || booking.status === 'completed') return false;
    return this.isAdmin() || booking.bookedBy?.id === this.currentUserId();
  }

  canCancel(booking: Booking): boolean {
    if (booking.status === 'cancelled' || booking.status === 'completed') return false;
    return this.isAdmin() || booking.bookedBy?.id === this.currentUserId();
  }

  statusLabel(status: BookingStatus): string {
    return STATUS_LABELS[status];
  }

  bookerLabel(booking: Booking): string {
    if (!booking.bookedBy) return '—';
    const name = `${booking.bookedBy.firstName} ${booking.bookedBy.lastName}`.trim();
    return name || booking.bookedBy.email;
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
