import { Component, OnInit } from '@angular/core';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-company-dashboard',
  templateUrl: './company-dashboard.component.html',
  styleUrls: ['./company-dashboard.component.scss']
})
export class CompanyDashboardComponent implements OnInit {
  companyName = 'Doanh nghiệp Thực tập';
  mentorName = 'Cán bộ hướng dẫn';
  isLoading = true;

  // Thống kê chung
  stats = {
    totalInterns: 0,
    pendingPlanApprovals: 0, // Chờ duyệt TTTN-02
    pendingWeeklyLogs: 0,    // Chờ xác nhận TTTN-03
    evaluationPending: 0     // Chờ chấm điểm chặng 1
  };

  // Cảnh báo công việc cần xử lý
  actionItems: any[] = [];

  // Danh sách thực tập sinh đang quản lý
  internList: any[] = [];

  constructor(
    private studentCampaignService: StudentCampaignService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.mentorName = user?.fullName || 'Cán bộ hướng dẫn';
    this.loadRealData();
  }

  loadRealData() {
    this.isLoading = true;
    this.studentCampaignService.getCompanyStudents().subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res : (res.data || res.payload || []);
        
        // 1. Thống kê tổng quan
        this.stats.totalInterns = data.length;
        
        // Chờ duyệt kế hoạch: status là PLAN_SUBMITTED hoặc PLAN_APPROVED nhưng có ít nhất 1 tuần plan mà doanh nghiệp chưa duyệt
        this.stats.pendingPlanApprovals = data.filter((s: any) => 
          s.status === 'PLAN_SUBMITTED' || 
          (s.status === 'PLAN_APPROVED' && s.internship_plans && s.internship_plans.some((p: any) => p.company_status === 'PENDING'))
        ).length;

        // Cần xác nhận tuần: các bạn đang thực tập tích cực (IN_PROGRESS)
        this.stats.pendingWeeklyLogs = data.filter((s: any) => s.status === 'IN_PROGRESS').length;

        // Chờ chấm điểm: đang thực tập tích cực (IN_PROGRESS) nhưng chưa chuyển sang STAGE1_EVALUATED
        this.stats.evaluationPending = data.filter((s: any) => s.status === 'IN_PROGRESS').length;

        if (data.length > 0) {
          const first = data[0];
          if (first.company_info) {
            this.companyName = first.company_info.company_name || 'Doanh nghiệp Thực tập';
          }
        }

        // 2. Danh sách thực tập sinh
        this.internList = data.map((s: any) => {
          return {
            id: s.id,
            name: s.full_name,
            mssv: s.student_code,
            position: s.company_info?.expected_domain || 'Thực tập sinh',
            status: s.status === 'IN_PROGRESS' || s.status === 'STAGE1_EVALUATED' || s.status === 'REPORT_SUBMITTED' || s.status === 'STAGE2_EVALUATED' || s.status === 'COMPLETED' ? 'Đang thực tập' : 'Chờ xử lý',
            week: 1
          };
        });

        // 3. Công việc cần xử lý
        this.actionItems = [];
        if (this.stats.pendingPlanApprovals > 0) {
          this.actionItems.push({
            type: 'Yêu cầu',
            message: `Có ${this.stats.pendingPlanApprovals} kế hoạch học tập cần duyệt`,
            action: 'Duyệt ngay',
            priority: 'high',
            link: '/company/manage-interns'
          });
        }
        if (this.stats.evaluationPending > 0) {
          this.actionItems.push({
            type: 'Đánh giá',
            message: `Có ${this.stats.evaluationPending} thực tập sinh cần chấm điểm`,
            action: 'Đánh giá',
            priority: 'medium',
            link: '/company/manage-interns'
          });
        }
        if (this.actionItems.length === 0 && data.length > 0) {
          this.actionItems.push({
            type: 'Thông báo',
            message: `Đang hướng dẫn ${data.length} thực tập sinh ổn định`,
            action: 'Xem',
            priority: 'low',
            link: '/company/manage-interns'
          });
        }

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
