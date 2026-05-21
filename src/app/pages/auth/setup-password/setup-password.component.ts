import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-setup-password',
  templateUrl: './setup-password.component.html',
  styleUrls: ['./setup-password.component.scss']
})
export class SetupPasswordComponent implements OnInit {
  setupForm: FormGroup;
  token: string | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  passwordFieldType = 'password';
  confirmPasswordFieldType = 'password';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.setupForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.errorMessage = 'Đường dẫn không hợp lệ. Không tìm thấy mã xác thực.';
      }
    });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordFieldType = this.confirmPasswordFieldType === 'password' ? 'text' : 'password';
  }

  onSubmit(): void {
    if (this.setupForm.invalid || !this.token) {
      this.setupForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const req = {
      token: this.token,
      newPassword: this.setupForm.value.newPassword
    };

    this.authService.setupPassword(req).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Thiết lập mật khẩu thành công! Bạn sẽ được chuyển về trang Đăng nhập...';
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Lỗi khi thiết lập mật khẩu.';
      }
    });
  }
}
