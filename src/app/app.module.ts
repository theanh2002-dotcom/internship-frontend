import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

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
import { TncmLayoutComponent } from './layout/tncm-layout/tncm-layout.component';
import { ManageInternsComponent } from './pages/company/manage-interns/manage-interns.component';
import { ApprovalRequestsComponent } from './pages/teacher/approval-requests/approval-requests.component';
import { ScoreApprovalComponent } from './pages/tncm/score-approval/score-approval.component';

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
    TncmLayoutComponent,
    ManageInternsComponent,
    ApprovalRequestsComponent,
    ScoreApprovalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
