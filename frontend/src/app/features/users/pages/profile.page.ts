import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { ToastService } from '../../../core/services/toast.service';
import { AdminUser } from '../models/user.model';
import { UsersService } from '../services/users.service';
import { extractErrorMessage } from '../../../shared/utils/error.utils';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.css'
})
export class ProfilePage {
  private readonly usersService = inject(UsersService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly user = signal<AdminUser | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly successMsg = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    firstName:   ['', [Validators.required, Validators.minLength(2)]],
    lastName:    ['', [Validators.required, Validators.minLength(2)]],
    phoneNumber: [''],
    department:  [''],
    jobTitle:    [''],
    password:    [''],
  });

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.usersService.me().subscribe({
      next: (u) => {
        this.user.set(u);
        this.form.reset({
          firstName:   u.firstName,
          lastName:    u.lastName,
          phoneNumber: u.phoneNumber ?? '',
          department:  u.department ?? '',
          jobTitle:    u.jobTitle ?? '',
          password:    ''
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const u = this.user();
    if (!u) return;

    this.saving.set(true);
    this.error.set(null);
    this.successMsg.set(null);

    const raw = this.form.getRawValue();
    const payload: Record<string, unknown> = {
      firstName:   raw.firstName.trim(),
      lastName:    raw.lastName.trim(),
      phoneNumber: raw.phoneNumber.trim() || null,
      department:  raw.department.trim() || null,
      jobTitle:    raw.jobTitle.trim() || null,
    };
    if (raw.password.trim()) payload['password'] = raw.password.trim();

    this.usersService.update(u.id, payload).subscribe({
      next: (updated) => {
        this.user.set(updated);
        this.form.patchValue({ password: '' });
        this.saving.set(false);
        this.successMsg.set('Profile updated successfully.');
        this.toast.success('Profile updated.');
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err));
        this.saving.set(false);
      }
    });
  }

  roleName(): string {
    return this.user()?.role?.name ?? '—';
  }

  initials(): string {
    const u = this.user();
    if (!u) return '?';
    return ((u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')).toUpperCase() || u.email[0].toUpperCase();
  }

}
