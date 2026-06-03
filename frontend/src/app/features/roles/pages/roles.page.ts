import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { Permission } from '../../permissions/models/permission.model';
import { PermissionsService } from '../../permissions/services/permissions.service';
import { Role } from '../models/role.model';
import { RolesFullService } from '../services/roles-full.service';

@Component({
  selector: 'app-roles-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles.page.html',
  styleUrl: './roles.page.css'
})
export class RolesPage {
  private readonly fb = inject(FormBuilder);
  private readonly rolesService = inject(RolesFullService);
  private readonly permissionsService = inject(PermissionsService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);

  readonly roles = signal<Role[]>([]);
  readonly allPermissions = signal<Permission[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly busyId = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly selectedPermissionIds = signal<Set<string>>(new Set());

  readonly PROTECTED_ROLES = new Set(['SuperAdmin', 'Admin', 'Employee']);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    description: ['', Validators.maxLength(500)]
  });

  readonly isEditing = computed(() => this.editingId() !== null);

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      roles: this.rolesService.list(),
      permissions: this.permissionsService.list()
    }).subscribe({
      next: ({ roles, permissions }) => {
        this.roles.set(roles);
        this.allPermissions.set(permissions);
        this.loading.set(false);
      },
      error: (err) => { this.error.set(this.errorMessage(err)); this.loading.set(false); }
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', description: '' });
    this.form.controls.name.enable();
    this.selectedPermissionIds.set(new Set());
    this.showForm.set(true);
  }

  openEdit(role: Role): void {
    this.editingId.set(role.id);
    this.form.reset({ name: role.name, description: role.description ?? '' });
    this.form.controls.name.enable();
    this.selectedPermissionIds.set(new Set(role.permissions.map((p) => p.id)));
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  togglePermission(id: string): void {
    const set = new Set(this.selectedPermissionIds());
    set.has(id) ? set.delete(id) : set.add(id);
    this.selectedPermissionIds.set(set);
  }

  isPermissionSelected(id: string): boolean {
    return this.selectedPermissionIds().has(id);
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
    const permissionIds = Array.from(this.selectedPermissionIds());

    const req$ = id
      ? this.rolesService.update(id, {
          name: raw.name.trim(),
          description: raw.description?.trim() || undefined,
          permissionIds
        })
      : this.rolesService.create({
          name: raw.name.trim(),
          description: raw.description?.trim() || undefined,
          permissionIds
        });

    req$.subscribe({
      next: () => { this.saving.set(false); this.toast.success(id ? 'Role updated.' : 'Role created.'); this.closeForm(); this.refresh(); },
      error: (err) => { this.error.set(this.errorMessage(err)); this.saving.set(false); }
    });
  }

  remove(role: Role): void {
    this.dialog.confirm({ title: 'Delete Role', message: `Delete role "${role.name}"? Users with this role will be unassigned.`, confirmLabel: 'Delete', danger: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.busyId.set(role.id);
        this.rolesService.remove(role.id).subscribe({
          next: () => { this.roles.update((list) => list.filter((r) => r.id !== role.id)); this.busyId.set(null); this.toast.success('Role deleted.'); },
          error: (err) => { this.error.set(this.errorMessage(err)); this.busyId.set(null); }
        });
      });
  }

  canDelete(role: Role): boolean {
    return !this.PROTECTED_ROLES.has(role.name);
  }

  private errorMessage(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || e?.message || 'Something went wrong.';
  }
}
