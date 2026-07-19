import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WeeklyLogService } from '../../../core/services/weekly-log.service';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { CampaignService } from '../../../core/services/campaign.service';
import { FinalResultService, FinalResultResponse } from '../../../core/services/final-result.service';
import { DepartmentCampaignService } from '../../../core/services/department-campaign.service';
import { EvaluationService } from '../../../core/services/evaluation.service';
import { SurveyService } from '../../../core/services/survey.service';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss']
})
export class StudentDashboardComponent implements OnInit {
  isLoading = true;
  hasCurrentCampaign = true;
  studentName = '';
  studentId = '';
  
  // Tab hiện tại ('roadmap' hoặc 'grades')
  activeTab: 'roadmap' | 'grades' = 'roadmap';
  
  // Thu gọn/Mở rộng Lộ trình chi tiết
  isRoadmapExpanded = false;
  
  // Trạng thái các luồng (TTTN)
  workflowStatus = {
    tttn01: { status: 'NOT_STARTED', label: 'Tiếp nhận', icon: 'domain' },
    tttn02: { status: 'NOT_STARTED', label: 'Kế hoạch', icon: 'edit_document' },
    tttn03: { status: 'NOT_STARTED', label: 'Nhật ký', icon: 'menu_book' },
    tttn06: { status: 'NOT_STARTED', label: 'Báo cáo', icon: 'description' }
  };

  // 5 mốc tiến độ thực tế (timeline động)
  milestones: any[] = [];

  // Tiến trình thực tập (8 tuần)
  currentWeek = 1;
  totalWeeks = 8;
  progressPercent = 0;
  startDate: Date | null = null;
  endDate: Date | null = null;

  // Trạng thái khảo sát & tự đánh giá sinh viên (TTTN-08b)
  isSurveySubmitted = false;
  logs: any[] = [];

  // Lịch trình sắp tới
  upcomingTasks: any[] = [];

  // Thông tin liên hệ
  contacts = {
    teacher: { name: 'Chưa phân công', phone: '-', email: '-' },
    companyMentor: { name: 'Chưa có', phone: '-', email: '-' }
  };

  // Điểm số học phần
  finalResult: FinalResultResponse | null = null;
  hasFinalResult = false;

  // Chi tiết điểm chuẩn đầu ra TTTN-07
  cloDetails: any[] = [];
  stage1Weight = 30;
  stage2Weight = 70;

