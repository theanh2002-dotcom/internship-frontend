import { Component, OnInit } from '@angular/core';
import { CampaignService } from '../../../core/services/campaign.service';
import { AuthService } from '../../../core/services/auth.service';
import { CampaignResponse, PaginationRequest } from '../../../core/models/base.model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  adminName = '';
  isLoading = true;

  // Thống kê
  totalCampaigns = 0;
  activeCampaigns = 0;
  inactiveCampaigns = 0;
  totalStudents = 0;

  // Danh sách campaigns mới nhất
  recentCampaigns: CampaignResponse[] = [];

  constructor(
    private campaignService: CampaignService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.adminName = user?.fullName || 'Quản trị viên';
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    const request: PaginationRequest = { page: 1, limit: 50 };

    this.campaignService.getCampaigns(request).subscribe({
      next: (pagination) => {
        const campaigns = pagination.data || [];
        this.totalCampaigns = pagination.total || 0;
        this.activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
        this.inactiveCampaigns = campaigns.filter(c => c.status === 'INACTIVE').length;
        this.totalStudents = campaigns.reduce((sum, c) => sum + (c.student_count || 0), 0);
        this.recentCampaigns = campaigns.slice(0, 5);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const parts = dateStr.substring(0, 10).split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  getStatusLabel(status: string): string {
    return status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động';
  }

  getSemesterLabel(semester: number | null): string {
    if (!semester) return '';
    const labels: Record<number, string> = { 1: 'HK1', 2: 'HK2', 3: 'HK Hè' };
    return labels[semester] || `HK${semester}`;
  }
}
