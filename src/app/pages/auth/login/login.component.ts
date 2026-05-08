import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Vui lòng nhập đầy đủ email và mật khẩu';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({
      email: this.email,
      password: this.password,
    }).subscribe({
      next: () => {
        this.isLoading = false;
        // Điều hướng về dashboard tương ứng với role
        const dashboardRoute = this.authService.getRoleDashboardRoute();
        this.router.navigate([dashboardRoute]);
      },
      error: (err) => {
        this.isLoading = false;
        // Backend trả { status: 0, message: "..." } — ApiService formatErrors trả error.error
        this.errorMessage = err?.message || err?.error?.message || 'Tài khoản hoặc mật khẩu không chính xác.';
      }
    });
  }
}
