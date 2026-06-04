import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../auth/services/auth.service';
import { AdminUser, RoleSummary } from '../models/user.model';
import { RolesService } from '../services/roles.service';
import { UsersService } from '../services/users.service';

@Component({
  selector: 'app-user-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent],
  templateUrl: './user-form.page.html',
  styleUrl: './user-form.page.css'
})
export class UserFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly rolesService = inject(RolesService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly roles = signal<RoleSummary[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editingUser = signal<AdminUser | null>(null);

  readonly isEdit = computed(() => !!this.editingUser());
  readonly backPath = computed(() => {
    const url = this.router.url;
    if (url.startsWith('/superadmin')) return '/superadmin/users';
    if (url.startsWith('/admin')) return '/admin/users';
    return '/superadmin/users';
  });

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

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    this.loading.set(true);

    if (userId) {
      forkJoin({
        user: this.usersService.me(), // placeholder — we'll fetch by id via list
        roles: this.rolesService.list()
      });
      // Fetch user + roles in parallel
      forkJoin({
        users: this.usersService.list(),
        roles: this.rolesService.list()
      }).subscribe({
        next: ({ users, roles }) => {
          this.roles.set(roles);
          const user = users.find(u => u.id === userId) ?? null;
          this.editingUser.set(user);
          if (user) {
            this.form.patchValue({
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
            // password not required on edit
            this.form.controls.password.clearValidators();
            this.form.controls.password.updateValueAndValidity();
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(this.errorMessage(err));
          this.loading.set(false);
        }
      });
    } else {
      this.rolesService.list().subscribe({
        next: (roles) => {
          this.roles.set(roles);
          const defaultRole = roles.find(r => r.name === 'Employee');
          if (defaultRole) this.form.controls.roleId.setValue(defaultRole.id);
          // password required on create
          this.form.controls.password.addValidators(Validators.required);
          this.form.controls.password.updateValueAndValidity();
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(this.errorMessage(err));
          this.loading.set(false);
        }
      });
    }
  }

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
      // Edit
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
        next: () => {
          this.saving.set(false);
          this.toast.success('User updated successfully.');
          void this.router.navigateByUrl(this.backPath());
        },
        error: (err) => {
          this.error.set(this.errorMessage(err));
          this.saving.set(false);
        }
      });
    } else {
      // Create
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
          this.toast.success('User created successfully.');
          void this.router.navigateByUrl(this.backPath());
        },
        error: (err) => {
          this.error.set(this.errorMessage(err));
          this.saving.set(false);
        }
      });
    }
  }

  cancel(): void {
    void this.router.navigateByUrl(this.backPath());
  }

  private errorMessage(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || e?.message || 'Something went wrong.';
  }
}
