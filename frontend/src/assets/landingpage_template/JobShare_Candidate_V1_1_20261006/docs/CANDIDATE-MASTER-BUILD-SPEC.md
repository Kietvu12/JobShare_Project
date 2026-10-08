# JOBSHARE CANDIDATE — MASTER BUILD SPEC

> **V1.1 review override — 2026-10-06**
>
> The following later review decisions supersede conflicting lines in this frozen master spec:
> - restore `+481` as a compact V3-style “more jobs” card (not the oversized legacy red tile);
> - replace hero visual with `candidate-hero-2`;
> - production locale/active-role links use `/vi|en|ja/candidate`; standalone files may use static filenames for review only;
> - restore clean OG/Twitter metadata and JSON-LD `WebSite` + `Organization`;
> - improve VI/EN/JA rendered line breaks with phrase protection and strict JA rules.

### Base bắt buộc: `JobShare_Collaborator_V3_20261005`

### Content source: Candidate live + saved web VI / EN / JA

### Quality benchmark: Business 6.7

---

# 1) Nguyên tắc triển khai quan trọng nhất

**KHÔNG thiết kế Candidate từ đầu.**

Phải:

> **Clone/fork trực tiếp `JobShare_Collaborator_V3_20261005` làm base, giữ nguyên design system, layout language, typography, color system, spacing, animation và responsive behavior; chỉ thay content, section và visual đặc thù Candidate.**

Business 6.7 chỉ dùng làm:

- benchmark chất lượng
- kiểm tra polish
- tham khảo khi Candidate cần component mới mà Collaborator V3 chưa có

Business 6.7 **KHÔNG phải** palette/layout mới của Candidate.

Thứ tự ưu tiên nguồn:

1. **Collaborator V3**\
   → layout, CSS, font, màu, spacing, component, animation, responsive
2. **Candidate live + saved web**\
   → content, route, job data, News, Candidate-specific functionality
3. **Business 6.7**\
   → quality benchmark / component reference bổ sung

Nếu Collaborator V3 đã có component tương ứng thì **reuse/fork component đó**, không thiết kế component mới.

---

# 2) Mục tiêu dự án

Làm lại trang **Ứng viên JobShare**:

- giữ nội dung Candidate hiện tại
- bỏ hoàn toàn phong cách Candidate cũ
- nhìn phải nhận ra ngay là **cùng một hệ JobShare với Collaborator V3**
- đỏ JobShare là accent chính
- trắng / light sky / ink là nền chính
- visual có blue corporate atmosphere nhưng **không biến Candidate thành theme màu xanh**
- đủ:
  - VI
  - EN
  - JA

UX Candidate phải ưu tiên:

**Tìm việc → Hồ sơ/CV → Ứng tuyển → Theo dõi → Career Support**

Không mang logic:

- referral
- commission
- CTV

---

# 3) Tài liệu đầu vào bắt buộc

### Candidate source

- `https://ws-jobshare.com/vi/candidate`
- `https://ws-jobshare.com/en/candidate`
- `https://ws-jobshare.com/ja/candidate`
- `JobShare - UV.rar`

### Base UI

- `JobShare_Collaborator_V3_20261005`

### Quality benchmark

- `JobShare_Business_Home_V6_7...`

### Visual Candidate

Dùng bộ ảnh Candidate đã tạo:

- `candidate-hero.webp`
- `candidate-platform.webp`
- `candidate-career-support.webp`

Reuse:

- `ai-cv.webp` từ Collaborator V3\
  → đổi tên output Candidate thành `candidate-ai-cv.webp` nếu cần

### Partner

Dùng logo thật từ Candidate saved web / V3.

Không generate lại logo.

---

# 4) Không thay design system của Collaborator V3

Candidate phải **inherit trực tiếp CSS variables / typography / component rules của V3**.

Không dựng một bộ token mới.

Các màu chính giữ theo V3, ví dụ:

```
--red: #ED212F;
--red-deep: #BE1824;
--ink: #112F3D;
--sky: #F2F8FC;
--yellow: #FFDE59;
```

Các màu white / muted / line / soft dùng đúng giá trị thực tế trong V3.

## Quy tắc màu

### Đỏ JobShare

Dùng cho:

- kicker
- active role
- number
- icon accent
- checkmark
- CTA chính
- hover accent
- highlight

### Blue

Chỉ dùng cho:

- hình ảnh
- UI platform
- icon utility nếu component V3 cho phép
- light background / sky
- supporting atmosphere

