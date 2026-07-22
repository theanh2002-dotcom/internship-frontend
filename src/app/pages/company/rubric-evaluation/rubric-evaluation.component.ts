import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit } from '@angular/core';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { DepartmentCampaignService } from '../../../core/services/department-campaign.service';
import { EvaluationService, EvaluationRequest } from '../../../core/services/evaluation.service';
import { AuthService } from '../../../core/services/auth.service';
import { StudentCampaignResponse } from '../../../core/models/base.model';
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
export class CompanyRubricEvaluationComponent implements OnInit {
  isLoading = true;
  isSaving = false;
  
  allStudents: StudentCampaignResponse[] = [];
  students: StudentCampaignResponse[] = [];
  searchTerm: string = '';
  selectedStudent: StudentCampaignResponse | null = null;
  
  criteria: RubricCriterion[] = [];
  existingEvaluation: any = null;

  campaign: any = null;
  isStage1Open = false;
  midtermStartDateStr = '';
  
  constructor(
    private toastService: ToastService, 
    private studentCampaignService: StudentCampaignService,
    private departmentCampaignService: DepartmentCampaignService,
    private evaluationService: EvaluationService,
    private authService: AuthService,
    private campaignService: CampaignService
  ) {}

  ngOnInit(): void {
    this.loadEligibleStudents();
  }

  loadEligibleStudents(): void {
    this.isLoading = true;
    this.studentCampaignService.getCompanyStudents().subscribe({
      next: (res) => {
        const all = Array.isArray(res) ? res : (res.data || res.payload || []);
        this.allStudents = all.filter((s: any) => 
          ['PLAN_APPROVED', 'IN_PROGRESS', 'STAGE1_EVALUATED', 'REPORT_SUBMITTED', 'STAGE2_EVALUATED', 'COMPLETED'].includes(s.status)
        ).map((s: any) => ({ ...s, gradingStatus: 'Đang tải...' }));
        this.students = [...this.allStudents];
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

    const studentIds = this.allStudents
      .map(student => Number(student.id))
      .filter(id => Number.isFinite(id));

    this.evaluationService.findEvaluationsByStudents(studentIds).subscribe({
      next: (res) => {
        const evaluations = Array.isArray(res) ? res : (res.data || res.payload || []);
        const evaluationsByStudent = this.groupEvaluationsByStudent(evaluations);

        this.allStudents.forEach(student => {
          const evals = evaluationsByStudent.get(Number(student.id)) || [];
          const myEval = evals.find((e: any) =>
            e.evaluator_type === 'COMPANY_SUPERVISOR' && e.evaluator_id === currentUser.userId
          );
          (student as any).gradingStatus = myEval ? 'Đã chấm' : 'Chưa chấm';
        });

        this.filterStudents();
      },
      error: () => {
        this.allStudents.forEach(student => (student as any).gradingStatus = 'Lỗi trạng thái');
        this.filterStudents();
      }
    });
  }

  private groupEvaluationsByStudent(evaluations: any[]): Map<number, any[]> {
    const grouped = new Map<number, any[]>();
    evaluations.forEach((evaluation: any) => {
      const studentCampaignId = Number(evaluation.student_campaign_id);
      if (!Number.isFinite(studentCampaignId)) return;
      const current = grouped.get(studentCampaignId) || [];
      current.push(evaluation);
      grouped.set(studentCampaignId, current);
    });
    return grouped;
  }

  filterStudents(): void {
    if (!this.searchTerm.trim()) {
      this.students = [...this.allStudents];
      return;
    }
    
    const term = this.searchTerm.toLowerCase().trim();
    this.students = this.allStudents.filter(s => 
      s.full_name.toLowerCase().includes(term) || 
      s.student_code.toLowerCase().includes(term) ||
      (s.company_info?.company_name && s.company_info.company_name.toLowerCase().includes(term))
    );
  }

  selectStudent(student: StudentCampaignResponse): void {
    this.selectedStudent = student;
    this.criteria = [];
    this.existingEvaluation = null;
    this.campaign = null;
    this.isStage1Open = false;
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
      },
      error: () => {
        this.toastService.error('Không thể tải thông tin đợt thực tập.');
      }
    });
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
      const rubrics = [...(clo.rubrics || [])].sort((a: any, b: any) => a.score_level - b.score_level);
      return {
        id: clo.clo_code,
        name: `CLO: ${clo.clo_code}`,
        description: clo.description,
        maxScore: 4.0, 
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

    this.evaluationService.findEvaluations(this.selectedStudent.id).subscribe({
      next: (res) => {
        const evaluations = Array.isArray(res) ? res : (res.data || res.payload || []);
        const myEval = evaluations.find((e: any) => e.evaluator_type === 'COMPANY_SUPERVISOR' && e.evaluator_id === currentUser.userId);
        if (myEval) {
          this.existingEvaluation = myEval;
          myEval.scores.forEach((s: any) => {
            const crit = this.criteria.find(c => c.id === s.clo_code);
            if (crit) crit.selectedPoints = s.score_level;
          });
          this.toastService.success('Bạn đã chấm điểm sinh viên này rồi. Bạn có thể sửa điểm nếu cần.');
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  selectLevel(criterion: RubricCriterion, points: number) {
    if (!this.isStage1Open) return;
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

    if (!this.isStage1Open) {
      this.toastService.error('Chưa đến thời gian đánh giá Chặng 1.');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.isSaving = true;
    const payload: EvaluationRequest = {
      student_campaign_id: this.selectedStudent.id,
      evaluator_type: 'COMPANY_SUPERVISOR',
      evaluator_id: currentUser.userId,
      stage: 'STAGE_1',
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
            if (index !== -1) (this.allStudents[index] as any).gradingStatus = 'Đã chấm';
        }
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Có lỗi khi lưu bảng điểm.');
        this.isSaving = false;
      }
    });
  }

  handleError(msg: string): void {
    this.toastService.error(msg);
    this.isLoading = false;
  }
}
