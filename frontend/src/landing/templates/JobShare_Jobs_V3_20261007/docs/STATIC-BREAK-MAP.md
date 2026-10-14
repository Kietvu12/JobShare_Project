# Static typography map · implementation review, visual QA pending

| Element | VI | EN | JA |
|---|---|---|---|
| Hero line 1 | Tìm công việc phù hợp | Find the right opportunity | あなたに合う仕事を |
| Hero line 2 | cho bước tiếp theo của bạn | for your next chapter | 次のキャリアへ |
| Desktop >=1024 | Individual line wrappers, no wrap | Individual line wrappers, no wrap | Same two approved display groups; strict kinsoku |
| Smaller widths | Natural wrapping, no arbitrary BR | Natural wrapping | Natural Japanese wrapping, normal word-break |
| Description | Only “kinh nghiệm” no-split | Natural sentence wrapping | Strict line-break, normal word-break |
| Results heading | Complete title, natural wrap | Complete title, natural wrap | Complete title, strict wrapping |
| Filter labels | Complete labels, natural wrap | Complete labels, natural wrap | Complete labels, strict wrapping |
| Modal headings | Complete title in flexible header | Complete title in flexible header | Complete title, strict wrapping |
| Empty state | Complete title, natural wrap | Complete title, natural wrap | Complete title, strict wrapping |
| Footer headings | Complete labels, natural wrap | Complete labels, natural wrap | Complete labels, strict wrapping |

No global script inserts line breaks. Job title/company/category/location/salary remain escaped dynamic text, without BR or no-split markup. Existing locale fonts retained: VI Segoe UI; EN Barlow; JA Noto Sans JP plus original fallbacks.
