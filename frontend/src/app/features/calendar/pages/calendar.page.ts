import { Component } from '@angular/core';

import { PlaceholderComponent } from '../../../shared/components/placeholder/placeholder.component';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [PlaceholderComponent],
  template: `<app-placeholder
    title="Calendar"
    description="Day, week and month calendar views will appear here once FullCalendar is integrated."
  />`
})
export class CalendarPage {}
