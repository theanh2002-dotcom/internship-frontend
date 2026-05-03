import { Component } from '@angular/core';

interface Evidence {
  name: string;
  url: string;
  type: 'link' | 'image';
}

interface WeeklyLog {
  weekNumber: number;
  startDate: string;
  endDate: string;
  status: 'confirmed' | 'active' | 'locked';
  tasks: string[];
  results: string;
  evidences: Evidence[];
  supervisorComment?: string;
  supervisorName?: string;
  supervisorDate?: string;
  progress?: number;
}

@Component({
  selector: 'app-weekly-log',
  templateUrl: './weekly-log.component.html',
  styleUrls: ['./weekly-log.component.scss']
})
export class WeeklyLogComponent {
  studentInfo = {
    name: 'Trần Minh Khang',
    mssv: '64PM2024',
    department: 'Khoa Công nghệ Thông tin',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCE9L5bMj-5ZfjH5cCLvHetrRRPZLY2Z-u9oSgVmBkHRXkkEINhhJTctqUeZ2s8gGCasrF0wWMdn6-o22xUZO43ThGs9AVIcypZnxGd06AvTkRNLGBvgrA4xFj0xFA0ZRkPnE824CLWJ4_Gs_1aDqzS0lzMx-tCAffxOb7UDGfe7SxS8MiybMDwxOe-9hsDSBgT3WWL3wikIrOVcA2VhtTHqaQ-YeLqzli0x_UeYPyiDuBOUv7OBfkRLKRI62rILOd2cG8qbC_SAQ'
  };

  companyInfo = {
    name: 'Công ty CP MISA',
    supervisor: 'Nguyễn Thị B (Giám đốc dự án)'
  };

  logs: WeeklyLog[] = [
    {
      weekNumber: 1,
      startDate: '04/09/2023',
      endDate: '10/09/2023',
      status: 'confirmed',
      tasks: [
        'Tìm hiểu cơ cấu tổ chức phòng ban.',
        'Cài đặt môi trường phát triển (NodeJS, Docker).',
        'Đọc tài liệu mô tả kiến trúc microservices của dự án CRM.'
      ],
      results: 'Hoàn tất setup môi trường. Hiểu cơ bản luồng dữ liệu của module User Authentication. Chạy thành công project local.',
      evidences: [
        { name: 'Git Repo Setup', url: '#', type: 'link' },
        { name: 'screenshot_env.png', url: '#', type: 'image' }
      ],
      supervisorComment: '"Sinh viên hòa nhập nhanh, chủ động trong việc tìm hiểu tài liệu và setup môi trường chuẩn theo quy định dự án."',
      supervisorName: 'Nguyễn Thị B (Giám đốc dự án)',
      supervisorDate: '11/09/2023',
      progress: 100
    },
    {
      weekNumber: 2,
      startDate: '11/09/2023',
      endDate: '17/09/2023',
      status: 'active',
      tasks: [],
      results: '',
      evidences: []
    },
    {
      weekNumber: 3,
      startDate: '18/09/2023',
      endDate: '24/09/2023',
      status: 'locked',
      tasks: [],
      results: '',
      evidences: []
    }
  ];

  // Helper properties to bind active form inputs
  activeLogTasks: string = '';
  activeLogResults: string = '';
}
