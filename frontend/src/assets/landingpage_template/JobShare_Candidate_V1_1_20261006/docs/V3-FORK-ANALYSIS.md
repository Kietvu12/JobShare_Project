# Collaborator V3 → Candidate: fork analysis

## 1. Việc đã làm trước khi viết Candidate HTML/CSS

Package `JobShare_Collaborator_V3_20261005` được giải nén và đọc trước Candidate implementation. Đã kiểm tra `index*.html`, `styles.css`, `app.js`, `build.py`, multilingual data, Japanese typography processor, standalone builder, assets và responsive rules.

Candidate sau đó được tạo bằng cách copy trực tiếp package V3 làm working base, không khởi tạo project/design system mới.

## 2. Design system được giữ nguyên từ V3

### Core variables

```css
--red: #ed212f;
--red-deep: #be1824;
--ink: #112f3d;
--text: #2f4d5c;
--muted: #617782;
--line: #dae4e9;
--sky: #f2f8fc;
--paper: #fff;
--max: 1200px;
--ease: cubic-bezier(.22,1,.36,1);
```

### Typography

- Base EN: Barlow / Arial fallback from V3.
- VI: Segoe UI override from V3.
- JA: Noto Sans JP and V3 Japanese line-breaking rules.
- No Candidate-specific font scale was introduced.

### Spacing / grid / responsive

- `.wrap`, section padding, gutters and V3 grid language preserved.
- V3 breakpoints retained: 1180 / 960 / 720 / 390.
- Candidate QA additionally tested all requested viewport widths without introducing new breakpoint tokens.

### Motion

V3 reveal, hover, hero enter behavior, back-to-top behavior and `prefers-reduced-motion` handling are preserved.

## 3. Components forked from V3

- Role selector — same 3-column component, Candidate becomes active.
- Header — same sticky header, logo placement, nav/language/login/register/menu behavior.
- Hero — same V3 hero grid/background/media frame/responsive rules; only Candidate content/image/routes changed.
- Three-card discovery grid — V3 community-card visual language.
- Why cards — V3 why-card language, now 4 Candidate cards.
- AI CV — V3 split/media-frame component and V3 `ai-cv.webp` visual.
- Application process — V3 3-step flow component.
- Candidate platform — V3 platform intro + media frame + feature cards.
- Partners — V3 partner grid and real partner assets.
- News — V3 News card component with Candidate article data.
- Final CTA — V3 final component; DOM remains image first, copy second.
- Footer — V3 footer base with Candidate links/content.
- Floating support + back-to-top — V3 behavior and visual system, with Candidate wording/API.

## 4. Candidate-only component

Only `Featured Jobs` required a new major component. It uses the existing V3 variables, border, radius, shadow, typography hierarchy, red accent, spacing and hover motion. It does not introduce a separate visual system.

## 5. CSS fork integrity

`styles.css` starts with the complete original V3 stylesheet byte-for-byte. Candidate-specific CSS is appended as one contained block at the end for:

- 2-column Candidate Why layout adapter,
- partner lead text,
- Candidate-only Featured Jobs,
- 2-column Candidate News layout.

No replacement palette or Candidate theme layer was added.
