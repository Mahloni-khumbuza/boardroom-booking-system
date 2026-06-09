import { Component } from '@angular/core';

import { PlaceholderComponent } from '../../../shared/components/placeholder/placeholder.component';

@Component({
  selector: 'app-bookings-page',
  standalone: true,
  imports: [PlaceholderComponent],
  template: `<app-placeholder
    title="Bookings"
    description="Create, view, edit and cancel bookings will be handled on this page."
  />`
})
export class BookingsPage {}
