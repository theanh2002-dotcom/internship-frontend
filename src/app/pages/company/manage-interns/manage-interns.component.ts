import { Component, OnInit } from '@angular/core';
import { CampaignResponse } from '../../../core/models/base.model';
import { CampaignService } from '../../../core/services/campaign.service';
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
  isLoading = false;
  campaigns: CampaignResponse[] = [];
  selectedCampaignId: number | null = null;
  
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
    { key: 'firstName', label: 'Tên', width: '110px' },
    { key: 'currentWeek', label: 'Tuần hiện tại', align: 'center', width: '130px' },
    { key: 'declarationStatus', label: 'Tiếp nhận (TTTN-01)', align: 'center', width: '170px' },
    { key: 'planStatus', label: 'Kế hoạch (TTTN-02)', align: 'center', width: '170px' },
    { key: 'logStatus', label: 'Nhật ký (TTTN-03)', align: 'center', width: '170px' },
    { key: 'actions', label: 'Hành động', align: 'center', width: '200px' }
  ];

  constructor(
    private studentCampaignService: StudentCampaignService,
    private weeklyLogService: WeeklyLogService,
    private campaignService: CampaignService
  ) {}

  ngOnInit() {
    this.loadCampaigns();
  }

  loadCampaigns() {
    this.isLoading = true;
    this.campaignService.getCampaigns({ page: 1, limit: 100, orderBy: 'startDate:DESC' }, 'ACTIVE').subscribe({
      next: (res) => {
        this.campaigns = res.data || [];
        this.selectedCampaignId = this.campaigns.length > 0 ? this.campaigns[0].id : null;
        if (this.selectedCampaignId) {
          this.loadInterns();
        } else {
          this.interns = [];
          this.filterInterns();
          this.isLoading = false;
        }
      },
      error: () => {
        this.campaigns = [];
        this.selectedCampaignId = null;
        this.interns = [];
        this.filterInterns();
        this.isLoading = false;
      }
    });
  }

  loadInterns() {
    if (!this.selectedCampaignId) {
      this.interns = [];
      this.filterInterns();
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.studentCampaignService.getCompanyStudents(this.selectedCampaignId).subscribe({
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
            firstName: this.getStudentFirstName(s),
            lastName: this.getStudentLastName(s),
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
        this.isLoading = false;
      },
      error: () => {
        this.interns = [];
        this.filterInterns();
        this.isLoading = false;
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
        (i.firstName && i.firstName.toLowerCase().includes(term)) ||
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

    result = result.sort((a, b) => this.compareInternsByName(a, b));

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

  onCampaignChange() {
    this.currentPage = 1;
    this.searchTerm = '';
    this.selectedDeclarationStatus = '';
    this.selectedPlanStatus = '';
    this.selectedLogStatus = '';
    this.weeklyLogs = {};
    this.loadInterns();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.paginate();
  }

  getStudentFirstName(student: any): string {
    if (student?.first_name) return student.first_name;
    return this.splitFullName(student?.full_name || student?.studentName || '').firstName;
  }

  private getStudentLastName(student: any): string {
    if (student?.last_name) return student.last_name;
    return this.splitFullName(student?.full_name || student?.studentName || '').lastName;
  }

  private compareInternsByName(a: any, b: any): number {
    const firstNameCompare = (a.firstName || '').localeCompare(b.firstName || '', 'vi', { sensitivity: 'base' });
    if (firstNameCompare !== 0) return firstNameCompare;

    const lastNameCompare = (a.lastName || '').localeCompare(b.lastName || '', 'vi', { sensitivity: 'base' });
    if (lastNameCompare !== 0) return lastNameCompare;

    return (a.studentId || '').localeCompare(b.studentId || '', 'vi', { numeric: true });
  }

  private splitFullName(fullName: string): { lastName: string; firstName: string } {
    const normalized = (fullName || '').trim().replace(/\s+/g, ' ');
    if (!normalized) return { lastName: '', firstName: '' };
    const lastSpace = normalized.lastIndexOf(' ');
    if (lastSpace < 0) return { lastName: '', firstName: normalized };
    return {
      lastName: normalized.slice(0, lastSpace).trim(),
      firstName: normalized.slice(lastSpace + 1).trim()
    };
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
