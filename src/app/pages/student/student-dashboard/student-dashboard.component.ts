import { Component, OnInit } from '@angular/core';
import { WeeklyLogService } from '../../../core/services/weekly-log.service';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { CampaignService } from '../../../core/services/campaign.service';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss']
})
export class StudentDashboardComponent implements OnInit {
  isLoading = true;
  studentName = '';
  studentId = '';
  
  // Trạng thái các luồng (TTTN)
  workflowStatus = {
    tttn01: { status: 'NOT_STARTED', label: 'Tiếp nhận', icon: 'domain' },
    tttn02: { status: 'NOT_STARTED', label: 'Kế hoạch', icon: 'edit_document' },
    tttn03: { status: 'NOT_STARTED', label: 'Nhật ký', icon: 'menu_book' },
    tttn06: { status: 'NOT_STARTED', label: 'Báo cáo', icon: 'description' }
  };

  // Tiến trình thực tập (8 tuần)
  currentWeek = 1;
  totalWeeks = 8;
  progressPercent = 0;

  // Lịch trình sắp tới
  upcomingTasks: any[] = [];

  // Thông tin liên hệ
  contacts = {
    teacher: { name: 'Chưa phân công', phone: '-', email: '-' },
    companyMentor: { name: 'Chưa có', phone: '-', email: '-' }
  };

