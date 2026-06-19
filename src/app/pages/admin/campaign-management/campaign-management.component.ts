import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit } from '@angular/core';
import { CampaignService, CampaignRequest } from '../../../core/services/campaign.service';
import { CampaignResponse, PaginationRequest } from '../../../core/models/base.model';
import { DepartmentService } from '../../../core/services/department.service';

@Component({
  selector: 'app-campaign-management',
  templateUrl: './campaign-management.component.html',
  styleUrls: ['./campaign-management.component.scss']
})
export class CampaignManagementComponent implements OnInit {
  isModalOpen = false;
  isLoading = false;
  
  // Cohort Group Config State
  isGroupModalOpen = false;
  selectedCampaign: CampaignResponse | null = null;
  groups: any[] = [];
  selectedGroup: any | null = null;
  
  groupCode = '';
  groupName = '';
  groupRegex = '';
  groupStartDate = '';
  groupEndDate = '';
  groupTttn01StartDate = '';
  groupTttn01Deadline = '';
  groupTttn02StartDate = '';
  groupTttn02Deadline = '';
  groupTttn03StartDate = '';
  groupTttn03Deadline = '';
  groupMidtermStartDate = '';
  groupMidtermDeadline = '';
  groupTttn06StartDate = '';
  groupTttn06Deadline = '';
  groupGradeDeadline = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;

  // Data
  campaigns: CampaignResponse[] = [];

  // Modal form state
  isEditMode = false;
  editingId: number | null = null;
  formCode = '';
  formName = '';
  formAcademicYear = '';
  formSemester: number | null = null;
  formDescription = '';
  formStartDate = '';
  formEndDate = '';

  // Detailed timeline form state
  formTttn01StartDate = '';
  formTttn01Deadline = '';
  formTttn02StartDate = '';
  formTttn02Deadline = '';
  formTttn03StartDate = '';
  formTttn03Deadline = '';
  formMidtermStartDate = '';
  formMidtermDeadline = '';
  formTttn06StartDate = '';
  formTttn06Deadline = '';

  // Dropdown options
  academicYears: string[] = [];
  semesters = [
    { value: 1, label: 'Học kỳ 1' },
    { value: 2, label: 'Học kỳ 2' },
    { value: 3, label: 'Học kỳ Hè' },
  ];

  departments: any[] = [];
  selectedDepartmentIds: number[] = [];
  deptSearchQuery = '';

