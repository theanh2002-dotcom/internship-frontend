import { Component, OnInit } from '@angular/core';
import { studentMenu } from '../../core/config/menu.config';
import { StudentCampaignService } from '../../core/services/student-campaign.service';

@Component({
  selector: 'app-student-layout',
  templateUrl: './student-layout.component.html',
  styleUrls: ['./student-layout.component.scss']
})
export class StudentLayoutComponent implements OnInit {
  menuItems = studentMenu;
  
  constructor() {}

  ngOnInit() {
  }
}
