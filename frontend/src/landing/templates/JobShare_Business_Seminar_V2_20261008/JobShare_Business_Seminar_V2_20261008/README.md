# Thay đổi V2 — theo feedback 08/10/2026

- Bốn chủ đề hiển thị 4 cột trên desktop lớn, 2 cột tablet, 1 cột mobile. Ảnh chủ đề giảm từ khoảng 438px xuống tối đa 210px trên desktop và 220px trên tablet/mobile.
- Card giãn bằng nhau theo từng hàng; nội dung không bị giới hạn số dòng hoặc chiều cao. Phần trạng thái và CTA căn về đáy bằng flex, sửa lỗi card nhiều chữ dài hơn card bên cạnh.
- Thêm thumbnail cho toàn bộ 18 bài Seminar / Seminar đồng tổ chức / Event, chọn theo nội dung từ bộ Ảnh mẫu mới gửi.
- Ảnh dùng object-fit:contain, không cắt đầu/chủ thể. Thumbnail minh họa, không phải ảnh bằng chứng của sự kiện gốc.
- Đã kiểm tra cả 7 entrypoint và 3 bản standalone: đủ ảnh, asset tồn tại, tiêu đề/ngày/URL/CTA không đổi.
- Chưa thực hiện visual QA bằng trình duyệt ở các breakpoint. Thay đổi layout được kiểm tra qua cấu trúc HTML/CSS và đối chiếu ảnh feedback.

# JobShare Business Seminar V2 — 2026-10-08

## Xem bản dựng
- Mở `dist/index-ja.html`, `dist/index-en.html`, `dist/index-vi.html`.
- Hoặc mở các file trong `standalone/` (CSS, font, hình ảnh đã nhúng, không cần mạng để hiển thị).
- Ba route được chuẩn bị trong `dist/ja/business/seminar/`, `dist/en/business/seminar/`, `dist/vi/business/seminar/`.
- Đây là bản frontend bàn giao V2; chưa cập nhật test.ws-jobshare.com, chưa thay backend hay nguồn CMS hiện hành.

## Kế thừa
- `business-v6.7.css`: sao chép nguyên base từ gói Home V6.7 (bản base đã được About Us V5 sử dụng).
- `about-us.css`: CSS About Us V5, chỉ bỏ Google Fonts import vì đã đóng gói font cục bộ.
- Header/footer: fork markup từng ngôn ngữ từ About Us V5, chuyển active state sang Seminar, bổ sung contact/address nguồn Seminar.
- Login V1: font WOFF cục bộ, utility/focus/input 52px, radius 6px. Focus ring dùng Business blue.
- `seminar.css`: phần mở rộng riêng cho Seminar; không sửa các trang khác.
- Sáu ảnh từ bộ “Ảnh dùng”: chuyển WebP, giữ tỷ lệ gốc; ảnh topic dùng contain 4:3.

## Nội dung và hành vi
- Đọc trực tiếp cả JA/EN/VI của demo ngày 08/10/2026. EN/VI trên demo chỉ dịch header/footer, phần thân vẫn là JA. Bản dựng đã dịch phần thân đầy đủ.
- Giữ 18 mục / 3 nhóm và tất cả URL chi tiết, URL danh sách gốc; giữ anchor ancseminar / ancsponsored-seminar / ancevent.
- Hotline: 080-9441-1975. Giờ nguồn: 10:00–18:00 ngày thường. Không tự thêm timezone vì nguồn không ghi rõ.
- Liên hệ: /{lang}/business/contact_rc; tài liệu: /{lang}/business/inquiry_docs_rc; đăng ký: /business/register?lang={lang}; đăng nhập: /business/login?lang={lang}.
- Link chi tiết dẫn đến trang nguồn, không có modal đăng ký giả, không tạo form thu thập dữ liệu mới.
- Tìm kiếm theo tiêu đề + nhóm nội dung, hỗ trợ tiếng Việt không dấu; thông báo không có kết quả; accordion chủ đề/FAQ; menu mobile và Escape/focus.
- Bốn chủ đề là nội dung biên tập định hướng theo brief, không phải bốn sự kiện đã lên lịch. Không gán speaker, phí, venue, format hoặc ngày giả.

## Xử lý lịch / trạng thái
Nguồn có 5 mục ngày tháng 9/2026 vẫn ghi 受付中, trong khi ngày kiểm tra là 08/10/2026. Bản dựng giữ nguyên `source_status` trong `data/seminars.json`; UI thể hiện các mục có ngày đã qua như thông tin lưu trữ, không gọi là đang mở đăng ký. Mục `resource-strategy` giữ badge miễn phí như nguồn. Không xác minh được khả năng truy cập chi tiết hay việc đăng ký ở các trang đích.

Empty state phản ánh snapshot ngày kiểm tra; khi tích hợp phải lấy lịch/trạng thái mới từ CMS hiện hành, không dùng snapshot tĩnh làm nguồn dữ liệu production. Ngày 21/7 ở source không ghi năm; bản dịch không tự thêm năm. URL cuối `20151119-2/` được giữ nguyên dù ngày hiển thị là 20/11/2025.

## Tích hợp vào ứng dụng hiện tại
1. Dùng markup `integration/content-{lang}.html` trong wrapper `.jsb-v2.jsb-v3.jsb-v4.jsb-v5.jsb-about.jsb-seminar` có thuộc tính `lang` phù hợp. Dùng header/footer chung của ứng dụng nếu đã cập nhật theo Business V5.
2. Nạp font + base CSS + About CSS + Seminar CSS theo thứ tự trong dist; đưa assets về đúng public path.
3. Render card từ nguồn dữ liệu hiện tại; đối chiếu schema `data/seminars.json` (title/date đa ngôn ngữ, url, group, source_status). Giữ URL/action thật. Phân loại upcoming theo ngày kết thúc và trạng thái đăng ký từ backend.
4. Nạp `seminar.js` sau DOM. Với SPA, chuyển khối init này vào lifecycle của route và cleanup listener khi unmount. Không gọi script một lần tại app root rồi kỳ vọng hoạt động sau mọi lần điều hướng.
5. Không thay cả ứng dụng bằng dist. Các file route tĩnh là reference/frontend handoff; các trang contact/register/detail thuộc ứng dụng hiện tại.

## QA
Đã qua kiểm tra tự động:
- 7 HTML entrypoints, 1 H1/page, ID duy nhất, anchor tồn tại, asset/font/CSS đầy đủ.
- Mỗi ngôn ngữ giữ đủ 18 URL gốc, hotline/CTA locale đúng.
- Phần thân EN/VI không còn ký tự tiếng Nhật. Không có br trong heading/summary.
- JavaScript syntax, bộ lọc nhóm, tìm kiếm tiếng Việt không dấu, kết hợp điều kiện, zero-result, reset, menu/Escape/focus.

CHƯA xác nhận visual QA: 1440 / 1366 / 1024 / 768 / 430 / 390 / 360. Môi trường hiện tại không cung cấp preview-browser workflow phù hợp để thực hiện kiểm tra này. CSS đã có breakpoint và Japanese strict wrapping, nhưng cần render/kiểm tra bằng mắt trước khi ký duyệt production. Không có screenshot được dựng giả hoặc báo QA pass khi chưa chạy.

## Ghi chú footer nguồn
Demo cũ có liên kết Frontier/ReadyCrew (Corporate/Recruiting/Facebook/Twitter/Instagram/note), khác hệ JobShare và không có trong footer About Us V5 được yêu cầu fork. Chúng được giữ trong `data/source-links.json` để đối chiếu, không tự đưa thương hiệu bên thứ ba này vào footer mới.
