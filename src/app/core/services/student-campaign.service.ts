import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { BasePagination, PaginationRequest } from '../models/base.model';
import { 
  AssignRequest, 
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
      .set('size', pageRequest.size.toString());
      
    return this.apiService.get<BasePagination<any>>('/base/student-campaigns', params);
  }

  importStudents(request: ImportStudentRequest): Observable<any> {
    return this.apiService.post<any>('/base/student-campaigns/import', request);
  }

  assignGvhd(request: AssignRequest): Observable<any> {
    return this.apiService.post<any>('/base/student-campaigns/assign', request);
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
}
