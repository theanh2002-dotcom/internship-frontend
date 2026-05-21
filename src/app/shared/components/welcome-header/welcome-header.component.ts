import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-welcome-header',
  templateUrl: './welcome-header.component.html',
  styleUrls: ['./welcome-header.component.scss']
})
export class WelcomeHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  
  // Optional button action configuration
  @Input() actionText?: string = '';
  @Input() actionLink?: string | any[] = '';
  @Input() actionIcon?: string = '';
  
  // Optional badge / info tag configuration
  @Input() infoTagText?: string = '';
  @Input() infoTagIcon?: string = '';
}
