import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CreateRoleRequest, Role, UpdateRoleRequest } from '../models/role.model';

@Injectable({ providedIn: 'root' })
export class RolesFullService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/roles`;

  list(): Observable<Role[]> {
    return this.http.get<Role[]>(this.url);
  }

  findOne(id: string): Observable<Role> {
    return this.http.get<Role>(`${this.url}/${id}`);
  }

  create(dto: CreateRoleRequest): Observable<Role> {
    return this.http.post<Role>(this.url, dto);
  }

  update(id: string, dto: UpdateRoleRequest): Observable<Role> {
    return this.http.patch<Role>(`${this.url}/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
