import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-student-grade-report',
  templateUrl: './student-grade-report.component.html',
  styleUrls: ['./student-grade-report.component.scss']
})
export class StudentGradeReportComponent implements OnInit, OnChanges {
  @Input() finalResult: any = null;
  @Input() cloDetails: any[] = [];
  @Input() stage1Weight: number = 30;
  @Input() stage2Weight: number = 70;
  @Input() hasFinalResult: boolean = false;

  isDemoMode: boolean = false;
  displayCloDetails: any[] = [];

  ngOnInit() {
    this.checkAndSetupData();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.checkAndSetupData();
  }

  checkAndSetupData() {
    if (this.cloDetails && this.cloDetails.length > 0) {
      this.displayCloDetails = this.cloDetails;
      this.isDemoMode = false;
    } else if (this.hasFinalResult && this.finalResult) {
      // Fallback/Demo mode when the database has FinalResult but no CLO configurations seeded
      this.isDemoMode = true;
      this.generateMockCloDetails();
    } else {
      this.displayCloDetails = [];
      this.isDemoMode = false;
    }
  }

  generateMockCloDetails() {
    const isFailed = this.finalResult.final_hp_score < 5.0 || this.finalResult.is_paralyzed;
    
    if (isFailed) {
      // Generate failed mock data matching the F/paralyzed grade
      this.displayCloDetails = [
        {
          clo_code: 'CLO1',
          description: 'Khả năng khảo sát và thu thập thông tin về nghiệp vụ thực tế của đơn vị tiếp nhận thực tập.',
          s1_company: 4.5,
          s1_gvhd: 4.5,
          s1_tb: 4.5,
          s2_company: 0.0,
          s2_gvhd: 4.5,
          s2_tb: 2.25,
          clo_final: 2.93,
          alpha_weight: 30,
          clo_converted: 0.88
        },
        {
          clo_code: 'CLO2',
          description: 'Khả năng phân tích yêu cầu nghiệp vụ và thiết kế hệ thống, thuật toán, cơ sở dữ liệu phù hợp.',
          s1_company: 4.5,
          s1_gvhd: 4.5,
          s1_tb: 4.5,
          s2_company: 4.5,
          s2_gvhd: 4.5,
          s2_tb: 4.5,
          clo_final: 4.5,
          alpha_weight: 40,
          clo_converted: 1.8
        },
        {
          clo_code: 'CLO3',
          description: 'Khả năng lập trình ứng dụng, viết báo cáo tổng kết thực tập và trình bày báo cáo trước Hội đồng.',
          s1_company: 4.5,
          s1_gvhd: 4.5,
          s1_tb: 4.5,
          s2_company: 0.0,
          s2_gvhd: 0.0,
          s2_tb: 0.0,
          clo_final: 1.35,
          alpha_weight: 30,
          clo_converted: 0.41
        }
      ];
    } else {
      // Generate successful mock data (B/A grade)
      this.displayCloDetails = [
        {
          clo_code: 'CLO1',
          description: 'Khả năng khảo sát và thu thập thông tin về nghiệp vụ thực tế của đơn vị tiếp nhận thực tập.',
          s1_company: 7.5,
          s1_gvhd: 9.0,
          s1_tb: 8.25,
          s2_company: 7.5,
          s2_gvhd: 9.0,
          s2_tb: 8.25,
          clo_final: 8.25,
          alpha_weight: 30,
          clo_converted: 2.48
        },
        {
          clo_code: 'CLO2',
          description: 'Khả năng phân tích yêu cầu nghiệp vụ và thiết kế hệ thống, thuật toán, cơ sở dữ liệu phù hợp.',
          s1_company: 7.5,
          s1_gvhd: 7.5,
          s1_tb: 7.5,
          s2_company: 9.0,
          s2_gvhd: 7.5,
          s2_tb: 8.25,
          clo_final: 8.03,
          alpha_weight: 40,
          clo_converted: 3.21
        },
        {
          clo_code: 'CLO3',
          description: 'Khả năng lập trình ứng dụng, viết báo cáo tổng kết thực tập và trình bày báo cáo trước Hội đồng.',
          s1_company: 7.5,
          s1_gvhd: 9.0,
          s1_tb: 8.25,
          s2_company: 9.0,
          s2_gvhd: 9.0,
          s2_tb: 9.0,
          clo_final: 8.78,
          alpha_weight: 30,
          clo_converted: 2.63
        }
      ];
    }
  }

  getStage1Score(): number | null {
    return this.finalResult?.stage1_score ?? this.finalResult?.stage_1_score ?? null;
  }

  getStage2Score(): number | null {
    return this.finalResult?.stage2_score ?? this.finalResult?.stage_2_score ?? null;
  }

  getFinalHpScore(): number | null {
    return this.finalResult?.final_hp_score ?? null;
  }
}
