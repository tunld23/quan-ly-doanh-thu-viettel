# Hướng dẫn Hoàn thiện Tài liệu Kỹ thuật (Technical Documentation Task)

Tài liệu này tổng hợp thông tin chi tiết về hệ thống Dashboard Quản lý Doanh thu Viettel, được trích xuất trực tiếp từ logic source code.

---

## 1. Chi tiết Cơ sở Dữ liệu (Database Schema)

Hệ thống sử dụng SQL Server (MSSQL). Dưới đây là cấu trúc các bảng cốt lõi:

### Bảng `product` (Danh mục sản phẩm & Đơn giá)

| Tên cột | Kiểu dữ liệu | Mô tả | Ràng buộc |
| :--- | :--- | :--- | :--- |
| `tr_year` | INT | Năm hạch toán đơn giá | PK |
| `tr_month` | NVARCHAR(2) | Tháng hạch toán (01-12) | PK |
| `ma_hang` | NVARCHAR(255) | Mã dịch vụ/gói cước | PK |
| `mat_hang` | NVARCHAR(255) | Tên dịch vụ/gói cước | PK |
| `source_type` | NVARCHAR(50) | Kênh (dealer: Đại lý, am: Account Manager) | PK, Default 'dealer' |
| `with_vat` | FLOAT | Đơn giá sau thuế | |
| `without_vat` | FLOAT | Đơn giá chưa thuế (Sử dụng để tính doanh thu) | |
| `vat` | FLOAT | Tiền thuế VAT | |

### Bảng `detail` (Dữ liệu thô từ Excel)

| Tên cột | Kiểu dữ liệu | Mô tả | Ràng buộc |
| :--- | :--- | :--- | :--- |
| `tr_year` | INT | Năm đấu nối/phát sinh | |
| `tr_month` | NVARCHAR(2) | Tháng đấu nối/phát sinh | |
| `nhan_vien` | NVARCHAR(255) | User hoặc Tên nhân viên phát triển | |
| `ma_hang` | NVARCHAR(255) | Mã dịch vụ đấu nối | |
| `mat_hang` | NVARCHAR(255) | Tên dịch vụ đấu nối | |
| `amount` | FLOAT | Số lượng hạch toán (Mặc định 1 dòng = 1) | |
| `product_group` | NVARCHAR(255) | Phân loại (CA, HDDT, vBHXH, Internet...) | |
| `source_type` | NVARCHAR(50) | Kênh dữ liệu (dealer/am) | |

### Bảng `summary_report` (Dữ liệu đã tổng hợp)

- **Logic**: Dữ liệu được tính toán và đẩy vào bởi hàm `updateSummaryReport` trong file `reportService.js`.
- **Quy trình xử lý**:
  1. `TRUNCATE TABLE summary_report`: Xóa dữ liệu cũ.
  2. `UNION ALL`: Gộp dữ liệu từ 2 nguồn: `detail` (dữ liệu file) và `adjustments` (dữ liệu điều chỉnh thủ công).
  3. `LEFT JOIN`: Kết nối `detail` với `product` dựa trên `ma_hang`, `tr_year` và `tr_month` để lấy đơn giá hạch toán.
  4. `GROUP BY`: Tổng hợp theo Năm, Tháng, Nhân viên, Nhóm sản phẩm và Kênh.

---

## 2. Quy trình Mapping Excel (Data Ingestion Logic)

Hệ thống sử dụng thư viện `xlsx` và logic trong `excelProcessor.js` để đọc dữ liệu.

