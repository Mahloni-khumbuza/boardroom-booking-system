import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { ConfirmationModalComponent, ConfirmationModalConfig } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../auth/services/auth.service';
import { AdminUser, RoleSummary } from '../models/user.model';
import { RolesService } from '../services/roles.service';
import { UsersService } from '../services/users.service';
import { extractErrorMessage } from '../../../shared/utils/error.utils';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, SpinnerComponent, ConfirmationModalComponent],
  templateUrl: './users.page.html',
  styleUrl: './users.page.css',
})
export class UsersPage {
  private readonly usersService = inject(UsersService);
  private readonly rolesService = inject(RolesService);
  private readonly auth         = inject(AuthService);
  private readonly fb           = inject(FormBuilder);
  private readonly toast        = inject(ToastService);

  readonly loading  = signal(false);
  readonly saving   = signal(false);
  readonly error    = signal<string | null>(null);
  readonly users    = signal<AdminUser[]>([]);
  readonly roles    = signal<RoleSummary[]>([]);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly busyId   = signal<string | null>(null);

  readonly confirmOpen   = signal(false);
  readonly confirmConfig = signal<ConfirmationModalConfig>({ title: '', message: '' });
  private pendingConfirmAction: (() => void) | null = null;

  readonly isSuperAdmin  = computed(() => this.auth.isSuperAdmin());
  readonly isAdminRole   = computed(() => this.auth.isAdmin());
  readonly currentUserId = computed(() => this.auth.user()?.id ?? null);
  readonly isEdit        = computed(() => !!this.editingId());
  readonly viewingUser   = signal<AdminUser | null>(null);

  // Admins can edit (limited), SuperAdmins can create/delete
  readonly canEdit   = computed(() => this.auth.isAdmin());
  readonly canCreate = computed(() => this.auth.isSuperAdmin());
  readonly canDelete = computed(() => this.auth.isSuperAdmin());

  readonly roleCapabilities = computed(() => {
    if (this.auth.isSuperAdmin()) {
      return [
        { label: 'View all users', granted: true },
        { label: 'Create users', granted: true },
        { label: 'Edit any user (incl. role)', granted: true },
        { label: 'Deactivate / reactivate', granted: true },
        { label: 'Delete users', granted: true },
      ];
    }
    if (this.auth.isAdmin()) {
      return [
        { label: 'View all users', granted: true },
        { label: 'Edit user details', granted: true },
        { label: 'Create users', granted: false },
        { label: 'Delete users', granted: false },
        { label: 'Change roles', granted: false },
      ];
    }
    return [];
  });

  readonly inactiveCount = computed(() => this.users().filter((u) => !u.isActive).length);

  readonly form = this.fb.nonNullable.group({
    firstName:   ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    lastName:    ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email:       ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    department:  [''],
    jobTitle:    [''],
    roleId:      ['', Validators.required],
    password:    ['', [Validators.minLength(8)]],
    isActive:    [true],
  });

  constructor() { this.load(); this.rolesService.list().subscribe({ next: (r) => this.roles.set(r), error: () => {} }); }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ isActive: true });
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
    this.form.controls.password.updateValueAndValidity();
    this.showForm.set(true);
  }

  openEdit(u: AdminUser): void {
    this.editingId.set(u.id);
    this.form.reset({
      firstName: u.firstName, lastName: u.lastName, email: u.email,
      phoneNumber: u.phoneNumber ?? '', department: u.department ?? '',
      jobTitle: u.jobTitle ?? '', roleId: u.role?.id ?? '',
      password: '', isActive: u.isActive,
    });
    this.form.controls.password.setValidators([Validators.minLength(8)]);
    this.form.controls.password.updateValueAndValidity();
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); this.editingId.set(null); this.error.set(null); }

  submit(): void {
    if (this.form.invalid || this.saving()) { this.form.markAllAsTouched(); return; }
    this.saving.set(true); this.error.set(null);
    const raw = this.form.getRawValue();
    const id = this.editingId();

    const payload: Record<string, unknown> = {
      firstName: raw.firstName, lastName: raw.lastName, email: raw.email,
      phoneNumber: raw.phoneNumber || undefined, department: raw.department || undefined,
      jobTitle: raw.jobTitle || undefined, roleId: raw.roleId || undefined,
    };
    if (raw.password) payload['password'] = raw.password;
    if (id) payload['isActive'] = raw.isActive;

    const req = id
      ? this.usersService.update(id, payload as never)
      : this.usersService.create(payload as never);

    req.subscribe({
      next: () => {
        this.saving.set(false); this.closeForm(); this.load();
        this.toast.success(id ? 'User updated.' : 'User created.');
      },
      error: (e) => { this.error.set(extractErrorMessage(e)); this.saving.set(false); },
    });
  }

  deleteUser(u: AdminUser): void {
    this.confirmConfig.set({
      title: 'Delete User',
      message: `Delete "${u.firstName} ${u.lastName}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    this.pendingConfirmAction = () => {
      this.busyId.set(u.id);
      this.usersService.remove(u.id).subscribe({
        next: () => { this.busyId.set(null); this.load(); this.toast.success('User deleted.'); },
        error: (e) => { this.toast.error(extractErrorMessage(e)); this.busyId.set(null); },
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

  roleCount(roleName: string): number {
    return this.users().filter((u) => u.role?.name === roleName).length;
  }

  initials(u: AdminUser): string {
    return `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase();
  }

  fullName(u: AdminUser): string { return `${u.firstName} ${u.lastName}`.trim(); }

  roleClass(name: string | undefined): string {
    if (!name) return 'none';
    return name.toLowerCase().replace(/\s+/g, '-');
  }

  private load(): void {
    this.loading.set(true);
    this.usersService.list().subscribe({
      next: (u) => { this.users.set(u); this.loading.set(false); },
      error: (e) => { this.error.set(extractErrorMessage(e)); this.loading.set(false); },
    });
  }

}
