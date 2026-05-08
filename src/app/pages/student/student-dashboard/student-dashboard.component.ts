import { Component, OnInit } from '@angular/core';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { StudentCampaignResponse } from '../../../core/models/base.model';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss']
})
export class StudentDashboardComponent implements OnInit {
  isLoading = true;
  studentName = '';
  studentId = '';
  
  // Trạng thái các luồng (TTTN)
  workflowStatus = {
    tttn01: { status: 'NOT_STARTED', label: 'Tiếp nhận', icon: 'domain' },
    tttn02: { status: 'NOT_STARTED', label: 'Kế hoạch', icon: 'edit_document' },
    tttn03: { status: 'NOT_STARTED', label: 'Nhật ký', icon: 'menu_book' },
    tttn06: { status: 'NOT_STARTED', label: 'Báo cáo', icon: 'description' }
  };

  // Tiến trình thực tập (8 tuần)
  currentWeek = 1;
  totalWeeks = 8;
  progressPercent = 0;

  // Lịch trình sắp tới
  upcomingTasks = [
    { title: 'Nộp nhật ký tuần tiếp theo', deadline: 'Cuối tuần', type: 'info' }
  ];

  // Thông tin liên hệ
  contacts = {
    teacher: { name: 'Chưa phân công', phone: '-', email: '-' },
    companyMentor: { name: 'Chưa có', phone: '-', email: '-' }
  };

  constructor(private studentCampaignService: StudentCampaignService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.studentCampaignService.getMyCampaigns().subscribe({
      next: (res) => {
        const campaigns = Array.isArray(res) ? res : (res.data || res.payload || []);
        if (campaigns.length > 0) {
          const campaign = campaigns[0];
          this.studentName = campaign.full_name;
          this.studentId = campaign.student_code;

          this.updateWorkflowStatus(campaign.status);

          if (campaign.company_info) {
            this.contacts.companyMentor = {
              name: campaign.company_info.supervisor_name || 'Chưa có',
              phone: campaign.company_info.supervisor_phone || '-',
              email: campaign.company_info.supervisor_email || '-'
            };
          }
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  updateWorkflowStatus(status: string) {
    if (status === 'COMPANY_APPROVED' || status === 'PLAN_SUBMITTED' || status === 'PLAN_APPROVED' || status === 'EVALUATED') {
      this.workflowStatus.tttn01.status = 'APPROVED';
    } else if (status === 'COMPANY_DECLARED') {
      this.workflowStatus.tttn01.status = 'PENDING';
    } else {
      this.workflowStatus.tttn01.status = 'NOT_STARTED';
    }

    if (status === 'PLAN_APPROVED' || status === 'EVALUATED') {
      this.workflowStatus.tttn02.status = 'APPROVED';
      this.workflowStatus.tttn03.status = 'PENDING'; // Can start submitting logs
    } else if (status === 'PLAN_SUBMITTED') {
      this.workflowStatus.tttn02.status = 'PENDING';
    } else {
      this.workflowStatus.tttn02.status = 'NOT_STARTED';
    }

    if (status === 'EVALUATED') {
      this.workflowStatus.tttn06.status = 'APPROVED';
      this.workflowStatus.tttn03.status = 'APPROVED';
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'APPROVED': return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'NOT_STARTED': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  }
}
