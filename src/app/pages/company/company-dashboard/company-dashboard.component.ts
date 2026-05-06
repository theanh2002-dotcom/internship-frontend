import { Component } from '@angular/core';

@Component({
  selector: 'app-company-dashboard',
  templateUrl: './company-dashboard.component.html',
  styleUrls: ['./company-dashboard.component.scss']
})
export class CompanyDashboardComponent {
  companyName = 'FPT Software Hà Nội';
  mentorName = 'Nguyễn Văn Mạnh';

  // Thống kê chung
  stats = {
    totalInterns: 15,
    pendingPlanApprovals: 3, // Chờ duyệt TTTN-02
    pendingWeeklyLogs: 5,    // Chờ xác nhận TTTN-03
    evaluationPending: 2     // Chờ chấm điểm chặng 1/2
  };

  // Cảnh báo công việc cần xử lý
  actionItems = [
    { type: 'Kế hoạch', message: '3 sinh viên vừa nộp Kế hoạch thực tập (TTTN-02)', action: 'Duyệt ngay', priority: 'high', link: '/company/manage-interns' },
    { type: 'Tiến độ', message: '5 sinh viên chưa được xác nhận Nhật ký Tuần 3', action: 'Xác nhận', priority: 'medium', link: '/company/manage-interns' },
    { type: 'Đánh giá', message: 'Đã đến hạn chấm điểm Chặng 1 cho nhóm K64', action: 'Chấm điểm', priority: 'high', link: '/company/manage-interns' }
  ];

  // Danh sách thực tập sinh đang quản lý
  internList = [
    { name: 'Nguyễn Văn A', mssv: '64PM1234', position: 'Frontend Intern', status: 'Đang thực tập', week: 3 },
    { name: 'Trần Thị B', mssv: '64PM5678', position: 'Backend Intern', status: 'Chờ duyệt KH', week: 1 },
    { name: 'Lê Hoàng C', mssv: '64HT9012', position: 'BA Intern', status: 'Cần xác nhận Tuần', week: 2 }
  ];
}
