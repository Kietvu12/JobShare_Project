# Workstation JobShare Candidate V1.1 — 06/10/2026

Bản Candidate này tiếp tục **fork trực tiếp `JobShare_Collaborator_V3_20261005`**, không tạo design system mới. V1.1 là vòng sửa theo review Candidate: khôi phục `+481`, thay hero mới, xử lý line-break VI/EN/JA, hoàn thiện SEO/social metadata và tách rõ route production với route review standalone.

## Mở bản xem độc lập

- `standalone/JobShare_Candidate_VI_V1_1.html`
- `standalone/JobShare_Candidate_EN_V1_1.html`
- `standalone/JobShare_Candidate_JA_V1_1.html`

Standalone dùng file tĩnh để chuyển VI/EN/JA và Candidate active-role nhằm review cục bộ. **Production source không dùng filename tĩnh**; các link này map về:

- `/vi/candidate`
- `/en/candidate`
- `/ja/candidate`

## Thay đổi V1.1

- Khôi phục ô `+481` ở Featured Jobs nhưng thu về đúng tỷ lệ card V3, dùng red gradient + border/radius/hover cùng ngôn ngữ thiết kế hiện tại; không dùng tile đỏ khổng lồ như legacy.
- Hero đổi sang `assets/candidate-hero-2.webp` từ ảnh `candidate-hero-2` được duyệt.
- Bổ sung `text-wrap: pretty`, strict JA line breaking và phrase protection để tránh orphan/split xấu ở VI/EN/JA.
- Bổ sung Open Graph + Twitter metadata đầy đủ.
- JSON-LD dùng một graph sạch gồm `WebSite`, `Organization`, `WebPage`; không duplicate schema và không dùng legacy SearchAction route.
- Canonical/hreflang tiếp tục dùng đúng Candidate locale routes.
- Production language switch + Candidate active-role dùng Candidate routes thật; standalone mới đổi sang file review cục bộ.
- EN News date formatter dùng dạng source ngắn: `Apr 24, 2026`.
- Job 704 EN salary **chưa tự sửa** vì source VI/JA và EN lệch 10 lần; chờ đối chiếu production API/job thật.

## Mã nguồn chính

- `index.html` — VI production-ready
- `index-en.html` — EN production-ready
- `index-ja.html` — JA production-ready
- `styles.css` — V3 base + Candidate adapters
- `fonts.css` — typography V3
- `app.js` — behavior V3/Candidate
- `build.py` — renderer 3 ngôn ngữ + SEO/social/schema
- `source-content.json` — Candidate copy 3 ngôn ngữ
- `ui-content.json` — role selector, nav, alt text
- `support-content.json` — Candidate support
- `jobs.json` — Featured Jobs data
- `news.json` — Candidate News
- `ja_typography.py` — protected JA lexical/brand units trong visible BODY text
- `latin_typography.py` — protected phrase nhỏ cho VI/EN, không chạm metadata
- `make_standalone.py` — tạo 3 file review độc lập

Chạy lại:

```bash
python build.py
python make_standalone.py
```

## Visual Candidate

- `assets/candidate-hero-2.webp` — hero hiển thị
- `assets/candidate-hero-2.png` — social share source
- `assets/candidate-platform.webp`
- `assets/candidate-career-support.webp`
- `assets/candidate-ai-cv.webp`

## QA / provenance

- `docs/V3-FORK-ANALYSIS.md`
- `docs/QA.md`
- `docs/qa-results.json`
- `docs/SOURCE-PROVENANCE.md`
- `docs/SOURCE-ISSUES.md`
- `docs/CANDIDATE-MASTER-BUILD-SPEC.md`
