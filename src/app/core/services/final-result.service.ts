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
  stage_1_score?: number;
  stage_2_score?: number;
  stage1_score?: number;
  stage2_score?: number;
  final_hp_score: number | null;
  grade_level: string;
  is_paralyzed: boolean;
  is_approved: boolean;
  stage1_locked?: boolean;
  stage2_locked?: boolean;
  stage1_gvhd_locked?: boolean;
  stage1_company_locked?: boolean;
  stage2_gvhd_locked?: boolean;
  stage2_company_locked?: boolean;
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

  lockFinalResultStage(
    studentCampaignId: number,
    stage: 'STAGE_1' | 'STAGE_2',
    evaluatorType: 'GVHD' | 'COMPANY_SUPERVISOR'
  ): Observable<any> {
    return this.apiService.patch<any>(
      `/base/evaluations/final-result/${studentCampaignId}/lock?stage=${stage}&evaluator_type=${evaluatorType}`,
      {}
    );
  }

  getFinalResultsByCampaign(departmentCampaignId: number): Observable<FinalResultResponse[]> {
    return this.apiService.get<FinalResultResponse[]>(`/base/final-results?department_campaign_id=${departmentCampaignId}`);
  }

  getMyFinalResult(): Observable<FinalResultResponse> {
    return this.apiService.get<FinalResultResponse>('/base/final-results/my-result');
  }
}
