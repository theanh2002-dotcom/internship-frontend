import { Component, OnInit } from '@angular/core';
import { CampaignService } from '../../../core/services/campaign.service';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { AuthService } from '../../../core/services/auth.service';
import { CampaignResponse } from '../../../core/models/base.model';

@Component({
  selector: 'app-general-dashboard',
  templateUrl: './general-dashboard.component.html',
  styleUrls: ['./general-dashboard.component.scss']
})
export class GeneralDashboardComponent implements OnInit {
  isLoading = true;
  departmentId: number | null = null;
  
  campaigns: CampaignResponse[] = [];
  selectedCampaignId: number | null = null;

  // Stats
  totalStudents = 0;
  assignedStudents = 0;
  approvedPlans = 0;
  completedStudents = 0;

  // Student lists for progress tracking
  allStudents: any[] = [];
  filteredStudents: any[] = [];
  searchQuery = '';
  statusFilter = '';

  // Pagination for detailed progress table
  tableCurrentPage = 1;
  tablePageSize = 10;

  // Phân phối tiến độ thực tập
  statusGroups = [
    { key: 'ASSIGNMENT', label: 'Chưa phân công GVHD', count: 0, percentage: 0, color: 'bg-rose-500' },
    { key: 'COMPANY', label: 'Kê khai / Đợi duyệt đơn vị', count: 0, percentage: 0, color: 'bg-orange-500' },
    { key: 'PLAN', label: 'Chuẩn bị / Đang duyệt đề cương', count: 0, percentage: 0, color: 'bg-amber-500' },
    { key: 'IN_PROGRESS', label: 'Đang thực tập & Viết nhật ký', count: 0, percentage: 0, color: 'bg-blue-600' },
    { key: 'EVALUATION', label: 'Đang nộp báo cáo & Đánh giá', count: 0, percentage: 0, color: 'bg-indigo-600' },
    { key: 'COMPLETED', label: 'Đã hoàn thành đợt thực tập', count: 0, percentage: 0, color: 'bg-emerald-600' }
  ];

