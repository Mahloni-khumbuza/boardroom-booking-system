import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../auth/services/auth.service';
import { AdminUser, RoleSummary } from '../models/user.model';
import { RolesService } from '../services/roles.service';
import { UsersService } from '../services/users.service';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent],
  templateUrl: './users.page.html',
  styleUrl: './users.page.css'
})
export class UsersPage {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly rolesService = inject(RolesService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);

  readonly users = signal<AdminUser[]>([]);
  readonly roles = signal<RoleSummary[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly editingUser = signal<AdminUser | null>(null);
  readonly saving = signal(false);

  readonly isSuperAdmin = this.auth.isSuperAdmin;
  readonly currentUserId = computed(() => this.auth.currentUser()?.id ?? null);
  readonly isEdit = computed(() => !!this.editingUser());
  readonly inactiveCount = computed(() => this.users().filter(u => !u.isActive).length);

  readonly form = this.fb.nonNullable.group({
    firstName:   ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    lastName:    ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email:       ['', [Validators.required, Validators.email]],
    password:    ['', [Validators.minLength(8)]],
    roleId:      ['', [Validators.required]],
    phoneNumber: [''],
    department:  [''],
    jobTitle:    [''],
    isActive:    [true],
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    this.usersService.list().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
        if (this.roles().length === 0) this.loadRoles();
      },
      error: (err) => { this.error.set(this.errorMessage(err)); this.loading.set(false); }
    });
  }

  private loadRoles(): void {
    this.rolesService.list().subscribe({ next: (r) => this.roles.set(r), error: () => {} });
  }

  // ── Open / close form ─────────────────────────────────────────────────────

  openCreate(): void {
    if (this.roles().length === 0) this.loadRoles();
    this.editingUser.set(null);
    const defaultRole = this.roles().find(r => r.name === 'Employee');
    this.form.reset({
      firstName: '', lastName: '', email: '', password: '',
      roleId: defaultRole?.id ?? '', phoneNumber: '', department: '', jobTitle: '', isActive: true
    });
    this.form.controls.password.addValidators(Validators.required);
    this.form.controls.password.updateValueAndValidity();
    this.error.set(null);
    this.showForm.set(true);
  }

  openEdit(user: AdminUser): void {
    if (this.roles().length === 0) this.loadRoles();
    this.editingUser.set(user);
    this.form.reset({
      firstName:   user.firstName,
      lastName:    user.lastName,
      email:       user.email,
      password:    '',
      roleId:      user.role?.id ?? '',
      phoneNumber: user.phoneNumber ?? '',
      department:  user.department ?? '',
      jobTitle:    user.jobTitle ?? '',
      isActive:    user.isActive,
    });
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
    this.error.set(null);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingUser.set(null);
    this.error.set(null);
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();
    const user = this.editingUser();

    if (user) {
      const payload: Record<string, unknown> = {
        firstName:   raw.firstName.trim(),
        lastName:    raw.lastName.trim(),
        email:       raw.email.trim(),
        roleId:      raw.roleId,
        phoneNumber: raw.phoneNumber.trim() || null,
        department:  raw.department.trim() || null,
        jobTitle:    raw.jobTitle.trim() || null,
        isActive:    raw.isActive,
      };
      if (raw.password.trim()) payload['password'] = raw.password.trim();

      this.usersService.update(user.id, payload).subscribe({
        next: (updated) => {
          this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
          this.saving.set(false);
          this.closeForm();
          this.toast.success('User updated successfully.');
        },
        error: (err) => { this.error.set(this.errorMessage(err)); this.saving.set(false); }
      });
    } else {
      this.usersService.create({
        firstName:   raw.firstName.trim(),
        lastName:    raw.lastName.trim(),
        email:       raw.email.trim(),
        password:    raw.password,
        roleId:      raw.roleId || undefined,
        phoneNumber: raw.phoneNumber.trim() || undefined,
        department:  raw.department.trim() || undefined,
        jobTitle:    raw.jobTitle.trim() || undefined,
        isActive:    true,
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeForm();
          this.refresh();
          this.toast.success('User created successfully.');
        },
        error: (err) => { this.error.set(this.errorMessage(err)); this.saving.set(false); }
      });
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  deleteUser(user: AdminUser): void {
    if (user.id === this.currentUserId()) return;
    this.dialog.confirm({
      title: 'Delete user',
      message: `Permanently delete ${user.firstName} ${user.lastName}? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true
    }).subscribe((confirmed) => {
      if (!confirmed) return;
      this.busyId.set(user.id);
      this.usersService.remove(user.id).subscribe({
        next: () => {
          this.users.update(list => list.filter(u => u.id !== user.id));
          this.busyId.set(null);
          this.toast.success(`${user.firstName} ${user.lastName} deleted.`);
        },
        error: (err) => { this.error.set(this.errorMessage(err)); this.busyId.set(null); }
      });
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  fullName(user: AdminUser): string {
    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  }

  initials(user: AdminUser): string {
    return ((user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')).toUpperCase()
      || user.email[0].toUpperCase();
  }

  roleClass(name: string | undefined): string {
    const map: Record<string, string> = {
      SuperAdmin: 'super', Admin: 'admin',
      FacilitiesManager: 'facilities', Employee: 'employee'
    };
    return map[name ?? ''] ?? 'none';
  }

  roleCount(name: string): number {
    return this.users().filter(u => u.role?.name === name).length;
  }

  private errorMessage(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || e?.message || 'Something went wrong.';
  }
}
