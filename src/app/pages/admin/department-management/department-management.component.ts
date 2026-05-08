import { Component, OnInit } from '@angular/core';
import { DepartmentService, DepartmentRequest } from '../../../core/services/department.service';
import { DepartmentResponse, PaginationRequest } from '../../../core/models/base.model';

@Component({
  selector: 'app-department-management',
  templateUrl: './department-management.component.html',
  styleUrls: ['./department-management.component.scss']
})
export class DepartmentManagementComponent implements OnInit {
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // --- Khoa (left panel) ---
  faculties: DepartmentResponse[] = [];
  totalFaculties = 0;
  currentPage = 1;
  pageSize = 20;
  selectedFaculty: DepartmentResponse | null = null;

  // --- Bộ môn (right panel) ---
  subDepartments: DepartmentResponse[] = [];
  isLoadingSubs = false;

  // --- Modal ---
  isModalOpen = false;
  isEditMode = false;
  editingId: number | null = null;
  modalType: 'faculty' | 'sub' = 'faculty'; // Đang tạo/sửa Khoa hay Bộ môn
  formCode = '';
  formName = '';

  constructor(private departmentService: DepartmentService) {}

  ngOnInit(): void {
    this.loadFaculties();
  }

  // ==================== KHOA (LEFT PANEL) ====================

  loadFaculties(): void {
    this.isLoading = true;
    const req: PaginationRequest = { page: this.currentPage, limit: this.pageSize };

    this.departmentService.getDepartments(req).subscribe({
      next: (pagination) => {
        this.faculties = pagination.data || [];
        this.totalFaculties = pagination.total || 0;
        this.currentPage = pagination.current_page || 1;
        this.isLoading = false;

        // Auto-select first faculty if none selected
        if (!this.selectedFaculty && this.faculties.length > 0) {
          this.selectFaculty(this.faculties[0]);
        }
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Không thể tải danh sách khoa';
        this.isLoading = false;
      }
    });
  }

  selectFaculty(faculty: DepartmentResponse): void {
    this.selectedFaculty = faculty;
    this.loadSubDepartments(faculty.id);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadFaculties();
  }

  // ==================== BỘ MÔN (RIGHT PANEL) ====================

  loadSubDepartments(facultyId: number): void {
    this.isLoadingSubs = true;
    this.departmentService.getChildren(facultyId).subscribe({
      next: (res) => {
        this.subDepartments = Array.isArray(res) ? res : [];
        this.isLoadingSubs = false;
      },
      error: () => {
        this.subDepartments = [];
        this.isLoadingSubs = false;
      }
    });
  }

  // ==================== MODAL ====================

  openCreateFacultyModal(): void {
    this.modalType = 'faculty';
    this.isEditMode = false;
    this.editingId = null;
    this.resetForm();
    this.isModalOpen = true;
  }

  openCreateSubModal(): void {
    if (!this.selectedFaculty) {
      this.showError('Vui lòng chọn Khoa trước khi thêm Bộ môn.');
      return;
    }
    this.modalType = 'sub';
    this.isEditMode = false;
    this.editingId = null;
    this.resetForm();
    this.isModalOpen = true;
  }

  openEditModal(dept: DepartmentResponse, type: 'faculty' | 'sub'): void {
    this.modalType = type;
    this.isEditMode = true;
    this.editingId = dept.id;
    this.formCode = dept.code || '';
    this.formName = dept.name || '';
    this.errorMessage = '';
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.errorMessage = '';
  }

  resetForm(): void {
    this.formCode = '';
    this.formName = '';
    this.errorMessage = '';
  }

  getModalTitle(): string {
    if (this.isEditMode) {
      return this.modalType === 'faculty' ? 'Chỉnh sửa Khoa' : 'Chỉnh sửa Bộ môn';
    }
    return this.modalType === 'faculty' ? 'Thêm Khoa mới' : 'Thêm Bộ môn';
  }

  saveDepartment(): void {
    if (!this.formCode.trim()) {
      this.errorMessage = 'Vui lòng nhập mã';
      return;
    }
    if (!this.formName.trim()) {
      this.errorMessage = 'Vui lòng nhập tên';
      return;
    }

    const request: DepartmentRequest = {
      parent_id: this.modalType === 'sub' ? this.selectedFaculty!.id : null,
      code: this.formCode.trim(),
      name: this.formName.trim()
    };

    this.isLoading = true;

    if (this.isEditMode && this.editingId) {
      this.departmentService.update(this.editingId, request).subscribe({
        next: () => {
          this.closeModal();
          this.showSuccess('Cập nhật thành công.');
          this.refreshAfterSave();
        },
        error: (err) => {
          this.errorMessage = err?.message || 'Cập nhật thất bại';
          this.isLoading = false;
        }
      });
    } else {
      this.departmentService.create(request).subscribe({
        next: () => {
          this.closeModal();
          this.showSuccess(this.modalType === 'faculty' ? 'Tạo Khoa thành công.' : 'Tạo Bộ môn thành công.');
          this.refreshAfterSave();
        },
        error: (err) => {
          this.errorMessage = err?.message || 'Tạo mới thất bại';
          this.isLoading = false;
        }
      });
    }
  }

  refreshAfterSave(): void {
    this.loadFaculties();
    if (this.selectedFaculty) {
      this.loadSubDepartments(this.selectedFaculty.id);
    }
  }

  // ==================== TOGGLE STATUS ====================

  toggleFacultyStatus(dept: DepartmentResponse): void {
    this.departmentService.toggleStatus(dept.id).subscribe({
      next: () => {
        this.showSuccess('Đã cập nhật trạng thái.');
        this.loadFaculties();
      },
      error: (err) => this.showError(err?.message || 'Đổi trạng thái thất bại')
    });
  }

  toggleSubStatus(dept: DepartmentResponse): void {
    this.departmentService.toggleStatus(dept.id).subscribe({
      next: () => {
        this.showSuccess('Đã cập nhật trạng thái.');
        if (this.selectedFaculty) {
          this.loadSubDepartments(this.selectedFaculty.id);
        }
      },
      error: (err) => this.showError(err?.message || 'Đổi trạng thái thất bại')
    });
  }

  // ==================== HELPERS ====================

  getStatusLabel(status: string): string {
    return status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động';
  }

  showError(msg: string): void {
    this.errorMessage = msg;
    setTimeout(() => this.errorMessage = '', 5000);
  }

  showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => this.successMessage = '', 3000);
  }
}
