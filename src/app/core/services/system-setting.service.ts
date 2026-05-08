import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { SystemSettingResponse } from '../models/base.model';

export interface SystemSettingBulkRequest {
  settings: { [key: string]: string };
}

export interface BaseResponse<T> {
  data: T;
  success?: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SystemSettingService {
  constructor(private apiService: ApiService) {}

  getAll(): Observable<BaseResponse<SystemSettingResponse[]>> {
    return this.apiService.get<BaseResponse<SystemSettingResponse[]>>('/base/settings');
  }

  updateBulk(request: SystemSettingBulkRequest): Observable<BaseResponse<any>> {
    return this.apiService.post<BaseResponse<any>>('/base/settings/bulk-update', request);
  }
}
