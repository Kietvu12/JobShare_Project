# JobShare Collaborator V3 — 05/10/2026

Bản sửa theo yêu cầu đối chiếu nội dung nguồn và typography Business Home 6.7. Chưa triển khai thay thế trang live.

## Mở bản xem
- `standalone/JobShare_Collaborator_VI_V3.html`
- `standalone/JobShare_Collaborator_EN_V3.html`
- `standalone/JobShare_Collaborator_JA_V3.html`

Đặt ba file cùng thư mục để chuyển ngôn ngữ. Ảnh, font và JavaScript đã nhúng trong từng file. Link đăng ký/đăng nhập, bài viết và dịch vụ chat cần internet.

## Mã nguồn
`index.html`, `index-en.html`, `index-ja.html` dùng chung assets, styles.css, fonts.css và app.js.

- `source-content.json`: nội dung marketing gốc ba ngôn ngữ.
- `ui-content.json`: điều hướng, vai trò, nhãn giao diện, alt và thông báo hệ thống.
- `support-content.json`, `policy-content.json`: nội dung hỗ trợ và chính sách từ source.
- `news.json`: tiêu đề, ảnh và đường dẫn bài viết theo ngôn ngữ.
- `ja_typography.py`: nhóm từ phục vụ xuống dòng; không thay đổi câu nguồn.

Chạy `python build.py`, sau đó `python make_standalone.py` để dựng lại. Script dùng Python 3; Pillow phục vụ đóng gói ảnh nếu cần.

## Cấu trúc
Role intro + ba vai trò → Header → Hero → Community (3) → Why JobShare (4, hoa hồng trong mục đầu) → AI CV 3 phút → Quy trình 3 bước → 4 tính năng / 12 gạch đầu dòng → 18 logo đối tác → 3 tin tức → 6 FAQ → Final CTA → Footer. Nút hỗ trợ CTV màu vàng và back-to-top.

## Nội dung giữ nguyên
Không thay nội dung marketing bằng copy mới. Hai chỉnh sửa tiếng Việt được phép: viết hoa Cộng tác viên và “tỉ lệ” thành “tỷ lệ”. Bỏ dấu chấm kết câu trong heading ở lớp hiển thị; giữ dấu câu bên trong. Giữ “Follow” của VI và “外国人人材を募集” của JA để chủ nội dung duyệt riêng.

Xem `docs/QA.md` và `docs/SOURCE-ISSUES.md` để biết phạm vi kiểm tra và các điểm nguồn chưa có đích chính thức.
