import { Component, OnInit } from '@angular/core';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { ActivatedRoute } from '@angular/router';
import { WeeklyLogService } from '../../../core/services/weekly-log.service';
import { FinalReportService } from '../../../core/services/final-report.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-internship-report',
  templateUrl: './internship-report.component.html',
  styleUrls: ['./internship-report.component.scss']
})
export class InternshipReportComponent implements OnInit {
  isLoading = true;
  campaign: any = null;
  weeklyLogs: any[] = [];
  finalReports: any[] = [];
  
  // Các bước có thể: 'TTTN-01', 'TTTN-02', 'TTTN-03', 'TTTN-06'
  currentStep: string = 'TTTN-01';
  maxUnlockedStep: string = 'TTTN-01';
  private requestedStep: string | null = null;

  constructor(
    private campaignService: StudentCampaignService,
    private route: ActivatedRoute,
    private weeklyLogService: WeeklyLogService,
    private finalReportService: FinalReportService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.requestedStep = params['step'] || null;
      this.applyRequestedStep();
    });
    this.loadCampaign();
  }

  loadCampaign() {
    this.isLoading = true;
    this.campaignService.getMyCampaigns().subscribe({
      next: (res) => {
        const campaigns = Array.isArray(res) ? res : (res.data || res.payload || []);
        if (campaigns.length > 0) {
          this.campaign = campaigns[0];
          this.loadWorkflowArtifacts();
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  loadWorkflowArtifacts(): void {
    if (!this.campaign) return;
    forkJoin({
      weeklyLogs: this.weeklyLogService.findByStudentCampaign(this.campaign.id).pipe(catchError(() => of([]))),
      finalReports: this.finalReportService.getFinalReports(this.campaign.id).pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ weeklyLogs, finalReports }) => {
        this.weeklyLogs = this.unwrapList(weeklyLogs);
        this.finalReports = this.unwrapList(finalReports);
        this.determineUnlock();
        this.applyRequestedStep();
        this.isLoading = false;
      },
      error: () => {
        this.weeklyLogs = [];
        this.finalReports = [];
        this.determineUnlock();
        this.applyRequestedStep();
        this.isLoading = false;
      }
    });
  }

  determineUnlock() {
    if (!this.isTttn01Approved()) {
      this.maxUnlockedStep = 'TTTN-01';
      this.currentStep = 'TTTN-01';
    } else if (!this.hasTttn02Plan() || !this.isTttn02Approved()) {
      this.maxUnlockedStep = 'TTTN-02';
      this.currentStep = 'TTTN-02';
    } else if (!this.isTttn03Approved()) {
      this.maxUnlockedStep = 'TTTN-03';
      this.currentStep = 'TTTN-03';
    } else {
      this.maxUnlockedStep = 'TTTN-06';
      this.currentStep = 'TTTN-06';
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
    if (this.isTttn01Approved()) return 'Đã duyệt';
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
    if (!this.hasTttn02Plan()) return 'Chưa lập';
    if (this.isTttn02Approved()) return 'Đã duyệt';
    return 'Chờ duyệt';
  }

  getTttn03Status(): string {
    if (!this.campaign) return '';
    if (this.isTttn03Approved()) return 'Đã duyệt';
    if (this.weeklyLogs.length > 0) return 'Chờ xác nhận';
    return 'Chưa nhập';
  }

  private applyRequestedStep(): void {
    if (this.requestedStep && this.isUnlocked(this.requestedStep)) {
      this.currentStep = this.requestedStep;
    }
  }

  private isTttn01Approved(): boolean {
    return this.campaign?.company_info?.company_status === 'APPROVED';
  }

  private hasTttn02Plan(): boolean {
    return Array.isArray(this.campaign?.internship_plans) && this.campaign.internship_plans.length > 0;
  }

  private isTttn02Approved(): boolean {
    return this.hasTttn02Plan() && this.campaign.internship_plans.every((plan: any) =>
      plan.gvhd_status === 'APPROVED' && plan.company_status === 'APPROVED'
    );
  }

  private isTttn03Approved(): boolean {
    return this.weeklyLogs.length >= 8 && this.weeklyLogs.every((log: any) => log.supervisor_status === 'APPROVED');
  }

  private unwrapList(value: any): any[] {
    return Array.isArray(value) ? value : (value?.data || value?.payload || []);
  }
}
