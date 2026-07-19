import { ToastService } from '../../../core/services/toast.service';
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

  constructor(private toastService: ToastService, private studentCampaignService: StudentCampaignService) {}

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
        this.toastService.error('Lỗi tải dữ liệu');
        this.isLoading = false;
      }
    });
  }

  updateStatus() {
    if (!this.campaign) return;

    const plans = this.campaign.internship_plans || [];
    const hasPlans = plans.length > 0;
    const allApproved = hasPlans && plans.every((plan: any) =>
      plan.gvhd_status === 'APPROVED' && plan.company_status === 'APPROVED'
    );
    const hasAnyApproved = plans.some((plan: any) =>
      plan.gvhd_status === 'APPROVED' || plan.company_status === 'APPROVED'
    );

    if (allApproved) {
      this.status.label = 'Đã duyệt';
      this.status.message = 'Kế hoạch đã được GVHD và ĐVHD phê duyệt';
      this.isLocked = true;
      this.canAccess = true;
    } else if (hasPlans) {
      this.status.label = 'Chờ duyệt';
      let detailMsg = 'Đã được duyệt 1 phía, chờ phía còn lại';
      if (hasAnyApproved) {
        const firstPlan: any = plans[0];
        const gvhdApproved = firstPlan.gvhd_status === 'APPROVED';
        const companyApproved = firstPlan.company_status === 'APPROVED';
        
        if (gvhdApproved && !companyApproved) {
          detailMsg = 'Đã được GVHD duyệt, Đang chờ ĐVHD duyệt';
        } else if (!gvhdApproved && companyApproved) {
          detailMsg = 'Đã được ĐVHD duyệt, Đang chờ GVHD duyệt';
        }
      } else {
        detailMsg = 'Đang chờ GVHD và ĐVHD duyệt';
      }
      this.status.message = detailMsg;
      this.isLocked = true;
      this.canAccess = true;
    } else if (this.campaign.company_info?.company_status === 'APPROVED') {
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
      this.toastService.error('Vui lòng nhập đầy đủ nội dung công việc cho cả 8 tuần.');
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
    this.studentCampaignService.submitInternshipPlan(payload).subscribe({
      next: () => {
        this.toastService.success('Nộp kế hoạch thành công!');
        this.isSaving = false;
        this.isLocked = true;
        this.campaign!.status = 'PLAN_SUBMITTED';
        this.updateStatus();
      },
      error: (err: any) => {
        this.toastService.error(err.error?.message || 'Có lỗi xảy ra khi nộp kế hoạch.');
        this.isSaving = false;
      }
    });
  }
}
