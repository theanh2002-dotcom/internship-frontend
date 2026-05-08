import { Component, OnInit } from '@angular/core';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { InternshipPlanRequest } from '../../../core/models/request.model';
import { StudentCampaignResponse } from '../../../core/models/base.model';

interface WeekPlan {
  weekNumber: number;
  tasks: string;
  expectedResults: string;
  evidences: string;
  clos: number[];
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
  isLocked = false; // Bị khóa nếu đã nộp hoặc đã duyệt

  status = {
    label: 'Chưa có kế hoạch',
    message: 'Bạn chưa nộp kế hoạch thực tập'
  };

  availableClos = [1, 2, 3, 4, 5, 6, 7];

  weeks: WeekPlan[] = [
    { weekNumber: 1, tasks: '', expectedResults: '', evidences: '', clos: [] },
    { weekNumber: 2, tasks: '', expectedResults: '', evidences: '', clos: [] },
    { weekNumber: 3, tasks: '', expectedResults: '', evidences: '', clos: [] },
    { weekNumber: 4, tasks: '', expectedResults: '', evidences: '', clos: [] },
    { weekNumber: 5, tasks: '', expectedResults: '', evidences: '', clos: [] },
    { weekNumber: 6, tasks: '', expectedResults: '', evidences: '', clos: [] },
    { weekNumber: 7, tasks: '', expectedResults: '', evidences: '', clos: [] },
    { weekNumber: 8, tasks: '', expectedResults: '', evidences: '', clos: [] }
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
    
    if (this.campaign.status === 'PLAN_APPROVED' || this.campaign.status === 'EVALUATED') {
      this.status.label = 'Đã duyệt';
      this.status.message = 'Kế hoạch đã được GVHD và ĐVHD phê duyệt';
      this.isLocked = true;
    } else if (this.campaign.status === 'PLAN_SUBMITTED') {
      this.status.label = 'Chờ duyệt';
      this.status.message = 'Đang chờ GVHD/ĐVHD duyệt';
      this.isLocked = true;
    } else if (this.campaign.status === 'COMPANY_APPROVED' || this.campaign.status === 'COMPANY_DECLARED') {
      this.status.label = 'Chưa nộp';
      this.status.message = 'Vui lòng nộp kế hoạch thực tập';
      this.isLocked = false;
    } else {
      this.status.label = 'Chưa bắt đầu';
      this.status.message = 'Cần hoàn thành kê khai TTTN-01 trước';
      this.isLocked = true; // Block editing if they haven't declared company
    }
  }

  populatePlans() {
    if (this.campaign?.internship_plans && this.campaign.internship_plans.length > 0) {
      this.campaign.internship_plans.forEach((plan: any) => {
        const weekObj = this.weeks.find(w => w.weekNumber === plan.week);
        if (weekObj) {
          weekObj.tasks = plan.task;
          if (plan.clo_mapped) {
            weekObj.clos = plan.clo_mapped.split(',').map((c: string) => parseInt(c, 10)).filter((n: number) => !isNaN(n));
          }
        }
      });
    }
  }

  toggleClo(week: WeekPlan, clo: number) {
    if (this.isLocked) return;
    
    const index = week.clos.indexOf(clo);
    if (index > -1) {
      week.clos.splice(index, 1);
    } else {
      week.clos.push(clo);
    }
  }

  hasClo(week: WeekPlan, clo: number): boolean {
    return week.clos.includes(clo);
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
      studentCampaignId: this.campaign.id,
      tasks: this.weeks.map(w => ({
        week: w.weekNumber,
        taskDescription: w.tasks,
        expectedResult: w.expectedResults || '' // Backend actually expects 'task', wait I need to check InternshipPlanRequest model
      }))
    };

    // WAIT: I need to map it correctly to InternshipPlanRequest
    // Let's modify the mapping to match the backend InternshipPlanRequest structure
    const backendPayload: any = {
      student_campaign_id: this.campaign.id,
      plans: this.weeks.map(w => ({
        week: w.weekNumber,
        task: w.tasks,
        clo_mapped: w.clos.join(',')
      }))
    };

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.studentCampaignService.submitInternshipPlan(backendPayload).subscribe({
      next: (res) => {
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

