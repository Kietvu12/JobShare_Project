# Source notes

## Collaborator V3 audit
- Direct color tokens: `#ed212f`, `#be1824`, `#112f3d`, `#2f4d5c`, `#617782`, `#dae4e9`, `#f2f8fc`.
- Typography: EN = Barlow; VI = Segoe UI / Arial / Helvetica Neue; JA = Noto Sans JP / Japanese system fallbacks.
- Heading weights: h1/h2 900, h3 800; buttons 700.
- Core CTA: min-height 54px, 6px radius, red primary, slight lift on hover.
- Layout atmosphere: white/light-sky gradient + subtle 64px grid, thin borders, soft shadows.
- Motion: `cubic-bezier(.22,1,.36,1)`, reveal/enter movement ~24px, reduced-motion respected.
- Existing V3 breakpoints audited: 1180, 960, 720, 390. Login uses the same main responsive breakpoints as V3: 960 / 720 / 390; the two-panel transactional shell collapses at 720px.

## Current Login source audit
Saved package contains VI / EN / JA snapshots of the same `/login` route.

CTV login behavior from the current production bundle:
1. Validate presence of email/password.
2. `POST /ctv/auth/login`.
3. On token success, save `token`, `userType=ctv`, collaborator `user`.
4. Navigate `/agent`.
5. Existing `token + userType=ctv` redirects `/agent`.

Forgot password behavior:
1. Switch in-page to forgot-password view (no route change).
2. Email input.
3. `POST /ctv/auth/forgot-password`.
4. Success state stays on the same page.

Routes retained: `/`, `/register`, `/agent`.

## Intentional presentation changes only
- Removed old Myriad Pro/Tailwind look.
- Removed flag dropdown presentation and reused V3 `VI / EN / JA` language control.
- Replaced heavy black border / 16px+ radius / heavy shadow with V3 line, radius, spacing and soft shadow.
- No new marketing copy, social login, unified role tabs, QR, OTP or Business/Candidate login were added.
