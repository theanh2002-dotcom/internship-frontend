import { Component, OnInit } from '@angular/core';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { DepartmentCampaignService } from '../../../core/services/department-campaign.service';
import { EvaluationService, EvaluationRequest } from '../../../core/services/evaluation.service';
import { AuthService } from '../../../core/services/auth.service';
import { StudentCampaignResponse } from '../../../core/models/base.model';
import { ToastService } from '../../../core/services/toast.service';
import { CampaignService } from '../../../core/services/campaign.service';

interface RubricLevel {
  label: string;
  description: string;
  points: number;
}

interface RubricCriterion {
  id: string; // clo_code
  name: string;
  description: string;
  maxScore: number;
  levels: RubricLevel[];
  selectedPoints?: number;
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
  searchTerm: string = '';
  selectedGradingStatus: string = '';
  selectedStudent: StudentCampaignResponse | null = null;
  
  criteria: RubricCriterion[] = [];
  existingEvaluation: any = null;

  selectedStage: 'STAGE_1' | 'STAGE_2' = 'STAGE_1';
  campaign: any = null;
  isStage1Open = false;
  isStage2Open = false;
  midtermStartDateStr = '';
  tttn06StartDateStr = '';

  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  paginatedStudents: StudentCampaignResponse[] = [];

  columns = [
    { key: 'STT', label: 'STT', width: '60px', align: 'center' },
    { key: 'student_code', label: 'Mã SV', width: '120px' },
    { key: 'full_name', label: 'Họ và tên' },
    { key: 'company', label: 'Đơn vị thực tập' },
    { key: 'gradingStatus', label: 'Trạng thái', width: '150px', align: 'center' },
    { key: 'actions', label: 'Thao tác', align: 'center', width: '150px' }
  ];
  
  constructor(
    private studentCampaignService: StudentCampaignService,
    private departmentCampaignService: DepartmentCampaignService,
    private evaluationService: EvaluationService,
    private authService: AuthService,
    private toastService: ToastService,
    private campaignService: CampaignService
  ) {}

