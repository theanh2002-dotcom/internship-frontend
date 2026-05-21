import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { BaseResponse } from '../models/base.model';

export interface FinalResultResponse {
  id?: number;
  student_campaign_id: number;
  student_code: string;
  full_name: string;
  class_name: string;
  stage_1_score: number;
  stage_2_score: number;
  final_hp_score: number;
  grade_level: string;
  is_paralyzed: boolean;
  is_approved: boolean;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class FinalResultService {

  constructor(private apiService: ApiService) {}

  approveFinalResult(studentCampaignId: number): Observable<any> {
    return this.apiService.patch<any>(`/base/final-results/${studentCampaignId}/approve`, {});
  }

  getFinalResultsByCampaign(departmentCampaignId: number): Observable<FinalResultResponse[]> {
    return this.apiService.get<FinalResultResponse[]>(`/base/final-results?department_campaign_id=${departmentCampaignId}`);
  }
}
