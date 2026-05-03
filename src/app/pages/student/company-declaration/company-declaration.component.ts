import { Component } from '@angular/core';

@Component({
  selector: 'app-company-declaration',
  templateUrl: './company-declaration.component.html',
  styleUrls: ['./company-declaration.component.scss']
})
export class CompanyDeclarationComponent {
  internshipTypes = [
    'Thực tập doanh nghiệp (Industry Internship)',
    'Thực tập nghiên cứu (Research Internship)',
    'Thực tập khởi nghiệp/ đổi mới sáng tạo (Startup Internship)',
    'Thực tập cộng đồng (Community Service Internship)',
    'Thực tập nội bộ (Internal Internship)',
    'Thực tập quốc tế (International Internship)'
  ];

  declaration = {
    internshipType: 'Thực tập doanh nghiệp (Industry Internship)',
    companyName: '',
    companyAddress: '',
    companyTaxCode: '',
    companyField: '',
    mentorName: '',
    mentorRole: '',
    mentorPhone: '',
    mentorEmail: '',
    status: 'DRAFT' // DRAFT, PENDING_TEACHER, PENDING_COMPANY, APPROVED
  };

  submitForm() {
    this.declaration.status = 'PENDING_TEACHER';
  }

  isInternalOrResearch(): boolean {
    return this.declaration.internshipType.includes('Nội bộ') || this.declaration.internshipType.includes('Nghiên cứu');
  }
}
