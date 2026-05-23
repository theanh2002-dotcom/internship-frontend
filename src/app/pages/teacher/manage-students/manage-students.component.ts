import { Component, OnInit } from '@angular/core';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { StudentCampaignResponse } from '../../../core/models/base.model';
import { ToastService } from '../../../core/services/toast.service';
import { CampaignService } from '../../../core/services/campaign.service';

@Component({
  selector: 'app-manage-students',
  templateUrl: './manage-students.component.html',
  styleUrls: ['./manage-students.component.scss']
})
export class ManageStudentsComponent implements OnInit {
  isLoading = true;
  isApproving = false;
  students: StudentCampaignResponse[] = [];

  selectedStudent: StudentCampaignResponse | null = null;
  showModal = false;

  activeTab = 'company';

  isLoadingTimeline = false;
  milestones: any[] = [];
  progressPercent = 0;
  currentWeek = 1;
  totalWeeks = 8;

  searchQuery = '';
  selectedStatus = '';
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;

  filteredStudents: StudentCampaignResponse[] = [];
  paginatedStudents: StudentCampaignResponse[] = [];

  columns = [
    { key: 'student_code', label: 'Mã SV', width: '120px' },
    { key: 'full_name', label: 'Họ và tên' },
    { key: 'class_name', label: 'Lớp', width: '100px' },
    { key: 'company', label: 'Đơn vị TT' },
    { key: 'status', label: 'Trạng thái', width: '180px' },
    { key: 'actions', label: 'Hành động', align: 'center', width: '150px' }
  ];

  statusOptions = [
    { value: 'DK_DVTT', label: 'Đang đăng ký/Duyệt ĐVTT' },
    { value: 'DK_KEHOACH', label: 'Đang nộp/Duyệt kế hoạch' },
    { value: 'THUCTAP', label: 'Đang thực tập' },
    { value: 'GIUAKY', label: 'Đã ĐG giữa kỳ' },
    { value: 'BAOCAO', label: 'Đã nộp báo cáo cuối kỳ' },
    { value: 'HOANTHANH', label: 'Hoàn thành / Đã ĐG cuối kỳ' },
    { value: 'SUSPENDED', label: 'Tạm ngưng' }
  ];

  constructor(
    private studentCampaignService: StudentCampaignService,
    private toastService: ToastService,
    private campaignService: CampaignService
  ) { }

  ngOnInit(): void {
    this.loadMyStudents();
  }

