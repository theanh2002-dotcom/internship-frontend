import { Component, OnInit } from '@angular/core';
import { CommitteeService, CommitteeResponse, CreateCommitteeRequest } from '../../../core/services/committee.service';
import { CampaignService } from '../../../core/services/campaign.service';
import { UserService } from '../../../core/services/user.service';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { AuthService } from '../../../core/services/auth.service';
import { DepartmentCampaignService } from '../../../core/services/department-campaign.service';
import { CampaignResponse, UserResponse, StudentCampaignResponse } from '../../../core/models/base.model';

@Component({
  selector: 'app-committees',
  templateUrl: './committees.component.html',
  styleUrls: ['./committees.component.scss']
})
export class CommitteesComponent implements OnInit {
  // Core lists
  committees: CommitteeResponse[] = [];
  campaigns: CampaignResponse[] = [];
  teachers: UserResponse[] = [];
  allStudents: StudentCampaignResponse[] = [];
  filteredStudents: StudentCampaignResponse[] = [];

  // Context ids
  selectedCampaignId: number | null = null;
  departmentId: number | null = null;
  departmentCampaignId: number | null = null;

  // View States
  loading: boolean = false;
  error: string | null = null;
  success: string | null = null;

  // Search/Filter
  studentsSearchText: string = '';

  // Modals
  isCreateModalOpen: boolean = false;
  isStudentModalOpen: boolean = false;
  selectedCommittee: CommitteeResponse | null = null;

  // Create/Edit Form variables
  isEditing: boolean = false;
  editingCommitteeId: number | null = null;
  formName: string = '';
  formEvaluationDate: string = ''; // format: YYYY-MM-DDTHH:MM
  formRoom: string = '';
  committeeMembers: { user_id: number; full_name: string; role: string; email: string }[] = [];
  selectedTeacherId: number | null = null;
  selectedMemberRole: string = 'MEMBER';

  // Assign Student selections
  tempAssignedStudentIds: Set<number> = new Set<number>();

