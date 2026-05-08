import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { BasePagination, PaginationRequest, DepartmentResponse } from '../models/base.model';
import { HttpParams } from '@angular/common/http';

export interface DepartmentRequest {
  parent_id?: number | null;
  code: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  constructor(private apiService: ApiService) {}

  /** Lấy danh sách Khoa (top-level) — phân trang */
  getDepartments(pageRequest: PaginationRequest): Observable<BasePagination<DepartmentResponse>> {
    let params = new HttpParams()
      .set('page', pageRequest.page.toString())
      .set('limit', pageRequest.limit.toString());

    if (pageRequest.searchText) {
      params = params.set('searchText', pageRequest.searchText);
    }
    if (pageRequest.orderBy) {
      params = params.set('orderBy', pageRequest.orderBy);
    }

    return this.apiService.get<BasePagination<DepartmentResponse>>('/base/departments', params);
  }

  getById(id: number): Observable<DepartmentResponse> {
    return this.apiService.get<DepartmentResponse>(`/base/departments/${id}`);
  }

  /** Lấy danh sách Bộ môn thuộc Khoa */
  getChildren(parentId: number): Observable<DepartmentResponse[]> {
    return this.apiService.get<DepartmentResponse[]>(`/base/departments/${parentId}/children`);
  }

  create(request: DepartmentRequest): Observable<DepartmentResponse> {
    return this.apiService.post<DepartmentResponse>('/base/departments', request);
  }

  update(id: number, request: DepartmentRequest): Observable<DepartmentResponse> {
    return this.apiService.put<DepartmentResponse>(`/base/departments/${id}`, request);
  }

  toggleStatus(id: number): Observable<any> {
    return this.apiService.patch<any>(`/base/departments/${id}/toggle`);
  }
}
