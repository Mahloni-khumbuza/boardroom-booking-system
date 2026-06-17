import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ConfirmationModalComponent, ConfirmationModalConfig } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../auth/services/auth.service';
import { SystemSetting } from '../models/system-setting.model';
import { SystemSettingsService } from '../services/system-settings.service';
import { extractErrorMessage } from '../../../shared/utils/error.utils';

interface SettingGroup { category: string; items: SystemSetting[] }

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, ConfirmationModalComponent],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.css',
})
export class SettingsPage {
  private readonly service = inject(SystemSettingsService);
  private readonly auth    = inject(AuthService);
  private readonly fb      = inject(FormBuilder);
  private readonly toast   = inject(ToastService);

  readonly loading    = signal(false);
  readonly saving     = signal(false);
  readonly error      = signal<string | null>(null);
  readonly settings   = signal<SystemSetting[]>([]);
  readonly showCreate = signal(false);
  readonly editingId  = signal<string | null>(null);

  readonly confirmOpen   = signal(false);
  readonly confirmConfig = signal<ConfirmationModalConfig>({ title: '', message: '' });
  private pendingConfirmAction: (() => void) | null = null;

  readonly canEdit = computed(() => this.auth.isAdmin());

  readonly groupedSettings = computed<SettingGroup[]>(() => {
    const map = new Map<string, SystemSetting[]>();
    for (const s of this.settings()) {
      const cat = s.key.split('.')[0] ?? 'general';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  });

  readonly createForm = this.fb.nonNullable.group({
    key:         ['', [Validators.required, Validators.pattern(/^[a-z0-9._\-]+$/)]],
    value:       [''],
    description: ['', Validators.maxLength(500)],
  });

  readonly editForm = this.fb.nonNullable.group({
    value:       [''],
    description: ['', Validators.maxLength(500)],
  });

  constructor() { this.load(); }

  toggleCreate(): void { this.showCreate.set(!this.showCreate()); this.createForm.reset(); }

  startEdit(s: SystemSetting): void {
    this.editingId.set(s.id);
    this.editForm.reset({ value: s.value ?? '', description: s.description ?? '' });
  }

  cancelEdit(): void { this.editingId.set(null); }

  submitCreate(): void {
    if (this.createForm.invalid || this.saving()) { this.createForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const { key, value, description } = this.createForm.getRawValue();
    this.service.create({ key, value: value || undefined, description: description || undefined }).subscribe({
      next: () => { this.saving.set(false); this.showCreate.set(false); this.createForm.reset(); this.load(); },
      error: (e) => { this.error.set(extractErrorMessage(e)); this.saving.set(false); },
    });
  }

  submitEdit(s: SystemSetting): void {
    if (this.editForm.invalid || this.saving()) return;
    this.saving.set(true);
    const { value, description } = this.editForm.getRawValue();
    this.service.update(s.id, { value: value || undefined, description: description || undefined }).subscribe({
      next: () => { this.saving.set(false); this.editingId.set(null); this.load(); },
      error: (e) => { this.error.set(extractErrorMessage(e)); this.saving.set(false); },
    });
  }

  remove(s: SystemSetting): void {
    this.confirmConfig.set({
      title: 'Delete Setting',
      message: `Delete setting "${s.key}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    this.pendingConfirmAction = () => {
      this.service.remove(s.id).subscribe({
        next: () => { this.load(); this.toast.success('Setting deleted.'); },
        error: (e) => this.error.set(extractErrorMessage(e)),
      });
    };
    this.confirmOpen.set(true);
  }

  onConfirmed(): void {
    this.confirmOpen.set(false);
    this.pendingConfirmAction?.();
    this.pendingConfirmAction = null;
  }

  onCancelled(): void {
    this.confirmOpen.set(false);
    this.pendingConfirmAction = null;
  }

  private load(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (d) => { this.settings.set(d); this.loading.set(false); },
      error: (e) => { this.error.set(extractErrorMessage(e)); this.loading.set(false); },
    });
  }

}
