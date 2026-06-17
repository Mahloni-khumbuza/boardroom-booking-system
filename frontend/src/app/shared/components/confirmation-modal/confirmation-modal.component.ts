import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';

export interface ConfirmationModalConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** When set, renders a required text input and passes the value to confirmed */
  reasonLabel?: string;
  reasonPlaceholder?: string;
}

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [ModalComponent, FormsModule],
  template: `
    <app-modal [open]="open" [title]="config.title" size="sm" (closed)="cancel()">
      <p class="confirm-message">{{ config.message }}</p>

      @if (config.reasonLabel) {
        <div class="confirm-reason">
          <label class="reason-label">{{ config.reasonLabel }}</label>
          <textarea
            class="reason-input"
            rows="3"
            [placeholder]="config.reasonPlaceholder ?? ''"
            [(ngModel)]="reason"
          ></textarea>
          @if (showReasonError()) {
            <p class="reason-error">This field is required.</p>
          }
        </div>
      }

      <div class="confirm-actions">
        <button type="button" class="btn-cancel" (click)="cancel()">
          {{ config.cancelLabel ?? 'Cancel' }}
        </button>
        <button
          type="button"
          class="btn-confirm"
          [class.btn-danger]="config.danger"
          (click)="confirm()"
        >
          {{ config.confirmLabel ?? 'Confirm' }}
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .confirm-message { color: #475569; font-size: 0.9rem; margin: 0 0 1rem; line-height: 1.6; }
    .confirm-reason { margin-bottom: 1rem; }
    .reason-label { display: block; font-size: 0.8rem; font-weight: 600; color: #334155; margin-bottom: 6px; }
    .reason-input {
      width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px;
      font-size: 0.875rem; resize: vertical; box-sizing: border-box;
    }
    .reason-input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
    .reason-error { color: #ef4444; font-size: 0.75rem; margin: 4px 0 0; }
    .confirm-actions { display: flex; justify-content: flex-end; gap: 8px; }
    .btn-cancel {
      padding: 8px 16px; border-radius: 8px; border: 1px solid #e2e8f0;
      background: #fff; color: #475569; font-size: 0.875rem; cursor: pointer;
    }
    .btn-cancel:hover { background: #f8fafc; }
    .btn-confirm {
      padding: 8px 16px; border-radius: 8px; border: none;
      background: #6366f1; color: #fff; font-size: 0.875rem; font-weight: 600; cursor: pointer;
    }
    .btn-confirm:hover { background: #4f46e5; }
    .btn-confirm.btn-danger { background: #ef4444; }
    .btn-confirm.btn-danger:hover { background: #dc2626; }
  `],
})
export class ConfirmationModalComponent {
  @Input() open = false;
  @Input() config: ConfirmationModalConfig = { title: 'Confirm', message: 'Are you sure?' };
  @Output() confirmed = new EventEmitter<string | undefined>();
  @Output() cancelled = new EventEmitter<void>();

  reason = '';
  readonly showReasonError = signal(false);

  confirm(): void {
    if (this.config.reasonLabel && !this.reason.trim()) {
      this.showReasonError.set(true);
      return;
    }
    this.showReasonError.set(false);
    this.confirmed.emit(this.config.reasonLabel ? this.reason.trim() : undefined);
    this.reason = '';
  }

  cancel(): void {
    this.showReasonError.set(false);
    this.reason = '';
    this.cancelled.emit();
  }
}
