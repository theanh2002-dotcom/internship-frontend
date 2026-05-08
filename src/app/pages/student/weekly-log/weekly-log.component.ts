import { Component, OnInit } from '@angular/core';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { WeeklyLogService } from '../../../core/services/weekly-log.service';
import { StudentCampaignResponse } from '../../../core/models/base.model';
import { WeeklyLogRequest } from '../../../core/models/request.model';

interface Evidence {
  name: string;
  url: string;
  type: 'link' | 'image';
}

interface WeeklyLog {
  id?: number;
  weekNumber: number;
  startDate?: string;
  endDate?: string;
  status: 'confirmed' | 'active' | 'locked';
  tasks: string[];
  results: string;
  evidences?: Evidence[];
  supervisorComment?: string;
  supervisorName?: string;
  supervisorDate?: string;
  progress?: number;
}

@Component({
  selector: 'app-weekly-log',
  templateUrl: './weekly-log.component.html',
  styleUrls: ['./weekly-log.component.scss']
})
export class WeeklyLogComponent implements OnInit {
  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  campaign: StudentCampaignResponse | null = null;
  logs: WeeklyLog[] = [];

  studentInfo = {
    name: 'Đang tải...',
    mssv: '...',
    department: '...',
    avatar: 'assets/default-avatar.png'
  };

  companyInfo = {
    name: 'Đang tải...',
    supervisor: 'Đang tải...'
  };

  // Helper properties to bind active form inputs
  activeWeekNumber = 1;
  activeLogTasks: string = '';
  activeLogResults: string = '';

  // Options for weeks
  availableWeeks = [1,2,3,4,5,6,7,8];

  constructor(
    private studentCampaignService: StudentCampaignService,
    private weeklyLogService: WeeklyLogService
  ) {}

  ngOnInit(): void {
    this.loadCampaign();
  }

  loadCampaign() {
    this.studentCampaignService.getMyCampaigns().subscribe({
      next: (res) => {
        const campaigns = Array.isArray(res) ? res : (res.data || res.payload || []);
        if (campaigns.length > 0) {
          this.campaign = campaigns[0];
          this.studentInfo.name = this.campaign!.full_name;
          this.studentInfo.mssv = this.campaign!.student_code;
          
          if (this.campaign!.company_info) {
            this.companyInfo.name = this.campaign!.company_info.company_name;
            this.companyInfo.supervisor = this.campaign!.company_info.supervisor_name;
          }

          this.loadLogs();
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        this.errorMessage = 'Lỗi tải thông tin sinh viên.';
        this.isLoading = false;
      }
    });
  }

  loadLogs() {
    if (!this.campaign) return;

    this.weeklyLogService.findByStudentCampaign(this.campaign.id).subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res : (res.data || res.payload || []);
        
        // Map backend logs to 8 weeks
        this.logs = this.availableWeeks.map(weekNo => {
          const item = data.find((d: any) => d.week_number === weekNo);
          if (item) {
            let status: 'confirmed' | 'active' | 'locked' = 'locked';
            if (item.supervisor_status === 'APPROVED') status = 'confirmed';
            else status = 'active'; // PENDING or REJECTED can be edited

            return {
              id: item.id,
              weekNumber: weekNo,
              status: status,
              tasks: item.content ? item.content.split('\n') : [],
              results: item.results || '',
              supervisorComment: item.supervisor_comment || '',
              supervisorName: this.companyInfo.supervisor,
              supervisorDate: item.updated_at
            };
          } else {
             return {
               weekNumber: weekNo,
               status: 'locked',
               tasks: [],
               results: ''
             };
          }
        });

        // Determine which one is 'active'
        const firstUnconfirmed = this.logs.find(l => l.status !== 'confirmed');
        if (firstUnconfirmed) {
           firstUnconfirmed.status = 'active';
           this.activeWeekNumber = firstUnconfirmed.weekNumber;
           this.activeLogTasks = firstUnconfirmed.tasks.join('\n');
           this.activeLogResults = firstUnconfirmed.results;
        }

        // Sort ascending or descending? The UI design usually shows latest first or chronological. Let's do ascending for a chronological timeline.
        // The original code: week 1 -> week 2 -> week 3
        this.logs.sort((a, b) => a.weekNumber - b.weekNumber);

        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Lỗi tải nhật ký.';
        this.isLoading = false;
      }
    });
  }

  onWeekChange() {
    // If selecting an existing week, populate the form
    const existingLog = this.logs.find(l => l.weekNumber == this.activeWeekNumber);
    if (existingLog) {
      this.activeLogTasks = existingLog.tasks.join('\n');
      this.activeLogResults = existingLog.results;
    } else {
      this.activeLogTasks = '';
      this.activeLogResults = '';
    }
  }

  submitLog() {
    if (!this.campaign) return;
    if (!this.activeLogTasks.trim()) {
      this.errorMessage = 'Vui lòng nhập nội dung công việc!';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: WeeklyLogRequest = {
      student_campaign_id: this.campaign.id,
      week_number: Number(this.activeWeekNumber),
      content: this.activeLogTasks,
      results: this.activeLogResults
    };

    this.weeklyLogService.createOrUpdate(payload).subscribe({
      next: () => {
        this.successMessage = 'Lưu nhật ký thành công!';
        this.isSaving = false;
        // Reload logs
        this.isLoading = true;
        this.loadLogs();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Có lỗi xảy ra khi lưu nhật ký.';
        this.isSaving = false;
      }
    });
  }
}
