import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit {
  toasts$!: Observable<Toast[]>;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toasts$ = this.toastService.getToasts();
  }

  remove(id: number): void {
    this.toastService.remove(id);
  }

  trackById(index: number, toast: Toast): number {
    return toast.id;
  }
}
