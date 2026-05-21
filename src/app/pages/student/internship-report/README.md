# Internship Report Module (Báo cáo thực tập tổng hợp)

## Architecture Overview
Module này (`InternshipReportComponent`) được thiết kế theo dạng **Wizard / Stepper Pattern**.
Thay vì tạo ra nhiều menu độc lập (TTTN-01, TTTN-02, TTTN-03, TTTN-06) trên Sidebar khiến sinh viên bị rối, toàn bộ các luồng Báo cáo Thực tập (TTTN) được gộp vào duy nhất 1 Tab: `/student/internship-report`.

## How it works
1. **State Management**:
   - Component cha (`InternshipReportComponent`) sẽ gọi `StudentCampaignService.getMyCampaigns()` để kiểm tra trạng thái (`status`) hiện tại của chiến dịch.
   - Dựa vào `status`, hệ thống sẽ tính toán ra `maxUnlockedStep` (Bước tối đa sinh viên được phép truy cập). Ví dụ: Nếu `status` là `IN_PROGRESS`, sinh viên được phép truy cập tới `TTTN-03`.

2. **Stepper UI**:
   - Thanh Stepper ở trên cùng hiển thị 4 bước (01, 02, 03, 06).
   - Nếu bước nào `> maxUnlockedStep`, bước đó sẽ bị **disabled (khóa mờ)** và không click được.

3. **Dynamic Rendering (`ngSwitch`)**:
   - Sử dụng thẻ `<ng-container [ngSwitch]="currentStep">`.
   - Ứng với mỗi `currentStep`, component con tương ứng sẽ được nhúng vào (ví dụ: `<app-company-declaration>` hoặc `<app-internship-plan>`).
   - Các Component Con vẫn tự maintain trạng thái riêng biệt của nó (ví dụ: TTTN-01 tự load API lấy data công ty, tự xử lý form submit), giảm thiểu sự cồng kềnh cho component cha.

## For AI Agents
Nếu bạn cần thêm một bước TTTN mới (ví dụ TTTN-04):
1. Thêm TTTN-04 vào mảng `steps` trong `setStep()` và `isUnlocked()` tại `internship-report.component.ts`.
2. Bổ sung `ngSwitchCase="'TTTN-04'"` vào file HTML.
3. Thiết kế Component TTTN-04 như bình thường, **nhưng đừng thêm `<router-outlet>`** vào đó. Component con chỉ nên là presentational container.

*Note: Component này đã thay thế cơ chế routing tĩnh ban đầu.*
