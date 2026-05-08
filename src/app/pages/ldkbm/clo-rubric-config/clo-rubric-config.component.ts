import { Component, OnInit } from '@angular/core';
import { DepartmentCampaignService, CloConfigRequest, CloItem, RubricItem } from '../../../core/services/department-campaign.service';
import { CampaignService } from '../../../core/services/campaign.service';
import { CampaignResponse } from '../../../core/models/base.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-clo-rubric-config',
  templateUrl: './clo-rubric-config.component.html',
  styleUrls: ['./clo-rubric-config.component.scss']
})
export class CloRubricConfigComponent implements OnInit {
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  campaigns: CampaignResponse[] = [];
  selectedCampaignId: number | null = null;
  departmentId: number | null = null;
  departmentCampaignId: number | null = null;

  clos: CloItem[] = [];

  constructor(
    private deptCampaignService: DepartmentCampaignService,
    private campaignService: CampaignService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.departmentId) {
      this.departmentId = user.departmentId;
    }
    this.loadCampaigns();
  }

  loadCampaigns(): void {
    this.campaignService.getCampaigns({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        this.campaigns = res.data || [];
        if (this.campaigns.length > 0) {
          this.selectedCampaignId = this.campaigns[0].id;
          this.onCampaignChange();
        }
      }
    });
  }

  onCampaignChange(): void {
    if (!this.selectedCampaignId) return;
    
    if (!this.departmentId) {
      this.errorMessage = 'Tài khoản của bạn chưa được gắn với Khoa/Bộ môn nào. Vui lòng liên hệ Admin.';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    // Tìm hoặc tạo DepartmentCampaign
    this.deptCampaignService.findOrCreate(this.selectedCampaignId, this.departmentId).subscribe({
      next: (res) => {
        this.departmentCampaignId = res.id;
        if (this.departmentCampaignId) {
          this.loadCloConfigs();
        } else {
          this.errorMessage = 'Không thể xác định luồng Đợt thực tập của Khoa.';
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.errorMessage = 'Lỗi hệ thống: ' + (err.message || '');
        this.isLoading = false;
      }
    });
  }

  loadCloConfigs(): void {
    if (!this.departmentCampaignId) return;

    this.deptCampaignService.getCloConfigs(this.departmentCampaignId).subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res : (res.data || res.payload || []);
        if (data.length > 0) {
          this.clos = data;
        } else {
          // Khởi tạo 1 CLO trống mặc định
          this.clos = [this.createEmptyClo()];
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Lỗi tải cấu hình CLO: ' + (err.message || '');
        this.isLoading = false;
      }
    });
  }

  createEmptyClo(): CloItem {
    return {
      clo_code: '',
      description: '',
      alpha_weight: 0,
      gvhd_beta: 0.5,
      company_beta: 0.5,
      rubrics: []
    };
  }

  addClo(): void {
    this.clos.push(this.createEmptyClo());
  }

  removeClo(index: number): void {
    this.clos.splice(index, 1);
  }

  addRubric(clo: CloItem): void {
    clo.rubrics.push({ score_level: 0, description: '' });
  }

  removeRubric(clo: CloItem, rubricIndex: number): void {
    clo.rubrics.splice(rubricIndex, 1);
  }

  saveConfigs(): void {
    if (!this.departmentCampaignId) return;

    // Validate
    let totalAlpha = 0;
    for (let i = 0; i < this.clos.length; i++) {
      const clo = this.clos[i];
      if (!clo.clo_code || !clo.clo_code.trim()) {
        this.showError(`CLO thứ ${i+1} chưa có mã CLO.`);
        return;
      }
      totalAlpha += clo.alpha_weight || 0;

      const totalBeta = (clo.gvhd_beta || 0) + (clo.company_beta || 0);
      if (Math.abs(totalBeta - 100) > 0.01) {
        this.showError(`Tổng Beta (GVHD + DN) của ${clo.clo_code} phải bằng 100%.`);
        return;
      }
    }

    if (this.clos.length > 0 && Math.abs(totalAlpha - 100) > 0.01) {
      this.showError('Tổng trọng số Alpha của tất cả các CLO phải bằng 100%.');
      return;
    }

    const request: CloConfigRequest = {
      department_campaign_id: this.departmentCampaignId,
      clos: this.clos
    };

    this.isSaving = true;
    this.deptCampaignService.saveCloConfigs(request).subscribe({
      next: () => {
        this.isSaving = false;
        this.showSuccess('Đã lưu cấu hình CLO & Rubric thành công!');
        this.loadCloConfigs(); // reload
      },
      error: (err) => {
        this.isSaving = false;
        this.showError(err.message || 'Lỗi khi lưu cấu hình');
      }
    });
  }

  showError(msg: string): void {
    this.errorMessage = msg;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => this.errorMessage = '', 5000);
  }

  showSuccess(msg: string): void {
    this.successMessage = msg;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => this.successMessage = '', 3000);
  }
}
