# Module: Dịch vụ – Direct Scout (ダイレクトスカウト)

Tài khoản: Business production QA. **Không xác nhận unlock thật** — chỉ mở modal rồi Hủy.

| Step | File | Thao tác |
|------|------|----------|
| 01 | `step-01-tu-dashboard.png` | Dashboard DN |
| 02 | `step-02-onboarding-dich-vu.png` | `/business/scout/direct` — landing + **スカウトを開始** |
| 03 | `step-03-modal-thieu-credit-hoac-can-nap.png` | (Nếu thiếu credit) modal cảnh báo / nạp |
| 04 | `step-04-workspace-bo-loc-va-danh-sach.png` | Workspace: filter + danh sách ứng viên |
| 05 | `step-05-mo-bo-loc-nang-cao.png` | Mở bộ lọc nâng cao |
| 06 | `step-06-danh-sach-ung-vien.png` | Chọn ứng viên đầu danh sách |
| 06 | `step-06-chi-tiet-ung-vien-tab.png` | Tab mới: chi tiết ứng viên |
| 07 | `step-07-modal-xac-nhan-mo-ho-so.png` | **Mở liên hệ** → modal xác nhận (Hủy — không unlock thật trên batch QA) |
| 08–11 | `step-08` … `step-11` | **Sau mở hồ sơ:** danh sách `/business/candidates`, chi tiết gắn JD, **Quản lý ứng viên** + drawer trạng thái |

Chi tiết luồng & bảng trạng thái: [FLOW-SAU-MO-HO-SO.md](./FLOW-SAU-MO-HO-SO.md).

Chạy lại chỉ module này:

```bash
cd scripts/qa-runner && QA_HEADED=1 node run.mjs --only=scout-direct
```
