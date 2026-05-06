import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username = '';
  password = '';
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Để phục vụ quá trình test MVP, tự động điều hướng thành công sau 1s
    setTimeout(() => {
      // Hardcode logic for demo
      if (this.username.toLowerCase().includes('sv')) {
        this.router.navigate(['/student/dashboard']);
      } else if (this.username.toLowerCase().includes('gv')) {
        this.router.navigate(['/teacher/dashboard']);
      } else {
        this.router.navigate(['/admin/dashboard']);
      }
      this.isLoading = false;
    }, 800);
    
    /* 
    // GỌI API THẬT
    this.authService.login({
      username: this.username,
      password: this.password,
      loginType: 'NORMAL'
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Tài khoản hoặc mật khẩu không chính xác.';
      }
    });
    */
  }
}
