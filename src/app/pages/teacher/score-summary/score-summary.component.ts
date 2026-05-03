import { Component } from '@angular/core';

interface StudentScore {
  mssv: string;
  name: string;
  class: string;
  companyScore: number | null; // Điểm ĐVHD (TTTN-03/06)
  teacherScore: number | null; // Điểm GVHD (TTTN-04)
  councilScore: number | null; // Điểm HĐĐG (TTTN-05)
  totalScore: number | null;   // Điểm tổng hợp (TTTN-07)
  status: 'Đạt' | 'Không đạt' | 'Chưa có kết quả';
}

@Component({
  selector: 'app-score-summary',
  templateUrl: './score-summary.component.html',
  styleUrls: ['./score-summary.component.scss']
})
export class ScoreSummaryComponent {
  // Mock data for the Grid
  students: StudentScore[] = [
    { mssv: '64PM2024', name: 'Trần Minh Khang', class: '64PM2', companyScore: 9.0, teacherScore: 8.5, councilScore: 8.0, totalScore: 8.5, status: 'Đạt' },
    { mssv: '64PM2025', name: 'Nguyễn Văn An', class: '64PM2', companyScore: 7.5, teacherScore: 7.0, councilScore: 7.5, totalScore: 7.3, status: 'Đạt' },
    { mssv: '64PM2026', name: 'Lê Thị Bình', class: '64PM2', companyScore: null, teacherScore: null, councilScore: null, totalScore: null, status: 'Chưa có kết quả' },
    { mssv: '64PM2027', name: 'Phạm Văn Cường', class: '64PM2', companyScore: 4.0, teacherScore: 3.5, councilScore: 4.0, totalScore: 3.8, status: 'Không đạt' },
    { mssv: '64PM2028', name: 'Vũ Hoàng Dung', class: '64PM2', companyScore: 8.0, teacherScore: 9.0, councilScore: null, totalScore: null, status: 'Chưa có kết quả' },
    { mssv: '64PM2029', name: 'Đặng Tuấn Em', class: '64PM2', companyScore: 9.5, teacherScore: 9.0, councilScore: 9.5, totalScore: 9.3, status: 'Đạt' },
    { mssv: '64PM2030', name: 'Bùi Thị Thu', class: '64PM2', companyScore: 6.0, teacherScore: 6.5, councilScore: 6.0, totalScore: 6.2, status: 'Đạt' },
  ];

  getStatusClass(status: string): string {
    switch(status) {
      case 'Đạt': return 'bg-green-100 text-green-800 border-green-200';
      case 'Không đạt': return 'bg-red-100 text-red-800 border-red-200';
      case 'Chưa có kết quả': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return '';
    }
  }

  exportExcel() {
    console.log('Exporting to Excel...');
    // Export logic here
  }
}
