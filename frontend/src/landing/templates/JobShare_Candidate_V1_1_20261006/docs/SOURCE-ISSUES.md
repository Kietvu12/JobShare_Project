# Source issues / items to confirm before production sync

## 1. Featured Job 704 — EN salary mismatch across locales

Source values remain inconsistent:

- VI: `264〜800 vạn Yên/năm`
- JA: `年収264万円～800万円`
- EN source: `JPY 26.4–80 million/year`

VI/JA imply approximately **JPY 2.64–8.0 million/year**, but V1.1 deliberately keeps the supplied EN value. Confirm the production Job/API record before correcting it; do not infer the salary in the frontend.

## 2. `+481` count

`+481` has been restored by explicit review request and is presented as a compact “more jobs” card. For production, this count should ideally come from the live jobs total/remaining count when that field is available.

## 3. Social image deployment path

Metadata currently resolves the social image as `/{locale}/candidate/assets/candidate-hero-2.png`, matching this package layout. If production assets are published through a CDN or hashed build path, replace the absolute `og:image` / Twitter image URL during deployment.