**Không biến toàn trang thành blue theme.**

Không dùng:

- full blue Candidate theme
- blue kicker thay red
- blue number thay red
- blue icon system riêng
- palette mới vì “Candidate khác CTV”

---

# 5) Typography — clone V3, không mô tả lại từ đầu

Phải reuse nguyên typography CSS của Collaborator V3.

## VI

```
body:lang(vi) {
  font-family: "Segoe UI", Arial, "Helvetica Neue", sans-serif;
}
```

Giữ đúng size/weight/line-height đang dùng trong V3.

Hero VI phải theo V3, ví dụ tinh thần:

```
font-weight: 900;
line-height: 1.2;
letter-spacing: -0.035em;
```

## EN

Dùng đúng Barlow + fallback của V3.

## JA

Dùng đúng:

```
"Noto Sans JP",
"Yu Gothic",
"Hiragino Kaku Gothic ProN",
Meiryo,
Arial,
sans-serif
```

Không tự tạo font scale Candidate.

Không condensed.

Không giảm headline xuống 600/700 nếu V3 đang dùng 900.

---

# 6) Heading / line break

Không hard-code `<br>` chỉ để desktop trông đẹp.

Trước tiên phải sửa:

- width
- font size
- grid
- line-height

rồi để browser wrap tự nhiên.

## Display heading

VI:

- không dấu `.` cuối

EN:

- không dấu `.` cuối

JA:

- không dấu `。` cuối nếu không phải câu cần punctuation

Question:

- giữ `?`
- giữ `？`

---

# 7) Japanese typography

Reuse toàn bộ rule JA của V3.

Bắt buộc:

```
line-break: strict;
word-break: normal;
overflow-wrap: break-word;
```

Không dùng:

```
word-break: break-all;
```

Không để đầu dòng:

- 、
- 。
- ？
- ！
- ）
- 」
- 】

Không split:

- JobShare
- Workstation
- AI
- CV
- JLPT
- 3分

Typography processor chỉ xử lý visible BODY text.

Không chạm:

- `<title>`
- meta
- script
- style
- JSON
- structured data

Phải tránh lặp lại bug V3 từng có: chèn `<span>` vào `<title>`.

---

# 8) Role selector — fork nguyên component V3

Không redesign.

Giữ:

- container
- border
- radius
- 3-column system
- icon
- title
- subtitle
- responsive behavior

Chỉ đổi active role.

Candidate page:

**Ứng viên = active**

### VI

**Cộng tác viên**\
Giới thiệu ứng viên & nhận hoa hồng

**Ứng viên**\
Tìm việc tại Nhật Bản

**Doanh nghiệp**\
Đăng tuyển & tìm ứng viên

Intro:

**Chào mừng bạn đến với Workstation JobShare, bạn muốn tham gia với tư cách nào?**

EN / JA lấy đúng source.

Không tự dịch lại nếu saved web đã có.

Mobile:

- fork behavior V3
- nếu cần ẩn subtitle thì ẩn
- không ép chữ xuống 10–11 px

---

# 9) Header — fork nguyên V3

Giữ:

- logo placement
- header height
- padding
- nav spacing
- language switch
- login/register button system
- mobile menu behavior

Chỉ thay Candidate navigation / routes bằng source Candidate.

Không redesign header.

Không đổi logo.

---

# 10) Hero — fork nguyên Hero component V3

Đây là yêu cầu bắt buộc.

> **Duplicate Collaborator V3 hero component. Replace only Candidate content and Candidate image.**

Không thiết kế hero mới.

Không dùng full-blue layout như bản Candidate vừa làm.

## Giữ nguyên từ V3

- hero grid
- hero padding
- text/media ratio
- background treatment
- light gradient
- grid texture nếu có
- typography sizing
- CTA component
- media frame
- radius
- shadow
- offset border
- responsive order
- animation

---

## Candidate content

### VI

**NÂNG BƯỚC SỰ NGHIỆP**\
**VỮNG VÀNG TƯƠNG LAI**

Nền tảng tuyển dụng thông minh\
cho người nước ngoài tại Nhật

CTA:

**Tìm việc ngay**

**Tạo CV bằng AI**

EN / JA giữ source.

---

## Hero color treatment

Fork logic của CTV V3:

- line/headline chính màu ink
- line nhấn màu **JobShare red**
- không toàn bộ text trắng
- không full-blue hero background

Ví dụ:

`NÂNG BƯỚC SỰ NGHIỆP` → ink

