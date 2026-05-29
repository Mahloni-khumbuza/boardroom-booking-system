import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AuthUser,
  LoginRequest,
  LoginResponse
} from '../models/auth.model';

const ACCESS_TOKEN_KEY = 'bbs.accessToken';
const REFRESH_TOKEN_KEY = 'bbs.refreshToken';
const USER_KEY = 'bbs.user';

const ADMIN_ROLES = new Set(['SuperAdmin', 'Admin', 'Manager']);

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly accessToken = signal<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null
  );

  private readonly user = signal<AuthUser | null>(this.readStoredUser());

  readonly isAuthenticated = computed(() => this.accessToken() !== null);
  readonly currentUser = computed(() => this.user());
  readonly role = computed(() => this.user()?.role ?? null);
  readonly isAdmin = computed(() => {
    const r = this.user()?.role;
    return r !== undefined && r !== null && ADMIN_ROLES.has(r);
  });
  readonly isSuperAdmin = computed(() => this.user()?.role === 'SuperAdmin');

  getAccessToken(): string | null {
    return this.accessToken();
  }

  homePath(): string {
    return this.isAdmin() ? '/admin/dashboard' : '/employee/dashboard';
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, payload)
      .pipe(tap((res) => this.persistSession(res)));
  }

  logout(): void {
    this.accessToken.set(null);
    this.user.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  private persistSession(res: LoginResponse): void {
    this.accessToken.set(res.accessToken);
    this.user.set(res.user ?? null);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
      if (res.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
      }
      if (res.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    }
  }

  private readStoredUser(): AuthUser | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
