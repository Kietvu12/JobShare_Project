# Candidate V1.1 QA

## Structural checks — VI / EN / JA

Validated from generated production HTML:

- exactly one canonical per page,
- hreflang points to `/vi|en|ja/candidate`,
- production language switch contains no `index*.html` links,
- Candidate active-role points to the current locale Candidate route,
- standalone language switch / Candidate active-role map to local review files only,
- hero uses `candidate-hero-2.webp`,
- Featured Jobs contains 5 source jobs + one compact `+481` more-jobs card,
- Why cards: 4,
- application steps: 3,
- Candidate features: 4,
- partner logos: 18,
- Candidate News cards: 2,
- FAQ section: 0,
- Final CTA DOM remains image-left / text-right.

## Typography / line-break safeguards

- `text-wrap: pretty` enabled for body copy/list copy and job/news titles,
- VI phrase `Nhật Bản` is kept together in visible body text,
- JA uses `line-break: strict`, `word-break: normal`, `overflow-wrap: normal`,
- protected JA units include `「マッチング」度`, `高い求人`, `募集中の求人`, `すばやく確認`, `希望条件`, `ステータス`, `ご案内します`, `求職者プロフィール`, `日本での多くの`, `求人機会`, `利用は完全無料です` and the V3 brand/Latin tokens,
- typography processors do not touch `<title>`, metadata, script, style or JSON-LD.

## SEO / social

Each locale contains one clean set of:

- `og:title`
- `og:description`
- `og:image`
- `og:url`
- `twitter:card`
- `twitter:title`
- `twitter:description`
- `twitter:image`

JSON-LD is one script with one `@graph` containing:

- `WebSite`
- `Organization`
- `WebPage`

No `SearchAction` is emitted, so no legacy `/landing/candidate/jobs` route remains.

## Source-specific checks

- EN News `2026-04-24` renders `Apr 24, 2026`.
- Job 704 EN remains `JPY 26.4–80 million/year` pending production API verification; no silent correction was made.

Raw structural output: `docs/qa-results.json`.
