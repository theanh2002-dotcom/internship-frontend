import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit } from '@angular/core';
import { UserService, UserRequest } from '../../../core/services/user.service';
import { DepartmentService } from '../../../core/services/department.service';
import { UserResponse, PaginationRequest, DepartmentResponse } from '../../../core/models/base.model';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  isModalOpen = false;
  isLoading = false;
    currentPage = 1;
  pageSize = 10;
  totalItems = 0;

  users: UserResponse[] = [];
  departments: DepartmentResponse[] = [];

  isEditMode = false;
  editingId: number | null = null;
  
  formEmail = '';
  formPassword = '';
  formFullName = '';
  formRole = '';
  formFacultyId: number | null = null;
  formSubDepartmentId: number | null = null;

  faculties: DepartmentResponse[] = [];
  subDepartments: DepartmentResponse[] = [];

  roles = [
    { value: 'ADMIN', label: 'Quản trị viên (Admin)' },
    { value: 'LDKBM', label: 'Lãnh đạo Khoa/Bộ môn' },
    { value: 'GVHD', label: 'Giáo viên hướng dẫn' },
    { value: 'STUDENT', label: 'Sinh viên' },
    { value: 'COMPANY_SUPERVISOR', label: 'Cán bộ hướng dẫn (Doanh nghiệp)' }
  ];

  searchQuery = '';
  selectedRole = '';
  selectedFacultyId: number | null = null;

  constructor(private toastService: ToastService, private userService: UserService,
    private departmentService: DepartmentService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadFaculties();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    const request: PaginationRequest = {
      page: this.currentPage,
      limit: this.pageSize,
      searchText: this.searchQuery ? this.searchQuery.trim() : undefined
    };

    this.userService.getUsers(
      request,
      this.selectedRole || undefined,
      this.selectedFacultyId || undefined
    ).subscribe({
      next: (pagination) => {
        this.users = pagination.data || [];
        this.totalItems = pagination.total || 0;
        this.currentPage = pagination.current_page || 1;
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.error(err?.message || 'Không thể tải danh sách tài khoản');
        this.isLoading = false;
      }
    });
  }

  loadFaculties(): void {
    this.departmentService.getDepartments({ page: 1, limit: 1000 }).subscribe({
      next: (res) => {
        this.faculties = res.data.filter(d => d.status === 'ACTIVE') || [];
      }
    });
  }

  onFacultyChange(resetSubDept = true): void {
    if (resetSubDept) {
      this.formSubDepartmentId = null;
    }
    this.subDepartments = [];
    if (this.formFacultyId) {
      this.departmentService.getChildren(this.formFacultyId).subscribe({
        next: (res) => {
          this.subDepartments = res.filter(d => d.status === 'ACTIVE') || [];
        }
      });
    }
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.resetForm();
    this.isModalOpen = true;
  }

  openEditModal(user: UserResponse): void {
    this.isEditMode = true;
    this.editingId = user.id;
    this.formEmail = user.email || '';
    this.formFullName = user.full_name || '';
    this.formRole = user.role || '';
    
    // Determine faculty and sub-department from single department_id
    this.formFacultyId = null;
    this.formSubDepartmentId = null;
    this.subDepartments = [];
    
    if (user.department_id) {
      this.departmentService.getById(user.department_id).subscribe({
        next: (dept) => {
          if (dept.parent_id) {
             this.formFacultyId = dept.parent_id;
             this.formSubDepartmentId = user.department_id;
             this.onFacultyChange(false); // load subs but don't reset formSubDepartmentId
          } else {
             this.formFacultyId = user.department_id;
             this.onFacultyChange(false); // load subs for this faculty so user can select them
          }
        }
      });
    }

    this.formPassword = ''; // Không hiển thị password cũ
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  resetForm(): void {
    this.formEmail = '';
    this.formPassword = '';
    this.formFullName = '';
    this.formRole = '';
    this.formFacultyId = null;
    this.formSubDepartmentId = null;
    this.subDepartments = [];
  }

  saveUser(): void {
    if (!this.formEmail.trim()) {
      this.toastService.error('Vui lòng nhập Email');
      return;
    }
    if (!this.isEditMode && !this.formPassword.trim()) {
      this.toastService.error('Vui lòng nhập Mật khẩu cho tài khoản mới');
      return;
    }
    if (!this.formFullName.trim()) {
      this.toastService.error('Vui lòng nhập Họ và tên');
      return;
    }
    if (!this.formRole) {
      this.toastService.error('Vui lòng chọn Quyền (Role)');
      return;
    }

    const finalDepartmentId = this.formSubDepartmentId ? this.formSubDepartmentId : this.formFacultyId;

    const request: UserRequest = {
      email: this.formEmail.trim(),
      password: this.formPassword.trim() || undefined,
      full_name: this.formFullName.trim(),
      role: this.formRole,
      department_id: finalDepartmentId
    };

    this.isLoading = true;

    if (this.isEditMode && this.editingId) {
      this.userService.update(this.editingId, request).subscribe({
        next: () => {
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => {
          this.toastService.error(err?.message || 'Cập nhật thất bại');
          this.isLoading = false;
        }
      });
    } else {
      this.userService.create(request).subscribe({
        next: () => {
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => {
          this.toastService.error(err?.message || 'Tạo mới thất bại');
          this.isLoading = false;
        }
      });
    }
  }

  toggleStatus(user: UserResponse): void {
    this.userService.toggleStatus(user.id).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => {
        this.toastService.error(err?.message || 'Đổi trạng thái thất bại');
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  getStatusLabel(status: string): string {
    return status === 'ACTIVE' ? 'Đang hoạt động' : 'Bị khóa';
  }

  getRoleLabel(role: string): string {
    const found = this.roles.find(r => r.value === role);
    return found ? found.label : role;
  }
}
