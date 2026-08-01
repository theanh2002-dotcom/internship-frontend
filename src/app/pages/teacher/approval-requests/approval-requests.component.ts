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
  
  selectedRequest: StudentCampaignResponse | null = null;
  requestType: 'COMPANY' | 'PLAN' | null = null;
  showModal = false;
  campaigns: any[] = [];
  
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
    this.campaignService.getCampaignOptions().subscribe({
      next: (res) => {
        this.campaigns = res || [];
      }
    });
  }

  isCampaignActive(campaignId: number): boolean {
    const camp = this.campaigns.find(c => c.id === campaignId);
    return camp ? camp.status === 'ACTIVE' : true; 
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
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
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
        this.toastService.success('Đã phê duyệt thành công!');
        this.isProcessing = false;
        
        // Loại bỏ khỏi danh sách chờ
        this.requests = this.requests.filter(r => r.id !== this.selectedRequest!.id);
        
        setTimeout(() => this.closeModal(), 1500);
      },
      error: (err) => {
        const msg = err.error?.message || 'Có lỗi xảy ra khi phê duyệt.';
        this.toastService.error(msg);
        this.toastService.error(msg);
        this.isProcessing = false;
      }
    });
  }

  reject() {
    // Backend chưa hỗ trợ reject, tạm thời chỉ báo lỗi UI
    const msg = 'Tính năng từ chối đang được phát triển.';
    this.toastService.warning(msg);
    this.toastService.error(msg);
  }
}
