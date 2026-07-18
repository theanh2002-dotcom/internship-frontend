import { Component, Input, OnInit } from '@angular/core';
import { MenuItem } from '../../core/config/menu.config';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Input() menuItems: MenuItem[] = [];
  @Input() roleName: string = 'Quản lý Thực tập';
  isAdmin = false;
  isCollapsed = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.role === 'ADMIN';
    this.isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    this.applyCollapsedState();
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    localStorage.setItem('sidebarCollapsed', String(this.isCollapsed));
    this.applyCollapsedState();
  }

  private applyCollapsedState(): void {
    document.body.classList.toggle('sidebar-collapsed', this.isCollapsed);
  }
}
