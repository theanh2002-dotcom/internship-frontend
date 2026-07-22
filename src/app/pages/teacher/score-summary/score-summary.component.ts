import { Component, OnInit } from '@angular/core';
import { EvaluationService } from '../../../core/services/evaluation.service';
import { DepartmentCampaignService } from '../../../core/services/department-campaign.service';
import { ToastService } from '../../../core/services/toast.service';
import { CampaignService } from '../../../core/services/campaign.service';
import { firstValueFrom } from 'rxjs';
import { FinalResultResponse, FinalResultService } from '../../../core/services/final-result.service';

interface StudentScore {
  id: number;
  mssv: string;
  name: string;
  lastName: string;
  firstName: string;
  class: string;
  companyName: string;
  gvhdName: string;
  stage1Score: number | null; // Điểm Chặng 1
  stage2Score: number | null; // Điểm Chặng 2
  totalScore: number | null;  // Điểm tổng hợp
  status: string;
  campaignId: number;
  departmentId: number;
}

@Component({
  selector: 'app-score-summary',
  templateUrl: './score-summary.component.html',
  styleUrls: ['./score-summary.component.scss']
})
export class ScoreSummaryComponent implements OnInit {
  isLoading = true;
  students: StudentScore[] = [];
  
  // Filters & Pagination
  campaigns: any[] = [];
  selectedCampaignId: number | null = null;
  searchQuery: string = '';
  selectedStatus: string = '';
  
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  
  filteredStudents: StudentScore[] = [];
  paginatedStudents: StudentScore[] = [];
  private exportConfigCache = new Map<string, Promise<any>>();
  private xlsx: any = null;

  constructor(
    private evaluationService: EvaluationService,
    private finalResultService: FinalResultService,
    private departmentCampaignService: DepartmentCampaignService,
    private toastService: ToastService,
    private campaignService: CampaignService
  ) {}

  ngOnInit(): void {
    this.loadCampaigns();
    this.loadData();
  }

