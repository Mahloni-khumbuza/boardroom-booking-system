import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Users, DoorOpen, CalendarDays, Clock, Bell, BookOpen, TrendingUp } from 'lucide-angular';

import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { AuthService } from '../../auth/services/auth.service';
import {
  AdminDashboardStats,
  EmployeeDashboardStats
} from '../models/dashboard.model';
import { DashboardService } from '../services/dashboard.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, SpinnerComponent, RouterLink, LucideAngularModule],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css'
})
export class DashboardPage {
  private readonly service = inject(DashboardService);
  private readonly auth = inject(AuthService);

  readonly adminStats = signal<AdminDashboardStats | null>(null);
  readonly employeeStats = signal<EmployeeDashboardStats | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly isAdmin = this.auth.isAdmin;
  readonly userName = this.auth.currentUser;

  // Lucide icons
  readonly Icons = { Users, DoorOpen, CalendarDays, Clock, Bell, BookOpen, TrendingUp };

  constructor() { this.refresh(); }

  timeOfDay(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  statusItems(s: AdminDashboardStats): { key: string; label: string; count: number; pct: number }[] {
    const total = s.totalBookings || 1;
    return [
      { key: 'confirmed', label: 'Confirmed', count: s.bookingsByStatus.confirmed, pct: Math.round(s.bookingsByStatus.confirmed / total * 100) },
      { key: 'pending',   label: 'Pending',   count: s.bookingsByStatus.pending,   pct: Math.round(s.bookingsByStatus.pending   / total * 100) },
      { key: 'completed', label: 'Completed', count: s.bookingsByStatus.completed, pct: Math.round(s.bookingsByStatus.completed / total * 100) },
      { key: 'cancelled', label: 'Cancelled', count: s.bookingsByStatus.cancelled, pct: Math.round(s.bookingsByStatus.cancelled / total * 100) },
    ];
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    if (this.isAdmin()) {
      this.service.admin().subscribe({
        next: (s) => { this.adminStats.set(s); this.loading.set(false); },
        error: (err) => { this.error.set(this.errorMessage(err)); this.loading.set(false); }
      });
    } else {
      this.service.me().subscribe({
        next: (s) => { this.employeeStats.set(s); this.loading.set(false); },
        error: (err) => { this.error.set(this.errorMessage(err)); this.loading.set(false); }
      });
    }
  }

  private errorMessage(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || e?.message || 'Something went wrong.';
  }
}
