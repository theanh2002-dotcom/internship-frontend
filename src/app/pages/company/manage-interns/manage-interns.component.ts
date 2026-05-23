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

  searchTerm: string = '';
  selectedDeclarationStatus: string = '';
  selectedPlanStatus: string = '';
  selectedLogStatus: string = '';

  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  filteredInterns: any[] = [];
  paginatedInterns: any[] = [];

  columns = [
    { key: 'student', label: 'Sinh viên' },
    { key: 'currentWeek', label: 'Tuần hiện tại', align: 'center', width: '130px' },
    { key: 'declarationStatus', label: 'Tiếp nhận (TTTN-01)', align: 'center', width: '170px' },
    { key: 'planStatus', label: 'Kế hoạch (TTTN-02)', align: 'center', width: '170px' },
    { key: 'logStatus', label: 'Nhật ký (TTTN-03)', align: 'center', width: '170px' },
    { key: 'actions', label: 'Hành động', align: 'center', width: '200px' }
  ];

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
            const allApproved = s.internship_plans.every((p: any) => p.company_status === 'APPROVED');
            planStatus = allApproved ? 'Đã duyệt' : (hasPending ? 'Chờ duyệt' : 'Chưa có dữ liệu');
          }
          
          let declarationStatus = s.company_info?.company_status === 'APPROVED' ? 'Đã tiếp nhận' : 'Chờ tiếp nhận';

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
        this.filterInterns();
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
          intern.latestLog = latestLog;
          intern.currentWeek = 'Tuần ' + latestLog.week_number;
          
          if (latestLog.supervisor_status === 'APPROVED') {
            intern.logStatus = 'Đã xác nhận';
          } else {
            intern.logStatus = 'Chờ xác nhận (Tuần ' + latestLog.week_number + ')';
          }
        }
        this.filterInterns();
      },
      error: () => {
        intern.currentWeek = 'Không rõ';
        intern.logStatus = 'Lỗi tải';
        this.filterInterns();
      }
    });
  }

  filterInterns() {
    let result = [...this.interns];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(i => 
        (i.studentName && i.studentName.toLowerCase().includes(term)) ||
        (i.studentId && i.studentId.toLowerCase().includes(term)) ||
        (i.university && i.university.toLowerCase().includes(term))
      );
    }

    if (this.selectedDeclarationStatus) {
      result = result.filter(i => i.declarationStatus === this.selectedDeclarationStatus);
    }

    if (this.selectedPlanStatus) {
      result = result.filter(i => i.planStatus === this.selectedPlanStatus);
    }

    if (this.selectedLogStatus) {
      if (this.selectedLogStatus === 'Chờ xác nhận') {
        result = result.filter(i => i.logStatus && i.logStatus.includes('Chờ xác nhận'));
      } else {
        result = result.filter(i => i.logStatus === this.selectedLogStatus);
      }
    }

    this.filteredInterns = result;
    this.totalItems = result.length;

    const totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }

    this.paginate();
  }

  paginate() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedInterns = this.filteredInterns.slice(startIndex, endIndex);
  }

  onFilterChange() {
    this.currentPage = 1;
    this.filterInterns();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.paginate();
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
          this.filterInterns();
          this.closeModal();
        },
        error: (err) => {
          alert(err.error?.message || 'Có lỗi xảy ra khi phê duyệt kế hoạch.');
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
            this.filterInterns();
            this.closeModal();
          },
          error: (err) => {
            alert(err.error?.message || 'Có lỗi xảy ra khi xác nhận nhật ký.');
          }
        });
      }
    } else if (this.actionType === 'DECLARATION') {
      this.studentCampaignService.approveCompanyInfo(this.selectedIntern.id).subscribe({
        next: () => {
          this.selectedIntern.declarationStatus = 'Đã tiếp nhận';
          this.filterInterns();
          this.closeModal();
        },
        error: (err) => {
          alert(err.error?.message || 'Có lỗi xảy ra khi xác nhận tiếp nhận. Vui lòng kiểm tra lại quyền.');
        }
      });
    }
  }
}
