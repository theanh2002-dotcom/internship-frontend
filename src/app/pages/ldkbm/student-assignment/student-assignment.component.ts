import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { CampaignService } from '../../../core/services/campaign.service';
import { UserService } from '../../../core/services/user.service';
import { 
  ImportStudentRequest, 
  StudentItem, 
  AssignRequest, 
  AssignItem,
  AssignmentStatsResponse,
  AutoAssignPreviewResponse,
  AutoAssignRequest
} from '../../../core/models/request.model';
import { CampaignResponse, PaginationRequest, UserResponse } from '../../../core/models/base.model';
import { AuthService } from '../../../core/services/auth.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-student-assignment',
  templateUrl: './student-assignment.component.html',
  styleUrls: ['./student-assignment.component.scss']
})
export class StudentAssignmentComponent implements OnInit {
  isLoading = false;
      campaigns: CampaignResponse[] = [];
  selectedCampaignId: number | null = null;
  departmentId: number | null = null;

  students: any[] = [];
  totalItems = 0;
  currentPage = 1;
  pageSize = 10;
  searchQuery = '';

  // For selection
  selectedStudentIds = new Set<number>();

  // Modals
  isManualModalOpen = false;
  isAssignModalOpen = false;
  isAutoAssignModalOpen = false;
  isStatsModalOpen = false;
  isDeleteConfirmOpen = false;
  isUnassignConfirmOpen = false;
  studentPendingDelete: any | null = null;
  studentsToUnassign: any[] = [];

  // Manual Form
  formStudentCode = '';
  formFullName = '';
  formClassName = '';
  formEmail = '';

  // Assign Form
  assignMode: 'MANUAL' | 'AUTO' = 'MANUAL';
  teachers: UserResponse[] = [];
  selectedTeacherIds = new Set<number>();
  teacherSearchQuery = '';

  autoAssignScope: 'UNASSIGNED' | 'SELECTED' = 'UNASSIGNED';
  autoOverwriteExisting = false;
  autoSelectedTeacherIds = new Set<number>();
  autoSurplusTeacherIds = new Set<number>();
  autoTeacherSearchQuery = '';
  autoPreview: AutoAssignPreviewResponse | null = null;
  isAutoPreviewLoading = false;
  isAutoApplying = false;

