export interface MenuItem {
  title: string;
  icon: string;
  route: string;
  exact?: boolean;
}

export const adminMenu: MenuItem[] = [
  { title: 'Bảng điều khiển', icon: 'dashboard', route: '/admin/dashboard', exact: true },
  { title: 'Quản lý đợt thực tập', icon: 'assignment_ind', route: '/admin/campaigns' },
];

export const ldkbmMenu: MenuItem[] = [
  { title: 'Bảng điều khiển', icon: 'dashboard', route: '/ldkbm/general-dashboard', exact: true },
  { title: 'Cấu hình CLO & Rubric', icon: 'fact_check', route: '/ldkbm/clo-config' },
  { title: 'Import & Phân công SV', icon: 'group_add', route: '/ldkbm/student-assignment' },
  { title: 'Tổng hợp Khảo sát', icon: 'insights', route: '/ldkbm/survey-dashboard' },
];

export const studentMenu: MenuItem[] = [
  { title: 'Bảng điều khiển', icon: 'dashboard', route: '/student/dashboard', exact: true },
  { title: 'Kê khai Đơn vị TT', icon: 'domain', route: '/student/company-declaration' },
  { title: 'Khởi tạo Kế hoạch', icon: 'assignment', route: '/student/internship-plan' },
  { title: 'Quá trình thực tập', icon: 'history_edu', route: '/student/weekly-log' },
  { title: 'Báo cáo tổng kết', icon: 'analytics', route: '/student/final-report' },
  { title: 'Khảo sát thực tập', icon: 'rate_review', route: '/student/survey' },
];

export const teacherMenu: MenuItem[] = [
  { title: 'Bảng điều khiển', icon: 'dashboard', route: '/teacher/dashboard', exact: true },
  { title: 'Quản lý Sinh viên', icon: 'groups', route: '/teacher/students' },
  { title: 'Yêu cầu Phê duyệt', icon: 'fact_check', route: '/teacher/approval-requests' },
  { title: 'Chấm điểm Rubric', icon: 'assignment_turned_in', route: '/teacher/rubric-evaluation' },
  { title: 'Bảng tổng hợp điểm', icon: 'table_view', route: '/teacher/score-summary' },
];

export const companyMenu: MenuItem[] = [
  { title: 'Bảng điều khiển', icon: 'dashboard', route: '/company/dashboard', exact: true },
  { title: 'Quản lý Thực tập sinh', icon: 'people', route: '/company/manage-interns' },
  { title: 'Phản hồi Đánh giá', icon: 'rate_review', route: '/company/survey' },
];

export const tncmMenu: MenuItem[] = [
  { title: 'Bảng điều khiển', icon: 'dashboard', route: '/tncm/dashboard', exact: true },
  { title: 'Phân công GVHD', icon: 'assignment_ind', route: '/tncm/student-assignment' },
  { title: 'Phê duyệt Bảng điểm', icon: 'verified', route: '/tncm/score-approval' },
];

export const qaMenu: MenuItem[] = [
  { title: 'Bảng điều khiển', icon: 'dashboard', route: '/qa/dashboard', exact: true },
  { title: 'Báo cáo AUN-QA', icon: 'analytics', route: '/qa/aun-qa' },
  { title: 'Quản lý CAPA', icon: 'report_problem', route: '/qa/capa' }
];
