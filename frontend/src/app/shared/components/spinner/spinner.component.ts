import { Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="flex flex-col items-center justify-center py-16 gap-3">
      <mat-spinner [diameter]="diameter" color="primary" />
      @if (label) {
        <p class="text-sm text-slate-500">{{ label }}</p>
      }
    </div>
  `,
})
export class SpinnerComponent {
  @Input() diameter = 40;
  @Input() label = '';
}
