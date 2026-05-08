import { Component, OnInit } from '@angular/core';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { WeeklyLogService } from '../../../core/services/weekly-log.service';
@Component({
  selector: 'app-manage-interns',
  templateUrl: './manage-interns.component.html',
  styleUrls: ['./manage-interns.component.scss']
})
export class ManageInternsComponent implements OnInit {
  interns: any[] = [];
  selectedIntern: any = null;
  actionType: 'PLAN' | 'LOG' | 'DECLARATION' | null = null;
  showModal = false;
  
  // Weekly logs tracking: { [studentCampaignId]: WeeklyLog[] }
  weeklyLogs: { [key: number]: any[] } = {};
  
  // Input comment for Weekly Log
  logComment: string = '';

  constructor(
    private studentCampaignService: StudentCampaignService,
    private weeklyLogService: WeeklyLogService
  ) {}

  ngOnInit() {
    this.loadInterns();
  }

  loadInterns() {
    this.studentCampaignService.getCompanyStudents().subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res : (res.data || res.payload || []);
        this.interns = data.map((s: any) => {
          let planStatus = 'Chưa có dữ liệu';
          if (s.internship_plans && s.internship_plans.length > 0) {
            const hasPending = s.internship_plans.some((p: any) => p.company_status === 'PENDING' || !p.company_status);
            planStatus = hasPending ? 'Chờ duyệt' : 'Đã duyệt';
          }
          
          let declarationStatus = s.company_info?.company_status === 'ACTIVE' ? 'Đã tiếp nhận' : 'Chờ tiếp nhận';

          const mapped = {
            id: s.id,
            studentId: s.student_code,
            studentName: s.full_name,
            university: 'Đại học Xây dựng Hà Nội', // Hardcoded as it's HUCE
            currentWeek: 'Đang tải...',
            declarationStatus,
            planStatus,
            logStatus: 'Đang tải...',
            originalData: s
          };
          
          this.loadWeeklyLogs(mapped);
          return mapped;
        });
      }
    });
  }
  
  loadWeeklyLogs(intern: any) {
    this.weeklyLogService.findByStudentCampaign(intern.id).subscribe({
      next: (res) => {
        const logs = Array.isArray(res) ? res : (res.data || res.payload || []);
        this.weeklyLogs[intern.id] = logs;
        
        if (logs.length === 0) {
          intern.currentWeek = 'Chưa bắt đầu';
          intern.logStatus = 'Chưa có dữ liệu';
        } else {
          // Sort by week number descending
          logs.sort((a: any, b: any) => b.week_number - a.week_number);
          const latestLog = logs[0];
          intern.currentWeek = 'Tuần ' + latestLog.week_number;
          
          if (latestLog.supervisor_status === 'APPROVED') {
            intern.logStatus = 'Đã xác nhận';
          } else {
            intern.logStatus = 'Chờ xác nhận (Tuần ' + latestLog.week_number + ')';
          }
        }
      }
    });
  }

  openAction(intern: any, type: 'PLAN' | 'LOG' | 'DECLARATION') {
    this.selectedIntern = intern;
    this.actionType = type;
    this.logComment = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedIntern = null;
    this.actionType = null;
  }

  approve() {
    if (!this.selectedIntern) return;
    
    if (this.actionType === 'PLAN') {
      this.studentCampaignService.approvePlanByCompany(this.selectedIntern.id).subscribe({
        next: () => {
          this.selectedIntern.planStatus = 'Đã duyệt';
          this.closeModal();
        }
      });
    } else if (this.actionType === 'LOG') {
      const logs = this.weeklyLogs[this.selectedIntern.id];
      if (logs && logs.length > 0) {
        const latestLog = logs[0]; // Assuming logs are sorted desc
        this.weeklyLogService.approveWeeklyLog(latestLog.id, this.logComment).subscribe({
          next: () => {
            this.selectedIntern.logStatus = 'Đã xác nhận';
            latestLog.supervisor_status = 'APPROVED';
            this.closeModal();
          }
        });
      }
    } else if (this.actionType === 'DECLARATION') {
      // In a real flow, company supervisor might not need to approve declaration explicitly since it's already active,
      // but if they do, we can call an API here. We'll just mark it as accepted for now.
      this.selectedIntern.declarationStatus = 'Đã tiếp nhận';
      this.closeModal();
    }
  }
}
