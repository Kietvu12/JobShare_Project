# Module: Dịch vụ – Scout ủy thác (おまかせスカウト)

| Step | File | Thao tác |
|------|------|----------|
| 01 | `step-01-tu-dashboard.png` | Dashboard DN |
| 02 | `step-02-onboarding-dich-vu.png` | `/business/scout/managed` — **おまかせスカウトを始める** |
| 04 | `step-04-workspace-bo-loc-va-danh-sach.png` | Workspace ứng viên (không credit unlock) |
| 05 | `step-05-mo-bo-loc-nang-cao.png` | Bộ lọc nâng cao (nếu có) |
| 06 | `step-06-danh-sach-ung-vien.png` / `step-06-chi-tiet-ung-vien-tab.png` | Mở hồ sơ tab mới |
| 07 | `step-07-modal-uy-thac-ws-scout.png` | **Ủy thác WS** — modal (Hủy trên batch QA) |
| 08–12 | `step-08` … `step-12` | Hồ sơ đã mở, chi tiết, **Quản lý ứng viên**, drawer trạng thái, **Tin nhắn WS** |

Luồng WS vs DN & trạng thái: [FLOW-SAU-UY-THAC.md](./FLOW-SAU-UY-THAC.md).

```bash
cd scripts/qa-runner && QA_HEADED=1 node run.mjs --only=scout-managed
```
