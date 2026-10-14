# Kiểm tra bản V3

## Kết quả
- Chromium: 3 ngôn ngữ × 8 viewport = 24 trường hợp: 1440, 1366, 1280, 1024, 768, 430, 390, 360 px.
- Không có tràn ngang, ảnh hỏng, heading/card/button tràn khung trong kiểm tra tự động.
- H1 900; hệ font VI Segoe UI/Arial/Helvetica Neue, EN Barlow với fallback Nhật, JA Noto Sans JP với fallback Nhật.
- Đối chiếu tất cả phần tử gắn data-source với JSON nguồn: không có sai lệch ngoài bỏ dấu chấm cuối heading đã cho phép.
- Kiểm tra thứ tự section; 3 community card, 4 why card, 3 bước, 4 tính năng/12 bullet, 18 logo, 6 FAQ.
- Đối chiếu 3 tiêu đề/URL news theo locale; không hard-code `<br>`.
- Nhãn hoa hồng 25% Khởi điểm / Starting rate / 開始時; 50% Tối đa / Maximum / 最大.
- Kiểm tra menu mobile, accordion, contact dialog, policy dialog, hỗ trợ CTV, chuyển ngôn ngữ standalone, reduced-motion.
- Luồng tạo phiên/gửi/đọc tin/SSE chat dùng route mock; không gửi tin thật.
- Ba HTML standalone không có ảnh hỏng; font tải hoàn tất.

## Rà hình thực tế
Đã xem các heading Nhật tại 8 viewport. Nhóm từ ngữ nghĩa không bị tách giữa từ thương hiệu/số liệu; final CTA tách theo “始める準備は / できていますか”. Không thêm dấu xuống dòng cứng.

Rà body Nhật trên mobile phát hiện và sửa lỗi các span AI/CV bị flex chia cột trong bullet list. Danh sách hiện dùng một dòng text flow với dấu tick định vị riêng. Copy không đổi.

Các báo cáo JSON kèm theo là kết quả kiểm tra máy; preview heading chỉ hỗ trợ rà bố cục. Chưa kiểm thử Safari/iOS thực hoặc xác nhận tin nhắn được backend production chuyển tới quản trị viên.
