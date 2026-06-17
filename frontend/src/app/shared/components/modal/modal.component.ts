import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <div
          class="modal-panel"
          [class.modal-sm]="size === 'sm'"
          [class.modal-md]="size === 'md'"
          [class.modal-lg]="size === 'lg'"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="title"
        >
          @if (title || showClose) {
            <div class="modal-header">
              @if (title) { <h2 class="modal-title">{{ title }}</h2> }
              @if (showClose) {
                <button type="button" class="modal-close" (click)="closed.emit()" aria-label="Close">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </button>
              }
            </div>
          }
          <div class="modal-body">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0; z-index: 50;
      background: rgba(15,23,42,0.5);
      display: flex; align-items: center; justify-content: center;
      padding: 1rem;
    }
    .modal-panel {
      background: #fff; border-radius: 12px;
      box-shadow: 0 20px 60px rgba(15,23,42,0.18);
      width: 100%; max-height: 90vh; overflow-y: auto;
    }
    .modal-sm { max-width: 400px; }
    .modal-md { max-width: 560px; }
    .modal-lg { max-width: 720px; }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.25rem 1.5rem 0;
    }
    .modal-title { font-size: 1.125rem; font-weight: 600; color: #0f172a; margin: 0; }
    .modal-close {
      background: none; border: none; cursor: pointer;
      color: #64748b; padding: 4px; border-radius: 6px; line-height: 0;
    }
    .modal-close:hover { background: #f1f5f9; color: #0f172a; }
    .modal-body { padding: 1.25rem 1.5rem 1.5rem; }
  `],
})
export class ModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() showClose = true;
  @Input() closeOnBackdrop = true;
  @Output() closed = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop && event.target === event.currentTarget) {
      this.closed.emit();
    }
  }
}
