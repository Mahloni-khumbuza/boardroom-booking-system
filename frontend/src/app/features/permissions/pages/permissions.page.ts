import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { Permission } from '../models/permission.model';
import { PermissionsService } from '../services/permissions.service';
import { extractErrorMessage } from '../../../shared/utils/error.utils';

@Component({
  selector: 'app-permissions-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent],
  templateUrl: './permissions.page.html',
  styleUrl: './permissions.page.css'
})
export class PermissionsPage {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PermissionsService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);

  readonly permissions = signal<Permission[]>([]);
  readonly sortedPermissions = computed(() =>
    [...this.permissions()].sort((a, b) => a.name.localeCompare(b.name))
  );

  readonly groupedPermissions = computed(() => {
    const sorted = this.sortedPermissions();
    const map = new Map<string, Permission[]>();
    for (const p of sorted) {
      const resource = p.name.split(':')[0] ?? p.name;
      if (!map.has(resource)) map.set(resource, []);
      map.get(resource)!.push(p);
    }
    return Array.from(map.entries()).map(([resource, items]) => ({ resource, items }));
  });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly busyId = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100),
      Validators.pattern(/^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/)]],
    description: ['', Validators.maxLength(500)]
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.list().subscribe({
      next: (list) => { this.permissions.set(list); this.loading.set(false); },
      error: (err) => { this.error.set(extractErrorMessage(err)); this.loading.set(false); }
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', description: '' });
    this.form.controls.name.enable();
    this.showForm.set(true);
  }

  openEdit(p: Permission): void {
    this.editingId.set(p.id);
    this.form.reset({ name: p.name, description: p.description ?? '' });
    this.form.controls.name.disable();
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.controls.name.enable();
  }

  submitForm(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();
    const id = this.editingId();

    const req$ = id
      ? this.service.update(id, { description: raw.description?.trim() || undefined })
      : this.service.create({ name: raw.name.trim(), description: raw.description?.trim() || undefined });

    req$.subscribe({
      next: () => { this.saving.set(false); this.toast.success(id ? 'Permission updated.' : 'Permission created.'); this.closeForm(); this.refresh(); },
      error: (err) => { this.error.set(extractErrorMessage(err)); this.saving.set(false); }
    });
  }

  remove(p: Permission): void {
    this.dialog.confirm({ title: 'Delete Permission', message: `Delete permission "${p.name}"? This may affect roles that use it.`, confirmLabel: 'Delete', danger: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.busyId.set(p.id);
        this.service.remove(p.id).subscribe({
          next: () => { this.permissions.update((list) => list.filter((x) => x.id !== p.id)); this.busyId.set(null); this.toast.success('Permission deleted.'); },
          error: (err) => { this.error.set(extractErrorMessage(err)); this.busyId.set(null); }
        });
      });
  }

  resourceOf(name: string): string { return name.split(':')[0] ?? name; }
  actionOf(name: string): string { return name.split(':')[1] ?? ''; }

}
