# Module: Nạp Credit

## Business (`business/`)

| Step | File | Thao tác |
|------|------|----------|
| 01 | `step-01-trang-dang-nhap.png` | Mở `/business/login` |
| 02 | `step-02-nhap-email-mat-khau.png` | Nhập email + mật khẩu |
| 03 | `step-03-dashboard-sau-dang-nhap.png` | Enter → Dashboard |
| 04 | `step-04-hub-service-requests.png` | Vào **サービス依頼** (`/business/service-requests`) |
| 05 | `step-05-the-credit-tren-hub.png` | Cuộn tới thẻ **クレジットチャージ** trên hub |
| 06 | `step-06-trang-chon-goi-credit.png` | Trang `/business/service-requests/credit` – 3 gói Basic/Standard/Premium |
| 07–08 | `step-07-*`, `step-08-*` | Chọn **このプランを選ぶ** → popup xác nhận. *Chưa chụp trên headless* — chạy `QA_HEADED=1 node run.mjs` hoặc chụp tay trên production. |
| 09 | `step-09-lich-su-yeu-cau-gan-day.png` | Panel **最近の依頼** (lịch sử SC-…) |

## Admin (`admin/`)

| Step | File | Thao tác |
|------|------|----------|
| 01 | `step-01-trang-dang-nhap.png` | `/admin/login` |
| 02 | `step-02-sau-dang-nhap-dashboard.png` | Sau đăng nhập |
| 03 | `step-03-menu-nap-credit-danh-sach.png` | **Nạp Credit** → danh sách yêu cầu DN |
| 04 | `step-04-loc-cho-duyet.png` | Lọc **Chờ duyệt** |
