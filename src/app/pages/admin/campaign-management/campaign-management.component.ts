import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit } from '@angular/core';
import { CampaignService, CampaignRequest } from '../../../core/services/campaign.service';
import { CampaignResponse, PaginationRequest } from '../../../core/models/base.model';

@Component({
  selector: 'app-campaign-management',
  templateUrl: './campaign-management.component.html',
  styleUrls: ['./campaign-management.component.scss']
})
export class CampaignManagementComponent implements OnInit {
  isModalOpen = false;
  isLoading = false;
    // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;

  // Data
  campaigns: CampaignResponse[] = [];

  // Modal form state
  isEditMode = false;
  editingId: number | null = null;
  formCode = '';
  formName = '';
  formAcademicYear = '';
  formSemester: number | null = null;
  formDescription = '';
  formStartDate = '';
  formEndDate = '';

  // Detailed timeline form state
  formTttn01StartDate = '';
  formTttn01Deadline = '';
  formTttn02StartDate = '';
  formTttn02Deadline = '';
  formTttn03StartDate = '';
  formTttn03Deadline = '';
  formMidtermStartDate = '';
  formMidtermDeadline = '';
  formTttn06StartDate = '';
  formTttn06Deadline = '';

  // Dropdown options
  academicYears: string[] = [];
  semesters = [
    { value: 1, label: 'Học kỳ 1' },
    { value: 2, label: 'Học kỳ 2' },
    { value: 3, label: 'Học kỳ Hè' },
  ];

