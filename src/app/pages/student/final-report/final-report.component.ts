import { Component } from '@angular/core';

interface AttachedFile {
  name: string;
  size: string;
  uploadTime: string;
  type: 'doc' | 'zip';
}

@Component({
  selector: 'app-final-report',
  templateUrl: './final-report.component.html',
  styleUrls: ['./final-report.component.scss']
})
export class FinalReportComponent {
  uploadingFile = {
    name: 'Bao_cao_TTTN_NguyenVanA_66CS1.pdf',
    progress: 45,
    sizeUploaded: '12 MB',
    totalSize: '25 MB',
    timeRemaining: '30 giây',
    isUploading: true
  };

  attachedFiles: AttachedFile[] = [
    {
      name: 'Phieu_Danh_Gia_Doanh_Nghiep.docx',
      size: '2.4 MB',
      uploadTime: '10:45, 12/10/2023',
      type: 'doc'
    },
    {
      name: 'Source_Code_Du_An.zip',
      size: '15.8 MB',
      uploadTime: '10:50, 12/10/2023',
      type: 'zip'
    }
  ];

  isAgreed: boolean = false;
}