`VỮNG VÀNG TƯƠNG LAI` → red

---

# 11) Hero visual

Dùng:

`candidate-hero.webp`

Ảnh hiện tại có thể giữ.

Không cần generate lại nếu chất lượng file ổn.

Nhưng phải đặt đúng vào **V3 hero-media component**.

Không dùng treatment kiểu poster riêng.

Không thêm:

- caption block `Candidate × JobShare`
- card branding thừa
- KPI
- salary
- 481 jobs
- match %
- badges marketing

Nếu caption hiện embedded vào file ảnh và gây thừa:

- edit/crop ảnh nếu cần

Mục tiêu:\
ảnh là **supporting visual**, không phải banner độc lập.

---

# 12) Section “Tìm việc kỹ sư”

Content Candidate giữ source.

### 01

Đa dạng Job Kỹ sư tại Nhật

### 02

Ứng dụng AI tạo CV

### 03

Định hướng & Gợi ý Job

Body lấy source.

## UI

Fork component card/grid gần nhất từ Collaborator V3.

Giữ:

- red number
- red/pale-red icon
- same radius
- same border
- same shadow
- same section spacing
- same reveal animation

Không tạo 3 blue cards riêng.

---

# 13) Why Choose JobShare — 4 cards

Giữ đủ **4 card**.

### VI

**01**\
Việc làm phù hợp năng lực, tập trung thị trường Nhật Bản

**02**\
Hỗ trợ chuẩn hóa CV và chuẩn bị phỏng vấn thực tế

**03**\
Theo dõi tiến trình minh bạch với chuyên viên đồng hành

**04**\
Kho job đa dạng, cập nhật liên tục từ doanh nghiệp Nhật

---

# 14) Why card 04 — correction đã duyệt

Không xóa card.

Chỉ sửa phần body bị nhiễm CTV.

## VI final

**Kho job đa dạng, cập nhật liên tục từ doanh nghiệp Nhật**

Nhiều vị trí kỹ sư thuộc các lĩnh vực IT, Cơ khí, Điện – Điện tử, Sản xuất, Xây dựng... được cập nhật thường xuyên từ các doanh nghiệp Nhật. Bạn có thể chủ động tìm kiếm và lựa chọn công việc phù hợp với kinh nghiệm, kỹ năng và định hướng nghề nghiệp của mình.

## EN card 04

**A diverse and continuously updated range of jobs from Japanese companies**

Engineering opportunities across IT, mechanical, electrical and electronics, manufacturing, construction and other fields are continuously updated from Japanese companies. You can actively search for and choose roles that match your experience, skills and career goals.

## JA card 04

**日本企業から随時更新される、多様な求人情報**

IT、機械、電気・電子、生産、建設など、さまざまなエンジニア求人を日本企業から継続的に更新しています。経験・スキル・キャリア志向に合った求人を自分で探し、選ぶことができます。

---

# 15) Why section UI

Fork card component từ V3.

Không tạo theme xanh.

Dùng:

- red numbering
- pale-red icon background
- same card radius
- same border
- same gap
- same text hierarchy

Nếu V3 có 4-card layout phù hợp:\
reuse trực tiếp.

---

# 16) AI CV — fork section V3

Đây gần như có thể copy nguyên component AI CV của Collaborator V3.

Thay content Candidate nếu source khác.

## VI

**Chỉ mất 3 phút để có CV chuẩn Nhật với công nghệ AI của Workstation JobShare**

CTA:

**Thử ngay - Miễn phí**

EN / JA lấy source.

## Image

Reuse:

`ai-cv.webp`

Output có thể đổi tên:

`candidate-ai-cv.webp`

Không redesign section.

Không tạo image frame mới.

---

# 17) Quy trình ứng tuyển — fork flow component V3

Giữ đúng Candidate source **3 bước**.

Không đổi thành 4 bước.

Dùng flow component / visual language của Collaborator V3:

- numbering
- line
- card structure
- responsive
- animation

Không tạo infographic riêng.

Không tạo ảnh riêng.

---

# 18) Candidate Platform — fork Platform component V3

Đây là điểm cực kỳ quan trọng.

Không thiết kế Platform section mới.

> **Fork nguyên platform section của Collaborator V3.**

Nếu V3 structure là:

```
platform intro
  copy
  media

features below
```

Candidate giữ đúng structure đó.

Chỉ thay:

- text
- Candidate image
- feature content

---

# 19) Candidate Platform content

