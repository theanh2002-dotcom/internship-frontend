export interface LoginRequest {
  email: string;
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
  companyName: string;
  taxCode: string;
  address: string;
  mentorName: string;
  mentorPhone: string;
  mentorEmail: string;
  position: string;
}

export interface InternshipPlanTask {
  week: number;
  taskDescription: string;
  expectedResult: string;
}

export interface InternshipPlanRequest {
  studentCampaignId: number;
  tasks: InternshipPlanTask[];
}

export interface WeeklyLogRequest {
  week_number: number;
  content: string;
  results: string;
  student_campaign_id: number;
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
