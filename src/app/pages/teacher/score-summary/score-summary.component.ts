import { Component, OnInit } from '@angular/core';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { EvaluationService } from '../../../core/services/evaluation.service';
import { StudentCampaignResponse } from '../../../core/models/base.model';
import { ToastService } from '../../../core/services/toast.service';

interface StudentScore {
  mssv: string;
  name: string;
  class: string;
  stage1Score: number | null; // Điểm Chặng 1
  stage2Score: number | null; // Điểm Chặng 2
  totalScore: number | null;  // Điểm tổng hợp
  status: string;
}

@Component({
  selector: 'app-score-summary',
  templateUrl: './score-summary.component.html',
  styleUrls: ['./score-summary.component.scss']
})
export class ScoreSummaryComponent implements OnInit {
  isLoading = true;
  students: StudentScore[] = [];

  constructor(
    private studentCampaignService: StudentCampaignService,
    private evaluationService: EvaluationService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.studentCampaignService.getMyAssignedStudents().subscribe({
      next: (res) => {
        const studentCampaigns = Array.isArray(res) ? res : (res.data || res.payload || []);
        this.processStudents(studentCampaigns);
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  processStudents(campaigns: StudentCampaignResponse[]): void {
    let completedCount = 0;
    this.students = campaigns.map(sc => ({
      mssv: sc.student_code,
      name: sc.full_name,
      class: sc.class_name || 'N/A',
      stage1Score: null,
      stage2Score: null,
      totalScore: null,
      status: 'Chưa có kết quả',
      id: sc.id
    }));

    if (this.students.length === 0) {
      this.isLoading = false;
      return;
    }

    // Lấy điểm cho từng sinh viên
    this.students.forEach(s => {
      this.evaluationService.getFinalResult((s as any).id).subscribe({
        next: (scoreRes) => {
          if (!scoreRes) return;
          const finalData = scoreRes.stage1_score !== undefined ? scoreRes : (scoreRes.data || scoreRes.payload);
          if (finalData) {
            s.stage1Score = finalData.stage1_score;
            s.stage2Score = finalData.stage2_score;
            s.totalScore = finalData.final_hp_score;
            
            if (finalData.grade_level) {
               s.status = finalData.grade_level !== 'F' ? 'Đạt' : 'Không đạt';
            }
          }
        },
        error: () => {
          // Chưa có điểm
        },
        complete: () => {
          completedCount++;
          if (completedCount === this.students.length) {
            this.isLoading = false;
          }
        }
      });
    });
  }

  get totalStudents(): number { return this.students.length; }
  get studentsWithResult(): number { return this.students.filter(s => s.status === 'Đạt' || s.status === 'Không đạt').length; }
  get studentsPassed(): number { return this.students.filter(s => s.status === 'Đạt').length; }
  get studentsFailed(): number { return this.students.filter(s => s.status === 'Không đạt').length; }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Đạt': return 'bg-green-100 text-green-800 border-green-200';
      case 'Không đạt': return 'bg-red-100 text-red-800 border-red-200';
      case 'Chưa có kết quả': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return '';
    }
  }

  exportExcel() {
    console.log('Exporting to Excel...');
    this.toastService.info('Tính năng xuất Excel đang được xử lý...');
  }
}

