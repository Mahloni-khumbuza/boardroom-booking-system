import { Component } from '@angular/core';

import { PlaceholderComponent } from '../../../shared/components/placeholder/placeholder.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [PlaceholderComponent],
  template: `<app-placeholder
    title="Settings"
    description="System settings such as booking duration, after-hours rules and reminders will be managed here."
  />`
})
export class SettingsPage {}
