import { Component, OnInit } from '@angular/core';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { StudentCampaignResponse } from '../../../core/models/base.model';

@Component({
  selector: 'app-manage-students',
  templateUrl: './manage-students.component.html',
  styleUrls: ['./manage-students.component.scss']
})
export class ManageStudentsComponent implements OnInit {
  isLoading = true;
  isApproving = false;
  students: StudentCampaignResponse[] = [];
  
  selectedStudent: StudentCampaignResponse | null = null;
  showModal = false;
  successMessage = '';
  errorMessage = '';

  constructor(private studentCampaignService: StudentCampaignService) {}

  ngOnInit(): void {
    this.loadMyStudents();
  }

  loadMyStudents(): void {
    this.isLoading = true;
    this.studentCampaignService.getMyAssignedStudents().subscribe({
      next: (res) => {
        this.students = Array.isArray(res) ? res : [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  openReviewModal(student: StudentCampaignResponse): void {
    this.selectedStudent = student;
    this.showModal = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedStudent = null;
  }

  approveCompany(): void {
    if (!this.selectedStudent) return;
    
    this.isApproving = true;
    this.errorMessage = '';
    
    this.studentCampaignService.approveCompanyInfo(this.selectedStudent.id).subscribe({
      next: () => {
        this.successMessage = 'Đã duyệt thông tin Đơn vị thực tập thành công!';
        this.isApproving = false;
        
        // Update local status
        if (this.selectedStudent) {
          this.selectedStudent.status = 'COMPANY_APPROVED';
        }
        
        setTimeout(() => this.closeModal(), 1500);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Có lỗi xảy ra khi duyệt.';
        this.isApproving = false;
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'IMPORTED': return 'bg-slate-100 text-slate-600';
      case 'COMPANY_DECLARED': return 'bg-amber-100 text-amber-700';
      case 'COMPANY_APPROVED': return 'bg-blue-100 text-blue-700';
      case 'PLAN_SUBMITTED': return 'bg-purple-100 text-purple-700';
      case 'PLAN_APPROVED': return 'bg-emerald-100 text-emerald-700';
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'IMPORTED': return 'Chưa kê khai';
      case 'COMPANY_DECLARED': return 'Chờ duyệt ĐVHD';
      case 'COMPANY_APPROVED': return 'Đã duyệt ĐVHD';
      case 'PLAN_SUBMITTED': return 'Chờ duyệt Kế hoạch';
      case 'PLAN_APPROVED': return 'Đang thực tập';
      case 'COMPLETED': return 'Hoàn thành';
      default: return status;
    }
  }
}
