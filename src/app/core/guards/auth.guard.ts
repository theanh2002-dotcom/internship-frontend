import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * AuthGuard: Bảo vệ route yêu cầu đăng nhập và phân quyền.
 * Nếu chưa login → redirect về /auth/login
 * Nếu sai phân quyền → redirect về dashboard thích hợp
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isLoggedIn()) {
      const url = state.url;
      const role = this.authService.getRole();

      if (url.startsWith('/admin') && role !== 'ADMIN') {
        this.router.navigate([this.authService.getRoleDashboardRoute()]);
        return false;
      }
      if (url.startsWith('/ldkbm') && role !== 'LDKBM') {
        this.router.navigate([this.authService.getRoleDashboardRoute()]);
        return false;
      }
      if (url.startsWith('/teacher') && role !== 'GVHD') {
        this.router.navigate([this.authService.getRoleDashboardRoute()]);
        return false;
      }
      if (url.startsWith('/student') && role !== 'STUDENT') {
        this.router.navigate([this.authService.getRoleDashboardRoute()]);
        return false;
      }
      if (url.startsWith('/company') && role !== 'COMPANY_SUPERVISOR') {
        this.router.navigate([this.authService.getRoleDashboardRoute()]);
        return false;
      }

      return true;
    }
    this.router.navigate(['/auth/login']);
    return false;
  }
}

/**
 * LoginGuard: Ngăn truy cập trang login nếu đã đăng nhập.
 * Nếu đã login → redirect về dashboard theo role
 */
@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.authService.getRoleDashboardRoute()]);
      return false;
    }
    return true;
  }
}
