import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { BasePagination, PaginationRequest } from '../models/base.model';
import { 
  AssignRequest, 
  AssignmentStatsResponse,
  EligibleTeacherResponse,
  AutoAssignPreviewResponse,
  AutoAssignRequest,
  CompanyInfoRequest, 
  ImportStudentRequest, 
  InternshipPlanRequest 
} from '../models/request.model';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class StudentCampaignService {
  constructor(private apiService: ApiService) {}

  findByCampaignAndDepartment(campaignId: number, departmentId: number, pageRequest: PaginationRequest): Observable<BasePagination<any>> {
    let params = new HttpParams()
      .set('campaign_id', campaignId.toString())
      .set('department_id', departmentId.toString())
      .set('page', pageRequest.page.toString())
      .set('limit', pageRequest.limit.toString());
      
    if (pageRequest.searchText) {
      params = params.set('searchText', pageRequest.searchText);
    }
      
    return this.apiService.get<BasePagination<any>>('/base/student-campaigns', params);
  }

  getMyCampaigns(): Observable<any> {
    return this.apiService.get<any>('/base/student-campaigns/my-campaigns');
  }

  getMyAssignedStudents(): Observable<any> {
    return this.apiService.get<any>('/base/student-campaigns/my-students');
  }

  getMyGuidedStudents(): Observable<any> {
    return this.apiService.get<any>('/base/student-campaigns/my-guided-students');
  }

  findById(id: number): Observable<any> {
    return this.apiService.get<any>(`/base/student-campaigns/${id}`);
  }

  importStudents(request: ImportStudentRequest): Observable<any> {
    return this.apiService.post<any>('/base/student-campaigns/import', request);
  }

  assignGvhd(request: AssignRequest): Observable<any> {
    return this.apiService.post<any>('/base/student-campaigns/assign', request);
  }

  getAssignmentStats(campaignId: number, departmentId: number): Observable<AssignmentStatsResponse[]> {
    const params = new HttpParams()
      .set('campaign_id', campaignId.toString())
      .set('department_id', departmentId.toString());

    return this.apiService.get<AssignmentStatsResponse[]>('/base/student-campaigns/assignment-stats', params);
  }

  getEligibleTeachers(campaignId: number, departmentId: number): Observable<EligibleTeacherResponse[]> {
    const params = new HttpParams()
      .set('campaign_id', campaignId.toString())
      .set('department_id', departmentId.toString());

    return this.apiService.get<EligibleTeacherResponse[]>('/base/student-campaigns/eligible-teachers', params);
  }

  inviteTeacher(campaignId: number, departmentId: number, teacherId: number): Observable<EligibleTeacherResponse> {
    const query = `?campaign_id=${campaignId}&department_id=${departmentId}`;
    return this.apiService.post<EligibleTeacherResponse>(`/base/student-campaigns/eligible-teachers/${teacherId}${query}`, {});
  }

  removeInvitedTeacher(campaignId: number, departmentId: number, teacherId: number): Observable<any> {
    const query = `?campaign_id=${campaignId}&department_id=${departmentId}`;
    return this.apiService.delete<any>(`/base/student-campaigns/eligible-teachers/${teacherId}${query}`);
  }

  previewAutoAssign(request: AutoAssignRequest): Observable<AutoAssignPreviewResponse> {
    return this.apiService.post<AutoAssignPreviewResponse>('/base/student-campaigns/auto-assign/preview', request);
  }

  applyAutoAssign(request: AutoAssignRequest): Observable<AutoAssignPreviewResponse> {
    return this.apiService.post<AutoAssignPreviewResponse>('/base/student-campaigns/auto-assign/apply', request);
  }

  submitCompanyInfo(id: number, request: CompanyInfoRequest): Observable<any> {
    return this.apiService.post<any>(`/base/student-campaigns/${id}/company-info`, request);
  }

  approveCompanyInfo(id: number): Observable<any> {
    return this.apiService.patch<any>(`/base/student-campaigns/${id}/company-info/approve`);
  }

  submitInternshipPlan(request: InternshipPlanRequest): Observable<any> {
    return this.apiService.post<any>('/base/student-campaigns/internship-plan', request);
  }

  approveInternshipPlan(id: number): Observable<any> {
    return this.apiService.patch<any>(`/base/student-campaigns/${id}/internship-plan/approve`);
  }

  getCompanyStudents(campaignId?: number | null): Observable<any> {
    let params = new HttpParams();
    if (campaignId) {
      params = params.set('campaign_id', campaignId.toString());
    }
    return this.apiService.get<any>('/base/student-campaigns/company-students', params);
  }

  approvePlanByCompany(id: number): Observable<any> {
    return this.apiService.patch<any>(`/base/student-campaigns/${id}/internship-plan/company-approve`);
  }

  deleteStudentCampaign(id: number): Observable<any> {
    return this.apiService.delete<any>(`/base/student-campaigns/${id}`);
  }
}