  constructor(
    private campaignService: CampaignService,
    private studentCampaignService: StudentCampaignService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.departmentId) {
      this.departmentId = user.departmentId;
    }
    this.loadCampaigns();
  }

  loadCampaigns(): void {
    this.campaignService.getCampaigns({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        this.campaigns = res.data || [];
        if (this.campaigns.length > 0) {
          this.selectedCampaignId = this.campaigns[0].id;
          this.loadStats();
        } else {
          this.isLoading = false;
        }
      },
      error: () => this.isLoading = false
    });
  }

  onCampaignChange(): void {
    this.loadStats();
  }

  loadStats(): void {
    if (!this.selectedCampaignId) return;
    
    if (!this.departmentId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.studentCampaignService.findByCampaignAndDepartment(this.selectedCampaignId, this.departmentId, { page: 1, limit: 10000 }).subscribe({
      next: (res) => {
        const students = res.data || [];
        this.allStudents = students;
        this.totalStudents = res.total || students.length;
        
        this.assignedStudents = students.filter((s: any) => this.hasAssignedGvhd(s)).length;
        this.approvedPlans = students.filter((s: any) => ['PLAN_APPROVED', 'IN_PROGRESS', 'STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'].includes(s.status)).length;
        this.completedStudents = students.filter((s: any) => s.status === 'COMPLETED' || s.status === 'STAGE2_EVALUATED').length;
        
        // Tính toán phân phối tiến độ
        if (students.length > 0) {
          const unassignedCount = students.filter((s: any) => !this.hasAssignedGvhd(s)).length;
          const companyDeclaredCount = students.filter((s: any) => s.status === 'COMPANY_DECLARED' || s.status === 'IMPORTED').length;
          const planPendingCount = students.filter((s: any) => s.status === 'COMPANY_APPROVED' || s.status === 'PLAN_SUBMITTED').length;
          const inProgressCount = students.filter((s: any) => s.status === 'PLAN_APPROVED' || s.status === 'IN_PROGRESS').length;
          const evaluatingCount = students.filter((s: any) => s.status === 'STAGE1_EVALUATED' || s.status === 'REPORT_SUBMITTED').length;
          const completedCount = students.filter((s: any) => s.status === 'COMPLETED' || s.status === 'STAGE2_EVALUATED').length;

          this.statusGroups[0].count = unassignedCount;
          this.statusGroups[1].count = companyDeclaredCount;
          this.statusGroups[2].count = planPendingCount;
          this.statusGroups[3].count = inProgressCount;
          this.statusGroups[4].count = evaluatingCount;
          this.statusGroups[5].count = completedCount;

          this.statusGroups.forEach(group => {
            group.percentage = this.totalStudents > 0 ? Math.round((group.count / this.totalStudents) * 100) : 0;
          });
        } else {
          this.statusGroups.forEach(group => {
            group.count = 0;
            group.percentage = 0;
          });
        }

        this.applyFilters();
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  applyFilters(): void {
    let result = [...this.allStudents];

    // Search Query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase().trim();
      result = result.filter(s => 
        (s.full_name && s.full_name.toLowerCase().includes(query)) ||
        (s.student_code && s.student_code.toLowerCase().includes(query)) ||
        (s.class_name && s.class_name.toLowerCase().includes(query)) ||
        (s.gvhd_name && s.gvhd_name.toLowerCase().includes(query))
      );
    }

    // Status Filter
    if (this.statusFilter) {
      result = result.filter(s => s.status === this.statusFilter);
    }

    this.filteredStudents = result;
    this.tableCurrentPage = 1;
  }

  private hasAssignedGvhd(student: any): boolean {
    if (Array.isArray(student.gvhd_ids)) {
      return student.gvhd_ids.length > 0;
    }
    return student.gvhd_id !== null && student.gvhd_id !== undefined;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  get pagedStudents(): any[] {
    const startIndex = (this.tableCurrentPage - 1) * this.tablePageSize;
    return this.filteredStudents.slice(startIndex, startIndex + this.tablePageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredStudents.length / this.tablePageSize) || 1;
  }

  getPages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  onTablePageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.tableCurrentPage = page;
    }
  }

  getStatusStep(studentOrStatus: any, formCode: string): 'success' | 'warning' | 'none' {
    const status = typeof studentOrStatus === 'string' ? studentOrStatus : studentOrStatus?.status;
    const hasCompanyInfo = typeof studentOrStatus === 'string' ? true : this.hasCompanyInfo(studentOrStatus);
    if (!hasCompanyInfo && ['TTTN-01', 'TTTN-02', 'TTTN-03', 'TTTN-04', 'TTTN-05', 'TTTN-06', 'TTTN-07'].includes(formCode)) {
      return 'none';
    }

    switch (formCode) {
      case 'TTTN-01':
        if (['COMPANY_APPROVED', 'PLAN_SUBMITTED', 'PLAN_APPROVED', 'IN_PROGRESS', 'STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'].includes(status)) {
          return 'success';
        }
        if (status === 'COMPANY_DECLARED') return 'warning';
        return 'none';
        
      case 'TTTN-02':
        if (['PLAN_APPROVED', 'IN_PROGRESS', 'STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'].includes(status)) {
          return 'success';
        }
        if (status === 'PLAN_SUBMITTED') return 'warning';
        return 'none';
        
      case 'TTTN-03':
        if (['IN_PROGRESS', 'STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'].includes(status)) {
          return 'success';
        }
        return 'none';
        
      case 'TTTN-04':
        if (['STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'].includes(status)) {
          return 'success';
        }
        return 'none';
        
      case 'TTTN-06':
        if (['REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'].includes(status)) {
          return 'success';
        }
        return 'none';
        
      case 'TTTN-05':
        if (['STAGE2_EVALUATED', 'COMPLETED'].includes(status)) {
          return 'success';
        }
        return 'none';
        
      case 'TTTN-07':
        if (status === 'COMPLETED') return 'success';
        return 'none';
        
      default:
        return 'none';
    }
  }

  hasCompanyInfo(student: any): boolean {
    return !!student?.company_info?.company_name;
  }

  isMissingCompanyInfoAfterProgress(student: any): boolean {
    return !this.hasCompanyInfo(student)
      && !['IMPORTED', 'COMPANY_DECLARED'].includes(student?.status);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'IMPORTED': return 'Mới nhập';
      case 'COMPANY_DECLARED': return 'Kê khai nơi TT';
      case 'COMPANY_APPROVED': return 'Duyệt nơi TT';
      case 'PLAN_SUBMITTED': return 'Nộp kế hoạch';
      case 'PLAN_APPROVED': return 'Duyệt kế hoạch';
      case 'IN_PROGRESS': return 'Đang thực tập';
      case 'STAGE1_EVALUATED': return 'Đã chấm Chặng 1';
      case 'REPORT_SUBMITTED': return 'Đã nộp báo cáo';
      case 'STAGE2_EVALUATED': return 'Đã chấm Chặng 2';
      case 'COMPLETED': return 'Hoàn thành';
      case 'SUSPENDED': return 'Bị đình chỉ';
      default: return status || 'Không rõ';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'IMPORTED': return 'bg-slate-100 text-slate-700';
      case 'COMPANY_DECLARED': return 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'COMPANY_APPROVED': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'PLAN_SUBMITTED': return 'bg-sky-50 text-sky-700 border border-sky-200';
      case 'PLAN_APPROVED': return 'bg-sky-100 text-sky-800';
      case 'IN_PROGRESS': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'STAGE1_EVALUATED': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'REPORT_SUBMITTED': return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'STAGE2_EVALUATED': return 'bg-teal-50 text-teal-700 border border-teal-200';
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'SUSPENDED': return 'bg-rose-50 text-rose-700 border border-rose-200';
      default: return 'bg-slate-50 text-slate-700';
    }
  }
}
