import { Component } from '@angular/core';

@Component({
  selector: 'app-manage-interns',
  templateUrl: './manage-interns.component.html',
  styleUrls: ['./manage-interns.component.scss']
})
export class ManageInternsComponent {
  interns = [
    {
      id: 1,
      studentId: '1234567',
      studentName: 'Nguyễn Văn A',
      university: 'Đại học Xây dựng Hà Nội',
      currentWeek: 'Tuần 4',
      declarationStatus: 'Đã tiếp nhận',
      planStatus: 'Đã duyệt',
      logStatus: 'Chờ xác nhận (Tuần 4)'
    },
    {
      id: 2,
      studentId: '7654321',
      studentName: 'Phạm Thị B',
      university: 'Đại học Xây dựng Hà Nội',
      currentWeek: 'Tuần 1',
      declarationStatus: 'Đã tiếp nhận',
      planStatus: 'Chờ duyệt',
      logStatus: 'Chưa có dữ liệu'
    },
    {
      id: 3,
      studentId: '8877665',
      studentName: 'Lê Hoàng C',
      university: 'Đại học Xây dựng Hà Nội',
      currentWeek: 'Chưa bắt đầu',
      declarationStatus: 'Chờ tiếp nhận',
      planStatus: 'Chưa có dữ liệu',
      logStatus: 'Chưa có dữ liệu'
    }
  ];

  selectedIntern: any = null;
  actionType: 'PLAN' | 'LOG' | 'DECLARATION' | null = null;
  showModal = false;

  openAction(intern: any, type: 'PLAN' | 'LOG' | 'DECLARATION') {
    this.selectedIntern = intern;
    this.actionType = type;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedIntern = null;
    this.actionType = null;
  }

  approve() {
    if (this.selectedIntern && this.actionType === 'PLAN') {
      this.selectedIntern.planStatus = 'Đã duyệt';
    } else if (this.selectedIntern && this.actionType === 'LOG') {
      this.selectedIntern.logStatus = 'Đã xác nhận';
    } else if (this.selectedIntern && this.actionType === 'DECLARATION') {
      this.selectedIntern.declarationStatus = 'Đã tiếp nhận';
    }
    this.closeModal();
  }
}
