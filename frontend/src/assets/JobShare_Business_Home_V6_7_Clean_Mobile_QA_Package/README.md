> 2026-09-25: Đã cập nhật reference-match hero / trust badges / JobShare video section / final CTA. Xem `docs/V6_7_REFERENCE_MATCH_20260925.md`.

# JobShare Business Home V6.7

Bản package sạch để bàn giao dev. Không còn file V6 / V6.6 ở thư mục gốc.

## File mở trực tiếp / gửi dev

- `JobShare_Business_Home_JA_V6_7.html`
- `JobShare_Business_Home_EN_V6_7.html`
- `JobShare_Business_Home_VI_V6_7.html`

Ba file trên dùng chung thư mục `assets/` và có thể mở trực tiếp khi giữ nguyên cấu trúc thư mục.

## Standalone

Thư mục `standalone/` chứa 3 file HTML đã nhúng toàn bộ ảnh, CSS và JS; có thể gửi riêng từng file và mở trực tiếp mà không cần `assets/`.

## Dành cho dev

- `dist/`: preview/build tách CSS + JS + assets
- `integration/`: fragment + CSS/JS + React wrapper mẫu
- `source/`: nội dung đa ngôn ngữ
- `build.py`: rebuild các file thường V6.7 và `dist/integration`
- `assets/`: ảnh hiện đang được sử dụng

## Mobile QA

Đã rà soát JA / EN / VI ở 360, 390, 430 và 768 px. Chi tiết: `docs/MOBILE_QA_V6_7.md`.

## 2026-09-25 BG / video / CTA stabilization
See `docs/V6_7_BG_FIX_20260925.md` for the latest reference-match fixes.
