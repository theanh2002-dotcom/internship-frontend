import { Component, OnInit } from '@angular/core';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-teacher-dashboard',
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.scss']
})
export class TeacherDashboardComponent implements OnInit {
  teacherName = 'Giảng viên';
  isLoading = true;
  
  // Thống kê tổng quan
  overviewStats = {
    totalStudents: 0,
    companyApproved: 0,
    planApproved: 0,
    reportSubmitted: 0
  };

  // Yêu cầu chờ xử lý
  pendingRequests = {
    tttn01: 0, // Kê khai đơn vị
    tttn02: 0  // Kế hoạch thực tập
  };

  // Cảnh báo tiến độ sinh viên
  studentAlerts: any[] = [];

  constructor(
    private studentCampaignService: StudentCampaignService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.teacherName = user?.fullName || 'Giảng viên';
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.studentCampaignService.getMyAssignedStudents().subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res : (res.data || res.payload || []);
        
        // 1. Thống kê nhanh
        this.overviewStats.totalStudents = data.length;
        this.overviewStats.companyApproved = data.filter((s: any) => 
          !['IMPORTED', 'COMPANY_DECLARED'].includes(s.status)
        ).length;
        this.overviewStats.planApproved = data.filter((s: any) => 
          ['PLAN_APPROVED', 'IN_PROGRESS', 'STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'].includes(s.status)
        ).length;
        this.overviewStats.reportSubmitted = data.filter((s: any) => 
          ['REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'].includes(s.status)
        ).length;

        // 2. Yêu cầu chờ xử lý
        this.pendingRequests.tttn01 = data.filter((s: any) => s.status === 'COMPANY_DECLARED').length;
        this.pendingRequests.tttn02 = data.filter((s: any) => s.status === 'PLAN_SUBMITTED').length;

        // 3. Cảnh báo tiến độ sinh viên
        this.studentAlerts = data
          .filter((s: any) => ['IMPORTED', 'COMPANY_DECLARED', 'COMPANY_APPROVED', 'PLAN_SUBMITTED'].includes(s.status))
          .map((s: any) => {
            let issue = '';
            let type = 'warning';
            if (s.status === 'IMPORTED') {
              issue = 'Chưa kê khai ĐVTT';
            } else if (s.status === 'COMPANY_DECLARED') {
              issue = 'Chờ duyệt ĐVTT';
            } else if (s.status === 'COMPANY_APPROVED') {
              issue = 'Chưa nộp Kế hoạch thực tập';
            } else if (s.status === 'PLAN_SUBMITTED') {
              issue = 'Chờ duyệt Kế hoạch';
            }
            return {
              name: s.full_name,
              mssv: s.student_code,
              issue,
              type
            };
          });

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
