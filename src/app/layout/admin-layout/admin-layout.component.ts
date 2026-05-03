import { Component } from '@angular/core';
import { adminMenu } from '../../core/config/menu.config';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
  menuItems = adminMenu;
}
