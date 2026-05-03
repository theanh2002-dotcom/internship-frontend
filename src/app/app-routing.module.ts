import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { CampaignManagementComponent } from './pages/admin/campaign-management/campaign-management.component';
import { CloRubricConfigComponent } from './pages/ldkbm/clo-rubric-config/clo-rubric-config.component';
import { StudentAssignmentComponent } from './pages/ldkbm/student-assignment/student-assignment.component';
import { CompanyDeclarationComponent } from './pages/student/company-declaration/company-declaration.component';

import { FinalReportComponent } from './pages/student/final-report/final-report.component';
import { InternshipPlanComponent } from './pages/student/internship-plan/internship-plan.component';
import { WeeklyLogComponent } from './pages/student/weekly-log/weekly-log.component';

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

const routes: Routes = [
  { path: '', redirectTo: 'admin/campaigns', pathMatch: 'full' },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: 'campaigns', component: CampaignManagementComponent },
    ]
  },
  {
    path: 'ldkbm',
    component: LdkbmLayoutComponent,
    children: [
      { path: 'general-dashboard', component: GeneralDashboardComponent },
      { path: 'clo-config', component: CloRubricConfigComponent },
      { path: 'student-assignment', component: StudentAssignmentComponent },
      { path: 'survey-dashboard', component: SurveyDashboardComponent },
      { path: '', redirectTo: 'general-dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'student',
    component: StudentLayoutComponent,
    children: [
      { path: 'company-declaration', component: CompanyDeclarationComponent },
      { path: 'internship-plan', component: InternshipPlanComponent },
      { path: 'weekly-log', component: WeeklyLogComponent },
      { path: 'final-report', component: FinalReportComponent },
      { path: 'survey', component: SurveyStudentComponent }
    ]
  },
  {
    path: 'teacher',
    component: TeacherLayoutComponent,
    children: [
      { path: 'approval-requests', component: ApprovalRequestsComponent },
      { path: 'rubric-evaluation', component: RubricEvaluationComponent },
      { path: 'score-summary', component: ScoreSummaryComponent }
    ]
  },
  {
    path: 'company',
    component: CompanyLayoutComponent,
    children: [
      { path: 'manage-interns', component: ManageInternsComponent },
      { path: 'survey', component: SurveyCompanyComponent }
    ]
  },
  {
    path: 'tncm',
    component: TncmLayoutComponent,
    children: [
      { path: 'score-approval', component: ScoreApprovalComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
