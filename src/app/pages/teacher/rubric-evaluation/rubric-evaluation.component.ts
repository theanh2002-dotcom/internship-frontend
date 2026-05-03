import { Component } from '@angular/core';

interface RubricLevel {
  label: string;
  description: string;
  points: number;
}

interface RubricCriterion {
  id: number;
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
export class RubricEvaluationComponent {
  student = {
    name: 'Trần Minh Khang',
    mssv: '64PM2024',
    class: '64PM2',
    topic: 'Xây dựng hệ thống quản lý thực tập sinh'
  };

  evaluators = [
    { name: 'TS. Lê Anh Tuấn', role: 'GVHD (Bạn)', status: 'Đang chấm', color: 'blue' },
    { name: 'ThS. Nguyễn Quang Minh', role: 'GV Phản biện', status: 'Đã hoàn thành', color: 'green' },
    { name: 'Ông Trần Đức', role: 'ĐVHD', status: 'Chưa chấm', color: 'gray' }
  ];

  criteria: RubricCriterion[] = [
    {
      id: 1,
      name: 'Thái độ & Kỷ luật (CLO 4)',
      description: 'Đánh giá ý thức tuân thủ kỷ luật, chuyên cần và đạo đức nghề nghiệp.',
      maxScore: 2.0,
      levels: [
        { label: 'Mức 0', description: 'Không tuân thủ giờ giấc, thiếu ý thức.', points: 0.0 },
        { label: 'Mức 1', description: 'Tuân thủ chưa tốt, còn vi phạm.', points: 0.5 },
        { label: 'Mức 2', description: 'Tuân thủ cơ bản quy định.', points: 1.0 },
        { label: 'Mức 3', description: 'Ý thức tốt, luôn đúng giờ.', points: 1.5 },
        { label: 'Mức 4', description: 'Tuyệt đối tuân thủ, gương mẫu.', points: 2.0 }
      ]
    },
    {
      id: 2,
      name: 'Kỹ năng chuyên môn (CLO 1, CLO 2)',
      description: 'Khả năng phân tích, giải quyết vấn đề và vận dụng kiến thức.',
      maxScore: 4.0,
      levels: [
        { label: 'Mức 0', description: 'Không nắm bắt được công việc.', points: 0.0 },
        { label: 'Mức 1', description: 'Vận dụng yếu, sai sót nhiều.', points: 1.0 },
        { label: 'Mức 2', description: 'Làm được việc nhưng cần hướng dẫn nhiều.', points: 2.0 },
        { label: 'Mức 3', description: 'Vận dụng tốt, ít sai sót.', points: 3.0 },
        { label: 'Mức 4', description: 'Xuất sắc, chủ động đề xuất giải pháp tối ưu.', points: 4.0 }
      ]
    },
    {
      id: 3,
      name: 'Kỹ năng mềm & Báo cáo (CLO 3, CLO 5)',
      description: 'Kỹ năng làm việc nhóm, giao tiếp và chất lượng báo cáo tổng kết.',
      maxScore: 4.0,
      levels: [
        { label: 'Mức 0', description: 'Không làm việc nhóm được, báo cáo sơ sài.', points: 0.0 },
        { label: 'Mức 1', description: 'Giao tiếp kém, báo cáo thiếu logic.', points: 1.0 },
        { label: 'Mức 2', description: 'Kỹ năng cơ bản, báo cáo đạt yêu cầu tối thiểu.', points: 2.0 },
        { label: 'Mức 3', description: 'Làm việc nhóm tốt, báo cáo rõ ràng.', points: 3.0 },
        { label: 'Mức 4', description: 'Kỹ năng nổi trội, báo cáo chuyên nghiệp, chuẩn xác.', points: 4.0 }
      ]
    }
  ];

  selectLevel(criterion: RubricCriterion, points: number) {
    criterion.selectedPoints = points;
  }

  getTotalScore(): number {
    return this.criteria.reduce((total, c) => total + (c.selectedPoints || 0), 0);
  }

  submitEvaluation() {
    console.log('Đã nộp đánh giá cho sinh viên', this.student.mssv, 'với tổng điểm:', this.getTotalScore());
  }
}
