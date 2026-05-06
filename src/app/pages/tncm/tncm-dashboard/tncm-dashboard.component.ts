import { Component } from '@angular/core';

@Component({
  selector: 'app-tncm-dashboard',
  templateUrl: './tncm-dashboard.component.html',
  styleUrls: ['./tncm-dashboard.component.scss']
})
export class TncmDashboardComponent {
  tncmName = 'PGS.TS. Nguyễn Tuấn Anh';
  departmentName = 'Bộ môn Công nghệ Phần mềm';

  // Thống kê bộ môn
  stats = {
    totalTeachers: 12,
    totalStudents: 150,
    unassignedStudents: 5,
    pendingScores: 2
  };

  // Cảnh báo phân công GVHD
  unassignedList = [
    { name: 'Phạm Văn C', mssv: '64PM2030', class: '64PM1', type: 'Thực tập tại Doanh nghiệp' },
    { name: 'Lê Thị D', mssv: '64PM2031', class: '64PM2', type: 'Thực tập Nghiên cứu' }
  ];

  // Danh sách chờ duyệt điểm (TTTN-07)
  pendingApprovals = [
    { teacherName: 'TS. Lê Anh Tuấn', groupSize: 15, dateSubmitted: '25/10/2024' },
    { teacherName: 'ThS. Trần Quang Minh', groupSize: 8, dateSubmitted: '26/10/2024' }
  ];
}
