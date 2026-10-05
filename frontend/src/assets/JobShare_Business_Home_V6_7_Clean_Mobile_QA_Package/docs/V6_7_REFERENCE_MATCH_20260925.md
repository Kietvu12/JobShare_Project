# V6.7 Reference-match revision — 2026-09-25

## Thay đổi chính
- Hero được dựng lại theo ảnh mẫu JobShare Business cũ:
  - Nội dung bên trái, nhân vật `hero-person.png` (middle_model_icon) bên phải.
  - Nền thành phố chìm dùng asset local `city-photo-bg.png`.
  - 3 CTA: Tải tài liệu / Đăng ký miễn phí / Tư vấn tuyển dụng (JA/EN/VI).
- 3 huy hiệu thành tích được đưa sát hero và chồng nhẹ giữa nền xanh/trắng như ảnh mẫu.
- Ghi chú số liệu JA dùng đúng câu:
  `※掲載数値は、2026年6月時点におけるJobShareの運営実績および登録データをもとに算出しています。`
- Section WHY JOBSHARE cũ được thay bằng layout JobShare cũ:
  - Video YouTube bên trái: `https://www.youtube.com/watch?v=s-qy-EaoOXg`
  - Nội dung bên phải.
  - Chữ `JobShare` mờ chuyển động nhẹ phía sau.
- CTA hỏi nhu cầu tuyển dụng được viết lại lịch sự hơn ở cả JA/EN/VI.
- Final CTA sử dụng `final-person.png` (Thiết kế chưa có tên), nhân vật trái / nội dung phải, 2 CTA + phone như ảnh mẫu.
- Floating CTA desktop đã đồng bộ 3 lựa chọn: tài liệu / đăng ký / tư vấn.

## QA
- Đã kiểm tra không có horizontal overflow cho JA/EN/VI tại các viewport: 320, 360, 390, 560, 768, 820, 1024, 1280, 1440px.
- Standalone, root preview, dist và integration fragments đều được rebuild từ cùng source.
