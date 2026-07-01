import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushTokensService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/push-tokens`;

  register(token: string, platform: 'fcm' | 'web', deviceId?: string): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.url, { token, platform, deviceId });
  }

  remove(token: string): Observable<void> {
    return this.http.delete<void>(this.url, { body: { token } });
  }

  removeAll(): Observable<void> {
    return this.http.delete<void>(`${this.url}/all`);
  }
}
