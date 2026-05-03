import { Component } from '@angular/core';

@Component({
  selector: 'app-survey-company',
  templateUrl: './survey-company.component.html',
  styleUrls: ['./survey-company.component.scss']
})
export class SurveyCompanyComponent {
  studentInfo = {
    name: 'Nguyễn Văn A',
    id: '654321',
    major: 'Kỹ thuật Xây dựng'
  };

  companyInfo = {
    name: 'Công ty Cổ phần Tập đoàn Xây dựng ABC',
    instructor: 'Trần Văn B',
    position: 'Kỹ sư trưởng'
  };

  criteriaList = [
    { id: 1, title: 'Kiến thức chuyên môn và khả năng vận dụng thực tế.', level: null as number | null, note: '' },
    { id: 2, title: 'Kỹ năng phân tích và giải quyết vấn đề kỹ thuật.', level: null as number | null, note: '' },
    { id: 3, title: 'Kỹ năng giao tiếp và làm việc nhóm.', level: null as number | null, note: '' },
    { id: 4, title: 'Tinh thần trách nhiệm, tác phong và ý thức kỷ luật.', level: null as number | null, note: '' },
    { id: 5, title: 'Tuân thủ quy định an toàn lao động.', level: null as number | null, note: '' },
    { id: 6, title: 'Sáng tạo, chủ động, đề xuất cải tiến.', level: null as number | null, note: '' }
  ];

  generalFeedback = '';

  setLevel(index: number, level: number) {
    this.criteriaList[index].level = level;
  }

  isFormValid(): boolean {
    return this.criteriaList.every(c => c.level !== null);
  }

  submitSurvey() {
    if (this.isFormValid()) {
      console.log('Company Survey submitted:', { criteria: this.criteriaList, feedback: this.generalFeedback });
      alert('Cảm ơn Đơn vị đã dành thời gian phản hồi!');
    } else {
      alert('Vui lòng đánh giá mức độ cho tất cả các tiêu chí.');
    }
  }
}
