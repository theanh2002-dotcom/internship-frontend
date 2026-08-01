import { Component, OnInit } from '@angular/core';
import { FinalResultService, FinalResultResponse } from '../../../core/services/final-result.service';
import { DepartmentService } from '../../../core/services/department.service';
import { CampaignService } from '../../../core/services/campaign.service';
import { CampaignResponse } from '../../../core/models/base.model';
import { DepartmentCampaignService } from '../../../core/services/department-campaign.service';
import { AuthService } from '../../../core/services/auth.service';
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

  // Pagination & Advanced Filters
  selectedStatusFilter: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;

  constructor(
    private finalResultService: FinalResultService,
    private departmentService: DepartmentService,
    private campaignService: CampaignService,
    private departmentCampaignService: DepartmentCampaignService,
    private authService: AuthService
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
    this.campaignService.getCampaignOptions().subscribe({
      next: (res) => {
        this.campaigns = res || [];
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
        this.results = (res || []).map((item: any) => ({
          ...item,
          stage_1_score: item.stage_1_score ?? item.stage1_score,
          stage_2_score: item.stage_2_score ?? item.stage2_score
        }));
        this.onFilterChange();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Không thể tải danh sách bảng điểm tổng hợp.';
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    const term = this.searchTerm.toLowerCase().trim();
    
    this.filteredResults = this.results.filter(r => {
      // 1. Search term query
      const matchesSearch = !term || 
        r.full_name.toLowerCase().includes(term) ||
        r.student_code.toLowerCase().includes(term) ||
        r.class_name.toLowerCase().includes(term);
        
      if (!matchesSearch) return false;

      // 2. Status filter mapping
      if (this.selectedStatusFilter === 'has_score') {
        return r.final_hp_score !== null && r.final_hp_score !== undefined;
      } else if (this.selectedStatusFilter === 'pending_score') {
        return r.final_hp_score === null || r.final_hp_score === undefined;
      } else if (this.selectedStatusFilter === 'passed') {
        return r.final_hp_score !== null && r.final_hp_score !== undefined && r.final_hp_score >= 4.0;
      } else if (this.selectedStatusFilter === 'failed') {
        return r.final_hp_score !== null && r.final_hp_score !== undefined && r.final_hp_score < 4.0;
      }
      
      return true;
    });

    this.totalItems = this.filteredResults.length;
    this.currentPage = 1; // Reset page to 1
  }

  onSearchChange(): void {
    this.onFilterChange();
  }

  get paginatedResults(): FinalResultResponse[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredResults.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
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
      'Trạng Thái': r.final_hp_score !== null ? 'Đã có kết quả' : 'Chưa có điểm'
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
    return this.results.filter(r => r.final_hp_score !== null && r.final_hp_score !== undefined).length;
  }

  get pendingApprovalCount(): number {
    return 0;
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
