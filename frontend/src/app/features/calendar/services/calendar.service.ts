import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { BookingsService } from '../../bookings/services/bookings.service';
import { Booking } from '../../bookings/models/booking.model';

export interface CalendarQuery {
  boardroomId?: string;
  startDateTime?: string;
  endDateTime?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private readonly http            = inject(HttpClient);
  private readonly bookingsService = inject(BookingsService);
  private readonly url             = `${environment.apiBaseUrl}/bookings`;

  list(query: CalendarQuery = {}): Observable<any[]> {
    let params = new HttpParams();
    if (query.boardroomId)  params = params.set('boardroomId',  query.boardroomId);
    if (query.startDateTime) params = params.set('startDateTime', query.startDateTime);
    if (query.endDateTime)   params = params.set('endDateTime',   query.endDateTime);
    if (query.status)        params = params.set('status',        query.status);
    return this.http.get<any[]>(`${this.url}/calendar`, { params });
  }

  approve(id: string): Observable<Booking> {
    return this.bookingsService.approve(id);
  }

  cancel(id: string): Observable<Booking> {
    return this.bookingsService.cancel(id);
  }
}
