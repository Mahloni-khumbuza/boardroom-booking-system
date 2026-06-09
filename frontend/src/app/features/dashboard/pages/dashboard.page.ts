import { Component } from '@angular/core';

import { PlaceholderComponent } from '../../../shared/components/placeholder/placeholder.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [PlaceholderComponent],
  template: `<app-placeholder
    title="Dashboard"
    description="Today's bookings, pending approvals, room utilisation and quick actions will live here."
  />`
})
export class DashboardPage {}
