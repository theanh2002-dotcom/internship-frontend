import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { BasePagination, PaginationRequest, UserResponse } from '../models/base.model';
import { HttpParams } from '@angular/common/http';

export interface UserRequest {
  email: string;
  password?: string;
  full_name: string;
  role: string;
  department_id?: number | null;
  phone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private apiService: ApiService) {}

  getUsers(pageRequest: PaginationRequest, role?: string, departmentId?: number): Observable<BasePagination<UserResponse>> {
    let params = new HttpParams()
      .set('page', pageRequest.page.toString())
      .set('limit', pageRequest.limit.toString());

    if (pageRequest.searchText) {
      params = params.set('searchText', pageRequest.searchText);
    }
    if (pageRequest.orderBy) {
      params = params.set('orderBy', pageRequest.orderBy);
    }
    if (role) {
      params = params.set('role', role);
    }
    if (departmentId) {
      params = params.set('departmentId', departmentId.toString());
    }

    return this.apiService.get<BasePagination<UserResponse>>('/base/users', params);
  }

  getById(id: number): Observable<UserResponse> {
    return this.apiService.get<UserResponse>(`/base/users/${id}`);
  }

  create(request: UserRequest): Observable<UserResponse> {
    return this.apiService.post<UserResponse>('/base/users', request);
  }

  update(id: number, request: UserRequest): Observable<UserResponse> {
    return this.apiService.put<UserResponse>(`/base/users/${id}`, request);
  }

  toggleStatus(id: number): Observable<any> {
    return this.apiService.patch<any>(`/base/users/${id}/toggle`);
  }
}
