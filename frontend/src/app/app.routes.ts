import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/landing/pages/landing.page').then((m) => m.LandingPage)
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.page').then((m) => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/pages/register/register.page').then((m) => m.RegisterPage)
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layouts/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard.page').then((m) => m.DashboardPage)
      },
      {
        path: 'boardrooms',
        loadComponent: () =>
          import('./features/boardrooms/pages/boardrooms.page').then((m) => m.BoardroomsPage)
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./features/bookings/pages/bookings.page').then((m) => m.BookingsPage)
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/calendar/pages/calendar.page').then((m) => m.CalendarPage)
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/pages/users.page').then((m) => m.UsersPage)
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/pages/notifications.page').then(
            (m) => m.NotificationsPage
          )
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/pages/settings.page').then((m) => m.SettingsPage)
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./features/audit-logs/pages/audit-logs.page').then((m) => m.AuditLogsPage)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
