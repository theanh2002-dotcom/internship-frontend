import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit } from '@angular/core';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { FileService } from '../../../core/services/file.service';
import { FinalReportService } from '../../../core/services/final-report.service';
import { FinalReportRequest, ReportItem } from '../../../core/models/request.model';
import { FinalReportResponse, StudentCampaignResponse } from '../../../core/models/base.model';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

interface UploadingFile {
  name: string;
  progress: number;
  isUploading: boolean;
  sizeUploaded: string;
  totalSize: string;
}

@Component({
  selector: 'app-final-report',
  templateUrl: './final-report.component.html',
  styleUrls: ['./final-report.component.scss']
})
export class FinalReportComponent implements OnInit {
  isLoading = false;
  isSaving = false;
      studentCampaign: StudentCampaignResponse | null = null;
  attachedFiles: FinalReportResponse[] = [];
  uploadingFile: UploadingFile | null = null;

  isAgreed: boolean = false;
  canAccess = false; // Status Gate: chỉ mở khi STAGE1_EVALUATED trở lên

  constructor(private toastService: ToastService, private studentCampaignService: StudentCampaignService,
    private fileService: FileService,
    private finalReportService: FinalReportService,
    private authService: AuthService) {}

  ngOnInit(): void {
    this.loadMyCampaign();
  }

  loadMyCampaign(): void {
    this.isLoading = true;
    this.studentCampaignService.getMyCampaigns().subscribe({
      next: (res) => {
        const campaigns = Array.isArray(res) ? res : [];
        if (campaigns.length > 0) {
          this.studentCampaign = campaigns[0];
          // Status Gate check
          const allowedStatuses = ['STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'];
          this.canAccess = allowedStatuses.includes(this.studentCampaign!.status);
          if (this.canAccess) {
            this.loadFinalReports();
          } else {
            this.isLoading = false;
          }
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  loadFinalReports(): void {
    if (!this.studentCampaign) return;
    
    this.finalReportService.getFinalReports(this.studentCampaign.id).subscribe({
      next: (res) => {
        this.attachedFiles = res;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    // Check size limit (50MB)
    if (file.size > 50 * 1024 * 1024) {
      this.showError('File vượt quá dung lượng 50MB cho phép.');
      return;
    }

    this.uploadingFile = {
      name: file.name,
      progress: 0,
      isUploading: true,
      sizeUploaded: '0 MB',
      totalSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
    };

    // Simulate progress
    const interval = setInterval(() => {
      if (this.uploadingFile && this.uploadingFile.progress < 90) {
        this.uploadingFile.progress += 10;
        this.uploadingFile.sizeUploaded = ((this.uploadingFile.progress / 100) * parseFloat(this.uploadingFile.totalSize)).toFixed(2) + ' MB';
      }
    }, 200);

    this.fileService.uploadFile(file).subscribe({
      next: (res) => {
        clearInterval(interval);
        const fileRes = res;
        
        if (this.uploadingFile) {
          this.uploadingFile.progress = 100;
          this.uploadingFile.sizeUploaded = this.uploadingFile.totalSize;
        }

        setTimeout(() => {
          this.uploadingFile = null;
          // Add to temporary list (haven't submitted to final_reports yet)
          const newReport: FinalReportResponse = {
            id: 0, // Temp ID
            student_campaign_id: this.studentCampaign!.id,
            file_name: fileRes.file_name,
            file_url: fileRes.file_url,
            file_size: fileRes.file_size,
            file_type: fileRes.file_type,
            created_at: new Date().toISOString()
          };
          this.attachedFiles.push(newReport);
        }, 500);
      },
      error: (err) => {
        clearInterval(interval);
        this.uploadingFile = null;
        this.showError('Lỗi khi tải file: ' + (err.error?.message || err.message));
      }
    });
  }

  deleteFile(index: number, report: FinalReportResponse): void {
    if (report.id > 0) {
      if (confirm('Bạn có chắc muốn xóa file này khỏi hệ thống?')) {
        this.finalReportService.deleteFinalReport(report.id).subscribe({
          next: () => {
            this.attachedFiles.splice(index, 1);
            this.showSuccess('Đã xóa file thành công.');
          },
          error: () => this.showError('Lỗi khi xóa file.')
        });
      }
    } else {
      // Just remove from temp list
      this.attachedFiles.splice(index, 1);
    }
  }

  submitReport(): void {
    if (!this.studentCampaign) return;
    if (this.attachedFiles.length === 0) {
      this.showError('Vui lòng tải lên ít nhất một file báo cáo trước khi nộp.');
      return;
    }

    const reports: ReportItem[] = this.attachedFiles.map(f => ({
      file_name: f.file_name,
      file_url: f.file_url,
      file_size: f.file_size,
      file_type: f.file_type
    }));

    const request: FinalReportRequest = {
      student_campaign_id: this.studentCampaign.id,
      reports: reports
    };

    this.isSaving = true;
    this.finalReportService.submitFinalReports(request).subscribe({
      next: () => {
        this.isSaving = false;
        this.showSuccess('Đã nộp báo cáo tổng kết thành công!');
        this.loadFinalReports();
      },
      error: (err) => {
        this.isSaving = false;
        this.showError('Lỗi khi nộp báo cáo: ' + (err.error?.message || err.message));
      }
    });
  }

  getFileIcon(fileName: string): string {
    if (fileName.endsWith('.pdf')) return 'picture_as_pdf';
    if (fileName.endsWith('.zip') || fileName.endsWith('.rar')) return 'folder_zip';
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'description';
    return 'insert_drive_file';
  }

  formatSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileUrl(fileUrl: string): string {
    if (!fileUrl) return '#';
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
    return `${environment.apiUrl}${fileUrl}`;
  }

  showError(msg: string): void {
    this.toastService.error(msg);
  }

  showSuccess(msg: string): void {
    this.toastService.success(msg);
  }
}
