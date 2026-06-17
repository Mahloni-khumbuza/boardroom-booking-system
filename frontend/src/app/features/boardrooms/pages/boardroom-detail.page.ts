import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../auth/services/auth.service';
import { AvailabilitySlot, BoardroomAvailability } from '../models/boardroom.model';
import { Boardroom } from '../models/boardroom.model';
import { BoardroomsService } from '../services/boardrooms.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { extractErrorMessage } from '../../../shared/utils/error.utils';

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

  readonly isAdmin = computed(() => this.auth.isAdmin());
  readonly todayString = todayString;

  readonly backPath = computed(() => {
    const url = this.router.url;
    if (url.startsWith('/superadmin')) return '/superadmin/boardrooms';
    if (url.startsWith('/admin'))      return '/admin/boardrooms';
    if (url.startsWith('/facilities')) return '/facilities/boardrooms';
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
    const url  = this.router.url;
    const base = url.startsWith('/superadmin') ? '/superadmin'
               : url.startsWith('/admin')      ? '/admin'
               : url.startsWith('/facilities') ? '/facilities'
               : '/employee';
    void this.router.navigate([`${base}/bookings`], {
      queryParams: { boardroomId: this.boardroom()?.id },
    });
  }

  trackSlot(_: number, slot: AvailabilitySlot): string {
    return slot.start;
  }

  heroGradient(id: string): string {
    const gradients = [
      'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
      'linear-gradient(135deg, #1a1a2e 0%, #4f46e5 100%)',
      'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
      'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
      'linear-gradient(135deg, #1e40af 0%, #60a5fa 100%)',
      'linear-gradient(135deg, #0f172a 0%, #475569 100%)',
      'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
      'linear-gradient(135deg, #92400e 0%, #f59e0b 100%)',
    ];
    const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
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
        this.error.set(extractErrorMessage(err));
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
        this.availError.set(extractErrorMessage(err));
        this.availLoading.set(false);
      }
    });
  }

}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}
