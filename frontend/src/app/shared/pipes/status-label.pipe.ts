import { Pipe, PipeTransform } from '@angular/core';

const LABELS: Record<string, string> = {
  pending_approval: 'Pending Approval',
  approved:         'Confirmed',
  rejected:         'Rejected',
  cancelled:        'Cancelled',
  completed:        'Completed',
  no_show:          'No Show',
};

@Pipe({ name: 'statusLabel', standalone: true, pure: true })
export class StatusLabelPipe implements PipeTransform {
  transform(value: string): string {
    return LABELS[value] ?? value;
  }
}