  assignmentStats: AssignmentStatsResponse[] = [];
  isStatsLoading = false;

  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(private toastService: ToastService, private studentCampaignService: StudentCampaignService,
    private campaignService: CampaignService,
    private userService: UserService,
    private authService: AuthService) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.departmentId) {
      this.departmentId = user.departmentId;
    }
    this.loadCampaigns();
    this.loadTeachers();
  }

  loadCampaigns(): void {
    this.campaignService.getCampaignOptions().subscribe({
      next: (res) => {
        this.campaigns = res || [];
        if (this.campaigns.length > 0) {
          this.selectedCampaignId = this.campaigns[0].id;
          if (!this.departmentId) {
            this.toastService.error('Tài khoản của bạn chưa được gắn với Khoa/Bộ môn nào. Vui lòng liên hệ Admin.');
          } else {
            this.loadStudents();
          }
        }
      }
    });
  }

  loadTeachers(): void {
    this.userService.getUsers({ page: 1, limit: 1000 }, 'GVHD', this.departmentId || undefined).subscribe({
      next: (res) => {
        this.teachers = res.data || [];
      }
    });
  }

  onCampaignChange(): void {
    this.currentPage = 1;
    this.selectedStudentIds.clear();
    if (this.departmentId) {
      this.loadStudents();
    } else {
      this.toastService.error('Tài khoản của bạn chưa được gắn với Khoa/Bộ môn nào. Vui lòng liên hệ Admin.');
    }
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadStudents();
  }

  loadStudents(): void {
    if (!this.selectedCampaignId || !this.departmentId) return;

    this.isLoading = true;
    const req: PaginationRequest = { 
      page: this.currentPage, 
      limit: this.pageSize,
      searchText: this.searchQuery
    };
    
    this.studentCampaignService.findByCampaignAndDepartment(this.selectedCampaignId, this.departmentId, req).subscribe({
      next: (res) => {
        this.students = res.data || [];
        this.totalItems = res.total || 0;
        this.currentPage = res.current_page || 1;
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.error(err.message || 'Lỗi tải danh sách sinh viên');
        this.isLoading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadStudents();
  }

  // --- SELECTION ---

  toggleAll(event: any): void {
    if (event.target.checked) {
      this.students.forEach(s => this.selectedStudentIds.add(s.id));
    } else {
      this.selectedStudentIds.clear();
    }
  }

  toggleStudent(id: number, event: any): void {
    if (event.target.checked) {
      this.selectedStudentIds.add(id);
    } else {
      this.selectedStudentIds.delete(id);
    }
  }

  isAllSelected(): boolean {
    return this.students.length > 0 && this.students.every(s => this.selectedStudentIds.has(s.id));
  }

  clearSelection(): void {
    this.selectedStudentIds.clear();
  }

  // --- MANUAL CREATE ---

  openManualModal(): void {
    if (!this.selectedCampaignId) {
      this.showError('Vui lòng chọn đợt thực tập trước.');
      return;
    }
    this.formStudentCode = '';
    this.formFullName = '';
    this.formClassName = '';
    this.formEmail = '';
    this.isManualModalOpen = true;
  }

  closeManualModal(): void {
    this.isManualModalOpen = false;
  }

  saveManualStudent(): void {
    if (!this.formStudentCode || !this.formFullName) {
      this.showError('Mã sinh viên và Họ tên không được để trống.');
      return;
    }

    const item: StudentItem = {
      student_code: this.formStudentCode,
      full_name: this.formFullName,
      class_name: this.formClassName,
      email: this.formEmail
    };

    const req: ImportStudentRequest = {
      campaign_id: this.selectedCampaignId!,
      department_id: this.departmentId!,
      students: [item]
    };

    this.isLoading = true;
    this.studentCampaignService.importStudents(req).subscribe({
      next: () => {
        this.closeManualModal();
        this.showSuccess('Đã thêm sinh viên thành công.');
        this.loadStudents();
      },
      error: (err) => {
        this.showError(err.error?.message || err.message || 'Lỗi khi thêm sinh viên');
        this.isLoading = false;
      }
    });
  }

  openDeleteConfirm(student: any): void {
    this.studentPendingDelete = student;
    this.isDeleteConfirmOpen = true;
  }

  closeDeleteConfirm(): void {
    this.isDeleteConfirmOpen = false;
    this.studentPendingDelete = null;
  }

  confirmDeleteStudent(): void {
    if (!this.studentPendingDelete) return;

    const id = this.studentPendingDelete.id;
    this.isLoading = true;
    this.studentCampaignService.deleteStudentCampaign(id).subscribe({
      next: () => {
        this.closeDeleteConfirm();
        this.showSuccess('Đã xóa sinh viên khỏi đợt thực tập.');
        this.loadStudents();
      },
      error: (err) => {
        this.showError(err.error?.message || err.message || 'Lỗi khi xóa sinh viên');
        this.isLoading = false;
      }
    });
  }

  getSelectedCampaign(): CampaignResponse | undefined {
    return this.campaigns.find(c => Number(c.id) === Number(this.selectedCampaignId));
  }

  private normalizeDateString(value: string): string {
    return value.includes(' ') ? value.replace(' ', 'T') : value;
  }

  // --- EXCEL IMPORT ---

  triggerFileInput(): void {
    if (!this.selectedCampaignId) {
      this.showError('Vui lòng chọn đợt thực tập trước.');
      return;
    }
    this.fileInput.nativeElement.click();
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const importSheet = this.findImportSheet(workbook);
        if (!importSheet) {
          this.showError('Không tìm thấy sheet danh sách sinh viên. File cần có các cột "MSSV", "Họ và tên", "Lớp" và "Đơn vị thực tập".');
          return;
        }

        const rawRows = importSheet.rows;
        if (rawRows.length <= importSheet.headerRowIndex + 1) {
          this.showError('File Excel trống hoặc không có dữ liệu sinh viên.');
          return;
        }

        // Xác định header: tìm vị trí cột dựa trên header row
        const headerRow = rawRows[importSheet.headerRowIndex].map((h: any) => String(h || '').trim());
        const normalizedHeaderRow = headerRow.map((h: string) => this.normalizeHeader(h));

        // Tìm index cột theo tên header (hỗ trợ nhiều format)
        const mssvIdx = normalizedHeaderRow.findIndex((h: string) => h === 'mssv' || h === 'ma sv' || h === 'ma sinh vien');
        const lopIdx = normalizedHeaderRow.findIndex((h: string) => h === 'lop');
        const hoVaTenIdx = normalizedHeaderRow.findIndex((h: string) => h === 'ho va ten' || h === 'ho ten');
        const hoIdx = normalizedHeaderRow.findIndex((h: string) => h === 'ho' || h === 'ho dem');
        const tenIdx = normalizedHeaderRow.findIndex((h: string) => h === 'ten');
        const companyIdx = normalizedHeaderRow.findIndex((h: string) => h === 'don vi thuc tap' || h === 'dv thuc tap' || h === 'dvtt');

        // Mẫu chuẩn: B1:C1 gộp tiêu đề "Họ và tên"; dữ liệu B là họ đệm, C là tên.
        // Vẫn hỗ trợ format 1 cột "Họ và tên" để tránh lỗi với file cũ.
        const isMergedFormat = hoVaTenIdx >= 0 && (
          headerRow[hoVaTenIdx + 1] === '' || headerRow[hoVaTenIdx + 1] === undefined ||
          lopIdx === hoVaTenIdx + 2
        );

        const students: StudentItem[] = [];

        for (let i = importSheet.headerRowIndex + 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) continue;

          let studentCode = '';
          let fullName = '';
          let lastName = '';
          let firstName = '';
          let className = '';
          let companyName = '';

          if (mssvIdx >= 0) {
            // Có header rõ ràng → đọc theo index
            studentCode = String(row[mssvIdx] || '').trim();
            
            if (hoIdx >= 0 && tenIdx >= 0) {
              lastName = String(row[hoIdx] || '').trim();
              firstName = String(row[tenIdx] || '').trim();
              fullName = `${lastName} ${firstName}`.trim();
            } else if (isMergedFormat && hoVaTenIdx >= 0) {
              // Họ đệm ở cột hoVaTenIdx, tên ở cột hoVaTenIdx + 1.
              lastName = String(row[hoVaTenIdx] || '').trim();
              firstName = String(row[hoVaTenIdx + 1] || '').trim();
              fullName = firstName ? `${lastName} ${firstName}` : lastName;
            } else if (hoVaTenIdx >= 0) {
              // Format 1 cột họ tên
              fullName = String(row[hoVaTenIdx] || '').trim();
              const parts = this.splitFullName(fullName);
              lastName = parts.lastName;
              firstName = parts.firstName;
            }

            className = lopIdx >= 0 ? String(row[lopIdx] || '').trim() : '';
            companyName = companyIdx >= 0 ? String(row[companyIdx] || '').trim() : '';
          } else {
            // Fallback mẫu chuẩn: A=MSSV, B=Họ đệm, C=Tên, D=Lớp, E=Đơn vị thực tập.
            // Header gộp B1:C1 là "Họ và tên" như file mẫu.
            studentCode = String(row[0] || '').trim();
            if (row.length >= 5 && String(row[4] || '').trim()) {
              lastName = String(row[1] || '').trim();
              firstName = String(row[2] || '').trim();
              fullName = firstName ? `${lastName} ${firstName}` : lastName;
              className = String(row[3] || '').trim();
              companyName = String(row[4] || '').trim();
            } else {
              fullName = String(row[1] || '').trim();
              const parts = this.splitFullName(fullName);
              lastName = parts.lastName;
              firstName = parts.firstName;
              className = String(row[2] || '').trim();
              companyName = String(row[3] || '').trim();
            }
          }

          if (studentCode && fullName) {
            students.push({
              student_code: studentCode,
              full_name: fullName,
              class_name: className,
              email: '',
              company_name: companyName
            });
          }
        }

        if (students.length === 0) {
          this.showError('Không tìm thấy dữ liệu hợp lệ trong file Excel. File cần có cột "MSSV", "Họ và tên", "Lớp" và "Đơn vị thực tập".');
          return;
        }

        const req: ImportStudentRequest = {
          campaign_id: this.selectedCampaignId!,
          department_id: this.departmentId!,
          students: students
        };

        this.isLoading = true;
        this.studentCampaignService.importStudents(req).subscribe({
          next: () => {
            this.showSuccess(`Đã import thành công ${students.length} sinh viên.`);
            this.loadStudents();
          },
          error: (err) => {
            this.showError(err.message || 'Lỗi khi import file');
            this.isLoading = false;
          }
        });

      } catch (error) {
        this.showError('Lỗi đọc file Excel. Định dạng không được hỗ trợ.');
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset file input
    event.target.value = null;
  }

  downloadTemplate(): void {
    const rows: any[][] = [
      ['MSSV', 'Họ và tên', '', 'Lớp', 'Đơn vị thực tập'],
      ['1501665', 'Lại Thế', 'Anh', '65PM4', 'sdc'],
      ['0002267', 'Mai Văn', 'Cường', '67CNPM', 'sdc'],
      ['85365', 'Vũ Huy', 'Hoàng', '65PM4', 'sc'],
      ['113465', 'Lê Ngọc', 'Lâm', '65PM4', 'scdc'],
      ['119365', 'Vũ Ngọc Hoài', 'Linh', '65PM3', 'sdc'],
      ['0197766', 'Nguyễn Hoàng', 'Nam', '66CNPM', ''],
      ['142165', 'Nguyễn Phương', 'Nam', '65PM6', ''],
      ['154765', 'Đỗ Khoa Hải', 'Phong', '65PM6', ''],
      ['181165', 'Lê Bá', 'Thắng', '65PM6', '']
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!merges'] = [
      { s: { r: 0, c: 1 }, e: { r: 0, c: 2 } }
    ];
    
    // Đặt độ rộng cột
    ws['!cols'] = [
      { wch: 10 },  // A: MSSV
      { wch: 20 },  // B: Họ đệm
      { wch: 12 },  // C: Tên
      { wch: 12 },  // D: Lớp
      { wch: 28 }   // E: Đơn vị thực tập
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SinhVien');
    XLSX.writeFile(wb, 'Template_Import_SinhVien.xlsx');
  }

  private normalizeHeader(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .trim()
      .toLowerCase();
  }

  private findImportSheet(workbook: XLSX.WorkBook): { rows: any[][]; headerRowIndex: number } | null {
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      const maxHeaderScan = Math.min(rows.length, 30);

      for (let i = 0; i < maxHeaderScan; i++) {
        const normalizedRow = (rows[i] || []).map((h: any) => this.normalizeHeader(String(h || '')));
        const hasStudentCode = normalizedRow.some((h: string) =>
          h === 'mssv' || h === 'ma sv' || h === 'ma sinh vien' || h === 'ma so sinh vien'
        );
        const hasFullName = normalizedRow.some((h: string) => h === 'ho va ten' || h === 'ho ten');
        const hasSplitName = normalizedRow.some((h: string) => h === 'ho' || h === 'ho dem')
          && normalizedRow.some((h: string) => h === 'ten');
        const hasClassName = normalizedRow.some((h: string) => h === 'lop');

        if (hasStudentCode && (hasFullName || hasSplitName) && hasClassName) {
          return { rows, headerRowIndex: i };
        }
      }
    }

    return null;
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

  getStudentFirstName(student: any): string {
    if (student?.first_name) return student.first_name;
    return this.splitFullName(student?.full_name || '').firstName;
  }

  // --- ASSIGN TEACHER ---

  openAssignModal(mode: 'MANUAL' | 'AUTO' = 'MANUAL'): void {
    if (!this.selectedCampaignId || !this.departmentId) {
      this.showError('Vui lòng chọn đợt thực tập và kiểm tra khoa/bộ môn trước.');
      return;
    }

    if (mode === 'MANUAL' && this.selectedStudentIds.size === 0) {
      // Nếu chưa chọn sinh viên nào trên bảng -> Mặc định mở Tab Phân bổ tự động
      this.assignMode = 'AUTO';
    } else {
      this.assignMode = mode;
    }

    // Khởi tạo trạng thái cho Tab Thủ công
    this.selectedTeacherIds.clear();
    if (this.selectedStudentIds.size === 1) {
      const singleId = Array.from(this.selectedStudentIds)[0];
      const student = this.students.find(s => s.id === singleId);
      if (student?.gvhd_ids && Array.isArray(student.gvhd_ids)) {
        student.gvhd_ids.forEach((id: number) => this.selectedTeacherIds.add(id));
      }
    }
    this.teacherSearchQuery = '';

    // Khởi tạo trạng thái cho Tab Tự động
    this.autoAssignScope = this.selectedStudentIds.size > 0 ? 'SELECTED' : 'UNASSIGNED';
    this.autoOverwriteExisting = false;
    this.autoSelectedTeacherIds.clear();
    this.autoSurplusTeacherIds.clear();
    this.autoTeacherSearchQuery = '';
    this.autoPreview = null;
    this.isAutoPreviewLoading = false;
    this.isAutoApplying = false;

    this.isAssignModalOpen = true;
  }

  openAssignModalForOne(student: any): void {
    const studentId = typeof student === 'object' ? student.id : student;
    const studentObj = typeof student === 'object' ? student : this.students.find(s => s.id === studentId);
    this.selectedStudentIds.clear();
    this.selectedStudentIds.add(studentId);
    this.openAssignModal('MANUAL');
  }

  openAutoAssignModal(): void {
    this.openAssignModal('AUTO');
  }

  setAssignMode(mode: 'MANUAL' | 'AUTO'): void {
    if (mode === 'MANUAL' && this.selectedStudentIds.size === 0) {
      this.showError('Vui lòng chọn ít nhất 1 sinh viên trên bảng để dùng chế độ Phân công thủ công.');
      return;
    }
    this.assignMode = mode;
  }

  closeAssignModal(): void {
    this.isAssignModalOpen = false;
    this.teacherSearchQuery = '';
    this.autoTeacherSearchQuery = '';
    this.autoPreview = null;
    this.autoSurplusTeacherIds.clear();
    this.isAutoPreviewLoading = false;
    this.isAutoApplying = false;
  }

  closeAutoAssignModal(): void {
    this.closeAssignModal();
  }

  onAutoAssignScopeChange(): void {
    this.autoPreview = null;
    this.autoSurplusTeacherIds.clear();
    this.autoOverwriteExisting = false;
  }

  get autoFilteredTeachers(): UserResponse[] {
    const query = this.autoTeacherSearchQuery.trim().toLowerCase();
    if (!query) {
      return this.teachers;
    }
    return this.teachers.filter(teacher => {
      const fullName = (teacher.full_name || '').toLowerCase();
      const email = (teacher.email || '').toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
  }

  toggleAutoTeacherSelection(teacherId: number): void {
    if (this.autoSelectedTeacherIds.has(teacherId)) {
      this.autoSelectedTeacherIds.delete(teacherId);
      this.autoSurplusTeacherIds.delete(teacherId);
    } else {
      this.autoSelectedTeacherIds.add(teacherId);
    }
    this.autoPreview = null;
  }

  toggleAutoSurplusTeacher(teacherId: number): void {
    if (this.autoSurplusTeacherIds.has(teacherId)) {
      this.autoSurplusTeacherIds.delete(teacherId);
      return;
    }

    if (this.autoSurplusTeacherIds.size >= this.autoSurplusRequired) {
      this.showError(`Chỉ được chọn đúng ${this.autoSurplusRequired} giảng viên nhận thêm sinh viên.`);
      return;
    }
    this.autoSurplusTeacherIds.add(teacherId);
  }

  get autoSurplusRequired(): number {
    return this.autoPreview?.surplus_students || 0;
  }

  get selectedAutoTeachers(): UserResponse[] {
    return this.teachers.filter(teacher => this.autoSelectedTeacherIds.has(teacher.id));
  }

  get canPreviewAutoAssignment(): boolean {
    if (!this.selectedCampaignId || !this.departmentId || this.autoSelectedTeacherIds.size === 0) {
      return false;
    }
    if (this.autoAssignScope === 'SELECTED' && this.selectedStudentIds.size === 0) {
      return false;
    }
    if (this.autoPreview?.requires_surplus_selection) {
      return this.autoSurplusTeacherIds.size === this.autoSurplusRequired;
    }
    return true;
  }

  get canApplyAutoAssignment(): boolean {
    return !!this.autoPreview
      && !this.autoPreview.requires_surplus_selection
      && (this.autoPreview.assignments?.length || 0) > 0
      && !this.isAutoApplying
      && !this.isAutoPreviewLoading;
  }

  calculateAutoAssignment(): void {
    if (this.autoSelectedTeacherIds.size === 0) {
      this.showError('Vui lòng chọn ít nhất 1 giảng viên để phân công tự động.');
      return;
    }
    if (this.autoAssignScope === 'SELECTED' && this.selectedStudentIds.size === 0) {
      this.showError('Vui lòng chọn sinh viên trước khi dùng phạm vi sinh viên đang chọn.');
      return;
    }
    if (this.autoPreview?.requires_surplus_selection && this.autoSurplusTeacherIds.size !== this.autoSurplusRequired) {
      this.showError(`Cần chọn đúng ${this.autoSurplusRequired} giảng viên nhận thêm sinh viên.`);
      return;
    }

    this.isAutoPreviewLoading = true;
    this.studentCampaignService.previewAutoAssign(this.buildAutoAssignRequest()).subscribe({
      next: (res) => {
        this.autoPreview = res;
        if (!res.requires_surplus_selection) {
          this.autoSurplusTeacherIds.clear();
          (res.teacher_summaries || [])
            .filter(item => item.receives_surplus)
            .forEach(item => this.autoSurplusTeacherIds.add(item.teacher_id));
        }
        this.isAutoPreviewLoading = false;
      },
      error: (err) => {
        this.showError(err.message || 'Lỗi khi tính phân công tự động');
        this.isAutoPreviewLoading = false;
      }
    });
  }

  applyAutoAssignment(): void {
    if (!this.canApplyAutoAssignment) {
      this.showError('Vui lòng xem phân bổ hợp lệ trước khi áp dụng.');
      return;
    }

    this.isAutoApplying = true;
    this.studentCampaignService.applyAutoAssign(this.buildAutoAssignRequest()).subscribe({
      next: () => {
        this.showSuccess('Đã phân công tự động GVHD thành công.');
        this.closeAutoAssignModal();
        this.selectedStudentIds.clear();
        this.loadStudents();
      },
      error: (err) => {
        this.showError(err.message || 'Lỗi khi áp dụng phân công tự động');
        this.isAutoApplying = false;
      }
    });
  }

  private buildAutoAssignRequest(): AutoAssignRequest {
    const request: AutoAssignRequest = {
      campaign_id: this.selectedCampaignId!,
      department_id: this.departmentId!,
      teacher_ids: Array.from(this.autoSelectedTeacherIds),
      surplus_teacher_ids: Array.from(this.autoSurplusTeacherIds),
      overwrite_existing: this.autoOverwriteExisting
    };

    if (this.autoAssignScope === 'SELECTED') {
      request.student_campaign_ids = Array.from(this.selectedStudentIds);
    }

    return request;
  }

  openAssignmentStats(): void {
    if (!this.selectedCampaignId || !this.departmentId) {
      this.showError('Vui lòng chọn đợt thực tập và kiểm tra khoa/bộ môn trước.');
      return;
    }

    this.isStatsModalOpen = true;
    this.isStatsLoading = true;
    this.assignmentStats = [];
    this.studentCampaignService.getAssignmentStats(this.selectedCampaignId, this.departmentId).subscribe({
      next: (res) => {
        this.assignmentStats = res || [];
        this.isStatsLoading = false;
      },
      error: (err) => {
        this.showError(err.message || 'Lỗi tải thống kê phân công GVHD');
        this.isStatsLoading = false;
      }
    });
  }

  closeAssignmentStats(): void {
    this.isStatsModalOpen = false;
    this.assignmentStats = [];
    this.isStatsLoading = false;
  }

  get selectedStudentsForAssignment(): any[] {
    return this.students.filter(student => this.selectedStudentIds.has(student.id));
  }

  get filteredTeachers(): UserResponse[] {
    const query = this.teacherSearchQuery.trim().toLowerCase();
    if (!query) {
      return this.teachers;
    }
    return this.teachers.filter(teacher => {
      const fullName = (teacher.full_name || '').toLowerCase();
      const email = (teacher.email || '').toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
  }

  toggleTeacherSelection(teacherId: number): void {
    if (this.selectedTeacherIds.has(teacherId)) {
      this.selectedTeacherIds.delete(teacherId);
    } else {
      this.selectedTeacherIds.add(teacherId);
    }
  }

  saveAssignment(): void {
    if (this.selectedTeacherIds.size === 0) {
      this.showError('Vui lòng chọn ít nhất 1 Giáo viên hướng dẫn.');
      return;
    }

    const assignments: AssignItem[] = Array.from(this.selectedStudentIds).map(id => ({
      student_campaign_id: id,
      gvhd_ids: Array.from(this.selectedTeacherIds)
    }));

    const req: AssignRequest = { assignments };

    this.isLoading = true;
    this.studentCampaignService.assignGvhd(req).subscribe({
      next: () => {
        this.closeAssignModal();
        this.showSuccess('Đã phân công GVHD thành công.');
        this.selectedStudentIds.clear();
        this.loadStudents();
      },
      error: (err) => {
        this.showError(err.message || 'Lỗi khi phân công');
        this.isLoading = false;
      }
    });
  }

  unassignFromModal(): void {
    const list = this.selectedStudentsForAssignment;
    if (list.length === 0) return;
    this.closeAssignModal();
    this.studentsToUnassign = list;
    this.isUnassignConfirmOpen = true;
  }

  get hasAssignedStudentsInModal(): boolean {
    return this.selectedStudentsForAssignment.some(s => !!s.gvhd_name || (s.gvhd_ids && s.gvhd_ids.length > 0));
  }

  openUnassignConfirmForOne(student: any): void {
    this.studentsToUnassign = [student];
    this.isUnassignConfirmOpen = true;
  }

  openBulkUnassignConfirm(): void {
    if (this.selectedStudentIds.size === 0) {
      this.showError('Vui lòng chọn ít nhất 1 sinh viên.');
      return;
    }
    const list = this.students.filter(s => this.selectedStudentIds.has(s.id));
    this.studentsToUnassign = list;
    this.isUnassignConfirmOpen = true;
  }

  closeUnassignConfirm(): void {
    this.isUnassignConfirmOpen = false;
    this.studentsToUnassign = [];
  }

  confirmUnassignGvhd(): void {
    if (this.studentsToUnassign.length === 0) return;

    const assignments: AssignItem[] = this.studentsToUnassign.map(s => ({
      student_campaign_id: s.id,
      gvhd_ids: []
    }));

    const req: AssignRequest = { assignments };

    this.isLoading = true;
    this.studentCampaignService.assignGvhd(req).subscribe({
      next: () => {
        const count = this.studentsToUnassign.length;
        this.closeUnassignConfirm();
        this.showSuccess(`Đã hủy phân công GVHD cho ${count} sinh viên thành công.`);
        this.selectedStudentIds.clear();
        this.loadStudents();
      },
      error: (err) => {
        this.showError(err.message || 'Lỗi khi hủy phân công');
        this.isLoading = false;
      }
    });
  }

  // --- MESSAGING ---

  showError(msg: string): void {
    this.toastService.error(msg);
  }

  showSuccess(msg: string): void {
    this.toastService.success(msg);
  }
}
