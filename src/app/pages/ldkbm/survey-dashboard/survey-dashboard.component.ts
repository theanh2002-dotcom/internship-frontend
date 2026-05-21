import { Component, OnInit } from '@angular/core';
import { CampaignService } from '../../../core/services/campaign.service';
import { DepartmentCampaignService } from '../../../core/services/department-campaign.service';
import { SurveyService } from '../../../core/services/survey.service';
import { AuthService } from '../../../core/services/auth.service';
import { CampaignResponse } from '../../../core/models/base.model';
import { FinalResultService } from '../../../core/services/final-result.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-survey-dashboard',
  templateUrl: './survey-dashboard.component.html',
  styleUrls: ['./survey-dashboard.component.scss']
})
export class SurveyDashboardComponent implements OnInit {
  isLoading = true;
  campaigns: CampaignResponse[] = [];
  selectedCampaignId: number | null = null;
  departmentId: number | null = null;
  departmentCampaignId: number | null = null;
  surveys: any[] = [];
  studentsList: any[] = [];

  studentStats = {
    totalResponses: 0,
    averageRating: 0,
    recommendCompany: 0,
  };

  companyStats = {
    totalResponses: 0,
    averageRating: 0,
    hireAgain: 0,
  };

  studentQuestions: any[] = [];
  companyQuestions: any[] = [];

