import { Component } from '@angular/core';

@Component({
  selector: 'app-approval-requests',
  templateUrl: './approval-requests.component.html',
  styleUrls: ['./approval-requests.component.scss']
})
export class ApprovalRequestsComponent {
  requests = [
    {
      id: 1,
      studentId: '1234567',
      studentName: 'Nguyễn Văn A',
      type: 'TTTN-01 (Kê khai ĐVHD)',
      dateSubmitted: '10/10/2023',
      status: 'Chờ duyệt',
      company: 'Công ty TNHH Phần Mềm FPT'
    },
    {
      id: 2,
      studentId: '7654321',
      studentName: 'Phạm Thị B',
      type: 'TTTN-02 (Kế hoạch TTTN)',
      dateSubmitted: '12/10/2023',
      status: 'Chờ duyệt',
      company: 'Viettel Telecom'
    },
    {
      id: 3,
      studentId: '1122334',
      studentName: 'Lê Văn C',
      type: 'TTTN-01 (Kê khai ĐVHD)',
      dateSubmitted: '08/10/2023',
      status: 'Đã duyệt',
      company: 'VNG Corporation'
    }
  ];

  selectedRequest: any = null;
  showModal = false;

  openRequest(req: any) {
    this.selectedRequest = req;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedRequest = null;
  }

  approve() {
    if (this.selectedRequest) {
      this.selectedRequest.status = 'Đã duyệt';
    }
    this.closeModal();
  }

  reject() {
    if (this.selectedRequest) {
      this.selectedRequest.status = 'Từ chối';
    }
    this.closeModal();
  }
}
