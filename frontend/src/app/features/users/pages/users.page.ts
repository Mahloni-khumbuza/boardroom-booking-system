import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

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
  readonly showCreate = signal(false);
  readonly creating = signal(false);

  readonly isSuperAdmin = this.auth.isSuperAdmin;
  readonly currentUserId = computed(() => this.auth.currentUser()?.id ?? null);
  readonly superAdminRoleId = computed(
    () => this.roles().find((r) => r.name === 'SuperAdmin')?.id ?? null
  );

  readonly createForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    roleId: ['', [Validators.required]]
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      users: this.usersService.list(),
      roles: this.rolesService.list()
    }).subscribe({
      next: ({ users, roles }) => {
        this.users.set(users);
        this.roles.set(roles);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  toggleCreate(): void {
    if (this.showCreate()) {
      this.showCreate.set(false);
      this.createForm.reset({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        roleId: ''
      });
    } else {
      const defaultRole = this.roles().find((r) => r.name === 'Employee');
      this.createForm.reset({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        roleId: defaultRole?.id ?? ''
      });
      this.showCreate.set(true);
    }
  }

  submitCreate(): void {
    if (this.createForm.invalid || this.creating()) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.creating.set(true);
    this.error.set(null);

    const raw = this.createForm.getRawValue();
    this.usersService
      .create({
        firstName: raw.firstName.trim(),
        lastName: raw.lastName.trim(),
        email: raw.email.trim(),
        password: raw.password,
        roleId: raw.roleId
      })
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.toggleCreate();
          this.refresh();
          this.toast.success('User created successfully.');
        },
        error: (err) => {
          this.error.set(this.errorMessage(err));
          this.creating.set(false);
        }
      });
  }

  canPromote(user: AdminUser): boolean {
    if (!this.isSuperAdmin()) return false;
    if (user.role?.name === 'SuperAdmin') return false;
    return this.superAdminRoleId() !== null;
  }

  promoteToSuperAdmin(user: AdminUser): void {
    const roleId = this.superAdminRoleId();
    if (!roleId) return;
    this.dialog.confirm({
      title: 'Promote to SuperAdmin',
      message: `Promote ${user.firstName} ${user.lastName} to SuperAdmin? They will gain full system access.`,
      confirmLabel: 'Promote',
      danger: true,
    }).subscribe((confirmed) => {
      if (!confirmed) return;
      this.busyId.set(user.id);
      this.error.set(null);
      this.usersService.update(user.id, { roleId }).subscribe({
        next: (updated) => {
          this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
          this.busyId.set(null);
          this.toast.success(`${user.firstName} ${user.lastName} promoted to SuperAdmin.`);
        },
        error: (err) => {
          this.error.set(this.errorMessage(err));
          this.busyId.set(null);
        }
      });
    });
  }

  fullName(user: AdminUser): string {
    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  }

  private errorMessage(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || e?.message || 'Something went wrong.';
  }
}
