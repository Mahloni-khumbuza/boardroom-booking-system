import { Component } from '@angular/core';

import { PlaceholderComponent } from '../../../shared/components/placeholder/placeholder.component';

@Component({
  selector: 'app-boardrooms-page',
  standalone: true,
  imports: [PlaceholderComponent],
  template: `<app-placeholder
    title="Boardrooms"
    description="Browse, search and manage boardrooms here once the boardroom module is built."
  />`
})
export class BoardroomsPage {}
