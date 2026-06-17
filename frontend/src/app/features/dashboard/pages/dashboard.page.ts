import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BarChart2,
  Bell,
  BookOpen,
  CalendarDays,
  Clock,
  DoorOpen,
  LucideAngularModule,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-angular';

import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { AuthService } from '../../auth/services/auth.service';
import {
  AdminDashboardStats,
  BookingsByDepartment,
  CancellationReport,
  EmployeeDashboardStats,
  PeakHour,
  RoomUsageRank,
  RoomUtilisation,
} from '../models/dashboard.model';
import { DashboardService } from '../services/dashboard.service';
import { extractErrorMessage } from '../../../shared/utils/error.utils';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, NgClass, RouterLink, LucideAngularModule, SpinnerComponent, DatePipe],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
})
export class DashboardPage {
  private readonly dashboardService = inject(DashboardService);
  private readonly auth = inject(AuthService);

  readonly Icons = {
    Users,
    DoorOpen,
    CalendarDays,
    Clock,
    Bell,
    TrendingUp,
    TrendingDown,
    BarChart2,
    BookOpen,
    XCircle,
  };

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly adminStats    = signal<AdminDashboardStats | null>(null);
  readonly employeeStats = signal<EmployeeDashboardStats | null>(null);
  readonly utilisation   = signal<RoomUtilisation[]>([]);
  readonly byDepartment  = signal<BookingsByDepartment[]>([]);
  readonly peakHours     = signal<PeakHour[]>([]);
  readonly mostUsed      = signal<RoomUsageRank[]>([]);
  readonly leastUsed     = signal<RoomUsageRank[]>([]);
  readonly cancellations = signal<CancellationReport | null>(null);

  // Admin dashboard is shown to Admin, SuperAdmin AND FacilitiesManager
  readonly isAdmin  = computed(() => this.auth.isAdmin() || this.auth.isFacilitiesManager());
  readonly userName = computed(() => this.auth.user());

  readonly portalBase = computed<string>(() => {
    if (this.auth.isSuperAdmin())        return '/superadmin';
    if (this.auth.isAdmin())             return '/admin';
    if (this.auth.isFacilitiesManager()) return '/facilities';
    return '/employee';
  });

  readonly maxPeakCount = computed(() =>
    Math.max(1, ...this.peakHours().map((h) => h.bookingCount))
  );

  timeOfDay(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      pending_approval: 'Pending',
      approved:         'Confirmed',
      rejected:         'Rejected',
      cancelled:        'Cancelled',
      completed:        'Completed',
      no_show:          'No Show',
    };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      pending_approval: 'status-pending',
      approved:         'status-confirmed',
      rejected:         'status-cancelled',
      cancelled:        'status-cancelled',
      completed:        'status-completed',
      no_show:          'status-cancelled',
    };
    return map[status] ?? 'status-cancelled';
  }

  statusItems(s: AdminDashboardStats) {
    const total = Math.max(1, s.totalBookings);
    return [
      { key: 'pending',   label: 'Pending',   count: s.bookingsByStatus.pending,   pct: Math.round((s.bookingsByStatus.pending   / total) * 100) },
      { key: 'confirmed', label: 'Confirmed',  count: s.bookingsByStatus.confirmed, pct: Math.round((s.bookingsByStatus.confirmed / total) * 100) },
      { key: 'cancelled', label: 'Cancelled',  count: s.bookingsByStatus.cancelled, pct: Math.round((s.bookingsByStatus.cancelled / total) * 100) },
      { key: 'completed', label: 'Completed',  count: s.bookingsByStatus.completed, pct: Math.round((s.bookingsByStatus.completed / total) * 100) },
    ];
  }

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    if (this.isAdmin()) {
      this.dashboardService.admin().subscribe({
        next: (s) => { this.adminStats.set(s); this.loading.set(false); },
        error: (e) => { this.error.set(extractErrorMessage(e)); this.loading.set(false); },
      });
      this.dashboardService.utilisation().subscribe({ next: (d) => this.utilisation.set(d), error: () => {} });
      this.dashboardService.byDepartment().subscribe({ next: (d) => this.byDepartment.set(d), error: () => {} });
      this.dashboardService.peakHours().subscribe({ next: (d) => this.peakHours.set(d), error: () => {} });
      this.dashboardService.mostUsed().subscribe({ next: (d) => this.mostUsed.set(d), error: () => {} });
      this.dashboardService.leastUsed().subscribe({ next: (d) => this.leastUsed.set(d), error: () => {} });
      this.dashboardService.cancellations().subscribe({ next: (d) => this.cancellations.set(d), error: () => {} });
    } else {
      this.dashboardService.me().subscribe({
        next: (s) => { this.employeeStats.set(s); this.loading.set(false); },
        error: (e) => { this.error.set(extractErrorMessage(e)); this.loading.set(false); },
      });
    }
  }

}
