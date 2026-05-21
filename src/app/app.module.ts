import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './layout/header/header.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { CampaignManagementComponent } from './pages/admin/campaign-management/campaign-management.component';
import { CloRubricConfigComponent } from './pages/ldkbm/clo-rubric-config/clo-rubric-config.component';
import { StudentAssignmentComponent } from './pages/ldkbm/student-assignment/student-assignment.component';
import { CompanyDeclarationComponent } from './pages/student/company-declaration/company-declaration.component';
import { PaginationComponent } from './shared/components/pagination/pagination.component';
import { ModalComponent } from './shared/components/modal/modal.component';
import { InternshipPlanComponent } from './pages/student/internship-plan/internship-plan.component';
import { WeeklyLogComponent } from './pages/student/weekly-log/weekly-log.component';
import { FinalReportComponent } from './pages/student/final-report/final-report.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { LdkbmLayoutComponent } from './layout/ldkbm-layout/ldkbm-layout.component';
import { StudentLayoutComponent } from './layout/student-layout/student-layout.component';
import { TeacherLayoutComponent } from './layout/teacher-layout/teacher-layout.component';
import { RubricEvaluationComponent } from './pages/teacher/rubric-evaluation/rubric-evaluation.component';
import { ScoreSummaryComponent } from './pages/teacher/score-summary/score-summary.component';
import { SurveyStudentComponent } from './pages/student/survey-student/survey-student.component';
import { SurveyCompanyComponent } from './pages/company/survey-company/survey-company.component';
import { SurveyDashboardComponent } from './pages/ldkbm/survey-dashboard/survey-dashboard.component';
import { GeneralDashboardComponent } from './pages/ldkbm/general-dashboard/general-dashboard.component';
import { CompanyLayoutComponent } from './layout/company-layout/company-layout.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ManageInternsComponent } from './pages/company/manage-interns/manage-interns.component';
import { ApprovalRequestsComponent } from './pages/teacher/approval-requests/approval-requests.component';
import { StudentDashboardComponent } from './pages/student/student-dashboard/student-dashboard.component';
import { TeacherDashboardComponent } from './pages/teacher/teacher-dashboard/teacher-dashboard.component';
import { ManageStudentsComponent } from './pages/teacher/manage-students/manage-students.component';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard/admin-dashboard.component';
import { CompanyDashboardComponent } from './pages/company/company-dashboard/company-dashboard.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { DepartmentManagementComponent } from './pages/admin/department-management/department-management.component';
import { UserManagementComponent } from './pages/admin/user-management/user-management.component';
import { SystemSettingsComponent } from './pages/admin/system-settings/system-settings.component';
import { NotificationManagementComponent } from './pages/admin/notification-management/notification-management.component';
import { CommitteesComponent } from './pages/ldkbm/committees/committees.component';
import { LdkbmScoreSummaryComponent } from './pages/ldkbm/score-summary/score-summary.component';
import { SetupPasswordComponent } from './pages/auth/setup-password/setup-password.component';
import { ReactiveFormsModule } from '@angular/forms';
import { StatusBadgeComponent } from './shared/components/status-badge/status-badge.component';
import { InternshipReportComponent } from './pages/student/internship-report/internship-report.component';
import { WelcomeHeaderComponent } from './shared/components/welcome-header/welcome-header.component';
import { MetricCardComponent } from './shared/components/metric-card/metric-card.component';
import { DashboardLoadingComponent } from './shared/components/dashboard-loading/dashboard-loading.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    SidebarComponent,
    MainLayoutComponent,
    CampaignManagementComponent,
    CloRubricConfigComponent,
    StudentAssignmentComponent,
    CompanyDeclarationComponent,
    PaginationComponent,
    ModalComponent,
    InternshipPlanComponent,
    WeeklyLogComponent,
    FinalReportComponent,
    AdminLayoutComponent,
    LdkbmLayoutComponent,
    StudentLayoutComponent,
    TeacherLayoutComponent,
    RubricEvaluationComponent,
    ScoreSummaryComponent,
    SurveyStudentComponent,
    SurveyCompanyComponent,
    SurveyDashboardComponent,
    GeneralDashboardComponent,
    CompanyLayoutComponent,
    ManageInternsComponent,
    ApprovalRequestsComponent,
    StudentDashboardComponent,
    TeacherDashboardComponent,
    ManageStudentsComponent,
    AdminDashboardComponent,
    CompanyDashboardComponent,
    AuthLayoutComponent,
    LoginComponent,
    RegisterComponent,
    DepartmentManagementComponent,
    UserManagementComponent,
    SystemSettingsComponent,
    NotificationManagementComponent,
    CommitteesComponent,
    LdkbmScoreSummaryComponent,
    SetupPasswordComponent,
    StatusBadgeComponent,
    InternshipReportComponent,
    WelcomeHeaderComponent,
    MetricCardComponent,
    DashboardLoadingComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
