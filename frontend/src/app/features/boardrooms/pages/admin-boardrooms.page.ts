import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { AuthService } from '../../auth/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { Amenity, Boardroom } from '../models/boardroom.model';
import { AmenitiesService } from '../services/amenities.service';
import { BoardroomsService } from '../services/boardrooms.service';
import { extractErrorMessage } from '../../../shared/utils/error.utils';

@Component({
  selector: 'app-admin-boardrooms-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SpinnerComponent, RouterLink],
  templateUrl: './admin-boardrooms.page.html',
  styleUrl: './admin-boardrooms.page.css',
})
export class AdminBoardroomsPage {
  private readonly fb              = inject(FormBuilder);
  private readonly boardroomsService = inject(BoardroomsService);
  private readonly amenitiesService  = inject(AmenitiesService);
  private readonly dialog          = inject(DialogService);
  private readonly toast           = inject(ToastService);
  private readonly router          = inject(Router);
  private readonly auth            = inject(AuthService);

  readonly portalBase = computed<string>(() => {
    if (this.auth.isSuperAdmin())        return '/superadmin';
    if (this.auth.isAdmin())             return '/admin';
    if (this.auth.isFacilitiesManager()) return '/facilities';
    return '/employee';
  });

  readonly amenitiesPath = computed<string>(() => `${this.portalBase()}/amenities`);

  readonly canManage  = computed(() => this.auth.isAdmin() || this.auth.isSuperAdmin());

  // ── Data ─────────────────────────────────────────────────────────────
  readonly allRooms    = signal<Boardroom[]>([]);
  readonly allAmenities = signal<Amenity[]>([]);
  readonly loading    = signal(false);
  readonly error      = signal<string | null>(null);
  readonly saving     = signal(false);
  readonly showForm   = signal(false);
  readonly editingId  = signal<string | null>(null);
  readonly selectedAmenityIds = signal<Set<string>>(new Set());

  // ── Search / filter ───────────────────────────────────────────────────
  readonly search              = signal('');
  readonly locationFilter      = signal('');
  readonly minCapacity         = signal<number | null>(null);
  readonly filterAmenityIds    = signal<Set<string>>(new Set());
  readonly availabilityDate      = signal('');
  readonly availabilityLoading   = signal(false);
  // Set of room IDs that have at least one free slot on the selected date
  readonly availableRoomIds    = signal<Set<string> | null>(null);

  readonly filtered = computed(() => {
    const q    = this.search().toLowerCase().trim();
    const loc  = this.locationFilter().toLowerCase().trim();
    const cap  = this.minCapacity();
    const ids  = this.filterAmenityIds();
    const avail = this.availableRoomIds();

    return this.allRooms().filter(r => {
      if (q && !r.name.toLowerCase().includes(q) &&
          !(r.description ?? '').toLowerCase().includes(q) &&
          !r.amenities.some(a => a.name.toLowerCase().includes(q))) return false;
      if (loc && !(r.location ?? '').toLowerCase().includes(loc)) return false;
      if (cap && r.capacity < cap) return false;
      if (ids.size > 0 && !Array.from(ids).every(id => r.amenities.some(a => a.id === id))) return false;
      if (avail !== null && !avail.has(r.id)) return false;
      return true;
    });
  });

  readonly isEdit = computed(() => !!this.editingId());
  readonly todayStr = new Date().toISOString().slice(0, 10);

