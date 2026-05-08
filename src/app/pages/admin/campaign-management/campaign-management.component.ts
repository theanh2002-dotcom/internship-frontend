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
  errorMessage = '';

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

  // Dropdown options
  academicYears: string[] = [];
  semesters = [
    { value: 1, label: 'Học kỳ 1' },
    { value: 2, label: 'Học kỳ 2' },
    { value: 3, label: 'Học kỳ Hè' },
  ];

  constructor(private campaignService: CampaignService) {
    // Sinh danh sách năm học (5 năm gần đây)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      const y = currentYear - i;
      this.academicYears.push(`${y}-${y + 1}`);
    }
  }

  ngOnInit(): void {
    this.loadCampaigns();
  }

  loadCampaigns(): void {
    this.isLoading = true;
    const request: PaginationRequest = {
      page: this.currentPage,
      limit: this.pageSize,
    };

    this.campaignService.getCampaigns(request).subscribe({
      next: (pagination) => {
        this.campaigns = pagination.data || [];
        this.totalItems = pagination.total || 0;
        this.currentPage = pagination.current_page || 1;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Không thể tải danh sách đợt thực tập';
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
    this.formAcademicYear = this.academicYears[0] || '';
    this.formSemester = 1;
    this.formDescription = '';
    this.formStartDate = '';
    this.formEndDate = '';
    this.errorMessage = '';
  }

  saveCampaign(): void {
    // Validate
    if (!this.formCode.trim()) {
      this.errorMessage = 'Vui lòng nhập mã đợt thực tập';
      return;
    }
    if (!this.formName.trim()) {
      this.errorMessage = 'Vui lòng nhập tên đợt thực tập';
      return;
    }
    if (!this.formStartDate) {
      this.errorMessage = 'Vui lòng chọn ngày bắt đầu';
      return;
    }
    if (!this.formEndDate) {
      this.errorMessage = 'Vui lòng chọn ngày kết thúc';
      return;
    }
    if (this.formStartDate >= this.formEndDate) {
      this.errorMessage = 'Ngày kết thúc phải sau ngày bắt đầu';
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
    };

    this.isLoading = true;

    if (this.isEditMode && this.editingId) {
      this.campaignService.update(this.editingId, request).subscribe({
        next: () => {
          this.closeModal();
          this.loadCampaigns();
        },
        error: (err) => {
          this.errorMessage = err?.message || 'Cập nhật thất bại';
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
          this.errorMessage = err?.message || 'Tạo mới thất bại';
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
        this.errorMessage = err?.message || 'Đổi trạng thái thất bại';
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
