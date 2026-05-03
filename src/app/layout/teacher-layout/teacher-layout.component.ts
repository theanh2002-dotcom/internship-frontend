import { Component } from '@angular/core';
import { teacherMenu } from '../../core/config/menu.config';

@Component({
  selector: 'app-teacher-layout',
  templateUrl: './teacher-layout.component.html',
  styleUrls: ['./teacher-layout.component.scss']
})
export class TeacherLayoutComponent {
  menuItems = teacherMenu;
}
