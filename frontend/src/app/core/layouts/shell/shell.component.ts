import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { LucideAngularModule,
  LayoutDashboard, DoorOpen, Sparkles, CalendarDays, BookOpen,
  CalendarRange, Users, Bell, Settings, ScrollText, ShieldCheck,
  KeyRound, Wrench, LogOut, Building2, OctagonMinus
} from 'lucide-angular';

type LucideIconData = readonly (readonly [string, Record<string, string | number>])[];

import { AuthService } from '../../../features/auth/services/auth.service';

export interface NavItem {
  label: string;
  path: string;
  icon?: LucideIconData;
}

export interface ShellRouteData {
  brand?: string;
  navItems?: NavItem[];
}

const NAV_ICONS: Record<string, LucideIconData> = {
  'Dashboard':       LayoutDashboard,
  'Boardrooms':      DoorOpen,
  'Amenities':       Sparkles,
  'Boardroom Blocks': OctagonMinus,
  'Room Blocks':     OctagonMinus,
  'Bookings':        BookOpen,
  'Calendar':        CalendarRange,
  'Users':           Users,
  'Notifications':   Bell,
  'Settings':        Settings,
  'Audit Logs':      ScrollText,
  'Roles':           ShieldCheck,
  'Permissions':     KeyRound,
  'Room Equipment':  Wrench,
};

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css'
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly LogOut = LogOut;
  readonly Building2 = Building2;

  private readonly routeData = toSignal(
    this.route.data.pipe(map((data) => data as ShellRouteData)),
    { initialValue: {} as ShellRouteData }
  );

  readonly brand = computed(() => this.routeData().brand ?? 'Boardroom Booking');
  readonly navItems = computed<NavItem[]>(() =>
    (this.routeData().navItems ?? []).map((item) => ({
      ...item,
      icon: NAV_ICONS[item.label] ?? CalendarDays,
    }))
  );
  readonly userLabel = computed(() => {
    const u = this.auth.currentUser();
    if (!u) return '';
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    return name || u.email;
  });
  readonly userInitials = computed(() => {
    const u = this.auth.currentUser();
    if (!u) return '?';
    const f = u.firstName?.[0] ?? '';
    const l = u.lastName?.[0] ?? '';
    return (f + l).toUpperCase() || u.email[0].toUpperCase();
  });
  readonly roleLabel = computed(() => this.auth.role() ?? '');

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
