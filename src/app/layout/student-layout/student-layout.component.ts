import { Component } from '@angular/core';
import { studentMenu } from '../../core/config/menu.config';

@Component({
  selector: 'app-student-layout',
  templateUrl: './student-layout.component.html',
  styleUrls: ['./student-layout.component.scss']
})
export class StudentLayoutComponent {
  menuItems = studentMenu;
}
