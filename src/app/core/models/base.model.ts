export interface BaseResponse<T = any> {
  status: number;
  message: string;
  payload: T;
}

/**
 * Khớp với backend BasePagination.java
 * Backend trả: { current_page, last_page, total, data }
 */
export interface BasePagination<T> {
  current_page: number;
  last_page: number;
  total: number;
  data: T[];
}

/**
 * Khớp với backend PaginationRequest.java
 * Backend nhận query params: page, limit, searchText, orderBy
 */
export interface PaginationRequest {
  page: number;
  limit: number;
  searchText?: string;
  orderBy?: string; // format: "field:ASC" hoặc "field:DESC"
}

/**
 * Khớp với backend LoginResponse.java
 */
export interface LoginResponse {
  token: string;
  user_id: number;
  email: string;
  full_name: string;
  role: string;
  department_id: number | null;
}

/**
 * Thông tin user đang đăng nhập (lưu trong localStorage)
 */
export interface UserInfo {
  userId: number;
  email: string;
  fullName: string;
  role: string;
  departmentId: number | null;
}

/**
 * Khớp với backend CampaignResponse.java
 */
export interface CampaignResponse {
  id: number;
  code: string;
  name: string;
  academic_year: string;
  semester: number | null;
  description: string | null;
  start_date: string;   // "yyyy-MM-dd HH:mm:ss"
  end_date: string;
  tttn01_start_date?: string;
  tttn01_deadline?: string;
  tttn02_start_date?: string;
  tttn02_deadline?: string;
  tttn03_start_date?: string;
  tttn03_deadline?: string;
  midterm_start_date?: string;
  midterm_deadline?: string;
  tttn06_start_date?: string;
  tttn06_deadline?: string;
  status: string;        // "ACTIVE" | "INACTIVE"
  student_count: number;
  department_count: number;
  created_at: string;
}

/**
 * Khớp với backend DepartmentResponse.java
 * parentId = null → Khoa (top-level)
 * parentId != null → Bộ môn (sub-department)
 */
export interface DepartmentResponse {
  id: number;
  parent_id: number | null;
  parent_name: string | null;
  code: string;
  name: string;
  status: string; // "ACTIVE" | "INACTIVE"
  children_count: number;
  children?: DepartmentResponse[];
  created_at: string;
}

/**
 * Khớp với backend UserResponse.java
 */
export interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  role: string;
  department_id: number | null;
  department_name: string | null;
  status: string; // "ACTIVE" | "INACTIVE"
  created_at: string;
}

/**
 * Khớp với backend SystemSettingResponse.java
 */
export interface SystemSettingResponse {
  settingKey: string;
  settingValue: string;
  description: string;
  createdAt: string;
}

export interface CompanyInfoResponse {
  company_name: string;
  tax_code: string;
  address: string;
  supervisor_name: string;
  supervisor_email: string;
  supervisor_phone: string;
  expected_domain: string;
  internship_type: string;
  company_status: string;
}

export interface InternshipPlanResponse {
  id: number;
  week: number;
  task: string;
  expected_result: string;
  evidence_form: string;
  clo_mapped: string;
  gvhd_status: string;
  company_status: string;
}

export interface StudentCampaignResponse {
  id: number;
  student_code: string;
  full_name: string;
  class_name: string;
  status: string;
  campaign_id: number;
  department_id: number;
  gvhd_id?: number;
  gvhd_name?: string;
  committee_id?: number;
  company_info?: CompanyInfoResponse;
  internship_plans?: InternshipPlanResponse[];
  created_at?: string;
}

export interface FinalReportResponse {
  id: number;
  student_campaign_id: number;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  created_at: string;
}
