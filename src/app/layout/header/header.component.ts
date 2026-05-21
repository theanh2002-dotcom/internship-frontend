import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserInfo } from '../../core/models/base.model';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  currentUser: UserInfo | null = null;
  showUserMenu = false;
  showNotificationsMenu = false;
  unreadCount = 0;
  notifications: any[] = [];

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (res) => {
        this.unreadCount = typeof res === 'number' ? res : (res?.data || res?.payload || 0);
      }
    });

    this.notificationService.getNotifications(1, 5).subscribe({
      next: (res) => {
        if (res && Array.isArray(res.data)) {
          this.notifications = res.data;
        } else if (res && Array.isArray(res)) {
          this.notifications = res;
        } else {
          this.notifications = [];
        }
      }
    });
  }

  toggleNotificationsMenu(): void {
    this.showNotificationsMenu = !this.showNotificationsMenu;
    if (this.showNotificationsMenu) {
      this.showUserMenu = false;
      this.loadNotifications();
    }
  }

  markAsRead(notif: any): void {
    if (!notif.is_read) {
      this.notificationService.markAsRead(notif.id).subscribe({
        next: () => {
          notif.is_read = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
      });
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.is_read = true);
        this.unreadCount = 0;
      }
    });
  }

  /**
   * Lấy tên viết tắt (2 chữ cái đầu) để hiển thị avatar
   */
  getInitials(): string {
    if (!this.currentUser?.fullName) return '??';
    const parts = this.currentUser.fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  /**
   * Map role code → label hiển thị tiếng Việt
   */
  getRoleLabel(): string {
    const map: Record<string, string> = {
      'ADMIN': 'Quản trị viên',
      'LDKBM': 'Lãnh đạo Khoa/BM',
      'GVHD': 'Giảng viên HD',
      'STUDENT': 'Sinh viên',
      'COMPANY_SUPERVISOR': 'Doanh nghiệp',
    };
    return map[this.currentUser?.role || ''] || this.currentUser?.role || '';
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  logout(): void {
    this.authService.logout();
  }
}
