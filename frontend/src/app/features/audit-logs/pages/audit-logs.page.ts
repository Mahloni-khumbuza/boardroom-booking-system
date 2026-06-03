import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuditLog, AuditLogQuery } from '../models/audit-log.model';
import { AuditLogsService } from '../services/audit-logs.service';

@Component({
  selector: 'app-audit-logs-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-logs.page.html',
  styleUrl: './audit-logs.page.css'
})
export class AuditLogsPage {
  private readonly service = inject(AuditLogsService);

  readonly items = signal<AuditLog[]>([]);
  readonly total = signal(0);
  readonly limit = signal(50);
  readonly offset = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly expandedId = signal<string | null>(null);

  readonly filterEntity = signal('');
  readonly filterAction = signal('');
  readonly filterFrom = signal('');
  readonly filterTo = signal('');

  constructor() { this.refresh(); }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    const query: AuditLogQuery = { limit: this.limit(), offset: this.offset() };
    if (this.filterEntity()) query.entity = this.filterEntity();
    if (this.filterFrom()) query.from = new Date(this.filterFrom()).toISOString();
    if (this.filterTo()) query.to = new Date(this.filterTo()).toISOString();

    this.service.list(query).subscribe({
      next: (res) => {
        let items = res.items;
        if (this.filterAction()) {
          const q = this.filterAction().toLowerCase();
          items = items.filter((i) => i.action.toLowerCase().includes(q));
        }
        this.items.set(items);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: (err) => { this.error.set(this.errorMessage(err)); this.loading.set(false); }
    });
  }

  applyFilters(): void { this.offset.set(0); this.refresh(); }

  clearFilters(): void {
    this.filterEntity.set('');
    this.filterAction.set('');
    this.filterFrom.set('');
    this.filterTo.set('');
    this.offset.set(0);
    this.refresh();
  }

  nextPage(): void {
    if (this.offset() + this.limit() >= this.total()) return;
    this.offset.update((v) => v + this.limit());
    this.refresh();
  }

  prevPage(): void {
    if (this.offset() === 0) return;
    this.offset.update((v) => Math.max(0, v - this.limit()));
    this.refresh();
  }

  toggleExpand(id: string): void {
    this.expandedId.update((c) => (c === id ? null : id));
  }

  // action format is "module.verb" e.g. "booking.created", "auth.login"
  moduleOf(action: string): string { return action.split('.')[0] ?? action; }
  verbOf(action: string): string { return action.split('.').slice(1).join('.') || action; }

  // maps verb to a colour category for the pill
  actionTypeOf(action: string): string {
    const verb = this.verbOf(action).toLowerCase();
    if (verb.includes('create') || verb.includes('login') || verb.includes('approve')) return 'create';
    if (verb.includes('update') || verb.includes('reconcil')) return 'update';
    if (verb.includes('delete') || verb.includes('cancel') || verb.includes('remove')) return 'delete';
    if (verb.includes('login') || verb.includes('logout')) return 'auth';
    return 'default';
  }

  actorLabel(log: AuditLog): string {
    if (!log.actor) return 'System';
    const name = `${log.actor.firstName} ${log.actor.lastName}`.trim();
    return name || log.actor.email;
  }

  entityLabel(log: AuditLog): string | null {
    const m = log.metadata as Record<string, unknown> | null;
    if (!m) return null;
    if (log.entity === 'user') return (m['email'] as string) ?? null;
    if (log.entity === 'booking') return (m['reference'] as string) ?? (m['boardroomName'] as string) ?? null;
    if (log.entity === 'boardroom') return (m['name'] as string) ?? null;
    if (log.entity === 'amenity') return (m['name'] as string) ?? null;
    if (log.entity === 'role') return (m['name'] as string) ?? null;
    if (log.entity === 'permission') return (m['name'] as string) ?? null;
    if (log.entity === 'boardroom-block') return (m['boardroomName'] as string) ?? null;
    if (log.entity === 'notification') return (m['title'] as string) ?? null;
    if (log.entity === 'system-setting') return (m['key'] as string) ?? null;
    return null;
  }

  metadataEntries(metadata: Record<string, unknown> | null): { key: string; value: string }[] {
    if (!metadata) return [];
    return Object.entries(metadata).map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')
    }));
  }

  private errorMessage(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || e?.message || 'Something went wrong.';
  }
}
