import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

interface PresetTemplate {
  name: string;
  title: string;
  message: string;
  targetRole: string;
  icon: string;
}

@Component({
  selector: 'app-notification-management',
  templateUrl: './notification-management.component.html',
  styleUrls: ['./notification-management.component.scss']
})
export class NotificationManagementComponent implements OnInit {
  adminName = '';
  
  // Form fields
  title = '';
  message = '';
  targetRole = 'ALL';

  // State
  isSubmitting = false;
  successMsg: string | null = null;
  errorMsg: string | null = null;
  showConfirmModal = false;

  // History state
  isLoadingHistory = false;
  historyNotifications: any[] = [];
  historyTotal = 0;
  historyPage = 1;
  historyLimit = 10;

  // Preset templates
  presets: PresetTemplate[] = [
    {
      name: 'Bảo trì hệ thống',
      title: 'Thông báo: Bảo trì hệ thống định kỳ',
      message: 'Hệ thống Quản lý Thực tập HUCE CMS sẽ tiến hành bảo trì định kỳ vào lúc 23:00 ngày hôm nay để cập nhật tính năng mới. Thời gian bảo trì dự kiến kéo dài 1 tiếng. Vui lòng lưu trữ các nội dung đang làm việc dở dang.',
      targetRole: 'ALL',
      icon: 'build'
    },
    {
      name: 'Nhắc nhở nộp Nhật ký tuần',
      title: 'Nhắc nhở: Thực hiện nộp Nhật ký tuần đúng hạn',
      message: 'Yêu cầu tất cả sinh viên đang thực tập hoàn thành việc ghi nhận và gửi Nhật ký tuần thực tập đúng hạn (trước Chủ Nhật hàng tuần) để Giảng viên hướng dẫn và Doanh nghiệp tiện theo dõi, phê duyệt chặng.',
      targetRole: 'STUDENT',
      icon: 'event_repeat'
    },
    {
      name: 'Nhắc nhở Cập nhật Điểm số',
      title: 'Yêu cầu: Cập nhật điểm số đánh giá chặng',
      message: 'Đề nghị quý Thầy/Cô Giảng viên hướng dẫn và Người hướng dẫn tại Doanh nghiệp truy cập cổng thông tin để cập nhật và phê duyệt điểm số đánh giá thực tập cho các sinh viên được phân công.',
      targetRole: 'GVHD',
      icon: 'border_color'
    },
    {
      name: 'Thực hiện Khảo sát Phản hồi',
      title: 'Thông báo: Mở đợt khảo sát phản hồi ý kiến thực tập',
      message: 'Hệ thống đã mở tính năng Khảo sát phản hồi. Yêu cầu toàn bộ sinh viên đang trong đợt thực tập và người đại diện Doanh nghiệp hoàn thành phiếu đánh giá ý kiến khảo sát để làm cơ sở tổng hợp báo cáo.',
      targetRole: 'ALL',
      icon: 'rate_review'
    }
  ];

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.adminName = user?.fullName || 'Quản trị viên';
    this.loadHistory();
  }

  showSuccess(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => {
      this.successMsg = null;
    }, 4000);
  }

  showError(msg: string): void {
    this.errorMsg = msg;
    setTimeout(() => {
      this.errorMsg = null;
    }, 4000);
  }

  applyTemplate(preset: PresetTemplate): void {
    this.title = preset.title;
    this.message = preset.message;
    this.targetRole = preset.targetRole;
    this.showSuccess(`Đã áp dụng mẫu thông báo: "${preset.name}"`);
  }

  clearForm(): void {
    this.title = '';
    this.message = '';
    this.targetRole = 'ALL';
  }

  openConfirm(): void {
    if (!this.title.trim()) {
      this.showError('Tiêu đề thông báo không được để trống');
      return;
    }
    if (!this.message.trim()) {
      this.showError('Nội dung thông báo không được để trống');
      return;
    }
    this.showConfirmModal = true;
  }

  closeConfirm(): void {
    this.showConfirmModal = false;
  }

  submitNotification(): void {
    this.isSubmitting = true;
    this.closeConfirm();

    this.notificationService.sendNotification(this.title, this.message, this.targetRole).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showSuccess('Thông báo đã được xếp hàng gửi thành công tới các người dùng liên quan.');
        this.clearForm();
        // Load lại lịch sử sau khi gửi
        setTimeout(() => this.loadHistory(), 1000);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showError('Gửi thông báo thất bại: ' + (err.message || 'Lỗi hệ thống'));
      }
    });
  }

  loadHistory(): void {
    this.isLoadingHistory = true;
    this.notificationService.getNotifications(this.historyPage, this.historyLimit).subscribe({
      next: (res) => {
        this.historyNotifications = res.data || [];
        this.historyTotal = res.total || 0;
        this.isLoadingHistory = false;
      },
      error: () => {
        this.isLoadingHistory = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.historyPage = page;
    this.loadHistory();
  }

  getTargetRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'ALL': 'Tất cả người dùng',
      'STUDENT': 'Sinh viên',
      'GVHD': 'Giảng viên hướng dẫn',
      'LDKBM': 'Trưởng bộ môn',
      'ADMIN': 'Quản trị viên'
    };
    return labels[role] || role;
  }

  getTargetRoleClass(role: string): string {
    const classes: Record<string, string> = {
      'ALL': 'bg-blue-50 text-blue-700 border-blue-200',
      'STUDENT': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'GVHD': 'bg-purple-50 text-purple-700 border-purple-200',
      'LDKBM': 'bg-amber-50 text-amber-700 border-amber-200',
      'ADMIN': 'bg-rose-50 text-rose-700 border-rose-200'
    };
    return classes[role] || 'bg-slate-50 text-slate-700 border-slate-200';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
