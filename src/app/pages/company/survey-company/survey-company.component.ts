import { Component, OnInit } from '@angular/core';
import { CampaignResponse } from '../../../core/models/base.model';
import { CampaignService } from '../../../core/services/campaign.service';
import { SurveyService } from '../../../core/services/survey.service';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-survey-company',
  templateUrl: './survey-company.component.html',
  styleUrls: ['./survey-company.component.scss']
})
export class SurveyCompanyComponent implements OnInit {
  isLoading = true;
  isLoadingStudents = false;
  campaigns: CampaignResponse[] = [];
  selectedCampaignId: number | null = null;
  students: any[] = [];
  selectedStudent: any = null;

  studentInfo = {
    name: 'Đang tải...',
    id: '-',
    major: '-'
  };

  companyInfo = {
    name: '-',
    instructor: '-',
    position: '-'
  };

  criteriaList = [
    { id: 1, title: 'Kiến thức chuyên môn và khả năng vận dụng thực tế.', level: null as number | null, note: '' },
    { id: 2, title: 'Kỹ năng phân tích và giải quyết vấn đề kỹ thuật.', level: null as number | null, note: '' },
    { id: 3, title: 'Kỹ năng giao tiếp và làm việc nhóm.', level: null as number | null, note: '' },
    { id: 4, title: 'Tinh thần trách nhiệm, tác phong và ý thức kỷ luật.', level: null as number | null, note: '' },
    { id: 5, title: 'Tuân thủ quy định an toàn lao động.', level: null as number | null, note: '' },
    { id: 6, title: 'Sáng tạo, chủ động, đề xuất cải tiến.', level: null as number | null, note: '' }
  ];

