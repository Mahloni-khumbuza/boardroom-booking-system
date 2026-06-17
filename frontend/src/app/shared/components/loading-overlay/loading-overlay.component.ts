import { Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    @if (loading) {
      <div class="loading-overlay">
        <mat-spinner diameter="36" color="primary" />
        @if (label) { <p class="loading-label">{{ label }}</p> }
      </div>
    } @else {
      <ng-content />
    }
  `,
  styles: [`
    .loading-overlay {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 3rem 1.5rem; gap: 0.75rem;
    }
    .loading-label { font-size: 0.85rem; color: #64748b; margin: 0; }
  `],
})
export class LoadingOverlayComponent {
  @Input() loading = false;
  @Input() label = '';
}
