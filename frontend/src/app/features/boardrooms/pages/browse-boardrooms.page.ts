import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { Amenity, Boardroom } from '../models/boardroom.model';
import { AmenitiesService } from '../services/amenities.service';
import { BoardroomsService } from '../services/boardrooms.service';

@Component({
  selector: 'app-browse-boardrooms-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SpinnerComponent],
  templateUrl: './browse-boardrooms.page.html',
  styleUrl: './browse-boardrooms.page.css'
})
export class BrowseBoardroomsPage {
  private readonly router = inject(Router);
  private readonly boardroomsService = inject(BoardroomsService);

  readonly detailBase = computed(() => {
    const url = this.router.url;
    if (url.startsWith('/superadmin')) return '/superadmin/browse-boardrooms';
    if (url.startsWith('/admin')) return '/admin/browse-boardrooms';
    return '/employee/boardrooms';
  });
  private readonly amenitiesService = inject(AmenitiesService);

  readonly boardrooms = signal<Boardroom[]>([]);
  readonly allAmenities = signal<Amenity[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly search = signal('');
  readonly minCapacity = signal<number | null>(null);
  readonly location = signal('');
  readonly selectedAmenityIds = signal<Set<string>>(new Set());

  // Client-side text search only — capacity/location/amenity filters are server-side
  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.boardrooms();
    return this.boardrooms().filter((r) =>
      r.name.toLowerCase().includes(q) ||
      (r.location ?? '').toLowerCase().includes(q) ||
      (r.description ?? '').toLowerCase().includes(q) ||
      r.amenities.some((a) => a.name.toLowerCase().includes(q))
    );
  });

  constructor() {
    this.loadAmenities();
    this.fetchRooms();
  }

  private loadAmenities(): void {
    this.amenitiesService.list().subscribe({
      next: (amenities) => this.allAmenities.set(amenities),
      error: () => {}
    });
  }

  private fetchRooms(): void {
    this.loading.set(true);
    this.error.set(null);
    this.boardroomsService.list({
      activeOnly: true,
      minCapacity: this.minCapacity() ?? undefined,
      location: this.location() || undefined,
      amenityIds: this.selectedAmenityIds().size > 0
        ? Array.from(this.selectedAmenityIds())
        : undefined
    }).subscribe({
      next: (rooms) => { this.boardrooms.set(rooms); this.loading.set(false); },
      error: (err) => { this.error.set(this.errorMessage(err)); this.loading.set(false); }
    });
  }

  applyFilters(): void {
    this.fetchRooms();
  }

  setSearch(value: string): void {
    this.search.set(value);
  }

  setLocation(value: string): void {
    this.location.set(value);
  }

  setMinCapacity(value: string): void {
    const n = value === '' ? null : Number(value);
    this.minCapacity.set(Number.isFinite(n) ? n : null);
  }

  toggleAmenity(id: string): void {
    const set = new Set(this.selectedAmenityIds());
    set.has(id) ? set.delete(id) : set.add(id);
    this.selectedAmenityIds.set(set);
  }

  isAmenitySelected(id: string): boolean {
    return this.selectedAmenityIds().has(id);
  }

  clearFilters(): void {
    this.search.set('');
    this.location.set('');
    this.minCapacity.set(null);
    this.selectedAmenityIds.set(new Set());
    this.fetchRooms();
  }

  private errorMessage(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || e?.message || 'Something went wrong.';
  }
}
