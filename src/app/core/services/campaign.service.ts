import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { BasePagination, PaginationRequest, CampaignResponse } from '../models/base.model';
import { HttpParams } from '@angular/common/http';

/**
 * Khớp backend CampaignRequest.java
 * { code, name, academic_year, semester, description, start_date, end_date }
 */
export interface CampaignRequest {
  code: string;
  name: string;
  academic_year?: string;
  semester?: number | null;
  description?: string;
  start_date: string;  // ISO: "yyyy-MM-ddTHH:mm:ss"
  end_date: string;
  tttn01_start_date?: string;
  tttn01_deadline?: string;
  tttn02_start_date?: string;
  tttn02_deadline?: string;
  tttn03_start_date?: string;
  tttn03_deadline?: string;
  midterm_start_date?: string;
  midterm_deadline?: string;
  tttn06_start_date?: string;
  tttn06_deadline?: string;
  grade_deadline?: string;
  department_ids?: number[];
}

export interface CampaignTimelinePreviewRequest {
  start_date: string;
  end_date: string;
  week_count?: number;
}

export interface CampaignTimelinePreviewResponse {
  week_count: number;
  start_date: string;
  end_date: string;
  tttn01_start_date: string;
  tttn01_deadline: string;
  tttn02_start_date: string;
  tttn02_deadline: string;
  tttn03_start_date: string;
  tttn03_deadline: string;
  midterm_start_date: string;
  midterm_deadline: string;
  tttn06_start_date: string;
  tttn06_deadline: string;
  grade_deadline: string;
}

@Injectable({
  providedIn: 'root'
})
export class CampaignService {
  constructor(private apiService: ApiService) {}

  /**
   * GET /base/campaigns?page=1&limit=20
   */
  getCampaigns(pageRequest: PaginationRequest, status?: string, academicYear?: string): Observable<BasePagination<CampaignResponse>> {
    let params = new HttpParams()
      .set('page', pageRequest.page.toString())
      .set('limit', pageRequest.limit.toString());

    if (pageRequest.searchText) {
      params = params.set('searchText', pageRequest.searchText);
    }
    if (pageRequest.orderBy) {
      params = params.set('orderBy', pageRequest.orderBy);
    }
    if (status) {
      params = params.set('status', status);
    }
    if (academicYear) {
      params = params.set('academicYear', academicYear);
    }

    return this.apiService.get<BasePagination<CampaignResponse>>('/base/campaigns', params);
  }

  /**
   * GET /base/campaigns/{id}
   */
  getById(id: number): Observable<CampaignResponse> {
    return this.apiService.get<CampaignResponse>(`/base/campaigns/${id}`);
  }

  /**
   * POST /base/campaigns
   */
  create(request: CampaignRequest): Observable<CampaignResponse> {
    return this.apiService.post<CampaignResponse>('/base/campaigns', request);
  }

  previewTimeline(request: CampaignTimelinePreviewRequest): Observable<CampaignTimelinePreviewResponse> {
    return this.apiService.post<CampaignTimelinePreviewResponse>('/base/campaigns/timeline-preview', request);
  }

  /**
   * PUT /base/campaigns/{id}
   */
  update(id: number, request: CampaignRequest): Observable<CampaignResponse> {
    return this.apiService.put<CampaignResponse>(`/base/campaigns/${id}`, request);
  }

  /**
   * PATCH /base/campaigns/{id}/toggle — toggle ACTIVE ↔ INACTIVE
   */
  toggleStatus(id: number): Observable<any> {
    return this.apiService.patch<any>(`/base/campaigns/${id}/toggle`);
  }

  /**
   * GET /base/campaigns/options - lấy danh sách Campaign cơ bản (ID và Tên) cho dropdown
   */
  getCampaignOptions(status?: string): Observable<any> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.apiService.get<any>('/base/campaigns/options', params);
  }
}
