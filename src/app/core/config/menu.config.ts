export interface MenuItem {
  title: string;
  icon: string;
  route: string;
  exact?: boolean;
}

export const adminMenu: MenuItem[] = [
  { title: 'Bảng điều khiển', icon: 'dashboard', route: '/admin/dashboard', exact: true },
  { title: 'Quản lý đợt thực tập', icon: 'assignment_ind', route: '/admin/campaigns' },
  { title: 'Quản lý Khoa/Bộ môn', icon: 'apartment', route: '/admin/departments' },
  { title: 'Tài khoản Nhân sự', icon: 'group_add', route: '/admin/users' },
  { title: 'Cấu hình thông báo', icon: 'notifications_active', route: '/admin/notifications' },
];

export const ldkbmMenu: MenuItem[] = [
  { title: 'Bảng điều khiển', icon: 'dashboard', route: '/ldkbm/general-dashboard', exact: true },
  { title: 'Cấu hình CLO & Rubric', icon: 'fact_check', route: '/ldkbm/clo-config' },
  { title: 'Import & Phân công SV', icon: 'group_add', route: '/ldkbm/student-assignment' },
  { title: 'Quản lý Hội đồng', icon: 'groups', route: '/ldkbm/committees' },
  { title: 'Bảng tổng hợp điểm', icon: 'table_view', route: '/ldkbm/score-summary' },
  { title: 'Tổng hợp Khảo sát', icon: 'insights', route: '/ldkbm/survey-dashboard' },
];

export const studentMenu: MenuItem[] = [
  { title: 'Bảng điều khiển', icon: 'dashboard', route: '/student/dashboard', exact: true },
  { title: 'Báo cáo thực tập', icon: 'assignment', route: '/student/internship-report' },
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
  { title: 'Đánh giá Sinh viên', icon: 'assignment_turned_in', route: '/company/rubric-evaluation' },
  { title: 'Phản hồi Đánh giá', icon: 'rate_review', route: '/company/survey' },
];

