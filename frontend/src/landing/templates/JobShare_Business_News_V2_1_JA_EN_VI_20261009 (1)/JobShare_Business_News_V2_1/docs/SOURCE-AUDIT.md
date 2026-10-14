# Source audit

Read supplied archives:
- JobShare Business - News(1).rar: 3 saved HTML locales plus compiled JS/CSS. All 3 captured pages contain the same first 10 article titles, slugs and dates.
- Home V6.7: `dist/jobshare-home-v2.css` directly copied as `business-v6.7.css`; byte-identical to base in About Us V5.
- About Us V5: full three-locale header/footer reused, active navigation changed to News; completed shell CSS preserved; its external font import replaced by local font loading.
- Login V1: local Barlow and Noto Sans JP font files; 48px search control based on its 52px input styling, rounded 6px border and blue focus state.
- Six user-supplied News images inspected; hero retained, supporting images normalized to 3:2 and used where original image download failed.

Live read-only endpoints verified:
- https://ws-jobshare.com/ja/business/news — HTTP 200 via direct request (web text reader could not open it).
- https://ws-jobshare.com/api_jobshare/api/public/posts?page=1&limit=10&sortBy=publishedAt&sortOrder=DESC&surface=business
- Same query with page=2.
- https://ws-jobshare.com/api_jobshare/api/public/post-categories

Page 1 IDs in exact original order: 28,29,30,31,32,33,34,35,36,37.
Page 2 IDs: 22,21,20,19.
Total 14. Category 5: 10. Category 2: 2. Category 1: 2.

No API mutations, CMS updates, original site deployments, or third-party messages were performed.
