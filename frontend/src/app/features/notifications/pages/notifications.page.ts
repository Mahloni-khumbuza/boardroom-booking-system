import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../auth/services/auth.service';
import { AdminUser } from '../../users/models/user.model';
import { UsersService } from '../../users/services/users.service';
import { AppNotification, NotificationType } from '../models/notification.model';
import { NotificationsService } from '../services/notifications.service';

const TYPE_OPTIONS: { value: NotificationType; label: string }[] = [
  { value: 'info', label: 'Info' },
  { value: 'system', label: 'System' },
  { value: 'booking_created', label: 'Booking created' },
  { value: 'booking_cancelled', label: 'Booking cancelled' },
  { value: 'booking_reminder', label: 'Booking reminder' },
  { value: 'setup', label: 'Room setup' },
  { value: 'catering', label: 'Catering' },
  { value: 'maintenance', label: 'Maintenance' }
];

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent],
  templateUrl: './notifications.page.html',
  styleUrl: './notifications.page.css'
})
export class NotificationsPage {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(NotificationsService);
  private readonly usersService = inject(UsersService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);

  readonly notifications = signal<AppNotification[]>([]);
  readonly recipients = signal<AdminUser[]>([]);
  readonly loading = signal(false);
  readonly sending = signal(false);
  readonly error = signal<string | null>(null);
  readonly showSend = signal(false);

  readonly canSend = this.auth.isSuperAdmin;
  readonly typeOptions = TYPE_OPTIONS;

  readonly sendForm = this.fb.nonNullable.group({
    recipientId: ['', [Validators.required]],
    type: ['info' as NotificationType, [Validators.required]],
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    message: ['', [Validators.required, Validators.maxLength(2000)]]
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);

    if (this.canSend()) {
      forkJoin({
        notes: this.service.list(),
        users: this.usersService.list()
      }).subscribe({
        next: ({ notes, users }) => {
          this.notifications.set(notes);
          this.recipients.set(users);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(this.errorMessage(err));
          this.loading.set(false);
        }
      });
    } else {
      this.service.list().subscribe({
        next: (notes) => {
          this.notifications.set(notes);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(this.errorMessage(err));
          this.loading.set(false);
        }
      });
    }
  }

  unreadCount(): number {
    return this.notifications().filter((n) => !n.isRead).length;
  }

  toggleSend(): void {
    if (this.showSend()) {
      this.showSend.set(false);
    } else {
      this.sendForm.reset({ recipientId: '', type: 'info', title: '', message: '' });
      this.showSend.set(true);
    }
  }

  submitSend(): void {
    if (this.sendForm.invalid || this.sending()) {
      this.sendForm.markAllAsTouched();
      return;
    }
    this.sending.set(true);
    this.error.set(null);
    const raw = this.sendForm.getRawValue();
    this.service
      .create({
        recipientId: raw.recipientId,
        type: raw.type,
        title: raw.title.trim(),
        message: raw.message.trim()
      })
      .subscribe({
        next: () => {
          this.sending.set(false);
          this.showSend.set(false);
          this.refresh();
        },
        error: (err) => {
          this.error.set(this.errorMessage(err));
          this.sending.set(false);
        }
      });
  }

  markRead(note: AppNotification): void {
    if (note.isRead) return;
    this.service.markRead(note.id).subscribe({
      next: (updated) => {
        this.notifications.update((list) =>
          list.map((n) => (n.id === updated.id ? updated : n))
        );
      },
      error: (err) => this.error.set(this.errorMessage(err))
    });
  }

  markAllRead(): void {
    this.service.markAllRead().subscribe({
      next: () => this.refresh(),
      error: (err) => this.error.set(this.errorMessage(err))
    });
  }

  remove(note: AppNotification): void {
    this.dialog.confirm({ title: 'Delete Notification', message: 'Delete this notification?', confirmLabel: 'Delete', danger: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.service.remove(note.id).subscribe({
          next: () => { this.notifications.update((list) => list.filter((n) => n.id !== note.id)); this.toast.success('Notification deleted.'); },
          error: (err) => this.error.set(this.errorMessage(err))
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
