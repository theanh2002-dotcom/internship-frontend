import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { BaseResponse } from '../models/base.model';

export interface SurveyRequest {
  student_campaign_id: number;
  survey_type: 'STUDENT_FEEDBACK' | 'COMPANY_FEEDBACK';
  answers: string; // JSON string representation
}

export interface SurveyResponse {
  id: number;
  student_campaign_id: number;
  survey_type: string;
  answers: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class SurveyService {

  constructor(private apiService: ApiService) {}

  submitSurvey(request: SurveyRequest): Observable<SurveyResponse> {
    return this.apiService.post<SurveyResponse>('/base/surveys', request);
  }

  getSurvey(studentCampaignId: number, surveyType: string): Observable<SurveyResponse> {
    return this.apiService.get<SurveyResponse>(`/base/surveys/${studentCampaignId}/${surveyType}`);
  }

  getSurveysByCampaign(departmentCampaignId: number): Observable<SurveyResponse[]> {
    return this.apiService.get<SurveyResponse[]>(`/base/surveys?department_campaign_id=${departmentCampaignId}`);
  }
}
