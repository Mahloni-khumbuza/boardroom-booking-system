import { Component } from '@angular/core';

import { PlaceholderComponent } from '../../../shared/components/placeholder/placeholder.component';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [PlaceholderComponent],
  template: `<app-placeholder
    title="Users"
    description="User listing, role assignment and account status controls will live on this page."
  />`
})
export class UsersPage {}
