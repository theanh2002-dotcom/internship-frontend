import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { BasePagination, PaginationRequest } from '../models/base.model';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CampaignService {
  constructor(private apiService: ApiService) {}

  getCampaigns(pageRequest: PaginationRequest): Observable<BasePagination<any>> {
    let params = new HttpParams()
      .set('page', pageRequest.page.toString())
      .set('size', pageRequest.size.toString());
      
    return this.apiService.get<BasePagination<any>>('/base/campaigns', params);
  }

  createCampaign(request: any): Observable<any> {
    return this.apiService.post<any>('/base/campaigns', request);
  }
  
  updateStatus(id: number, status: string): Observable<any> {
    return this.apiService.patch<any>(`/base/campaigns/${id}/status`, { status });
  }
}
