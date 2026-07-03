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

  cloSets: any[] = [];
  selectedCloSetId: number | null = null;
  newCloSetName: string = '';

  cloCount: number = 7;
  hasDefinedCloCount: boolean = false;
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

  hasExistingConfig: boolean = false;
  isEditingName: boolean = false;
  currentCloSetId: number | null = null;
  currentCloSetName: string = '';

  onCampaignChange(): void {
    if (!this.selectedCampaignId) return;
    
    if (!this.departmentId) {
      this.toastService.error('Tài khoản của bạn chưa được gắn với Khoa/Bộ môn nào. Vui lòng liên hệ Admin.');
      return;
    }
    
    this.isLoading = true;
    this.showConfig = false;
    this.hasDefinedCloCount = false;
    this.hasExistingConfig = false;
    this.isEditingName = false;
    this.currentCloSetId = null;
    this.currentCloSetName = '';

    // Tìm hoặc tạo DepartmentCampaign
    this.deptCampaignService.findOrCreate(this.selectedCampaignId, this.departmentId).subscribe({
      next: (res: any) => {
        this.departmentCampaignId = res.id;
        this.currentCloSetId = res.clo_set_id || null;

        if (res.stage1_weight !== undefined) this.stage1Weight = res.stage1_weight;
        if (res.stage2_weight !== undefined) this.stage2Weight = res.stage2_weight;
        if (this.departmentCampaignId) {
          this.loadCloSets();
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

  loadCloSets(): void {
    if (!this.departmentId) return;
    this.deptCampaignService.getCloSets(this.departmentId).subscribe({
      next: (res: any) => {
        this.cloSets = Array.isArray(res) ? res : (res.data || res.payload || []);
        // Tìm tên của bộ CLO hiện tại nếu có
        if (this.currentCloSetId) {
          const currentSet = this.cloSets.find(s => s.id === this.currentCloSetId);
          if (currentSet) {
            this.currentCloSetName = currentSet.name;
          }
        }
      }
    });
  }

  applyCloSet(): void {
    if (!this.departmentCampaignId || !this.selectedCloSetId) return;
    this.isLoading = true;
    this.deptCampaignService.applyCloSet(this.departmentCampaignId, this.selectedCloSetId).subscribe({
      next: () => {
        this.toastService.success('Đã áp dụng bộ CLO thành công');
        this.currentCloSetId = this.selectedCloSetId;
        const currentSet = this.cloSets.find(s => s.id === this.currentCloSetId);
        if (currentSet) this.currentCloSetName = currentSet.name;
        this.loadCloConfigs();
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(err.message || 'Lỗi khi áp dụng bộ CLO');
      }
    });
  }

  showConfig: boolean = false;

  loadCloConfigs(): void {
    if (!this.departmentCampaignId) return;

    this.deptCampaignService.getCloConfigs(this.departmentCampaignId).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data || res.payload || []);
        
        if (data.length > 0) {
          this.clos = data.map((clo: any) => {
            clo.stage1_weight = clo.stage1_weight ?? this.stage1Weight;
            clo.stage2_weight = clo.stage2_weight ?? this.stage2Weight;
            if (clo.rubrics) {
              clo.rubrics.sort((a: any, b: any) => a.score_level - b.score_level);
            }
            return clo;
          });
          this.selectedCloIndex = 0;
          this.showConfig = true; // Auto show if existing configs exist
          this.hasDefinedCloCount = true;
          this.hasExistingConfig = true;
        } else {
          this.clos = [];
          this.showConfig = false; // Hide UI until user chooses
          this.hasDefinedCloCount = false;
          this.hasExistingConfig = false;
        }
        
        // Tự động phân bổ lại tổng điểm (nếu chưa lưu weight nào)
        if (this.clos.length > 0 && this.stage1Weight === 0 && this.stage2Weight === 0) {
          this.stage1Weight = 50;
          this.stage2Weight = 50;
        }

        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.error('Lỗi tải cấu hình CLO: ' + (err.message || ''));
        this.isLoading = false;
      }
    });
  }

  startCreatingNew(): void {
    this.showConfig = true;
    this.hasDefinedCloCount = false;
    this.newCloSetName = '';
    this.clos = [];
    this.cloCount = 7;
  }

  defineCloCount(): void {
    const count = Number(this.cloCount);
    if (!Number.isInteger(count) || count <= 0 || count > 20) {
      this.showError('Số lượng CLO phải từ 1 đến 20.');
      return;
    }

    this.clos = Array.from({ length: count }, (_, index) => this.createEmptyClo(index + 1));
    this.distributeAlphaWeights();
    this.selectedCloIndex = 0;
    this.hasDefinedCloCount = true;
  }

  private distributeAlphaWeights(): void {
    if (this.clos.length === 0) return;

    const base = Math.floor((100 / this.clos.length) * 100) / 100;
    let assigned = 0;
    this.clos.forEach((clo, index) => {
      if (index === this.clos.length - 1) {
        clo.alpha_weight = Number((100 - assigned).toFixed(2));
      } else {
        clo.alpha_weight = base;
        assigned += base;
      }
    });
  }

  createEmptyClo(index?: number): CloItem {
    return {
      clo_code: index ? `CLO${index}` : '',
      description: '',
      alpha_weight: 0,
      stage1_weight: this.stage1Weight,
      stage2_weight: this.stage2Weight,
      gvhd_beta: 50,
      company_beta: 50,
      rubrics: []
    };
  }

  addClo(): void {
    this.clos.push(this.createEmptyClo(this.clos.length + 1));
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

  onCloStage1WeightChange(clo: CloItem): void {
    clo.stage2_weight = 100 - (clo.stage1_weight || 0);
  }

  setStageWeights(stage1: number): void {
    this.stage1Weight = stage1;
    this.stage2Weight = 100 - stage1;
  }

  setCloStageWeights(clo: CloItem, stage1: number): void {
    clo.stage1_weight = stage1;
    clo.stage2_weight = 100 - stage1;
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
          { score_level: 0.0, description: 'Mức 0 (<4): Kém (0.0đ) - Hoàn toàn không đạt yêu cầu chuẩn đầu ra.' },
          { score_level: 4.5, description: 'Mức 1 (4 - 5.4): Yếu (4.5đ) - Chưa đạt chuẩn đầu ra hoặc cần nhiều hướng dẫn.' },
          { score_level: 6.0, description: 'Mức 2 (5.5 - 6.9): Trung bình (6.0đ) - Đạt chuẩn đầu ra ở mức cơ bản, hoàn thành công việc được giao.' },
          { score_level: 7.5, description: 'Mức 3 (7 - 8.4): Khá (7.5đ) - Áp dụng tốt chuẩn đầu ra, làm việc độc lập tương đối ổn định.' },
          { score_level: 9.0, description: 'Mức 4 (>=8.5): Tốt/Xuất sắc (9.0đ) - Vận dụng sáng tạo và xuất sắc chuẩn đầu ra, chủ động giải quyết vấn đề.' }
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
      return clo.rubrics[0].score_level === 0 && clo.rubrics[4].score_level === 9.0;
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

      const totalCloStageWeight = (clo.stage1_weight || 0) + (clo.stage2_weight || 0);
      if (Math.abs(totalCloStageWeight - 100) > 0.01) {
        this.showError(`Tổng trọng số Chặng 1 + Chặng 2 của ${clo.clo_code} phải bằng 100%.`);
        return;
      }

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

    if (!this.newCloSetName || !this.newCloSetName.trim()) {
      this.showError('Vui lòng nhập tên cho bộ CLO mới.');
      return;
    }

    const request: CloConfigRequest = {
      department_campaign_id: this.departmentCampaignId,
      stage1_weight: this.stage1Weight,
      stage2_weight: this.stage2Weight,
      clo_set_name: this.newCloSetName,
      clos: this.clos
    };

    this.isSaving = true;
    this.deptCampaignService.saveCloConfigs(request).subscribe({
      next: () => {
        this.isSaving = false;
        this.showSuccess('Đã lưu cấu hình CLO & Rubric thành công!');
        this.newCloSetName = ''; // Reset input
        this.loadCloSets(); // reload dropdown
        this.loadCloConfigs(); // reload configs
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
