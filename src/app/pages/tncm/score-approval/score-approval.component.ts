import { Component } from '@angular/core';

@Component({
  selector: 'app-score-approval',
  templateUrl: './score-approval.component.html',
  styleUrls: ['./score-approval.component.scss']
})
export class ScoreApprovalComponent {
  scoreSheets = [
    {
      id: 1,
      teacherName: 'TS. Lê Anh Tuấn',
      groupName: 'Nhóm 01 - HK1 2023-2024',
      studentCount: 5,
      dateSubmitted: '15/10/2023',
      status: 'Chờ phê duyệt'
    },
    {
      id: 2,
      teacherName: 'ThS. Nguyễn Quang Minh',
      groupName: 'Nhóm 02 - HK1 2023-2024',
      studentCount: 8,
      dateSubmitted: '14/10/2023',
      status: 'Đã phê duyệt'
    }
  ];

  selectedSheet: any = null;
  showModal = false;

  openSheet(sheet: any) {
    this.selectedSheet = sheet;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedSheet = null;
  }

  approve() {
    if (this.selectedSheet) {
      this.selectedSheet.status = 'Đã phê duyệt';
    }
    this.closeModal();
  }
}
