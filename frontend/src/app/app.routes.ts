import { Routes } from '@angular/router';

import { authGuard, unauthGuard } from './core/guards/auth.guard';
import { adminGuard }             from './core/guards/admin.guard';
import { superAdminGuard }        from './core/guards/super-admin.guard';
import { facilitiesGuard }        from './core/guards/facilities.guard';
import { employeeGuard }          from './core/guards/employee.guard';
import { homeRedirectGuard }      from './core/guards/home-redirect.guard';

export const routes: Routes = [

  // ── Public ───────────────────────────────────────────────────────────
  { path: '', pathMatch: 'full',
    loadComponent: () => import('./features/landing/pages/landing.page').then(m => m.LandingPage) },
  { path: 'login', canActivate: [unauthGuard],
    loadComponent: () => import('./features/auth/pages/login/login.page').then(m => m.LoginPage) },

  // ── Employee portal  /employee/* ─────────────────────────────────────
  {
    path: 'employee',
    canActivate: [authGuard, employeeGuard],
    loadComponent: () => import('./core/layouts/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard',
        loadComponent: () => import('./features/dashboard/pages/dashboard.page').then(m => m.DashboardPage) },
      { path: 'boardrooms',
        loadComponent: () => import('./features/boardrooms/pages/admin-boardrooms.page').then(m => m.AdminBoardroomsPage) },
      { path: 'boardrooms/:id',
        loadComponent: () => import('./features/boardrooms/pages/boardroom-detail.page').then(m => m.BoardroomDetailPage) },
      { path: 'bookings',
        loadComponent: () => import('./features/bookings/pages/bookings.page').then(m => m.BookingsPage) },
      { path: 'calendar',
        loadComponent: () => import('./features/calendar/pages/calendar.page').then(m => m.CalendarPage) },
      { path: 'notifications',
        loadComponent: () => import('./features/notifications/pages/notifications.page').then(m => m.NotificationsPage) },
      { path: 'profile',
        loadComponent: () => import('./features/users/pages/profile.page').then(m => m.ProfilePage) },
    ],
  },

  // ── Facilities Manager portal  /facilities/* ─────────────────────────
  {
    path: 'facilities',
    canActivate: [authGuard, facilitiesGuard],
    loadComponent: () => import('./core/layouts/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard',
        loadComponent: () => import('./features/dashboard/pages/dashboard.page').then(m => m.DashboardPage) },
      { path: 'boardrooms',
        loadComponent: () => import('./features/boardrooms/pages/admin-boardrooms.page').then(m => m.AdminBoardroomsPage) },
      { path: 'boardrooms/:id',
        loadComponent: () => import('./features/boardrooms/pages/boardroom-detail.page').then(m => m.BoardroomDetailPage) },
      { path: 'bookings',
        loadComponent: () => import('./features/facilities/pages/facilities-bookings.page').then(m => m.FacilitiesBookingsPage) },
      { path: 'room-blocks',
        loadComponent: () => import('./features/boardroom-blocks/pages/boardroom-blocks.page').then(m => m.BoardroomBlocksPage) },
      { path: 'room-equipment',
        loadComponent: () => import('./features/facilities/pages/room-equipment.page').then(m => m.RoomEquipmentPage) },
      { path: 'calendar',
        loadComponent: () => import('./features/calendar/pages/calendar.page').then(m => m.CalendarPage) },
      { path: 'notifications',
        loadComponent: () => import('./features/notifications/pages/notifications.page').then(m => m.NotificationsPage) },
      { path: 'profile',
        loadComponent: () => import('./features/users/pages/profile.page').then(m => m.ProfilePage) },
    ],
  },

  // ── Admin portal  /admin/* ────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./core/layouts/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard',
        loadComponent: () => import('./features/dashboard/pages/dashboard.page').then(m => m.DashboardPage) },
      { path: 'boardrooms',
        loadComponent: () => import('./features/boardrooms/pages/admin-boardrooms.page').then(m => m.AdminBoardroomsPage) },
      { path: 'boardrooms/:id',
        loadComponent: () => import('./features/boardrooms/pages/boardroom-detail.page').then(m => m.BoardroomDetailPage) },
      { path: 'amenities',
        loadComponent: () => import('./features/boardrooms/pages/admin-amenities.page').then(m => m.AdminAmenitiesPage) },
      { path: 'bookings',
        loadComponent: () => import('./features/bookings/pages/bookings.page').then(m => m.BookingsPage) },
      { path: 'calendar',
        loadComponent: () => import('./features/calendar/pages/calendar.page').then(m => m.CalendarPage) },
      { path: 'users',
        loadComponent: () => import('./features/users/pages/users.page').then(m => m.UsersPage) },
      { path: 'audit-logs',
        loadComponent: () => import('./features/audit-logs/pages/audit-logs.page').then(m => m.AuditLogsPage) },
      { path: 'settings',
        loadComponent: () => import('./features/settings/pages/settings.page').then(m => m.SettingsPage) },
      { path: 'notifications',
        loadComponent: () => import('./features/notifications/pages/notifications.page').then(m => m.NotificationsPage) },
      { path: 'profile',
        loadComponent: () => import('./features/users/pages/profile.page').then(m => m.ProfilePage) },
    ],
  },

  // ── Super Admin portal  /superadmin/* ────────────────────────────────
  {
    path: 'superadmin',
    canActivate: [authGuard, superAdminGuard],
    loadComponent: () => import('./core/layouts/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard',
        loadComponent: () => import('./features/dashboard/pages/dashboard.page').then(m => m.DashboardPage) },
      { path: 'boardrooms',
        loadComponent: () => import('./features/boardrooms/pages/admin-boardrooms.page').then(m => m.AdminBoardroomsPage) },
      { path: 'boardrooms/:id',
        loadComponent: () => import('./features/boardrooms/pages/boardroom-detail.page').then(m => m.BoardroomDetailPage) },
      { path: 'amenities',
        loadComponent: () => import('./features/boardrooms/pages/admin-amenities.page').then(m => m.AdminAmenitiesPage) },
      { path: 'bookings',
        loadComponent: () => import('./features/bookings/pages/bookings.page').then(m => m.BookingsPage) },
      { path: 'calendar',
        loadComponent: () => import('./features/calendar/pages/calendar.page').then(m => m.CalendarPage) },
      { path: 'users',
        loadComponent: () => import('./features/users/pages/users.page').then(m => m.UsersPage) },
      { path: 'roles',
        loadComponent: () => import('./features/roles/pages/roles.page').then(m => m.RolesPage) },
      { path: 'permissions',
        loadComponent: () => import('./features/permissions/pages/permissions.page').then(m => m.PermissionsPage) },
      { path: 'audit-logs',
        loadComponent: () => import('./features/audit-logs/pages/audit-logs.page').then(m => m.AuditLogsPage) },
      { path: 'settings',
        loadComponent: () => import('./features/settings/pages/settings.page').then(m => m.SettingsPage) },
      { path: 'notifications',
        loadComponent: () => import('./features/notifications/pages/notifications.page').then(m => m.NotificationsPage) },
      { path: 'profile',
        loadComponent: () => import('./features/users/pages/profile.page').then(m => m.ProfilePage) },
    ],
  },

  // ── Legacy /app/* — redirect authenticated users to their portal ──────
  { path: 'app',               canActivate: [homeRedirectGuard], children: [] },
  { path: 'app/dashboard',     canActivate: [homeRedirectGuard], children: [] },
  { path: 'app/boardrooms',    canActivate: [homeRedirectGuard], children: [] },
  { path: 'app/bookings',      canActivate: [homeRedirectGuard], children: [] },
  { path: 'app/calendar',      canActivate: [homeRedirectGuard], children: [] },
  { path: 'app/users',         canActivate: [homeRedirectGuard], children: [] },
  { path: 'app/notifications', canActivate: [homeRedirectGuard], children: [] },
  { path: 'app/settings',      canActivate: [homeRedirectGuard], children: [] },
  { path: 'app/audit-logs',    canActivate: [homeRedirectGuard], children: [] },

  { path: '**', redirectTo: '' },
];
