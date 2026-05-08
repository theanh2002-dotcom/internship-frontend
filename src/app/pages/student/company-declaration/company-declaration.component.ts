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
  successMessage = '';
  errorMessage = '';

  campaigns: StudentCampaignResponse[] = [];
  selectedCampaign: StudentCampaignResponse | null = null;

  formData: CompanyInfoRequest = {
    companyName: '',
    taxCode: '',
    address: '',
    mentorName: '',
    mentorPhone: '',
    mentorEmail: '',
    position: ''
  };

  constructor(private studentCampaignService: StudentCampaignService) {}

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
        this.errorMessage = 'Không thể tải thông tin đợt thực tập.';
        this.isLoading = false;
      }
    });
  }

  populateForm(): void {
    if (this.selectedCampaign && this.selectedCampaign.company_info?.company_name) {
      this.formData = {
        companyName: this.selectedCampaign.company_info.company_name,
        taxCode: this.selectedCampaign.company_info.tax_code || '',
        address: this.selectedCampaign.company_info.address || '',
        mentorName: this.selectedCampaign.company_info.supervisor_name || '',
        mentorPhone: this.selectedCampaign.company_info.supervisor_phone || '',
        mentorEmail: this.selectedCampaign.company_info.supervisor_email || '',
        position: this.selectedCampaign.company_info.expected_domain || ''
      };
    }
  }

  onSubmit(): void {
    if (!this.selectedCampaign) return;

    // Validate simple
    if (!this.formData.companyName || !this.formData.mentorName) {
      this.errorMessage = 'Vui lòng điền đầy đủ các thông tin bắt buộc (*).';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.studentCampaignService.submitCompanyInfo(this.selectedCampaign.id, this.formData).subscribe({
      next: (res) => {
        this.successMessage = 'Nộp thông tin ĐVHD thành công!';
        this.isSaving = false;
        // Cập nhật lại status
        if (this.selectedCampaign) {
          this.selectedCampaign.status = 'COMPANY_DECLARED';
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Có lỗi xảy ra khi nộp thông tin.';
        this.isSaving = false;
      }
    });
  }
  
  get statusLabel(): string {
    if (!this.selectedCampaign) return '';
    switch (this.selectedCampaign.status) {
      case 'IMPORTED': return 'Chưa kê khai';
      case 'COMPANY_DECLARED': return 'Chờ duyệt ĐVHD';
      case 'COMPANY_APPROVED': return 'Đã duyệt ĐVHD';
      case 'PLAN_SUBMITTED': return 'Chờ duyệt Kế hoạch';
      case 'PLAN_APPROVED': return 'Đang thực tập';
      default: return this.selectedCampaign.status;
    }
  }
}
