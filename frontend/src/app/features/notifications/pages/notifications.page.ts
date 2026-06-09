import { Component } from '@angular/core';

import { PlaceholderComponent } from '../../../shared/components/placeholder/placeholder.component';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [PlaceholderComponent],
  template: `<app-placeholder
    title="Notifications"
    description="In-app notification centre, unread counts and mark-as-read actions will live here."
  />`
})
export class NotificationsPage {}
