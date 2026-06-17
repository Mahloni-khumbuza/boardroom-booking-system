import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { Boardroom } from '../../boardrooms/models/boardroom.model';
import { BoardroomsService } from '../../boardrooms/services/boardrooms.service';
import { extractErrorMessage } from '../../../shared/utils/error.utils';

export type EquipmentStatus = 'ok' | 'needs_attention' | 'out_of_service';

const STATUS_META: Record<EquipmentStatus, { label: string; css: string }> = {
  ok: { label: 'OK', css: 'ok' },
  needs_attention: { label: 'Needs Attention', css: 'attention' },
  out_of_service: { label: 'Out of Service', css: 'out' }
};

@Component({
  selector: 'app-room-equipment-page',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  templateUrl: './room-equipment.page.html',
  styleUrl: './room-equipment.page.css'
})
export class RoomEquipmentPage {
  private readonly service = inject(BoardroomsService);

  readonly boardrooms = signal<(Boardroom & { equipmentStatus: EquipmentStatus })[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);

  readonly statusOptions: EquipmentStatus[] = ['ok', 'needs_attention', 'out_of_service'];

  constructor() { this.refresh(); }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.list().subscribe({
      next: (rooms) => {
        this.boardrooms.set(rooms as (Boardroom & { equipmentStatus: EquipmentStatus })[]);
        this.loading.set(false);
      },
      error: (err) => { this.error.set(extractErrorMessage(err)); this.loading.set(false); }
    });
  }

  updateStatus(room: Boardroom & { equipmentStatus: EquipmentStatus }, status: EquipmentStatus): void {
    if (room.equipmentStatus === status) return;
    this.busyId.set(room.id);
    this.service.updateEquipmentStatus(room.id, status).subscribe({
      next: (updated) => {
        this.boardrooms.update((list) =>
          list.map((r) =>
            r.id === updated.id
              ? { ...updated, equipmentStatus: (updated as typeof room).equipmentStatus }
              : r
          )
        );
        this.busyId.set(null);
      },
      error: (err) => { this.error.set(extractErrorMessage(err)); this.busyId.set(null); }
    });
  }

  statusLabel(s: EquipmentStatus): string { return STATUS_META[s]?.label ?? s; }
  statusCss(s: EquipmentStatus): string { return STATUS_META[s]?.css ?? ''; }

}
