import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { StudentCampaignService } from '../../../core/services/student-campaign.service';
import { CampaignService } from '../../../core/services/campaign.service';
import { UserService } from '../../../core/services/user.service';
import { 
  ImportStudentRequest, 
  StudentItem, 
  AssignRequest, 
  AssignItem 
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

  // For selection
  selectedStudentIds = new Set<number>();

  // Modals
  isManualModalOpen = false;
  isAssignModalOpen = false;

  // Manual Form
  formStudentCode = '';
  formFullName = '';
  formClassName = '';
  formEmail = '';

  // Assign Form
  teachers: UserResponse[] = [];
  selectedTeacherId: number | null = null;

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
    this.campaignService.getCampaigns({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        this.campaigns = res.data || [];
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
    if (!this.departmentId) return;
    this.userService.getUsers({ page: 1, limit: 1000 }, 'GVHD', this.departmentId).subscribe({
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

  loadStudents(): void {
    if (!this.selectedCampaignId || !this.departmentId) return;

    this.isLoading = true;
    const req: PaginationRequest = { page: this.currentPage, limit: this.pageSize };
    
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
    if (!this.formEmail) {
      this.showError('Email sinh viên không được để trống.');
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

  deleteStudent(id: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa sinh viên này khỏi đợt thực tập?')) {
      this.isLoading = true;
      this.studentCampaignService.deleteStudentCampaign(id).subscribe({
        next: () => {
          this.showSuccess('Đã xóa sinh viên khỏi đợt thực tập.');
          this.loadStudents();
        },
        error: (err) => {
          this.showError(err.error?.message || err.message || 'Lỗi khi xóa sinh viên');
          this.isLoading = false;
        }
      });
    }
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
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);

        const students: StudentItem[] = [];
        for (const row of json) {
          if (row['Mã SV'] && row['Họ tên']) {
            students.push({
              student_code: String(row['Mã SV']).trim(),
              full_name: String(row['Họ tên']).trim(),
              class_name: String(row['Lớp'] || '').trim(),
              email: row['Email'] ? String(row['Email']).trim() : ''
            });
          }
        }

        if (students.length === 0) {
          this.showError('Không tìm thấy dữ liệu hợp lệ trong file Excel. File cần có cột "Mã SV", "Họ tên" và "Email".');
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
    const data = [
      { 'Mã SV': '000000', 'Họ tên': 'Nguyễn Văn A', 'Lớp': '64PM1', 'Email': '000000@huce.edu.vn' },
      { 'Mã SV': '000001', 'Họ tên': 'Trần Thị B', 'Lớp': '64PM2', 'Email': '000001@huce.edu.vn' }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SinhVien');
    XLSX.writeFile(wb, 'Template_Import_SinhVien.xlsx');
  }

  // --- ASSIGN TEACHER ---

  openAssignModal(): void {
    if (this.selectedStudentIds.size === 0) {
      this.showError('Vui lòng chọn ít nhất 1 sinh viên để phân công.');
      return;
    }
    this.selectedTeacherId = null;
    this.isAssignModalOpen = true;
  }

  closeAssignModal(): void {
    this.isAssignModalOpen = false;
  }

  saveAssignment(): void {
    if (!this.selectedTeacherId) {
      this.showError('Vui lòng chọn Giáo viên hướng dẫn.');
      return;
    }

    const assignments: AssignItem[] = Array.from(this.selectedStudentIds).map(id => ({
      student_campaign_id: id,
      gvhd_id: this.selectedTeacherId!
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

  // --- MESSAGING ---

  showError(msg: string): void {
    this.toastService.error(msg);
  }

  showSuccess(msg: string): void {
    this.toastService.success(msg);
  }
}
