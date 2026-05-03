import { Component } from '@angular/core';

@Component({
  selector: 'app-campaign-management',
  templateUrl: './campaign-management.component.html',
  styleUrls: ['./campaign-management.component.scss']
})
export class CampaignManagementComponent {
  isModalOpen = false;
  currentPage = 1;
  pageSize = 10;
  
  // Mock Data cho đợt thực tập
  campaigns = [
    {
      id: 'TTTN.2023.1',
      name: 'Thực tập Tốt nghiệp Học kỳ 1',
      department: 'Khoa Công nghệ Thông tin',
      academicYear: '2023-2024',
      startDate: '15/08/2023',
      endDate: '15/12/2023',
      expectedStudents: 450,
      progressValue: 45,
      progressLabel: 'Giai đoạn: Chấm điểm'
    },
    {
      id: 'TTTN.2022.2',
      name: 'Thực tập Tốt nghiệp Học kỳ 2',
      department: 'Khoa Công nghệ Thông tin',
      academicYear: '2022-2023',
      startDate: '10/01/2023',
      endDate: '10/05/2023',
      expectedStudents: 320,
      progressValue: 100,
      progressLabel: 'Giai đoạn: Hoàn thành'
    },
    {
      id: 'TTNT.2023.3',
      name: 'Thực tập Nhận thức Học kỳ Hè',
      department: 'Toàn trường',
      academicYear: '2022-2023',
      startDate: '01/06/2023',
      endDate: '15/07/2023',
      expectedStudents: 850,
      progressValue: 0,
      progressLabel: 'Giai đoạn: Khởi tạo'
    }
  ];

  get totalItems(): number {
    return this.campaigns.length;
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveCampaign() {
    // Add save logic here later
    this.closeModal();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    console.log('Page changed to:', page);
  }
}
