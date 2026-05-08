import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserInfo } from '../../core/models/base.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  currentUser: UserInfo | null = null;
  showUserMenu = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
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
