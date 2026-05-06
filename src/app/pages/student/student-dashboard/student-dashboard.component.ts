import { Component } from '@angular/core';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss']
})
export class StudentDashboardComponent {
  studentName = 'Nguyễn Văn A';
  studentId = '64PM2024';
  
  // Trạng thái các luồng (TTTN)
  workflowStatus = {
    tttn01: { status: 'APPROVED', label: 'Tiếp nhận', icon: 'domain' },
    tttn02: { status: 'APPROVED', label: 'Kế hoạch', icon: 'edit_document' },
    tttn03: { status: 'PENDING', label: 'Nhật ký', icon: 'menu_book' },
    tttn06: { status: 'NOT_STARTED', label: 'Báo cáo', icon: 'description' }
  };

  // Tiến trình thực tập (8 tuần)
  currentWeek = 4;
  totalWeeks = 8;
  progressPercent = (this.currentWeek / this.totalWeeks) * 100;

  // Lịch trình sắp tới
  upcomingTasks = [
    { title: 'Nộp nhật ký tuần 4', deadline: 'Chủ nhật, 20/10/2024', type: 'warning' },
    { title: 'Báo cáo giữa kỳ', deadline: '30/10/2024', type: 'info' }
  ];

  // Thông tin liên hệ
  contacts = {
    teacher: { name: 'TS. Lê Anh Tuấn', phone: '0987.654.321', email: 'tuanla@huce.edu.vn' },
    companyMentor: { name: 'Nguyễn Tiến Dũng', phone: '0912.345.678', email: 'dungnt@company.com' }
  };

  getStatusClass(status: string): string {
    switch(status) {
      case 'APPROVED': return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'NOT_STARTED': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  }
}
