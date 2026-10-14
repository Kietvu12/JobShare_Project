# JobShare Jobs V3 · 07/10/2026

Sửa trực tiếp từ gói `JobShare_Jobs_V2_20261007` anh cung cấp. Giữ visual của header, Role Selector, hero và Job Card V2; sửa bộ chọn, trạng thái nhiều lựa chọn và typography.

## Mở bản bàn giao

- `standalone/JobShare_Jobs_VI_V3.html` (EN/JA cùng thư mục): HTML tự chứa font, ảnh, dữ liệu bộ chọn; đổi ngôn ngữ liên kết giữa ba file.
- `dist/`: bản website tĩnh, có ba đường dẫn `/vi/jobs`, `/en/jobs`, `/ja/jobs`.
- `node build.mjs` rồi `python make-standalone.py`: tạo lại website và HTML tự chứa.
- `npm test`: kiểm thử dữ liệu, state, serializer, HTML và cú pháp JavaScript.

## Đã sửa

- Category: checkbox multi-select; desktop hai vùng; nhánh chi tiết thụt cấp; mobile đi vào từng cấp và Back. Active navigation tách khỏi selection.
- Location: Việt Nam/Nhật Bản, 8 vùng + 47 tỉnh Nhật + 1.901 thành phố/quận theo master gốc. Việt Nam giữ 63 tỉnh/thành từ source cũ, không tự bổ sung quận/phường.
- Draft riêng: Confirm mới ghi bộ lọc và tìm kiếm; Close/Escape hủy; Clear chỉ tác động draft. Footer cố định trong modal.
- Hero/sidebar dùng chung state; trigger tóm tắt; chip xóa riêng; URL giữ nhiều mã và location objects; Back/Forward đồng bộ.
- VI/EN desktop: hai nhóm dòng hero; giữ cụm “kinh nghiệm”. JA strict line-break. Dynamic text không thêm BR.
- Xóa toàn bộ floating support, CSS và locale copy liên quan.
- Giữ 18 job SSR ban đầu; lỗi tải lại cùng query giữ kết quả hiện có. Lỗi khi đổi query hiển thị lỗi thay vì gán nhầm danh sách cũ cho bộ lọc mới.

## Các semantics cần biết

Source gốc không có checkbox country = tìm toàn quốc: checkbox quốc gia chỉ mở phần lựa chọn và bỏ chọn sẽ xóa địa điểm thuộc quốc gia đó. Region/prefecture là navigation; “chọn tất cả” ở prefecture chọn toàn bộ municipality/ward. Không tạo filter cấp region giả.

Category gốc: root không tự tick con; subgroup chọn/bỏ cả nhánh; leaf độc lập. Backend mapper gốc ưu tiên `jobTypeIds` khi có; nếu không có, mở rộng các `fieldIds` thành toàn bộ ID trong nhánh. V3 giữ quy tắc ưu tiên này, không suy đoán một union khác.

Địa điểm legacy trong API có bản ghi chỉ chứa romaji của thành phố/quận. Query dùng delimiter `|||` thật của source; thêm alias từ master (tên Nhật, tên romaji) để vẫn tìm được các bản ghi đó. Khi dữ liệu cũ thiếu tỉnh, những municipality trùng tên không thể phân biệt chính xác chỉ bằng bộ lọc text của API.

## Trạng thái QA

Các kiểm thử tự động đã đạt. **Chưa hoàn tất QA trình duyệt và bộ 10 screenshot V3**: supervisor preview bị lỗi môi trường `bwrap: Can't mount proc ... Operation not permitted`. Không có ảnh V3 giả lập. `docs/reference-v2-screenshots/` chỉ là ảnh tham chiếu V2 đã có trong gói nguồn, không phải bằng chứng V3.

Xem `docs/QA.md`, `docs/SOURCE-MAPPING.md` và `docs/STATIC-BREAK-MAP.md` để tiếp tục nghiệm thu.
