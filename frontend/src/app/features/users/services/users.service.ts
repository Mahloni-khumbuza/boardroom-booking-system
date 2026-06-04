import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AdminUser, UserCreateRequest, UserUpdateRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/users`;

  list(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(this.url);
  }

  me(): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.url}/me`);
  }

  create(payload: UserCreateRequest): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.url, payload);
  }

  update(id: string, payload: UserUpdateRequest): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.url}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
