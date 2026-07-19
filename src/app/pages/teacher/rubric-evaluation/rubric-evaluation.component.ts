import { Component, OnInit } from '@angular/core';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { DepartmentCampaignService } from '../../../core/services/department-campaign.service';
import { EvaluationService, EvaluationRequest } from '../../../core/services/evaluation.service';
import { AuthService } from '../../../core/services/auth.service';
import { CampaignResponse, StudentCampaignResponse } from '../../../core/models/base.model';
import { ToastService } from '../../../core/services/toast.service';
import { CampaignService } from '../../../core/services/campaign.service';

interface RubricLevel {
  label: string;
  level: number;
  range: string;
  description: string;
}

interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  alphaWeight: number;
  stage1Weight: number;
  stage2Weight: number;
  gvhdBeta: number;
  companyBeta: number;
  levels: RubricLevel[];
  selectedScore?: number | null;
  comment?: string;
  gvhdScore?: number | null;
  companyScore?: number | null;
  gvhdComment?: string;
  companyComment?: string;
}

interface ScoreAccumulator {
  total: number;
  count: number;
  comments: string[];
}

interface SummaryCloRow {
  criterion: RubricCriterion;
  stage1Average: number | null;
  stage2Average: number | null;
  cloScore: number | null;
  contribution: number | null;
}

@Component({
  selector: 'app-rubric-evaluation',
  templateUrl: './rubric-evaluation.component.html',
  styleUrls: ['./rubric-evaluation.component.scss']
})
export class RubricEvaluationComponent implements OnInit {
  isLoading = true;
  isSaving = false;

  allStudents: StudentCampaignResponse[] = [];
  students: StudentCampaignResponse[] = [];
  campaigns: CampaignResponse[] = [];
  availableCampaigns: CampaignResponse[] = [];
  searchTerm = '';
  selectedGradingStatus = '';
  selectedCampaignId: number | null = null;
  selectedStudent: StudentCampaignResponse | null = null;

  criteria: RubricCriterion[] = [];
  existingEvaluation: any = null;
  generalComment = '';

  selectedStage: 'STAGE_1' | 'STAGE_2' = 'STAGE_1';
  activeTab: 'STAGE_1' | 'STAGE_2' | 'SUMMARY' = 'STAGE_1';
  finalResult: any = null;
  summaryEvaluations: any[] = [];
  isSummaryLoading = false;
  campaign: any = null;
  isCampaignActive = true;
  isStage1Open = false;
  isStage2Open = false;
  midtermStartDateStr = '';
  tttn06StartDateStr = '';
  departmentStage1Weight = 30;
  departmentStage2Weight = 70;

  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  paginatedStudents: StudentCampaignResponse[] = [];

  isCompanySupervisor = false;

  columns = [
    { key: 'STT', label: 'STT', width: '60px', align: 'center' },
    { key: 'student_code', label: 'Mã SV', width: '120px' },
    { key: 'full_name', label: 'Họ và tên' },
    { key: 'first_name', label: 'Tên', width: '110px' },
    { key: 'company', label: 'Đơn vị thực tập' },
    { key: 'gradingStatus', label: 'Trạng thái', width: '150px', align: 'center' },
    { key: 'actions', label: 'Thao tác', align: 'center', width: '150px' }
  ];

  readonly scoreBands = [
    { level: 0, label: 'Mức 0', range: '0 - dưới 4.0' },
    { level: 1, label: 'Mức 1', range: '4.0 - dưới 5.5' },
    { level: 2, label: 'Mức 2', range: '5.5 - dưới 7.0' },
    { level: 3, label: 'Mức 3', range: '7.0 - dưới 8.5' },
    { level: 4, label: 'Mức 4', range: '8.5 - 10.0' }
  ];

  constructor(
    private studentCampaignService: StudentCampaignService,
    private departmentCampaignService: DepartmentCampaignService,
    private evaluationService: EvaluationService,
    private authService: AuthService,
    private toastService: ToastService,
    private campaignService: CampaignService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.isCompanySupervisor = currentUser?.role === 'COMPANY_SUPERVISOR';
    this.loadCampaigns();
    this.loadEligibleStudents();
  }

  loadCampaigns(): void {
    this.campaignService.getCampaigns({ page: 1, limit: 100 }, 'ACTIVE').subscribe({
      next: (res) => {
        this.campaigns = res.data || [];
        this.refreshAvailableCampaigns();
        this.filterStudents();
      },
      error: () => {
        this.campaigns = [];
        this.refreshAvailableCampaigns();
        this.filterStudents();
      }
    });
  }

  loadEligibleStudents(): void {
    this.isLoading = true;
    const source$ = this.isCompanySupervisor
      ? this.studentCampaignService.getCompanyStudents()
      : this.studentCampaignService.getMyAssignedStudents();

    source$.subscribe({
      next: (res) => {
        const all = Array.isArray(res) ? res : (res.data || res.payload || []);
        this.allStudents = all
          .filter((s: any) => s.status !== 'SUSPENDED')
          .map((s: any) => ({ ...s, gradingStatus: 'Đang tải...' }))
          .sort((a: any, b: any) => this.compareStudentsByName(a, b));
        this.refreshAvailableCampaigns();
        this.filterStudents();
        this.isLoading = false;
        this.checkAllEvaluationsStatus();
      },
      error: () => {
        this.isLoading = false;
        this.toastService.error('Lỗi tải danh sách sinh viên.');
      }
    });
  }

