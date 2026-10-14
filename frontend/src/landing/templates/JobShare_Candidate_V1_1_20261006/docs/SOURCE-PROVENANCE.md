# Source provenance

## Priority used

1. `JobShare_Collaborator_V3_20261005` — UI/design/behavior base.
2. Candidate source — content, routes, job data, news and Candidate functionality.
3. Business 6.7 — visual-quality benchmark only.

## Candidate source used

The supplied `JobShare - UV(5).rar` was extracted and all three saved Candidate pages were parsed:

- VI: `Tìm việc kỹ sư tại Nhật Bản | Workstation JobShare - Tạo CV bằng AI`
- EN: `Engineering Jobs in Japan | Workstation JobShare - AI-Powered CV Builder`
- JA: `日本のエンジニア求人 | Workstation JobShare - AIで履歴書作成`

The saved application bundle was also inspected to recover Candidate-specific route/API behavior, including the public Candidate support chat endpoints.

## Live Candidate URLs

The intended live sources are:

- `https://ws-jobshare.com/vi/candidate`
- `https://ws-jobshare.com/en/candidate`
- `https://ws-jobshare.com/ja/candidate`

The build environment could not resolve/access these public pages during this build, so live HTML was **not** substituted with guessed content. The supplied saved 3-language Candidate pages are the source of truth used in the package, together with the approved corrections in the master build spec.

## Approved corrections applied

- Why card 04 is retained and converted from CTV meaning to Candidate meaning in VI/EN/JA.
- VI News description uses `mẹo tìm việc`, not `mẹo làm CTV`.
- No public developer/snapshot/API note.
- V1.1 review override: restore `+481` as a compact V3-style “more jobs” card; do not restore the oversized legacy tile.
- No Candidate FAQ section.
- V1.1 review override: hero visual changed to `candidate-hero-2`.
- V1.1 review override: production language/active-role navigation must use `/vi|en|ja/candidate`; static filenames are standalone-review only.
- V1.1 review override: restore clean OG/Twitter metadata and JSON-LD `WebSite` + `Organization` alongside `WebPage`.

## Business 6.7

Business 6.7 was unpacked only after V3/Candidate structure analysis and used as a polish benchmark. Its palette/layout was not copied into Candidate.