  constructor(
    private studentCampaignService: StudentCampaignService,
    private weeklyLogService: WeeklyLogService,
    private campaignService: CampaignService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.studentCampaignService.getMyCampaigns().subscribe({
      next: (res) => {
        const campaigns = Array.isArray(res) ? res : (res.data || res.payload || []);
        if (campaigns.length > 0) {
          const campaign = campaigns[0];
          this.studentName = campaign.full_name;
          this.studentId = campaign.student_code;

          this.updateWorkflowStatus(campaign.status);

          if (campaign.gvhd_name) {
            this.contacts.teacher = {
              name: campaign.gvhd_name,
              phone: '-',
              email: '-'
            };
          }

          if (campaign.company_info) {
            this.contacts.companyMentor = {
              name: campaign.company_info.supervisor_name || 'Chưa có',
              phone: campaign.company_info.supervisor_phone || '-',
              email: campaign.company_info.supervisor_email || '-'
            };
          }

          // Fetch campaign details to calculate calendar-based time progress
          this.campaignService.getById(campaign.campaign_id).subscribe({
            next: (camp) => {
              let start: Date;
              let end: Date;
              if (camp.start_date && camp.end_date) {
                const normalizedStart = camp.start_date.includes(' ') ? camp.start_date.replace(' ', 'T') : camp.start_date;
                const normalizedEnd = camp.end_date.includes(' ') ? camp.end_date.replace(' ', 'T') : camp.end_date;
                start = new Date(normalizedStart);
                end = new Date(normalizedEnd);
              } else {
                // Fallback: 8 weeks starting from campaign enrollment date (createdAt)
                const createdStr = campaign.created_at || new Date().toISOString();
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
            },
            error: () => {
              // Fallback if API fails
              const createdStr = campaign.created_at || new Date().toISOString();
              const normalizedCreated = createdStr.includes(' ') ? createdStr.replace(' ', 'T') : createdStr;
              const start = new Date(normalizedCreated);
              const end = new Date(start.getTime() + 8 * 7 * 24 * 60 * 60 * 1000);
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
            }
          });

          // Fetch weekly logs to calculate upcoming tasks
          this.weeklyLogService.findByStudentCampaign(campaign.id).subscribe({
            next: (logRes) => {
              const logs = Array.isArray(logRes) ? logRes : (logRes.data || logRes.payload || []);
              this.generateUpcomingTasks(campaign, logs);
              this.isLoading = false;
            },
            error: () => {
              this.generateUpcomingTasks(campaign, []);
              this.isLoading = false;
            }
          });
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  updateWorkflowStatus(status: string) {
    // TTTN-01: Kê khai ĐVTT
    const tttn01Done = ['COMPANY_APPROVED', 'PLAN_SUBMITTED', 'PLAN_APPROVED', 'IN_PROGRESS', 'STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'];
    if (tttn01Done.includes(status)) {
      this.workflowStatus.tttn01 = { status: 'APPROVED', label: 'Đã duyệt', icon: 'check_circle' };
    } else if (status === 'COMPANY_DECLARED') {
      this.workflowStatus.tttn01 = { status: 'PENDING', label: 'Chờ duyệt', icon: 'hourglass_top' };
    } else {
      this.workflowStatus.tttn01 = { status: 'NOT_STARTED', label: 'Chưa nộp', icon: 'domain' };
    }

    // TTTN-02: Kế hoạch TT
    const tttn02Done = ['PLAN_APPROVED', 'IN_PROGRESS', 'STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'];
    if (tttn02Done.includes(status)) {
      this.workflowStatus.tttn02 = { status: 'APPROVED', label: 'Đã duyệt', icon: 'check_circle' };
    } else if (status === 'PLAN_SUBMITTED') {
      this.workflowStatus.tttn02 = { status: 'PENDING', label: 'Chờ duyệt', icon: 'hourglass_top' };
    } else if (status === 'COMPANY_APPROVED') {
      this.workflowStatus.tttn02 = { status: 'NOT_STARTED', label: 'Cần nộp', icon: 'edit_document' };
    } else {
      this.workflowStatus.tttn02 = { status: 'LOCKED', label: 'Chưa mở', icon: 'lock' };
    }

    // TTTN-03: Nhật ký TT
    const tttn03Done = ['STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'];
    if (tttn03Done.includes(status)) {
      this.workflowStatus.tttn03 = { status: 'APPROVED', label: 'Hoàn thành', icon: 'check_circle' };
    } else if (status === 'IN_PROGRESS' || status === 'PLAN_APPROVED') {
      this.workflowStatus.tttn03 = { status: 'PENDING', label: 'Đang ghi', icon: 'menu_book' };
    } else {
      this.workflowStatus.tttn03 = { status: 'LOCKED', label: 'Chưa mở', icon: 'lock' };
    }

    // TTTN-06: Báo cáo TK
    const tttn06Done = ['REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'];
    if (tttn06Done.includes(status)) {
      this.workflowStatus.tttn06 = { status: 'APPROVED', label: 'Đã nộp', icon: 'check_circle' };
    } else if (status === 'STAGE1_EVALUATED') {
      this.workflowStatus.tttn06 = { status: 'NOT_STARTED', label: 'Cần nộp', icon: 'description' };
    } else {
      this.workflowStatus.tttn06 = { status: 'LOCKED', label: 'Chưa mở', icon: 'lock' };
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'APPROVED': return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'NOT_STARTED': return 'bg-slate-100 text-slate-500 border-slate-200';
      case 'LOCKED': return 'bg-slate-50 text-slate-400 border-slate-200 opacity-50';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  }

  generateUpcomingTasks(campaign: any, logs: any[]) {
    this.upcomingTasks = [];
    const status = campaign.status;

    // 1. TTTN-01: Company declaration
    const tttn01Done = ['COMPANY_APPROVED', 'PLAN_SUBMITTED', 'PLAN_APPROVED', 'IN_PROGRESS', 'STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'];
    if (!tttn01Done.includes(status) && status !== 'COMPANY_DECLARED') {
      this.upcomingTasks.push({
        title: 'Kê khai thông tin đơn vị thực tập (TTTN-01)',
        deadline: 'Tuần 1',
        type: 'warning'
      });
    } else if (status === 'COMPANY_DECLARED') {
      this.upcomingTasks.push({
        title: 'Đợi Nhà trường phê duyệt đơn vị thực tập (TTTN-01)',
        deadline: 'Chờ duyệt',
        type: 'info'
      });
    }

    // 2. TTTN-02: Internship plan
    const tttn02Done = ['PLAN_APPROVED', 'IN_PROGRESS', 'STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'];
    if (!tttn02Done.includes(status)) {
      if (status === 'COMPANY_APPROVED') {
        this.upcomingTasks.push({
          title: 'Nộp Đề cương kế hoạch thực tập (TTTN-02)',
          deadline: 'Tuần 2',
          type: 'warning'
        });
      } else if (status === 'PLAN_SUBMITTED') {
        this.upcomingTasks.push({
          title: 'Đợi Giảng viên phê duyệt kế hoạch thực tập (TTTN-02)',
          deadline: 'Chờ duyệt',
          type: 'info'
        });
      }
    }

    // 3. TTTN-03: Weekly logs
    if (tttn02Done.includes(status)) {
      const currentWeekLog = logs.find((l: any) => l.weekNumber === this.currentWeek);
      const isLogDone = currentWeekLog && (currentWeekLog.status === 'SUBMITTED' || currentWeekLog.status === 'APPROVED');
      
      if (!isLogDone && this.currentWeek <= this.totalWeeks) {
        this.upcomingTasks.push({
          title: `Nộp nhật ký thực tập Tuần ${this.currentWeek} (TTTN-03)`,
          deadline: 'Cuối tuần',
          type: 'warning'
        });
      } else {
        this.upcomingTasks.push({
          title: `Đã nộp nhật ký Tuần ${this.currentWeek}. Hãy chuẩn bị nhật ký tuần tới!`,
          deadline: 'Tuần tới',
          type: 'info'
        });
      }
    }

    // 4. TTTN-06: Final report
    const tttn06Done = ['REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'];
    if (!tttn06Done.includes(status)) {
      if (status === 'STAGE1_EVALUATED') {
        this.upcomingTasks.push({
          title: 'Nộp Báo cáo thực tập tốt nghiệp (TTTN-06)',
          deadline: 'Tuần 8',
          type: 'warning'
        });
      }
    } else {
      if (status === 'REPORT_SUBMITTED') {
        this.upcomingTasks.push({
          title: 'Đợi Hội đồng / Giảng viên chấm điểm báo cáo (TTTN-06)',
          deadline: 'Chờ chấm',
          type: 'info'
        });
      }
    }

    if (this.upcomingTasks.length === 0) {
      this.upcomingTasks.push({
        title: 'Chúc mừng! Bạn đã hoàn thành các công việc thực tập.',
        deadline: 'Hoàn thành',
        type: 'info'
      });
    }
  }
}
