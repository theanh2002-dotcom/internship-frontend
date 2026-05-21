import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard-loading',
  templateUrl: './dashboard-loading.component.html',
  styleUrls: ['./dashboard-loading.component.scss']
})
export class DashboardLoadingComponent {
  @Input() message: string = 'Đang tải dữ liệu...';
  @Input() icon: string = 'progress_activity';
}
