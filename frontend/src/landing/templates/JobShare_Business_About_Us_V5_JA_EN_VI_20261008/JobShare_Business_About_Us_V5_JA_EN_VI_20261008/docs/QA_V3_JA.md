# JobShare Business About Us V3 — JA typography QA

Date: 2026-10-08

## Editing boundaries
- Based on V2 and Business Home V6.7. No structural redesign, no image asset replacements.
- Original Work Station / Seta Engineering factual data retained in `data/company-data.json`.
- JA is the only built locale. EN and VI source strings in JSON are unapproved drafts and are NOT published.

## Changes
1. Restored `word-break: auto-phrase`, `overflow-wrap: normal`, `line-break: strict`, `text-wrap: pretty` to JA prose.
2. Added inline `jp-nowrap-token` spans for proper names, short technical and Japanese phrases without changing source content; longer phrases can wrap responsively.
3. Updated text sizes: narrative 16px (mobile >=15px), Mission/Vision 17px (16px at tablet/mobile), card content 15–16px, company rows 15px, English micro-labels 12px.
4. Company label column 165px desktop / 145px narrow desktop, 1-column mobile. Shortened the repeated Seta heading's location label to 本社所在地 only; corporate data unchanged.
5. Business Scope 54px/1fr grid, consistent padding, number/title first-line alignment; first scope title has an approved desktop break. The original base rule targeting ALL nested spans is corrected for scope title phrase spans.
6. Let's Connect top/bottom padding of 110/96px desktop, 78/76px tablet, 76/72px mobile. JA title uses editorial 2-line wrappers, including at 360px.

## Automated and visual review
- Chromium 1440 / 1366 / 1280 / 1024 / 768 / 430 / 390 / 360px.
- All eight sizes: no document horizontal overflow, no out-of-viewport visible text (checked across ~1977 visible character positions per width), no clipped scope title and image ratios remain 16:9.
- Every required no-break token remained on one rendered line across 8 widths. Longer phrase 包括的な技術パートナーシップ may break responsively on smaller screens but is not cut off.
- Mission, Vision, Japan/Vietnam role paragraphs and Business Scope headings reviewed for abnormal splits.
- `採用や技術業務について、` / `まずはご相談ください` renders as exactly two CTA heading lines across tested widths.
- Screenshots: `docs/qa/about-v3-ja-1440-full.png`, `docs/qa/about-v3-ja-390-full.png`, with viewport captures for the other 6 sizes and JSON metrics for all 8 sizes.
- `python3 validate.py`: company facts, verbatim visible Japanese data, links, images, unique IDs, locale gate and image aspect ratios PASS.

## Production note
Local headless Chromium QA cannot guarantee the same Japanese line breaks in every browser or under different production fonts. After deployment, spot-check Safari/iOS and the actual JobShare Business shell before approval.
