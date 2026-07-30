import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { BaseResponse, StudentCampaignResponse, UserResponse } from '../models/base.model';

export interface CommitteeMemberRequest {
  user_id: number;
  role: string;
}

export interface CreateCommitteeRequest {
  department_campaign_id: number;
  name: string;
  evaluation_date?: string | null;
  room?: string | null;
  members: CommitteeMemberRequest[];
}

export interface CommitteeMemberResponse {
  id: number;
  user_id: number;
  role: string;
  full_name?: string;
  email?: string;
}

export interface CommitteeResponse {
  id: number;
  department_campaign_id: number;
  campaign_id?: number;
  department_id?: number;
  name: string;
  evaluation_date?: string;
  room?: string;
  members: CommitteeMemberResponse[];
  created_at: string;
}

export interface CommitteePageDataResponse {
  department_campaign: {
    id: number;
    campaign_id: number;
    department_id: number;
  };
  committees: CommitteeResponse[];
  teachers: UserResponse[];
  company_mentors: UserResponse[];
  students: StudentCampaignResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class CommitteeService {

  constructor(private apiService: ApiService) {}

  createCommittee(request: CreateCommitteeRequest): Observable<CommitteeResponse> {
    return this.apiService.post<CommitteeResponse>('/base/committees', request);
  }

  getCommittees(departmentCampaignId: number): Observable<CommitteeResponse[]> {
    return this.apiService.get<CommitteeResponse[]>(`/base/committees?department_campaign_id=${departmentCampaignId}`);
  }

  getCommitteePageData(campaignId: number, departmentId: number): Observable<CommitteePageDataResponse> {
    return this.apiService.get<CommitteePageDataResponse>(`/base/committees/page-data?campaign_id=${campaignId}&department_id=${departmentId}`);
  }

  getCommitteeById(id: number): Observable<CommitteeResponse> {
    return this.apiService.get<CommitteeResponse>(`/base/committees/${id}`);
  }

  getMyCommittees(): Observable<CommitteeResponse[]> {
    return this.apiService.get<CommitteeResponse[]>('/base/committees/my-committees');
  }

  updateCommittee(id: number, request: CreateCommitteeRequest): Observable<CommitteeResponse> {
    return this.apiService.put<CommitteeResponse>(`/base/committees/${id}`, request);
  }

  deleteCommittee(id: number): Observable<any> {
    return this.apiService.delete<any>(`/base/committees/${id}`);
  }

  assignStudents(committeeId: number, studentCampaignIds: number[]): Observable<any> {
    return this.apiService.post<any>(`/base/committees/${committeeId}/students`, studentCampaignIds);
  }
}
