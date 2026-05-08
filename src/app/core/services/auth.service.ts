import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { LoginRequest, RegisterRequest } from '../models/request.model';
import { LoginResponse, UserInfo } from '../models/base.model';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

const STORAGE_KEY_TOKEN = 'token';
const STORAGE_KEY_USER = 'user_info';

/**
 * Mapping role backend → route dashboard frontend
 */
const ROLE_DASHBOARD_MAP: Record<string, string> = {
  'ADMIN': '/admin/dashboard',
  'LDKBM': '/ldkbm/general-dashboard',
  'GVHD': '/teacher/dashboard',
  'STUDENT': '/student/dashboard',
  'COMPANY_SUPERVISOR': '/company/dashboard',
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private apiService: ApiService, private router: Router) {}

  /**
   * Gọi API login thật → lưu token + user info vào localStorage
   */
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('/base/auth/login', request).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem(STORAGE_KEY_TOKEN, response.token);
          // Lưu user info
          const userInfo: UserInfo = {
            userId: response.user_id,
            email: response.email,
            fullName: response.full_name,
            role: response.role,
            departmentId: response.department_id,
          };
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userInfo));
        }
      })
    );
  }

  /**
   * Xóa token + user info, redirect về login
   */
  logout(): void {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Kiểm tra đã đăng nhập chưa
   */
  isLoggedIn(): boolean {
    return !!localStorage.getItem(STORAGE_KEY_TOKEN);
  }

  /**
   * Lấy JWT token
   */
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  }

  /**
   * Lấy thông tin user đang đăng nhập
   */
  getCurrentUser(): UserInfo | null {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserInfo;
    } catch {
      return null;
    }
  }

  /**
   * Lấy role hiện tại
   */
  getRole(): string {
    return this.getCurrentUser()?.role || '';
  }

  /**
   * Trả về route dashboard tương ứng với role hiện tại
   */
  getRoleDashboardRoute(): string {
    const role = this.getRole();
    return ROLE_DASHBOARD_MAP[role] || '/auth/login';
  }

  /**
   * Gọi API đăng ký → tự động lưu token + user info (đăng nhập luôn sau đăng ký)
   */
  register(request: RegisterRequest): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('/base/auth/register', request).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem(STORAGE_KEY_TOKEN, response.token);
          const userInfo: UserInfo = {
            userId: response.user_id,
            email: response.email,
            fullName: response.full_name,
            role: response.role,
            departmentId: response.department_id,
          };
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userInfo));
        }
      })
    );
  }
}
