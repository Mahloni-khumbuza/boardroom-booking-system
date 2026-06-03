import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { Boardroom } from '../../boardrooms/models/boardroom.model';
import { BoardroomsService } from '../../boardrooms/services/boardrooms.service';
import { Booking, BookingStatus } from '../../bookings/models/booking.model';
import { BookingsService } from '../../bookings/services/bookings.service';
import { forkJoin } from 'rxjs';

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed'
};

@Component({
  selector: 'app-facilities-bookings-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './facilities-bookings.page.html',
  styleUrl: './facilities-bookings.page.css'
})
export class FacilitiesBookingsPage {
  private readonly bookingsService = inject(BookingsService);
  private readonly boardroomsService = inject(BoardroomsService);

  readonly bookings = signal<Booking[]>([]);
  readonly boardrooms = signal<Boardroom[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly boardroomFilter = signal('');
  readonly statusFilter = signal<BookingStatus | ''>('');

  readonly filtered = computed(() => {
    let list = this.bookings();
    if (this.boardroomFilter()) list = list.filter((b) => b.boardroom.id === this.boardroomFilter());
    if (this.statusFilter()) list = list.filter((b) => b.status === this.statusFilter());
    return list;
  });

  readonly todayBookings = computed(() => {
    const today = new Date();
    return this.filtered().filter((b) => {
      const d = new Date(b.startTime);
      return d.getFullYear() === today.getFullYear() &&
             d.getMonth() === today.getMonth() &&
             d.getDate() === today.getDate();
    });
  });

  constructor() { this.refresh(); }

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
      error: (err) => { this.error.set(this.errorMessage(err)); this.loading.set(false); }
    });
  }

  statusLabel(s: BookingStatus): string { return STATUS_LABELS[s]; }

  bookerName(b: Booking): string {
    if (!b.bookedBy) return '—';
    return `${b.bookedBy.firstName} ${b.bookedBy.lastName}`.trim() || b.bookedBy.email;
  }

  private errorMessage(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || e?.message || 'Something went wrong.';
  }
}