  constructor(
    private campaignService: CampaignService,
    private deptCampaignService: DepartmentCampaignService,
    private surveyService: SurveyService,
    private finalResultService: FinalResultService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.departmentId) {
      this.departmentId = user.departmentId;
    }
    this.loadCampaigns();
  }

  loadCampaigns(): void {
    this.campaignService.getCampaigns({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        this.campaigns = res.data || [];
        if (this.campaigns.length > 0) {
          this.selectedCampaignId = this.campaigns[0].id;
          this.onCampaignChange();
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onCampaignChange(): void {
    if (!this.selectedCampaignId || !this.departmentId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.deptCampaignService.findOrCreate(this.selectedCampaignId, this.departmentId).subscribe({
      next: (res) => {
        this.departmentCampaignId = res.id;
        if (this.departmentCampaignId) {
          this.loadSurveys();
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  loadSurveys(): void {
    if (!this.departmentCampaignId) return;

    this.isLoading = true;
    this.finalResultService.getFinalResultsByCampaign(this.departmentCampaignId).subscribe({
      next: (students) => {
        this.studentsList = students || [];
        this.fetchSurveysData();
      },
      error: () => {
        this.studentsList = [];
        this.fetchSurveysData();
      }
    });
  }

  fetchSurveysData(): void {
    if (!this.departmentCampaignId) return;

    this.surveyService.getSurveysByCampaign(this.departmentCampaignId).subscribe({
      next: (res) => {
        this.surveys = res || [];
        this.calculateStats(this.surveys);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  calculateStats(surveys: any[]): void {
    const studentSurveys = surveys.filter(s => s.survey_type === 'STUDENT_FEEDBACK');
    const companySurveys = surveys.filter(s => s.survey_type === 'COMPANY_FEEDBACK');

    // 1. Student stats
    let totalStudentAvg = 0;
    let studentRatingsCount = 0;
    let recommendCount = 0;
    
    let sumGvhd = 0, countGvhd = 0;
    let sumDvtt = 0, countDvtt = 0;
    let sumPhuhop = 0, countPhuhop = 0;
    let sumDk = 0, countDk = 0;

    studentSurveys.forEach(s => {
      try {
        const parsed = JSON.parse(s.answers);
        const sat = parsed.generalSatisfaction;
        if (sat) {
          const vals = [];
          if (sat.sat_gvhd !== null && sat.sat_gvhd !== undefined) {
            vals.push(sat.sat_gvhd);
            sumGvhd += sat.sat_gvhd;
            countGvhd++;
          }
          if (sat.sat_dvtt !== null && sat.sat_dvtt !== undefined) {
            vals.push(sat.sat_dvtt);
            sumDvtt += sat.sat_dvtt;
            countDvtt++;
            if (sat.sat_dvtt >= 4) {
              recommendCount++;
            }
          }
          if (sat.sat_phuhop !== null && sat.sat_phuhop !== undefined) {
            vals.push(sat.sat_phuhop);
            sumPhuhop += sat.sat_phuhop;
            countPhuhop++;
          }
          if (sat.sat_dk !== null && sat.sat_dk !== undefined) {
            vals.push(sat.sat_dk);
            sumDk += sat.sat_dk;
            countDk++;
          }
          if (vals.length > 0) {
            totalStudentAvg += (vals.reduce((a, b) => a + b, 0) / vals.length);
            studentRatingsCount++;
          }
        }
      } catch (e) {
        console.error('Error parsing student survey response', e);
      }
    });

    const studentAvg = studentRatingsCount > 0 ? (totalStudentAvg / studentRatingsCount) : 0;
    const recommendPercent = studentSurveys.length > 0 ? Math.round((recommendCount / studentSurveys.length) * 100) : 0;

    this.studentStats = {
      totalResponses: studentSurveys.length,
      averageRating: parseFloat(studentAvg.toFixed(1)),
      recommendCompany: recommendPercent
    };

    const avgGvhdVal = countGvhd > 0 ? (sumGvhd / countGvhd) : 0;
    const avgDvttVal = countDvtt > 0 ? (sumDvtt / countDvtt) : 0;
    const avgPhuhopVal = countPhuhop > 0 ? (sumPhuhop / countPhuhop) : 0;
    const avgDkVal = countDk > 0 ? (sumDk / countDk) : 0;

    this.studentQuestions = [
      { text: 'Chất lượng hướng dẫn từ GVHD', rating: parseFloat(avgGvhdVal.toFixed(1)), width: `${(avgGvhdVal / 5) * 100}%` },
      { text: 'Chất lượng hỗ trợ từ Đơn vị thực tập', rating: parseFloat(avgDvttVal.toFixed(1)), width: `${(avgDvttVal / 5) * 100}%` },
      { text: 'Sự phù hợp của công việc với chuyên môn', rating: parseFloat(avgPhuhopVal.toFixed(1)), width: `${(avgPhuhopVal / 5) * 100}%` },
      { text: 'Điều kiện làm việc và an toàn', rating: parseFloat(avgDkVal.toFixed(1)), width: `${(avgDkVal / 5) * 100}%` },
    ];

    // 2. Company stats
    let totalCompanyAvg = 0;
    let companyRatingsCount = 0;
    let hireAgainCount = 0;

    const criteriaTitles = [
      'Kiến thức chuyên môn và khả năng vận dụng thực tế',
      'Kỹ năng phân tích và giải quyết vấn đề kỹ thuật',
      'Kỹ năng giao tiếp và làm việc nhóm',
      'Tinh thần trách nhiệm, tác phong và ý thức kỷ luật',
      'Tuân thủ quy định an toàn lao động',
      'Sáng tạo, chủ động, đề xuất cải tiến'
    ];

    const companyCritSums = Array(criteriaTitles.length).fill(0);
    const companyCritCounts = Array(criteriaTitles.length).fill(0);

    companySurveys.forEach(s => {
      try {
        const parsed = JSON.parse(s.answers);
        const list = parsed.criteriaList;
        if (list && list.length > 0) {
          const vals = [];
          for (let i = 0; i < criteriaTitles.length; i++) {
            const found = list.find((c: any) => c.id === (i + 1));
            if (found && found.level !== null && found.level !== undefined) {
              const rVal = found.level + 1; // scale 0-4 to 1-5
              vals.push(rVal);
              companyCritSums[i] += rVal;
              companyCritCounts[i]++;
            }
          }
          if (vals.length > 0) {
            const respAvg = (vals.reduce((a, b) => a + b, 0) / vals.length);
            totalCompanyAvg += respAvg;
            companyRatingsCount++;
            if (respAvg >= 4.0) {
              hireAgainCount++;
            }
          }
        }
      } catch (e) {
        console.error('Error parsing company survey response', e);
      }
    });

    const companyAvg = companyRatingsCount > 0 ? (totalCompanyAvg / companyRatingsCount) : 0;
    const hireAgainPercent = companySurveys.length > 0 ? Math.round((hireAgainCount / companySurveys.length) * 100) : 0;

    this.companyStats = {
      totalResponses: companySurveys.length,
      averageRating: parseFloat(companyAvg.toFixed(1)),
      hireAgain: hireAgainPercent
    };

    this.companyQuestions = criteriaTitles.map((title, idx) => {
      const count = companyCritCounts[idx];
      const avg = count > 0 ? (companyCritSums[idx] / count) : 0;
      return {
        text: title,
        rating: parseFloat(avg.toFixed(1)),
        width: `${(avg / 5) * 100}%`
      };
    });
  }

  exportExcel(): void {
    if (!this.selectedCampaignId) return;
    const campaignName = this.campaigns.find(c => c.id === +this.selectedCampaignId!)?.name || 'Đợt thực tập';

    // 1. Sheet 1: Tổng quan
    const overviewData = [
      { 'Hạng mục': 'BÁO CÁO TỔNG HỢP KHẢO SÁT PHẢN HỒI (TTTN-08)', 'Giá trị': '' },
      { 'Hạng mục': 'Tên đợt thực tập', 'Giá trị': campaignName },
      { 'Hạng mục': 'Ngày xuất báo cáo', 'Giá trị': new Date().toLocaleDateString('vi-VN') },
      { 'Hạng mục': '', 'Giá trị': '' },
      { 'Hạng mục': 'ĐÁNH GIÁ TỪ SINH VIÊN', 'Giá trị': '' },
      { 'Hạng mục': 'Tổng số lượt phản hồi (SV)', 'Giá trị': this.studentStats.totalResponses },
      { 'Hạng mục': 'Điểm đánh giá trung bình (SV)', 'Giá trị': this.studentStats.averageRating },
      { 'Hạng mục': 'Tỷ lệ sẵn sàng giới thiệu ĐVHD (%)', 'Giá trị': this.studentStats.recommendCompany + '%' },
      { 'Hạng mục': '', 'Giá trị': '' },
      { 'Hạng mục': 'ĐÁNH GIÁ TỪ DOANH NGHIỆP', 'Giá trị': '' },
      { 'Hạng mục': 'Tổng số lượt phản hồi (DN)', 'Giá trị': this.companyStats.totalResponses },
      { 'Hạng mục': 'Điểm đánh giá trung bình (DN)', 'Giá trị': this.companyStats.averageRating },
      { 'Hạng mục': 'Tỷ lệ sinh viên đạt loại Tốt trở lên (%)', 'Giá trị': this.companyStats.hireAgain + '%' }
    ];

    const getStudentInfo = (studentCampaignId: number) => {
      const student = this.studentsList.find(s => s.student_campaign_id === studentCampaignId);
      return student ? {
        name: student.full_name,
        code: student.student_code,
        class: student.class_name
      } : {
        name: 'Ẩn danh',
        code: '-',
        class: '-'
      };
    };

    // 2. Sheet 2: Chi tiết Sinh viên
    const studentSurveys = this.surveys.filter(s => s.survey_type === 'STUDENT_FEEDBACK');
    const studentRows = studentSurveys.map((s, index) => {
      let answersObj: any = {};
      try {
        answersObj = JSON.parse(s.answers);
      } catch (e) {}

      const sat = answersObj.generalSatisfaction || {};
      const open = answersObj.openFeedback || {};
      const stdInfo = getStudentInfo(s.student_campaign_id);

      return {
        'STT': index + 1,
        'Mã SV': stdInfo.code,
        'Họ và tên SV': stdInfo.name,
        'Lớp': stdInfo.class,
        'Hài lòng GVHD (1-5)': sat.sat_gvhd || '-',
        'Hài lòng ĐVTT (1-5)': sat.sat_dvtt || '-',
        'Phù hợp chuyên môn (1-5)': sat.sat_phuhop || '-',
        'Điều kiện an toàn (1-5)': sat.sat_dk || '-',
        'Kỹ năng học được': open.skillsLearned || '-',
        'Khó khăn gặp phải': open.difficulties || '-',
        'Đề xuất kiến nghị': open.suggestions || '-',
        'Thời gian nộp': s.created_at || '-'
      };
    });

    // 3. Sheet 3: Chi tiết Doanh nghiệp
    const companySurveys = this.surveys.filter(s => s.survey_type === 'COMPANY_FEEDBACK');
    const companyRows = companySurveys.map((s, index) => {
      let answersObj: any = {};
      try {
        answersObj = JSON.parse(s.answers);
      } catch (e) {}

      const criteria = answersObj.criteriaList || [];
      const getCritLevel = (id: number) => {
        const found = criteria.find((c: any) => c.id === id);
        return found && found.level !== null ? (found.level + 1) : '-'; // level is 0-4
      };
      const stdInfo = getStudentInfo(s.student_campaign_id);

      return {
        'STT': index + 1,
        'Mã SV': stdInfo.code,
        'Họ và tên SV': stdInfo.name,
        'Lớp': stdInfo.class,
        'Kiến thức chuyên môn (1-5)': getCritLevel(1),
        'Kỹ năng phân tích (1-5)': getCritLevel(2),
        'Kỹ năng giao tiếp (1-5)': getCritLevel(3),
        'Tinh thần trách nhiệm (1-5)': getCritLevel(4),
        'Tuân thủ an toàn (1-5)': getCritLevel(5),
        'Sáng tạo chủ động (1-5)': getCritLevel(6),
        'Nhận xét chung': answersObj.generalFeedback || '-',
        'Thời gian nộp': s.created_at || '-'
      };
    });

    // Create workbook and add sheets
    const wb = XLSX.utils.book_new();

    const wsOverview = XLSX.utils.json_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Tổng quan');

    const wsStudent = XLSX.utils.json_to_sheet(studentRows);
    XLSX.utils.book_append_sheet(wb, wsStudent, 'Ý kiến Sinh viên');

    const wsCompany = XLSX.utils.json_to_sheet(companyRows);
    XLSX.utils.book_append_sheet(wb, wsCompany, 'Ý kiến Doanh nghiệp');

    // Write file
    XLSX.writeFile(wb, `BaoCao_KhaoSat_TTTN_${this.selectedCampaignId}.xlsx`);
  }

  printReport(): void {
    window.print();
  }
}
