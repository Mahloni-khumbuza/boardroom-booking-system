import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { Amenity } from '../models/boardroom.model';
import { AmenitiesService } from '../services/amenities.service';

@Component({
  selector: 'app-admin-amenities-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent],
  templateUrl: './admin-amenities.page.html',
  styleUrl: './admin-amenities.page.css'
})
export class AdminAmenitiesPage {
  private readonly fb = inject(FormBuilder);
  private readonly amenitiesService = inject(AmenitiesService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);

  readonly amenities = signal<Amenity[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly isEdit = computed(() => !!this.editingId());

  readonly form = this.fb.nonNullable.group({
    name:        ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    description: [''],
    icon:        ['']
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    this.amenitiesService.list().subscribe({
      next: (list) => { this.amenities.set(list); this.loading.set(false); },
      error: (err) => { this.error.set(this.errorMessage(err)); this.loading.set(false); }
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', description: '', icon: '' });
    this.error.set(null);
    this.showForm.set(true);
  }

  openEdit(amenity: Amenity): void {
    this.editingId.set(amenity.id);
    this.form.reset({
      name:        amenity.name,
      description: amenity.description ?? '',
      icon:        amenity.icon ?? ''
    });
    this.error.set(null);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.error.set(null);
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();
    const payload = {
      name:        raw.name.trim(),
      description: raw.description?.trim() || undefined,
      icon:        raw.icon?.trim() || undefined
    };
    const id = this.editingId();
    const req = id
      ? this.amenitiesService.update(id, payload)
      : this.amenitiesService.create(payload);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(id ? 'Amenity updated.' : 'Amenity created.');
        this.closeForm();
        this.refresh();
      },
      error: (err) => { this.error.set(this.errorMessage(err)); this.saving.set(false); }
    });
  }

  remove(amenity: Amenity): void {
    this.dialog.confirm({
      title: 'Delete Amenity',
      message: `Delete amenity "${amenity.name}"?`,
      confirmLabel: 'Delete',
      danger: true
    }).subscribe((confirmed) => {
      if (!confirmed) return;
      this.amenitiesService.remove(amenity.id).subscribe({
        next: () => { this.refresh(); this.toast.success('Amenity deleted.'); },
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
