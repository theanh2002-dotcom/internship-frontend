import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { BaseResponse } from '../models/base.model';

/**
 * Map HTTP status code → thông báo lỗi tiếng Việt thân thiện
 */
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Dữ liệu gửi lên không hợp lệ',
  401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại',
  403: 'Bạn không có quyền truy cập chức năng này',
  404: 'Không tìm thấy dữ liệu yêu cầu',
  409: 'Dữ liệu bị trùng lặp',
  422: 'Dữ liệu không hợp lệ',
  500: 'Lỗi hệ thống. Vui lòng thử lại sau',
  502: 'Máy chủ đang bảo trì. Vui lòng thử lại sau',
  503: 'Dịch vụ tạm thời không khả dụng',
  0: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng',
};

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Chuyển lỗi HTTP thành message thân thiện, không bắn lỗi thô ra giao diện
   */
  private formatErrors(error: HttpErrorResponse | any) {
    // Nếu backend trả về BaseResponse có message
    if (error?.error?.message) {
      return throwError(() => ({ message: error.error.message, status: error.status }));
    }
    // Nếu là HttpErrorResponse, map sang message tiếng Việt
    if (error instanceof HttpErrorResponse) {
      const friendlyMessage = ERROR_MESSAGES[error.status] || `Lỗi không xác định (${error.status})`;
      return throwError(() => ({ message: friendlyMessage, status: error.status }));
    }
    // Fallback
    return throwError(() => ({ message: error?.message || 'Đã xảy ra lỗi. Vui lòng thử lại', status: 0 }));
  }

  get<T>(path: string, params: HttpParams = new HttpParams()): Observable<T> {
    return this.http.get<BaseResponse<T>>(`${this.apiUrl}${path}`, { params })
      .pipe(
        map(response => {
          if (response.status === 0) {
            throw new Error(response.message);
          }
          return response.payload;
        }),
        catchError(err => this.formatErrors(err))
      );
  }

  post<T>(path: string, body: Object = {}): Observable<T> {
    return this.http.post<BaseResponse<T>>(`${this.apiUrl}${path}`, body)
      .pipe(
        map(response => {
          if (response.status === 0) {
            throw new Error(response.message);
          }
          return response.payload;
        }),
        catchError(err => this.formatErrors(err))
      );
  }

  patch<T>(path: string, body: Object = {}): Observable<T> {
    return this.http.patch<BaseResponse<T>>(`${this.apiUrl}${path}`, body)
      .pipe(
        map(response => {
          if (response.status === 0) {
            throw new Error(response.message);
          }
          return response.payload;
        }),
        catchError(err => this.formatErrors(err))
      );
  }

  put<T>(path: string, body: Object = {}): Observable<T> {
    return this.http.put<BaseResponse<T>>(`${this.apiUrl}${path}`, body)
      .pipe(
        map(response => {
          if (response.status === 0) {
            throw new Error(response.message);
          }
          return response.payload;
        }),
        catchError(err => this.formatErrors(err))
      );
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<BaseResponse<T>>(`${this.apiUrl}${path}`)
      .pipe(
        map(response => {
          if (response.status === 0) {
            throw new Error(response.message);
          }
          return response.payload;
        }),
        catchError(err => this.formatErrors(err))
      );
  }
}
