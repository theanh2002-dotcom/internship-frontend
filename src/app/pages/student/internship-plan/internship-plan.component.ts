import { Component, OnInit } from '@angular/core';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { InternshipPlanRequest } from '../../../core/models/request.model';
import { StudentCampaignResponse } from '../../../core/models/base.model';

interface WeekPlan {
  weekNumber: number;
  tasks: string;
  expectedResults: string;
  evidences: string;
}

@Component({
  selector: 'app-internship-plan',
  templateUrl: './internship-plan.component.html',
  styleUrls: ['./internship-plan.component.scss']
})
export class InternshipPlanComponent implements OnInit {
  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  campaign: StudentCampaignResponse | null = null;
  isLocked = false;
  canAccess = false;

  status = {
    label: 'Chưa có kế hoạch',
    message: 'Bạn chưa nộp kế hoạch thực tập'
  };

  weeks: WeekPlan[] = [
    { weekNumber: 1, tasks: '', expectedResults: '', evidences: '' },
    { weekNumber: 2, tasks: '', expectedResults: '', evidences: '' },
    { weekNumber: 3, tasks: '', expectedResults: '', evidences: '' },
    { weekNumber: 4, tasks: '', expectedResults: '', evidences: '' },
    { weekNumber: 5, tasks: '', expectedResults: '', evidences: '' },
    { weekNumber: 6, tasks: '', expectedResults: '', evidences: '' },
    { weekNumber: 7, tasks: '', expectedResults: '', evidences: '' },
    { weekNumber: 8, tasks: '', expectedResults: '', evidences: '' }
  ];

  constructor(private studentCampaignService: StudentCampaignService) {}

  ngOnInit(): void {
    this.loadCampaign();
  }

  loadCampaign() {
    this.studentCampaignService.getMyCampaigns().subscribe({
      next: (res) => {
        const campaigns = Array.isArray(res) ? res : (res.data || res.payload || []);
        if (campaigns.length > 0) {
          this.campaign = campaigns[0];
          this.updateStatus();
          this.populatePlans();
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Lỗi tải dữ liệu';
        this.isLoading = false;
      }
    });
  }

  updateStatus() {
    if (!this.campaign) return;
    
    const advancedStatuses = ['IN_PROGRESS', 'STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'];
    if (advancedStatuses.includes(this.campaign.status)) {
      this.status.label = 'Đã duyệt';
      this.status.message = 'Kế hoạch đã được GVHD và ĐVHD phê duyệt';
      this.isLocked = true;
      this.canAccess = true;
    } else if (this.campaign.status === 'PLAN_SUBMITTED') {
      this.status.label = 'Chờ duyệt';
      this.status.message = 'Đang chờ GVHD và ĐVHD duyệt';
      this.isLocked = true;
      this.canAccess = true;
    } else if (this.campaign.status === 'PLAN_APPROVED') {
      let detailMsg = 'Đã được duyệt 1 phía, chờ phía còn lại';
      if (this.campaign.internship_plans && this.campaign.internship_plans.length > 0) {
        const firstPlan: any = this.campaign.internship_plans[0];
        const gvhdApproved = firstPlan.gvhd_status === 'APPROVED';
        const companyApproved = firstPlan.company_status === 'APPROVED';
        
        if (gvhdApproved && !companyApproved) {
          detailMsg = 'Đã được GVHD duyệt, Đang chờ ĐVHD duyệt';
        } else if (!gvhdApproved && companyApproved) {
          detailMsg = 'Đã được ĐVHD duyệt, Đang chờ GVHD duyệt';
        }
      }
      this.status.label = 'Chờ duyệt';
      this.status.message = detailMsg;
      this.isLocked = true;
      this.canAccess = true;
    } else if (this.campaign.status === 'COMPANY_APPROVED') {
      this.status.label = 'Chưa nộp';
      this.status.message = 'Vui lòng nộp kế hoạch thực tập';
      this.isLocked = false;
      this.canAccess = true;
    } else {
      this.status.label = 'Chưa bắt đầu';
      this.status.message = 'Cần hoàn thành và được duyệt TTTN-01 trước';
      this.isLocked = true;
      this.canAccess = false;
    }
  }

  populatePlans() {
    if (this.campaign?.internship_plans && this.campaign.internship_plans.length > 0) {
      this.campaign.internship_plans.forEach((plan: any) => {
        const weekObj = this.weeks.find(w => w.weekNumber === plan.week);
        if (weekObj) {
          weekObj.tasks = plan.task || '';
          weekObj.expectedResults = plan.expected_result || '';
          weekObj.evidences = plan.evidence_form || '';
        }
      });
    }
  }

  onSubmit() {
    if (!this.campaign || this.isLocked) return;

    // Validate
    const hasEmptyTask = this.weeks.some(w => !w.tasks || w.tasks.trim() === '');
    if (hasEmptyTask) {
      this.errorMessage = 'Vui lòng nhập đầy đủ nội dung công việc cho cả 8 tuần.';
      return;
    }

    const payload: InternshipPlanRequest = {
      student_campaign_id: this.campaign.id,
      plans: this.weeks.map(w => ({
        week: w.weekNumber,
        task: w.tasks,
        expected_result: w.expectedResults || '',
        evidence_form: w.evidences || '',
        clo_mapped: ''
      }))
    };

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.studentCampaignService.submitInternshipPlan(payload).subscribe({
      next: () => {
        this.successMessage = 'Nộp kế hoạch thành công!';
        this.isSaving = false;
        this.isLocked = true;
        this.campaign!.status = 'PLAN_SUBMITTED';
        this.updateStatus();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Có lỗi xảy ra khi nộp kế hoạch.';
        this.isSaving = false;
      }
    });
  }
}
