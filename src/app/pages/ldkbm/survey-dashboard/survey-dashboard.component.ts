import { Component } from '@angular/core';

@Component({
  selector: 'app-survey-dashboard',
  templateUrl: './survey-dashboard.component.html',
  styleUrls: ['./survey-dashboard.component.scss']
})
export class SurveyDashboardComponent {
  studentStats = {
    totalResponses: 120,
    averageRating: 4.2,
    recommendCompany: 85, // percentage
  };

  companyStats = {
    totalResponses: 45,
    averageRating: 4.5,
    hireAgain: 92, // percentage
  };

  studentQuestions = [
    { text: 'Môi trường làm việc chuyên nghiệp', rating: 4.3, width: '86%' },
    { text: 'Đơn vị hướng dẫn tận tình', rating: 4.5, width: '90%' },
    { text: 'Chính sách hỗ trợ hợp lý', rating: 3.8, width: '76%' },
    { text: 'Công việc phù hợp chuyên ngành', rating: 4.2, width: '84%' },
  ];

  companyQuestions = [
    { text: 'Sinh viên có kiến thức chuyên môn tốt', rating: 4.2, width: '84%' },
    { text: 'Kỹ năng mềm đạt yêu cầu', rating: 4.1, width: '82%' },
    { text: 'Sự hỗ trợ từ Nhà trường kịp thời', rating: 4.6, width: '92%' },
    { text: 'Chương trình đào tạo phù hợp', rating: 4.3, width: '86%' },
  ];
}
