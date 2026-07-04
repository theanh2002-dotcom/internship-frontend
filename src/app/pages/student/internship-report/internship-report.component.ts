import { Component, OnInit } from '@angular/core';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-internship-report',
  templateUrl: './internship-report.component.html',
  styleUrls: ['./internship-report.component.scss']
})
export class InternshipReportComponent implements OnInit {
  isLoading = true;
  campaign: any = null;
  
  // Các bước có thể: 'TTTN-01', 'TTTN-02', 'TTTN-03', 'TTTN-06'
  currentStep: string = 'TTTN-01';
  maxUnlockedStep: string = 'TTTN-01';

  constructor(
    private campaignService: StudentCampaignService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadCampaign();
  }

  loadCampaign() {
    this.isLoading = true;
    this.campaignService.getMyCampaigns().subscribe({
      next: (res) => {
        const campaigns = Array.isArray(res) ? res : (res.data || res.payload || []);
        if (campaigns.length > 0) {
          this.campaign = campaigns[0];
          this.determineUnlock(this.campaign.status);
          
          this.route.queryParams.subscribe(params => {
            if (params['step']) {
              const step = params['step'];
              if (this.isUnlocked(step)) {
                this.currentStep = step;
              }
            }
          });
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  determineUnlock(status: string) {
    // Logic xác định step mở khóa lớn nhất hiện tại
    const tttn02Statuses = ['COMPANY_APPROVED', 'PLAN_SUBMITTED', 'PLAN_APPROVED', 'IN_PROGRESS', 'STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'];
    const tttn03Statuses = ['PLAN_APPROVED', 'IN_PROGRESS', 'STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'];
    const tttn06Statuses = ['STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'];

    if (tttn06Statuses.includes(status)) {
      this.maxUnlockedStep = 'TTTN-06';
      this.currentStep = 'TTTN-06';
    } else if (tttn03Statuses.includes(status)) {
      this.maxUnlockedStep = 'TTTN-03';
      this.currentStep = 'TTTN-03';
    } else if (tttn02Statuses.includes(status)) {
      this.maxUnlockedStep = 'TTTN-02';
      this.currentStep = 'TTTN-02';
    } else {
      this.maxUnlockedStep = 'TTTN-01';
      this.currentStep = 'TTTN-01';
    }
  }

  setStep(step: string) {
    // Chỉ cho phép chuyển tới bước nếu nó <= maxUnlockedStep
    const steps = ['TTTN-01', 'TTTN-02', 'TTTN-03', 'TTTN-06'];
    const reqIdx = steps.indexOf(step);
    const maxIdx = steps.indexOf(this.maxUnlockedStep);
    
    if (reqIdx <= maxIdx) {
      this.currentStep = step;
    }
  }

  isUnlocked(step: string): boolean {
    const steps = ['TTTN-01', 'TTTN-02', 'TTTN-03', 'TTTN-06'];
    return steps.indexOf(step) <= steps.indexOf(this.maxUnlockedStep);
  }

  getTttn01Status(): string {
    if (!this.campaign) return 'Chưa gửi';
    const s = this.campaign.status;
    if (s === 'IMPORTED' || s === 'ACTIVE') return 'Chưa kê khai';
    if (s === 'COMPANY_DECLARED') return 'Chờ duyệt';
    if (s === 'DRAFT') return 'Chưa kê khai';
    if (s === 'PENDING_COMPANY') return 'Chờ duyệt';
    if (s === 'COMPANY_REJECTED') return 'Bị từ chối';
    return 'Đã duyệt'; // COMPANY_APPROVED and beyond
  }

  getTttn02Status(): string {
    if (!this.campaign) return '';
    const s = this.campaign.status;
    if (['IMPORTED', 'ACTIVE', 'COMPANY_DECLARED', 'COMPANY_APPROVED'].includes(s)) return 'Chưa lập';
    if (['DRAFT', 'PENDING_COMPANY', 'COMPANY_REJECTED', 'COMPANY_APPROVED'].includes(s)) return 'Chưa lập';
    if (s === 'PLAN_SUBMITTED') return 'Chờ duyệt';
    if (s === 'PLAN_REJECTED') return 'Bị từ chối';
    if (s === 'PLAN_APPROVED') return 'Đã duyệt 1 phần';
    return 'Đã duyệt';
  }
}
