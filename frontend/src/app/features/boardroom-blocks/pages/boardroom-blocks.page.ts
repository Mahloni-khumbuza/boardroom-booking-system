import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { Boardroom } from '../../boardrooms/models/boardroom.model';
import { BoardroomsService } from '../../boardrooms/services/boardrooms.service';
import { BoardroomBlock } from '../models/boardroom-block.model';
import { BoardroomBlocksService } from '../services/boardroom-blocks.service';

@Component({
  selector: 'app-boardroom-blocks-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent],
  templateUrl: './boardroom-blocks.page.html',
  styleUrl: './boardroom-blocks.page.css'
})
export class BoardroomBlocksPage {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(BoardroomBlocksService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly boardroomsService = inject(BoardroomsService);

  readonly blocks = signal<BoardroomBlock[]>([]);
  readonly boardrooms = signal<Boardroom[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly showCreate = signal(false);

  readonly createForm = this.fb.nonNullable.group({
    boardroomId: ['', [Validators.required]],
    startTime: ['', [Validators.required]],
    endTime: ['', [Validators.required]],
    reason: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]]
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      blocks: this.service.list(),
      boardrooms: this.boardroomsService.list()
    }).subscribe({
      next: ({ blocks, boardrooms }) => {
        this.blocks.set(blocks);
        this.boardrooms.set(boardrooms);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  toggleCreate(): void {
    if (this.showCreate()) {
      this.showCreate.set(false);
    } else {
      const start = roundedNow(60);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
      this.createForm.reset({
        boardroomId: '',
        startTime: toLocalInput(start),
        endTime: toLocalInput(end),
        reason: ''
      });
      this.showCreate.set(true);
    }
  }

  submitCreate(): void {
    if (this.createForm.invalid || this.saving()) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const raw = this.createForm.getRawValue();
    this.service
      .create({
        boardroomId: raw.boardroomId,
        startTime: new Date(raw.startTime).toISOString(),
        endTime: new Date(raw.endTime).toISOString(),
        reason: raw.reason.trim()
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.showCreate.set(false);
          this.refresh();
          this.toast.success('Room block created.');
        },
        error: (err) => {
          this.error.set(this.errorMessage(err));
          this.saving.set(false);
        }
      });
  }

  remove(block: BoardroomBlock): void {
    this.dialog.confirm({ title: 'Remove Block', message: `Remove maintenance block on "${block.boardroom.name}"?`, confirmLabel: 'Remove', danger: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.service.remove(block.id).subscribe({
          next: () => { this.refresh(); this.toast.success('Room block removed.'); },
          error: (err) => this.error.set(this.errorMessage(err))
        });
      });
  }

  private errorMessage(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || e?.message || 'Something went wrong.';
  }
}

function roundedNow(intervalMinutes: number): Date {
  const d = new Date();
  d.setMinutes(Math.ceil(d.getMinutes() / intervalMinutes) * intervalMinutes, 0, 0);
  return d;
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
