import { ToastService } from '../../../core/services/toast.service';
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
      campaigns: CampaignResponse[] = [];
  selectedCampaignId: number | null = null;
  departmentId: number | null = null;
  departmentCampaignId: number | null = null;
  stage1Weight: number = 30;
  stage2Weight: number = 70;

  clos: CloItem[] = [];
  selectedCloIndex: number = 0;

  constructor(private toastService: ToastService, private deptCampaignService: DepartmentCampaignService,
    private campaignService: CampaignService,
    private authService: AuthService) {}

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
      this.toastService.error('Tài khoản của bạn chưa được gắn với Khoa/Bộ môn nào. Vui lòng liên hệ Admin.');
      return;
    }
    
    this.isLoading = true;
    // Tìm hoặc tạo DepartmentCampaign
    this.deptCampaignService.findOrCreate(this.selectedCampaignId, this.departmentId).subscribe({
      next: (res: any) => {
        this.departmentCampaignId = res.id;
        if (res.stage1_weight !== undefined) this.stage1Weight = res.stage1_weight;
        if (res.stage2_weight !== undefined) this.stage2Weight = res.stage2_weight;
        if (this.departmentCampaignId) {
          this.loadCloConfigs();
        } else {
          this.toastService.error('Không thể xác định luồng Đợt thực tập của Khoa.');
          this.isLoading = false;
        }
      },
      error: (err: any) => {
        this.toastService.error('Lỗi hệ thống: ' + (err.message || ''));
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
          this.clos = data.map((clo: any) => {
            if (clo.rubrics) {
              clo.rubrics.sort((a: any, b: any) => a.score_level - b.score_level);
            }
            return clo;
          });
          this.selectedCloIndex = 0;
        } else {
          // Khởi tạo 1 CLO trống mặc định
          this.clos = [this.createEmptyClo()];
          this.selectedCloIndex = 0;
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.error('Lỗi tải cấu hình CLO: ' + (err.message || ''));
        this.isLoading = false;
      }
    });
  }

  createEmptyClo(): CloItem {
    return {
      clo_code: '',
      description: '',
      alpha_weight: 0,
      gvhd_beta: 50,
      company_beta: 50,
      rubrics: []
    };
  }

  addClo(): void {
    this.clos.push(this.createEmptyClo());
    this.selectedCloIndex = this.clos.length - 1;
  }

  removeClo(index: number): void {
    this.clos.splice(index, 1);
    if (this.selectedCloIndex >= this.clos.length) {
      this.selectedCloIndex = Math.max(0, this.clos.length - 1);
    }
  }

  addRubric(clo: CloItem): void {
    clo.rubrics.push({ score_level: 0, description: '' });
  }

  removeRubric(clo: CloItem, rubricIndex: number): void {
    clo.rubrics.splice(rubricIndex, 1);
  }

  get totalAlphaWeight(): number {
    return this.clos.reduce((sum, clo) => sum + (clo.alpha_weight || 0), 0);
  }

  get isAlphaWeightValid(): boolean {
    return this.totalAlphaWeight === 100;
  }

  get totalStageWeight(): number {
    return (this.stage1Weight || 0) + (this.stage2Weight || 0);
  }

  get isStageWeightValid(): boolean {
    return this.totalStageWeight === 100;
  }

  onStage1WeightChange(): void {
    this.stage2Weight = 100 - (this.stage1Weight || 0);
  }

  onBetaWeightChange(clo: CloItem): void {
    clo.company_beta = 100 - (clo.gvhd_beta || 0);
  }

  setStageWeights(stage1: number): void {
    this.stage1Weight = stage1;
    this.stage2Weight = 100 - stage1;
  }

  setBetaWeights(clo: CloItem, gvhd: number): void {
    clo.gvhd_beta = gvhd;
    clo.company_beta = 100 - gvhd;
  }

  applyPreset(clo: CloItem, presetType: string): void {
    switch (presetType) {
      case 'scale-5':
        clo.rubrics = [
          { score_level: 0, description: 'Mức 0 (<4): Kém (0.0đ) - Hoàn toàn không đạt yêu cầu chuẩn đầu ra.' },
          { score_level: 1, description: 'Mức 1 (4 - 5.4): Yếu (4.5đ) - Chưa đạt chuẩn đầu ra hoặc cần nhiều hướng dẫn.' },
          { score_level: 2, description: 'Mức 2 (5.5 - 6.9): Trung bình (6.0đ) - Đạt chuẩn đầu ra ở mức cơ bản, hoàn thành công việc được giao.' },
          { score_level: 3, description: 'Mức 3 (7 - 8.4): Khá (7.5đ) - Áp dụng tốt chuẩn đầu ra, làm việc độc lập tương đối ổn định.' },
          { score_level: 4, description: 'Mức 4 (>=8.5): Tốt/Xuất sắc (9.0đ) - Vận dụng sáng tạo và xuất sắc chuẩn đầu ra, chủ động giải quyết vấn đề.' }
        ];
        break;
      case 'scale-10':
        clo.rubrics = [
          { score_level: 0, description: 'Mức 1 - Kém: Hoàn toàn không đạt yêu cầu chuẩn đầu ra.' },
          { score_level: 4, description: 'Mức 2 - Yếu: Kiến thức và kỹ năng còn nhiều hạn chế, chưa đáp ứng yêu cầu.' },
          { score_level: 6, description: 'Mức 3 - Trung bình: Đáp ứng mức tối thiểu yêu cầu của chuẩn đầu ra.' },
          { score_level: 8, description: 'Mức 4 - Khá/Tốt: Thực hiện tốt công việc, nắm vững chuyên môn.' },
          { score_level: 10, description: 'Mức 5 - Xuất sắc: Năng lực nổi trội, giải quyết công việc xuất sắc và chủ động.' }
        ];
        break;
    }
  }

  isPresetActive(clo: CloItem, presetType: string): boolean {
    if (!clo.rubrics || clo.rubrics.length !== 5) return false;
    
    if (presetType === 'scale-5') {
      return clo.rubrics[0].score_level === 0 && clo.rubrics[4].score_level === 4;
    }
    if (presetType === 'scale-10') {
      return clo.rubrics[0].score_level === 0 && clo.rubrics[4].score_level === 10;
    }
    return false;
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

      if (!clo.rubrics || clo.rubrics.length === 0) {
        this.showError(`CLO ${clo.clo_code} chưa có tiêu chí Rubric nào. Vui lòng thêm ít nhất 1 tiêu chí.`);
        return;
      }

      const scoreLevels = new Set<number>();
      for (const r of clo.rubrics) {
        if (r.score_level === null || r.score_level === undefined) {
          this.showError(`CLO ${clo.clo_code} có tiêu chí chưa nhập Mức điểm.`);
          return;
        }
        if (scoreLevels.has(r.score_level)) {
          this.showError(`CLO ${clo.clo_code} có Mức điểm ${r.score_level} bị trùng lặp. Mỗi tiêu chí phải có mức điểm duy nhất.`);
          return;
        }
        scoreLevels.add(r.score_level);
      }
    }

    if (this.stage1Weight + this.stage2Weight !== 100) {
      this.showError('Tổng trọng số Chặng 1 và Chặng 2 phải bằng 100%.');
      return;
    }

    if (this.clos.length > 0 && Math.abs(totalAlpha - 100) > 0.01) {
      this.showError('Tổng trọng số Alpha của tất cả các CLO phải bằng 100%.');
      return;
    }

    const request: CloConfigRequest = {
      department_campaign_id: this.departmentCampaignId,
      stage1_weight: this.stage1Weight,
      stage2_weight: this.stage2Weight,
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
    this.toastService.error(msg);
  }

  showSuccess(msg: string): void {
    this.toastService.success(msg);
  }
}
