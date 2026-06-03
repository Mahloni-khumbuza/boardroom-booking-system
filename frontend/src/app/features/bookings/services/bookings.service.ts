import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  Booking,
  BookingCreateRequest,
  BookingQuery,
  BookingUpdateRequest
} from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/bookings`;

  list(query: BookingQuery = {}): Observable<Booking[]> {
    let params = new HttpParams();
    (Object.keys(query) as (keyof BookingQuery)[]).forEach((k) => {
      const v = query[k];
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<Booking[]>(this.url, { params });
  }

  get(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.url}/${id}`);
  }

  create(payload: BookingCreateRequest): Observable<Booking> {
    return this.http.post<Booking>(this.url, payload);
  }

  update(id: string, payload: BookingUpdateRequest): Observable<Booking> {
    return this.http.patch<Booking>(`${this.url}/${id}`, payload);
  }

  approve(id: string): Observable<Booking> {
    return this.http.post<Booking>(`${this.url}/${id}/approve`, {});
  }

  complete(id: string): Observable<Booking> {
    return this.http.post<Booking>(`${this.url}/${id}/complete`, {});
  }

  cancel(id: string): Observable<Booking> {
    return this.http.post<Booking>(`${this.url}/${id}/cancel`, {});
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
