import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LayoutDashboard,
  DoorOpen,
  Sparkles,
  CalendarDays,
  BookOpen,
  Users,
  Shield,
  Key,
  ClipboardList,
  Settings,
  Bell,
  Wrench,
  Lock,
  LogOut,
  User,
  Menu,
  LucideAngularModule,
} from 'lucide-angular';

import { AuthService } from '../../../features/auth/services/auth.service';
import { NotificationsService } from '../../../features/notifications/services/notifications.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconData = any;

interface NavItem {
  label: string;
  path: string;
  icon: IconData;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationsService = inject(NotificationsService);

  readonly Icons = { LogOut, User, Menu, Bell };

  readonly user        = computed(() => this.auth.user());
  readonly unreadCount = signal(0);
  readonly sidebarOpen = signal(false);

  private pollTimer?: ReturnType<typeof setInterval>;

  readonly navGroups = computed<NavGroup[]>(() => {
    const base = this.portalBase();

    if (this.auth.isSuperAdmin()) {
      return [
        {
          label: 'Overview',
          items: [
            { label: 'Dashboard',   path: `${base}/dashboard`,  icon: LayoutDashboard },
          ],
        },
        {
          label: 'Facilities',
          items: [
            { label: 'Boardrooms',  path: `${base}/boardrooms`, icon: DoorOpen },
            { label: 'Amenities',   path: `${base}/amenities`,  icon: Sparkles },
          ],
        },
        {
          label: 'Bookings',
          items: [
            { label: 'Bookings',    path: `${base}/bookings`,   icon: BookOpen },
            { label: 'Calendar',    path: `${base}/calendar`,   icon: CalendarDays },
          ],
        },
        {
          label: 'Administration',
          items: [
            { label: 'Users',        path: `${base}/users`,        icon: Users },
            { label: 'Roles',        path: `${base}/roles`,        icon: Shield },
            { label: 'Permissions',  path: `${base}/permissions`,  icon: Key },
            { label: 'Audit Logs',   path: `${base}/audit-logs`,   icon: ClipboardList },
            { label: 'Settings',     path: `${base}/settings`,     icon: Settings },
          ],
        },
        {
          label: 'Communication',
          items: [
            { label: 'Notifications', path: `${base}/notifications`, icon: Bell },
          ],
        },
      ];
    }

    if (this.auth.isAdmin()) {
      return [
        {
          label: 'Overview',
          items: [
            { label: 'Dashboard',   path: `${base}/dashboard`,  icon: LayoutDashboard },
          ],
        },
        {
          label: 'Facilities',
          items: [
            { label: 'Boardrooms',  path: `${base}/boardrooms`, icon: DoorOpen },
            { label: 'Amenities',   path: `${base}/amenities`,  icon: Sparkles },
          ],
        },
        {
          label: 'Bookings',
          items: [
            { label: 'Bookings',    path: `${base}/bookings`,   icon: BookOpen },
            { label: 'Calendar',    path: `${base}/calendar`,   icon: CalendarDays },
          ],
        },
        {
          label: 'Administration',
          items: [
            { label: 'Users',       path: `${base}/users`,      icon: Users },
            { label: 'Audit Logs',  path: `${base}/audit-logs`, icon: ClipboardList },
            { label: 'Settings',    path: `${base}/settings`,   icon: Settings },
          ],
        },
        {
          label: 'Communication',
          items: [
            { label: 'Notifications', path: `${base}/notifications`, icon: Bell },
          ],
        },
      ];
    }

    if (this.auth.isFacilitiesManager()) {
      return [
        {
          label: 'Overview',
          items: [
            { label: 'Dashboard',   path: `${base}/dashboard`,  icon: LayoutDashboard },
          ],
        },
        {
          label: 'Facilities',
          items: [
            { label: 'Boardrooms',  path: `${base}/boardrooms`,     icon: DoorOpen },
            { label: 'Room Blocks', path: `${base}/room-blocks`,    icon: Lock },
            { label: 'Equipment',   path: `${base}/room-equipment`, icon: Wrench },
          ],
        },
        {
          label: 'Bookings',
          items: [
            { label: 'Bookings',    path: `${base}/bookings`,  icon: BookOpen },
            { label: 'Calendar',    path: `${base}/calendar`,  icon: CalendarDays },
          ],
        },
        {
          label: 'Communication',
          items: [
            { label: 'Notifications', path: `${base}/notifications`, icon: Bell },
          ],
        },
      ];
    }

    // Employee
    return [
      {
        label: 'Overview',
        items: [
          { label: 'Dashboard',   path: `${base}/dashboard`,  icon: LayoutDashboard },
        ],
      },
      {
        label: 'Bookings',
        items: [
          { label: 'Boardrooms',  path: `${base}/boardrooms`, icon: DoorOpen },
          { label: 'My Bookings', path: `${base}/bookings`,   icon: BookOpen },
          { label: 'Calendar',    path: `${base}/calendar`,   icon: CalendarDays },
        ],
      },
      {
        label: 'Communication',
        items: [
          { label: 'Notifications', path: `${base}/notifications`, icon: Bell },
        ],
      },
    ];
  });

  readonly roleLabel = computed<string>(() => {
    if (this.auth.isSuperAdmin())        return 'Super Admin';
    if (this.auth.isAdmin())             return 'Admin';
    if (this.auth.isFacilitiesManager()) return 'Facilities';
    return 'Employee';
  });

  readonly roleCssClass = computed<string>(() => {
    if (this.auth.isSuperAdmin())        return 'badge-superadmin';
    if (this.auth.isAdmin())             return 'badge-admin';
    if (this.auth.isFacilitiesManager()) return 'badge-facilities';
    return 'badge-employee';
  });

  readonly userInitials = computed<string>(() => {
    const u = this.auth.user();
    if (!u) return '?';
    const first = (u.firstName ?? '').charAt(0).toUpperCase();
    const last  = (u.lastName  ?? '').charAt(0).toUpperCase();
    return (first + last) || u.email.charAt(0).toUpperCase();
  });

  private portalBase(): string {
    if (this.auth.isSuperAdmin())        return '/superadmin';
    if (this.auth.isAdmin())             return '/admin';
    if (this.auth.isFacilitiesManager()) return '/facilities';
    return '/employee';
  }

  ngOnInit(): void {
    this.loadUnreadCount();
    this.pollTimer = setInterval(() => this.loadUnreadCount(), 60_000);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  toggleSidebar(): void { this.sidebarOpen.set(!this.sidebarOpen()); }

  notificationsPath(): string { return `${this.portalBase()}/notifications`; }
  profilePath():       string { return `${this.portalBase()}/profile`; }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }

  private loadUnreadCount(): void {
    this.notificationsService.unreadCount().subscribe({
      next: (r) => this.unreadCount.set(r.unread ?? 0),
      error: () => {},
    });
  }
}
