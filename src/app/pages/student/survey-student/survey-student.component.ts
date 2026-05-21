import { Component, OnInit } from '@angular/core';
import { SurveyService } from '../../../core/services/survey.service';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-survey-student',
  templateUrl: './survey-student.component.html',
  styleUrls: ['./survey-student.component.scss']
})
export class SurveyStudentComponent implements OnInit {
  isLoading = true;
  studentCampaignId: number | null = null;
  isSubmitted = false;

  generalSatisfaction = {
    sat_gvhd: null as number | null,
    sat_dvtt: null as number | null,
    sat_phuhop: null as number | null,
    sat_dk: null as number | null
  };

  closAssessment = [
    { id: 'clo1', title: 'CLO1: Áp dụng kiến thức chuyên ngành vào thực tiễn.', level: null as number | null, evidence: '' },
    { id: 'clo2', title: 'CLO2: Kỹ năng giải quyết vấn đề kỹ thuật.', level: null as number | null, evidence: '' },
    { id: 'clo3', title: 'CLO3: Kỹ năng làm việc nhóm và giao tiếp.', level: null as number | null, evidence: '' }
  ];

  openFeedback = {
    skillsLearned: '',
    difficulties: '',
    suggestions: ''
  };

  ratingLabels = [
    { value: 1, label: 'Rất tệ', emoji: 'sentiment_very_dissatisfied', activeClass: 'border-red-500 bg-red-50 text-red-600' },
    { value: 2, label: 'Không tốt', emoji: 'sentiment_dissatisfied', activeClass: 'border-orange-500 bg-orange-50 text-orange-600' },
    { value: 3, label: 'Tạm ổn', emoji: 'sentiment_neutral', activeClass: 'border-yellow-500 bg-yellow-50 text-yellow-600' },
    { value: 4, label: 'Hài lòng', emoji: 'sentiment_satisfied', activeClass: 'border-emerald-500 bg-emerald-50 text-emerald-600' },
    { value: 5, label: 'Rất tốt', emoji: 'sentiment_very_satisfied', activeClass: 'border-blue-600 bg-blue-50 text-blue-700' }
  ];

  cloLevels = [
    { value: 0, label: 'Mức 0', title: 'Chưa đạt', activeClass: 'bg-red-50 text-red-700 border-red-200 font-bold', circleClass: 'bg-red-500' },
    { value: 1, label: 'Mức 1', title: 'Biết', activeClass: 'bg-orange-50 text-orange-700 border-orange-200 font-bold', circleClass: 'bg-orange-500' },
    { value: 2, label: 'Mức 2', title: 'Hiểu', activeClass: 'bg-yellow-50 text-yellow-800 border-yellow-200 font-bold', circleClass: 'bg-yellow-500 text-slate-900' },
    { value: 3, label: 'Mức 3', title: 'Áp dụng', activeClass: 'bg-blue-50 text-blue-700 border-blue-200 font-bold', circleClass: 'bg-blue-600' },
    { value: 4, label: 'Mức 4', title: 'Phân tích & Sáng tạo', activeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold', circleClass: 'bg-emerald-600' }
  ];

  constructor(
    private surveyService: SurveyService,
    private studentCampaignService: StudentCampaignService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStudentCampaign();
  }

  loadStudentCampaign(): void {
    this.studentCampaignService.getMyCampaigns().subscribe({
      next: (res) => {
        const campaigns = Array.isArray(res) ? res : (res.data || res.payload || []);
        if (campaigns.length > 0) {
          this.studentCampaignId = campaigns[0].id;
          if (this.studentCampaignId) {
            this.loadExistingSurvey();
          } else {
            this.isLoading = false;
          }
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  loadExistingSurvey(): void {
    if (!this.studentCampaignId) return;

    this.surveyService.getSurvey(this.studentCampaignId, 'STUDENT_FEEDBACK').subscribe({
      next: (survey) => {
        if (survey) {
          this.isSubmitted = true;
          if (survey.answers) {
            try {
              const parsed = JSON.parse(survey.answers);
              if (parsed.generalSatisfaction) {
                this.generalSatisfaction = { ...this.generalSatisfaction, ...parsed.generalSatisfaction };
              }
              if (parsed.closAssessment) {
                // Map existing CLO levels
                this.closAssessment = this.closAssessment.map(clo => {
                  const found = parsed.closAssessment.find((c: any) => c.id === clo.id);
                  return found ? { ...clo, level: found.level, evidence: found.evidence || '' } : clo;
                });
              }
              if (parsed.openFeedback) {
                this.openFeedback = { ...this.openFeedback, ...parsed.openFeedback };
              }
            } catch (e) {
              console.error('Error parsing existing survey answers', e);
            }
          }
        }
        this.isLoading = false;
      },
      error: () => {
        // No survey found or error, just stop loading
        this.isLoading = false;
      }
    });
  }

  setSatisfaction(field: keyof typeof this.generalSatisfaction, value: number) {
    if (this.isSubmitted) return;
    this.generalSatisfaction[field] = value;
  }

  setCloLevel(index: number, value: number) {
    if (this.isSubmitted) return;
    this.closAssessment[index].level = value;
  }

  isFormValid(): boolean {
    const isSatisfactionComplete = Object.values(this.generalSatisfaction).every(val => val !== null);
    const isCloComplete = this.closAssessment.every(clo => clo.level !== null);
    return isSatisfactionComplete && isCloComplete;
  }

  getCompletedFieldsCount(): number {
    let completedFields = 0;
    if (this.generalSatisfaction.sat_gvhd !== null) completedFields++;
    if (this.generalSatisfaction.sat_dvtt !== null) completedFields++;
    if (this.generalSatisfaction.sat_phuhop !== null) completedFields++;
    if (this.generalSatisfaction.sat_dk !== null) completedFields++;
    this.closAssessment.forEach(clo => {
      if (clo.level !== null) completedFields++;
    });
    return completedFields;
  }

  getTotalFieldsCount(): number {
    return 4 + this.closAssessment.length;
  }

  getCompletionPercentage(): number {
    const total = this.getTotalFieldsCount();
    const completed = this.getCompletedFieldsCount();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  submitSurvey() {
    if (!this.studentCampaignId) {
      alert('Không tìm thấy thông tin đợt thực tập của sinh viên.');
      return;
    }

    if (this.isFormValid()) {
      const answers = JSON.stringify({
        generalSatisfaction: this.generalSatisfaction,
        closAssessment: this.closAssessment,
        openFeedback: this.openFeedback
      });

      this.surveyService.submitSurvey({
        student_campaign_id: this.studentCampaignId,
        survey_type: 'STUDENT_FEEDBACK',
        answers: answers
      }).subscribe({
        next: () => {
          alert('Khảo sát đã được gửi thành công!');
          this.router.navigate(['/student/dashboard']);
        },
        error: (err) => {
          alert(err.error?.message || 'Có lỗi xảy ra khi nộp khảo sát.');
        }
      });
    } else {
      alert('Vui lòng điền đầy đủ các đánh giá bắt buộc (Mức độ hài lòng & Tự đánh giá CLO).');
    }
  }
}
