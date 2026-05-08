import { Component, OnInit } from '@angular/core';
import { CampaignService } from '../../../core/services/campaign.service';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { AuthService } from '../../../core/services/auth.service';
import { CampaignResponse } from '../../../core/models/base.model';

@Component({
  selector: 'app-general-dashboard',
  templateUrl: './general-dashboard.component.html',
  styleUrls: ['./general-dashboard.component.scss']
})
export class GeneralDashboardComponent implements OnInit {
  isLoading = true;
  departmentId: number | null = null;
  
  campaigns: CampaignResponse[] = [];
  selectedCampaignId: number | null = null;

  // Stats
  totalStudents = 0;
  assignedStudents = 0;
  approvedPlans = 0;
  completedStudents = 0;

  constructor(
    private campaignService: CampaignService,
    private studentCampaignService: StudentCampaignService,
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
          this.loadStats();
        } else {
          this.isLoading = false;
        }
      },
      error: () => this.isLoading = false
    });
  }

  onCampaignChange(): void {
    this.loadStats();
  }

  loadStats(): void {
    if (!this.selectedCampaignId) return;
    
    if (!this.departmentId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.studentCampaignService.findByCampaignAndDepartment(this.selectedCampaignId, this.departmentId, { page: 1, limit: 10000 }).subscribe({
      next: (res) => {
        const students = res.data || [];
        this.totalStudents = res.total || students.length;
        
        this.assignedStudents = students.filter((s: any) => s.gvhd_id !== null).length;
        this.approvedPlans = students.filter((s: any) => s.status === 'PLAN_APPROVED' || s.status === 'COMPLETED' || s.status === 'EVALUATED').length;
        this.completedStudents = students.filter((s: any) => s.status === 'COMPLETED' || s.status === 'EVALUATED').length;
        
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }
}
