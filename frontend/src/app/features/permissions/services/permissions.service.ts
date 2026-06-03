import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CreatePermissionRequest, Permission, UpdatePermissionRequest } from '../models/permission.model';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/permissions`;

  list(): Observable<Permission[]> {
    return this.http.get<Permission[]>(this.url);
  }

  create(dto: CreatePermissionRequest): Observable<Permission> {
    return this.http.post<Permission>(this.url, dto);
  }

  update(id: string, dto: UpdatePermissionRequest): Observable<Permission> {
    return this.http.patch<Permission>(`${this.url}/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
