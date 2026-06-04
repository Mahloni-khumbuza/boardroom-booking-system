import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { Amenity, Boardroom } from '../models/boardroom.model';
import { AmenitiesService } from '../services/amenities.service';
import { BoardroomsService } from '../services/boardrooms.service';

@Component({
  selector: 'app-admin-boardrooms-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent, RouterLink],
  templateUrl: './admin-boardrooms.page.html',
  styleUrl: './admin-boardrooms.page.css'
})
export class AdminBoardroomsPage {
  private readonly fb = inject(FormBuilder);
  private readonly boardroomsService = inject(BoardroomsService);
  private readonly amenitiesService = inject(AmenitiesService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly amenitiesPath = this.router.url.startsWith('/superadmin')
    ? '/superadmin/amenities'
    : '/admin/amenities';

  readonly portalBase = this.router.url.startsWith('/superadmin')
    ? '/superadmin'
    : '/admin';

  readonly boardrooms = signal<Boardroom[]>([]);
  readonly amenities = signal<Amenity[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly selectedAmenityIds = signal<Set<string>>(new Set());

  readonly isEdit = computed(() => !!this.editingId());

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    description: [''],
    capacity: new FormControl<number>(4, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(1000)]
    }),
    location: [''],
    isActive: [true],
    requiresApproval: [false]
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      rooms: this.boardroomsService.list(),
      amenities: this.amenitiesService.list()
    }).subscribe({
      next: ({ rooms, amenities }) => {
        this.boardrooms.set(rooms);
        this.amenities.set(amenities);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', description: '', capacity: 4, location: '', isActive: true, requiresApproval: false });
    this.selectedAmenityIds.set(new Set());
    this.error.set(null);
    this.showForm.set(true);
  }

  openEdit(boardroom: Boardroom): void {
    this.editingId.set(boardroom.id);
    this.form.reset({
      name: boardroom.name,
      description: boardroom.description ?? '',
      capacity: boardroom.capacity,
      location: boardroom.location ?? '',
      isActive: boardroom.isActive,
      requiresApproval: boardroom.requiresApproval
    });
    this.selectedAmenityIds.set(new Set(boardroom.amenities.map(a => a.id)));
    this.error.set(null);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.error.set(null);
  }

  toggleAmenity(id: string): void {
    const set = new Set(this.selectedAmenityIds());
    set.has(id) ? set.delete(id) : set.add(id);
    this.selectedAmenityIds.set(set);
  }

  isAmenitySelected(id: string): boolean {
    return this.selectedAmenityIds().has(id);
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();
    const id = this.editingId();
    const payload = {
      name: raw.name.trim(),
      description: raw.description?.trim() || undefined,
      capacity: Number(raw.capacity),
      location: raw.location?.trim() || undefined,
      isActive: id ? raw.isActive : true,
      requiresApproval: raw.requiresApproval,
      amenityIds: Array.from(this.selectedAmenityIds())
    };

    const req = id
      ? this.boardroomsService.update(id, payload)
      : this.boardroomsService.create(payload);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(id ? 'Boardroom updated.' : 'Boardroom created.');
        this.closeForm();
        this.refresh();
      },
      error: (err) => {
        this.error.set(this.errorMessage(err));
        this.saving.set(false);
      }
    });
  }

  remove(boardroom: Boardroom): void {
    this.dialog.confirm({
      title: 'Delete Boardroom',
      message: `Delete "${boardroom.name}"? All bookings for this room will also be removed.`,
      confirmLabel: 'Delete',
      danger: true
    }).subscribe((confirmed) => {
      if (!confirmed) return;
      this.boardroomsService.remove(boardroom.id).subscribe({
        next: () => { this.refresh(); this.toast.success('Boardroom deleted.'); },
        error: (err) => this.error.set(this.errorMessage(err))
      });
    });
  }

  private errorMessage(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || e?.message || 'Something went wrong.';
  }
}
