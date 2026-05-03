import { Component } from '@angular/core';

@Component({
  selector: 'app-survey-student',
  templateUrl: './survey-student.component.html',
  styleUrls: ['./survey-student.component.scss']
})
export class SurveyStudentComponent {
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

  setSatisfaction(field: keyof typeof this.generalSatisfaction, value: number) {
    this.generalSatisfaction[field] = value;
  }

  setCloLevel(index: number, value: number) {
    this.closAssessment[index].level = value;
  }

  isFormValid(): boolean {
    const isSatisfactionComplete = Object.values(this.generalSatisfaction).every(val => val !== null);
    const isCloComplete = this.closAssessment.every(clo => clo.level !== null);
    return isSatisfactionComplete && isCloComplete;
  }

  submitSurvey() {
    if (this.isFormValid()) {
      console.log('General Satisfaction:', this.generalSatisfaction);
      console.log('CLOs Assessment:', this.closAssessment);
      console.log('Open Feedback:', this.openFeedback);
      alert('Khảo sát đã được gửi thành công!');
    } else {
      alert('Vui lòng điền đầy đủ các đánh giá bắt buộc (Mức độ hài lòng & Tự đánh giá CLO).');
    }
  }
}