  checkAllEvaluationsStatus(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || this.allStudents.length === 0) return;

    let completedCount = 0;

    this.allStudents.forEach(student => {
      this.evaluationService.findEvaluations(student.id).subscribe({
        next: (res) => {
          const evals = Array.isArray(res) ? res : (res.data || res.payload || []);
          (student as any).gradingStatus = this.resolveGradingStatus(evals, currentUser);
          completedCount++;
          completedCount === this.allStudents.length ? this.filterStudents() : this.paginate();
        },
        error: () => {
          (student as any).gradingStatus = 'Lỗi trạng thái';
          completedCount++;
          completedCount === this.allStudents.length ? this.filterStudents() : this.paginate();
        }
      });
    });
  }

  private resolveGradingStatus(evaluations: any[], currentUser: any): string {
    if (currentUser.role === 'COMPANY_SUPERVISOR') {
      const myCompanyEvals = evaluations.filter((evaluation: any) =>
        this.isCompanyEvaluation(evaluation) && evaluation.evaluator_id === currentUser.userId
      );
      const hasStage1 = myCompanyEvals.some((evaluation: any) => evaluation.stage === 'STAGE_1');
      const hasStage2 = myCompanyEvals.some((evaluation: any) => evaluation.stage === 'STAGE_2');
      if (hasStage1 && hasStage2) return 'Đã chấm';
      return myCompanyEvals.length > 0 ? 'Chưa chấm đủ' : 'Chưa chấm';
    }

    const myGvhdEvals = evaluations.filter((evaluation: any) =>
      evaluation.evaluator_type === 'GVHD' && evaluation.evaluator_id === currentUser.userId
    );
    const hasGvhdStage1 = myGvhdEvals.some((evaluation: any) => evaluation.stage === 'STAGE_1');
    const hasGvhdStage2 = myGvhdEvals.some((evaluation: any) => evaluation.stage === 'STAGE_2');
    const hasCompanyStage1 = evaluations.some((evaluation: any) =>
      evaluation.stage === 'STAGE_1' && this.isCompanyEvaluation(evaluation)
    );

    if (hasGvhdStage1 && hasCompanyStage1 && hasGvhdStage2) return 'Hoàn tất chấm điểm';
    if (!hasGvhdStage1 && !hasCompanyStage1 && !hasGvhdStage2) return 'Chưa chấm';
    if (!hasCompanyStage1 && (hasGvhdStage1 || hasGvhdStage2)) return 'DVHD chưa chấm';
    if (!hasGvhdStage1 && hasCompanyStage1 && !hasGvhdStage2) return 'GVHD chưa chấm';
    if (!hasGvhdStage1) return 'GVHD chưa chấm C1';
    if (!hasGvhdStage2) return 'GVHD chưa chấm C2';
    return 'Chưa chấm đủ';
  }

  filterStudents(): void {
    let result = [...this.allStudents];

    if (this.selectedCampaignId !== null) {
      const campaignId = Number(this.selectedCampaignId);
      result = result.filter(s => Number(s.campaign_id) === campaignId);
    } else if (this.campaigns.length > 0) {
      const activeCampaignIds = new Set(this.campaigns.map(c => Number(c.id)));
      result = result.filter(s => activeCampaignIds.has(Number(s.campaign_id)));
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(s =>
        (s.full_name && s.full_name.toLowerCase().includes(term)) ||
        (s.student_code && s.student_code.toLowerCase().includes(term)) ||
        (s.company_info?.company_name && s.company_info.company_name.toLowerCase().includes(term))
      );
    }

    if (this.selectedGradingStatus) {
      result = result.filter(s => (s as any).gradingStatus === this.selectedGradingStatus);
    }

    this.students = result;
    this.totalItems = result.length;

    const totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }

    this.paginate();
  }

  paginate(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedStudents = this.students.slice(startIndex, startIndex + this.pageSize);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.filterStudents();
  }

  private refreshAvailableCampaigns(): void {
    const assignedCampaignIds = new Set(
      this.allStudents
        .map(s => Number(s.campaign_id))
        .filter(id => Number.isFinite(id))
    );

    this.availableCampaigns = this.campaigns
      .filter(c => c.status === 'ACTIVE' && assignedCampaignIds.has(Number(c.id)))
      .sort((a, b) => {
        const aTime = a.start_date ? new Date(a.start_date).getTime() : 0;
        const bTime = b.start_date ? new Date(b.start_date).getTime() : 0;
        return bTime - aTime;
      });

    if (this.selectedCampaignId !== null && !assignedCampaignIds.has(Number(this.selectedCampaignId))) {
      this.selectedCampaignId = null;
      this.onFilterChange();
    }
  }

  private compareStudentsByName(a: StudentCampaignResponse, b: StudentCampaignResponse): number {
    const firstNameCompare = this.getStudentFirstName(a).localeCompare(this.getStudentFirstName(b), 'vi', { sensitivity: 'base' });
    if (firstNameCompare !== 0) return firstNameCompare;

    const lastNameCompare = this.getStudentLastName(a).localeCompare(this.getStudentLastName(b), 'vi', { sensitivity: 'base' });
    if (lastNameCompare !== 0) return lastNameCompare;

    return (a.student_code || '').localeCompare(b.student_code || '', 'vi', { numeric: true });
  }

  getStudentFirstName(student: StudentCampaignResponse): string {
    if (student.first_name) return student.first_name;
    const parts = (student.full_name || '').trim().split(/\s+/).filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1] : '';
  }

  private getStudentLastName(student: StudentCampaignResponse): string {
    if (student.last_name) return student.last_name;
    const parts = (student.full_name || '').trim().split(/\s+/).filter(Boolean);
    return parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.paginate();
  }

  selectStudent(student: StudentCampaignResponse): void {
    this.selectedStudent = student;
    this.criteria = [];
    this.existingEvaluation = null;
    this.generalComment = '';
    this.campaign = null;
    this.isStage1Open = false;
    this.isStage2Open = false;
    this.selectedStage = 'STAGE_1';
    this.activeTab = 'STAGE_1';
    this.finalResult = null;
    this.loadCampaignInfo(student.campaign_id);
    this.loadRubricConfig();
    this.loadFinalResult();
  }

  loadCampaignInfo(campaignId: number): void {
    this.campaignService.getById(campaignId).subscribe({
      next: (camp: any) => {
        const campaign = camp.data || camp.payload || camp;
        this.campaign = campaign;
        this.isCampaignActive = campaign.status === 'ACTIVE';
        const now = new Date();

        const groupConfig = this.selectedStudent?.group_config || null;
        const activeSource = groupConfig || campaign;

        const startDate = activeSource.start_date || campaign.start_date;
        const endDate = activeSource.end_date || campaign.end_date;
        const midtermStart = activeSource.midterm_start_date
          ? new Date(activeSource.midterm_start_date)
          : new Date(new Date(startDate).getTime() + 21 * 24 * 60 * 60 * 1000);
        this.midtermStartDateStr = midtermStart.toLocaleDateString('vi-VN');
        this.isStage1Open = now >= midtermStart;

        const tttn06Start = activeSource.tttn06_start_date
          ? new Date(activeSource.tttn06_start_date)
          : new Date(new Date(endDate).getTime() - 7 * 24 * 60 * 60 * 1000);
        this.tttn06StartDateStr = tttn06Start.toLocaleDateString('vi-VN');
        this.isStage2Open = now >= tttn06Start;
      },
      error: () => {
        this.toastService.error('Không thể tải thông tin đợt thực tập.');
      }
    });
  }

  onStageChange(stage: 'STAGE_1' | 'STAGE_2'): void {
    this.selectedStage = stage;
    this.activeTab = stage;
    this.existingEvaluation = null;
    this.generalComment = '';
    this.resetCriteriaEvaluationState();
    this.checkExistingEvaluation();
  }

  onSummaryTab(): void {
    this.activeTab = 'SUMMARY';
    this.loadFinalResult();
    this.loadSummaryEvaluations();
  }

  loadRubricConfig(): void {
    if (!this.selectedStudent) return;
    this.isLoading = true;

    this.departmentCampaignService.findOrCreate(this.selectedStudent.campaign_id, this.selectedStudent.department_id)
      .subscribe({
        next: (deptRes) => {
          const deptCampaign = deptRes.id !== undefined ? deptRes : (deptRes.data || deptRes.payload || {});
          const deptCampId = deptCampaign.id;
          this.departmentStage1Weight = this.toNumber(deptCampaign.stage1_weight, 30);
          this.departmentStage2Weight = this.toNumber(deptCampaign.stage2_weight, 70);

          this.departmentCampaignService.getCloConfigs(deptCampId).subscribe({
            next: (cloRes) => {
              this.buildCriteriaFromApi(Array.isArray(cloRes) ? cloRes : (cloRes.data || cloRes.payload || []));
              this.checkExistingEvaluation();
            },
            error: () => this.handleError('Không thể tải cấu hình Rubric.')
          });
        },
        error: () => this.handleError('Không thể lấy thông tin Đợt thực tập Khoa.')
      });
  }

  buildCriteriaFromApi(clos: any[]): void {
    this.criteria = clos.map(clo => {
      const rubrics = [...(clo.rubrics || [])].sort((a: any, b: any) => Number(a.score_level) - Number(b.score_level));
      const usesLevelCode = rubrics.length > 0 && rubrics.every((r: any) => {
        const value = Number(r.score_level);
        return Number.isInteger(value) && value >= 0 && value <= 4;
      });

      return {
        id: clo.clo_code,
        name: `CLO: ${clo.clo_code}`,
        description: clo.description,
        maxScore: 10,
        alphaWeight: this.toNumber(clo.alpha_weight, 0),
        stage1Weight: this.toNumber(clo.stage1_weight, this.departmentStage1Weight),
        stage2Weight: this.toNumber(clo.stage2_weight, this.departmentStage2Weight),
        gvhdBeta: this.toNumber(clo.gvhd_beta, 0),
        companyBeta: this.toNumber(clo.company_beta, 0),
        gvhdScore: null,
        companyScore: null,
        levels: rubrics.map((r: any, index: number) => {
          const level = usesLevelCode ? Number(r.score_level) : index;
          const band = this.scoreBands.find(b => b.level === level) || this.scoreBands[index] || this.scoreBands[0];
          return {
            label: band.label,
            level: band.level,
            range: band.range,
            description: r.description || ''
          };
        })
      };
    });
  }

  checkExistingEvaluation(): void {
    if (!this.selectedStudent) return;
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;
    const evaluatorType = this.getCurrentEvaluatorType();

    this.evaluationService.findEvaluations(this.selectedStudent.id).subscribe({
      next: (res) => {
        const evaluations = Array.isArray(res) ? res : (res.data || res.payload || []);
        const stageEvaluations = evaluations.filter((e: any) => e.stage === this.selectedStage);
        this.resetCriteriaEvaluationState();
        this.applyAggregatedScores(stageEvaluations);

        const myEval = stageEvaluations.find((e: any) =>
          e.evaluator_type === evaluatorType &&
          e.evaluator_id === currentUser.userId
        );
        if (myEval) {
          this.existingEvaluation = myEval;
          this.generalComment = myEval.general_comment || '';
          (myEval.scores || []).forEach((score: any) => {
            const crit = this.criteria.find(c => c.id === score.clo_code);
            if (crit) {
              crit.selectedScore = this.clampScore(score.score_level);
              crit.comment = score.comment || score.short_comment || '';
            }
          });
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  get visibleCriteria(): RubricCriterion[] {
    return this.criteria.filter(c => this.getStageWeight(c) > 0);
  }

  get hiddenCriteriaCount(): number {
    return this.criteria.length - this.visibleCriteria.length;
  }

  get hasRubricConfig(): boolean {
    return this.criteria.length > 0;
  }

  get canSubmit(): boolean {
    return !this.isSaving && this.isFullyScored() && !this.isScoringLocked();
  }

  getStageWeight(criterion: RubricCriterion): number {
    return this.selectedStage === 'STAGE_1' ? criterion.stage1Weight : criterion.stage2Weight;
  }

  getStageLabel(): string {
    return this.selectedStage === 'STAGE_1' ? 'Chặng 1 (Giữa kỳ)' : 'Chặng 2 (Cuối kỳ)';
  }

  getStageTemplateTitle(): string {
    return this.selectedStage === 'STAGE_1'
      ? 'Chặng 1 - Đánh giá tổng kết giữa kỳ'
      : 'Chặng 2 - Đánh giá tổng kết cuối kỳ';
  }

  getStageTemplateSubtitle(): string {
    const weight = this.selectedStage === 'STAGE_1' ? this.departmentStage1Weight : this.departmentStage2Weight;
    const evaluator = this.selectedStage === 'STAGE_1' ? 'GVHD + ĐVHD' : 'GVHD + ĐVHD + Tổ đánh giá TTTN';
    return `Trọng số chặng ${this.selectedStage === 'STAGE_1' ? '1' : '2'}: ${weight}% tổng điểm học phần | Người đánh giá: ${evaluator}`;
  }

  getActiveTabTitle(): string {
    return this.activeTab === 'SUMMARY' ? 'Tổng hợp điểm' : this.getStageTemplateTitle();
  }

  getActiveTabSubtitle(): string {
    return this.activeTab === 'SUMMARY'
      ? 'Xem trực tiếp điểm trung bình Chặng 1, Chặng 2 và điểm học phần cuối cùng.'
      : this.getStageTemplateSubtitle();
  }

  getStageAverageTitle(): string {
    return this.selectedStage === 'STAGE_1' ? 'Điểm TB Chặng 1' : 'Điểm TB Chặng 2';
  }

  getStageStartText(): string {
    return this.selectedStage === 'STAGE_1' ? this.midtermStartDateStr : this.tttn06StartDateStr;
  }

  getScoreLevel(score: number | null | undefined): number | null {
    if (score === null || score === undefined || Number.isNaN(Number(score))) return null;
    const value = Number(score);
    if (value < 0 || value > 10) return null;
    if (value < 4) return 0;
    if (value < 5.5) return 1;
    if (value < 7) return 2;
    if (value < 8.5) return 3;
    return 4;
  }

  getScoreLevelLabel(score: number | null | undefined): string {
    const level = this.getScoreLevel(score);
    if (level === null) return 'Chưa nhập';
    const band = this.scoreBands.find(b => b.level === level);
    return band ? `${band.label} (${band.range})` : `Mức ${level}`;
  }

  getScoreLevelName(score: number | null | undefined): string {
    const level = this.getScoreLevel(score);
    if (level === null) return 'Chưa nhập';
    return this.scoreBands.find(b => b.level === level)?.label || `Mức ${level}`;
  }

  getScoreLevelRange(score: number | null | undefined): string {
    const level = this.getScoreLevel(score);
    if (level === null) return '';
    return this.scoreBands.find(b => b.level === level)?.range || '';
  }

  getLevelBadgeClass(criterion: RubricCriterion): string {
    const level = this.getScoreLevel(criterion.selectedScore);
    if (level === null) return 'bg-slate-100 text-slate-500 border-slate-200';
    if (level === 0) return 'bg-red-50 text-red-700 border-red-200';
    if (level === 1) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (level === 2) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  getLevelClass(criterion: RubricCriterion, level: RubricLevel): string {
    return this.getScoreLevel(criterion.selectedScore) === level.level
      ? 'border-[#00429D] bg-blue-50 text-[#00429D]'
      : 'border-slate-200 bg-white text-slate-600';
  }

  getStageResultBadgeClass(criterion: RubricCriterion): string {
    const level = this.getScoreLevel(this.getStageAverageScore(criterion));
    if (level === null) return 'bg-slate-100 text-slate-500 border-slate-200';
    if (level === 0) return 'bg-red-50 text-red-700 border-red-200';
    if (level === 1) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (level === 2) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  getScoreInputClass(criterion: RubricCriterion): string {
    return this.isScoreValid(criterion) || criterion.selectedScore === undefined || criterion.selectedScore === null
      ? 'border-slate-300 focus:border-[#00429D] focus:ring-[#00429D]'
      : 'border-red-300 focus:border-red-500 focus:ring-red-500';
  }

  normalizeScore(criterion: RubricCriterion): void {
    if (criterion.selectedScore === null || criterion.selectedScore === undefined || criterion.selectedScore === ('' as any)) {
      criterion.selectedScore = undefined;
      return;
    }
    const value = Number(criterion.selectedScore);
    if (Number.isNaN(value)) {
      criterion.selectedScore = undefined;
      return;
    }
    criterion.selectedScore = this.clampScore(value);
  }

  isScoreValid(criterion: RubricCriterion): boolean {
    const value = Number(criterion.selectedScore);
    return criterion.selectedScore !== null && criterion.selectedScore !== undefined && !Number.isNaN(value) && value >= 0 && value <= 10;
  }

  getAverageScore(): number {
    const scores = this.visibleCriteria
      .map(c => this.getStageAverageScore(c))
      .filter((score): score is number => score !== null && score !== undefined);
    return scores.length === 0 ? 0 : scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  getAverageScoreText(): string {
    const scores = this.visibleCriteria
      .map(c => this.getStageAverageScore(c))
      .filter((score): score is number => score !== null && score !== undefined);
    if (scores.length === 0) return 'Chưa có';
    return this.formatScore(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  getFilledCriteriaCount(): number {
    return this.scorableCriteria.filter(c => this.isScoreValid(c)).length;
  }

  getProgressText(): string {
    return `${this.getFilledCriteriaCount()}/${this.scorableCriteria.length} CLO đã nhập điểm`;
  }

  getNoVisibleCriteriaMessage(): string {
    if (!this.hasRubricConfig) {
      return 'Khoa chưa thiết lập cấu hình CLO & Rubric.';
    }
    return `Không có CLO nào cần chấm ở ${this.getStageLabel()} vì trọng số chặng bằng 0%.`;
  }

  getExistingEvaluationMessage(): string {
    return `Bạn đã chấm điểm ${this.getStageLabel()} cho sinh viên này. Có thể cập nhật và lưu lại điểm.`;
  }

  getSubmitText(): string {
    return this.existingEvaluation ? 'Lưu cập nhật điểm' : 'Hoàn tất đánh giá';
  }

  getCommentPlaceholder(): string {
    return this.selectedStage === 'STAGE_1'
      ? 'Nhận xét chung về kết quả giữa kỳ, tiến độ, thái độ và các điểm cần cải thiện...'
      : 'Nhận xét chung về kết quả cuối kỳ, báo cáo/sản phẩm và mức độ đạt chuẩn đầu ra...';
  }

  getRubricLevels(criterion: RubricCriterion): RubricLevel[] {
    return criterion.levels.length > 0
      ? criterion.levels
      : this.scoreBands.map(b => ({ label: b.label, level: b.level, range: b.range, description: '' }));
  }

  isScoringLocked(): boolean {
    if (!this.isCampaignActive) return true;
    if (this.isStageManuallyLocked()) return true;
    return this.selectedStage === 'STAGE_1' ? !this.isStage1Open : !this.isStage2Open;
  }

  isStageManuallyLocked(stage: 'STAGE_1' | 'STAGE_2' = this.selectedStage): boolean {
    if (!this.finalResult) return false;
    const evaluatorType = this.getCurrentEvaluatorType();
    if (stage === 'STAGE_1') {
      return evaluatorType === 'COMPANY_SUPERVISOR'
        ? Boolean(this.finalResult.stage1_company_locked)
        : Boolean(this.finalResult.stage1_gvhd_locked);
    }
    return evaluatorType === 'COMPANY_SUPERVISOR'
      ? Boolean(this.finalResult.stage2_company_locked)
      : Boolean(this.finalResult.stage2_gvhd_locked);
  }

  get canLockCurrentStage(): boolean {
    return Boolean(this.selectedStudent && this.existingEvaluation && !this.isStageManuallyLocked() && !this.isSaving);
  }

  isFullyScored(): boolean {
    return this.scorableCriteria.length > 0 && this.scorableCriteria.every(c => this.isScoreValid(c));
  }

  submitEvaluation(): void {
    this.scorableCriteria.forEach(c => this.normalizeScore(c));

    if (!this.selectedStudent || !this.isFullyScored()) {
      this.toastService.error('Vui lòng nhập điểm thang 10 cho tất cả CLO có trọng số ở chặng này.');
      return;
    }

    if (this.selectedStage === 'STAGE_1' && !this.isStage1Open) {
      this.toastService.error(`Chưa đến thời gian mở chấm Chặng 1. Chặng này bắt đầu từ ${this.midtermStartDateStr}.`);
      return;
    }
    if (this.selectedStage === 'STAGE_2' && !this.isStage2Open) {
      this.toastService.error(`Chưa đến thời gian mở chấm Chặng 2. Chặng này bắt đầu từ ${this.tttn06StartDateStr}.`);
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;
    const evaluatorType = this.getCurrentEvaluatorType();

    this.isSaving = true;
    const payload: EvaluationRequest = {
      student_campaign_id: this.selectedStudent.id,
      evaluator_type: evaluatorType as any,
      evaluator_id: currentUser.userId,
      stage: this.selectedStage,
      general_comment: this.generalComment,
      scores: this.scorableCriteria.map(c => ({
        clo_code: c.id,
        score_level: Number(c.selectedScore),
        comment: c.comment?.trim() || undefined
      }))
    };

    this.evaluationService.submitEvaluation(payload).subscribe({
      next: (res) => {
        this.existingEvaluation = res?.payload || res?.data || res;
        this.toastService.success('Lưu bảng điểm thành công!');
        this.isSaving = false;
        this.evaluationService.calculateFinalResult(this.selectedStudent!.id).subscribe({
          next: (scoreRes) => this.finalResult = this.unwrapResponse(scoreRes)
        });

        const index = this.allStudents.findIndex(s => s.id === this.selectedStudent!.id);
        if (index !== -1) {
          this.refreshStudentGradingStatus(this.allStudents[index]);
        }
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Có lỗi khi lưu bảng điểm.';
        this.toastService.error(msg);
        this.isSaving = false;
      }
    });
  }

  lockCurrentStage(): void {
    if (!this.selectedStudent || !this.canLockCurrentStage) return;
    const ok = window.confirm('Sau khi khóa điểm, bạn sẽ không thể sửa điểm của chặng này. Tiếp tục khóa?');
    if (!ok) return;

    this.isSaving = true;
    this.evaluationService.lockFinalResultStage(
      this.selectedStudent.id,
      this.selectedStage,
      this.getCurrentEvaluatorType()
    ).subscribe({
      next: (res) => {
        this.finalResult = this.unwrapResponse(res);
        this.isSaving = false;
        this.toastService.success('Đã khóa điểm chặng.');
      },
      error: (err) => {
        this.isSaving = false;
        this.toastService.error(err?.error?.message || 'Không thể khóa điểm chặng.');
      }
    });
  }

  private getCurrentEvaluatorType(): 'GVHD' | 'COMPANY_SUPERVISOR' {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.role === 'COMPANY_SUPERVISOR' ? 'COMPANY_SUPERVISOR' : 'GVHD';
  }

  loadFinalResult(): void {
    if (!this.selectedStudent) return;
    this.isSummaryLoading = true;
    this.evaluationService.getFinalResult(this.selectedStudent.id).subscribe({
      next: (res) => {
        this.finalResult = this.unwrapResponse(res);
        this.isSummaryLoading = false;
      },
      error: () => {
        this.finalResult = null;
        this.isSummaryLoading = false;
      }
    });
  }

  loadSummaryEvaluations(): void {
    if (!this.selectedStudent) return;
    this.evaluationService.findEvaluations(this.selectedStudent.id).subscribe({
      next: (res) => {
        this.summaryEvaluations = Array.isArray(res) ? res : (res.data || res.payload || []);
      },
      error: () => {
        this.summaryEvaluations = [];
      }
    });
  }

  getStageScore(stage: 'STAGE_1' | 'STAGE_2'): number | null {
    if (!this.finalResult) return null;
    return stage === 'STAGE_1'
      ? (this.finalResult.stage1_score ?? this.finalResult.stage_1_score ?? null)
      : (this.finalResult.stage2_score ?? this.finalResult.stage_2_score ?? null);
  }

  getFinalHpScore(): number | null {
    return this.finalResult?.final_hp_score ?? null;
  }

  get summaryRows(): SummaryCloRow[] {
    const stage1Evaluations = this.summaryEvaluations.filter((evaluation: any) => evaluation.stage === 'STAGE_1');
    const stage2Evaluations = this.summaryEvaluations.filter((evaluation: any) => evaluation.stage === 'STAGE_2');
    const stage1GvhdScores = this.buildScoreMap(stage1Evaluations, 'GVHD');
    const stage1CompanyScores = this.buildScoreMap(stage1Evaluations, ['COMPANY_SUPERVISOR', 'COMPANY']);
    const stage2GvhdScores = this.buildScoreMap(stage2Evaluations, 'GVHD');
    const stage2CompanyScores = this.buildScoreMap(stage2Evaluations, ['COMPANY_SUPERVISOR', 'COMPANY']);

    return this.criteria
      .filter(criterion => criterion.stage1Weight > 0 || criterion.stage2Weight > 0)
      .map(criterion => {
        const stage1Average = this.getSummaryStageAverage(criterion, stage1GvhdScores, stage1CompanyScores);
        const stage2Average = this.getSummaryStageAverage(criterion, stage2GvhdScores, stage2CompanyScores);
        const cloScore = this.getSummaryCloScore(criterion, stage1Average, stage2Average);
        const contribution = cloScore === null ? null : this.roundTo(cloScore * (criterion.alphaWeight / 100), 3);
        return { criterion, stage1Average, stage2Average, cloScore, contribution };
      });
  }

  getSummaryHpScore(): number | null {
    const finalScore = this.getFinalHpScore();
    if (finalScore !== null) return finalScore;
    const contributions = this.summaryRows
      .map(row => row.contribution)
      .filter((value): value is number => value !== null);
    if (contributions.length === 0) return null;
    return this.roundTo(contributions.reduce((sum, value) => sum + value, 0), 1);
  }

  formatSummaryScore(value: number | null | undefined): string {
    return value === null || value === undefined ? 'N/A' : this.formatScore(value);
  }

  formatSummaryContribution(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'N/A';
    return Number.isInteger(value) ? `${value}` : value.toString().replace(/0+$/, '').replace(/\.$/, '');
  }

  getSummaryStatusText(): string {
    const score = this.getFinalHpScore();
    if (score === null) return 'Chưa có kết quả';
    if (this.finalResult?.is_paralyzed || score < 5) return 'Không đạt';
    return 'Đạt';
  }

  handleError(msg: string): void {
    this.toastService.error(msg);
    this.isLoading = false;
  }

  trackCriterion(_index: number, criterion: RubricCriterion): string {
    return criterion.id;
  }

  trackLevel(_index: number, level: RubricLevel): number {
    return level.level;
  }

  get scorableCriteria(): RubricCriterion[] {
    return this.visibleCriteria.filter(c => this.getCurrentEvaluatorBeta(c) > 0);
  }

  getCompanyScoreText(criterion: RubricCriterion): string {
    if (criterion.companyBeta <= 0) return 'N/A';
    const score = this.isCompanySupervisor ? this.toNullableScore(criterion.selectedScore) : criterion.companyScore;
    return this.formatScore(score);
  }

  getGvhdScoreText(criterion: RubricCriterion): string {
    if (criterion.gvhdBeta <= 0) return 'N/A';
    const score = this.isCompanySupervisor ? criterion.gvhdScore : this.toNullableScore(criterion.selectedScore);
    return this.formatScore(score);
  }

  getStageAverageScore(criterion: RubricCriterion): number | null {
    const companyScore = this.isCompanySupervisor ? this.toNullableScore(criterion.selectedScore) : criterion.companyScore;
    const gvhdScore = this.isCompanySupervisor ? criterion.gvhdScore : this.toNullableScore(criterion.selectedScore);
    const companyRequired = criterion.companyBeta > 0;
    const gvhdRequired = criterion.gvhdBeta > 0;

    if (companyRequired && companyScore === null) return null;
    if (gvhdRequired && gvhdScore === null) return null;

    const totalWeight = (companyRequired ? criterion.companyBeta : 0) + (gvhdRequired ? criterion.gvhdBeta : 0);
    if (totalWeight <= 0) return null;

    const weightedScore =
      (companyRequired ? (companyScore || 0) * criterion.companyBeta : 0) +
      (gvhdRequired ? (gvhdScore || 0) * criterion.gvhdBeta : 0);

    return Math.round((weightedScore / totalWeight) * 10) / 10;
  }

  getStageAverageScoreText(criterion: RubricCriterion): string {
    return this.formatScore(this.getStageAverageScore(criterion));
  }

  getStageLevelLabel(criterion: RubricCriterion): string {
    return this.getScoreLevelLabel(this.getStageAverageScore(criterion));
  }

  isCurrentEvaluatorColumn(evaluator: 'GVHD' | 'COMPANY_SUPERVISOR', criterion: RubricCriterion): boolean {
    if (evaluator === 'COMPANY_SUPERVISOR') {
      return this.isCompanySupervisor && criterion.companyBeta > 0;
    }
    return !this.isCompanySupervisor && criterion.gvhdBeta > 0;
  }

  canCurrentEvaluatorScore(criterion: RubricCriterion): boolean {
    return this.getCurrentEvaluatorBeta(criterion) > 0;
  }

  private toNumber(value: any, fallback: number): number {
    if (value === null || value === undefined || value === '') return fallback;
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? fallback : numberValue;
  }

  private toNullableScore(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? null : this.clampScore(numberValue);
  }

  private formatScore(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'Chưa có';
    const numberValue = Math.round(Number(value) * 10) / 10;
    return Number.isInteger(numberValue) ? `${numberValue}` : numberValue.toFixed(1);
  }

  private getCurrentEvaluatorBeta(criterion: RubricCriterion): number {
    return this.isCompanySupervisor ? criterion.companyBeta : criterion.gvhdBeta;
  }

  private resetCriteriaEvaluationState(): void {
    this.criteria.forEach(c => {
      c.selectedScore = undefined;
      c.comment = '';
      c.gvhdScore = null;
      c.companyScore = null;
      c.gvhdComment = '';
      c.companyComment = '';
    });
  }

  private applyAggregatedScores(evaluations: any[]): void {
    const gvhdScores = this.buildScoreMap(evaluations, 'GVHD');
    const companyScores = this.buildScoreMap(evaluations, ['COMPANY_SUPERVISOR', 'COMPANY']);

    this.criteria.forEach(criterion => {
      const gvhd = gvhdScores.get(criterion.id);
      const company = companyScores.get(criterion.id);

      criterion.gvhdScore = gvhd ? this.clampScore(gvhd.total / gvhd.count) : null;
      criterion.companyScore = company ? this.clampScore(company.total / company.count) : null;
      criterion.gvhdComment = gvhd?.comments[0] || '';
      criterion.companyComment = company?.comments[0] || '';
    });
  }

  private buildScoreMap(evaluations: any[], evaluatorTypes: string | string[]): Map<string, ScoreAccumulator> {
    const allowedTypes = Array.isArray(evaluatorTypes) ? evaluatorTypes : [evaluatorTypes];
    const scoreMap = new Map<string, ScoreAccumulator>();
    evaluations
      .filter((evaluation: any) => allowedTypes.includes(evaluation.evaluator_type))
      .forEach((evaluation: any) => {
        (evaluation.scores || []).forEach((score: any) => {
          const scoreValue = this.toNullableScore(score.score_level);
          if (!score.clo_code || scoreValue === null) return;

          const current = scoreMap.get(score.clo_code) || { total: 0, count: 0, comments: [] };
          current.total += scoreValue;
          current.count += 1;

          const comment = score.comment || score.short_comment;
          if (comment) current.comments.push(comment);

          scoreMap.set(score.clo_code, current);
        });
      });

    return scoreMap;
  }

  private getSummaryStageAverage(
    criterion: RubricCriterion,
    gvhdScores: Map<string, ScoreAccumulator>,
    companyScores: Map<string, ScoreAccumulator>
  ): number | null {
    const gvhd = gvhdScores.get(criterion.id);
    const company = companyScores.get(criterion.id);
    const gvhdScore = gvhd ? this.clampScore(gvhd.total / gvhd.count) : null;
    const companyScore = company ? this.clampScore(company.total / company.count) : null;
    const companyRequired = criterion.companyBeta > 0;
    const gvhdRequired = criterion.gvhdBeta > 0;

    if (companyRequired && companyScore === null) return null;
    if (gvhdRequired && gvhdScore === null) return null;

    const totalWeight = (companyRequired ? criterion.companyBeta : 0) + (gvhdRequired ? criterion.gvhdBeta : 0);
    if (totalWeight <= 0) return null;

    const weightedScore =
      (companyRequired ? (companyScore || 0) * criterion.companyBeta : 0) +
      (gvhdRequired ? (gvhdScore || 0) * criterion.gvhdBeta : 0);

    return this.roundTo(weightedScore / totalWeight, 1);
  }

  private getSummaryCloScore(criterion: RubricCriterion, stage1Average: number | null, stage2Average: number | null): number | null {
    const stage1Weight = criterion.stage1Weight / 100;
    const stage2Weight = criterion.stage2Weight / 100;
    const activeWeight = (stage1Average !== null ? stage1Weight : 0) + (stage2Average !== null ? stage2Weight : 0);
    if (activeWeight <= 0) return null;
    const weightedScore =
      (stage1Average !== null ? stage1Average * stage1Weight : 0) +
      (stage2Average !== null ? stage2Average * stage2Weight : 0);
    return this.roundTo(weightedScore / activeWeight, 1);
  }

  private roundTo(value: number, digits: number): number {
    const factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
  }

  private refreshStudentGradingStatus(student: StudentCampaignResponse): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.evaluationService.findEvaluations(student.id).subscribe({
      next: (res) => {
        const evals = Array.isArray(res) ? res : (res.data || res.payload || []);
        (student as any).gradingStatus = this.resolveGradingStatus(evals, currentUser);
        this.filterStudents();
      },
      error: () => this.filterStudents()
    });
  }

  private isCompanyEvaluation(evaluation: any): boolean {
    return evaluation?.evaluator_type === 'COMPANY_SUPERVISOR' || evaluation?.evaluator_type === 'COMPANY';
  }

  private unwrapResponse(response: any): any {
    return response?.payload || response?.data || response || null;
  }

  private clampScore(value: any): number {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) return 0;
    return Math.min(10, Math.max(0, Math.round(numberValue * 10) / 10));
  }
}
