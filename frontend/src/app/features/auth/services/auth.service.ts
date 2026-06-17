import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '../models/auth.model';

const ACCESS_TOKEN_KEY = 'bbs.accessToken';
const USER_KEY = 'bbs.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly accessToken = signal<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null
  );

  private readonly currentUser = signal<AuthUser | null>(
    this.loadStoredUser()
  );

  readonly isAuthenticated = computed(() => this.accessToken() !== null);
  readonly user = computed(() => this.currentUser());

  readonly role = computed(() => {
    const u = this.currentUser();
    if (u?.role) return u.role;
    // Fallback: decode role from JWT payload
    const token = this.accessToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return (payload.role as string) ?? null;
    } catch {
      return null;
    }
  });

  getAccessToken(): string | null {
    return this.accessToken();
  }

  // ── Role helpers ────────────────────────────────────────────────
  isSuperAdmin(): boolean       { return this.role() === 'SuperAdmin'; }
  isAdmin(): boolean            { const r = this.role(); return r === 'Admin' || r === 'SuperAdmin'; }
  isFacilitiesManager(): boolean { return this.role() === 'FacilitiesManager'; }
  isEmployee(): boolean         { return this.role() === 'Employee'; }

  homePath(): string {
    if (this.isSuperAdmin())        return '/superadmin/dashboard';
    if (this.isAdmin())             return '/admin/dashboard';
    if (this.isFacilitiesManager()) return '/facilities/dashboard';
    return '/employee/dashboard';
  }

  // ── Auth actions ─────────────────────────────────────────────────
  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, payload)
      .pipe(tap((res) => this.persistSession(res)));
  }

  register(payload: RegisterRequest): Observable<RegisterResponse> {
    return this.http
      .post<RegisterResponse>(`${environment.apiBaseUrl}/auth/register`, payload)
      .pipe(tap((res) => this.persistSession(res)));
  }

  logout(): void {
    this.accessToken.set(null);
    this.currentUser.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  private persistSession(res: LoginResponse): void {
    this.accessToken.set(res.accessToken);
    if (res.user) this.currentUser.set(res.user);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
      if (res.user) localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    }
  }

  private loadStoredUser(): AuthUser | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}
