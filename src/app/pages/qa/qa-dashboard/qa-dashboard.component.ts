import { Component } from '@angular/core';

@Component({
  selector: 'app-qa-dashboard',
  templateUrl: './qa-dashboard.component.html',
  styleUrls: ['./qa-dashboard.component.scss']
})
export class QaDashboardComponent {
  semester = 'Học kỳ 1 - 2024/2025';

  // Thống kê chung
  stats = {
    totalEvaluated: 3450,
    overallPassRate: 92.5,
    aunQaScore: 8.5,
    activeCapas: 3
  };

  // Dữ liệu phân tích Chuẩn đầu ra (CLO)
  clos = [
    { id: 'CLO1', name: 'Áp dụng kiến thức chuyên môn', avgScore: 7.5, passRate: 95, color: 'bg-blue-500' },
    { id: 'CLO2', name: 'Phân tích và giải quyết vấn đề', avgScore: 6.8, passRate: 88, color: 'bg-amber-500' },
    { id: 'CLO3', name: 'Giao tiếp và trình bày', avgScore: 8.2, passRate: 98, color: 'bg-emerald-500' },
    { id: 'CLO4', name: 'Đạo đức nghề nghiệp và an toàn', avgScore: 8.5, passRate: 100, color: 'bg-emerald-500' },
    { id: 'CLO5', name: 'Làm việc nhóm và phối hợp', avgScore: 8.0, passRate: 96, color: 'bg-blue-500' },
    { id: 'CLO6', name: 'Sử dụng công cụ phần mềm', avgScore: 7.2, passRate: 90, color: 'bg-blue-500' },
    { id: 'CLO7', name: 'Tự nhận xét, phát triển NN', avgScore: 7.8, passRate: 94, color: 'bg-blue-500' },
  ];

  // Các biện pháp khắc phục phòng ngừa (CAPA)
  capaAlerts = [
    { id: 'CAPA-012', issue: 'CLO2 (Giải quyết vấn đề) có tỷ lệ đạt mức 2 thấp ở ngành Xây dựng Dân dụng.', action: 'Điều chỉnh Rubric Chặng 1', status: 'Đang xử lý', level: 'Cao' },
    { id: 'CAPA-013', issue: 'Minh chứng báo cáo TTTN-06 thiếu chữ ký điện tử của ĐVHD.', action: 'Bổ sung ràng buộc hệ thống', status: 'Mở', level: 'Trung bình' }
  ];

  getBarWidth(score: number): string {
    return `${(score / 10) * 100}%`;
  }
}
