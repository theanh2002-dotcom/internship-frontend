import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { FinalReportRequest } from '../models/request.model';
import { FinalReportResponse } from '../models/base.model';

@Injectable({
  providedIn: 'root'
})
export class FinalReportService {
  constructor(private apiService: ApiService) {}

  submitFinalReports(request: FinalReportRequest): Observable<FinalReportResponse[]> {
    return this.apiService.post<FinalReportResponse[]>('/base/final-reports', request);
  }

  getFinalReports(studentCampaignId: number): Observable<FinalReportResponse[]> {
    return this.apiService.get<FinalReportResponse[]>(`/base/final-reports?student_campaign_id=${studentCampaignId}`);
  }

  deleteFinalReport(id: number): Observable<any> {
    return this.apiService.delete<any>(`/base/final-reports/${id}`);
  }
}