  companyLevels = [
    { value: 0, label: 'Kém', activeClass: 'bg-red-50 text-red-700 border-red-200 font-bold', circleClass: 'bg-red-500' },
    { value: 1, label: 'Yếu', activeClass: 'bg-orange-50 text-orange-700 border-orange-200 font-bold', circleClass: 'bg-orange-500' },
    { value: 2, label: 'Trung bình', activeClass: 'bg-yellow-50 text-yellow-800 border-yellow-200 font-bold', circleClass: 'bg-yellow-500 text-slate-900' },
    { value: 3, label: 'Khá', activeClass: 'bg-blue-50 text-blue-700 border-blue-200 font-bold', circleClass: 'bg-blue-600' },
    { value: 4, label: 'Tốt', activeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold', circleClass: 'bg-emerald-600' }
  ];

  getCompletedFieldsCount(): number {
    let completedFields = 0;
    this.criteriaList.forEach(c => {
      if (c.level !== null) completedFields++;
    });
    return completedFields;
  }

  getTotalFieldsCount(): number {
    return this.criteriaList.length;
  }

  getCompletionPercentage(): number {
    const total = this.getTotalFieldsCount();
    const completed = this.getCompletedFieldsCount();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  generalFeedback = '';

  constructor(
    private surveyService: SurveyService,
    private studentCampaignService: StudentCampaignService,
    private campaignService: CampaignService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadCampaigns();
  }

  loadCampaigns() {
    this.isLoading = true;
    this.studentCampaignService.getCompanyStudents().subscribe({
      next: (studentRes) => {
        const scopedStudents = Array.isArray(studentRes) ? studentRes : (studentRes.data || studentRes.payload || []);
        const scopedCampaignIds = new Set(
          scopedStudents
            .map((student: any) => Number(student.campaign_id))
            .filter((id: number) => Number.isFinite(id))
        );

        this.campaignService.getCampaignOptions('ACTIVE').subscribe({
          next: (campaignRes) => {
            const campaigns = Array.isArray(campaignRes) ? campaignRes : (campaignRes.data || campaignRes.payload || []);
            this.campaigns = campaigns.filter((campaign: any) => scopedCampaignIds.has(Number(campaign.id)));
            this.selectedCampaignId = this.campaigns.length > 0 ? this.campaigns[0].id : null;
            this.loadCompanyStudents();
          },
          error: () => {
            this.campaigns = [];
            this.selectedCampaignId = null;
            this.students = [];
            this.selectedStudent = null;
            this.isLoading = false;
          }
        });
      },
      error: () => {
        this.campaigns = [];
        this.selectedCampaignId = null;
        this.students = [];
        this.selectedStudent = null;
        this.isLoading = false;
      }
    });
  }

  loadCompanyStudents(preferredStudentCampaignId?: number | null) {
    if (!this.selectedCampaignId) {
      this.students = [];
      this.selectedStudent = null;
      this.resetForm();
      this.isLoading = false;
      return;
    }

    this.isLoadingStudents = true;
    this.studentCampaignService.getCompanyStudents(this.selectedCampaignId).subscribe({
      next: (res) => {
        this.students = Array.isArray(res) ? res : (res.data || res.payload || []);
        const queryStudentId = this.route.snapshot.queryParamMap.get('student_campaign_id');
        const targetId = preferredStudentCampaignId || (queryStudentId ? +queryStudentId : null);
        const found = targetId ? this.students.find(s => s.id === targetId) : null;

        this.selectedStudent = found || this.students[0] || null;
        this.isLoadingStudents = false;

        if (this.selectedStudent) {
          this.onStudentChange();
        } else {
          this.resetForm();
          this.isLoading = false;
        }
      },
      error: () => {
        this.students = [];
        this.selectedStudent = null;
        this.isLoadingStudents = false;
        this.isLoading = false;
      }
    });
  }

  onCampaignChange() {
    this.selectedStudent = null;
    this.resetForm();
    this.loadCompanyStudents(null);
  }

  onStudentChange() {
    if (!this.selectedStudent) return;
    this.isLoading = true;
    
    this.studentInfo = {
      name: this.selectedStudent.full_name,
      id: this.selectedStudent.student_code,
      major: this.selectedStudent.class_name || 'Kỹ thuật Xây dựng'
    };

    this.companyInfo = {
      name: this.selectedStudent.company_info?.company_name || '-',
      instructor: this.selectedStudent.company_info?.supervisor_name || '-',
      position: this.selectedStudent.company_info?.supervisor_position || '-'
    };

    this.surveyService.getSurvey(this.selectedStudent.id, 'COMPANY_FEEDBACK').subscribe({
      next: (survey) => {
        if (survey && survey.answers) {
          try {
            const parsed = JSON.parse(survey.answers);
            if (parsed.criteriaList) {
              this.criteriaList = this.criteriaList.map(crit => {
                const found = parsed.criteriaList.find((c: any) => c.id === crit.id);
                return found ? { ...crit, level: found.level, note: found.note || '' } : crit;
              });
            }
            if (parsed.generalFeedback !== undefined) {
              this.generalFeedback = parsed.generalFeedback;
            }
          } catch (e) {
            console.error('Error parsing company survey response', e);
          }
        } else {
          this.resetForm();
        }
        this.isLoading = false;
      },
      error: () => {
        this.resetForm();
        this.isLoading = false;
      }
    });
  }

  resetForm() {
    this.criteriaList.forEach(c => {
      c.level = null;
      c.note = '';
    });
    this.generalFeedback = '';
  }

  setLevel(index: number, level: number) {
    this.criteriaList[index].level = level;
  }

  isFormValid(): boolean {
    return this.criteriaList.every(c => c.level !== null);
  }

  submitSurvey() {
    if (!this.selectedStudent) {
      alert('Vui lòng chọn sinh viên để gửi phản hồi.');
      return;
    }

    if (this.isFormValid()) {
      const answers = JSON.stringify({
        criteriaList: this.criteriaList,
        generalFeedback: this.generalFeedback
      });

      this.surveyService.submitSurvey({
        student_campaign_id: this.selectedStudent.id,
        survey_type: 'COMPANY_FEEDBACK',
        answers: answers
      }).subscribe({
        next: () => {
          alert('Cảm ơn Đơn vị đã dành thời gian phản hồi! Ý kiến đã được ghi nhận.');
        },
        error: (err) => {
          alert(err.error?.message || 'Có lỗi xảy ra khi nộp phản hồi.');
        }
      });
    } else {
      alert('Vui lòng đánh giá mức độ cho tất cả các tiêu chí.');
    }
  }
}
