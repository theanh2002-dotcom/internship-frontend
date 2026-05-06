import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent {
  adminName = 'Phòng Quản lý Đào tạo';
  currentSemester = 'Học kỳ 1 - 2024/2025';
  
  // Thống kê vĩ mô
  systemStats = {
    activeCampaigns: 2,
    totalFaculties: 12,
    totalStudents: 3450,
    placedStudents: 2800
  };

  // Tình trạng phân bổ sinh viên
  placementPercent = (this.systemStats.placedStudents / this.systemStats.totalStudents) * 100;

  // Thống kê đợt thực tập đang chạy
  campaignStats = [
    { name: 'Đợt TTTN CNTT K64', status: 'Đang diễn ra', students: 500, placed: 450, percentage: 90 },
    { name: 'Đợt TTTN Kinh tế K64', status: 'Đang diễn ra', students: 800, placed: 600, percentage: 75 },
    { name: 'Đợt TTTN Xây dựng K64', status: 'Sắp bắt đầu', students: 1200, placed: 0, percentage: 0 }
  ];

  // Các cảnh báo hệ thống
  systemAlerts = [
    { title: 'Chưa khởi tạo đợt TTTN', message: 'Khoa Kiến trúc chưa lập kế hoạch TTTN đợt 2.', type: 'warning' },
    { title: 'Trễ hạn phê duyệt', message: 'Hơn 150 sinh viên Khoa Kinh tế chưa được duyệt ĐVHD.', type: 'danger' }
  ];
}
