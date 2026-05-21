import { Component, OnInit } from '@angular/core';
import { FinalResultService, FinalResultResponse } from '../../../core/services/final-result.service';
import { DepartmentService } from '../../../core/services/department.service';
import { CampaignService } from '../../../core/services/campaign.service';
import { CampaignResponse } from '../../../core/models/base.model';
import { DepartmentCampaignService } from '../../../core/services/department-campaign.service';
import { AuthService } from '../../../core/services/auth.service';
import { EvaluationService } from '../../../core/services/evaluation.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-ldkbm-score-summary',
  templateUrl: './score-summary.component.html',
  styleUrls: ['./score-summary.component.scss']
})
export class LdkbmScoreSummaryComponent implements OnInit {
  results: FinalResultResponse[] = [];
  filteredResults: FinalResultResponse[] = [];
  searchTerm: string = '';
  
  campaigns: CampaignResponse[] = [];
  selectedCampaignId: number = 0;
  departmentId: number = 0;
  departmentCampaignId: number = 0;
  
  loading: boolean = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private finalResultService: FinalResultService,
    private departmentService: DepartmentService,
    private campaignService: CampaignService,
    private departmentCampaignService: DepartmentCampaignService,
    private authService: AuthService,
    private evaluationService: EvaluationService
  ) { }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.departmentId) {
      this.departmentId = user.departmentId;
    }
    this.loadCampaigns();
  }

  showSuccess(msg: string): void {
    this.success = msg;
    setTimeout(() => {
      this.success = null;
    }, 3000);
  }

  loadCampaigns(): void {
    this.loading = true;
    this.campaignService.getCampaigns({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        this.campaigns = res.data || [];
        if (this.campaigns.length > 0) {
          this.selectedCampaignId = this.campaigns[0].id;
          this.loadContextAndData();
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = 'Không thể tải danh sách đợt thực tập.';
        this.loading = false;
      }
    });
  }

  onCampaignChange(): void {
    this.loadContextAndData();
  }

  loadContextAndData(): void {
    if (!this.selectedCampaignId || !this.departmentId) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    this.departmentCampaignService.findOrCreate(this.selectedCampaignId, this.departmentId).subscribe({
      next: (res) => {
        this.departmentCampaignId = res.id;
        if (this.departmentCampaignId) {
          this.loadFinalResults();
        } else {
          this.error = 'Không tìm thấy đợt thực tập của bộ môn.';
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = err.message || 'Lỗi tải cấu hình đợt thực tập.';
        this.loading = false;
      }
    });
  }

  loadFinalResults(): void {
    this.loading = true;
    this.error = null;
    this.finalResultService.getFinalResultsByCampaign(this.departmentCampaignId).subscribe({
      next: (res) => {
        this.results = res || [];
        this.filteredResults = this.results;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Không thể tải danh sách bảng điểm tổng hợp.';
        this.loading = false;
      }
    });
  }

  onSearchChange(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredResults = this.results.filter(r =>
      r.full_name.toLowerCase().includes(term) ||
      r.student_code.toLowerCase().includes(term) ||
      r.class_name.toLowerCase().includes(term)
    );
  }

  calculateScore(studentCampaignId: number): void {
    this.loading = true;
    this.error = null;
    this.evaluationService.calculateFinalResult(studentCampaignId).subscribe({
      next: () => {
        this.showSuccess('Tính điểm cho sinh viên thành công!');
        this.loadFinalResults();
      },
      error: (err) => {
        this.error = err.error?.message || 'Có lỗi xảy ra khi tính điểm sinh viên.';
        this.loading = false;
      }
    });
  }

  calculateAll(): void {
    const studentsToCalc = this.results.filter(r => !r.is_approved);
    if (studentsToCalc.length === 0) {
      alert('Không có sinh viên nào cần tính điểm (hoặc tất cả đã được duyệt).');
      return;
    }
    if (confirm(`Bạn có chắc muốn tính toán lại điểm cho ${studentsToCalc.length} sinh viên chưa duyệt?`)) {
      this.loading = true;
      let completedCount = 0;
      studentsToCalc.forEach(s => {
        this.evaluationService.calculateFinalResult(s.student_campaign_id).subscribe({
          next: () => {},
          error: () => {},
          complete: () => {
            completedCount++;
            if (completedCount === studentsToCalc.length) {
              this.showSuccess('Tính toán điểm toàn bộ hoàn tất!');
              this.loadFinalResults();
            }
          }
        });
      });
    }
  }

  approveSingle(studentCampaignId: number): void {
    if (confirm('Bạn có chắc chắn muốn duyệt điểm cho sinh viên này?')) {
      this.loading = true;
      this.error = null;
      this.finalResultService.approveFinalResult(studentCampaignId).subscribe({
        next: () => {
          this.showSuccess('Phê duyệt điểm thành công!');
          this.loadFinalResults();
        },
        error: (err) => {
          this.error = err.error?.message || 'Phê duyệt thất bại.';
          this.loading = false;
        }
      });
    }
  }

  approveAll(): void {
    if (confirm('Bạn có chắc chắn muốn duyệt toàn bộ kết quả?')) {
      const pendingResults = this.results.filter(r => !r.is_approved && r.final_hp_score !== null);
      let completedCount = 0;

      if (pendingResults.length === 0) {
        alert('Không có kết quả nào sẵn sàng để duyệt (yêu cầu phải tính điểm trước khi duyệt).');
        return;
      }

      this.loading = true;
      pendingResults.forEach(r => {
        this.finalResultService.approveFinalResult(r.student_campaign_id).subscribe({
          next: () => {
            r.is_approved = true;
          },
          complete: () => {
            completedCount++;
            if (completedCount === pendingResults.length) {
              this.loading = false;
              this.showSuccess('Duyệt toàn bộ kết quả hoàn tất!');
              this.loadFinalResults();
            }
          }
        });
      });
    }
  }

  exportToExcel(): void {
    const dataToExport = this.filteredResults.map((r, index) => ({
      'STT': index + 1,
      'Họ và tên': r.full_name,
      'Mã SV': r.student_code,
      'Lớp': r.class_name,
      'Điểm Chặng 1': r.stage_1_score !== null && r.stage_1_score !== undefined ? r.stage_1_score : '-',
      'Điểm Chặng 2': r.stage_2_score !== null && r.stage_2_score !== undefined ? r.stage_2_score : '-',
      'Điểm Tổng Kết': r.final_hp_score !== null && r.final_hp_score !== undefined ? r.final_hp_score : '-',
      'Xếp Loại': r.grade_level || 'Chưa xếp loại',
      'Trạng Thế': r.is_approved ? 'Đã duyệt' : (r.final_hp_score !== null ? 'Chờ duyệt' : 'Chưa tính điểm')
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BangDiemTongKet');
    XLSX.writeFile(wb, `BangDiemTongKet_TTTN_${this.selectedCampaignId}.xlsx`);
  }

  // Statistical getters
  get totalStudentsCount(): number {
    return this.results.length;
  }

  get approvedCount(): number {
    return this.results.filter(r => r.is_approved).length;
  }

  get pendingApprovalCount(): number {
    return this.results.filter(r => r.final_hp_score !== null && r.final_hp_score !== undefined && !r.is_approved).length;
  }

  get pendingScoreCount(): number {
    return this.results.filter(r => r.final_hp_score === null || r.final_hp_score === undefined).length;
  }

  get passedCount(): number {
    return this.results.filter(r => r.final_hp_score !== null && r.final_hp_score !== undefined && r.final_hp_score >= 4.0).length;
  }

  get failedCount(): number {
    return this.results.filter(r => r.final_hp_score !== null && r.final_hp_score !== undefined && r.final_hp_score < 4.0).length;
  }
}
