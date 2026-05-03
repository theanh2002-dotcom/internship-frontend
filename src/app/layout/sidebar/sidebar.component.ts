import { Component, Input } from '@angular/core';
import { MenuItem } from '../../core/config/menu.config';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() menuItems: MenuItem[] = [];
  @Input() roleName: string = 'Quản lý Thực tập';
}
