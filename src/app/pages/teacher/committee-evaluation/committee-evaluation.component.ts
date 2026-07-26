import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { CampaignService } from '../../../core/services/campaign.service';
import { CommitteeResponse, CommitteeService } from '../../../core/services/committee.service';
import { DepartmentCampaignService } from '../../../core/services/department-campaign.service';
import { EvaluationRequest, EvaluationService } from '../../../core/services/evaluation.service';
import { CampaignResponse, StudentCampaignResponse } from '../../../core/models/base.model';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { ToastService } from '../../../core/services/toast.service';
import { forkJoin } from 'rxjs';

interface CommitteeCriterion {
  id: string;
  description: string;
  alphaWeight: number;
  stage2Weight: number;
  selectedScore?: number | null;
  comment?: string;
}

interface MemberScore {
  memberName: string;
  score: number | null;
  comment: string;
  isCurrentUser: boolean;
}

@Component({
  selector: 'app-committee-evaluation',
  templateUrl: './committee-evaluation.component.html',
  styleUrls: ['./committee-evaluation.component.scss']
})
export class CommitteeEvaluationComponent implements OnInit {
  isLoading = true;
  isSaving = false;
  isDetailLoading = false;

  committees: CommitteeResponse[] = [];
  campaigns: CampaignResponse[] = [];
  selectedCampaignId: number | null = null;
  selectedCommitteeId: number | null = null;
  selectedCommittee: CommitteeResponse | null = null;

  allStudents: StudentCampaignResponse[] = [];
  students: StudentCampaignResponse[] = [];
  selectedStudent: StudentCampaignResponse | null = null;
  searchTerm = '';

  criteria: CommitteeCriterion[] = [];
  evaluations: any[] = [];
  existingEvaluation: any = null;
  generalComment = '';
  campaign: any = null;
  isStage2Open = false;
  stage2StartDateStr = '';

  currentPage = 1;
  pageSize = 10;
  paginatedStudents: StudentCampaignResponse[] = [];

