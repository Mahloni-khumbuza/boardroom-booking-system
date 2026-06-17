import { Component, ContentChildren, EventEmitter, Input, Output, QueryList, TemplateRef, AfterContentInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            @for (col of columns; track col.key) {
              <th
                [style.width]="col.width ?? 'auto'"
                [class.sortable]="col.sortable"
                (click)="col.sortable && onSort(col.key)"
              >
                {{ col.label }}
                @if (col.sortable) {
                  <span class="sort-icon">
                    @if (sortKey === col.key) {
                      {{ sortDir === 'asc' ? '↑' : '↓' }}
                    } @else {
                      <span class="sort-placeholder">⇅</span>
                    }
                  </span>
                }
              </th>
            }
            @if (hasActions) { <th class="col-actions">Actions</th> }
          </tr>
        </thead>
        <tbody>
          @if (rows.length === 0) {
            <tr>
              <td [attr.colspan]="columns.length + (hasActions ? 1 : 0)" class="empty-cell">
                <ng-content select="[empty]" />
              </td>
            </tr>
          } @else {
            @for (row of rows; track trackByFn(row)) {
              <tr [class.row-clickable]="rowClickable" (click)="rowClick.emit(row)">
                @for (col of columns; track col.key) {
                  <td>
                    <ng-container
                      *ngTemplateOutlet="getCellTemplate(col.key) ?? defaultCell; context: { $implicit: row, value: getVal(row, col.key), col: col }"
                    />
                    <ng-template #defaultCell>{{ getVal(row, col.key) }}</ng-template>
                  </td>
                }
                @if (hasActions) {
                  <td class="col-actions">
                    <ng-container *ngTemplateOutlet="actionsTemplate; context: { $implicit: row }" />
                  </td>
                }
              </tr>
            }
          }
        </tbody>
      </table>

      @if (total > pageSize) {
        <div class="table-pagination">
          <span class="page-info">
            {{ offset + 1 }}–{{ min(offset + rows.length, total) }} of {{ total }}
          </span>
          <div class="page-btns">
            <button class="page-btn" [disabled]="offset === 0" (click)="prevPage.emit()">← Prev</button>
            <button class="page-btn" [disabled]="offset + pageSize >= total" (click)="nextPage.emit()">Next →</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .table-wrapper { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .data-table th {
      background: #f8fafc; color: #475569; font-weight: 600; font-size: 0.75rem;
      text-transform: uppercase; letter-spacing: 0.04em;
      padding: 10px 14px; text-align: left; border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }
    .data-table th.sortable { cursor: pointer; user-select: none; }
    .data-table th.sortable:hover { background: #f1f5f9; color: #334155; }
    .sort-icon { margin-left: 4px; font-size: 0.7rem; }
    .sort-placeholder { color: #cbd5e1; }
    .data-table td { padding: 11px 14px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
    .data-table tbody tr:last-child td { border-bottom: none; }
    .data-table tbody tr:hover { background: #f8fafc; }
    .row-clickable { cursor: pointer; }
    .col-actions { text-align: right; white-space: nowrap; }
    .empty-cell { text-align: center; padding: 2.5rem 1rem; color: #94a3b8; }
    .table-pagination {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; border-top: 1px solid #f1f5f9; background: #f8fafc;
    }
    .page-info { font-size: 0.8rem; color: #64748b; }
    .page-btns { display: flex; gap: 8px; }
    .page-btn {
      padding: 5px 12px; border-radius: 6px; border: 1px solid #e2e8f0;
      background: #fff; color: #475569; font-size: 0.8rem; cursor: pointer;
    }
    .page-btn:hover:not([disabled]) { background: #f1f5f9; }
    .page-btn[disabled] { opacity: 0.4; cursor: not-allowed; }
  `],
})
export class DataTableComponent implements AfterContentInit {
  @Input() columns: TableColumn[] = [];
  @Input() rows: Record<string, unknown>[] = [];
  @Input() total = 0;
  @Input() offset = 0;
  @Input() pageSize = 50;
  @Input() sortKey = '';
  @Input() sortDir: 'asc' | 'desc' = 'asc';
  @Input() rowClickable = false;
  @Input() trackBy: (row: Record<string, unknown>) => unknown = (r) => r['id'] ?? r;

  @Output() sortChange = new EventEmitter<{ key: string; dir: 'asc' | 'desc' }>();
  @Output() prevPage = new EventEmitter<void>();
  @Output() nextPage = new EventEmitter<void>();
  @Output() rowClick = new EventEmitter<Record<string, unknown>>();

  @ContentChildren('cellTpl') cellTemplates!: QueryList<TemplateRef<unknown>>;

  hasActions = false;
  actionsTemplate!: TemplateRef<unknown>;

  private cellTplMap = new Map<string, TemplateRef<unknown>>();

  ngAfterContentInit(): void {
    // Cell templates are registered via external reference — consumers pass them via named directives
  }

  registerCellTemplate(key: string, tpl: TemplateRef<unknown>): void {
    this.cellTplMap.set(key, tpl);
  }

  registerActionsTemplate(tpl: TemplateRef<unknown>): void {
    this.actionsTemplate = tpl;
    this.hasActions = true;
  }

  getCellTemplate(key: string): TemplateRef<unknown> | undefined {
    return this.cellTplMap.get(key);
  }

  getVal(row: Record<string, unknown>, key: string): unknown {
    return key.split('.').reduce((obj, k) => (obj as Record<string, unknown>)?.[k], row as unknown);
  }

  trackByFn(row: Record<string, unknown>): unknown {
    return this.trackBy(row);
  }

  onSort(key: string): void {
    const dir = this.sortKey === key && this.sortDir === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ key, dir });
  }

  min(a: number, b: number): number { return Math.min(a, b); }
}
