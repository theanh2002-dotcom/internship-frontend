import { Component, OnInit } from '@angular/core';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { DepartmentCampaignService } from '../../../core/services/department-campaign.service';
import { EvaluationService, EvaluationRequest } from '../../../core/services/evaluation.service';
import { AuthService } from '../../../core/services/auth.service';
import { StudentCampaignResponse } from '../../../core/models/base.model';

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
  
  students: StudentCampaignResponse[] = [];
  selectedStudent: StudentCampaignResponse | null = null;
  
  criteria: RubricCriterion[] = [];
  existingEvaluation: any = null;
  
  successMessage = '';
  errorMessage = '';

  constructor(
    private studentCampaignService: StudentCampaignService,
    private departmentCampaignService: DepartmentCampaignService,
    private evaluationService: EvaluationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadEligibleStudents();
  }

  loadEligibleStudents(): void {
    this.isLoading = true;
    this.studentCampaignService.getMyAssignedStudents().subscribe({
      next: (res) => {
        const all = Array.isArray(res) ? res : (res.data || res.payload || []);
        this.students = all.filter((s: any) => s.status === 'PLAN_APPROVED' || s.status === 'COMPLETED');
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Lỗi tải danh sách sinh viên.';
      }
    });
  }

  selectStudent(student: StudentCampaignResponse): void {
    this.selectedStudent = student;
    this.criteria = [];
    this.existingEvaluation = null;
    this.successMessage = '';
    this.errorMessage = '';
    this.loadRubricConfig();
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

    this.evaluationService.findEvaluations(this.selectedStudent.id).subscribe({
      next: (res) => {
        const evaluations = Array.isArray(res) ? res : (res.data || res.payload || []);
        // Tìm bài chấm của GVHD này
        const myEval = evaluations.find((e: any) => e.evaluator_type === 'GVHD' && e.evaluator_id === currentUser.userId);
        if (myEval) {
          this.existingEvaluation = myEval;
          // Fill lại điểm cũ
          myEval.scores.forEach((s: any) => {
            const crit = this.criteria.find(c => c.id === s.clo_code);
            if (crit) crit.selectedPoints = s.score_level;
          });
          this.successMessage = 'Bạn đã chấm điểm sinh viên này rồi. Bạn có thể sửa điểm nếu cần.';
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  selectLevel(criterion: RubricCriterion, points: number) {
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
      this.errorMessage = 'Vui lòng chấm điểm cho tất cả tiêu chí.';
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: EvaluationRequest = {
      student_campaign_id: this.selectedStudent.id,
      evaluator_type: 'GVHD',
      evaluator_id: currentUser.userId,
      stage: 'STAGE_1',
      scores: this.criteria.map(c => ({
        clo_code: c.id,
        score_level: c.selectedPoints!
      }))
    };

    this.evaluationService.submitEvaluation(payload).subscribe({
      next: () => {
        this.successMessage = 'Lưu bảng điểm thành công!';
        this.isSaving = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Có lỗi khi lưu bảng điểm.';
        this.isSaving = false;
      }
    });
  }

  handleError(msg: string): void {
    this.errorMessage = msg;
    this.isLoading = false;
  }
}