Heading:

**4 tính năng miễn phí dành cho ứng viên**

Có đúng 4 feature:

### 01

Tìm việc làm kỹ sư tại Nhật nhanh chóng

### 02

Tạo và tối ưu hồ sơ ứng tuyển bằng AI

### 03

Theo dõi tiến trình ứng tuyển minh bạch

### 04

Nhận hỗ trợ nghề nghiệp từ JobShare

Body/bullet giữ Candidate source.

---

# 20) Candidate Platform visual

Dùng:

`candidate-platform.webp`

Giữ image.

Không cần tạo lại.

Đặt trong **media-frame component của V3**.

Không để ảnh lơ lửng riêng với layout mới.

Platform UI trong ảnh có thể xanh vì đó là product UI.

Nhưng surrounding HTML phải giữ theme V3:

- kicker red
- number red
- icon red
- check red
- CTA red

Không blue theme toàn section.

---

# 21) Đối tác tiêu biểu

Dùng logo thật từ source.

Có đủ bộ logo rồi.

Không generate.

Không viết tên thay logo.

Fork partner component V3:

- grid
- optical size
- padding
- grayscale/color treatment nếu có
- responsive

Không tạo partner style mới.

---

# 22) Featured Jobs — Candidate-only component

Đây là component lớn Candidate có mà CTV không có.

Vì V3 không có component tương đương hoàn toàn nên:

- được phép tạo component mới
- nhưng phải dùng **token V3**

Bắt buộc reuse:

- font
- red
- ink
- line
- radius
- shadow
- spacing
- button / arrow styling
- hover motion

Không tạo editorial style hoàn toàn mới.

---

# 23) Featured Jobs content

Heading:

### VI

**Việc làm nổi bật hôm nay**

### EN

**Today's featured jobs**

### JA

**本日の注目求人**

Data phải tách khỏi HTML.

Production ưu tiên:

- live/API

Preview:

- có thể dùng snapshot source

---

# 24) Developer note tuyệt đối không được xuất hiện public

Không được hiển thị câu:

> “Danh sách dưới đây là snapshot dữ liệu từ bản Candidate được cung cấp; phần dữ liệu được tách riêng để có thể thay bằng live/API.”

Hoặc bất cứ text nào tương tự:

- snapshot
- demo data
- API replace
- preview
- developer note
- internal QA

Những nội dung này chỉ nằm trong:

- README
- comments
- docs
- data source notes

**Không có trong public HTML.**

---

# 25) `+481` không được dùng như một job card

`481` là snapshot/dynamic data.

Không tạo một ô đỏ lớn ngang kích thước job card.

Nếu API trả live total:\
có thể hiển thị nhẹ như:

`481+ việc làm`

gần CTA / heading.

Nếu không có data live:

- bỏ metric khỏi production

Không biến snapshot thành visual claim nổi bật.

---

# 26) Salary / unit

Không tự normalize mọi salary thành:

`vạn Yên`

nếu source có:

- monthly
- annual
- different ranges

Phải giữ đúng:

- amount
- unit
- period

Ví dụ:

- `/tháng`
- `/năm`

nếu source có.

Không làm user hiểu nhầm salary tháng thành salary năm.

---

# 27) Job card design

Phải dùng V3 visual language:

- white
- light border
- moderate radius
- compact hierarchy
- red accent
- ink title
- muted metadata
- subtle hover
- same button language as V3

Không:

- card quá cao
- quá nhiều whitespace
- arrow circle khổng lồ
- border cứng
- new editorial system

---

# 28) News

Candidate dùng Candidate News.

Không copy CTV News set nếu source Candidate khác.

## VI correction đã duyệt

Sai:

> Cập nhật nhanh thông tin, mẹo làm CTV và xu hướng việc làm Nhật Bản.

Sửa trực tiếp thành:

> **Cập nhật nhanh thông tin, mẹo tìm việc và xu hướng việc làm Nhật Bản.**

EN / JA giữ source Candidate.

---

# 29) News component

Nếu Collaborator V3 đã có News component:\
**fork nguyên component V3**.

Chỉ thay:

- Candidate article list
- image
- category
- localized date
- title
- excerpt
- link

Không redesign News.

---

# 30) Không thêm FAQ

Candidate source không có FAQ.

Không clone FAQ chỉ vì CTV có.

Candidate page kết thúc:

News\
→ Final CTA\
→ Footer

---

# 31) Final CTA — clone nguyên V3

Đây là rule bắt buộc.

