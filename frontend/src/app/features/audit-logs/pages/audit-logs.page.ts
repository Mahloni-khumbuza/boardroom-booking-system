import { Component } from '@angular/core';

import { PlaceholderComponent } from '../../../shared/components/placeholder/placeholder.component';

@Component({
  selector: 'app-audit-logs-page',
  standalone: true,
  imports: [PlaceholderComponent],
  template: `<app-placeholder
    title="Audit Logs"
    description="Searchable, filterable audit log entries will be displayed here."
  />`
})
export class AuditLogsPage {}
