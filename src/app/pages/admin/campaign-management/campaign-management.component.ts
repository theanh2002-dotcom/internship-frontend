import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit } from '@angular/core';
import { CampaignService, CampaignRequest, CampaignTimelinePreviewResponse } from '../../../core/services/campaign.service';
import { CampaignResponse, PaginationRequest } from '../../../core/models/base.model';
import { DepartmentService } from '../../../core/services/department.service';
import { EvaluationService } from '../../../core/services/evaluation.service';

@Component({
  selector: 'app-campaign-management',
  templateUrl: './campaign-management.component.html',
  styleUrls: ['./campaign-management.component.scss']
})
export class CampaignManagementComponent implements OnInit {
  isModalOpen = false;
  isLoading = false;

  // Unlock Grade Modal State
  isUnlockModalOpen = false;
  selectedCampaignForUnlock: CampaignResponse | null = null;
  unlockStage: 'STAGE_1' | 'STAGE_2' | 'ALL' = 'STAGE_1';
  unlockReason = '';
  isUnlocking = false;

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
  formAutoGenerateTimeline = true;
  isTimelinePreviewLoading = false;
  private timelineEditedManually = false;
  private isApplyingTimelinePreview = false;

  // Dropdown options
  academicYears: string[] = [];
  semesters = [
    { value: 1, label: 'Học kỳ 1' },
    { value: 2, label: 'Học kỳ 2' },
    { value: 3, label: 'Học kỳ Hè' },
  ];

  departments: any[] = [];
  selectedDepartmentIds: number[] = [];
  deptSearchQuery = '';

  constructor(
    private toastService: ToastService, 
    private campaignService: CampaignService,
    private departmentService: DepartmentService,
    private evaluationService: EvaluationService
  ) {
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
    this.loadDepartments();
  }

  getDepartmentName(id: number): string {
    const dept = this.departments.find(d => d.id === id);
    return dept ? `${dept.name} (${dept.code})` : '';
  }

  getFilteredDepartments(): any[] {
    if (!this.deptSearchQuery.trim()) {
      return this.departments;
    }
    const q = this.deptSearchQuery.toLowerCase().trim();
    return this.departments.filter(d => 
      d.name.toLowerCase().includes(q) || 
      d.code.toLowerCase().includes(q)
    );
  }

  selectAllDepartments(): void {
    this.selectedDepartmentIds = this.departments.map(d => d.id);
  }

  deselectAllDepartments(): void {
    this.selectedDepartmentIds = [];
  }

