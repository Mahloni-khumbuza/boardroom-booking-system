import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state">
      @if (icon) {
        <div class="empty-icon" [innerHTML]="icon"></div>
      }
      <p class="empty-title">{{ title }}</p>
      @if (description) {
        <p class="empty-desc">{{ description }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 3rem 1.5rem; text-align: center;
    }
    .empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; opacity: 0.5; line-height: 1; }
    .empty-title { font-size: 0.95rem; font-weight: 600; color: #475569; margin: 0 0 0.375rem; }
    .empty-desc { font-size: 0.85rem; color: #94a3b8; margin: 0 0 1rem; max-width: 320px; }
  `],
})
export class EmptyStateComponent {
  @Input() title = 'No results found';
  @Input() description = '';
  @Input() icon = '📭';
}
