# Status Badge Component (`<app-status-badge>`)

Đây là component dùng chung (Shared Component) để hiển thị **Trạng thái (Status)** một cách đồng bộ và chuẩn thiết kế trên toàn bộ các trang (TTTN-01, TTTN-02, v.v.).

> [!IMPORTANT]
> **Yêu cầu đối với AI Agent / Developer:**
> BẤT CỨ KHI NÀO có yêu cầu thiết kế hoặc cập nhật giao diện hiển thị trạng thái (ví dụ: "Chờ duyệt", "Đã duyệt", "Chưa nộp"), BẮT BUỘC phải sử dụng component `<app-status-badge>` này thay vì tự viết các class CSS (Tailwind) hardcode.

## 1. Cách sử dụng (Usage)

Component này đã được import sẵn trong `AppModule`, có thể gọi trực tiếp ở bất kỳ file HTML nào:

```html
<app-status-badge 
    [text]="'Đã duyệt'" 
    [type]="'success'" 
    iconType="dot">
</app-status-badge>
```

## 2. API / Inputs

| Input | Kiểu dữ liệu | Mặc định | Ý nghĩa |
|---|---|---|---|
| `[text]` | `string` | `''` | Chữ hiển thị bên trong badge (VD: "Chờ duyệt"). |
| `[type]` | `'success' \| 'warning' \| 'error' \| 'info' \| 'default'` | `'default'` | Loại badge, tự động quyết định màu sắc (nền, viền, chữ). |
| `[showIcon]`| `boolean` | `true` | Có hiển thị icon phía trước text không. |
| `[iconType]`| `'dot' \| 'icon'` | `'dot'` | Hiển thị dạng hình tròn nhỏ (`dot`) hay dạng Material Symbol (`icon`). |

## 3. Màu sắc tương ứng (Mapping)

- **`success`** (Màu xanh lá): Dùng cho các trạng thái đã hoàn thành thành công (VD: *Đã duyệt, Đã nộp, Thành công*).
- **`warning`** (Màu vàng/cam): Dùng cho các trạng thái chờ xử lý hoặc cần chú ý (VD: *Chờ duyệt, Đang xử lý, Sắp tới hạn*).
- **`error`** (Màu đỏ): Dùng cho các trạng thái thất bại, lỗi, hoặc từ chối (VD: *Từ chối, Lỗi nộp bài, Quá hạn*).
- **`info`** (Màu xanh dương): Dùng cho các trạng thái thông tin (VD: *Đang cập nhật, Thông báo*).
- **`default`** (Màu xám/slate): Dùng cho các trạng thái mặc định, trống (VD: *Chưa nộp, Chưa bắt đầu, Vô hiệu hóa*).

## 4. Ví dụ sử dụng kết hợp Logic Component

Nếu giá trị trạng thái là động (dynamic label), hãy dùng toán tử 3 ngôi trực tiếp trong HTML:

```html
<app-status-badge 
    [text]="status.label" 
    [type]="status.label === 'Chờ duyệt' ? 'warning' : (status.label === 'Đã duyệt' ? 'success' : 'default')"
    iconType="icon">
</app-status-badge>
```