- **File Sales Import**:
  - **CA**: Dòng tiêu đề 11 (HeaderRow: 10). Mapping cột: Q (Ngày), Z (Nhân viên), W (Mã - Mặt).
  - **HDDT**: Dòng tiêu đề 7 (HeaderRow: 6). Mapping cột: AE (Ngày), AA (Nhân viên), Q (Mã), R (Mặt hàng).
  - **vBHXH**: Dòng tiêu đề 13 (HeaderRow: 12). Mapping cột: AA (Ngày), W (Nhân viên), P (Mã - Mặt).
  - **EasyBooks/Internet**: Chỉ lọc các dòng có mã tỉnh là "HNI".
  - **Xử lý trước khi Insert**: Xóa (Delete) dữ liệu cũ trong bảng `detail` cùng Tháng, Năm, Nhóm sản phẩm và Kênh trước khi chạy `BULK INSERT` dữ liệu mới.
- **File Product Import**:
  - Dòng tiêu đề 7 (HeaderRow: 6). Mapping cột: B (Mã), C (Mặt), K (Có VAT), L (Chưa VAT), M (VAT).
  - **Xử lý trùng**: Xóa toàn bộ sản phẩm của cùng Tháng/Năm được chọn trước khi nạp lại.

---

## 3. Công thức Nghiệp vụ (Business Rules)

Logic tính toán tập trung tại `reportService.js` (Backend) và `analyticsService.js`.

- **Doanh thu thuần (Actual Revenue)**:
  `Doanh thu = (Số lượng từ 'detail' * Đơn giá 'without_vat' từ 'product') + Số tiền điều chỉnh 'adj_amount' from 'adjustments'`.
  *Lưu ý: Hệ thống ưu tiên lấy đơn giá theo đúng Tháng/Năm, nếu không thấy sẽ fallback lấy đơn giá gần nhất của sản phẩm đó.*
- **Tỷ lệ hoàn thành (Achievement Rate %)**:
  `Tỷ lệ = (Thực tế / Chỉ tiêu) * 100`. 
  *Hệ thống so sánh thực tế với bảng `targets` dựa trên Product Group, Source Type và Loại chỉ tiêu (Doanh thu hoặc Thuê bao).*
- **Logic Phân loại (Filters)**: 
  Phân biệt dựa trên trường `source_type`:
  - `dealer`: Dữ liệu từ kênh Đại lý/Cộng tác viên.
  - `am`: Dữ liệu từ nhân viên quản lý khách hàng (Account Manager).

---

## 4. Danh mục API Endpoints (API Reference)

Tất cả các Route được định nghĩa trong `apiRoutes.js`.

| Method | Endpoint             | Tham số (Params)  | Chức năng              |
| :----- | :------------------- | :---------------- | :--------------------- |
| POST   | /api/sales/import    | file, type, source| Nhập dữ liệu doanh thu |
| POST   | /api/products/import | file, month, year | Nhập danh mục sản phẩm |
| GET    | /api/dashboard       | year, month, type | Lấy số liệu biểu đồ    |
| GET    | /api/targets         | year, month       | Lấy danh sách chỉ tiêu |
| POST   | /api/adjustments     | object            | Tạo điều chỉnh thủ công|
| POST   | /api/init            | (không có)        | Đồng bộ dữ liệu từ thư mục `./data` |

---

## 5. Hướng dẫn Fix Bug & Logs

- **Vị trí file Log**: Hệ thống ghi log trực tiếp ra **Console/Terminal** đang chạy Backend. Không ghi ra file vật lý để tối ưu hiệu năng và dễ theo dõi runtime.
- **Các lỗi thường gặp**:
  1. **Lỗi định dạng Excel**: Thường do thay đổi cấu hình cột hoặc dòng tiêu đề không khớp với `MARKERS` định nghĩa trong `excelProcessor.js`.
  2. **Lỗi Kết nối SQL**: Nếu máy chưa cài ODBC Driver 17, hệ thống sẽ tự động fallback sang driver `SQL Server` cũ.
  3. **Lỗi không tìm thấy đơn giá**: Do file Danh mục sản phẩm chưa có mã tương ứng với file Sales. Hệ thống sẽ tính doanh thu = 0 và hiện cảnh báo trong log.
- **Cách Restart hệ thống**:
  - Backend: `cd backend && npm run dev`
  - Frontend: `cd frontend && npm run dev`
