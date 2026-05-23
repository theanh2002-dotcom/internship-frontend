import { Component } from '@angular/core';
import { ToastService } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'intership-frontend';

  constructor(private toastService: ToastService) {
    window.alert = (message: string) => {
      const lower = String(message).toLowerCase();
      if (lower.includes('thành công') || lower.includes('cảm ơn') || lower.includes('ghi nhận')) {
        this.toastService.success(message);
      } else if (lower.includes('lỗi') || lower.includes('không tìm thấy') || lower.includes('thất bại')) {
        this.toastService.error(message);
      } else {
        this.toastService.warning(message);
      }
    };
  }
}