  constructor(private toastService: ToastService, private campaignService: CampaignService) {
    // Sinh danh sách năm học (5 năm gần đây)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      const y = currentYear - i;
      this.academicYears.push(`${y}-${y + 1}`);
    }
  }

  searchQuery = '';
  selectedStatus = '';
  selectedAcademicYear = '';

  ngOnInit(): void {
    this.loadCampaigns();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadCampaigns();
  }

  loadCampaigns(): void {
    this.isLoading = true;
    const request: PaginationRequest = {
      page: this.currentPage,
      limit: this.pageSize,
      searchText: this.searchQuery ? this.searchQuery.trim() : undefined
    };

    this.campaignService.getCampaigns(
      request,
      this.selectedStatus || undefined,
      this.selectedAcademicYear || undefined
    ).subscribe({
      next: (pagination) => {
        this.campaigns = pagination.data || [];
        this.totalItems = pagination.total || 0;
        this.currentPage = pagination.current_page || 1;
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.error(err?.message || 'Không thể tải danh sách đợt thực tập');
        this.isLoading = false;
      }
    });
  }

  // ── Modal ─────────────────────────────────────

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.resetForm();
    this.isModalOpen = true;
  }

  openEditModal(campaign: CampaignResponse): void {
    this.isEditMode = true;
    this.editingId = campaign.id;
    this.formCode = campaign.code || '';
    this.formName = campaign.name || '';
    this.formAcademicYear = campaign.academic_year || '';
    this.formSemester = campaign.semester;
    this.formDescription = campaign.description || '';
    // Backend trả "yyyy-MM-dd HH:mm:ss", input[date] cần "yyyy-MM-dd"
    this.formStartDate = campaign.start_date ? campaign.start_date.substring(0, 10) : '';
    this.formEndDate = campaign.end_date ? campaign.end_date.substring(0, 10) : '';
    
    this.formTttn01StartDate = campaign.tttn01_start_date ? campaign.tttn01_start_date.substring(0, 10) : '';
    this.formTttn01Deadline = campaign.tttn01_deadline ? campaign.tttn01_deadline.substring(0, 10) : '';
    this.formTttn02StartDate = campaign.tttn02_start_date ? campaign.tttn02_start_date.substring(0, 10) : '';
    this.formTttn02Deadline = campaign.tttn02_deadline ? campaign.tttn02_deadline.substring(0, 10) : '';
    this.formTttn03StartDate = campaign.tttn03_start_date ? campaign.tttn03_start_date.substring(0, 10) : '';
    this.formTttn03Deadline = campaign.tttn03_deadline ? campaign.tttn03_deadline.substring(0, 10) : '';
    this.formMidtermStartDate = campaign.midterm_start_date ? campaign.midterm_start_date.substring(0, 10) : '';
    this.formMidtermDeadline = campaign.midterm_deadline ? campaign.midterm_deadline.substring(0, 10) : '';
    this.formTttn06StartDate = campaign.tttn06_start_date ? campaign.tttn06_start_date.substring(0, 10) : '';
    this.formTttn06Deadline = campaign.tttn06_deadline ? campaign.tttn06_deadline.substring(0, 10) : '';
    
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  resetForm(): void {
    this.formCode = '';
    this.formName = '';
    this.formAcademicYear = this.academicYears[0] || '';
    this.formSemester = 1;
    this.formDescription = '';
    this.formStartDate = '';
    this.formEndDate = '';
    
    this.formTttn01StartDate = '';
    this.formTttn01Deadline = '';
    this.formTttn02StartDate = '';
    this.formTttn02Deadline = '';
    this.formTttn03StartDate = '';
    this.formTttn03Deadline = '';
    this.formMidtermStartDate = '';
    this.formMidtermDeadline = '';
    this.formTttn06StartDate = '';
    this.formTttn06Deadline = '';
  }

  saveCampaign(): void {
    // Validate
    if (!this.formCode.trim()) {
      this.toastService.error('Vui lòng nhập mã đợt thực tập');
      return;
    }
    if (!this.formName.trim()) {
      this.toastService.error('Vui lòng nhập tên đợt thực tập');
      return;
    }
    if (!this.formStartDate) {
      this.toastService.error('Vui lòng chọn ngày bắt đầu');
      return;
    }
    if (!this.formEndDate) {
      this.toastService.error('Vui lòng chọn ngày kết thúc');
      return;
    }
    if (this.formStartDate >= this.formEndDate) {
      this.toastService.error('Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }

    const request: CampaignRequest = {
      code: this.formCode.trim(),
      name: this.formName.trim(),
      academic_year: this.formAcademicYear || undefined,
      semester: this.formSemester,
      description: this.formDescription.trim() || undefined,
      start_date: this.formStartDate + 'T00:00:00',
      end_date: this.formEndDate + 'T23:59:59',
      tttn01_start_date: this.formTttn01StartDate ? this.formTttn01StartDate + 'T00:00:00' : undefined,
      tttn01_deadline: this.formTttn01Deadline ? this.formTttn01Deadline + 'T23:59:59' : undefined,
      tttn02_start_date: this.formTttn02StartDate ? this.formTttn02StartDate + 'T00:00:00' : undefined,
      tttn02_deadline: this.formTttn02Deadline ? this.formTttn02Deadline + 'T23:59:59' : undefined,
      tttn03_start_date: this.formTttn03StartDate ? this.formTttn03StartDate + 'T00:00:00' : undefined,
      tttn03_deadline: this.formTttn03Deadline ? this.formTttn03Deadline + 'T23:59:59' : undefined,
      midterm_start_date: this.formMidtermStartDate ? this.formMidtermStartDate + 'T00:00:00' : undefined,
      midterm_deadline: this.formMidtermDeadline ? this.formMidtermDeadline + 'T23:59:59' : undefined,
      tttn06_start_date: this.formTttn06StartDate ? this.formTttn06StartDate + 'T00:00:00' : undefined,
      tttn06_deadline: this.formTttn06Deadline ? this.formTttn06Deadline + 'T23:59:59' : undefined,
    };

    this.isLoading = true;

    if (this.isEditMode && this.editingId) {
      this.campaignService.update(this.editingId, request).subscribe({
        next: () => {
          this.closeModal();
          this.loadCampaigns();
        },
        error: (err) => {
          this.toastService.error(err?.message || 'Cập nhật thất bại');
          this.isLoading = false;
        }
      });
    } else {
      this.campaignService.create(request).subscribe({
        next: () => {
          this.closeModal();
          this.loadCampaigns();
        },
        error: (err) => {
          this.toastService.error(err?.message || 'Tạo mới thất bại');
          this.isLoading = false;
        }
      });
    }
  }

  // ── Actions ───────────────────────────────────

  toggleStatus(campaign: CampaignResponse): void {
    this.campaignService.toggleStatus(campaign.id).subscribe({
      next: () => {
        this.loadCampaigns();
      },
      error: (err) => {
        this.toastService.error(err?.message || 'Đổi trạng thái thất bại');
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCampaigns();
  }

  // ── Helpers ───────────────────────────────────

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const parts = dateStr.substring(0, 10).split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  getStatusLabel(status: string): string {
    return status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động';
  }

  getSemesterLabel(semester: number | null): string {
    if (!semester) return '—';
    const found = this.semesters.find(s => s.value === semester);
    return found ? found.label : `HK${semester}`;
  }
}
