export interface LoginRequest {
  email: string;
  code?: string;
  account_type?: 'STUDENT' | 'STAFF';
  password: string;
}

/**
 * Khớp với backend RegisterRequest.java
 * Backend dùng @JsonProperty("full_name") và @JsonProperty("department_id")
 */
export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: 'ADMIN' | 'LDKBM' | 'GVHD' | 'STUDENT' | 'COMPANY_SUPERVISOR';
  department_id?: number | null;
}

export interface StudentItem {
  student_code: string;
  full_name: string;
  class_name: string;
  email?: string;
  company_name?: string;
}

export interface ImportStudentRequest {
  campaign_id: number;
  department_id: number;
  students: StudentItem[];
}

export interface AssignItem {
  student_campaign_id: number;
  gvhd_ids?: number[];
  committee_id?: number;
}

export interface AssignRequest {
  assignments: AssignItem[];
}

export interface AutoAssignRequest {
  campaign_id: number;
  department_id: number;
  student_campaign_ids?: number[];
  teacher_ids: number[];
  surplus_teacher_ids?: number[];
  overwrite_existing?: boolean;
}

export interface AutoAssignTeacherSummary {
  teacher_id: number;
  teacher_name: string;
  teacher_email: string;
  current_count: number;
  assigned_count: number;
  final_count: number;
  receives_surplus: boolean;
}

export interface AutoAssignItem {
  student_campaign_id: number;
  student_code: string;
  student_name: string;
  class_name: string;
  teacher_id: number;
  teacher_name: string;
  teacher_email: string;
  surplus_assignment: boolean;
}

export interface AutoAssignPreviewResponse {
  total_students: number;
  total_teachers: number;
  base_students_per_teacher: number;
  surplus_students: number;
  requires_surplus_selection: boolean;
  overwrite_existing: boolean;
  teacher_summaries: AutoAssignTeacherSummary[];
  assignments: AutoAssignItem[];
}

export interface AssignmentStatsResponse {
  teacher_id: number;
  teacher_name: string;
  teacher_email: string;
  department_name?: string;
  external_department?: boolean;
  assigned_count: number;
}

export interface EligibleTeacherResponse {
  id: number;
  email: string;
  full_name: string;
  department_id: number | null;
  department_name: string | null;
  external_department: boolean;
  invited: boolean;
}

export interface CompanyInfoRequest {
  company_name: string;
  tax_code: string;
  address: string;
  supervisor_name: string;
  supervisor_phone: string;
  supervisor_email: string;
  expected_domain: string;
  internship_type: string;
}

export interface InternshipPlanTask {
  week: number;
  task: string;
  expected_result: string;
  evidence_form: string;
  clo_mapped: string;
}

export interface InternshipPlanRequest {
  student_campaign_id: number;
  plans: InternshipPlanTask[];
}

export interface WeeklyLogRequest {
  week_number: number;
  content: string;
  results: string;
  student_campaign_id: number;
  completion_percentage?: number;
}

export interface ReportItem {
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
}

export interface FinalReportRequest {
  student_campaign_id: number;
  reports: ReportItem[];
}
