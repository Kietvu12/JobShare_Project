# Các điểm nguồn cần chủ nội dung xác nhận

1. Tiếng Nhật `外国人人材を募集`: có chuỗi “人” lặp. Giữ nguyên theo chỉ dẫn, chưa tự sửa.
2. Nhãn tiếng Việt `Follow`: giữ nguyên từ source.
3. Nút vàng nguồn là chat hỗ trợ CTV nội bộ, không phải một URL Messenger. Đã khôi phục giao diện hỗ trợ và kết nối theo endpoint nguồn. Không tự tạo `m.me/...`.
4. Link Facebook dự phòng trong source là `https://www.facebook.com/`, chưa có đích fanpage cụ thể. Giữ nguyên. Cần URL chính thức nếu muốn đổi thành Facebook/Messenger của JobShare.
5. Link “Our documents” trong footer nguồn là `#`. Giữ nguyên vì chưa có đích tài liệu chính thức.
6. Chat đã được kiểm tra giao diện và luồng gửi bằng API mô phỏng, chưa gửi tin thật hay xác minh quản trị viên nhận tin. Khi đưa lên domain thật cần xác minh CORS/session/SSE với backend hiện hữu. Bản HTML mở từ ổ đĩa có thể bị chính sách cross-origin của server chặn; giao diện báo lỗi kết nối thay vì báo thành công giả.
7. Khôi phục chat văn bản và nhận tin SSE; chưa sao chép chức năng đính kèm, kéo widget và bộ đếm chưa đọc của ứng dụng nguồn.

Các điểm trên được ghi riêng để duyệt; không thay copy nguồn hoặc sáng tác link thay thế.
