import { Component } from '@angular/core';
import { tncmMenu } from '../../core/config/menu.config';

@Component({
  selector: 'app-tncm-layout',
  templateUrl: './tncm-layout.component.html',
  styleUrls: ['./tncm-layout.component.scss']
})
export class TncmLayoutComponent {
  menuItems = tncmMenu;
}
