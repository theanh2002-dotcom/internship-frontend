import { Component } from '@angular/core';

@Component({
  selector: 'app-general-dashboard',
  templateUrl: './general-dashboard.component.html',
  styleUrls: ['./general-dashboard.component.scss']
})
export class GeneralDashboardComponent {
  overviewStats = {
    totalStudents: { value: '1,245', trend: '+5% so với kỳ trước', icon: 'groups', iconColor: 'text-[#002d70]', iconBg: 'bg-[#d9e2ff]' },
    partners: { value: '184', trend: '+12 đối tác mới', icon: 'domain', iconColor: 'text-[#bb0308]', iconBg: 'bg-[#ffdad5]' },
    reports: { value: '982', trend: 'Đạt 78.8% tiến độ', icon: 'description', iconColor: 'text-[#5b1c00]', iconBg: 'bg-[#ffdbce]' },
    avgScore: { value: '8.4', trend: 'Hệ số 10', icon: 'star_rate', iconColor: 'text-[#00429D]', iconBg: 'bg-[#e8e7f0]' }
  };

  scoreDistribution = [
    { label: '<4.0', value: 12, height: '10%', bgClass: 'bg-[#e2e2ea]' },
    { label: '4.0-5.4', value: 45, height: '30%', bgClass: 'bg-[#b0c6ff]' },
    { label: '5.5-6.9', value: 340, height: '60%', bgClass: 'bg-[#00429D]' },
    { label: '7.0-8.4', value: 520, height: '80%', bgClass: 'bg-[#2E7D32] opacity-80' },
    { label: '>8.5', value: 280, height: '40%', bgClass: 'bg-[#2E7D32]' }
  ];

  recentActivities = [
    { time: '10:45 AM, 12/10/2023', user: 'Nguyễn Văn A', subText: 'SV: 1234567', action: 'Nộp báo cáo tiến độ tuần 4', status: 'Đã nộp', statusClass: 'bg-[#ffdbce] text-[#370e00]' },
    { time: '09:12 AM, 12/10/2023', user: 'TS. Trần Thị B', subText: 'Giảng viên hướng dẫn', action: 'Ký duyệt Đề cương thực tập cho nhóm 05', status: 'Đã duyệt', statusClass: 'bg-[#d9e2ff] text-[#002d70]' },
    { time: '16:30 PM, 11/10/2023', user: 'Công ty TNHH Phần Mềm X', subText: 'Đơn vị tiếp nhận', action: 'Đánh giá sinh viên Lê Văn C (Tháng 1)', status: 'Hoàn thành', statusClass: 'bg-[#d9e2ff] text-[#002d70]' },
    { time: '14:05 PM, 11/10/2023', user: 'Phạm Thị D', subText: 'SV: 7654321', action: 'Gửi yêu cầu thay đổi Đơn vị thực tập', status: 'Chờ xử lý', statusClass: 'bg-[#e2e2ea] text-[#434652] border border-[#c3c6d4]' }
  ];
}
