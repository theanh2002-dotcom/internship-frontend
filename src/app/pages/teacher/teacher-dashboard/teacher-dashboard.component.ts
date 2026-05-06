import { Component } from '@angular/core';

@Component({
  selector: 'app-teacher-dashboard',
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.scss']
})
export class TeacherDashboardComponent {
  teacherName = 'TS. Lê Anh Tuấn';
  
  // Thống kê tổng quan
  overviewStats = {
    totalStudents: 15,
    companyApproved: 12,
    planApproved: 10,
    reportSubmitted: 5
  };

  // Yêu cầu chờ xử lý
  pendingRequests = {
    tttn01: 3, // Kê khai đơn vị
    tttn02: 2  // Kế hoạch thực tập
  };

  // Cảnh báo tiến độ sinh viên (Trễ báo cáo, v.v.)
  studentAlerts = [
    { name: 'Nguyễn Văn A', mssv: '64PM2024', issue: 'Chưa nộp nhật ký Tuần 4', type: 'warning' },
    { name: 'Phạm Thị B', mssv: '64PM2025', issue: 'ĐVHD đánh giá thái độ Kém', type: 'danger' }
  ];

  // Lịch chấm điểm sắp tới
  upcomingEvaluations = [
    { date: '25/10/2024', time: '08:00 - 11:30', room: 'Phòng H2-201', role: 'Chủ tịch Hội đồng' },
    { date: '28/10/2024', time: '13:30 - 16:30', room: 'Phòng H2-202', role: 'Ủy viên' }
  ];
}
