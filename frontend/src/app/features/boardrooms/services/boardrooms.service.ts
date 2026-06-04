import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  Boardroom,
  BoardroomAvailability,
  BoardroomCreateRequest,
  BoardroomUpdateRequest
} from '../models/boardroom.model';

@Injectable({ providedIn: 'root' })
export class BoardroomsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/boardrooms`;

  list(options: {
    activeOnly?: boolean;
    minCapacity?: number | null;
    location?: string;
    amenityIds?: string[];
  } = {}): Observable<Boardroom[]> {
    let params = new HttpParams();
    if (options.activeOnly) params = params.set('activeOnly', 'true');
    if (options.minCapacity != null) params = params.set('minCapacity', String(options.minCapacity));
    if (options.location?.trim()) params = params.set('location', options.location.trim());
    if (options.amenityIds?.length) {
      for (const id of options.amenityIds) {
        params = params.append('amenityIds', id);
      }
    }
    return this.http.get<Boardroom[]>(this.url, { params });
  }

  get(id: string): Observable<Boardroom> {
    return this.http.get<Boardroom>(`${this.url}/${id}`);
  }

  create(payload: BoardroomCreateRequest): Observable<Boardroom> {
    return this.http.post<Boardroom>(this.url, payload);
  }

  update(id: string, payload: BoardroomUpdateRequest): Observable<Boardroom> {
    return this.http.patch<Boardroom>(`${this.url}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  updateEquipmentStatus(id: string, equipmentStatus: string): Observable<Boardroom> {
    return this.http.patch<Boardroom>(`${this.url}/${id}/equipment-status`, { equipmentStatus });
  }

  getAvailability(id: string, date: string): Observable<BoardroomAvailability> {
    const params = new HttpParams().set('date', date);
    return this.http.get<BoardroomAvailability>(`${this.url}/${id}/availability`, { params });
  }
}
