# Internship Management System - Frontend Web Application

Đây là giao diện Frontend (Client-side) của Hệ thống Quản lý Thực tập Tốt nghiệp (HUCE Internship Management System). Ứng dụng cung cấp các Web Portal chuyên biệt dành cho các vai trò khác nhau (Admin, Sinh viên, Giảng viên, ĐVHD, Trưởng nhóm chuyên môn, Ban Lãnh đạo Khoa).

## 🎨 Công nghệ sử dụng (Tech Stack)

Dự án được xây dựng dựa trên các công nghệ và thư viện Frontend hiện đại:

*   **Framework chính:** Angular 15
*   **Ngôn ngữ:** TypeScript 4.9
*   **Styling & UI Framework:** Tailwind CSS 3.4
*   **Icons:** Google Material Symbols
*   **Font chữ:** Inter & Public Sans
*   **State Management / Reactivity:** RxJS 7.8
*   **Package Manager:** npm (hoặc yarn)

## 📁 Cấu trúc thư mục cốt lõi (Core Structure)

Ứng dụng được thiết kế theo kiến trúc Module hóa (Feature-based Modular Architecture) của Angular:
*   `src/app/`
    *   `core/`: Chứa các Services dùng chung (Auth, API Interceptors, Error Handling), Guards, và Configurations.
    *   `shared/`: Chứa các UI Components có thể tái sử dụng (Button, Modal, Pagination, Table...), Pipes, Directives.
    *   `layout/`: Chứa cấu trúc khung giao diện cho từng Role (AdminLayout, StudentLayout, CompanyLayout...). Chứa Header, Sidebar, Footer.
    *   `pages/`: Chứa logic và giao diện chi tiết của các trang, phân chia theo vai trò:
        *   `/admin/`: Quản lý danh mục, đợt thực tập.
        *   `/student/`: Lập kế hoạch, khai báo đơn vị, viết nhật ký.
        *   `/teacher/`: Phê duyệt biểu mẫu, chấm điểm, theo dõi tiến độ.
        *   `/company/`: Xác nhận thực tập sinh, đánh giá thái độ.
        *   `/tncm/` & `/ldkbm/`: Báo cáo thống kê, cấu hình chuẩn đầu ra (CLO), chốt điểm.

## 🚀 Hướng dẫn cài đặt và chạy dự án (Getting Started)

### 1. Yêu cầu hệ thống (Prerequisites)
*   **Node.js:** Phiên bản 18.x hoặc 20.x (Khuyên dùng bản LTS).
*   **Angular CLI:** Phiên bản 15.x (`npm install -g @angular/cli@15`).

### 2. Cài đặt thư viện (Install Dependencies)
Mở Terminal/Command Prompt tại thư mục `intership-frontend` và chạy:
```bash
npm install
```

### 3. Khởi chạy môi trường Dev (Development Server)
Chạy lệnh sau để khởi động dự án:
```bash
ng serve
```
Mở trình duyệt và truy cập vào `http://localhost:4200/`. 
*Lưu ý: Ứng dụng sẽ tự động tải lại (hot-reload) khi bạn lưu file mã nguồn.*

### 4. Build môi trường Production
Để đóng gói source code đưa lên Server/Hosting:
```bash
ng build
```
Thư mục sau khi build sẽ nằm ở `dist/intership-frontend/`.

## 🌐 Môi trường API (Environment Setup)
Hệ thống kết nối đến Backend thông qua các file cấu hình môi trường nằm tại `src/environments/`:
*   `environment.ts`: Cấu hình cho local development (Mặc định gọi `http://localhost:8080/api`).
*   `environment.prod.ts`: Cấu hình URL khi deploy lên server thật.

## 👥 Hệ thống Roles & Routing
Ứng dụng tuân theo cơ chế **Role-Based Access Control (RBAC)**. Navigation Menu (Sidebar) và các Routes sẽ tự động thay đổi dựa trên quyền hạn của người đăng nhập, được cấu hình tập trung tại `menu.config.ts` và `app-routing.module.ts`.

---
*Developed for HUCE Internship Management System.*
