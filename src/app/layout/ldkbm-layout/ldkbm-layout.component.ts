import { Component } from '@angular/core';
import { ldkbmMenu } from '../../core/config/menu.config';

@Component({
  selector: 'app-ldkbm-layout',
  templateUrl: './ldkbm-layout.component.html',
  styleUrls: ['./ldkbm-layout.component.scss']
})
export class LdkbmLayoutComponent {
  menuItems = ldkbmMenu;
}
