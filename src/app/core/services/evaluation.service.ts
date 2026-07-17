import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface ScoreItem {
  clo_code: string;
  score_level: number;
  comment?: string;
}

export interface EvaluationRequest {
  student_campaign_id: number;
  evaluator_type: 'GVHD' | 'COMPANY' | 'COUNCIL' | 'COMPANY_SUPERVISOR' | 'COMMITTEE_MEMBER';
  evaluator_id: number;
  stage: 'STAGE_1' | 'STAGE_2';
  general_comment?: string;
  scores: ScoreItem[];
}

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  constructor(private apiService: ApiService) {}

  submitEvaluation(request: EvaluationRequest): Observable<any> {
    return this.apiService.post<any>('/base/evaluations', request);
  }

  findEvaluations(studentCampaignId: number): Observable<any> {
    return this.apiService.get<any>(`/base/evaluations?student_campaign_id=${studentCampaignId}`);
  }

  getFinalResult(studentCampaignId: number): Observable<any> {
    return this.apiService.get<any>(`/base/evaluations/final-result/${studentCampaignId}`);
  }

  calculateFinalResult(studentCampaignId: number): Observable<any> {
    return this.apiService.post<any>(`/base/evaluations/final-result/${studentCampaignId}`, {});
  }

  lockFinalResultStage(studentCampaignId: number, stage: 'STAGE_1' | 'STAGE_2'): Observable<any> {
    return this.apiService.patch<any>(`/base/evaluations/final-result/${studentCampaignId}/lock?stage=${stage}`, {});
  }
}

