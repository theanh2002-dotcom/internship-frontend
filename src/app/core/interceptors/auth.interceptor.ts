import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService, private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();

    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token hết hạn hoặc không hợp lệ → auto logout
          this.authService.logout();
        } else if (error.status === 403) {
          // Nếu token không còn hợp lệ (backend trả 403 do anonymous) → logout
          const token = this.authService.getToken();
          if (!token) {
            // Không có token → chắc chắn phải login lại
            this.authService.logout();
          } else {
            // Có token nhưng vẫn bị 403 → token hết hạn hoặc không có quyền
            // Thử decode token để kiểm tra hết hạn
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              const isExpired = payload.exp * 1000 < Date.now();
              if (isExpired) {
                this.authService.logout();
              } else {
                // Token còn hạn nhưng không có quyền → redirect về dashboard
                const dashboardRoute = this.authService.getRoleDashboardRoute();
                this.router.navigate([dashboardRoute]);
              }
            } catch {
              // Token không decode được → logout
              this.authService.logout();
            }
          }
        }
        return throwError(() => error);
      })
    );
  }
}
