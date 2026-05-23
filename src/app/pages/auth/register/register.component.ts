import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/request.model';
import { DepartmentService } from '../../../core/services/department.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  email = '';
  password = '';
  confirmPassword = '';
  fullName = '';
  role: RegisterRequest['role'] = 'STUDENT';
  departmentId: number | null = null;

  showPassword = false;
  isLoading = false;
      /**
   * Danh sách role cho dropdown
   */
  roles: { value: RegisterRequest['role']; label: string }[] = [
    { value: 'STUDENT', label: 'Sinh viên' },
    { value: 'GVHD', label: 'Giảng viên Hướng dẫn' },
    { value: 'LDKBM', label: 'Lãnh đạo Khoa / Bộ môn' },
    { value: 'COMPANY_SUPERVISOR', label: 'Người hướng dẫn Doanh nghiệp' },
    { value: 'ADMIN', label: 'Quản trị viên' },
  ];

  facultyId: number | null = null;
  subDepartmentId: number | null = null;
  
  faculties: any[] = [];
  subDepartments: any[] = [];

  constructor(private toastService: ToastService, private authService: AuthService, 
    private router: Router,
    private departmentService: DepartmentService) {}

  ngOnInit(): void {
    this.departmentService.getDepartments({ page: 1, limit: 1000 }).subscribe({
      next: (res) => {
        this.faculties = res.data.filter((d: any) => d.status === 'ACTIVE') || [];
      }
    });
  }

  onFacultyChange(): void {
    this.subDepartmentId = null;
    this.subDepartments = [];
    if (this.facultyId) {
      this.departmentService.getChildren(this.facultyId).subscribe({
        next: (res) => {
          this.subDepartments = res.filter((d: any) => d.status === 'ACTIVE') || [];
        }
      });
    }
  }

  onSubmit() {
    // Validate
    if (!this.fullName || !this.email || !this.password || !this.confirmPassword) {
      this.toastService.error('Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.toastService.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (this.password.length < 6) {
      this.toastService.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    this.isLoading = true;
    const finalDepartmentId = this.subDepartmentId ? this.subDepartmentId : this.facultyId;

    const request: RegisterRequest = {
      email: this.email,
      password: this.password,
      full_name: this.fullName,
      role: this.role,
      department_id: finalDepartmentId,
    };

    this.authService.register(request).subscribe({
      next: () => {
        this.isLoading = false;
        // Đăng ký thành công → auto login → redirect dashboard
        const dashboardRoute = this.authService.getRoleDashboardRoute();
        this.router.navigate([dashboardRoute]);
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(err?.message || err?.error?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    });
  }
}