  loadCampaigns(): void {
    this.campaignService.getCampaigns({ page: 1, limit: 100 }, 'ACTIVE').subscribe({
      next: (res) => {
        this.campaigns = res.data || [];
        this.applyFilters();
      },
      error: (err) => {
        console.error('Lỗi tải danh sách đợt thực tập:', err);
      }
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.finalResultService.getMyStudentFinalResults(this.selectedCampaignId).subscribe({
      next: (res) => {
        const finalResults = Array.isArray(res) ? res : [];
        this.processStudents(finalResults);
        this.isLoading = false;
        this.applyFilters();
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  processStudents(results: FinalResultResponse[]): void {
    this.students = results.map(result => {
      const parts = this.splitFullName(result.full_name || '');
      const stage1Score = this.toNullableScore(result.stage1_score ?? result.stage_1_score);
      const stage2Score = this.toNullableScore(result.stage2_score ?? result.stage_2_score);
      const totalScore = this.toNullableScore(result.final_hp_score);

      return {
        id: result.student_campaign_id,
        mssv: result.student_code,
        name: result.full_name,
        lastName: parts.lastName,
        firstName: parts.firstName,
        class: result.class_name || 'N/A',
        companyName: result.company_name || 'N/A',
        gvhdName: result.gvhd_name || 'N/A',
        stage1Score,
        stage2Score,
        totalScore,
        status: this.getResultStatus(result.grade_level, totalScore),
        campaignId: result.campaign_id || 0,
        departmentId: result.department_id || 0
      };
    });
  }

  applyFilters(): void {
    let result = [...this.students];

    // 1. Lọc theo đợt thực tập
    if (this.selectedCampaignId !== null) {
      result = result.filter(s => Number(s.campaignId) === Number(this.selectedCampaignId));
    } else if (this.campaigns.length > 0) {
      const activeCampaignIds = new Set(this.campaigns.map(c => Number(c.id)));
      result = result.filter(s => activeCampaignIds.has(Number(s.campaignId)));
    }

    // 2. Tìm kiếm theo tên, mssv, lớp
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase().trim();
      result = result.filter(s => 
        (s.name && s.name.toLowerCase().includes(query)) ||
        (s.mssv && s.mssv.toLowerCase().includes(query)) ||
        (s.class && s.class.toLowerCase().includes(query))
      );
    }

    // 3. Lọc theo kết quả
    if (this.selectedStatus) {
      result = result.filter(s => s.status === this.selectedStatus);
    }

    this.filteredStudents = result;
    this.totalItems = result.length;

    // Reset trang nếu vượt quá giới hạn
    const totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }

    this.paginate();
  }

  paginate(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedStudents = this.filteredStudents.slice(startIndex, endIndex);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onCampaignChange(): void {
    this.currentPage = 1;
    this.loadData();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.paginate();
  }

  get totalStudents(): number { return this.filteredStudents.length; }
  get studentsWithResult(): number { return this.filteredStudents.filter(s => s.status === 'Đạt' || s.status === 'Không đạt').length; }
  get studentsPassed(): number { return this.filteredStudents.filter(s => s.status === 'Đạt').length; }
  get studentsFailed(): number { return this.filteredStudents.filter(s => s.status === 'Không đạt').length; }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Đạt': return 'bg-green-100 text-green-800 border-green-200';
      case 'Không đạt': return 'bg-red-100 text-red-800 border-red-200';
      case 'Chưa có kết quả': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return '';
    }
  }

  private getResultStatus(gradeLevel: string | null | undefined, totalScore: number | null): string {
    if (gradeLevel) {
      return gradeLevel !== 'F' ? 'Đạt' : 'Không đạt';
    }
    if (totalScore === null) {
      return 'Chưa có kết quả';
    }
    return totalScore >= 4 ? 'Đạt' : 'Không đạt';
  }

  async exportExcel(): Promise<void> {
    if (this.filteredStudents.length === 0) {
      this.toastService.error('Không có sinh viên để xuất Excel.');
      return;
    }

    this.toastService.info('Đang tạo file Excel đánh giá theo mẫu...');

    try {
      const xlsxModule = await import('xlsx-js-style');
      this.xlsx = (xlsxModule as any).default || xlsxModule;
      const details = await Promise.all(this.filteredStudents.map(student => this.buildExportDetail(student)));
      const workbook = this.xlsx.utils.book_new();

      if (details.length === 1) {
        const detail = details[0];
        this.appendStyledStudentInfoSheet(workbook, detail, 'Thong tin SV');
        this.appendStyledStageSheet(workbook, detail, 'STAGE_1', 'Chang 1 - Giua ky');
        this.appendStyledStageSheet(workbook, detail, 'STAGE_2', 'Chang 2 - Cuoi ky');
        this.appendStyledSummarySheet(workbook, detail, 'Tong hop diem');
        this.appendStyledRubricSheet(workbook, detail, 'Rubric CLO');
      } else {
        details.forEach(detail => {
          this.appendStyledSummarySheet(workbook, detail, this.safeSheetName(`Tong hop ${detail.student.mssv}`));
          this.appendStyledStageSheet(workbook, detail, 'STAGE_1', this.safeSheetName(`C1 ${detail.student.mssv}`));
          this.appendStyledStageSheet(workbook, detail, 'STAGE_2', this.safeSheetName(`C2 ${detail.student.mssv}`));
        });
        this.appendStyledRubricSheet(workbook, details[0], 'Rubric CLO');
      }

      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      this.xlsx.writeFile(workbook, `TTTN_DanhGia_GVHD_${datePart}.xlsx`);
      this.toastService.success('Xuất Excel thành công.');
    } catch (error) {
      console.error('Lỗi xuất Excel:', error);
      this.toastService.error('Không thể xuất Excel. Vui lòng thử lại.');
    }
  }

  private async buildExportDetail(student: StudentScore): Promise<any> {
    const [config, evaluationResponse] = await Promise.all([
      this.getExportConfig(student),
      firstValueFrom(this.evaluationService.findEvaluations(student.id))
    ]);

    return {
      student,
      stage1Weight: config.stage1Weight,
      stage2Weight: config.stage2Weight,
      clos: config.clos,
      evaluations: this.unwrapArray(evaluationResponse)
    };
  }

  private async getExportConfig(student: StudentScore): Promise<any> {
    const cacheKey = `${student.campaignId}-${student.departmentId}`;
    if (!this.exportConfigCache.has(cacheKey)) {
      this.exportConfigCache.set(cacheKey, (async () => {
        const deptCampaignResponse = await firstValueFrom(
          this.departmentCampaignService.findOrCreate(student.campaignId, student.departmentId)
        );
        const deptCampaign = this.unwrapResponse(deptCampaignResponse);
        const cloResponse = await firstValueFrom(this.departmentCampaignService.getCloConfigs(deptCampaign.id));

        return {
          stage1Weight: this.toNumber(deptCampaign.stage1_weight, 30),
          stage2Weight: this.toNumber(deptCampaign.stage2_weight, 70),
          clos: this.unwrapArray(cloResponse)
        };
      })());
    }

    return this.exportConfigCache.get(cacheKey)!;
  }

  private appendStyledStudentInfoSheet(workbook: any, detail: any, sheetName: string): void {
    const rows = this.createMatrix(33, 5);
    const put = (row: number, col: number, value: any) => rows[row - 1][col - 1] = value;
    const student = detail.student;

    put(2, 2, 'PHIẾU THÔNG TIN SINH VIÊN THỰC TẬP TỐT NGHIỆP');
    put(4, 2, 'Trường Đại học Xây dựng Hà Nội - HUCE');
    put(6, 2, 'A. THÔNG TIN SINH VIÊN');
    put(7, 2, 'Họ và tên sinh viên'); put(7, 3, student.name);
    put(8, 2, 'Mã số sinh viên'); put(8, 3, student.mssv);
    put(9, 2, 'Lớp / Khoa'); put(9, 3, student.class);
    put(10, 2, 'Ngành / Chuyên ngành'); put(10, 3, '');
    put(11, 2, 'Email'); put(12, 2, 'Số điện thoại');
    put(14, 2, 'B. GIẢNG VIÊN HƯỚNG DẪN (GVHD)');
    put(15, 2, 'Họ và tên GVHD'); put(15, 3, student.gvhdName);
    put(16, 2, 'Khoa / Bộ môn'); put(16, 3, student.class);
    put(17, 2, 'Email GVHD'); put(18, 2, 'Số điện thoại GVHD');
    put(20, 2, 'C. ĐƠN VỊ TIẾP NHẬN & HƯỚNG DẪN (DVHD)');
    put(21, 2, 'Tên đơn vị (DVHD)'); put(21, 3, student.companyName);
    put(22, 2, 'Địa chỉ');
    put(23, 2, 'Cán bộ hướng dẫn tại DVHD');
    put(24, 2, 'Chức vụ');
    put(25, 2, 'Email DVHD');
    put(26, 2, 'Điện thoại DVHD');
    put(28, 2, 'D. THÔNG TIN ĐỢT THỰC TẬP');
    put(29, 2, 'Học kỳ / Năm học'); put(29, 3, this.getCampaignName(student.campaignId));
    put(30, 2, 'Hình thức thực tập'); put(30, 3, 'Tại doanh nghiệp');

    const sheet = this.xlsx.utils.aoa_to_sheet(rows);
    sheet['!cols'] = [{ wch: 4 }, { wch: 28 }, { wch: 24 }, { wch: 18 }, { wch: 18 }];
    sheet['!rows'] = Array.from({ length: 33 }, (_, index) => ({ hpt: index === 1 ? 30 : 20 }));
    this.addMerges(sheet, ['B2:E3', 'B4:E4', 'B6:E6', 'C7:E7', 'C8:E8', 'C9:E9', 'C10:E10', 'C11:E11', 'C12:E12', 'B14:E14', 'C15:E15', 'C16:E16', 'C17:E17', 'C18:E18', 'B20:E20', 'C21:E21', 'C22:E22', 'C23:E23', 'C24:E24', 'C25:E25', 'C26:E26', 'B28:E28', 'C29:E29', 'C30:E30']);

    const styles = this.excelStyles();
    this.styleRange(sheet, 'B2:E3', styles.title);
    this.styleRange(sheet, 'B4:E4', styles.subtitle);
    ['B6:E6', 'B14:E14', 'B20:E20', 'B28:E28'].forEach(range => this.styleRange(sheet, range, styles.sectionBlue));
    this.styleRange(sheet, 'B7:E12', styles.infoTable);
    this.styleRange(sheet, 'B15:E18', styles.infoTable);
    this.styleRange(sheet, 'B21:E26', styles.infoTable);
    this.styleRange(sheet, 'B29:E30', styles.infoTable);
    this.styleRange(sheet, 'C7:E12', styles.inputFill);
    this.styleRange(sheet, 'C15:E18', styles.inputFill);
    this.styleRange(sheet, 'C21:E26', styles.inputFill);
    this.styleRange(sheet, 'C29:E30', styles.inputFill);

    this.xlsx.utils.book_append_sheet(workbook, sheet, sheetName);
  }

  private appendStyledStageSheet(workbook: any, detail: any, stage: 'STAGE_1' | 'STAGE_2', sheetName: string): void {
    const visibleClos = detail.clos.filter((clo: any) => this.getStageWeight(clo, stage) > 0);
    const totalRow = 11 + visibleClos.length;
    const lastRow = stage === 'STAGE_1' ? totalRow + 5 : totalRow + 7;
    const rows = this.createMatrix(lastRow, 11);
    const put = (row: number, col: number, value: any) => rows[row - 1][col - 1] = value;
    const student = detail.student;
    const stageWeight = stage === 'STAGE_1' ? detail.stage1Weight : detail.stage2Weight;

    put(2, 2, stage === 'STAGE_1' ? 'CHẶNG 1 - ĐÁNH GIÁ TỔNG KẾT GIỮA KỲ (Tuần 4)' : 'CHẶNG 2 - ĐÁNH GIÁ TỔNG KẾT CUỐI KỲ (Tuần 8)');
    put(4, 2, `Trọng số chặng ${stage === 'STAGE_1' ? '1' : '2'}: ${stageWeight}% tổng điểm học phần`);
    put(4, 7, stage === 'STAGE_1' ? 'Người đánh giá: GVHD + DVHD' : 'Người đánh giá: Tổ đánh giá TTTN');
    put(6, 2, 'Họ tên sinh viên:'); put(6, 3, student.name);
    put(6, 7, 'Mã số sinh viên:'); put(6, 8, student.mssv);
    put(7, 2, 'GVHD:'); put(7, 3, student.gvhdName);
    put(7, 7, 'DVHD:'); put(7, 8, student.companyName);
    put(9, 2, 'STT'); put(9, 3, 'CLO'); put(9, 4, 'Mô tả năng lực'); put(9, 5, 'Đánh giá (Thang điểm 10)');
    put(10, 5, 'Điểm DVHD'); put(10, 6, 'Điểm GVHD'); put(10, 7, 'TS DVHD (%)'); put(10, 8, 'TS GVHD (%)');
    put(9, 9, stage === 'STAGE_1' ? 'Điểm TB\nChặng 1' : 'Điểm TB\nChặng 2'); put(9, 10, 'Mức đạt'); put(9, 11, 'Ghi chú / Nhận xét');

    visibleClos.forEach((clo: any, index: number) => {
      const row = 11 + index;
      const stageData = this.getStageData(detail, clo, stage);
      put(row, 2, index + 1);
      put(row, 3, clo.clo_code);
      put(row, 4, clo.description || '');
      put(row, 5, this.formatExportScore(stageData.companyScore, this.toNumber(clo.company_beta, 0)));
      put(row, 6, this.formatExportScore(stageData.gvhdScore, this.toNumber(clo.gvhd_beta, 0)));
      put(row, 7, this.toPercentFraction(this.toNumber(clo.company_beta, 0)));
      put(row, 8, this.toPercentFraction(this.toNumber(clo.gvhd_beta, 0)));
      put(row, 9, this.formatExportScore(stageData.stageAverage, 100));
      put(row, 10, this.getScoreLevelLabel(stageData.stageAverage));
      put(row, 11, stageData.comments);
    });

    const stageScores = visibleClos
      .map((clo: any) => this.getStageData(detail, clo, stage).stageAverage)
      .filter((score: number | null): score is number => score !== null);
    const average = stageScores.length ? this.roundScore(stageScores.reduce((sum: number, score: number) => sum + score, 0) / stageScores.length) : null;
    put(totalRow, 2, stage === 'STAGE_1' ? 'ĐIỂM TRUNG BÌNH CHẶNG 1 (chưa có trọng số HP)' : 'ĐIỂM TRUNG BÌNH CHẶNG 2 (chưa có trọng số HP)');
    put(totalRow, 9, this.formatExportScore(average, 100));

    if (stage === 'STAGE_1') {
      put(totalRow + 2, 2, 'Ngày đánh giá: ___/___/20___');
      put(totalRow + 2, 5, 'Chữ ký GVHD');
      put(totalRow + 2, 8, 'Chữ ký Cán bộ DVHD');
      put(totalRow + 5, 5, '(Ký và ghi rõ họ tên)');
      put(totalRow + 5, 8, '(Ký, ghi rõ họ tên, đóng dấu)');
    } else {
      put(totalRow + 2, 2, 'THÀNH VIÊN TỔ ĐÁNH GIÁ (tối thiểu 03 người - số lẻ)');
      put(totalRow + 3, 2, 'STT'); put(totalRow + 3, 3, 'Họ và tên'); put(totalRow + 3, 4, 'Đơn vị công tác'); put(totalRow + 3, 5, 'Vai trò'); put(totalRow + 3, 6, 'Chữ ký');
      put(totalRow + 4, 2, 1); put(totalRow + 4, 5, 'GVHD');
      put(totalRow + 5, 2, 2); put(totalRow + 5, 5, 'Giảng viên đánh giá');
      put(totalRow + 6, 2, 3); put(totalRow + 6, 5, 'Đại diện DVHD');
    }

    const sheet = this.xlsx.utils.aoa_to_sheet(rows);
    sheet['!cols'] = [{ wch: 3 }, { wch: 7 }, { wch: 10 }, { wch: 34 }, { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 14 }, { wch: 12 }, { wch: 34 }];
    sheet['!rows'] = Array.from({ length: lastRow }, (_, index) => ({ hpt: index >= 10 && index < totalRow - 1 ? 36 : 22 }));
    this.addMerges(sheet, ['B2:K3', 'B4:K4', 'C6:E6', 'H6:J6', 'C7:E7', 'H7:J7', 'B9:B10', 'C9:C10', 'D9:D10', 'E9:H9', 'I9:I10', 'J9:J10', 'K9:K10', `B${totalRow}:H${totalRow}`, `J${totalRow}:K${totalRow}`]);
    if (stage === 'STAGE_1') {
      this.addMerges(sheet, [`B${totalRow + 2}:D${totalRow + 2}`, `E${totalRow + 2}:G${totalRow + 2}`, `H${totalRow + 2}:K${totalRow + 2}`, `E${totalRow + 5}:G${totalRow + 5}`, `H${totalRow + 5}:K${totalRow + 5}`]);
    } else {
      this.addMerges(sheet, [`B${totalRow + 2}:K${totalRow + 2}`]);
    }

    const styles = this.excelStyles();
    this.styleRange(sheet, 'B2:K3', styles.title);
    this.styleRange(sheet, 'B4:K4', styles.subtitle);
    this.styleRange(sheet, 'B6:J7', styles.infoTable);
    this.styleRange(sheet, 'C6:E7', styles.inputFill);
    this.styleRange(sheet, 'H6:J7', styles.inputFill);
    this.styleRange(sheet, 'B9:D10', styles.headerPurple);
    this.styleRange(sheet, 'E9:H10', styles.headerPurple);
    this.styleRange(sheet, 'I9:K10', styles.headerPurple);
    this.styleRange(sheet, `B11:K${totalRow - 1}`, styles.dataTable);
    this.styleRange(sheet, `E11:H${totalRow - 1}`, styles.inputFill);
    this.styleRange(sheet, `B${totalRow}:K${totalRow}`, styles.totalRow);
    this.styleRange(sheet, `I${totalRow}:I${totalRow}`, styles.totalValue);
    this.styleRange(sheet, `G11:H${totalRow - 1}`, styles.percent);
    this.styleRange(sheet, `B${totalRow + 2}:K${lastRow}`, styles.signature);
    this.xlsx.utils.book_append_sheet(workbook, sheet, sheetName);
  }

  private appendStyledSummarySheet(workbook: any, detail: any, sheetName: string): void {
    const clos = [...detail.clos].sort((a: any, b: any) => String(a.clo_code).localeCompare(String(b.clo_code)));
    const firstDataRow = 11;
    const totalRow = firstDataRow + clos.length;
    const lastRow = totalRow;
    const rows = this.createMatrix(lastRow, 12);
    const put = (row: number, col: number, value: any) => rows[row - 1][col - 1] = value;
    const student = detail.student;

    put(2, 2, 'BẢNG TỔNG HỢP ĐIỂM CHUẨN ĐẦU RA & ĐIỂM HỌC PHẦN');
    put(4, 2, `Tự động tổng hợp từ Chặng 1 (${detail.stage1Weight}%) và Chặng 2 (${detail.stage2Weight}%) - QĐ TTTN HUCE 2026`);
    put(6, 2, 'Họ tên sinh viên:'); put(6, 3, student.name);
    put(6, 7, 'Mã số sinh viên:'); put(6, 8, student.mssv);
    put(7, 2, 'GVHD:'); put(7, 3, student.gvhdName);
    put(7, 7, 'DVHD:'); put(7, 8, student.companyName);
    put(9, 2, 'STT'); put(9, 3, 'CLO'); put(9, 4, 'Mô tả năng lực'); put(9, 5, 'Trọng số HP\n(alpha_i)');
    put(9, 6, `Điểm Chặng 1 (${detail.stage1Weight}%)`); put(10, 6, 'TB C1'); put(10, 7, 'W1');
    put(9, 8, `Điểm Chặng 2 (${detail.stage2Weight}%)`); put(10, 8, 'TB C2'); put(10, 9, 'W2');
    put(9, 10, 'Điểm CLOi'); put(9, 11, 'Mức đạt'); put(9, 12, 'Đóng góp\n(CLOi*ai)');

    const contributions: number[] = [];
    clos.forEach((clo: any, index: number) => {
      const row = firstDataRow + index;
      const stage1 = this.getStageData(detail, clo, 'STAGE_1').stageAverage;
      const stage2 = this.getStageData(detail, clo, 'STAGE_2').stageAverage;
      const w1 = this.toPercentFraction(this.toNumber(clo.stage1_weight, detail.stage1Weight));
      const w2 = this.toPercentFraction(this.toNumber(clo.stage2_weight, detail.stage2Weight));
      const alpha = this.toPercentFraction(this.toNumber(clo.alpha_weight, 0));
      const activeWeight = (stage1 !== null ? w1 : 0) + (stage2 !== null ? w2 : 0);
      const cloScore = activeWeight > 0 ? this.roundScore(((stage1 || 0) * (stage1 !== null ? w1 : 0) + (stage2 || 0) * (stage2 !== null ? w2 : 0)) / activeWeight) : null;
      const contribution = cloScore !== null ? this.roundScoreTo(cloScore * alpha, 3) : null;
      if (contribution !== null) contributions.push(contribution);

      put(row, 2, index + 1);
      put(row, 3, clo.clo_code);
      put(row, 4, clo.description || '');
      put(row, 5, alpha);
      put(row, 6, this.formatStageScoreForSummary(stage1, w1));
      put(row, 7, w1);
      put(row, 8, this.formatStageScoreForSummary(stage2, w2));
      put(row, 9, w2);
      put(row, 10, this.formatExportScore(cloScore, 100));
      put(row, 11, this.getScoreLevelLabel(cloScore));
      put(row, 12, contribution ?? 'N/A');
    });

    const hpScore = contributions.length ? this.roundScore(contributions.reduce((sum, score) => sum + score, 0)) : null;
    put(totalRow, 2, 'ĐIỂM HỌC PHẦN (HP = Sum CLOi * alpha_i)');
    put(totalRow, 10, this.formatExportScore(hpScore, 100));

    const sheet = this.xlsx.utils.aoa_to_sheet(rows);
    sheet['!cols'] = [{ wch: 3 }, { wch: 7 }, { wch: 10 }, { wch: 32 }, { wch: 13 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
    sheet['!rows'] = Array.from({ length: lastRow }, (_, index) => ({ hpt: index >= 10 && index < totalRow - 1 ? 36 : 22 }));
    this.addMerges(sheet, ['B2:L3', 'B4:L4', 'C6:E6', 'H6:J6', 'C7:E7', 'H7:J7', 'B9:B10', 'C9:C10', 'D9:D10', 'E9:E10', 'F9:G9', 'H9:I9', 'J9:J10', 'K9:K10', 'L9:L10', `B${totalRow}:I${totalRow}`, `K${totalRow}:L${totalRow}`]);

    const styles = this.excelStyles();
    this.styleRange(sheet, 'B2:L3', styles.title);
    this.styleRange(sheet, 'B4:L4', styles.subtitle);
    this.styleRange(sheet, 'B6:J7', styles.infoTable);
    this.styleRange(sheet, 'C6:E7', styles.inputFill);
    this.styleRange(sheet, 'H6:J7', styles.inputFill);
    this.styleRange(sheet, 'B9:E10', styles.headerPurple);
    this.styleRange(sheet, 'F9:G10', styles.headerGreen);
    this.styleRange(sheet, 'H9:I10', styles.headerRed);
    this.styleRange(sheet, 'J9:L10', styles.headerPurple);
    this.styleRange(sheet, `B${firstDataRow}:L${totalRow - 1}`, styles.summaryData);
    this.styleRange(sheet, `F${firstDataRow}:G${totalRow - 1}`, styles.stage1Fill);
    this.styleRange(sheet, `H${firstDataRow}:I${totalRow - 1}`, styles.stage2Fill);
    this.styleRange(sheet, `E${firstDataRow}:E${totalRow - 1}`, styles.percent);
    this.styleRange(sheet, `G${firstDataRow}:G${totalRow - 1}`, styles.percent);
    this.styleRange(sheet, `I${firstDataRow}:I${totalRow - 1}`, styles.percent);
    this.styleRange(sheet, `J${firstDataRow}:L${totalRow - 1}`, styles.summaryResultFill);
    this.styleRange(sheet, `B${totalRow}:L${totalRow}`, styles.totalRow);
    this.styleRange(sheet, `J${totalRow}:J${totalRow}`, styles.bigTotal);
    this.xlsx.utils.book_append_sheet(workbook, sheet, sheetName);
  }

  private appendStyledRubricSheet(workbook: any, detail: any, sheetName: string): void {
    const rows = this.createMatrix(30, 9);
    const put = (row: number, col: number, value: any) => rows[row - 1][col - 1] = value;
    const clos = [...detail.clos].sort((a: any, b: any) => String(a.clo_code).localeCompare(String(b.clo_code)));

    put(2, 2, 'RUBRIC ĐÁNH GIÁ CHUẨN ĐẦU RA (CLO) - HỌC PHẦN TTTN');
    put(4, 2, 'Nguồn: Phụ lục II-A - Quy định Tổ chức và Đánh giá TTTN - HUCE 2026');
    ['CLO', 'Tên CLO', 'SO liên kết', 'Mức 0 (<4)', 'Mức 1 (4-5.4)', 'Mức 2 (5.5-6.9)', 'Mức 3 (7-8.4)', 'Mức 4 (>=8.5)'].forEach((value, index) => put(6, index + 2, value));
    clos.slice(0, 7).forEach((clo: any, index: number) => {
      const row = 7 + index;
      put(row, 2, clo.clo_code);
      put(row, 3, this.getShortCloName(clo.description));
      put(row, 4, '');
      const rubricDescriptions = this.getRubricDescriptions(clo);
      rubricDescriptions.forEach((value, rubricIndex) => put(row, 5 + rubricIndex, value));
    });

    put(15, 2, 'THANG ĐIỂM QUY ĐỔI');
    put(16, 2, 'Mức 0'); put(16, 3, '0 - <4.0'); put(16, 4, 'Không đạt yêu cầu');
    put(17, 2, 'Mức 1'); put(17, 3, '4.0 - 5.4'); put(17, 4, 'Đạt một phần');
    put(18, 2, 'Mức 2'); put(18, 3, '5.5 - 6.9'); put(18, 4, 'Đạt yêu cầu');
    put(19, 2, 'Mức 3'); put(19, 3, '7.0 - 8.4'); put(19, 4, 'Đạt tốt');
    put(20, 2, 'Mức 4'); put(20, 3, '>=8.5'); put(20, 4, 'Xuất sắc');
    put(22, 2, 'BẢNG TRỌNG SỐ CLO THEO ĐÓNG GÓP VÀO ĐIỂM HỌC PHẦN (alpha_i)');
    put(23, 2, 'CLO'); put(23, 3, 'Trọng số HP (alpha_i)'); put(23, 4, 'TS ĐVHD'); put(23, 5, 'TS GVHD'); put(23, 6, 'Ghi chú');
    clos.slice(0, 7).forEach((clo: any, index: number) => {
      const row = 24 + index;
      put(row, 2, clo.clo_code);
      put(row, 3, this.toPercentFraction(this.toNumber(clo.alpha_weight, 0)));
      put(row, 4, this.toPercentFraction(this.toNumber(clo.company_beta, 0)));
      put(row, 5, this.toPercentFraction(this.toNumber(clo.gvhd_beta, 0)));
      put(row, 6, this.getRubricNote(clo));
    });

    const sheet = this.xlsx.utils.aoa_to_sheet(rows);
    sheet['!cols'] = [{ wch: 3 }, { wch: 8 }, { wch: 18 }, { wch: 13 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
    sheet['!rows'] = Array.from({ length: 30 }, (_, index) => ({ hpt: index >= 6 && index <= 12 ? 44 : 22 }));
    this.addMerges(sheet, ['B2:I3', 'B4:I4', 'B15:I15', 'D16:I16', 'D17:I17', 'D18:I18', 'D19:I19', 'D20:I20', 'B22:I22']);
    const styles = this.excelStyles();
    this.styleRange(sheet, 'B2:I3', styles.title);
    this.styleRange(sheet, 'B4:I4', styles.subtitleBlue);
    this.styleRange(sheet, 'B6:I6', styles.headerBlue);
    this.styleRange(sheet, 'B7:I13', styles.rubricTable);
    this.styleRange(sheet, 'E7:E13', styles.level0Fill);
    this.styleRange(sheet, 'F7:F13', styles.level1Fill);
    this.styleRange(sheet, 'G7:G13', styles.level2Fill);
    this.styleRange(sheet, 'H7:H13', styles.level3Fill);
    this.styleRange(sheet, 'I7:I13', styles.level4Fill);
    this.styleRange(sheet, 'B15:I15', styles.sectionBlue);
    this.styleRange(sheet, 'B16:I20', styles.rubricScale);
    this.styleRange(sheet, 'B22:I22', styles.headerPurple);
    this.styleRange(sheet, 'B23:F30', styles.dataTable);
    this.styleRange(sheet, 'B23:F23', styles.headerPurple);
    this.styleRange(sheet, 'C24:E30', styles.percent);
    this.xlsx.utils.book_append_sheet(workbook, sheet, sheetName);
  }

  private buildStudentInfoRows(details: any[]): any[][] {
    return [
      ['THÔNG TIN SINH VIÊN'],
      ['Mã SV', 'Họ và tên', 'Lớp', 'Đơn vị thực tập', 'Đợt thực tập', 'Kết quả'],
      ...details.map(detail => [
        detail.student.mssv,
        detail.student.name,
        detail.student.class,
        detail.student.companyName,
        this.getCampaignName(detail.student.campaignId),
        detail.student.status
      ])
    ];
  }

  private buildStageRows(details: any[], stage: 'STAGE_1' | 'STAGE_2'): any[][] {
    const title = stage === 'STAGE_1' ? 'CHẶNG 1 - ĐÁNH GIÁ TỔNG KẾT GIỮA KỲ' : 'CHẶNG 2 - ĐÁNH GIÁ TỔNG KẾT CUỐI KỲ';
    const averageLabel = stage === 'STAGE_1' ? 'Điểm TB Chặng 1' : 'Điểm TB Chặng 2';
    const rows: any[][] = [
      [title],
      ['Mã SV', 'Họ và tên', 'STT', 'CLO', 'Mô tả năng lực', 'Điểm ĐVHD', 'Điểm GVHD', 'TS ĐVHD (%)', 'TS GVHD (%)', averageLabel, 'Mức đạt', 'Ghi chú/Nhận xét']
    ];

    details.forEach(detail => {
      const stageEvaluations = detail.evaluations.filter((evaluation: any) => evaluation.stage === stage);
      const visibleClos = detail.clos.filter((clo: any) => this.getStageWeight(clo, stage) > 0);

      visibleClos.forEach((clo: any, index: number) => {
        const companyScore = this.getAverageScoreForClo(stageEvaluations, clo.clo_code, ['COMPANY_SUPERVISOR', 'COMPANY']);
        const gvhdScore = this.getAverageScoreForClo(stageEvaluations, clo.clo_code, ['GVHD']);
        const stageAverage = this.calculateStageAverage(companyScore, gvhdScore, clo);
        const comments = [
          this.getCommentsForClo(stageEvaluations, clo.clo_code, ['COMPANY_SUPERVISOR', 'COMPANY']),
          this.getCommentsForClo(stageEvaluations, clo.clo_code, ['GVHD'])
        ].filter(Boolean).join(' | ');

        rows.push([
          detail.student.mssv,
          detail.student.name,
          index + 1,
          clo.clo_code,
          clo.description || '',
          this.formatExportScore(companyScore, this.toNumber(clo.company_beta, 0)),
          this.formatExportScore(gvhdScore, this.toNumber(clo.gvhd_beta, 0)),
          this.toNumber(clo.company_beta, 0),
          this.toNumber(clo.gvhd_beta, 0),
          this.formatExportScore(stageAverage, 100),
          this.getScoreLevelLabel(stageAverage),
          comments
        ]);
      });
    });

    return rows;
  }

  private buildSummaryRows(details: any[]): any[][] {
    return [
      ['TỔNG HỢP ĐIỂM'],
      ['Mã SV', 'Họ và tên', 'Lớp', 'Đơn vị thực tập', 'Trọng số Chặng 1 (%)', 'Điểm Chặng 1', 'Trọng số Chặng 2 (%)', 'Điểm Chặng 2', 'Tổng điểm HP', 'Kết quả'],
      ...details.map(detail => [
        detail.student.mssv,
        detail.student.name,
        detail.student.class,
        detail.student.companyName,
        detail.stage1Weight,
        this.formatExportScore(detail.student.stage1Score, 100),
        detail.stage2Weight,
        this.formatExportScore(detail.student.stage2Score, 100),
        this.formatExportScore(detail.student.totalScore, 100),
        detail.student.status
      ])
    ];
  }

  private buildRubricRows(details: any[]): any[][] {
    const rows: any[][] = [
      ['RUBRIC CLO'],
      ['Mã SV', 'CLO', 'Mô tả năng lực', 'Alpha HP (%)', 'TS Chặng 1 (%)', 'TS Chặng 2 (%)', 'TS ĐVHD (%)', 'TS GVHD (%)', 'Mức điểm/Rubric']
    ];

    details.forEach(detail => {
      detail.clos.forEach((clo: any) => {
        const rubrics = (clo.rubrics || [])
          .map((rubric: any) => `${rubric.score_level}: ${rubric.description || ''}`)
          .join(' ; ');

        rows.push([
          detail.student.mssv,
          clo.clo_code,
          clo.description || '',
          this.toNumber(clo.alpha_weight, 0),
          this.toNumber(clo.stage1_weight, detail.stage1Weight),
          this.toNumber(clo.stage2_weight, detail.stage2Weight),
          this.toNumber(clo.company_beta, 0),
          this.toNumber(clo.gvhd_beta, 0),
          rubrics
        ]);
      });
    });

    return rows;
  }

  private appendSheet(workbook: any, sheetName: string, rows: any[][], widths: number[]): void {
    const worksheet = this.xlsx.utils.aoa_to_sheet(rows);
    worksheet['!cols'] = widths.map(width => ({ wch: width }));
    this.xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  private getAverageScoreForClo(evaluations: any[], cloCode: string, evaluatorTypes: string[]): number | null {
    const scores = evaluations
      .filter((evaluation: any) => evaluatorTypes.includes(evaluation.evaluator_type))
      .flatMap((evaluation: any) => evaluation.scores || [])
      .filter((score: any) => score.clo_code === cloCode)
      .map((score: any) => this.toNullableScore(score.score_level))
      .filter((score: number | null): score is number => score !== null);

    if (scores.length === 0) return null;
    return this.roundScore(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private getCommentsForClo(evaluations: any[], cloCode: string, evaluatorTypes: string[]): string {
    return evaluations
      .filter((evaluation: any) => evaluatorTypes.includes(evaluation.evaluator_type))
      .flatMap((evaluation: any) => evaluation.scores || [])
      .filter((score: any) => score.clo_code === cloCode)
      .map((score: any) => score.comment || score.short_comment || '')
      .filter(Boolean)
      .join('; ');
  }

  private calculateStageAverage(companyScore: number | null, gvhdScore: number | null, clo: any): number | null {
    const companyBeta = this.toNumber(clo.company_beta, 0);
    const gvhdBeta = this.toNumber(clo.gvhd_beta, 0);
    const companyRequired = companyBeta > 0;
    const gvhdRequired = gvhdBeta > 0;

    if (companyRequired && companyScore === null) return null;
    if (gvhdRequired && gvhdScore === null) return null;

    const totalWeight = (companyRequired ? companyBeta : 0) + (gvhdRequired ? gvhdBeta : 0);
    if (totalWeight <= 0) return null;

    const weightedScore =
      (companyRequired ? (companyScore || 0) * companyBeta : 0) +
      (gvhdRequired ? (gvhdScore || 0) * gvhdBeta : 0);

    return this.roundScore(weightedScore / totalWeight);
  }

  private getStageWeight(clo: any, stage: 'STAGE_1' | 'STAGE_2'): number {
    return stage === 'STAGE_1' ? this.toNumber(clo.stage1_weight, 0) : this.toNumber(clo.stage2_weight, 0);
  }

  private getScoreLevelLabel(score: number | null): string {
    if (score === null) return 'Chưa có';
    if (score < 4) return 'Mức 0';
    if (score < 5.5) return 'Mức 1';
    if (score < 7) return 'Mức 2';
    if (score < 8.5) return 'Mức 3';
    return 'Mức 4';
  }

  private formatExportScore(score: number | null, weight: number): string | number {
    if (weight <= 0) return 'N/A';
    return score === null ? 'Chưa có' : this.roundScore(score);
  }

  private getCampaignName(campaignId: number): string {
    const campaign = this.campaigns.find(item => Number(item.id) === Number(campaignId));
    if (!campaign) return String(campaignId);
    const semester = campaign.semester ? `HK${campaign.semester}` : '';
    const year = campaign.academic_year || '';
    return [campaign.name, semester, year].filter(Boolean).join(' - ');
  }

  private unwrapResponse(response: any): any {
    return response?.data || response?.payload || response || {};
  }

  private unwrapArray(response: any): any[] {
    const data = response?.data || response?.payload || response;
    return Array.isArray(data) ? data : [];
  }

  private toNullableScore(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? null : this.roundScore(Math.min(10, Math.max(0, numberValue)));
  }

  private toNumber(value: any, fallback: number): number {
    if (value === null || value === undefined || value === '') return fallback;
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? fallback : numberValue;
  }

  private roundScore(value: number): number {
    return Math.round(value * 10) / 10;
  }

  private roundScoreTo(value: number, digits: number): number {
    const factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
  }

  private getStageData(detail: any, clo: any, stage: 'STAGE_1' | 'STAGE_2'): any {
    const stageEvaluations = detail.evaluations.filter((evaluation: any) => evaluation.stage === stage);
    const companyScore = this.getAverageScoreForClo(stageEvaluations, clo.clo_code, ['COMPANY_SUPERVISOR', 'COMPANY']);
    const gvhdScore = this.getAverageScoreForClo(stageEvaluations, clo.clo_code, ['GVHD']);
    const stageAverage = this.calculateStageAverage(companyScore, gvhdScore, clo);
    const comments = [
      this.getCommentsForClo(stageEvaluations, clo.clo_code, ['COMPANY_SUPERVISOR', 'COMPANY']),
      this.getCommentsForClo(stageEvaluations, clo.clo_code, ['GVHD'])
    ].filter(Boolean).join(' | ');

    return { companyScore, gvhdScore, stageAverage, comments };
  }

  private toPercentFraction(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return value > 1 ? value / 100 : value;
  }

  private formatStageScoreForSummary(score: number | null, weight: number): string | number {
    if (weight <= 0) return 'N/A';
    return score === null ? 'N/A' : this.roundScore(score);
  }

  private splitFullName(fullName: string | undefined | null): { lastName: string; firstName: string } {
    const normalized = (fullName || '').trim().replace(/\s+/g, ' ');
    if (!normalized) return { lastName: '', firstName: '' };
    const lastSpace = normalized.lastIndexOf(' ');
    if (lastSpace < 0) return { lastName: '', firstName: normalized };
    return {
      lastName: normalized.slice(0, lastSpace).trim(),
      firstName: normalized.slice(lastSpace + 1).trim()
    };
  }

  private getFinalRankLabel(score: number | null): string {
    if (score === null) return 'Chưa có';
    if (score < 4) return 'Mức 0 - Không đạt';
    if (score < 5.5) return 'Mức 1 - Đạt một phần';
    if (score < 7) return 'Mức 2 - Đạt yêu cầu';
    if (score < 8.5) return 'Mức 3 - Đạt tốt';
    return 'Mức 4 - Xuất sắc';
  }

  private getConditionResult(clos: any[], cloCode: string, detail: any): string {
    const clo = clos.find(item => item.clo_code === cloCode);
    if (!clo) return 'CHƯA ĐẠT';
    const stage1 = this.getStageData(detail, clo, 'STAGE_1').stageAverage;
    const stage2 = this.getStageData(detail, clo, 'STAGE_2').stageAverage;
    const w1 = this.toPercentFraction(this.toNumber(clo.stage1_weight, detail.stage1Weight));
    const w2 = this.toPercentFraction(this.toNumber(clo.stage2_weight, detail.stage2Weight));
    const activeWeight = (stage1 !== null ? w1 : 0) + (stage2 !== null ? w2 : 0);
    const score = activeWeight > 0 ? ((stage1 || 0) * (stage1 !== null ? w1 : 0) + (stage2 || 0) * (stage2 !== null ? w2 : 0)) / activeWeight : null;
    return score !== null && score >= 4 ? 'ĐẠT' : 'CHƯA ĐẠT';
  }

  private getShortCloName(description: string): string {
    if (!description) return '';
    return description.split(/[.&-]/)[0].trim() || description;
  }

  private getRubricDescriptions(clo: any): string[] {
    const rubrics = [...(clo.rubrics || [])].sort((a: any, b: any) => Number(a.score_level) - Number(b.score_level));
    const descriptions = rubrics.map((rubric: any) => rubric.description || '');
    while (descriptions.length < 5) descriptions.push('');
    return descriptions.slice(0, 5);
  }

  private getRubricNote(clo: any): string {
    if (String(clo.clo_code).toUpperCase() === 'CLO7') return 'Chỉ GVHD chấm';
    if (this.toNumber(clo.company_beta, 0) > this.toNumber(clo.gvhd_beta, 0)) return 'DVHD chấm chủ yếu';
    return '';
  }

  private createMatrix(rowCount: number, columnCount: number): any[][] {
    return Array.from({ length: rowCount }, () => Array(columnCount).fill(''));
  }

  private addMerges(sheet: any, ranges: string[]): void {
    const existing = sheet['!merges'] || [];
    sheet['!merges'] = existing.concat(ranges.map(range => this.xlsx.utils.decode_range(range)));
  }

  private styleRange(sheet: any, rangeRef: string, style: any): void {
    const range = this.xlsx.utils.decode_range(rangeRef);
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const address = this.xlsx.utils.encode_cell({ r: row, c: col });
        if (!sheet[address]) sheet[address] = { t: 's', v: '' };
        sheet[address].s = { ...(sheet[address].s || {}), ...style };
      }
    }
  }

  private safeSheetName(name: string): string {
    return name.replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31) || 'Sheet';
  }

  private excelStyles(): any {
    const border = {
      top: { style: 'thin', color: { rgb: '9DC3E6' } },
      bottom: { style: 'thin', color: { rgb: '9DC3E6' } },
      left: { style: 'thin', color: { rgb: '9DC3E6' } },
      right: { style: 'thin', color: { rgb: '9DC3E6' } }
    };
    const centered = { horizontal: 'center', vertical: 'center', wrapText: true };
    const left = { horizontal: 'left', vertical: 'center', wrapText: true };

    return {
      title: { font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 }, fill: { fgColor: { rgb: '4B1F5E' } }, alignment: centered, border },
      subtitle: { font: { italic: true, color: { rgb: 'FFFFFF' }, sz: 10 }, fill: { fgColor: { rgb: '4B1F5E' } }, alignment: centered, border },
      subtitleBlue: { font: { italic: true, color: { rgb: 'FFFFFF' }, sz: 10 }, fill: { fgColor: { rgb: '2F5597' } }, alignment: centered, border },
      sectionBlue: { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2F5597' } }, alignment: left, border },
      headerBlue: { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1F4E79' } }, alignment: centered, border },
      headerPurple: { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '4B1F5E' } }, alignment: centered, border },
      headerGreen: { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '285A25' } }, alignment: centered, border },
      headerRed: { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '8E2E2E' } }, alignment: centered, border },
      infoTable: { font: { color: { rgb: '000000' } }, alignment: left, border },
      inputFill: { fill: { fgColor: { rgb: 'FFF2CC' } }, alignment: left, border },
      dataTable: { alignment: centered, border },
      summaryData: { fill: { fgColor: { rgb: 'E7D3F0' } }, alignment: centered, border },
      stage1Fill: { fill: { fgColor: { rgb: 'D9EAD3' } }, alignment: centered, border },
      stage2Fill: { fill: { fgColor: { rgb: 'FCE4D6' } }, alignment: centered, border },
      summaryResultFill: { fill: { fgColor: { rgb: 'E7D3F0' } }, font: { bold: true, color: { rgb: '4B1F5E' } }, alignment: centered, border },
      totalRow: { fill: { fgColor: { rgb: '4B1F5E' } }, font: { bold: true, color: { rgb: 'FFFFFF' } }, alignment: centered, border },
      totalValue: { fill: { fgColor: { rgb: '4B1F5E' } }, font: { bold: true, color: { rgb: 'FFFFFF' } }, alignment: centered, border },
      bigTotal: { fill: { fgColor: { rgb: '4B1F5E' } }, font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 16 }, alignment: centered, border },
      rankLabel: { fill: { fgColor: { rgb: '2F5597' } }, font: { bold: true, color: { rgb: 'FFFFFF' } }, alignment: centered, border },
      rankValue: { fill: { fgColor: { rgb: 'FFF2CC' } }, font: { bold: true, color: { rgb: '4B1F5E' } }, alignment: centered, border },
      conditionRows: { alignment: left, border },
      signature: { alignment: centered, border },
      rubricTable: { alignment: left, border },
      rubricScale: { alignment: left, border },
      level0Fill: { fill: { fgColor: { rgb: 'F2F2F2' } }, alignment: left, border },
      level1Fill: { fill: { fgColor: { rgb: 'F4CCCC' } }, alignment: left, border },
      level2Fill: { fill: { fgColor: { rgb: 'FFF2CC' } }, alignment: left, border },
      level3Fill: { fill: { fgColor: { rgb: 'D9EAD3' } }, alignment: left, border },
      level4Fill: { fill: { fgColor: { rgb: 'BDD7EE' } }, alignment: left, border },
      percent: { numFmt: '0%', alignment: centered, border }
    };
  }
}
