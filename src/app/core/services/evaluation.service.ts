import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  constructor(
    private apiService: ApiService,
    private http: HttpClient
  ) {}

  submitEvaluation(request: EvaluationRequest): Observable<any> {
    return this.apiService.post<any>('/base/evaluations', request);
  }

  findEvaluations(studentCampaignId: number): Observable<any> {
    return this.apiService.get<any>(`/base/evaluations?student_campaign_id=${studentCampaignId}`);
  }

  findEvaluationsByStudents(studentCampaignIds: number[]): Observable<any> {
    return this.apiService.post<any>('/base/evaluations/statuses', studentCampaignIds);
  }

  getFinalResult(studentCampaignId: number): Observable<any> {
    return this.apiService.get<any>(`/base/evaluations/final-result/${studentCampaignId}`);
  }

  calculateFinalResult(studentCampaignId: number): Observable<any> {
    return this.apiService.post<any>(`/base/evaluations/final-result/${studentCampaignId}`, {});
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

  exportStage1Tttn04(studentCampaignId: number): Observable<Blob> {
    return this.http.get(
      `${environment.apiUrl}/base/evaluations/stage1/${studentCampaignId}/tttn-04`,
      { responseType: 'blob' }
    );
  }

  exportStage2Tttn05(studentCampaignId: number): Observable<Blob> {
    return this.http.get(
      `${environment.apiUrl}/base/evaluations/stage2/${studentCampaignId}/tttn-05`,
      { responseType: 'blob' }
    );
  }

  exportTttn07Zip(studentCampaignIds: number[]): Observable<Blob> {
    return this.http.post(
      `${environment.apiUrl}/base/evaluations/tttn-07/export`,
      studentCampaignIds,
      { responseType: 'blob' }
    );
  }
}