  // ── Form ──────────────────────────────────────────────────────────────
  readonly form = this.fb.nonNullable.group({
    name:            ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    description:     [''],
    capacity:        new FormControl<number>(4, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(1000)],
    }),
    location:        [''],
    imageUrl:        [''],
    isActive:        [true],
    requiresApproval:[false],
  });

  constructor() { this.refresh(); }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);

    if (this.canManage()) {
      forkJoin({
        rooms:     this.boardroomsService.list(),
        amenities: this.amenitiesService.list(),
      }).subscribe({
        next: ({ rooms, amenities }) => {
          this.allRooms.set(rooms);
          this.allAmenities.set(amenities);
          this.loading.set(false);
        },
        error: (err) => { this.error.set(extractErrorMessage(err)); this.loading.set(false); },
      });
    } else {
      this.boardroomsService.list().subscribe({
        next: (rooms) => { this.allRooms.set(rooms); this.loading.set(false); },
        error: (err) => { this.error.set(extractErrorMessage(err)); this.loading.set(false); },
      });
    }
  }

  // ── Filter helpers ────────────────────────────────────────────────────
  setSearch(v: string)     { this.search.set(v); }
  setLocation(v: string)   { this.locationFilter.set(v); }
  setMinCap(v: string)     {
    const n = Number(v);
    this.minCapacity.set(v === '' || !Number.isFinite(n) ? null : n);
  }

  toggleFilterAmenity(id: string): void {
    const s = new Set(this.filterAmenityIds());
    s.has(id) ? s.delete(id) : s.add(id);
    this.filterAmenityIds.set(s);
  }
  isFilterAmenity(id: string): boolean { return this.filterAmenityIds().has(id); }

  setAvailabilityDate(v: string): void {
    this.availabilityDate.set(v);
    if (!v) {
      this.availableRoomIds.set(null);
      return;
    }
    this.availabilityLoading.set(true);
    const rooms = this.allRooms();
    let pending = rooms.length;
    if (pending === 0) { this.availabilityLoading.set(false); this.availableRoomIds.set(new Set()); return; }
    const freeIds = new Set<string>();
    for (const room of rooms) {
      this.boardroomsService.getAvailability(room.id, v).subscribe({
        next: (avail) => {
          if (avail.slots.some(s => s.available)) freeIds.add(room.id);
          if (--pending === 0) { this.availableRoomIds.set(new Set(freeIds)); this.availabilityLoading.set(false); }
        },
        error: () => {
          if (--pending === 0) { this.availableRoomIds.set(new Set(freeIds)); this.availabilityLoading.set(false); }
        },
      });
    }
  }

  clearFilters(): void {
    this.search.set('');
    this.locationFilter.set('');
    this.minCapacity.set(null);
    this.filterAmenityIds.set(new Set());
    this.availabilityDate.set('');
    this.availableRoomIds.set(null);
  }

  hasFilters(): boolean {
    return !!(this.search() || this.locationFilter() || this.minCapacity() || this.filterAmenityIds().size || this.availabilityDate());
  }

  // ── CRUD ──────────────────────────────────────────────────────────────
  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', description: '', capacity: 4, location: '',
      imageUrl: '', isActive: true, requiresApproval: false });
    this.selectedAmenityIds.set(new Set());
    this.error.set(null);
    this.showForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openEdit(r: Boardroom): void {
    this.editingId.set(r.id);
    this.form.reset({
      name: r.name, description: r.description ?? '',
      capacity: r.capacity, location: r.location ?? '',
      imageUrl: r.imageUrl ?? '', isActive: r.isActive, requiresApproval: r.requiresApproval,
    });
    this.selectedAmenityIds.set(new Set(r.amenities.map(a => a.id)));
    this.error.set(null);
    this.showForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.error.set(null);
  }

  toggleAmenity(id: string): void {
    const s = new Set(this.selectedAmenityIds());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selectedAmenityIds.set(s);
  }
  isAmenitySelected(id: string): boolean { return this.selectedAmenityIds().has(id); }

  submit(): void {
    if (this.form.invalid || this.saving()) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();
    const id  = this.editingId();
    const payload = {
      name:            raw.name.trim(),
      description:     raw.description?.trim() || undefined,
      capacity:        Number(raw.capacity),
      location:        raw.location?.trim() || undefined,
      imageUrl:        raw.imageUrl?.trim() || undefined,
      isActive:        id ? raw.isActive : true,
      requiresApproval:raw.requiresApproval,
      amenityIds:      Array.from(this.selectedAmenityIds()),
    };

    const req = id ? this.boardroomsService.update(id, payload) : this.boardroomsService.create(payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(id ? 'Boardroom updated.' : 'Boardroom created.');
        this.closeForm();
        this.refresh();
      },
      error: (err) => { this.error.set(extractErrorMessage(err)); this.saving.set(false); },
    });
  }

  remove(r: Boardroom): void {
    this.dialog.confirm({
      title: 'Delete Boardroom',
      message: `Delete "${r.name}"? All bookings for this room will also be removed.`,
      confirmLabel: 'Delete',
      danger: true,
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.boardroomsService.remove(r.id).subscribe({
        next: () => { this.refresh(); this.toast.success('Boardroom deleted.'); },
        error: (err) => this.error.set(extractErrorMessage(err)),
      });
    });
  }

  // Deterministic gradient for rooms without a photo
  roomGradient(id: string): string {
    const g = [
      'linear-gradient(135deg,#1e3a5f,#2563eb)',
      'linear-gradient(135deg,#1a1a2e,#4f46e5)',
      'linear-gradient(135deg,#0f766e,#14b8a6)',
      'linear-gradient(135deg,#7c3aed,#a78bfa)',
      'linear-gradient(135deg,#1e40af,#60a5fa)',
      'linear-gradient(135deg,#0f172a,#475569)',
      'linear-gradient(135deg,#065f46,#10b981)',
      'linear-gradient(135deg,#92400e,#f59e0b)',
    ];
    const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return g[h % g.length];
  }

}
