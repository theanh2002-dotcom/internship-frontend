import { Component } from '@angular/core';
import { companyMenu } from '../../core/config/menu.config';

@Component({
  selector: 'app-company-layout',
  templateUrl: './company-layout.component.html',
  styleUrls: ['./company-layout.component.scss']
})
export class CompanyLayoutComponent {
  menuItems = companyMenu;
}
