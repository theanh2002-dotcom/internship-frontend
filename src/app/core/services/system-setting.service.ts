import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { SystemSettingResponse } from '../models/base.model';

export interface SystemSettingBulkRequest {
  settings: { [key: string]: string };
}

@Injectable({
  providedIn: 'root'
})
export class SystemSettingService {
  constructor(private apiService: ApiService) {}

  getAll(): Observable<SystemSettingResponse[]> {
    return this.apiService.get<SystemSettingResponse[]>('/base/settings');
  }

  updateBulk(request: SystemSettingBulkRequest): Observable<string> {
    return this.apiService.post<string>('/base/settings/bulk-update', request);
  }
}
