# Direct Scout — Sau khi mở hồ sơ (credit unlock)

## Hồ sơ xuất hiện ở đâu?

| Khu vực | URL / menu | Ý nghĩa |
|---------|------------|---------|
| **Hồ sơ ứng viên** | Sidebar **Quản lý hồ sơ** → `/business/candidates?list=scout_credit` | Danh sách mọi hồ sơ đã **unlock bằng Scout trực tiếp** (badge nguồn, pipeline nội bộ). |
| **Chi tiết hồ sơ đã mở** | `/business/candidates/:cvId` | Email/SĐT, tải CV gốc, **gợi ý JD khớp** → gắn ứng viên vào JD. |
| **Quản lý ứng viên (đơn tiến cử)** | `/business/applications` — lọc nguồn **Scout trực tiếp** | Mỗi lần **gắn vào JD** tạo một `job_application` (đơn tiến cử) gắn ứng viên + JD. |

**Lưu ý:** Chỉ **mở hồ sơ (unlock)** chưa tạo đơn trên **Quản lý ứng viên**. Đơn chỉ có sau khi DN **gắn ứng viên vào JD** (từ chi tiết hồ sơ đã mở hoặc luồng tương đương).

Trên tab Scout, sau unlock có nút **「Xem tại Quản lý ứng viên」** → `/business/applications`.

## Luồng thao tác DN (QA nên chụp)

1. Scout trực tiếp → chọn ứng viên → **Mở liên hệ** (trừ credit) → xác nhận.
2. **Hồ sơ ứng viên** → lọc Scout trực tiếp → mở dòng vừa unlock.
3. Trên chi tiết: chọn JD gợi ý → **xác nhận gắn JD** → tạo đơn.
4. **Quản lý ứng viên** → lọc Scout trực tiếp → mở drawer → đổi trạng thái theo pipeline.

## Trạng thái đơn (Scout trực tiếp)

Nguồn `scout_credit` — DN **tự đổi** trạng thái trên drawer (dropdown có mũi tên `→` mô tả bước tiếp).

| Mã | Nhãn (VI) | Giai đoạn |
|----|-----------|-----------|
| **19** | Mới liên hệ ứng viên | Trạng thái **ban đầu** khi vừa gắn JD sau unlock. |
| 17 | Không có phản hồi | Kết thúc nhánh |
| 18 | Ứng viên từ chối | Kết thúc nhánh |
| 5 | Đang đánh giá hồ sơ | UV đồng ý & liên hệ lại |
| 7 → 9 | Xếp lịch PV → Đang phỏng vấn | Có thể chọn ngày PV |
| 11 → 12 | Đã gửi offer → Chờ vào công ty | Chọn ngày dự kiến / ngày vào |
| 14 | Đã vào công ty | Có thể chọn ngày vào công ty |
| 16 | Ứng viên huỷ giữa chừng | Từ hầu hết bước |

Scout trực tiếp **không** có bước thanh toán phí giới thiệu (15) trên pipeline DN — chỉ credit unlock.

Logic UI: `frontend/src/utils/businessApplicationStatusFlow.js` (`scout_credit`).

## Ảnh QA (bổ sung)

| Step | File | Nội dung |
|------|------|----------|
| 08 | `step-08-ho-so-da-mo-trong-danh-sach.png` | `/business/candidates?list=scout_credit` |
| 09 | `step-09-chi-tiet-ho-so-da-mo-gan-jd.png` | Chi tiết + khối JD gợi ý / gắn JD |
| 10 | `step-10-quan-ly-ung-vien-loc-nguon.png` | `/business/applications` lọc Scout trực tiếp |
| 11 | `step-11-drawer-trang-thai-don-tien-cu.png` | Drawer đơn + dropdown trạng thái |
