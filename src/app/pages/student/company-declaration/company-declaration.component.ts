import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit } from '@angular/core';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { CompanyInfoRequest } from '../../../core/models/request.model';
import { StudentCampaignResponse } from '../../../core/models/base.model';

@Component({
  selector: 'app-company-declaration',
  templateUrl: './company-declaration.component.html',
  styleUrls: ['./company-declaration.component.scss']
})
export class CompanyDeclarationComponent implements OnInit {
  isLoading = true;
  isSaving = false;
      campaigns: StudentCampaignResponse[] = [];
  selectedCampaign: StudentCampaignResponse | null = null;

  formData: CompanyInfoRequest = {
    company_name: '',
    tax_code: '',
    address: '',
    supervisor_name: '',
    supervisor_phone: '',
    supervisor_email: '',
    expected_domain: '',
    internship_type: 'BUSINESS' // Default
  };

  constructor(private toastService: ToastService, private studentCampaignService: StudentCampaignService) {}

  ngOnInit(): void {
    this.loadMyCampaigns();
  }

  loadMyCampaigns(): void {
    this.isLoading = true;
    this.studentCampaignService.getMyCampaigns().subscribe({
      next: (res) => {
        this.campaigns = Array.isArray(res) ? res : (res.data || res.payload || []);
        if (this.campaigns.length > 0) {
          // Lấy chiến dịch mới nhất
          this.selectedCampaign = this.campaigns[0];
          this.populateForm();
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.error('Không thể tải thông tin đợt thực tập.');
        this.isLoading = false;
      }
    });
  }

  populateForm(): void {
    if (this.selectedCampaign && this.selectedCampaign.company_info?.company_name) {
      this.formData = {
        company_name: this.selectedCampaign.company_info.company_name,
        tax_code: this.selectedCampaign.company_info.tax_code || '',
        address: this.selectedCampaign.company_info.address || '',
        supervisor_name: this.selectedCampaign.company_info.supervisor_name || '',
        supervisor_phone: this.selectedCampaign.company_info.supervisor_phone || '',
        supervisor_email: this.selectedCampaign.company_info.supervisor_email || '',
        expected_domain: this.selectedCampaign.company_info.expected_domain || '',
        internship_type: this.selectedCampaign.company_info.internship_type || 'BUSINESS'
      };
    }
  }

  onSubmit(): void {
    if (!this.selectedCampaign) return;

    // Validate simple
    if (!this.isCompanyInfoFormValid()) {
      this.toastService.error('Vui lòng điền đầy đủ các thông tin bắt buộc (*).');
      return;
    }

    this.isSaving = true;
    this.studentCampaignService.submitCompanyInfo(this.selectedCampaign.id, this.formData).subscribe({
      next: (res: any) => {
        this.toastService.success('Nộp thông tin ĐVHD thành công!');
        this.isSaving = false;
        // Cập nhật lại status
        if (this.selectedCampaign) {
          this.selectedCampaign.status = 'COMPANY_DECLARED';
        }
      },
      error: (err: any) => {
        this.toastService.error(err.error?.message || 'Có lỗi xảy ra khi nộp thông tin.');
        this.isSaving = false;
      }
    });
  }
  
  isCompanyInfoFormValid(): boolean {
    return !!this.formData.company_name?.trim()
      && !!this.formData.supervisor_name?.trim()
      && this.isValidSupervisorEmail();
  }

  isValidSupervisorEmail(): boolean {
    const email = this.formData.supervisor_email?.trim();
    return !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  get statusLabel(): string {
    if (!this.selectedCampaign) return '';
    switch (this.selectedCampaign.status) {
      case 'IMPORTED': return 'Chưa kê khai';
      case 'COMPANY_DECLARED': return 'Chờ duyệt ĐVHD';
      case 'COMPANY_APPROVED': return 'Đã duyệt ĐVHD';
      case 'PLAN_SUBMITTED': return 'Chờ duyệt Kế hoạch';
      case 'PLAN_APPROVED': return 'Đã duyệt Kế hoạch (1 phần)';
      case 'IN_PROGRESS': return 'Đang thực tập';
      case 'STAGE1_EVALUATED': return 'Đang thực tập (Đã đánh giá GĐ1)';
      case 'REPORT_SUBMITTED': return 'Đã nộp Báo cáo';
      case 'STAGE2_EVALUATED': return 'Đã đánh giá GĐ2';
      case 'COMPLETED': return 'Đã hoàn thành';
      default: return this.selectedCampaign.status;
    }
  }
}
