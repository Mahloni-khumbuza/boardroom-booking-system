import { Component, Input } from '@angular/core';

export type StatusVariant =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed'
  | 'no_show'
  | 'active'
  | 'inactive'
  | 'info'
  | 'warning'
  | 'success'
  | 'danger';

const STATUS_MAP: Record<string, { label: string; variant: StatusVariant }> = {
  pending_approval: { label: 'Pending Approval', variant: 'pending_approval' },
  approved:         { label: 'Confirmed',         variant: 'approved' },
  rejected:         { label: 'Rejected',           variant: 'rejected' },
  cancelled:        { label: 'Cancelled',          variant: 'cancelled' },
  completed:        { label: 'Completed',          variant: 'completed' },
  no_show:          { label: 'No Show',            variant: 'no_show' },
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="badge" [class]="'badge-' + resolvedVariant">{{ resolvedLabel }}</span>`,
  styles: [`
    .badge {
      display: inline-flex; align-items: center;
      padding: 2px 9px; border-radius: 999px;
      font-size: 0.72rem; font-weight: 600; white-space: nowrap;
    }
    .badge-pending_approval { background: #fef9c3; color: #854d0e; }
    .badge-approved   { background: #dcfce7; color: #166534; }
    .badge-rejected   { background: #fee2e2; color: #991b1b; }
    .badge-cancelled  { background: #f1f5f9; color: #64748b; }
    .badge-completed  { background: #e0e7ff; color: #3730a3; }
    .badge-no_show    { background: #fce7f3; color: #9d174d; }
    .badge-active     { background: #dcfce7; color: #166534; }
    .badge-inactive   { background: #f1f5f9; color: #64748b; }
    .badge-info       { background: #e0f2fe; color: #0369a1; }
    .badge-warning    { background: #fef9c3; color: #854d0e; }
    .badge-success    { background: #dcfce7; color: #166534; }
    .badge-danger     { background: #fee2e2; color: #991b1b; }
  `],
})
export class StatusBadgeComponent {
  @Input() status = '';
  @Input() label = '';
  @Input() variant: StatusVariant | '' = '';

  get resolvedLabel(): string {
    if (this.label) return this.label;
    return STATUS_MAP[this.status]?.label ?? this.status;
  }

  get resolvedVariant(): StatusVariant {
    if (this.variant) return this.variant as StatusVariant;
    return STATUS_MAP[this.status]?.variant ?? 'info';
  }
}