  constructor(
    private toastService: ToastService, 
    private campaignService: CampaignService,
    private departmentService: DepartmentService
  ) {
    // Sinh danh sách năm học (5 năm gần đây)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      const y = currentYear - i;
      this.academicYears.push(`${y}-${y + 1}`);
    }
  }

  searchQuery = '';
  selectedStatus = '';
  selectedAcademicYear = '';

  ngOnInit(): void {
    this.loadCampaigns();
    this.loadDepartments();
  }

  getDepartmentName(id: number): string {
    const dept = this.departments.find(d => d.id === id);
    return dept ? `${dept.name} (${dept.code})` : '';
  }

  getFilteredDepartments(): any[] {
    if (!this.deptSearchQuery.trim()) {
      return this.departments;
    }
    const q = this.deptSearchQuery.toLowerCase().trim();
    return this.departments.filter(d => 
      d.name.toLowerCase().includes(q) || 
      d.code.toLowerCase().includes(q)
    );
  }

  selectAllDepartments(): void {
    this.selectedDepartmentIds = this.departments.map(d => d.id);
  }

  deselectAllDepartments(): void {
    this.selectedDepartmentIds = [];
  }

  loadDepartments(): void {
    this.departmentService.getDepartments({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        this.departments = res.data || [];
      },
      error: (err) => {
        this.toastService.error('Không thể tải danh sách khoa');
      }
    });
  }

  isDepartmentSelected(id: number): boolean {
    return this.selectedDepartmentIds.includes(id);
  }

  toggleDepartmentSelection(id: number): void {
    const idx = this.selectedDepartmentIds.indexOf(id);
    if (idx > -1) {
      this.selectedDepartmentIds.splice(idx, 1);
    } else {
      this.selectedDepartmentIds.push(id);
    }
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadCampaigns();
  }

  loadCampaigns(): void {
    this.isLoading = true;
    const request: PaginationRequest = {
      page: this.currentPage,
      limit: this.pageSize,
      searchText: this.searchQuery ? this.searchQuery.trim() : undefined
    };

    this.campaignService.getCampaigns(
      request,
      this.selectedStatus || undefined,
      this.selectedAcademicYear || undefined
    ).subscribe({
      next: (pagination) => {
        this.campaigns = pagination.data || [];
        this.totalItems = pagination.total || 0;
        this.currentPage = pagination.current_page || 1;
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.error(err?.message || 'Không thể tải danh sách đợt thực tập');
        this.isLoading = false;
      }
    });
  }

  // ── Modal ─────────────────────────────────────

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.resetForm();
    this.selectedDepartmentIds = [];
    this.deptSearchQuery = '';
    this.isModalOpen = true;
  }

  openEditModal(campaign: CampaignResponse): void {
    this.isEditMode = true;
    this.editingId = campaign.id;
    this.formCode = campaign.code || '';
    this.formName = campaign.name || '';
    this.formAcademicYear = campaign.academic_year || '';
    this.formSemester = campaign.semester;
    this.formDescription = campaign.description || '';
    // Backend trả "yyyy-MM-dd HH:mm:ss", input[date] cần "yyyy-MM-dd"
    this.formStartDate = campaign.start_date ? campaign.start_date.substring(0, 10) : '';
    this.formEndDate = campaign.end_date ? campaign.end_date.substring(0, 10) : '';
    
    this.formTttn01StartDate = campaign.tttn01_start_date ? campaign.tttn01_start_date.substring(0, 10) : '';
    this.formTttn01Deadline = campaign.tttn01_deadline ? campaign.tttn01_deadline.substring(0, 10) : '';
    this.formTttn02StartDate = campaign.tttn02_start_date ? campaign.tttn02_start_date.substring(0, 10) : '';
    this.formTttn02Deadline = campaign.tttn02_deadline ? campaign.tttn02_deadline.substring(0, 10) : '';
    this.formTttn03StartDate = campaign.tttn03_start_date ? campaign.tttn03_start_date.substring(0, 10) : '';
    this.formTttn03Deadline = campaign.tttn03_deadline ? campaign.tttn03_deadline.substring(0, 10) : '';
    this.formMidtermStartDate = campaign.midterm_start_date ? campaign.midterm_start_date.substring(0, 10) : '';
    this.formMidtermDeadline = campaign.midterm_deadline ? campaign.midterm_deadline.substring(0, 10) : '';
    this.formTttn06StartDate = campaign.tttn06_start_date ? campaign.tttn06_start_date.substring(0, 10) : '';
    this.formTttn06Deadline = campaign.tttn06_deadline ? campaign.tttn06_deadline.substring(0, 10) : '';
    
    this.selectedDepartmentIds = campaign.department_ids || [];
    this.deptSearchQuery = '';
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  resetForm(): void {
    this.formCode = '';
    this.formName = '';
    this.formAcademicYear = this.academicYears[0] || '';
    this.formSemester = 1;
    this.formDescription = '';
    this.formStartDate = '';
    this.formEndDate = '';
    
    this.formTttn01StartDate = '';
    this.formTttn01Deadline = '';
    this.formTttn02StartDate = '';
    this.formTttn02Deadline = '';
    this.formTttn03StartDate = '';
    this.formTttn03Deadline = '';
    this.formMidtermStartDate = '';
    this.formMidtermDeadline = '';
    this.formTttn06StartDate = '';
    this.formTttn06Deadline = '';
  }

  saveCampaign(): void {
    // Validate
    if (!this.formName.trim()) {
      this.toastService.error('Vui lòng nhập tên đợt thực tập');
      return;
    }
    if (!this.formStartDate) {
      this.toastService.error('Vui lòng chọn ngày bắt đầu');
      return;
    }
    if (!this.formEndDate) {
      this.toastService.error('Vui lòng chọn ngày kết thúc');
      return;
    }
    if (this.formStartDate >= this.formEndDate) {
      this.toastService.error('Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }


    const request: CampaignRequest = {
      code: this.formCode.trim(),
      name: this.formName.trim(),
      academic_year: this.formAcademicYear || undefined,
      semester: this.formSemester,
      description: this.formDescription.trim() || undefined,
      start_date: this.formStartDate + 'T00:00:00',
      end_date: this.formEndDate + 'T23:59:59',
      tttn01_start_date: this.formTttn01StartDate ? this.formTttn01StartDate + 'T00:00:00' : undefined,
      tttn01_deadline: this.formTttn01Deadline ? this.formTttn01Deadline + 'T23:59:59' : undefined,
      tttn02_start_date: this.formTttn02StartDate ? this.formTttn02StartDate + 'T00:00:00' : undefined,
      tttn02_deadline: this.formTttn02Deadline ? this.formTttn02Deadline + 'T23:59:59' : undefined,
      tttn03_start_date: this.formTttn03StartDate ? this.formTttn03StartDate + 'T00:00:00' : undefined,
      tttn03_deadline: this.formTttn03Deadline ? this.formTttn03Deadline + 'T23:59:59' : undefined,
      midterm_start_date: this.formMidtermStartDate ? this.formMidtermStartDate + 'T00:00:00' : undefined,
      midterm_deadline: this.formMidtermDeadline ? this.formMidtermDeadline + 'T23:59:59' : undefined,
      tttn06_start_date: this.formTttn06StartDate ? this.formTttn06StartDate + 'T00:00:00' : undefined,
      tttn06_deadline: this.formTttn06Deadline ? this.formTttn06Deadline + 'T23:59:59' : undefined,
      department_ids: this.selectedDepartmentIds
    };

    this.isLoading = true;

    if (this.isEditMode && this.editingId) {
      this.campaignService.update(this.editingId, request).subscribe({
        next: () => {
          this.closeModal();
          this.loadCampaigns();
        },
        error: (err) => {
          this.toastService.error(err?.message || 'Cập nhật thất bại');
          this.isLoading = false;
        }
      });
    } else {
      this.campaignService.create(request).subscribe({
        next: () => {
          this.closeModal();
          this.loadCampaigns();
        },
        error: (err) => {
          this.toastService.error(err?.message || 'Tạo mới thất bại');
          this.isLoading = false;
        }
      });
    }
  }

  // ── Actions ───────────────────────────────────

  toggleStatus(campaign: CampaignResponse): void {
    this.campaignService.toggleStatus(campaign.id).subscribe({
      next: () => {
        this.loadCampaigns();
      },
      error: (err) => {
        this.toastService.error(err?.message || 'Đổi trạng thái thất bại');
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCampaigns();
  }

  // ── Helpers ───────────────────────────────────

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
    if (!semester) return '—';
    const found = this.semesters.find(s => s.value === semester);
    return found ? found.label : `HK${semester}`;
  }

  // ── Cohort Group Management ───────────────────
  openGroupConfigModal(campaign: CampaignResponse): void {
    this.selectedCampaign = campaign;
    this.isGroupModalOpen = true;
    this.selectedGroup = null;
    this.resetGroupForm();
    this.loadGroups();
  }

  closeGroupModal(): void {
    this.isGroupModalOpen = false;
    this.selectedCampaign = null;
    this.selectedGroup = null;
    this.groups = [];
  }

  loadGroups(): void {
    if (!this.selectedCampaign) return;
    this.isLoading = true;
    this.campaignService.getGroupsByCampaign(this.selectedCampaign.id).subscribe({
      next: (res) => {
        this.groups = res || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.error('Không thể tải lộ trình nhóm đối tượng');
        this.isLoading = false;
      }
    });
  }

  selectGroup(group: any): void {
    this.selectedGroup = group;
    this.groupCode = group.code || '';
    this.groupName = group.name || '';
    this.groupRegex = group.student_filter_regex || '';
    this.groupStartDate = group.start_date ? group.start_date.substring(0, 10) : '';
    this.groupEndDate = group.end_date ? group.end_date.substring(0, 10) : '';
    this.groupTttn01StartDate = group.tttn01_start_date ? group.tttn01_start_date.substring(0, 10) : '';
    this.groupTttn01Deadline = group.tttn01_deadline ? group.tttn01_deadline.substring(0, 10) : '';
    this.groupTttn02StartDate = group.tttn02_start_date ? group.tttn02_start_date.substring(0, 10) : '';
    this.groupTttn02Deadline = group.tttn02_deadline ? group.tttn02_deadline.substring(0, 10) : '';
    this.groupTttn03StartDate = group.tttn03_start_date ? group.tttn03_start_date.substring(0, 10) : '';
    this.groupTttn03Deadline = group.tttn03_deadline ? group.tttn03_deadline.substring(0, 10) : '';
    this.groupMidtermStartDate = group.midterm_start_date ? group.midterm_start_date.substring(0, 10) : '';
    this.groupMidtermDeadline = group.midterm_deadline ? group.midterm_deadline.substring(0, 10) : '';
    this.groupTttn06StartDate = group.tttn06_start_date ? group.tttn06_start_date.substring(0, 10) : '';
    this.groupTttn06Deadline = group.tttn06_deadline ? group.tttn06_deadline.substring(0, 10) : '';
    this.groupGradeDeadline = group.grade_deadline ? group.grade_deadline.substring(0, 10) : '';
  }

  addNewGroup(): void {
    this.selectedGroup = { id: 0 }; // Temporary marker for new
    this.resetGroupForm();
  }

  resetGroupForm(): void {
    this.groupCode = '';
    this.groupName = '';
    this.groupRegex = '';
    this.groupStartDate = this.selectedCampaign?.start_date ? this.selectedCampaign.start_date.substring(0, 10) : '';
    this.groupEndDate = this.selectedCampaign?.end_date ? this.selectedCampaign.end_date.substring(0, 10) : '';
    this.groupTttn01StartDate = '';
    this.groupTttn01Deadline = '';
    this.groupTttn02StartDate = '';
    this.groupTttn02Deadline = '';
    this.groupTttn03StartDate = '';
    this.groupTttn03Deadline = '';
    this.groupMidtermStartDate = '';
    this.groupMidtermDeadline = '';
    this.groupTttn06StartDate = '';
    this.groupTttn06Deadline = '';
    this.groupGradeDeadline = '';
  }

  saveGroup(): void {
    if (!this.selectedCampaign) return;
    if (!this.groupCode.trim()) {
      this.toastService.error('Vui lòng nhập mã nhóm');
      return;
    }
    if (!this.groupName.trim()) {
      this.toastService.error('Vui lòng nhập tên nhóm');
      return;
    }
    if (!this.groupRegex.trim()) {
      this.toastService.error('Vui lòng nhập Regex lọc sinh viên');
      return;
    }

    const payload: any = {
      code: this.groupCode.trim(),
      name: this.groupName.trim(),
      student_filter_regex: this.groupRegex.trim(),
      start_date: this.groupStartDate ? this.groupStartDate + ' 00:00:00' : undefined,
      end_date: this.groupEndDate ? this.groupEndDate + ' 23:59:59' : undefined,
      tttn01_start_date: this.groupTttn01StartDate ? this.groupTttn01StartDate + ' 00:00:00' : undefined,
      tttn01_deadline: this.groupTttn01Deadline ? this.groupTttn01Deadline + ' 23:59:59' : undefined,
      tttn02_start_date: this.groupTttn02StartDate ? this.groupTttn02StartDate + ' 00:00:00' : undefined,
      tttn02_deadline: this.groupTttn02Deadline ? this.groupTttn02Deadline + ' 23:59:59' : undefined,
      tttn03_start_date: this.groupTttn03StartDate ? this.groupTttn03StartDate + ' 00:00:00' : undefined,
      tttn03_deadline: this.groupTttn03Deadline ? this.groupTttn03Deadline + ' 23:59:59' : undefined,
      midterm_start_date: this.groupMidtermStartDate ? this.groupMidtermStartDate + ' 00:00:00' : undefined,
      midterm_deadline: this.groupMidtermDeadline ? this.groupMidtermDeadline + ' 23:59:59' : undefined,
      tttn06_start_date: this.groupTttn06StartDate ? this.groupTttn06StartDate + ' 00:00:00' : undefined,
      tttn06_deadline: this.groupTttn06Deadline ? this.groupTttn06Deadline + ' 23:59:59' : undefined,
      grade_deadline: this.groupGradeDeadline ? this.groupGradeDeadline + ' 23:59:59' : undefined
    };

    this.isLoading = true;
    if (this.selectedGroup && this.selectedGroup.id > 0) {
      // Update
      this.campaignService.updateGroup(this.selectedCampaign.id, this.selectedGroup.id, payload).subscribe({
        next: () => {
          this.toastService.success('Cập nhật lộ trình nhóm thành công');
          this.loadGroups();
          this.selectedGroup = null;
        },
        error: (err) => {
          this.toastService.error(err?.message || 'Cập nhật thất bại');
          this.isLoading = false;
        }
      });
    } else {
      // Create
      this.campaignService.createGroup(this.selectedCampaign.id, payload).subscribe({
        next: () => {
          this.toastService.success('Tạo lộ trình nhóm thành công');
          this.loadGroups();
          this.selectedGroup = null;
        },
        error: (err) => {
          this.toastService.error(err?.message || 'Tạo mới thất bại');
          this.isLoading = false;
        }
      });
    }
  }

  deleteGroupItem(group: any, event: Event): void {
    event.stopPropagation();
    if (!this.selectedCampaign) return;
    if (confirm(`Bạn có chắc chắn muốn xóa lộ trình nhóm ${group.name} không?`)) {
      this.isLoading = true;
      this.campaignService.deleteGroup(this.selectedCampaign.id, group.id).subscribe({
        next: () => {
          this.toastService.success('Xóa lộ trình nhóm thành công');
          this.loadGroups();
          if (this.selectedGroup && this.selectedGroup.id === group.id) {
            this.selectedGroup = null;
          }
        },
        error: (err) => {
          this.toastService.error(err?.message || 'Xóa thất bại');
          this.isLoading = false;
        }
      });
    }
  }

  // Quick helper templates for easier Admin group creation
  applyRegexTemplate(type: string): void {
    if (type === 'DH_DT') {
      this.groupCode = 'K-A';
      this.groupName = 'Đại học Đại trà';
      this.groupRegex = '^D(?!.*CLC).*';
    } else if (type === 'DH_CLC') {
      this.groupCode = 'K-CLC';
      this.groupName = 'Đại học Chất lượng cao';
      this.groupRegex = '^D.*CLC.*';
    } else if (type === 'CD_DT') {
      this.groupCode = 'C-A';
      this.groupName = 'Cao đẳng Đại trà';
      this.groupRegex = '^C(?!.*CLC).*';
    } else if (type === 'CD_CLC') {
      this.groupCode = 'C-CLC';
      this.groupName = 'Cao đẳng Chất lượng cao';
      this.groupRegex = '^C.*CLC.*';
    }
  }

  // Prepopulate standard groups instantly
  initializeDefaultGroups(): void {
    if (!this.selectedCampaign) return;
    if (confirm('Hệ thống sẽ tự động khởi tạo 4 nhóm lộ trình chuẩn (Đại học Đại trà, Đại học CLC, Cao đẳng Đại trà, Cao đẳng CLC) với các mốc thời gian lấy từ Đợt thực tập này. Bạn có muốn tiếp tục?')) {
      this.isLoading = true;
      
      const startDate = this.selectedCampaign.start_date ? this.selectedCampaign.start_date.substring(0, 10) : '';
      const endDate = this.selectedCampaign.end_date ? this.selectedCampaign.end_date.substring(0, 10) : '';

      const templates = [
        { code: 'K-A', name: 'Đại học Đại trà', regex: '^D(?!.*CLC).*' },
        { code: 'K-CLC', name: 'Đại học Chất lượng cao', regex: '^D.*CLC.*' },
        { code: 'C-A', name: 'Cao đẳng Đại trà', regex: '^C(?!.*CLC).*' },
        { code: 'C-CLC', name: 'Cao đẳng Chất lượng cao', regex: '^C.*CLC.*' }
      ];

      const createNext = (index: number) => {
        if (index >= templates.length) {
          this.toastService.success('Đã tự động khởi tạo 4 nhóm lộ trình chuẩn thành công!');
          this.loadGroups();
          this.selectedGroup = null;
          return;
        }

        const t = templates[index];
        const payload = {
          code: t.code,
          name: t.name,
          student_filter_regex: t.regex,
          start_date: startDate ? startDate + ' 00:00:00' : undefined,
          end_date: endDate ? endDate + ' 23:59:59' : undefined,
          tttn01_start_date: startDate ? startDate + ' 00:00:00' : undefined,
          tttn01_deadline: endDate ? endDate + ' 23:59:59' : undefined,
          tttn02_start_date: startDate ? startDate + ' 00:00:00' : undefined,
          tttn02_deadline: endDate ? endDate + ' 23:59:59' : undefined,
          tttn03_start_date: startDate ? startDate + ' 00:00:00' : undefined,
          tttn03_deadline: endDate ? endDate + ' 23:59:59' : undefined,
          midterm_start_date: startDate ? startDate + ' 00:00:00' : undefined,
          midterm_deadline: endDate ? endDate + ' 23:59:59' : undefined,
          tttn06_start_date: startDate ? startDate + ' 00:00:00' : undefined,
          tttn06_deadline: endDate ? endDate + ' 23:59:59' : undefined,
          grade_deadline: endDate ? endDate + ' 23:59:59' : undefined
        };

        this.campaignService.createGroup(this.selectedCampaign!.id, payload).subscribe({
          next: () => {
            createNext(index + 1);
          },
          error: (err) => {
            this.toastService.error(`Lỗi tạo nhóm chuẩn ${t.code}: ` + (err?.message || 'Có lỗi xảy ra'));
            this.isLoading = false;
          }
        });
      };

      createNext(0);
    }
  }
}