  constructor(
    private committeeService: CommitteeService,
    private campaignService: CampaignService,
    private userService: UserService,
    private studentCampaignService: StudentCampaignService,
    private authService: AuthService,
    private departmentCampaignService: DepartmentCampaignService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.departmentId) {
      this.departmentId = user.departmentId;
    }
    this.loadCampaigns();
  }

  loadCampaigns(): void {
    this.loading = true;
    this.campaignService.getCampaigns({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        this.campaigns = res.data || [];
        if (this.campaigns.length > 0) {
          this.selectedCampaignId = this.campaigns[0].id;
          this.loadContextAndData();
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = 'Failed to load campaigns';
        this.loading = false;
      }
    });
  }

  onCampaignChange(): void {
    this.loadContextAndData();
  }

  loadContextAndData(): void {
    if (!this.selectedCampaignId || !this.departmentId) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    // Load Department Campaign Context
    this.departmentCampaignService.findOrCreate(this.selectedCampaignId, this.departmentId).subscribe({
      next: (res) => {
        this.departmentCampaignId = res.id;
        if (this.departmentCampaignId) {
          this.loadCommittees();
          this.loadTeachers();
          this.loadStudents();
        } else {
          this.error = 'Không tìm thấy đợt thực tập của bộ môn.';
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = err.message || 'Lỗi tải ngữ cảnh đợt thực tập.';
        this.loading = false;
      }
    });
  }

  loadCommittees(): void {
    if (!this.departmentCampaignId) return;
    this.committeeService.getCommittees(this.departmentCampaignId).subscribe({
      next: (res) => {
        this.committees = res || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load committees.';
        this.loading = false;
      }
    });
  }

  loadTeachers(): void {
    if (!this.departmentId) return;
    this.userService.getUsers({ page: 1, limit: 1000 }, 'GVHD', this.departmentId).subscribe({
      next: (res) => {
        this.teachers = res.data || [];
      }
    });
  }

  loadStudents(): void {
    if (!this.selectedCampaignId || !this.departmentId) return;
    this.studentCampaignService.findByCampaignAndDepartment(this.selectedCampaignId, this.departmentId, { page: 1, limit: 1000 }).subscribe({
      next: (res) => {
        this.allStudents = res.data || [];
        this.filterStudents();
      }
    });
  }

  // --- STATS HELPER ---
  get uniqueLecturersCount(): number {
    const ids = new Set<number>();
    this.committees.forEach(c => {
      c.members?.forEach(m => ids.add(m.user_id));
    });
    return ids.size;
  }

  get assignedStudentsCount(): number {
    return this.allStudents.filter(s => s.committee_id !== null && s.committee_id !== undefined).length;
  }

  getStudentCountForCommittee(committeeId: number): number {
    return this.allStudents.filter(s => s.committee_id === committeeId).length;
  }

  // --- CREATE/EDIT MODAL ACTIONS ---
  openCreateModal(): void {
    this.isEditing = false;
    this.editingCommitteeId = null;
    this.formName = '';
    this.formEvaluationDate = '';
    this.formRoom = '';
    this.committeeMembers = [];
    this.selectedTeacherId = null;
    this.selectedMemberRole = 'MEMBER';
    this.isCreateModalOpen = true;
  }

  openEditModal(committee: CommitteeResponse): void {
    this.isEditing = true;
    this.editingCommitteeId = committee.id;
    this.formName = committee.name;
    
    if (committee.evaluation_date) {
      // Convert "YYYY-MM-DD HH:MM:SS" to "YYYY-MM-DDTHH:MM" for datetime-local
      const dateParts = committee.evaluation_date.split(' ');
      if (dateParts.length >= 2) {
        const dateStr = dateParts[0];
        const timeStr = dateParts[1].substring(0, 5); // get HH:MM
        this.formEvaluationDate = `${dateStr}T${timeStr}`;
      } else {
        this.formEvaluationDate = '';
      }
    } else {
      this.formEvaluationDate = '';
    }
    
    this.formRoom = committee.room || '';
    
    // Map members response back to form format
    this.committeeMembers = (committee.members || []).map(m => {
      const t = this.teachers.find(teacher => teacher.id === m.user_id);
      return {
        user_id: m.user_id,
        full_name: m.full_name || t?.full_name || `ID: ${m.user_id}`,
        email: m.email || t?.email || '',
        role: m.role
      };
    });
    
    this.selectedTeacherId = null;
    this.selectedMemberRole = 'MEMBER';
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
  }

  addMember(): void {
    if (!this.selectedTeacherId) {
      this.showError('Vui lòng chọn Giảng viên trước.');
      return;
    }
    
    const exists = this.committeeMembers.some(m => Number(m.user_id) === Number(this.selectedTeacherId));
    if (exists) {
      this.showError('Giảng viên này đã được thêm vào hội đồng.');
      return;
    }
    
    const teacher = this.teachers.find(t => Number(t.id) === Number(this.selectedTeacherId));
    if (!teacher) return;
    
    this.committeeMembers.push({
      user_id: teacher.id,
      full_name: teacher.full_name,
      email: teacher.email,
      role: this.selectedMemberRole
    });
    
    // Reset selection fields
    this.selectedTeacherId = null;
    this.selectedMemberRole = 'MEMBER';
  }

  removeMember(userId: number): void {
    this.committeeMembers = this.committeeMembers.filter(m => m.user_id !== userId);
  }

  saveCommittee(): void {
    if (!this.formName.trim()) {
      this.showError('Tên hội đồng không được để trống.');
      return;
    }
    if (this.committeeMembers.length === 0) {
      this.showError('Vui lòng thêm ít nhất 1 thành viên vào hội đồng.');
      return;
    }
    if (!this.departmentCampaignId) {
      this.showError('Không tìm thấy đợt thực tập hợp lệ.');
      return;
    }

    // Format evaluation date: convert "YYYY-MM-DDTHH:MM" back to "YYYY-MM-DD HH:mm:ss"
    let formattedDate = null;
    if (this.formEvaluationDate) {
      formattedDate = this.formEvaluationDate.replace('T', ' ') + ':00';
    }

    const payload: CreateCommitteeRequest = {
      department_campaign_id: this.departmentCampaignId,
      name: this.formName,
      evaluation_date: formattedDate as any,
      room: this.formRoom,
      members: this.committeeMembers.map(m => ({
        user_id: m.user_id,
        role: m.role
      }))
    };

    this.loading = true;
    if (this.isEditing && this.editingCommitteeId) {
      this.committeeService.updateCommittee(this.editingCommitteeId, payload).subscribe({
        next: () => {
          this.closeCreateModal();
          this.showSuccess('Cập nhật hội đồng thành công.');
          this.loadCommittees();
        },
        error: (err) => {
          this.showError(err.error?.message || err.message || 'Lỗi khi cập nhật hội đồng.');
          this.loading = false;
        }
      });
    } else {
      this.committeeService.createCommittee(payload).subscribe({
        next: () => {
          this.closeCreateModal();
          this.showSuccess('Tạo hội đồng thành công.');
          this.loadCommittees();
        },
        error: (err) => {
          this.showError(err.error?.message || err.message || 'Lỗi khi tạo hội đồng.');
          this.loading = false;
        }
      });
    }
  }

  deleteCommittee(committee: CommitteeResponse): void {
    if (confirm(`Bạn có chắc chắn muốn xóa hội đồng "${committee.name}"? Sinh viên được gán sẽ chuyển về trạng thái chưa gán.`)) {
      this.loading = true;
      this.committeeService.deleteCommittee(committee.id).subscribe({
        next: () => {
          this.showSuccess('Đã xóa hội đồng thành công.');
          this.loadCommittees();
          this.loadStudents();
        },
        error: (err) => {
          this.showError(err.error?.message || err.message || 'Lỗi khi xóa hội đồng.');
          this.loading = false;
        }
      });
    }
  }

  // --- ASSIGN STUDENT MODAL ACTIONS ---
  openStudentModal(committee: CommitteeResponse): void {
    this.selectedCommittee = committee;
    this.studentsSearchText = '';
    
    // Track selected student IDs locally
    this.tempAssignedStudentIds = new Set(
      this.allStudents
        .filter(s => s.committee_id === committee.id)
        .map(s => s.id)
    );
    
    this.filterStudents();
    this.isStudentModalOpen = true;
  }

  closeStudentModal(): void {
    this.isStudentModalOpen = false;
    this.selectedCommittee = null;
  }

  filterStudents(): void {
    const text = this.studentsSearchText.toLowerCase().trim();
    if (!text) {
      this.filteredStudents = [...this.allStudents];
    } else {
      this.filteredStudents = this.allStudents.filter(s =>
        s.full_name.toLowerCase().includes(text) ||
        s.student_code.toLowerCase().includes(text) ||
        (s.class_name && s.class_name.toLowerCase().includes(text))
      );
    }
  }

  toggleStudentSelection(studentId: number, event: any): void {
    if (event.target.checked) {
      this.tempAssignedStudentIds.add(studentId);
    } else {
      this.tempAssignedStudentIds.delete(studentId);
    }
  }

  isStudentSelected(studentId: number): boolean {
    return this.tempAssignedStudentIds.has(studentId);
  }

  getStudentAssignedCommitteeName(student: StudentCampaignResponse): string | null {
    if (!student.committee_id) return null;
    if (this.selectedCommittee && student.committee_id === this.selectedCommittee.id) return null;
    
    const c = this.committees.find(com => com.id === student.committee_id);
    return c ? c.name : 'Hội đồng khác';
  }

  saveStudentAssignments(): void {
    if (!this.selectedCommittee) return;
    
    const ids = Array.from(this.tempAssignedStudentIds);
    this.loading = true;
    
    this.committeeService.assignStudents(this.selectedCommittee.id, ids).subscribe({
      next: () => {
        this.closeStudentModal();
        this.showSuccess('Phân công sinh viên vào hội đồng thành công.');
        this.loadCommittees();
        this.loadStudents();
      },
      error: (err) => {
        this.showError(err.error?.message || err.message || 'Lỗi khi phân công sinh viên.');
        this.loading = false;
      }
    });
  }

  // --- MEMBER ROLE FORMATTER ---
  getRoleLabel(role: string): string {
    switch (role) {
      case 'PRESIDENT': return 'Chủ tịch';
      case 'SECRETARY': return 'Thư ký';
      case 'MEMBER': return 'Ủy viên';
      default: return role;
    }
  }

  // --- ALERTS ---
  showSuccess(msg: string): void {
    this.success = msg;
    setTimeout(() => this.success = null, 4000);
  }

  showError(msg: string): void {
    this.error = msg;
    setTimeout(() => this.error = null, 5000);
  }
}
