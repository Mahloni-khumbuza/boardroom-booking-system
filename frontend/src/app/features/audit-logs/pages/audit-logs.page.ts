import { CommonModule, DatePipe, SlicePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ToastService } from '../../../core/services/toast.service';
import { AuditLog, AuditLogQuery } from '../models/audit-log.model';
import { AuditLogsService } from '../services/audit-logs.service';
import { extractErrorMessage } from '../../../shared/utils/error.utils';

@Component({
  selector: 'app-audit-logs-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, SlicePipe],
  templateUrl: './audit-logs.page.html',
  styleUrl: './audit-logs.page.css',
})
export class AuditLogsPage {
  private readonly service = inject(AuditLogsService);
  private readonly toast   = inject(ToastService);

  readonly loading    = signal(false);
  readonly error      = signal<string | null>(null);
  readonly items      = signal<AuditLog[]>([]);
  readonly total      = signal(0);
  readonly limit      = signal(50);
  readonly offset     = signal(0);
  readonly expandedId = signal<string | null>(null);

  readonly filterEntity = signal('');
  readonly filterAction = signal('');
  readonly filterActorId = signal('');
  readonly filterFrom   = signal('');
  readonly filterTo     = signal('');

  constructor() { this.load(); }

  refresh(): void { this.offset.set(0); this.load(); }
  applyFilters(): void { this.offset.set(0); this.load(); }

  clearFilters(): void {
    this.filterEntity.set(''); this.filterAction.set('');
    this.filterActorId.set('');
    this.filterFrom.set(''); this.filterTo.set('');
    this.offset.set(0); this.load();
  }

  prevPage(): void { this.offset.set(Math.max(0, this.offset() - this.limit())); this.load(); }
  nextPage(): void { this.offset.set(this.offset() + this.limit()); this.load(); }

  toggleExpand(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  actorLabel(log: AuditLog): string {
    if (!log.actor) return 'System';
    return `${log.actor.firstName} ${log.actor.lastName}`.trim() || log.actor.email;
  }

  moduleOf(action: string): string { return action.split('.')[0] ?? action; }
  verbOf(action: string): string { return action.split('.').slice(1).join('.') || action; }

  actionTypeOf(action: string): string {
    const v = this.verbOf(action).toLowerCase();
    if (v.includes('creat') || v.includes('add')) return 'create';
    if (v.includes('updat') || v.includes('edit') || v.includes('activ')) return 'update';
    if (v.includes('delet') || v.includes('remov')) return 'delete';
    if (v.includes('login') || v.includes('logout')) return 'auth';
    return 'other';
  }

  entityLabel(log: AuditLog): string | null {
    const meta = log.metadata as Record<string, unknown> | null;
    if (!meta) return null;
    const after = meta['after'] as Record<string, unknown> | null;
    const before = meta['before'] as Record<string, unknown> | null;
    return (after?.['name'] ?? before?.['name'] ?? after?.['key'] ?? before?.['key'] ?? null) as string | null;
  }

  metadataEntries(meta: Record<string, unknown>): { key: string; value: string }[] {
    return Object.entries(meta)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => ({ key: k, value: typeof v === 'object' ? JSON.stringify(v) : String(v) }));
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    const q: AuditLogQuery & { action?: string } = {
      limit: this.limit(), offset: this.offset(),
    };
    if (this.filterEntity()) q.entity = this.filterEntity();
    if (this.filterAction()) q.action = this.filterAction();
    if (this.filterActorId()) q.actorId = this.filterActorId();
    if (this.filterFrom()) q.from = this.filterFrom();
    if (this.filterTo()) q.to = this.filterTo();

    this.service.list(q).subscribe({
      next: (res) => { this.items.set(res.items); this.total.set(res.total); this.loading.set(false); },
      error: (e) => { const m = extractErrorMessage(e); this.error.set(m); this.toast.error(m); this.loading.set(false); },
    });
  }

}