  loadMyStudents(): void {
    this.isLoading = true;
    this.studentCampaignService.getMyAssignedStudents().subscribe({
      next: (res) => {
        this.students = Array.isArray(res) ? res : [];
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let result = [...this.students];

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase().trim();
      result = result.filter(s => 
        (s.full_name && s.full_name.toLowerCase().includes(query)) ||
        (s.student_code && s.student_code.toLowerCase().includes(query)) ||
        (s.class_name && s.class_name.toLowerCase().includes(query)) ||
        (s.company_info?.company_name && s.company_info.company_name.toLowerCase().includes(query))
      );
    }

    if (this.selectedStatus) {
      switch (this.selectedStatus) {
        case 'DK_DVTT':
          result = result.filter(s => ['IMPORTED', 'COMPANY_DECLARED'].includes(s.status));
          break;
        case 'DK_KEHOACH':
          result = result.filter(s => ['COMPANY_APPROVED', 'PLAN_SUBMITTED'].includes(s.status));
          break;
        case 'THUCTAP':
          result = result.filter(s => ['PLAN_APPROVED', 'IN_PROGRESS'].includes(s.status));
          break;
        case 'GIUAKY':
          result = result.filter(s => s.status === 'STAGE1_EVALUATED');
          break;
        case 'BAOCAO':
          result = result.filter(s => s.status === 'REPORT_SUBMITTED');
          break;
        case 'HOANTHANH':
          result = result.filter(s => ['STAGE2_EVALUATED', 'COMPLETED'].includes(s.status));
          break;
        case 'SUSPENDED':
          result = result.filter(s => s.status === 'SUSPENDED');
          break;
      }
    }

    this.filteredStudents = result;
    this.totalItems = result.length;

    const totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }

    this.paginate();
  }

  paginate(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedStudents = this.filteredStudents.slice(startIndex, endIndex);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.paginate();
  }

  openReviewModal(student: StudentCampaignResponse): void {
    this.selectedStudent = student;
    this.showModal = true;
    this.activeTab = 'company';
    this.milestones = [];
    this.progressPercent = 0;
    this.currentWeek = 1;
    this.isLoadingTimeline = true;

    this.campaignService.getById(student.campaign_id).subscribe({
      next: (camp) => {
        this.calculateTimelineMilestones(camp, student);

        let start: Date;
        let end: Date;
        if (camp.start_date && camp.end_date) {
          const normalizedStart = camp.start_date.includes(' ') ? camp.start_date.replace(' ', 'T') : camp.start_date;
          const normalizedEnd = camp.end_date.includes(' ') ? camp.end_date.replace(' ', 'T') : camp.end_date;
          start = new Date(normalizedStart);
          end = new Date(normalizedEnd);
        } else {
          const createdStr = student.created_at || new Date().toISOString();
          const normalizedCreated = createdStr.includes(' ') ? createdStr.replace(' ', 'T') : createdStr;
          start = new Date(normalizedCreated);
          end = new Date(start.getTime() + 8 * 7 * 24 * 60 * 60 * 1000);
        }

        const now = new Date();
        if (now < start) {
          this.progressPercent = 0;
          this.currentWeek = 1;
        } else if (now > end) {
          this.progressPercent = 100;
          this.currentWeek = this.totalWeeks;
        } else {
          const totalMs = end.getTime() - start.getTime();
          const elapsedMs = now.getTime() - start.getTime();
          this.progressPercent = Math.min(100, Math.round((elapsedMs / totalMs) * 100));

          const msInWeek = 7 * 24 * 60 * 60 * 1000;
          this.currentWeek = Math.min(this.totalWeeks, Math.floor(elapsedMs / msInWeek) + 1);
        }
        this.isLoadingTimeline = false;
      },
      error: () => {
        this.isLoadingTimeline = false;
      }
    });
  }

  calculateTimelineMilestones(camp: any, studentCampaign: any) {
    const parseDate = (dateStr?: string) => {
      if (!dateStr) return null;
      const norm = dateStr.includes(' ') ? dateStr.replace(' ', 'T') : dateStr;
      return new Date(norm);
    };

    const formatDateRange = (start: Date | null, end: Date | null): string => {
      if (!start || !end) return 'Chưa cấu hình';
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(start.getDate())}/${pad(start.getMonth() + 1)} - ${pad(end.getDate())}/${pad(end.getMonth() + 1)}`;
    };

    const now = new Date();
    const status = studentCampaign.status;

    const mConfigs = [
      {
        key: 'tttn01',
        title: 'Kê khai Đơn vị thực tập',
        code: 'TTTN-01',
        description: 'Đăng ký thông tin công ty tiếp nhận thực tập và xin xác nhận của GVHD.',
        startDate: parseDate(camp.tttn01_start_date),
        deadline: parseDate(camp.tttn01_deadline),
        isCompleted: ['COMPANY_APPROVED', 'PLAN_SUBMITTED', 'PLAN_APPROVED', 'IN_PROGRESS', 'STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'].includes(status),
        isPending: status === 'COMPANY_DECLARED',
        icon: 'domain'
      },
      {
        key: 'tttn02',
        title: 'Nộp Đề cương kế hoạch',
        code: 'TTTN-02',
        description: 'Lập đề cương chi tiết các tuần thực tập và gửi giảng viên hướng dẫn duyệt.',
        startDate: parseDate(camp.tttn02_start_date),
        deadline: parseDate(camp.tttn02_deadline),
        isCompleted: ['PLAN_APPROVED', 'IN_PROGRESS', 'STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'].includes(status),
        isPending: status === 'PLAN_SUBMITTED',
        icon: 'edit_document'
      },
      {
        key: 'tttn03',
        title: 'Báo cáo Nhật ký tuần',
        code: 'TTTN-03',
        description: 'Cập nhật tiến độ công việc hàng tuần để giảng viên và người hướng dẫn theo dõi.',
        startDate: parseDate(camp.tttn03_start_date),
        deadline: parseDate(camp.tttn03_deadline),
        isCompleted: ['STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'].includes(status),
        isPending: status === 'IN_PROGRESS' || status === 'PLAN_APPROVED',
        icon: 'menu_book'
      },
      {
        key: 'midterm',
        title: 'Nhận xét & Đánh giá giữa kỳ',
        code: 'Giữa kỳ',
        description: 'Được giảng viên và doanh nghiệp đánh giá kết quả thực tập giai đoạn đầu.',
        startDate: parseDate(camp.midterm_start_date),
        deadline: parseDate(camp.midterm_deadline),
        isCompleted: ['STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'].includes(status),
        isPending: false,
        icon: 'rate_review'
      },
      {
        key: 'tttn06',
        title: 'Nộp Báo cáo cuối kỳ',
        code: 'TTTN-06',
        description: 'Nộp file báo cáo thực tập chính thức và bản tự nhận xét kết quả (TTTN-08b).',
        startDate: parseDate(camp.tttn06_start_date),
        deadline: parseDate(camp.tttn06_deadline),
        isCompleted: ['REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'].includes(status),
        isPending: status === 'REPORT_SUBMITTED',
        icon: 'description'
      }
    ];

    this.milestones = mConfigs.map(m => {
      let state: 'LOCKED' | 'UPCOMING' | 'IN_PROGRESS' | 'OVERDUE' | 'PENDING' | 'COMPLETED' = 'LOCKED';
      let stateLabel = 'Chưa mở';
      let warningMessage = '';

      if (m.isCompleted) {
        state = 'COMPLETED';
        stateLabel = 'Đã hoàn thành';
      } else if (m.isPending) {
        state = 'PENDING';
        stateLabel = 'Đang chờ duyệt';
      } else {
        const start = m.startDate;
        const deadline = m.deadline;

        if (start && now < start) {
          state = 'UPCOMING';
          stateLabel = 'Sắp diễn ra';
        } else if (start && deadline && now >= start && now <= deadline) {
          state = 'IN_PROGRESS';
          stateLabel = 'Đang diễn ra';
          
          const diffMs = deadline.getTime() - now.getTime();
          const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
          if (diffDays <= 3 && diffDays >= 0) {
            warningMessage = `Sắp hết hạn! Còn lại ${diffDays} ngày.`;
          }
        } else if (deadline && now > deadline) {
          state = 'OVERDUE';
          stateLabel = 'Đã quá hạn nộp';
          warningMessage = 'Đã trễ hạn nộp!';
        }
      }

      return {
        ...m,
        dateLabel: formatDateRange(m.startDate, m.deadline),
        state,
        stateLabel,
        warningMessage
      };
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedStudent = null;
  }

  approveCompany(): void {
    if (!this.selectedStudent) return;

    this.isApproving = true;
    this.studentCampaignService.approveCompanyInfo(this.selectedStudent.id).subscribe({
      next: () => {
        this.toastService.success('Đã duyệt thông tin Đơn vị thực tập thành công!');
        this.isApproving = false;

        // Update local status
        if (this.selectedStudent) {
          this.selectedStudent.status = 'COMPANY_APPROVED';
        }

        setTimeout(() => this.closeModal(), 1500);
      },
      error: (err: any) => {
        const msg = err.error?.message || 'Có lỗi xảy ra khi duyệt.';
        this.toastService.error(msg);
        this.isApproving = false;
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'IMPORTED': return 'bg-slate-100 text-slate-600';
      case 'COMPANY_DECLARED': return 'bg-amber-100 text-amber-700';
      case 'COMPANY_APPROVED': return 'bg-blue-100 text-blue-700';
      case 'PLAN_SUBMITTED': return 'bg-purple-100 text-purple-700';
      case 'PLAN_APPROVED': return 'bg-sky-100 text-sky-700';
      case 'IN_PROGRESS': return 'bg-emerald-100 text-[#008A5E] border border-emerald-200';
      case 'STAGE1_EVALUATED': return 'bg-indigo-100 text-indigo-700';
      case 'REPORT_SUBMITTED': return 'bg-teal-100 text-teal-700';
      case 'STAGE2_EVALUATED': return 'bg-cyan-100 text-cyan-700';
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'SUSPENDED': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'IMPORTED': return 'Chưa kê khai';
      case 'COMPANY_DECLARED': return 'Chờ duyệt ĐVHD';
      case 'COMPANY_APPROVED': return 'Đã duyệt ĐVHD';
      case 'PLAN_SUBMITTED': return 'Chờ duyệt Kế hoạch';
      case 'PLAN_APPROVED': return 'Kế hoạch được duyệt';
      case 'IN_PROGRESS': return 'Đang thực tập';
      case 'STAGE1_EVALUATED': return 'Đã ĐG giữa kỳ';
      case 'REPORT_SUBMITTED': return 'Đã nộp Báo cáo';
      case 'STAGE2_EVALUATED': return 'Đã ĐG cuối kỳ';
      case 'COMPLETED': return 'Hoàn thành';
      case 'SUSPENDED': return 'Tạm ngưng';
      default: return status;
    }
  }
}