  isCompanySupervisor = false;

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.isCompanySupervisor = currentUser?.role === 'COMPANY_SUPERVISOR';
    this.loadEligibleStudents();
  }

  loadEligibleStudents(): void {
    this.isLoading = true;
    const currentUser = this.authService.getCurrentUser();
    const source$ = this.isCompanySupervisor 
      ? this.studentCampaignService.getCompanyStudents()
      : this.studentCampaignService.getMyAssignedStudents();
      
    source$.subscribe({
      next: (res) => {
        const all = Array.isArray(res) ? res : (res.data || res.payload || []);
        this.allStudents = all.filter((s: any) => 
          ['PLAN_APPROVED', 'IN_PROGRESS', 'STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'].includes(s.status)
        ).map((s: any) => ({ ...s, gradingStatus: 'Đang tải...' }));
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
    if (!currentUser) return;
    const evaluatorType = currentUser.role === 'COMPANY_SUPERVISOR' ? 'COMPANY_SUPERVISOR' : 'GVHD';

    let completedCount = 0;
    this.allStudents.forEach(student => {
      this.evaluationService.findEvaluations(student.id).subscribe({
        next: (res) => {
          const evals = Array.isArray(res) ? res : (res.data || res.payload || []);
          const myEval = evals.find((e: any) => e.evaluator_type === evaluatorType && e.evaluator_id === currentUser.userId);
          (student as any).gradingStatus = myEval ? 'Đã chấm' : 'Chưa chấm';
          
          completedCount++;
          if (completedCount === this.allStudents.length) {
            this.filterStudents();
          } else {
            this.paginate();
          }
        },
        error: () => {
          (student as any).gradingStatus = 'Lỗi trạng thái';
          completedCount++;
          if (completedCount === this.allStudents.length) {
            this.filterStudents();
          } else {
            this.paginate();
          }
        }
      });
    });
  }

  filterStudents(): void {
    let result = [...this.allStudents];

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
    const endIndex = startIndex + this.pageSize;
    this.paginatedStudents = this.students.slice(startIndex, endIndex);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.filterStudents();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.paginate();
  }

  selectStudent(student: StudentCampaignResponse): void {
    this.selectedStudent = student;
    this.criteria = [];
    this.existingEvaluation = null;
    this.campaign = null;
    this.isStage1Open = false;
    this.isStage2Open = false;
    this.selectedStage = 'STAGE_1';
    this.loadCampaignInfo(student.campaign_id);
    this.loadRubricConfig();
  }

  loadCampaignInfo(campaignId: number): void {
    this.campaignService.getById(campaignId).subscribe({
      next: (camp: any) => {
        const campaign = camp.data || camp.payload || camp;
        this.campaign = campaign;
        const now = new Date();

        // Stage 1 checks
        const midtermStart = campaign.midterm_start_date ? new Date(campaign.midterm_start_date) : new Date(new Date(campaign.start_date).getTime() + 21 * 24 * 60 * 60 * 1000);
        this.midtermStartDateStr = midtermStart.toLocaleDateString('vi-VN');
        this.isStage1Open = now >= midtermStart;

        // Stage 2 checks
        const tttn06Start = campaign.tttn06_start_date ? new Date(campaign.tttn06_start_date) : new Date(new Date(campaign.end_date).getTime() - 7 * 24 * 60 * 60 * 1000);
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
    this.existingEvaluation = null;
    // Reset selected points in criteria
    this.criteria.forEach(c => c.selectedPoints = undefined);
    this.checkExistingEvaluation();
  }

  loadRubricConfig(): void {
    if (!this.selectedStudent) return;
    this.isLoading = true;
    
    this.departmentCampaignService.findOrCreate(this.selectedStudent.campaign_id, this.selectedStudent.department_id)
      .subscribe({
        next: (deptRes) => {
          const deptCampId = deptRes.id !== undefined ? deptRes.id : (deptRes.data?.id || deptRes.payload?.id);
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
      // Sắp xếp level tăng dần
      const rubrics = [...(clo.rubrics || [])].sort((a: any, b: any) => a.score_level - b.score_level);
      
      return {
        id: clo.clo_code,
        name: `CLO: ${clo.clo_code}`,
        description: clo.description,
        maxScore: 4.0, // Thường điểm tối đa level là 4
        levels: rubrics.map((r: any) => ({
          label: `Mức ${r.score_level}`,
          description: r.description,
          points: r.score_level
        }))
      };
    });
  }

  checkExistingEvaluation(): void {
    if (!this.selectedStudent) return;
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;
    const evaluatorType = currentUser.role === 'COMPANY_SUPERVISOR' ? 'COMPANY_SUPERVISOR' : 'GVHD';

    this.evaluationService.findEvaluations(this.selectedStudent.id).subscribe({
      next: (res) => {
        const evaluations = Array.isArray(res) ? res : (res.data || res.payload || []);
        // Tìm bài chấm
        const myEval = evaluations.find((e: any) => e.evaluator_type === evaluatorType && e.evaluator_id === currentUser.userId && e.stage === this.selectedStage);
        if (myEval) {
          this.existingEvaluation = myEval;
          // Fill lại điểm cũ
          myEval.scores.forEach((s: any) => {
            const crit = this.criteria.find(c => c.id === s.clo_code);
            if (crit) crit.selectedPoints = s.score_level;
          });
          this.toastService.success(`Bạn đã chấm điểm Chặng ${this.selectedStage === 'STAGE_1' ? '1' : '2'} cho sinh viên này rồi. Bạn có thể sửa điểm nếu cần.`);
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  selectLevel(criterion: RubricCriterion, points: number) {
    // Disable scoring if the phase is not open
    if (this.selectedStage === 'STAGE_1' && !this.isStage1Open) return;
    if (this.selectedStage === 'STAGE_2' && !this.isStage2Open) return;
    criterion.selectedPoints = points;
  }

  getTotalScore(): number {
    return this.criteria.reduce((total, c) => total + (c.selectedPoints || 0), 0);
  }
  
  isFullyScored(): boolean {
    return this.criteria.length > 0 && this.criteria.every(c => c.selectedPoints !== undefined);
  }

  submitEvaluation() {
    if (!this.selectedStudent || !this.isFullyScored()) {
      this.toastService.error('Vui lòng chấm điểm cho tất cả tiêu chí.');
      return;
    }

    if (this.selectedStage === 'STAGE_1' && !this.isStage1Open) {
      this.toastService.error('Chưa đến thời gian đánh giá Chặng 1.');
      return;
    }
    if (this.selectedStage === 'STAGE_2' && !this.isStage2Open) {
      this.toastService.error('Chưa đến thời gian đánh giá Chặng 2.');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;
    const evaluatorType = currentUser.role === 'COMPANY_SUPERVISOR' ? 'COMPANY_SUPERVISOR' : 'GVHD';

    this.isSaving = true;
    const payload: EvaluationRequest = {
      student_campaign_id: this.selectedStudent.id,
      evaluator_type: evaluatorType as any,
      evaluator_id: currentUser.userId,
      stage: this.selectedStage,
      scores: this.criteria.map(c => ({
        clo_code: c.id,
        score_level: c.selectedPoints!
      }))
    };

    this.evaluationService.submitEvaluation(payload).subscribe({
      next: () => {
        this.toastService.success('Lưu bảng điểm thành công!');
        this.isSaving = false;
        // Auto-calculate final result so it shows up in Bảng tổng hợp
        this.evaluationService.calculateFinalResult(this.selectedStudent!.id).subscribe();
        
        // Update local status
        if (this.selectedStudent) {
            const index = this.allStudents.findIndex(s => s.id === this.selectedStudent!.id);
            if (index !== -1) {
              (this.allStudents[index] as any).gradingStatus = 'Đã chấm';
              this.filterStudents();
            }
        }
      },
      error: (err) => {
        const msg = err.error?.message || 'Có lỗi khi lưu bảng điểm.';
        this.toastService.error(msg);
        this.isSaving = false;
      }
    });
  }

  handleError(msg: string): void {
    this.toastService.error(msg);
    this.toastService.error(msg);
    this.isLoading = false;
  }
}
