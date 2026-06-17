import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Projector, Tv, Mic2, Wifi, Phone, Wind, Sun, Coffee,
  UtensilsCrossed, Pencil, Volume2, Monitor, Presentation,
  Armchair, Lock, Star, Printer, Camera, Lightbulb, Tag,
  LucideAngularModule,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} from 'lucide-angular';

import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { Amenity } from '../models/boardroom.model';
import { AmenitiesService } from '../services/amenities.service';
import { extractErrorMessage } from '../../../shared/utils/error.utils';

@Component({
  selector: 'app-admin-amenities-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent, LucideAngularModule],
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
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    this.amenitiesService.list().subscribe({
      next: (list) => { this.amenities.set(list); this.loading.set(false); },
      error: (err) => { this.error.set(extractErrorMessage(err)); this.loading.set(false); }
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', description: '' });
    this.error.set(null);
    this.showForm.set(true);
  }

  openEdit(amenity: Amenity): void {
    this.editingId.set(amenity.id);
    this.form.reset({
      name:        amenity.name,
      description: amenity.description ?? '',
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
      error: (err) => { this.error.set(extractErrorMessage(err)); this.saving.set(false); }
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
        error: (err) => this.error.set(extractErrorMessage(err))
      });
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly iconMap: Array<{ keywords: string[]; icon: any; color: string; bg: string }> = [
    { keywords: ['projector'],                   icon: Projector,       color: '#4f46e5', bg: '#eef2ff' },
    { keywords: ['tv', 'screen', 'television'],  icon: Tv,              color: '#0891b2', bg: '#e0f2fe' },
    { keywords: ['video', 'conferenc'],          icon: Monitor,         color: '#7c3aed', bg: '#f5f3ff' },
    { keywords: ['mic', 'audio'],                icon: Mic2,            color: '#db2777', bg: '#fdf2f8' },
    { keywords: ['wifi', 'wi-fi', 'internet'],   icon: Wifi,            color: '#0284c7', bg: '#e0f2fe' },
    { keywords: ['phone'],                       icon: Phone,           color: '#16a34a', bg: '#f0fdf4' },
    { keywords: ['air', 'condition', 'hvac'],    icon: Wind,            color: '#0891b2', bg: '#ecfeff' },
    { keywords: ['natural', 'light', 'sun'],     icon: Sun,             color: '#d97706', bg: '#fffbeb' },
    { keywords: ['catering', 'food', 'coffee'],  icon: UtensilsCrossed, color: '#ea580c', bg: '#fff7ed' },
    { keywords: ['whiteboard', 'board'],         icon: Pencil,          color: '#7c3aed', bg: '#f5f3ff' },
    { keywords: ['speaker', 'volume', 'sound'],  icon: Volume2,         color: '#0284c7', bg: '#eff6ff' },
    { keywords: ['presentation'],                icon: Presentation,    color: '#4f46e5', bg: '#eef2ff' },
    { keywords: ['standing', 'desk', 'chair'],   icon: Armchair,        color: '#059669', bg: '#ecfdf5' },
    { keywords: ['soundproof', 'acoustic'],      icon: Lock,            color: '#475569', bg: '#f8fafc' },
    { keywords: ['printer'],                     icon: Printer,         color: '#64748b', bg: '#f8fafc' },
    { keywords: ['camera'],                      icon: Camera,          color: '#dc2626', bg: '#fef2f2' },
    { keywords: ['lamp', 'lighting'],            icon: Lightbulb,       color: '#d97706', bg: '#fffbeb' },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  amenityIcon(name: string): { icon: any; color: string; bg: string } {
    const lower = name.toLowerCase();
    for (const entry of this.iconMap) {
      if (entry.keywords.some(k => lower.includes(k))) return entry;
    }
    return { icon: Tag, color: '#64748b', bg: '#f1f5f9' };
  }

}
