import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { WeeklyLogRequest } from '../models/request.model';

@Injectable({
  providedIn: 'root'
})
export class WeeklyLogService {
  constructor(private apiService: ApiService) {}

  findByStudentCampaign(studentCampaignId: number): Observable<any> {
    return this.apiService.get<any>(`/base/weekly-logs?student_campaign_id=${studentCampaignId}`);
  }

  createOrUpdate(request: WeeklyLogRequest): Observable<any> {
    return this.apiService.post<any>('/base/weekly-logs', request);
  }

  approveWeeklyLog(id: number, comment?: string): Observable<any> {
    const url = comment ? `/base/weekly-logs/${id}/approve?comment=${encodeURIComponent(comment)}` : `/base/weekly-logs/${id}/approve`;
    return this.apiService.patch<any>(url);
  }
}
