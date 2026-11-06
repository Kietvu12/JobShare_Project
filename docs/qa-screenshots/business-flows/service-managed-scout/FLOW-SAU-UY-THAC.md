# Scout ủy thác — Sau khi mở hồ sơ & tạo đơn

## Sau khi bấm 「Ủy thác WS」 (gửi yêu cầu Performance)

Backend (`createScoutPerformanceRequest`):

1. **Mở hồ sơ** loại `scout_performance` (không trừ credit).
2. Tạo **yêu cầu ủy thác WS** + phiên **chat WS** (tin nhắn hệ thống mở hồ sơ).
3. Nếu DN chọn **JD** khi ủy thác → tạo luôn **đơn tiến cử** trạng thái **2 — Đã gửi yêu cầu uỷ thác WS**.

UI: modal thành công → có thể vào **Tin nhắn WS** hoặc **Quản lý ứng viên**.

## Hồ sơ / đơn hiển thị ở đâu?

| Khu vực | URL | Ý nghĩa |
|---------|-----|---------|
| **Hồ sơ ứng viên** | `/business/candidates?list=scout_performance` | Hồ sơ đã mở bằng ủy thác; pipeline **chỉ xem** (WS điều khiển giai đoạn đầu). |
| **Quản lý ứng viên** | `/business/applications` — lọc **Scout ủy thác** | **Đơn tiến cử** theo JD; trạng thái phản ánh tiến độ WS + DN. |
| **Tin nhắn** | `/business/messages?tab=ws` | Chat WS cho hearing, hợp đồng, bổ sung yêu cầu, ứng viên tương tự. |

Chi tiết hồ sơ: `/business/candidates/:id` — liên hệ/CV gốc thường **khoá** cho đến khi WS tiến cử chính thức (status **23**).

## Hai giai đoạn trạng thái

### Phần WS xử lý (DN **không** đổi trạng thái trên drawer)

`isWsManagedPreNomination` — dropdown trạng thái **read-only**, chỉ theo dõi.

| Mã | Nhãn (VI) | Việc cần làm |
|----|-----------|--------------|
| **2** | Đã gửi yêu cầu uỷ thác WS | Vừa ủy thác / tạo đơn kèm JD |
| 22 | Đang chờ hoàn tất hợp đồng | WS / DN hoàn tất hợp đồng dịch vụ |
| 3 | WS đang hearing | WS liên hệ ứng viên |
| 4 | Đã hearing – Ứng viên từ chối | Kết thúc |
| 20 | Đã hearing – Đồng ý tiến cử | UV đồng ý |
| 21 | WS đang hoàn thiện hồ sơ | WS chuẩn bị hồ sơ tiến cử |

### Phần DN quản lý (sau khi WS tiến cử)

| Mã | Nhãn (VI) | DN có thể |
|----|-----------|-----------|
| **23** | WS mới tiến cử | Bắt đầu đánh giá, xếp PV, offer… |
| 5 → 14 → **15** | Đánh giá → … → **Đã thanh toán** | Giống pipeline tuyển dụng; **có bước thanh toán** phí giới thiệu |

Chuyển trạng thái: drawer **Quản lý ứng viên** → dropdown (khi không còn giai đoạn WS-only).

## Luồng QA nên minh hoạ

1. Ủy thác WS (có JD) → modal xác nhận → **không hủy** trên môi trường test nếu cần data thật.
2. **Tin nhắn WS** — thread ủy thác.
3. **Hồ sơ ứng viên** (scout_performance).
4. **Quản lý ứng viên** — đơn status 2 (hoặc 3/21/23 tùy data) — chụp drawer: WS-only vs DN được đổi.

## Ảnh QA (bổ sung)

| Step | File |
|------|------|
| 08 | `step-08-ho-so-da-mo-trong-danh-sach.png` |
| 09 | `step-09-chi-tiet-ho-so-da-mo-gan-jd.png` |
| 10 | `step-10-quan-ly-ung-vien-loc-nguon.png` |
| 11 | `step-11-drawer-trang-thai-don-tien-cu.png` |
| 12 | `step-12-tin-nhan-ws-scout-uy-thac.png` |

Script QA **không gửi ủy thác thật** (chụp modal rồi hủy); step 08–12 dùng **dữ liệu sẵn có** trên tài khoản production QA.
