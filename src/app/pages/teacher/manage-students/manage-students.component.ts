import { Component } from '@angular/core';

@Component({
  selector: 'app-manage-students',
  templateUrl: './manage-students.component.html',
  styleUrls: ['./manage-students.component.scss']
})
export class ManageStudentsComponent {
  students = [
    {
      id: '64PM2024',
      name: 'Nguyễn Văn A',
      class: '64PM2',
      company: 'Công ty TNHH Phần mềm FPT',
      phone: '0987.123.456',
      progressStatus: 'Đang thực tập',
      logStatus: 'Đã nộp Tuần 4',
      statusColor: 'green'
    },
    {
      id: '64PM2025',
      name: 'Phạm Thị B',
      class: '64PM1',
      company: 'Viettel Solutions',
      phone: '0912.345.678',
      progressStatus: 'Cảnh báo',
      logStatus: 'Trễ nộp Tuần 3',
      statusColor: 'red'
    },
    {
      id: '64PM2026',
      name: 'Lê Hoàng C',
      class: '64PM3',
      company: 'Chưa có đơn vị',
      phone: '0933.111.222',
      progressStatus: 'Chưa bắt đầu',
      logStatus: 'Chưa có',
      statusColor: 'gray'
    },
    {
      id: '64PM2027',
      name: 'Trần Minh Khang',
      class: '64PM2',
      company: 'VNPT IT',
      phone: '0966.999.888',
      progressStatus: 'Chờ duyệt Kế hoạch',
      logStatus: 'Tuần 1',
      statusColor: 'yellow'
    }
  ];

  selectedStudent: any = null;

  viewDetails(student: any) {
    this.selectedStudent = student;
  }
}
