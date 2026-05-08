import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface FileResponse {
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  constructor(private apiService: ApiService) {}

  uploadFile(file: File): Observable<FileResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiService.post<FileResponse>('/base/files/upload', formData);
  }
}
