# JobShare Business — Services & Pricing V1

Open dist/index-ja.html, dist/index-en.html or dist/index-vi.html. Hosted routes also support /ja/business/price, /en/business/price and /vi/business/price.

## Changes
- Home V6.7 Business blue, local font system, city backdrop and consultation image.
- About Us V5 header/footer; corrected Services & Pricing navigation label. Legal identity retained exactly: WORK STATION.,JSC.
- Four canonical Home services; Work Station spelling throughout explanatory text.
- New responsive input panel and three stacked simulator results, editable assumptions, validation, reset, copy and expandable calculations.
- Vietnamese content implemented independently, no reuse of the incorrect legacy Vietnamese page.

## Reference fees — not an approved tariff
Source: supplied JobShare Business_Price.rar and live https://ws-jobshare.com/ja/business/price checked 2026-10-19; matching index-CKZ9M_CP.js bundle.
Basic 1,000 credits / JPY30,000; Standard 3,000 / JPY81,000; Premium 5,000 / JPY127,500. Default 100 credits per profile. Whole package purchase optimization; unused credits displayed.
Delegated Scout reference rates: junior15%, mid18–20%, senior20–25% of annual income per hire. Partner fee is employer-set; platform20% is included, not added. Branding requires a separate quote. Tax and other charges are not invented or added.
Edit dist/pricing-config.js after Work Station approves prices; if embedding in the actual product, replace reference constants with the approved settings provider. No authentication, account creation or payment is simulated. Buttons route to original public registration/contact pages.

## Verification
Run node docs/verification.cjs. Verified defaults, whole-package optimization against 120 brute-force cases, invalid/blank values and budget boundaries. Checked JavaScript syntax, locale key parity and local asset paths.
Browser visual and interaction QA was unavailable in this session. Mobile CSS is implemented but requires review on actual 375px, 390px, 768px, 1024px and desktop viewports before production integration. This preview does not modify ws-jobshare.com.

## V2 — 19 Oct 2026
- Compact four-field input row and three side-by-side, color-coded results on desktop; tablet and mobile use stacked comparisons. Advanced settings collapse by default.
- Fixed Q&A CSS collision: renamed question component and provided explicit Q / question / toggle children. The old inherited 46px text column no longer applies.
- Replaced closing CTA classes with a scoped component, matching the About layout and Business colors; explicit padding, button sizes and phone spacing.
- Revised JA/EN/VI copy, shortened result explanations, kept currency values unbroken and corrected the Vietnamese headline phrase break.
- Reviewed all four supplied screenshots. Browser QA remains unavailable; no screenshot-based claim is made for the revised rendering.
