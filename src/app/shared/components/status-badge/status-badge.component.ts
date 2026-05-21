import { Component, Input } from '@angular/core';

export type StatusBadgeType = 'success' | 'warning' | 'error' | 'info' | 'default';

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss']
})
export class StatusBadgeComponent {
  @Input() type: StatusBadgeType = 'default';
  @Input() text: string = '';
  @Input() showIcon: boolean = true;
  @Input() iconType: 'dot' | 'icon' = 'dot';
}
