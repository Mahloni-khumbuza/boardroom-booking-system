import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse
} from '../models/auth.model';

const ACCESS_TOKEN_KEY = 'bbs.accessToken';
const REFRESH_TOKEN_KEY = 'bbs.refreshToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly accessToken = signal<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null
  );

  readonly isAuthenticated = computed(() => this.accessToken() !== null);

  getAccessToken(): string | null {
    return this.accessToken();
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, payload)
      .pipe(tap((res) => this.persistTokens(res)));
  }

  register(payload: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(
      `${environment.apiBaseUrl}/auth/register`,
      payload
    );
  }

  logout(): void {
    this.accessToken.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  private persistTokens(res: LoginResponse): void {
    this.accessToken.set(res.accessToken);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
      if (res.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
      }
    }
  }
}
