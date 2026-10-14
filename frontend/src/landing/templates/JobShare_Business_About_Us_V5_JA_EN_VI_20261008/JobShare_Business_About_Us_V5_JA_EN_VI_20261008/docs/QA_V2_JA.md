# JA V2 Visual QA · 2026-10-08

Bản kiểm tra bằng Chromium trên HTML V2 (preview tách biệt với live site).

| Viewport | Tràn ngang | Hero height | Hero image | Who image | Model image |
|---|---|---|---|---|---|
| 1440px | Không (document=1440px) | 555px | 509px / 16:9 | 514px / 16:9 | 898px / 16:9 |
| 1366px | Không (document=1366px) | 555px | 509px / 16:9 | 514px / 16:9 | 898px / 16:9 |
| 1280px | Không (document=1280px) | 555px | 509px / 16:9 | 514px / 16:9 | 898px / 16:9 |
| 1024px | Không (document=1024px) | 555px | 408px / 16:9 | 426px / 16:9 | 898px / 16:9 |
| 768px | Không (document=768px) | 723px | 618px / 16:9 | 600px / 16:9 | 678px / 16:9 |
| 430px | Không (document=430px) | 572px | 392px / 16:9 | 394px / 16:9 | 392px / 16:9 |
| 390px | Không (document=390px) | 545px | 352px / 16:9 | 354px / 16:9 | 352px / 16:9 |
| 360px | Không (document=360px) | 524px | 322px / 16:9 | 324px / 16:9 | 334px / 16:9 |

## Đã kiểm tra
- Header/footer: `JOBSHARE BUSINESS` viết hoa và trên một dòng.
- Hero: gọn 555px desktop; copy rộng hơn ảnh; khung ảnh 16:9, không ép gần vuông.
- Who We Are: ảnh 16:9; trên mobile hình và đoạn JA đều có lề.
- Mission/Vision/Strengths: không thêm ảnh; layout giữ V6.7.
- Japan × Vietnam: role cards được ưu tiên ở trước ảnh; ảnh tối đa 900px; có khoảng cách giữa card và ảnh.
- Company Information: giữ Work Station và Seta Engineering theo WS-Engineering; không tự sửa facts; tên Seta không bị tách sai.
- Business Scope: tiêu đề số 01 không cắt giữa từ アウトソーシング trên 390px.
- Final CTA: chốt ngắt dòng JA có chủ đích; không ép EN/VI.
- 8 kích thước: 1440×1024, 1366×768, 1280×800, 1024×768, 768×1024, 430×932, 390×844, 360×780.

## Chưa làm
- Chưa map hoặc xuất bản EN/VI; hai ngôn ngữ hiển thị ở preview nhưng chưa mở chuyển trang.
- Chưa kiểm tra tích hợp trên shell/production thực tế. Chỉ đo và chụp standalone build local.

## QA images
- `qa/about-ja-1440-full.png`: desktop full page
- `qa/about-ja-390-full.png`: mobile full page
- `qa/about-ja-1024-viewport.png`: desktop nhỏ - hero
- `qa/about-ja-768-viewport.png`: tablet - hero