  loadDepartments(): void {
    this.departmentService.getDepartments({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        this.departments = res.data || [];
      },
      error: (err) => {
        this.toastService.error('Không thể tải danh sách khoa');
      }
    });
  }

  isDepartmentSelected(id: number): boolean {
    return this.selectedDepartmentIds.includes(id);
  }

  toggleDepartmentSelection(id: number): void {
    const idx = this.selectedDepartmentIds.indexOf(id);
    if (idx > -1) {
      this.selectedDepartmentIds.splice(idx, 1);
    } else {
      this.selectedDepartmentIds.push(id);
    }
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
    this.selectedDepartmentIds = [];
    this.deptSearchQuery = '';
    this.isModalOpen = true;
  }

  openEditModal(campaign: CampaignResponse): void {
    this.isEditMode = true;
    this.editingId = campaign.id;
    this.formAutoGenerateTimeline = false;
    this.timelineEditedManually = true;
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
    
    this.selectedDepartmentIds = campaign.department_ids || [];
    this.deptSearchQuery = '';
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
    this.formAutoGenerateTimeline = true;
    this.timelineEditedManually = false;
    this.isTimelinePreviewLoading = false;
  }

  onCampaignDateChange(): void {
    if (this.formAutoGenerateTimeline && !this.timelineEditedManually) {
      this.fillTimelineFromDates(false);
    }
  }

  onAutoGenerateTimelineChange(): void {
    if (this.formAutoGenerateTimeline) {
      this.timelineEditedManually = false;
      this.fillTimelineFromDates(true);
    }
  }

  markTimelineEdited(): void {
    if (this.isApplyingTimelinePreview) {
      return;
    }
    this.timelineEditedManually = true;
    this.formAutoGenerateTimeline = false;
  }

  fillTimelineFromDates(showError: boolean = true): void {
    if (!this.formStartDate || !this.formEndDate) {
      if (showError) {
        this.toastService.error('Vui lòng chọn ngày bắt đầu và ngày kết thúc trước');
      }
      return;
    }
    if (this.formStartDate >= this.formEndDate) {
      if (showError) {
        this.toastService.error('Ngày kết thúc phải sau ngày bắt đầu');
      }
      return;
    }
    if (!this.isAtLeastOneMonthRange(this.formStartDate, this.formEndDate)) {
      if (showError) {
        this.toastService.error('Thời gian đợt thực tập phải tối thiểu 1 tháng');
      }
      return;
    }

    this.isTimelinePreviewLoading = true;
    this.campaignService.previewTimeline({
      start_date: this.formStartDate + 'T00:00:00',
      end_date: this.formEndDate + 'T23:59:59',
      week_count: 8
    }).subscribe({
      next: (timeline) => {
        this.applyTimelinePreview(timeline);
        this.isTimelinePreviewLoading = false;
        if (showError) {
          this.toastService.success('Đã tự động chia timeline theo 8 tuần');
        }
      },
      error: (err) => {
        this.isTimelinePreviewLoading = false;
        if (showError) {
          this.toastService.error(err?.message || 'Không thể tự động chia timeline');
        }
      }
    });
  }

  private applyTimelinePreview(timeline: CampaignTimelinePreviewResponse): void {
    this.isApplyingTimelinePreview = true;
    this.formTttn01StartDate = this.toDateInput(timeline.tttn01_start_date);
    this.formTttn01Deadline = this.toDateInput(timeline.tttn01_deadline);
    this.formTttn02StartDate = this.toDateInput(timeline.tttn02_start_date);
    this.formTttn02Deadline = this.toDateInput(timeline.tttn02_deadline);
    this.formTttn03StartDate = this.toDateInput(timeline.tttn03_start_date);
    this.formTttn03Deadline = this.toDateInput(timeline.tttn03_deadline);
    this.formMidtermStartDate = this.toDateInput(timeline.midterm_start_date);
    this.formMidtermDeadline = this.toDateInput(timeline.midterm_deadline);
    this.formTttn06StartDate = this.toDateInput(timeline.tttn06_start_date);
    this.formTttn06Deadline = this.toDateInput(timeline.tttn06_deadline);
    this.isApplyingTimelinePreview = false;
  }

  private toDateInput(value?: string | null): string {
    return value ? value.substring(0, 10) : '';
  }

  private isAtLeastOneMonthRange(startDate: string, endDate: string): boolean {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);
    const minimumEnd = new Date(start);
    minimumEnd.setMonth(minimumEnd.getMonth() + 1);
    return end >= minimumEnd;
  }

  saveCampaign(): void {
    // Validate
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
    if (!this.isAtLeastOneMonthRange(this.formStartDate, this.formEndDate)) {
      this.toastService.error('Thời gian đợt thực tập phải tối thiểu 1 tháng');
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
      department_ids: this.selectedDepartmentIds
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

  deleteCampaign(campaign: CampaignResponse): void {
    if ((campaign.student_count || 0) > 0) {
      this.toastService.error('Chỉ được xóa đợt thực tập khi chưa có sinh viên nào trong đợt.');
      return;
    }
    const confirmed = window.confirm(`Xóa đợt thực tập "${campaign.name}"? Thao tác này không thể hoàn tác.`);
    if (!confirmed) {
      return;
    }

    this.campaignService.delete(campaign.id).subscribe({
      next: () => {
        this.toastService.success('Đã xóa đợt thực tập');
        this.loadCampaigns();
      },
      error: (err) => {
        this.toastService.error(err?.message || 'Xóa đợt thực tập thất bại');
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
    return status === 'ACTIVE' ? 'Đang hoạt động' : 'Kết thúc';
  }

  getSemesterLabel(semester: number | null): string {
    if (!semester) return '—';
    const found = this.semesters.find(s => s.value === semester);
    return found ? found.label : `HK${semester}`;
  }

  // ── Unlock Grade Actions ───────────────────────

  openUnlockModal(campaign: CampaignResponse): void {
    this.selectedCampaignForUnlock = campaign;
    this.unlockStage = 'STAGE_1';
    this.unlockReason = '';
    this.isUnlockModalOpen = true;
  }

  closeUnlockModal(): void {
    this.isUnlockModalOpen = false;
    this.selectedCampaignForUnlock = null;
    this.isUnlocking = false;
  }

  confirmUnlockGrade(): void {
    if (!this.selectedCampaignForUnlock) {
      return;
    }
    this.isUnlocking = true;
    this.evaluationService.unlockCampaignGrade(this.selectedCampaignForUnlock.id, {
      stage: this.unlockStage,
      reason: this.unlockReason.trim() || undefined
    }).subscribe({
      next: (res) => {
        this.isUnlocking = false;
        this.toastService.success(res?.message || 'Mở khóa điểm thành công');
        this.closeUnlockModal();
      },
      error: (err) => {
        this.isUnlocking = false;
        this.toastService.error(err?.message || 'Mở khóa điểm thất bại');
      }
    });
  }
}
