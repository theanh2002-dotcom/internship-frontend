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
}

export interface ImportStudentRequest {
  campaign_id: number;
  department_id: number;
  students: StudentItem[];
}

export interface AssignItem {
  student_campaign_id: number;
  gvhd_id?: number;
  committee_id?: number;
}

export interface AssignRequest {
  assignments: AssignItem[];
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