  constructor(
    private studentCampaignService: StudentCampaignService,
    private weeklyLogService: WeeklyLogService,
    private campaignService: CampaignService,
    private finalResultService: FinalResultService,
    private departmentCampaignService: DepartmentCampaignService,
    private evaluationService: EvaluationService,
    private surveyService: SurveyService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.studentCampaignService.getMyCampaigns().subscribe({
      next: (res) => {
        const campaigns = Array.isArray(res) ? res : (res.data || res.payload || []);
        if (campaigns.length > 0) {
          this.hasCurrentCampaign = true;
          const campaign = campaigns[0];
          this.studentName = campaign.full_name;
          this.studentId = campaign.student_code;

          this.updateWorkflowStatus(campaign.status, campaign, this.logs);

          // Fetch final result
          this.finalResultService.getMyFinalResult().subscribe({
            next: (scoreRes) => {
              if (scoreRes) {
                this.finalResult = scoreRes;
                this.hasFinalResult = true;
                this.loadDetailedScores(campaign.id, campaign.campaign_id, campaign.department_id);
              } else {
                this.hasFinalResult = false;
              }
            },
            error: () => {
              this.hasFinalResult = false;
            }
          });

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

          // Fetch survey status first
          this.surveyService.getSurvey(campaign.id, 'STUDENT_FEEDBACK').subscribe({
            next: (surveyRes) => {
              this.isSurveySubmitted = !!surveyRes;
              this.generateUpcomingTasks(campaign, this.logs);
            },
            error: () => {
              this.isSurveySubmitted = false;
              this.generateUpcomingTasks(campaign, this.logs);
            }
          });

          // Fetch campaign details to calculate calendar-based time progress and timeline milestones
          this.campaignService.getById(campaign.campaign_id).subscribe({
            next: (camp) => {
              // Calculate custom timeline milestones
              this.calculateTimelineMilestones(camp, campaign);

              let start: Date;
              let end: Date;
              const gConfig = campaign.group_config || null;
              const activeSource = gConfig ? gConfig : camp;

              if (activeSource.start_date && activeSource.end_date) {
                const normalizedStart = activeSource.start_date.includes(' ') ? activeSource.start_date.replace(' ', 'T') : activeSource.start_date;
                const normalizedEnd = activeSource.end_date.includes(' ') ? activeSource.end_date.replace(' ', 'T') : activeSource.end_date;
                this.startDate = new Date(normalizedStart);
                this.endDate = new Date(normalizedEnd);
                start = this.startDate;
                end = this.endDate;
              } else {
                // Fallback: 8 weeks starting from campaign enrollment date (createdAt)
                const createdStr = campaign.created_at || new Date().toISOString();
                const normalizedCreated = createdStr.includes(' ') ? createdStr.replace(' ', 'T') : createdStr;
                start = new Date(normalizedCreated);
                end = new Date(start.getTime() + 8 * 7 * 24 * 60 * 60 * 1000);
                this.startDate = start;
                this.endDate = end;
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
              this.startDate = start;
              this.endDate = end;
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
              this.logs = Array.isArray(logRes) ? logRes : (logRes.data || logRes.payload || []);
              this.updateWorkflowStatus(campaign.status, campaign, this.logs);
              this.generateUpcomingTasks(campaign, this.logs);
              this.isLoading = false;
            },
            error: () => {
              this.logs = [];
              this.updateWorkflowStatus(campaign.status, campaign, []);
              this.generateUpcomingTasks(campaign, []);
              this.isLoading = false;
            }
          });
        } else {
          this.hasCurrentCampaign = false;
          this.isLoading = false;
        }
      },
      error: () => {
        this.hasCurrentCampaign = false;
        this.isLoading = false;
      }
    });
  }

  updateWorkflowStatus(status: string, campaign?: any, logs: any[] = this.logs) {
    // TTTN-01: Kê khai ĐVTT
    const tttn01Approved = campaign
      ? campaign.company_info?.company_status === 'APPROVED'
      : ['COMPANY_APPROVED', 'PLAN_SUBMITTED', 'PLAN_APPROVED', 'IN_PROGRESS', 'STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'].includes(status);
    if (tttn01Approved) {
      this.workflowStatus.tttn01 = { status: 'APPROVED', label: 'Đã duyệt', icon: 'check_circle' };
    } else if (status === 'COMPANY_DECLARED') {
      this.workflowStatus.tttn01 = { status: 'PENDING', label: 'Chờ duyệt', icon: 'hourglass_top' };
    } else {
      this.workflowStatus.tttn01 = { status: 'NOT_STARTED', label: 'Chưa nộp', icon: 'domain' };
    }

    // TTTN-02: Kế hoạch TT
    const plans = campaign?.internship_plans || [];
    const hasPlan = plans.length > 0;
    const planApproved = hasPlan && plans.every((plan: any) =>
      plan.gvhd_status === 'APPROVED' && plan.company_status === 'APPROVED'
    );
    if (planApproved) {
      this.workflowStatus.tttn02 = { status: 'APPROVED', label: 'Đã duyệt', icon: 'check_circle' };
    } else if (hasPlan) {
      this.workflowStatus.tttn02 = { status: 'PENDING', label: 'Chờ duyệt', icon: 'hourglass_top' };
    } else if (tttn01Approved) {
      this.workflowStatus.tttn02 = { status: 'NOT_STARTED', label: 'Cần nộp', icon: 'edit_document' };
    } else {
      this.workflowStatus.tttn02 = { status: 'LOCKED', label: 'Chưa mở', icon: 'lock' };
    }

    // TTTN-03: Nhật ký TT
    const logsApproved = logs.length >= this.totalWeeks && logs.every((log: any) => log.supervisor_status === 'APPROVED');
    if (logsApproved) {
      this.workflowStatus.tttn03 = { status: 'APPROVED', label: 'Đã duyệt', icon: 'check_circle' };
    } else if (planApproved) {
      this.workflowStatus.tttn03 = { status: 'PENDING', label: logs.length > 0 ? 'Chờ xác nhận' : 'Đang ghi', icon: 'menu_book' };
    } else {
      this.workflowStatus.tttn03 = { status: 'LOCKED', label: 'Chưa mở', icon: 'lock' };
    }

    // TTTN-06: Báo cáo TK
    const tttn06Done = ['REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'];
    if (tttn06Done.includes(status)) {
      this.workflowStatus.tttn06 = { status: 'APPROVED', label: 'Đã nộp', icon: 'check_circle' };
    } else if (logsApproved) {
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
    const tttn01Approved = campaign.company_info?.company_status === 'APPROVED';
    const plans = campaign.internship_plans || [];
    const hasPlan = plans.length > 0;
    const planApproved = hasPlan && plans.every((plan: any) =>
      plan.gvhd_status === 'APPROVED' && plan.company_status === 'APPROVED'
    );
    const logsApproved = logs.length >= this.totalWeeks && logs.every((log: any) => log.supervisor_status === 'APPROVED');

    // 1. TTTN-01: Company declaration
    if (!tttn01Approved && status !== 'COMPANY_DECLARED') {
      this.upcomingTasks.push({
        title: 'Kê khai thông tin đơn vị thực tập (TTTN-01)',
        deadline: 'Tuần 1',
        type: 'warning',
        route: '/student/internship-report'
      });
    } else if (status === 'COMPANY_DECLARED') {
      this.upcomingTasks.push({
        title: 'Đợi Nhà trường phê duyệt đơn vị thực tập (TTTN-01)',
        deadline: 'Chờ duyệt',
        type: 'info'
      });
    }

    // 2. TTTN-02: Internship plan
    if (!planApproved) {
      if (tttn01Approved && !hasPlan) {
        this.upcomingTasks.push({
          title: 'Nộp Đề cương kế hoạch thực tập (TTTN-02)',
          deadline: 'Tuần 2',
          type: 'warning',
          route: '/student/internship-report'
        });
      } else if (hasPlan) {
        this.upcomingTasks.push({
          title: 'Đợi Giảng viên phê duyệt kế hoạch thực tập (TTTN-02)',
          deadline: 'Chờ duyệt',
          type: 'info'
        });
      }
    }

    // 3. TTTN-03: Weekly logs
    if (planApproved && !logsApproved) {
      const currentWeekLog = logs.find((l: any) => (l.weekNumber ?? l.week_number) === this.currentWeek);
      const isLogDone = currentWeekLog && currentWeekLog.supervisor_status === 'APPROVED';
      
      if (!isLogDone && this.currentWeek <= this.totalWeeks) {
        this.upcomingTasks.push({
          title: `Nộp nhật ký thực tập Tuần ${this.currentWeek} (TTTN-03)`,
          deadline: 'Cuối tuần',
          type: 'warning',
          route: '/student/internship-report'
        });
      } else {
        this.upcomingTasks.push({
          title: `Đã nộp nhật ký Tuần ${this.currentWeek}. Hãy chuẩn bị nhật ký tuần tới!`,
          deadline: 'Tuần tới',
          type: 'info'
        });
      }
    }

    // 4. Khảo sát & Tự đánh giá sinh viên (TTTN-08b)
    if (!this.isSurveySubmitted) {
      this.upcomingTasks.push({
        title: 'Khảo sát & Tự nhận xét kết quả thực tập tốt nghiệp (TTTN-08b)',
        deadline: 'Hạn cuối đợt',
        type: 'warning',
        route: '/student/survey'
      });
    } else {
      this.upcomingTasks.push({
        title: 'Đã hoàn thành Khảo sát & Tự nhận xét kết quả (TTTN-08b)',
        deadline: 'Hoàn thành',
        type: 'info'
      });
    }

    // 5. TTTN-06: Final report
    const tttn06Done = ['REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'];
    if (!tttn06Done.includes(status)) {
      if (logsApproved) {
        this.upcomingTasks.push({
          title: 'Nộp Báo cáo thực tập tốt nghiệp (TTTN-06)',
          deadline: 'Tuần 8',
          type: 'warning',
          route: '/student/internship-report'
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

    // Use dynamic cohort group config if available
    const gConfig = studentCampaign.group_config || null;
    const activeSource = gConfig ? gConfig : camp;

    // Định nghĩa 5 chặng timeline
    const mConfigs = [
      {
        key: 'tttn01',
        title: 'Kê khai Đơn vị thực tập',
        code: 'TTTN-01',
        description: 'Đăng ký thông tin công ty tiếp nhận thực tập và xin xác nhận của GVHD.',
        startDate: parseDate(activeSource.tttn01_start_date),
        deadline: parseDate(activeSource.tttn01_deadline),
        isCompleted: ['COMPANY_APPROVED', 'PLAN_SUBMITTED', 'PLAN_APPROVED', 'IN_PROGRESS', 'STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'].includes(status),
        isPending: status === 'COMPANY_DECLARED',
        icon: 'domain',
        stepCode: 'TTTN-01'
      },
      {
        key: 'tttn02',
        title: 'Nộp Đề cương kế hoạch',
        code: 'TTTN-02',
        description: 'Lập đề cương chi tiết các tuần thực tập và gửi giảng viên hướng dẫn duyệt.',
        startDate: parseDate(activeSource.tttn02_start_date),
        deadline: parseDate(activeSource.tttn02_deadline),
        isCompleted: ['PLAN_APPROVED', 'IN_PROGRESS', 'STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'].includes(status),
        isPending: status === 'PLAN_SUBMITTED',
        icon: 'edit_document',
        stepCode: 'TTTN-02'
      },
      {
        key: 'tttn03',
        title: 'Báo cáo Nhật ký tuần',
        code: 'TTTN-03',
        description: 'Cập nhật tiến độ công việc hàng tuần để giảng viên và người hướng dẫn theo dõi.',
        startDate: parseDate(activeSource.tttn03_start_date),
        deadline: parseDate(activeSource.tttn03_deadline),
        isCompleted: ['STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'].includes(status),
        isPending: status === 'IN_PROGRESS' || status === 'PLAN_APPROVED',
        icon: 'menu_book',
        stepCode: 'TTTN-03'
      },
      {
        key: 'midterm',
        title: 'Nhận xét & Đánh giá giữa kỳ',
        code: 'Giữa kỳ',
        description: 'Được giảng viên và doanh nghiệp đánh giá kết quả thực tập giai đoạn đầu.',
        startDate: parseDate(activeSource.midterm_start_date),
        deadline: parseDate(activeSource.midterm_deadline),
        isCompleted: ['STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'].includes(status),
        isPending: false,
        icon: 'rate_review',
        stepCode: 'TTTN-03'
      },
      {
        key: 'tttn06',
        title: 'Nộp Báo cáo cuối kỳ',
        code: 'TTTN-06',
        description: 'Nộp file báo cáo thực tập chính thức và bản tự nhận xét kết quả (TTTN-08b).',
        startDate: parseDate(activeSource.tttn06_start_date),
        deadline: parseDate(activeSource.tttn06_deadline),
        isCompleted: ['REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'].includes(status),
        isPending: status === 'REPORT_SUBMITTED',
        icon: 'description',
        stepCode: 'TTTN-06'
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

  goToMilestone(milestone: any) {
    if (milestone.state === 'LOCKED') {
      return;
    }
    this.router.navigate(['/student/internship-report'], { queryParams: { step: milestone.stepCode } });
  }

  getConvertedScore(score: any): number {
    if (score === null || score === undefined) return 0;
    const value = Number(score);
    if (Number.isNaN(value)) return 0;
    return Math.min(10, Math.max(0, value));
  }

  loadDetailedScores(studentCampaignId: number, campaignId: number, departmentId: number) {
    this.departmentCampaignService.findOrCreate(campaignId, departmentId).subscribe({
      next: (dcRes) => {
        const dc = dcRes.data || dcRes.payload || dcRes;
        this.stage1Weight = dc.stage1_weight !== null ? dc.stage1_weight : 30;
        this.stage2Weight = dc.stage2_weight !== null ? dc.stage2_weight : 70;
        const configClos = dc.clo_configs || [];

        this.evaluationService.findEvaluations(studentCampaignId).subscribe({
          next: (evalsRes) => {
            const evals = Array.isArray(evalsRes) ? evalsRes : (evalsRes.data || evalsRes.payload || []);
            
            this.cloDetails = configClos.map((clo: any) => {
              const cloCode = clo.clo_code;
              
              // Stage 1
              const s1Evals = evals.filter((e: any) => e.stage === 'STAGE_1');
              const s1GvhdScoreItems = s1Evals
                .filter((e: any) => e.evaluator_type === 'GVHD')
                .flatMap((e: any) => (e.scores || []).filter((s: any) => s.clo_code === cloCode));
              const s1GvhdScores = s1GvhdScoreItems.map((s: any) => this.getConvertedScore(s.score_level));
              const s1GvhdScore = s1GvhdScores.length > 0 ? (s1GvhdScores.reduce((a: number, b: number) => a + b, 0) / s1GvhdScores.length) : null;

              const s1CompanyScoreItems = s1Evals
                .filter((e: any) => e.evaluator_type === 'COMPANY_SUPERVISOR' || e.evaluator_type === 'COMPANY')
                .flatMap((e: any) => (e.scores || []).filter((s: any) => s.clo_code === cloCode));
              const s1CompanyScores = s1CompanyScoreItems.map((s: any) => this.getConvertedScore(s.score_level));
              const s1CompanyScore = s1CompanyScores.length > 0 ? (s1CompanyScores.reduce((a: number, b: number) => a + b, 0) / s1CompanyScores.length) : null;

              const betaGvhd = clo.gvhd_beta !== null ? clo.gvhd_beta : 50;
              const betaCompany = clo.company_beta !== null ? clo.company_beta : 50;

              let s1GvhdPart = s1GvhdScore !== null ? s1GvhdScore : 0;
              let s1CompanyPart = s1CompanyScore !== null ? s1CompanyScore : 0;
              let s1Tb: number | null = null;
              if (s1GvhdScore !== null || s1CompanyScore !== null) {
                s1Tb = (s1GvhdPart * betaGvhd + s1CompanyPart * betaCompany) / 100.0;
              }

              // Stage 2
              const s2Evals = evals.filter((e: any) => e.stage === 'STAGE_2');
              const s2GvhdScoreItems = s2Evals
                .filter((e: any) => e.evaluator_type === 'GVHD')
                .flatMap((e: any) => (e.scores || []).filter((s: any) => s.clo_code === cloCode));
              const s2GvhdScores = s2GvhdScoreItems.map((s: any) => this.getConvertedScore(s.score_level));
              const s2GvhdScore = s2GvhdScores.length > 0 ? (s2GvhdScores.reduce((a: number, b: number) => a + b, 0) / s2GvhdScores.length) : null;

              const s2CompanyScoreItems = s2Evals
                .filter((e: any) => e.evaluator_type === 'COMPANY_SUPERVISOR' || e.evaluator_type === 'COMPANY')
                .flatMap((e: any) => (e.scores || []).filter((s: any) => s.clo_code === cloCode));
              const s2CompanyScores = s2CompanyScoreItems.map((s: any) => this.getConvertedScore(s.score_level));
              const s2CompanyScore = s2CompanyScores.length > 0 ? (s2CompanyScores.reduce((a: number, b: number) => a + b, 0) / s2CompanyScores.length) : null;

              let s2GvhdPart = s2GvhdScore !== null ? s2GvhdScore : 0;
              let s2CompanyPart = s2CompanyScore !== null ? s2CompanyScore : 0;
              let s2Tb: number | null = null;
              if (s2GvhdScore !== null || s2CompanyScore !== null) {
                s2Tb = (s2GvhdPart * betaGvhd + s2CompanyPart * betaCompany) / 100.0;
              }

              // CLOi
              let cloFinal: number | null = null;
              const cloStage1Weight = clo.stage1_weight !== null && clo.stage1_weight !== undefined ? clo.stage1_weight : this.stage1Weight;
              const cloStage2Weight = clo.stage2_weight !== null && clo.stage2_weight !== undefined ? clo.stage2_weight : this.stage2Weight;

              if (s1Tb !== null || s2Tb !== null) {
                const s1Part = s1Tb !== null ? s1Tb : 0;
                const s2Part = s2Tb !== null ? s2Tb : 0;
                cloFinal = (s1Part * cloStage1Weight + s2Part * cloStage2Weight) / 100.0;
              }

              const alpha = clo.alpha_weight !== null ? clo.alpha_weight : 15;
              const cloConverted = cloFinal !== null ? (cloFinal * alpha / 100.0) : null;

              return {
                clo_code: cloCode,
                description: clo.description,
                s1_company: s1CompanyScore,
                s1_gvhd: s1GvhdScore,
                s1_tb: s1Tb,
                s1_company_comment: this.getScoreComments(s1CompanyScoreItems),
                s1_gvhd_comment: this.getScoreComments(s1GvhdScoreItems),
                s2_company: s2CompanyScore,
                s2_gvhd: s2GvhdScore,
                s2_tb: s2Tb,
                s2_company_comment: this.getScoreComments(s2CompanyScoreItems),
                s2_gvhd_comment: this.getScoreComments(s2GvhdScoreItems),
                clo_final: cloFinal,
                alpha_weight: alpha,
                stage1_weight: cloStage1Weight,
                stage2_weight: cloStage2Weight,
                clo_converted: cloConverted
              };
            });
          },
          error: () => {
            this.cloDetails = [];
          }
        });
      },
      error: () => {
        this.cloDetails = [];
      }
    });
  }

  getScoreComments(scoreItems: any[]): string | null {
    const comments = (scoreItems || [])
      .map((s: any) => (s.comment || s.short_comment || '').trim())
      .filter((comment: string) => comment.length > 0);
    return comments.length > 0 ? comments.join('; ') : null;
  }
}
