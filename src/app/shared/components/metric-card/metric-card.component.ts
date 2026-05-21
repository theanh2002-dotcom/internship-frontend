import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-metric-card',
  templateUrl: './metric-card.component.html',
  styleUrls: ['./metric-card.component.scss']
})
export class MetricCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  
  // Custom classes for design flexibility
  @Input() valueClass: string = 'text-[#00429D]';
  @Input() borderLeftClass?: string = '';
  @Input() routerLink?: string | any[] = '';
  
  // Icon configuration (optional)
  @Input() icon?: string = '';
  @Input() iconBgClass: string = 'bg-blue-50 text-[#00429D]';
  
  // Optional absolute left accent line (for general dashboard style)
  @Input() sideAccentColor?: string = '';
}
