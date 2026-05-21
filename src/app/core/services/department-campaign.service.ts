import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface RubricItem {
  score_level: number;
  description: string;
}

export interface CloItem {
  clo_code: string;
  description: string;
  alpha_weight: number;
  gvhd_beta: number;
  company_beta: number;
  rubrics: RubricItem[];
}

export interface CloConfigRequest {
  department_campaign_id: number;
  stage1_weight: number;
  stage2_weight: number;
  clos: CloItem[];
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentCampaignService {
  constructor(private apiService: ApiService) {}

  // Lấy hoặc tạo mới cấu hình department_campaign (trả về { id, department_id, campaign_id, ... })
  findOrCreate(campaignId: number, departmentId: number): Observable<any> {
    return this.apiService.get<any>(`/base/department-campaigns/find?campaign_id=${campaignId}&department_id=${departmentId}`);
  }

  // Lấy danh sách CLO configs (đã mapping rubrics) theo departmentCampaignId
  getCloConfigs(departmentCampaignId: number): Observable<any> {
    return this.apiService.get<any>(`/base/department-campaigns/${departmentCampaignId}/clo-configs`);
  }

  // Lưu cấu hình CLO & Rubric
  saveCloConfigs(request: CloConfigRequest): Observable<any> {
    return this.apiService.post<any>('/base/department-campaigns/clo-configs', request);
  }
}
