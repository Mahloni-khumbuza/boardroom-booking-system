import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  BoardroomBlock,
  BoardroomBlockCreateRequest,
  BoardroomBlockUpdateRequest
} from '../models/boardroom-block.model';

@Injectable({ providedIn: 'root' })
export class BoardroomBlocksService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/boardroom-blocks`;

  list(): Observable<BoardroomBlock[]> {
    return this.http.get<BoardroomBlock[]>(this.url);
  }

  create(payload: BoardroomBlockCreateRequest): Observable<BoardroomBlock> {
    return this.http.post<BoardroomBlock>(this.url, payload);
  }

  update(id: string, payload: BoardroomBlockUpdateRequest): Observable<BoardroomBlock> {
    return this.http.patch<BoardroomBlock>(`${this.url}/${id}`, payload);
  }

  activate(id: string): Observable<BoardroomBlock> {
    return this.http.post<BoardroomBlock>(`${this.url}/${id}/activate`, {});
  }

  deactivate(id: string): Observable<BoardroomBlock> {
    return this.http.post<BoardroomBlock>(`${this.url}/${id}/deactivate`, {});
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
