export interface LoginRequest {
  username?: string;
  password?: string;
  code?: string;
  loginType: 'NORMAL' | 'OAUTH2';
}

export interface ImportStudentRequest {
  campaignId: number;
  departmentId: number;
  fileBase64?: string; // Tùy chọn nếu dùng JSON, thực tế có thể dùng FormData
}

export interface AssignRequest {
  studentCampaignIds: number[];
  teacherId: number;
  role: 'GVHD' | 'HĐ'; // Hoặc enum tương ứng backend
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
  weekNumber: number;
  content: string;
  studentCampaignId: number;
}
