# JobShare Business News V2.1 — JA / EN / VI

Bản làm lại dựa trên source News và Home V6.7 / About Us V5 / Login V1 được cung cấp.

## Mở bản giao diện

Mở `dist/index-ja.html`, `dist/index-en.html`, `dist/index-vi.html`. Assets, font và dữ liệu nằm trong cùng gói; không cần cài đặt để xem bản snapshot.

Các route được cung cấp: `/ja/business/news/`, `/en/business/news/`, `/vi/business/news/`. Static hosting thường tự chuyển route không có dấu `/` cuối sang thư mục tương ứng. Khi tích hợp ứng dụng hiện tại, giữ route không có dấu `/` như cũ.

## Nội dung và chức năng

- Đã đối chiếu API công khai gốc ngày 09/10/2026: 14 bài, trang đầu 10 bài và trang 2 có 4 bài. Không thêm bài mẫu.
- Một bài mới nhất + 9 bài còn lại trên trang đầu; không lặp bài nổi bật.
- Category ID gốc: 1 = Thông báo; 5 = Tuyển dụng; 2 = Tin tức.
- Bộ lọc, tìm kiếm, phân trang, menu mobile, đổi ngôn ngữ; giữ hotline 080-9441-1975 và khung giờ 10:00–18:00 ngày thường.
- Các link đọc bài, tải tài liệu, đăng ký, đăng nhập và tư vấn dẫn về đúng trang test gốc, không dựng giả các form/detail.
- JA/EN: ưu tiên tiêu đề bản địa có trong CMS; 10 bài đầu chưa có bản dịch nên bổ sung bản dịch hiển thị trung thành. Tiêu đề tiếng Việt gốc vẫn nguyên vẹn trong `docs/source-posts.json`. Không sửa CMS. Nhãn cho biết nội dung bài là tiếng Việt.
- Ngày đăng hiển thị theo Asia/Ho_Chi_Minh để khớp bản HTML đã lưu, tránh ngày 21/08 bị lùi thành 20/08 theo UTC.
- Ảnh bài gốc được ưu tiên cho 10 bài đầu. 4 ảnh bài trang 2 trả lỗi khi tải, được thay bằng ảnh minh họa người dùng cung cấp. Hero sử dụng ảnh riêng được cung cấp.
- Ảnh chuẩn hóa 1200 × 800, giữ nguyên toàn bộ khung gốc và thêm nền xanh nhạt khi cần; không cắt khuôn mặt/chủ thể. WebP và font nội bộ giúp bản xem không phụ thuộc CDN.

## Dữ liệu preview và tích hợp thật

Bản xem riêng sử dụng snapshot đủ 14 bài đã đối chiếu. Trên host `test.ws-jobshare.com` / `ws-jobshare.com`, `news.js` tự dùng API gốc `/api_jobshare/api/public/posts`.

Có thể cấu hình trước khi nạp `news.js`:

```js
window.JobShareNewsConfig = { apiBase: 'https://ws-jobshare.com/api_jobshare/api' };
```

Hoặc dùng service sẵn có để giữ đúng cơ chế authentication/network của ứng dụng:

```js
window.JobShareNewsConfig = {
  provider: async (params) => {
    const response = await api.getPublicPosts(params);
    return response.data;
  }
};
```

Giữ contract gốc: `page`, `limit:10`, `sortBy:'publishedAt'`, `sortOrder:'DESC'`, `surface:'business'`, và `categoryId` khi lọc. Tìm kiếm dùng `search`. API lỗi hiển thị lỗi + nút thử lại, không hiển thị lỗi thành “không có bài”.

`integration/content-{locale}.html` là phần main có thể đưa vào layout Business hiện có. Giữ wrapper `.jsb-v2.jsb-about.jsb-news` và các ID phục vụ `news.js`. Không gắn trùng header/footer khi host đã có layout. `news.js` bản đầy đủ có xử lý menu; nếu host tự quản menu, bỏ đoạn menu tương ứng khi mount/unmount trong SPA. Hệ hiện tại là React đã bundle, không có source React gốc trong gói đầu vào; gói này cung cấp HTML/CSS/JS để tích hợp, không chỉnh trực tiếp bundle cũ.

Assets tương đối ở root dist; các entry route lồng nhau đã có prefix `../../../`. `data-asset-base` điều khiển đường dẫn ảnh khi render động.

## Lưu ý kế thừa cần rà soát

Bản V2.1 đã thay hoàn toàn footer bằng About Us V5, bỏ các liên kết ReadyCrew/Frontier và khối thông tin doanh nghiệp kế thừa từ trang cũ. Header giữ nguyên cấu trúc và nhãn của About Us V5; chỉ đổi trạng thái menu active sang News. Final CTA dùng nội dung Home V6.7 và cặp nút vàng tải tài liệu / trắng tư vấn.

Source JA/EN cũ hiển thị 10 bài thuộc ID 5 thành “News/ニュース” do thiếu mapping `tuyen-dung`. Bản mới sửa nhãn thành “Recruitment/採用情報”, không đổi category ID.

## Kiểm tra

`node docs/validate.cjs`

Đã kiểm tra dữ liệu, phân trang, danh mục, tìm kiếm, ngày đăng, bản dịch, liên kết gốc, thứ tự bài, đường dẫn assets, cấu trúc HTML và ratio ảnh. Có CSS responsive cho 1440 / 1366 / 1024 / 768 / 430 / 390 / 360.

**Chưa xác nhận kiểm tra trực quan bằng trình duyệt ở 7 kích thước trên**: môi trường phiên làm việc không có skill control-browser cần thiết. Không coi đây là biên bản đã pass visual QA. Cần kiểm tra bố cục và interaction trong trình duyệt trước khi tích hợp production.

Bản xem không thay đổi website `test.ws-jobshare.com`.

## Cập nhật theo duyệt ngày 09/10

- Mobile: ảnh 120×80 + metadata ở hàng đầu; tiêu đề chiếm toàn bộ chiều rộng hàng dưới, 19px, không cắt dòng hay thu nhỏ chữ. Desktop vẫn 220×147.
- Sáu vai trò ảnh được ghi trong `docs/image-roles.json`; ảnh sự kiện chưa dùng vì nguồn không có bài seminar phù hợp. Giữ nguyên ảnh báo chí về nhà máy/sân bay và các trải nghiệm thất nghiệp.
- Hero giữ nền thành phố xanh và ảnh họp, spacing 52px desktop / 36px mobile.
- Bản cập nhật này đã kiểm tra cấu trúc, link, dữ liệu và đối chiếu header/footer với nguồn. Chưa có visual QA trình duyệt tại 7 viewport.
