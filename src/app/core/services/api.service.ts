import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { BaseResponse } from '../models/base.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private formatErrors(error: any) {
    return throwError(() => error.error || error);
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
        catchError(this.formatErrors)
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
        catchError(this.formatErrors)
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
        catchError(this.formatErrors)
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
        catchError(this.formatErrors)
      );
  }
}
