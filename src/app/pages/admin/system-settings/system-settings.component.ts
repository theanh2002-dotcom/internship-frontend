import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit } from '@angular/core';
import { SystemSettingService, SystemSettingBulkRequest } from '../../../core/services/system-setting.service';
import { SystemSettingResponse } from '../../../core/models/base.model';

@Component({
  selector: 'app-system-settings',
  templateUrl: './system-settings.component.html',
  styleUrls: ['./system-settings.component.scss']
})
export class SystemSettingsComponent implements OnInit {
  isLoading = false;
  isSaving = false;
      // Khai báo các field cài đặt
  settings = {
    current_academic_year: '',
    current_semester: '',
    max_students_per_teacher: '',
    enable_email_notification: 'false'
  };

  constructor(private toastService: ToastService, private settingService: SystemSettingService) {}

  get enableEmailNotification(): boolean {
    return this.settings.enable_email_notification === 'true';
  }

  set enableEmailNotification(value: boolean) {
    this.settings.enable_email_notification = value ? 'true' : 'false';
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading = true;
    this.settingService.getAll().subscribe({
      next: (res) => {
        const data = res.data || [];
        data.forEach(item => {
          if (item.settingKey in this.settings) {
            (this.settings as any)[item.settingKey] = item.settingValue;
          }
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.error('Không thể tải cấu hình hệ thống: ' + (err.message || ''));
        this.isLoading = false;
      }
    });
  }

  saveSettings(): void {
    this.isSaving = true;
    const request: SystemSettingBulkRequest = {
      settings: {
        current_academic_year: this.settings.current_academic_year,
        current_semester: this.settings.current_semester,
        max_students_per_teacher: this.settings.max_students_per_teacher,
        enable_email_notification: this.settings.enable_email_notification
      }
    };

    this.settingService.updateBulk(request).subscribe({
      next: () => {
        this.isSaving = false;
        this.toastService.success('Lưu cấu hình hệ thống thành công.');
      },
      error: (err) => {
        this.isSaving = false;
        this.toastService.error('Lỗi khi lưu cấu hình: ' + (err.message || ''));
      }
    });
  }
}
