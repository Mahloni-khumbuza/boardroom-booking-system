import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { AuthService } from '../../auth/services/auth.service';
import { UsersService } from '../../users/services/users.service';
import { AdminUser } from '../../users/models/user.model';
import { AppNotification, NotificationType, NOTIFICATION_TYPE_LABELS } from '../models/notification.model';
import { NotificationsService } from '../services/notifications.service';
import { extractErrorMessage } from '../../../shared/utils/error.utils';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, SpinnerComponent],
  templateUrl: './notifications.page.html',
  styleUrl: './notifications.page.css',
})
export class NotificationsPage {
  private readonly service = inject(NotificationsService);
  private readonly usersService = inject(UsersService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly loading       = signal(false);
  readonly sending       = signal(false);
  readonly error         = signal<string | null>(null);
  readonly notifications = signal<AppNotification[]>([]);
  readonly recipients    = signal<AdminUser[]>([]);
  readonly showSend      = signal(false);

  readonly unreadCount = computed(() => this.notifications().filter((n) => !n.isRead).length);
  readonly canSend     = computed(() => this.auth.isAdmin());

  // All §12 notification types available for manual send (Admin only)
  readonly typeOptions: { value: NotificationType; label: string }[] = Object.entries(NOTIFICATION_TYPE_LABELS)
    .map(([value, label]) => ({ value: value as NotificationType, label }));

  typeLabel(type: NotificationType): string {
    return NOTIFICATION_TYPE_LABELS[type] ?? type.replace(/_/g, ' ');
  }

  readonly sendForm = this.fb.nonNullable.group({
    recipientId: ['', Validators.required],
    type:        ['info' as NotificationType],
    title:       ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    message:     ['', [Validators.required, Validators.maxLength(2000)]],
  });

  constructor() {
    this.load();
    if (this.canSend()) {
      this.usersService.list().subscribe({ next: (u) => this.recipients.set(u), error: () => {} });
    }
  }

  toggleSend(): void { this.showSend.set(!this.showSend()); }

  markRead(note: AppNotification): void {
    if (note.isRead) return;
    this.service.markRead(note.id).subscribe({
      next: () => this.notifications.update((ns) => ns.map((n) => n.id === note.id ? { ...n, isRead: true } : n)),
      error: () => {},
    });
  }

  markAllRead(): void {
    this.service.markAllRead().subscribe({
      next: () => this.notifications.update((ns) => ns.map((n) => ({ ...n, isRead: true }))),
      error: () => {},
    });
  }

  remove(note: AppNotification): void {
    this.service.remove(note.id).subscribe({
      next: () => this.notifications.update((ns) => ns.filter((n) => n.id !== note.id)),
      error: () => {},
    });
  }

  submitSend(): void {
    if (this.sendForm.invalid || this.sending()) { this.sendForm.markAllAsTouched(); return; }
    this.sending.set(true);
    const raw = this.sendForm.getRawValue();
    this.service.create({ recipientId: raw.recipientId, type: raw.type, title: raw.title, message: raw.message }).subscribe({
      next: () => { this.sending.set(false); this.sendForm.reset({ type: 'info' }); this.showSend.set(false); this.load(); },
      error: (e) => { this.error.set(extractErrorMessage(e)); this.sending.set(false); },
    });
  }

  fullName(u: AdminUser): string { return `${u.firstName} ${u.lastName}`.trim(); }

  private load(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (ns) => { this.notifications.set(ns); this.loading.set(false); },
      error: (e) => { this.error.set(extractErrorMessage(e)); this.loading.set(false); },
    });
  }

}
