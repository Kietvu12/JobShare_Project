# QA V2

## Đã kiểm tra trong package

- JA / EN / VI đều được generate từ cùng cấu trúc.
- CSS scoped dưới `.jsb-v2` để giảm xung đột với layout host.
- Không có header/footer trong integration fragment.
- CTA có route hooks `data-route`.
- `prefers-reduced-motion` được hỗ trợ.
- Nếu JS không chạy, content vẫn hiển thị; class ẩn motion chỉ được thêm khi initializer chạy.
- FAQ dùng native `<details>`.
- Desktop width 1440 không có horizontal overflow.
- Mobile width 390 không có horizontal overflow; trust badge dùng horizontal scroll để giữ text đủ lớn.
- Mobile có sticky 2 CTA.

## Ảnh QA

Thư mục `qa/` có screenshot kiểm tra các section JA. Đây chỉ là ảnh QA, không cần deploy.

## Cần dev kiểm tra khi gắn vào web thật

- header height của site host
- route chính thức từng locale
- hotline / giờ làm việc hiện hành
- số liệu 40,000+ / 500+
- căn cứ claim “東南アジア初 / First in Southeast Asia / Đầu tiên tại Đông Nam Á”
- analytics / GTM event cho Download, Register, Contact, Phone
- Core Web Vitals sau khi tối ưu ảnh production
