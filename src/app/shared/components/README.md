# Shared Dashboard Components

Thư mục này chứa các component dùng chung cho các màn hình Bảng điều khiển (Dashboard) của các vai trò (Role) khác nhau trong hệ thống.

---

## 1. Welcome Header (`app-welcome-header`)
Dùng để hiển thị lời chào đầu trang kèm mô tả và các hành động nhanh.

### API Inputs:
| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `title` | `string` | `''` | Tiêu đề chính (Ví dụ: `"Xin chào, Admin! 👋"`) |
| `subtitle` | `string` | `''` | Dòng mô tả phụ dưới tiêu đề |
| `actionText` | `string` | `''` | Nhãn hiển thị trên nút hành động (nếu có) |
| `actionLink` | `string \| any[]` | `''` | Đường dẫn route để điều hướng khi nhấn nút |
| `actionIcon` | `string` | `''` | Tên icon Google Material để hiển thị bên cạnh nhãn nút |
| `infoTagText` | `string` | `''` | Nhãn hiển thị trên thẻ thông tin phụ (Ví dụ: `"Tuần thực tập: 1/8"`) |
| `infoTagIcon` | `string` | `''` | Tên icon Google Material hiển thị bên trong thẻ thông tin |

### Ví dụ sử dụng:
```html
<app-welcome-header
  title="Xin chào, {{ teacherName }}! 👋"
  subtitle="Tổng quan công tác hướng dẫn thực tập đợt hiện tại"
  actionText="Xem danh sách Sinh viên"
  actionLink="/teacher/students"
  actionIcon="groups">
</app-welcome-header>
```

---

## 2. Metric Card (`app-metric-card`)
Dùng để hiển thị các thẻ chỉ số thống kê (thẻ số liệu). Hỗ trợ nhiều biến thể bố cục (căn giữa không có icon, xếp ngang có icon, dải màu nhấn bên trái).

### API Inputs:
| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `title` | `string` | `''` | Nhãn của thẻ thống kê |
| `value` | `string \| number` | `''` | Giá trị số liệu hiển thị |
| `valueClass` | `string` | `'text-[#00429D]'` | Class CSS tùy biến màu/font chữ cho số liệu |
| `borderLeftClass` | `string` | `''` | Class border left tùy biến (Ví dụ: `'border-l-4 border-l-blue-500'`) |
| `routerLink` | `string \| any[]` | `''` | Đường dẫn điều hướng khi click vào thẻ |
| `icon` | `string` | `''` | Tên icon Google Material hiển thị bên trái (nếu dùng layout ngang) |
| `iconBgClass` | `string` | `'bg-blue-50 text-[#00429D]'` | Class CSS background và màu của icon |
| `sideAccentColor` | `string` | `''` | Mã màu HEX/RGB làm dải nhấn tuyệt đối bên trái thẻ |

### Ví dụ sử dụng:

**Thẻ đơn giản căn giữa:**
```html
<app-metric-card
  title="Tổng Đợt TT"
  [value]="totalCampaigns"
  valueClass="text-[#00429D]">
</app-metric-card>
```

**Thẻ ngang có Icon và Dải màu nhấn:**
```html
<app-metric-card
  title="Tổng Sinh viên"
  [value]="totalStudents"
  icon="school"
  iconBgClass="bg-blue-50 text-[#00429D]"
  sideAccentColor="#00429D">
</app-metric-card>
```

---

## 3. Dashboard Loading (`app-dashboard-loading`)
Dùng để hiển thị hiệu ứng xoay tròn và văn bản thông báo khi đang tải dữ liệu.

### API Inputs:
| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `message` | `string` | `'Đang tải dữ liệu...'` | Văn bản hiển thị |
| `icon` | `string` | `'progress_activity'` | Tên icon Google Material làm hiệu ứng quay |

### Ví dụ sử dụng:
```html
<app-dashboard-loading
  message="Đang tải dữ liệu thống kê..."
  icon="progress_activity">
</app-dashboard-loading>
```
