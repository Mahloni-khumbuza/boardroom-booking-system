import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  Booking,
  BookingCreateRequest,
  BookingQuery,
  BookingUpdateRequest,
  CancelBookingRequest,
  RejectBookingRequest,
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

  myBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.url}/my-bookings`);
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
    return this.http.patch<Booking>(`${this.url}/${id}/approve`, {});
  }

  reject(id: string, payload: RejectBookingRequest): Observable<Booking> {
    return this.http.patch<Booking>(`${this.url}/${id}/reject`, payload);
  }

  complete(id: string): Observable<Booking> {
    return this.http.patch<Booking>(`${this.url}/${id}/complete`, {});
  }

  noShow(id: string): Observable<Booking> {
    return this.http.patch<Booking>(`${this.url}/${id}/no-show`, {});
  }

  cancel(id: string, payload: CancelBookingRequest = {}): Observable<Booking> {
    return this.http.patch<Booking>(`${this.url}/${id}/cancel`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
