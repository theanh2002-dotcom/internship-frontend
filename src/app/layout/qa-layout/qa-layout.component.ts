import { Component } from '@angular/core';
import { qaMenu } from '../../core/config/menu.config';

@Component({
  selector: 'app-qa-layout',
  templateUrl: './qa-layout.component.html',
})
export class QaLayoutComponent {
  menuItems = qaMenu;
}
