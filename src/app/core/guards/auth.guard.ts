import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * AuthGuard: Bảo vệ route yêu cầu đăng nhập.
 * Nếu chưa login → redirect về /auth/login
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
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
