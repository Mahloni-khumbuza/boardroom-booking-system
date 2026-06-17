import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';

interface MatrixRow {
  capability: string;
  employee: 'yes' | 'no' | 'own' | 'configurable' | 'limited';
  facilities: 'yes' | 'no' | 'own' | 'configurable' | 'limited';
  admin: 'yes' | 'no' | 'own' | 'configurable' | 'limited';
  superAdmin: 'yes' | 'no' | 'own' | 'configurable' | 'limited';
}

// Source of truth: Section 3.1 Permission Matrix from delivery brief
const MATRIX: MatrixRow[] = [
  { capability: 'View active boardrooms',    employee: 'yes',          facilities: 'yes',          admin: 'yes',     superAdmin: 'yes' },
  { capability: 'Create own booking',         employee: 'yes',          facilities: 'yes',          admin: 'yes',     superAdmin: 'yes' },
  { capability: 'Edit own booking',           employee: 'yes',          facilities: 'yes',          admin: 'yes',     superAdmin: 'yes' },
  { capability: 'Cancel own booking',         employee: 'yes',          facilities: 'yes',          admin: 'yes',     superAdmin: 'yes' },
  { capability: 'View all bookings',          employee: 'no',           facilities: 'yes',          admin: 'yes',     superAdmin: 'yes' },
  { capability: 'Approve or reject bookings', employee: 'no',           facilities: 'configurable', admin: 'yes',     superAdmin: 'yes' },
  { capability: 'Cancel any booking',         employee: 'no',           facilities: 'yes',          admin: 'yes',     superAdmin: 'yes' },
  { capability: 'Manage boardrooms',          employee: 'no',           facilities: 'limited',      admin: 'yes',     superAdmin: 'yes' },
  { capability: 'Manage users and roles',     employee: 'no',           facilities: 'no',           admin: 'limited', superAdmin: 'yes' },
  { capability: 'View audit logs',            employee: 'no',           facilities: 'no',           admin: 'yes',     superAdmin: 'yes' },
  { capability: 'Manage system settings',     employee: 'no',           facilities: 'no',           admin: 'yes',     superAdmin: 'yes' },
  // Additional capabilities derived from role descriptions
  { capability: 'Manage room blocks',         employee: 'no',           facilities: 'yes',          admin: 'yes',     superAdmin: 'yes' },
  { capability: 'Manage amenities',           employee: 'no',           facilities: 'no',           admin: 'yes',     superAdmin: 'yes' },
  { capability: 'Manage roles & permissions', employee: 'no',           facilities: 'no',           admin: 'no',      superAdmin: 'yes' },
  { capability: 'View dashboard analytics',   employee: 'limited',      facilities: 'yes',          admin: 'yes',     superAdmin: 'yes' },
  { capability: 'Mark booking complete / no-show', employee: 'no',      facilities: 'no',           admin: 'yes',     superAdmin: 'yes' },
  { capability: 'Delete records permanently', employee: 'no',           facilities: 'no',           admin: 'limited', superAdmin: 'yes' },
];

@Component({
  selector: 'app-permission-matrix-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './permission-matrix.page.html',
  styleUrl: './permission-matrix.page.css',
})
export class PermissionMatrixPage {
  private readonly auth = inject(AuthService);

  readonly matrix = MATRIX;

  readonly currentRole = computed(() => {
    if (this.auth.isSuperAdmin()) return 'superAdmin';
    if (this.auth.isAdmin()) return 'admin';
    if (this.auth.isFacilitiesManager()) return 'facilities';
    return 'employee';
  });

  readonly currentRoleLabel = computed(() => {
    if (this.auth.isSuperAdmin()) return 'Super Admin';
    if (this.auth.isAdmin()) return 'Admin';
    if (this.auth.isFacilitiesManager()) return 'Facilities Manager';
    return 'Employee';
  });

  cellClass(val: string, colRole: string): string {
    const isCurrentRole = colRole === this.currentRole();
    const base = isCurrentRole ? 'cell-highlight ' : '';
    switch (val) {
      case 'yes':          return base + 'cell-yes';
      case 'own':          return base + 'cell-own';
      case 'limited':      return base + 'cell-limited';
      case 'configurable': return base + 'cell-config';
      default:             return base + 'cell-no';
    }
  }

  cellLabel(val: string): string {
    switch (val) {
      case 'yes':          return 'Yes';
      case 'own':          return 'Own only';
      case 'limited':      return 'Limited';
      case 'configurable': return 'Configurable';
      default:             return 'No';
    }
  }
}
