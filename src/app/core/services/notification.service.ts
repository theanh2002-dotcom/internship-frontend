import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private apiService: ApiService) {}

  getNotifications(page: number = 1, limit: number = 20): Observable<any> {
    return this.apiService.get<any>(`/base/notifications?page=${page}&limit=${limit}`);
  }

  getUnreadCount(): Observable<any> {
    return this.apiService.get<any>('/base/notifications/unread-count');
  }

  markAsRead(id: number): Observable<any> {
    return this.apiService.put<any>(`/base/notifications/${id}/read`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.apiService.put<any>('/base/notifications/read-all', {});
  }

  sendNotification(title: string, message: string, targetRole: string): Observable<any> {
    return this.apiService.post<any>('/base/notifications/send', {
      title,
      message,
      target_role: targetRole
    });
  }
}
