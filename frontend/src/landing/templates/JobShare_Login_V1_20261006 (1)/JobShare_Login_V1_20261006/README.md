# JobShare Login V1 — 06/10/2026

Login redesign forked from `JobShare_Collaborator_V3_20261005`.

## Preview
- `index.html` — VI
- `index-en.html` — EN
- `index-ja.html` — JA

## Production behavior retained
- Home: `/`
- Register: `/register`
- CTV login API: `POST https://ws-jobshare.com/api_jobshare/api/ctv/auth/login`
- Forgot password API: `POST https://ws-jobshare.com/api_jobshare/api/ctv/auth/forgot-password`
- Successful CTV login stores `token`, `userType=ctv`, and collaborator `user`, then routes to `/agent`.
- Existing authenticated CTV session routes to `/agent`.
- Forgot password stays inside Login as in the current source.
- Password show/hide is retained.
- Language switch stays on the same Login screen and uses VI / EN / JA presentation from Collaborator V3.

## Design base
No Login-specific theme was created. Directly reused V3 tokens and language:
`--red #ed212f`, `--red-deep #be1824`, `--ink #112f3d`, `--text #2f4d5c`, `--muted #617782`, `--line #dae4e9`, `--sky #f2f8fc`, Barlow / Segoe UI / Noto Sans JP, 6–8px component radii, V3 button motion, light-sky/grid atmosphere, and the 960 / 760 / 520 / 390 responsive cascade.

Business 6.7 was not used as a new palette/layout.
