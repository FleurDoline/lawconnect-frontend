import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationResponse {
  id: number;
  message: string;
  read: boolean;
  createdAt: string;
  // ajoute ici les autres champs de ton NotificationResponse DTO backend si besoin (type, lien, etc.)
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private baseUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.baseUrl}/unread-count`);
  }

  getNotifications(page = 0, size = 10, unreadOnly = false): Observable<PageResponse<NotificationResponse>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('unreadOnly', String(unreadOnly));
    return this.http.get<PageResponse<NotificationResponse>>(this.baseUrl, { params });
  }

  markAsRead(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/read-all`, {});
  }
}