> **Duplicate Collaborator V3 Final CTA component exactly.**

Giữ:

- layout
- grid ratio
- border
- background
- radius
- spacing
- typography
- buttons
- responsive behavior
- animation

---

# 32) Final CTA layout

V3:

**IMAGE LEFT | TEXT RIGHT**

Candidate cũng phải:

**IMAGE LEFT | TEXT RIGHT**

Không đảo lại.

Không tạo layout:

**TEXT LEFT | IMAGE RIGHT**

---

# 33) Final CTA content

### VI

**Sẵn sàng bắt đầu chưa?**

Đăng ký ngay hôm nay để tạo hồ sơ ứng viên JobShare và khám phá hàng trăm cơ hội việc làm tại Nhật Bản. Hoàn toàn miễn phí!

Buttons:

**Tạo hồ sơ ngay**

**Liên hệ tư vấn**

EN / JA giữ source Candidate.

---

# 34) Final CTA visual

Dùng:

`candidate-career-support.webp`

Giữ ảnh.

Đặt vào:

`.final-media`

của V3.

Không cần tạo lại.

Không thêm:

- process
- CTV
- referral
- commission
- fake KPI

---

# 35) Final CTA spacing

Dùng **exact spacing của V3**.

Không tạo một khoảng trắng cực lớn giữa final box và footer.

Không tăng section min-height.

Không thêm empty spacer.

---

# 36) Floating Candidate Support — fork V3

Fork nguyên floating support của Collaborator V3:

- yellow
- fixed position
- shadow
- interaction
- responsive
- modal/chat behavior nếu có

Chỉ đổi Candidate wording.

### VI

**Hỗ trợ ứng viên**

### EN

**Candidate support**

### JA

**求職者サポート**

Không dùng:\
**Hỗ trợ CTV**

---

# 37) Back to top

Fork nguyên V3.

Không thay:

- size
- position
- style

Chỉ đảm bảo không đè Candidate support.

---

# 38) Footer

Fork Footer V3 làm base.

Chỉ đổi:

- Candidate routes
- Candidate text/link nếu source khác

Không redesign footer.

---

# 39) Section spacing

Không tự chọn spacing Candidate.

Reuse V3.

Ví dụ nếu V3 dùng:

```
.section {
  padding: 96px 0;
}
```

thì Candidate dùng cùng logic.

Mobile nếu V3:

```
.section {
  padding: 64px 0;
}
```

thì reuse.

Không dùng extra whitespace để “premium hóa”.

---

# 40) Container / grid

Reuse:

- max-width
- gutters
- breakpoints
- column gaps

từ V3.

Không tự tăng Candidate container lên rộng hơn.

Không tự tạo một grid khác.

---

# 41) Animation

Fork V3 animation.

Không tạo Candidate animation system riêng.

Reuse:

- reveal
- fade-up
- stagger
- image reveal
- hover
- button feedback

Respect:\
`prefers-reduced-motion`

Không:

- neon
- continuous pulse
- bounce
- parallax nặng

---

# 42) Responsive behavior

Candidate phải reuse breakpoints của V3.

Không tạo breakpoint system mới.

QA:

- 1440
- 1366
- 1280
- 1024
- 768
- 430
- 390
- 360

Cả:

- VI
- EN
- JA

---

# 43) Mobile priority

Mobile Candidate:

1. Role selector
2. Header
3. Hero headline
4. Tìm việc ngay
5. Tạo CV bằng AI
6. Hero image
7. Candidate benefits
8. Jobs

Không cho hero image chiếm viewport trước CTA.

---

# 44) Line-break QA cả 3 ngôn ngữ

Không chỉ chạy overflow script.

Phải **render và đọc thực tế**.

## VI

check:

- headline không rơi 1–2 từ vô duyên
- không ép break xấu
- dấu đầy đủ

## EN

check:

- cụm danh từ không bị break khó đọc
- button không wrap

## JA

check:

- 禁則処理
- punctuation
- particle orphan
- Latin tokens

Không fix bằng hàng loạt `<br>`.

---

# 45) SEO

Candidate source title:

### VI

`Tìm việc kỹ sư tại Nhật Bản | Workstation JobShare - Tạo CV bằng AI`

### EN

`Engineering Jobs in Japan | Workstation JobShare - AI-Powered CV Builder`

### JA

`日本のエンジニア求人 | Workstation JobShare - AIで履歴書作成`

Chỉ 1 `<title>` / page.

