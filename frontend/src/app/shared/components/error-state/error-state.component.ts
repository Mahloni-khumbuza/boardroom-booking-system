import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  standalone: true,
  template: `
    <div class="error-state">
      <div class="error-icon">⚠️</div>
      <p class="error-title">{{ title }}</p>
      @if (message) {
        <p class="error-message">{{ message }}</p>
      }
      @if (retryLabel) {
        <button type="button" class="retry-btn" (click)="retry.emit()">{{ retryLabel }}</button>
      }
    </div>
  `,
  styles: [`
    .error-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 2.5rem 1.5rem; text-align: center;
    }
    .error-icon { font-size: 2rem; margin-bottom: 0.75rem; }
    .error-title { font-size: 0.95rem; font-weight: 600; color: #b91c1c; margin: 0 0 0.375rem; }
    .error-message { font-size: 0.85rem; color: #64748b; margin: 0 0 1rem; max-width: 360px; }
    .retry-btn {
      padding: 7px 16px; border-radius: 8px; border: 1px solid #fca5a5;
      background: #fff5f5; color: #ef4444; font-size: 0.85rem; cursor: pointer;
    }
    .retry-btn:hover { background: #fee2e2; }
  `],
})
export class ErrorStateComponent {
  @Input() title = 'Something went wrong';
  @Input() message = '';
  @Input() retryLabel = 'Try again';
  @Output() retry = new EventEmitter<void>();
}
