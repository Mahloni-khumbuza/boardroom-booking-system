import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../auth/services/auth.service';
import { AvailabilitySlot, BoardroomAvailability } from '../models/boardroom.model';
import { Boardroom } from '../models/boardroom.model';
import { BoardroomsService } from '../services/boardrooms.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-boardroom-detail-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SpinnerComponent],
  templateUrl: './boardroom-detail.page.html',
  styleUrl: './boardroom-detail.page.css'
})
export class BoardroomDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly boardroomsService = inject(BoardroomsService);
  private readonly auth = inject(AuthService);

  readonly boardroom = signal<Boardroom | null>(null);
  readonly availability = signal<BoardroomAvailability | null>(null);
  readonly loading = signal(false);
  readonly availLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly availError = signal<string | null>(null);
  readonly selectedDate = signal<string>(todayString());

  readonly isAdmin = this.auth.isAdmin;
  readonly todayString = todayString;

  readonly backPath = computed(() => {
    const url = this.router.url;
    if (url.startsWith('/superadmin/browse-boardrooms')) return '/superadmin/browse-boardrooms';
    if (url.startsWith('/superadmin/boardrooms')) return '/superadmin/boardrooms';
    if (url.startsWith('/admin/browse-boardrooms')) return '/admin/browse-boardrooms';
    if (url.startsWith('/admin/boardrooms')) return '/admin/boardrooms';
    return '/employee/boardrooms';
  });

  readonly freeCount = computed(() => this.availability()?.slots.filter(s => s.available).length ?? 0);
  readonly busyCount = computed(() => this.availability()?.slots.filter(s => !s.available).length ?? 0);

  private boardroomId = '';

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.boardroomId = id;
      this.loadRoom(id);
      this.loadAvailability(id, this.selectedDate());
    }
  }

  onDateChange(date: string): void {
    this.selectedDate.set(date);
    if (this.boardroomId) this.loadAvailability(this.boardroomId, date);
  }

  prevDay(): void {
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() - 1);
    this.onDateChange(d.toISOString().slice(0, 10));
  }

  nextDay(): void {
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() + 1);
    this.onDateChange(d.toISOString().slice(0, 10));
  }

  isToday(): boolean {
    return this.selectedDate() === todayString();
  }

  bookRoom(): void {
    const base = this.router.url.startsWith('/admin') ? '/admin'
      : this.router.url.startsWith('/superadmin') ? '/superadmin'
      : '/employee';
    void this.router.navigate([`${base}/bookings`], {
      queryParams: { boardroomId: this.boardroom()?.id }
    });
  }

  trackSlot(_: number, slot: AvailabilitySlot): string {
    return slot.start;
  }

  private loadRoom(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.boardroomsService.get(id).subscribe({
      next: (room) => {
        this.boardroom.set(room);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  private loadAvailability(id: string, date: string): void {
    this.availLoading.set(true);
    this.availError.set(null);
    this.boardroomsService.getAvailability(id, date).subscribe({
      next: (avail) => {
        this.availability.set(avail);
        this.availLoading.set(false);
      },
      error: (err) => {
        this.availError.set(this.errorMessage(err));
        this.availLoading.set(false);
      }
    });
  }

  private errorMessage(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || e?.message || 'Something went wrong.';
  }
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}