Canonical:

- `/vi/candidate`
- `/en/candidate`
- `/ja/candidate`

Hreflang:\
Candidate routes tương ứng.

Không trỏ root locale.

---

# 46) Nội dung đã được duyệt sửa

## Correction 01 — Why card 04

**GIỮ card số 4.**

Sửa CTV copy sang Candidate meaning.

Không xóa card.

Bổ sung tương ứng EN / JA.

## Correction 02 — News VI

Sửa:

`mẹo làm CTV`

thành:

`mẹo tìm việc`

Đây là final Candidate copy.

---

# 47) Những visual hiện tại được giữ

Không cần tạo lại từ đầu:

### `candidate-hero.webp`

Giữ, chỉ sửa placement/treatment nếu cần.

### `candidate-platform.webp`

Giữ.

### `candidate-career-support.webp`

Giữ.

### `candidate-ai-cv.webp`

Reuse `ai-cv.webp` từ V3.

Vấn đề của bản trước chủ yếu là **layout/CSS**, không phải chất lượng ảnh.

---

# 48) Page order final

## 00 — Role Selector

Fork V3

## 01 — Header

Fork V3

## 02 — Hero

Fork V3 Hero\
→ `candidate-hero.webp`

## 03 — Job Discovery / Tìm việc kỹ sư

Reuse V3 cards

## 04 — Why Choose JobShare

4 cards

## 05 — AI CV

Fork V3 AI section\
→ `candidate-ai-cv.webp`

## 06 — Application Process

Fork V3 flow

## 07 — 4 Candidate Features

Fork V3 platform\
→ `candidate-platform.webp`

## 08 — Featured Partners

Fork V3 partner grid

## 09 — Featured Jobs

Candidate-specific component\
→ nhưng dùng V3 tokens

## 10 — News

Fork V3 News\
→ Candidate data

## 11 — Final CTA

Fork V3 exact layout\
→ `candidate-career-support.webp`

## 12 — Footer

Fork V3

## 13 — Floating Candidate Support

Fork V3 yellow support

---

# 49) Không làm những điều sau

Không:

- thiết kế Candidate từ trắng
- tạo Candidate palette riêng
- dùng full blue theme
- copy trực tiếp palette Business 6.7 thay V3
- đảo Final CTA
- redesign Hero
- redesign Platform
- redesign role selector
- redesign Header/Footer
- tự tạo font scale
- tự tạo spacing scale
- thêm developer note lên UI
- dùng +481 làm card lớn
- invent KPI
- invent salary
- invent job count
- invent match %
- tạo FAQ không có source

---

# 50) Quy trình build bắt buộc

## Bước 1

Giải nén và chạy **Collaborator V3**.

Đọc:

- HTML structure
- CSS
- JS
- multilingual logic
- responsive
- assets
- animation

## Bước 2

Xác định component nào Candidate có thể fork trực tiếp:

- role
- header
- hero
- card grid
- AI
- flow
- platform
- partners
- News
- final
- footer
- support

## Bước 3

Đọc Candidate source/live.

Map Candidate content vào component V3.

## Bước 4

Chỉ thiết kế mới phần **Featured Jobs**, vì đây là Candidate-specific.

Ngay cả Featured Jobs vẫn phải dùng V3 tokens.

## Bước 5

Render VI desktop trước.

So sánh trực tiếp side-by-side với Collaborator V3.

Nếu nhìn ra hai design systems khác nhau:\
**chưa đạt.**

## Bước 6

Map EN / JA.

## Bước 7

QA:

- typography
- line breaks
- mobile
- interactions
- links
- data
- News
- SEO

---

# 51) Definition of Done

Candidate chỉ được coi là đạt khi:

### Nhìn tổng thể

Ngay lập tức nhận ra:

> **đây là sibling page của Collaborator V3**

chứ không phải website khác.

### Màu

- JobShare red là accent chính
- không blue theme

### Typography

- giống V3
- VI không lỗi
- JA không break xấu

### Hero

- cùng component V3
- Candidate image/content riêng

### Platform

- cùng component V3
- Candidate content/image riêng

### Final CTA

- **image left / text right**
- cùng component V3

### Jobs

- không developer note
- không +481 tile
- không fake data

### Content

- Why 4 cards
- News VI = `mẹo tìm việc`

### Responsive

- cùng behavior V3

### Code

- fork V3 sạch
- không append hàng loạt CSS override để vá
- component reuse thực sự, không chỉ nhìn “na ná”