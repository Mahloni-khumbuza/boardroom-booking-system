import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../auth/services/auth.service';
import { Booking } from '../../bookings/models/booking.model';
import { BookingsService } from '../../bookings/services/bookings.service';
import { Boardroom } from '../models/boardroom.model';
import { BoardroomsService } from '../services/boardrooms.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

interface AvailabilityDay {
  date: Date;
  label: string;
  bookings: Booking[];
}

@Component({
  selector: 'app-boardroom-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent],
  templateUrl: './boardroom-detail.page.html',
  styleUrl: './boardroom-detail.page.css'
})
export class BoardroomDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly boardroomsService = inject(BoardroomsService);
  private readonly bookingsService = inject(BookingsService);
  private readonly auth = inject(AuthService);

  readonly boardroom = signal<Boardroom | null>(null);
  readonly bookings = signal<Booking[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly isAdmin = this.auth.isAdmin;

  readonly days = computed<AvailabilityDay[]>(() => {
    const now = new Date();
    const days: AvailabilityDay[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      days.push({ date: d, label: formatDayLabel(d), bookings: [] });
    }
    for (const b of this.bookings()) {
      if (b.status === 'cancelled') continue;
      const start = new Date(b.startTime);
      const dayIndex = Math.floor(
        (new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() -
          new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
          (24 * 60 * 60 * 1000)
      );
      if (dayIndex >= 0 && dayIndex < 7) {
        days[dayIndex].bookings.push(b);
      }
    }
    for (const day of days) {
      day.bookings.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }
    return days;
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  bookRoom(): void {
    void this.router.navigate(['/employee/bookings'], {
      queryParams: { boardroomId: this.boardroom()?.id }
    });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    const now = new Date();
    const sevenDays = new Date(now);
    sevenDays.setDate(sevenDays.getDate() + 7);

    forkJoin({
      room: this.boardroomsService.get(id),
      bookings: this.bookingsService.list({ boardroomId: id, from: now.toISOString(), to: sevenDays.toISOString() })
    }).subscribe({
      next: ({ room, bookings }) => {
        this.boardroom.set(room);
        this.bookings.set(bookings);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  private errorMessage(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || e?.message || 'Boardroom not found.';
  }
}

function formatDayLabel(d: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sameDay = (a: Date, b: Date): boolean =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const dateStr = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  if (sameDay(d, today)) return `Today · ${dateStr}`;
  if (sameDay(d, tomorrow)) return `Tomorrow · ${dateStr}`;
  return dateStr;
}
