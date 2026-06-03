import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../features/auth/services/auth.service';

interface NavItem {
  label: string;
  path: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css'
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', path: '/app/dashboard' },
    { label: 'Boardrooms', path: '/app/boardrooms' },
    { label: 'Bookings', path: '/app/bookings' },
    { label: 'Calendar', path: '/app/calendar' },
    { label: 'Users', path: '/app/users' },
    { label: 'Notifications', path: '/app/notifications' },
    { label: 'Settings', path: '/app/settings' },
    { label: 'Audit Logs', path: '/app/audit-logs' }
  ];

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