  constructor(
    private authService: AuthService,
    private campaignService: CampaignService,
    private committeeService: CommitteeService,
    private departmentCampaignService: DepartmentCampaignService,
    private evaluationService: EvaluationService,
    private studentCampaignService: StudentCampaignService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      committees: this.committeeService.getMyCommittees(),
      campaigns: this.campaignService.getCampaigns({ page: 1, limit: 1000 })
    }).subscribe({
      next: ({ committees, campaigns }) => {
        this.committees = committees || [];
        this.campaigns = campaigns.data || [];
        const firstCampaignId = this.committees
          .map(committee => committee.campaign_id)
          .find((campaignId): campaignId is number => campaignId !== undefined && campaignId !== null);
        this.selectedCampaignId = firstCampaignId || null;
        this.loadStudents();
      },
      error: () => {
        this.isLoading = false;
        this.toastService.error('Không thể tải danh sách hội đồng.');
      }
    });
  }

  loadStudents(): void {
    this.studentCampaignService.getMyAssignedStudents().subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res : (res.data || res.payload || []);
        const committeeIds = new Set(this.committees.map(c => Number(c.id)));
        this.allStudents = data
          .filter((student: StudentCampaignResponse) => student.committee_id && committeeIds.has(Number(student.committee_id)))
          .sort((a: StudentCampaignResponse, b: StudentCampaignResponse) => this.compareStudentsByName(a, b));
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.toastService.error('Không thể tải danh sách sinh viên hội đồng.');
      }
    });
  }

  onCommitteeChange(): void {
    this.selectedCommittee = this.filteredCommittees.find(c => Number(c.id) === Number(this.selectedCommitteeId)) || null;
    this.currentPage = 1;
    this.selectedStudent = null;
    this.applyFilters();
  }

  onCampaignChange(): void {
    this.selectedCommitteeId = null;
    this.selectedCommittee = null;
    this.currentPage = 1;
    this.selectedStudent = null;
    this.searchTerm = '';
    this.applyFilters();
  }

  get filteredCommittees(): CommitteeResponse[] {
    if (this.selectedCampaignId === null) {
      return [];
    }
    return this.committees.filter(committee => Number(committee.campaign_id) === Number(this.selectedCampaignId));
  }

  get selectedCampaign(): CampaignResponse | null {
    return this.campaigns.find(campaign => Number(campaign.id) === Number(this.selectedCampaignId)) || null;
  }

  applyFilters(): void {
    if (this.selectedCommitteeId === null) {
      this.students = [];
      this.paginatedStudents = [];
      return;
    }

    let result = [...this.allStudents];
    result = result.filter(student => Number(student.committee_id) === Number(this.selectedCommitteeId));

    const term = this.searchTerm.trim().toLowerCase();
    if (term) {
      result = result.filter(student =>
        (student.student_code || '').toLowerCase().includes(term) ||
        (student.full_name || '').toLowerCase().includes(term) ||
        (student.class_name || '').toLowerCase().includes(term)
      );
    }

    this.students = result;
    const totalPages = Math.ceil(this.students.length / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    this.paginate();
  }

  paginate(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedStudents = this.students.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.paginate();
  }

  selectStudent(student: StudentCampaignResponse): void {
    this.selectedStudent = student;
    this.criteria = [];
    this.evaluations = [];
    this.existingEvaluation = null;
    this.generalComment = '';
    this.campaign = null;
    this.isStage2Open = false;
    this.selectedCommittee = this.committees.find(c => Number(c.id) === Number(student.committee_id)) || this.selectedCommittee;
    this.selectedCommitteeId = this.selectedCommittee?.id || this.selectedCommitteeId;
    this.loadDetail();
  }

  loadDetail(): void {
    if (!this.selectedStudent) return;
    this.isDetailLoading = true;
    this.loadCampaignInfo(this.selectedStudent.campaign_id);
    this.departmentCampaignService.findOrCreate(this.selectedStudent.campaign_id, this.selectedStudent.department_id).subscribe({
      next: (departmentCampaign) => {
        const dc = this.unwrap(departmentCampaign);
        this.departmentCampaignService.getCloConfigs(dc.id).subscribe({
          next: (cloResponse) => {
            const clos = Array.isArray(cloResponse) ? cloResponse : (cloResponse.data || cloResponse.payload || []);
            this.criteria = clos
              .filter((clo: any) => Number(clo.stage2_weight ?? 0) > 0)
              .map((clo: any) => ({
                id: clo.clo_code,
                description: clo.description,
                alphaWeight: this.toNumber(clo.alpha_weight, 0),
                stage2Weight: this.toNumber(clo.stage2_weight, 0),
                selectedScore: undefined,
                comment: ''
              }));
            this.loadEvaluations();
          },
          error: () => this.handleDetailError('Không thể tải cấu hình CLO & Rubric.')
        });
      },
      error: () => this.handleDetailError('Không thể tải cấu hình đợt thực tập của khoa.')
    });
  }

  loadCampaignInfo(campaignId: number): void {
    this.campaignService.getById(campaignId).subscribe({
      next: (res) => {
        const campaign = this.unwrap(res);
        this.campaign = campaign;
        const activeSource = this.selectedStudent?.group_config || campaign;
        const endDate = activeSource.end_date || campaign.end_date;
        const tttn06Start = activeSource.tttn06_start_date
          ? new Date(activeSource.tttn06_start_date)
          : new Date(new Date(endDate).getTime() - 7 * 24 * 60 * 60 * 1000);
        this.stage2StartDateStr = tttn06Start.toLocaleDateString('vi-VN');
        this.isStage2Open = new Date() >= tttn06Start && campaign.status === 'ACTIVE';
      },
      error: () => this.toastService.error('Không thể tải thông tin đợt thực tập.')
    });
  }

  loadEvaluations(): void {
    if (!this.selectedStudent) return;
    const currentUser = this.authService.getCurrentUser();
    this.evaluationService.findEvaluations(this.selectedStudent.id).subscribe({
      next: (res) => {
        this.evaluations = (Array.isArray(res) ? res : (res.data || res.payload || []))
          .filter((evaluation: any) => evaluation.stage === 'STAGE_2' && evaluation.evaluator_type === 'COMMITTEE_MEMBER');
        this.existingEvaluation = this.evaluations.find((evaluation: any) => evaluation.evaluator_id === currentUser?.userId) || null;
        if (this.existingEvaluation) {
          this.generalComment = this.existingEvaluation.general_comment || '';
          (this.existingEvaluation.scores || []).forEach((score: any) => {
            const criterion = this.criteria.find(c => c.id === score.clo_code);
            if (criterion) {
              criterion.selectedScore = this.toNullableScore(score.score_level);
              criterion.comment = score.comment || score.short_comment || '';
            }
          });
        }
        this.isDetailLoading = false;
      },
      error: () => {
        this.evaluations = [];
        this.isDetailLoading = false;
      }
    });
  }

  submitEvaluation(): void {
    if (!this.selectedStudent || !this.isFullyScored()) {
      this.toastService.error('Vui lòng nhập điểm cho tất cả CLO của Chặng 2.');
      return;
    }
    if (!this.isStage2Open) {
      this.toastService.error(`Chưa đến thời gian mở chấm Chặng 2. Thời gian mở: ${this.stage2StartDateStr}.`);
      return;
    }
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.isSaving = true;
    const payload: EvaluationRequest = {
      student_campaign_id: this.selectedStudent.id,
      evaluator_type: 'COMMITTEE_MEMBER',
      evaluator_id: currentUser.userId,
      stage: 'STAGE_2',
      general_comment: this.generalComment,
      scores: this.criteria.map(c => ({
        clo_code: c.id,
        score_level: Number(c.selectedScore),
        comment: c.comment?.trim() || undefined
      }))
    };

    this.evaluationService.submitEvaluation(payload).subscribe({
      next: () => {
        this.evaluationService.calculateFinalResult(this.selectedStudent!.id).subscribe();
        this.toastService.success('Đã lưu điểm hội đồng.');
        this.isSaving = false;
        this.loadEvaluations();
      },
      error: (err) => {
        this.isSaving = false;
        this.toastService.error(err?.message || err?.error?.message || 'Không thể lưu điểm hội đồng.');
      }
    });
  }

  backToList(): void {
    this.selectedStudent = null;
    this.criteria = [];
    this.evaluations = [];
  }

  getMemberScores(criterion: CommitteeCriterion): MemberScore[] {
    const currentUser = this.authService.getCurrentUser();
    const members = this.selectedCommittee?.members || [];
    return members.map(member => {
      const evaluation = this.evaluations.find(evaluation => Number(evaluation.evaluator_id) === Number(member.user_id));
      const score = evaluation?.scores?.find((item: any) => item.clo_code === criterion.id);
      return {
        memberName: `${member.full_name || member.email || 'Thành viên'}${member.role === 'GVHD' ? ' (GVHD)' : ''}`,
        score: this.toNullableScore(score?.score_level),
        comment: score?.comment || score?.short_comment || '',
        isCurrentUser: Number(member.user_id) === Number(currentUser?.userId)
      };
    });
  }

  getCommitteeAverageScore(criterion: CommitteeCriterion): number | null {
    const values = this.getMemberScores(criterion)
      .map(item => item.isCurrentUser ? this.toNullableScore(criterion.selectedScore) : item.score)
      .filter((value): value is number => value !== null);
    if (values.length === 0) return null;
    return this.roundTo(values.reduce((sum, value) => sum + value, 0) / values.length, 1);
  }

  getAverageScoreText(): string {
    const values = this.criteria
      .map(criterion => this.getCommitteeAverageScore(criterion))
      .filter((value): value is number => value !== null);
    if (values.length === 0) return 'Chưa có';
    return this.formatScore(values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  normalizeScore(criterion: CommitteeCriterion): void {
    criterion.selectedScore = this.toNullableScore(criterion.selectedScore);
  }

  isFullyScored(): boolean {
    return this.criteria.length > 0 && this.criteria.every(c => this.toNullableScore(c.selectedScore) !== null);
  }

  getStudentFirstName(student: StudentCampaignResponse): string {
    if (student.first_name) return student.first_name;
    const parts = (student.full_name || '').trim().split(/\s+/).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : '';
  }

  private compareStudentsByName(a: StudentCampaignResponse, b: StudentCampaignResponse): number {
    const first = this.getStudentFirstName(a).localeCompare(this.getStudentFirstName(b), 'vi', { sensitivity: 'base' });
    if (first !== 0) return first;
    return (a.student_code || '').localeCompare(b.student_code || '', 'vi', { numeric: true });
  }

  private handleDetailError(message: string): void {
    this.isDetailLoading = false;
    this.toastService.error(message);
  }

  private unwrap(response: any): any {
    return response?.payload || response?.data || response || {};
  }

  private toNumber(value: any, fallback: number): number {
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? fallback : numberValue;
  }

  private toNullableScore(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) return null;
    return Math.min(10, Math.max(0, Math.round(numberValue * 10) / 10));
  }

  private formatScore(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'Chưa có';
    const rounded = this.roundTo(value, 1);
    return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
  }

  private roundTo(value: number, digits: number): number {
    const factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
  }
}
