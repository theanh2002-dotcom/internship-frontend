import { Component, OnInit } from '@angular/core';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { StudentCampaignResponse } from '../../../core/models/base.model';
import { ToastService } from '../../../core/services/toast.service';
import { CampaignService } from '../../../core/services/campaign.service';

@Component({
  selector: 'app-approval-requests',
  templateUrl: './approval-requests.component.html',
  styleUrls: ['./approval-requests.component.scss']
})
export class ApprovalRequestsComponent implements OnInit {
  isLoading = true;
  isProcessing = false;
  requests: StudentCampaignResponse[] = [];
  filteredRequests: StudentCampaignResponse[] = [];
  
  selectedRequest: StudentCampaignResponse | null = null;
  requestType: 'COMPANY' | 'PLAN' | null = null;
  showModal = false;
  campaigns: any[] = [];
  activeCampaignIds = new Set<number>();
  
  selectedCampaignId: number | null = null;
  searchQuery = '';
  
  constructor(
    private studentCampaignService: StudentCampaignService,
    private toastService: ToastService,
    private campaignService: CampaignService
  ) {}

  ngOnInit(): void {
    this.loadCampaigns();
    this.loadRequests();
  }

  loadCampaigns(): void {
    // 1. Lấy tất cả các đợt để hiển thị tên và dropdown bộ lọc
    this.campaignService.getCampaignOptions().subscribe({
      next: (res) => {
        this.campaigns = res || [];
      }
    });

    // 2. Lấy danh sách đợt đang ACTIVE để kiểm tra trạng thái hoạt động
    this.campaignService.getCampaignOptions('ACTIVE').subscribe({
      next: (res) => {
        const activeList = res || [];
        this.activeCampaignIds = new Set(activeList.map((c: any) => Number(c.id)));
      }
    });
  }

  isCampaignActive(campaignId: number): boolean {
    if (!campaignId) return true;
    // Nếu danh sách active đã tải, kiểm tra xem ID có nằm trong activeCampaignIds hay không
    if (this.activeCampaignIds.size > 0) {
      return this.activeCampaignIds.has(Number(campaignId));
    }
    // Mặc định cho phép thao tác
    return true; 
  }

  getCampaignName(campaignId?: number): string {
    if (!campaignId) return 'Chưa gán';
    const camp = this.campaigns.find(c => Number(c.id) === Number(campaignId));
    return camp ? (camp.name || camp.code || `Đợt ${campaignId}`) : `Đợt ${campaignId}`;
  }

  loadRequests(): void {
    this.isLoading = true;
    this.studentCampaignService.getMyAssignedStudents().subscribe({
      next: (res) => {
        // Lọc các sinh viên đang chờ duyệt
        const allStudents = Array.isArray(res) ? res : (res.data || res.payload || []);
        this.requests = allStudents.filter((s: any) => 
          s.status === 'COMPANY_DECLARED' || s.status === 'PLAN_SUBMITTED'
        );
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let result = [...this.requests];

    if (this.selectedCampaignId !== null) {
      result = result.filter(r => Number(r.campaign_id) === Number(this.selectedCampaignId));
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase().trim();
      result = result.filter(r => 
        (r.full_name && r.full_name.toLowerCase().includes(query)) ||
        (r.student_code && r.student_code.toLowerCase().includes(query)) ||
        (r.class_name && r.class_name.toLowerCase().includes(query)) ||
        (r.company_info?.company_name && r.company_info.company_name.toLowerCase().includes(query))
      );
    }

    this.filteredRequests = result;
  }

  openRequest(req: StudentCampaignResponse) {
    this.selectedRequest = req;
    this.requestType = req.status === 'COMPANY_DECLARED' ? 'COMPANY' : 'PLAN';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedRequest = null;
    this.requestType = null;
  }

  approve() {
    if (!this.selectedRequest || !this.requestType) return;
    
    this.isProcessing = true;
    const requestObservable = this.requestType === 'COMPANY' 
      ? this.studentCampaignService.approveCompanyInfo(this.selectedRequest.id)
      : this.studentCampaignService.approveInternshipPlan(this.selectedRequest.id);

    requestObservable.subscribe({
      next: () => {
        this.toastService.success('Đã phê duyệt thành công!');
        this.isProcessing = false;
        
        // Loại bỏ khỏi danh sách chờ
        this.requests = this.requests.filter(r => r.id !== this.selectedRequest!.id);
        this.applyFilters();
        
        setTimeout(() => this.closeModal(), 1200);
      },
      error: (err) => {
        const msg = err.error?.message || 'Có lỗi xảy ra khi phê duyệt.';
        this.toastService.error(msg);
        this.isProcessing = false;
      }
    });
  }

  reject() {
    // Backend chưa hỗ trợ reject, tạm thời chỉ báo lỗi UI
    const msg = 'Tính năng từ chối đang được phát triển.';
    this.toastService.warning(msg);
  }
}
