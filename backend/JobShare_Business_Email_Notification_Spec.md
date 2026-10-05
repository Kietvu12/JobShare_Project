# JobShare Business — Email Notification Spec (JP / EN)

> Nguồn: `JobShare_Business_Email_Notification_Spec_JP_EN (1).xlsx`
> Xuất tự động — mỗi action/template một mục bên dưới.

# Phần: Email Templates

## Mục lục

- [01. BROCHURE_DOWNLOADED](#01-brochure-downloaded) — Người dùng tải tài liệu giới thiệu JobShare Business
- [02. CONTACT_RECEIVED](#02-contact-received) — Người dùng gửi form Contact
- [03. COMPANY_REGISTERED](#03-company-registered) — Đăng ký tài khoản doanh nghiệp thành công
- [04. NEW_PARTNER_REFERRAL](#04-new-partner-referral) — CTV/Recruitment Partner tiến cử hồ sơ mới qua Sàn CTV
- [05. DIRECT_SCOUT_UNLOCKED](#05-direct-scout-unlocked) — Doanh nghiệp dùng Credit để mở hồ sơ ứng viên
- [06. MANAGED_SCOUT_REQUESTED](#06-managed-scout-requested) — Doanh nghiệp gửi yêu cầu Scout Ủy Thác tới Workstation
- [07. FREE_LP_CREATED](#07-free-lp-created) — Tạo Landing Page miễn phí thành công
- [08. CREDIT_TOPUP_REQUESTED](#08-credit-topup-requested) — Gửi yêu cầu nạp Credit tới Workstation
- [09. CREDIT_ADDED](#09-credit-added) — Workstation duyệt và cộng Credit
- [10. CANDIDATE_STATUS_CHANGED](#10-candidate-status-changed) — Trạng thái hồ sơ/ứng viên thay đổi
- [11. REFERRAL_MESSAGE_NEW](#11-referral-message-new) — Có tin nhắn mới trong một đơn tiến cử
- [12. SERVICE_REQUEST_CREATED](#12-service-request-created) — Gửi yêu cầu dịch vụ thành công
- [13. WORKSTATION_MESSAGE_NEW](#13-workstation-message-new) — Có tin nhắn mới từ Admin/CA Workstation
- [14. PARTNER_JOB_PUBLISHED](#14-partner-job-published) — JD trên Sàn CTV được duyệt và bắt đầu chạy
- [15. PARTNER_JOB_REVISION_REQUIRED](#15-partner-job-revision-required) — JD trên Sàn CTV cần sửa trước khi duyệt
- [16A. MANAGED_SCOUT_HEARING_ACCEPTED](#16A-managed-scout-hearing-accepted) — WS hearing xong và ứng viên đồng ý ứng tuyển
- [16B. MANAGED_SCOUT_HEARING_DECLINED](#16B-managed-scout-hearing-declined) — WS hearing xong và ứng viên từ chối ứng tuyển
- [17. SERVICE_REQUEST_STATUS_CHANGED](#17-service-request-status-changed) — Trạng thái yêu cầu dịch vụ thay đổi
- [18. LANDING_PAGE_PUBLISHED](#18-landing-page-published) — Landing Page được publish ra URL công khai
- [19. PAYMENT_REQUEST_CREATED](#19-payment-request-created) — WS tạo yêu cầu thanh toán mới
- [20. PAYMENT_CONFIRMED](#20-payment-confirmed) — WS xác nhận đã nhận thanh toán
- [21. INVOICE_ISSUED](#21-invoice-issued) — Hóa đơn được phát hành
- [22. PARTNER_JOB_EXPIRING](#22-partner-job-expiring) — JD đang chạy trên Sàn CTV sắp hết hạn
- [23. EMAIL_VERIFICATION](#23-email-verification) — Xác thực email tài khoản
- [24. PASSWORD_RESET](#24-password-reset) — Yêu cầu reset mật khẩu

# Chi tiết từng action (Email Templates)

## 01. BROCHURE_DOWNLOADED

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `BROCHURE_DOWNLOADED` |
| **Trigger / Tính năng** | Người dùng tải tài liệu giới thiệu JobShare Business |
| **Priority** | P1 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】サービス資料をダウンロードいただきありがとうございます

EN:
【JobShare Business】Thank you for downloading our service brochure
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

この度は、JobShare Businessのサービス資料をダウンロードいただき、ありがとうございます。

JobShare Businessでは、ダイレクトスカウト、スカウト委託、採用パートナーネットワーク、採用ブランディングなど、企業の採用課題に合わせた複数の採用手法をご利用いただけます。

ご不明点やご相談がございましたら、お気軽にお問い合わせください。

EN:
Dear {{user_name}},
{{company_name}}

Thank you for downloading the JobShare Business service brochure.

JobShare Business offers multiple recruitment solutions tailored to your hiring needs, including Direct Scout, Managed Scout, our Recruitment Partner Network, and Employer Branding services.

If you have any questions or would like to discuss your recruitment needs, please feel free to contact us.
```

### CTA (JP → EN)

```text
JP:
JobShare Businessを見る

EN:
Explore JobShare Business
```

### CTA link / Suggested route

Public JobShare Business introduction page. Suggested: /{lang}/business

### Biến bắt buộc

`company_name, user_name, lang`

### Ghi chú triển khai

CTA có thể bỏ nếu muốn mail cảm ơn thuần túy.

---

## 02. CONTACT_RECEIVED

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `CONTACT_RECEIVED` |
| **Trigger / Tính năng** | Người dùng gửi form Contact |
| **Priority** | P0 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】お問い合わせを受け付けました

EN:
【JobShare Business】We have received your inquiry
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

JobShare Businessへお問い合わせいただき、ありがとうございます。

以下の内容でお問い合わせを受け付けました。

会社名：{{company_name}}
メールアドレス：{{email}}
業種：{{industry}}

お問い合わせ内容：
{{inquiry_content}}

内容を確認のうえ、WorkstationのJobShare Business担当者より順次ご連絡いたします。
今しばらくお待ちください。

EN:
Dear {{user_name}},
{{company_name}}

Thank you for contacting JobShare Business.

We have received your inquiry with the following information:

Company: {{company_name}}
Email: {{email}}
Industry: {{industry}}

Inquiry:
{{inquiry_content}}

A JobShare Business representative from Workstation will review your inquiry and contact you shortly.
Thank you for your patience.
```

### CTA link / Suggested route

Không bắt buộc CTA. Optional: /{lang}/business

### Biến bắt buộc

`company_name, user_name, email, industry, inquiry_content`

### Ghi chú triển khai

Mail xác nhận tiếp nhận; không cần đăng nhập.

---

## 03. COMPANY_REGISTERED

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `COMPANY_REGISTERED` |
| **Trigger / Tính năng** | Đăng ký tài khoản doanh nghiệp thành công |
| **Priority** | P0 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】企業アカウントの登録が完了しました

EN:
【JobShare Business】Your company account has been successfully created
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

JobShare Businessへの企業登録が完了しました。

以下よりログインして、求人作成や候補者検索などの機能をご利用いただけます。

今後ともJobShare Businessをよろしくお願いいたします。

EN:
Dear {{user_name}},
{{company_name}}

Your JobShare Business company account has been successfully registered.

You can now log in to create job postings, search for candidates, and use other JobShare Business features.

Thank you for using JobShare Business.
```

### CTA (JP → EN)

```text
JP:
JobShare Businessにログイン

EN:
Log in to JobShare Business
```

### CTA link / Suggested route

/business/login?returnUrl=/business

### Biến bắt buộc

`company_name, user_name`

### Ghi chú triển khai

Nếu bật email verification thì phối hợp với template 23.

---

## 04. NEW_PARTNER_REFERRAL

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `NEW_PARTNER_REFERRAL` |
| **Trigger / Tính năng** | CTV/Recruitment Partner tiến cử hồ sơ mới qua Sàn CTV |
| **Priority** | P0 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】新しい候補者が推薦されました

EN:
【JobShare Business】A new candidate has been referred
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

採用パートナーネットワーク経由で、新しい候補者が推薦されました。

求人：{{job_title}}
候補者：{{candidate_name}}
推薦者：{{partner_name}}
推薦番号：{{referral_id}}

候補者のプロフィール・CVをご確認のうえ、選考可否をご対応ください。

EN:
Dear {{user_name}},
{{company_name}}

A new candidate has been referred through the JobShare Recruitment Partner Network.

Job: {{job_title}}
Candidate: {{candidate_name}}
Referred by: {{partner_name}}
Referral ID: {{referral_id}}

Please review the candidate profile and CV and proceed with the appropriate screening action.
```

### CTA (JP → EN)

```text
JP:
推薦内容を確認する

EN:
View referral details
```

### CTA link / Suggested route

Quản lý ứng viên - application detail. Suggested: /business/applications/{{application_id}}

### Biến bắt buộc

`company_name, user_name, job_title, candidate_name, partner_name, referral_id, application_id`

### Ghi chú triển khai

Không đưa SĐT/email ứng viên trực tiếp trong mail.

---

## 05. DIRECT_SCOUT_UNLOCKED

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `DIRECT_SCOUT_UNLOCKED` |
| **Trigger / Tính năng** | Doanh nghiệp dùng Credit để mở hồ sơ ứng viên |
| **Priority** | P1 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】候補者情報を開示しました

EN:
【JobShare Business】Candidate information has been unlocked
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

ダイレクトスカウトで以下の候補者情報を開示しました。

候補者：{{candidate_name}}
使用Credit：{{used_credit}} Credit
現在のCredit残高：{{remaining_credit}} Credit

候補者のCVおよび連絡先はJobShare Business上でご確認いただけます。

EN:
Dear {{user_name}},
{{company_name}}

You have unlocked the following candidate through Direct Scout.

Candidate: {{candidate_name}}
Credits used: {{used_credit}}
Remaining balance: {{remaining_credit}} Credits

The candidate's CV and contact information are now available in JobShare Business.
```

### CTA (JP → EN)

```text
JP:
候補者の詳細を見る

EN:
View candidate details
```

### CTA link / Suggested route

/business/candidates/{{candidate_id}}

### Biến bắt buộc

`company_name, user_name, candidate_name, used_credit, remaining_credit, candidate_id`

### Ghi chú triển khai

Mail xác nhận action đã trừ Credit.

---

## 06. MANAGED_SCOUT_REQUESTED

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `MANAGED_SCOUT_REQUESTED` |
| **Trigger / Tính năng** | Doanh nghiệp gửi yêu cầu Scout Ủy Thác tới Workstation |
| **Priority** | P0 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】スカウト委託のご依頼を受け付けました

EN:
【JobShare Business】Your Managed Scout request has been received
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

以下の候補者について、Workstationへのスカウト委託依頼を受け付けました。

候補者：{{candidate_name}}
依頼番号：{{request_id}}

担当者が内容を確認し、候補者へのアプローチおよび今後のお手続きをご案内いたします。

進捗状況はJobShare Businessからご確認いただけます。

EN:
Dear {{user_name}},
{{company_name}}

We have received your Managed Scout request for the following candidate.

Candidate: {{candidate_name}}
Request ID: {{request_id}}

Our team will review the request and proceed with candidate outreach and the next required steps.

You can track the request status in JobShare Business.
```

### CTA (JP → EN)

```text
JP:
依頼状況を確認する

EN:
View request status
```

### CTA link / Suggested route

Managed Scout request/candidate detail. Suggested: /business/scout/managed/requests/{{request_id}}

### Biến bắt buộc

`company_name, user_name, candidate_name, request_id`

### Ghi chú triển khai

Deep link về đúng request/candidate.

---

## 07. FREE_LP_CREATED

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `FREE_LP_CREATED` |
| **Trigger / Tính năng** | Tạo Landing Page miễn phí thành công |
| **Priority** | P1 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】採用ランディングページを作成しました

EN:
【JobShare Business】Your recruitment landing page has been created
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

JobShare Businessで採用ランディングページが作成されました。

ページ名：{{landing_page_name}}

公開前に、文章・画像・求人情報などの内容をご確認ください。

EN:
Dear {{user_name}},
{{company_name}}

Your recruitment landing page has been successfully created in JobShare Business.

Page name: {{landing_page_name}}

Please review the text, images, and job information before publishing the page.
```

### CTA (JP → EN)

```text
JP:
ランディングページを確認・編集する

EN:
Review and edit landing page
```

### CTA link / Suggested route

/business/saiyo/landing-pages/{{landing_page_id}}/edit

### Biến bắt buộc

`company_name, user_name, landing_page_name, landing_page_id`

### Ghi chú triển khai

Create/save thành công, chưa phải publish.

---

## 08. CREDIT_TOPUP_REQUESTED

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `CREDIT_TOPUP_REQUESTED` |
| **Trigger / Tính năng** | Gửi yêu cầu nạp Credit tới Workstation |
| **Priority** | P0 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】Credit追加申請を受け付けました

EN:
【JobShare Business】Your Credit top-up request has been received
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

以下の内容でCredit追加申請を受け付けました。

申請Credit：{{credit_amount}} Credit
申請日時：{{requested_at}}
ステータス：確認中

Workstationにて内容を確認後、Creditを付与いたします。
反映まで今しばらくお待ちください。

EN:
Dear {{user_name}},
{{company_name}}

We have received your Credit top-up request.

Requested Credits: {{credit_amount}}
Requested at: {{requested_at}}
Status: Under review

Workstation will review your request and add the Credits once approved.
Thank you for your patience.
```

### CTA (JP → EN)

```text
JP:
申請状況を確認する

EN:
View request status
```

### CTA link / Suggested route

/business/service-requests/{{request_id}}

### Biến bắt buộc

`company_name, user_name, credit_amount, requested_at, request_id`

### Ghi chú triển khai

Credit chưa được cộng tại thời điểm này.

---

## 09. CREDIT_ADDED

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `CREDIT_ADDED` |
| **Trigger / Tính năng** | Workstation duyệt và cộng Credit |
| **Priority** | P0 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】Creditが追加されました

EN:
【JobShare Business】Credits have been added to your account
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

Creditの追加が完了しました。

追加Credit：{{credit_amount}} Credit
現在の残高：{{current_balance}} Credit

Creditはダイレクトスカウトで候補者情報を開示する際にご利用いただけます。

EN:
Dear {{user_name}},
{{company_name}}

Your Credit top-up has been completed.

Credits added: {{credit_amount}}
Current balance: {{current_balance}} Credits

You can use Credits to unlock candidate information through Direct Scout.
```

### CTA (JP → EN)

```text
JP:
候補者を探す

EN:
Search candidates
```

### CTA link / Suggested route

/business/scout/direct

### Biến bắt buộc

`company_name, user_name, credit_amount, current_balance`

### Ghi chú triển khai

CTA dẫn thẳng Scout Trực Tiếp.

---

## 10. CANDIDATE_STATUS_CHANGED

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `CANDIDATE_STATUS_CHANGED` |
| **Trigger / Tính năng** | Trạng thái hồ sơ/ứng viên thay đổi |
| **Priority** | P0 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】候補者の選考ステータスが更新されました

EN:
【JobShare Business】Candidate status has been updated
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

以下の候補者について、選考ステータスが更新されました。

候補者：{{candidate_name}}
求人：{{job_title}}
候補者ソース：{{candidate_source}}

{{old_status}} → {{new_status}}

詳細はJobShare Businessからご確認ください。

EN:
Dear {{user_name}},
{{company_name}}

The screening status of the following candidate has been updated.

Candidate: {{candidate_name}}
Job: {{job_title}}
Candidate source: {{candidate_source}}

{{old_status}} → {{new_status}}

Please log in to JobShare Business for details.
```

### CTA (JP → EN)

```text
JP:
候補者の詳細を見る

EN:
View candidate details
```

### CTA link / Suggested route

/business/applications/{{application_id}}

### Biến bắt buộc

`company_name, user_name, candidate_name, job_title, candidate_source, old_status, new_status, application_id`

### Ghi chú triển khai

Dùng chung cho 3 nguồn sau khi vào pipeline.

---

## 11. REFERRAL_MESSAGE_NEW

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `REFERRAL_MESSAGE_NEW` |
| **Trigger / Tính năng** | Có tin nhắn mới trong một đơn tiến cử |
| **Priority** | P0 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】推薦案件 {{referral_id}} に新しいメッセージがあります

EN:
【JobShare Business】New message regarding referral {{referral_id}}
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

推薦案件について、新しいメッセージが届きました。

推薦番号：{{referral_id}}
求人：{{job_title}}
候補者：{{candidate_name}}
送信者：{{sender_name}}

メッセージ：
{{message_preview}}

EN:
Dear {{user_name}},
{{company_name}}

You have received a new message regarding a candidate referral.

Referral ID: {{referral_id}}
Job: {{job_title}}
Candidate: {{candidate_name}}
Sender: {{sender_name}}

Message:
{{message_preview}}
```

### CTA (JP → EN)

```text
JP:
メッセージを確認する

EN:
View message
```

### CTA link / Suggested route

/business/messages?referral_id={{referral_id}}

### Biến bắt buộc

`company_name, user_name, referral_id, job_title, candidate_name, sender_name, message_preview`

### Ghi chú triển khai

Preview ~120 ký tự; không đưa attachment vào mail.

---

## 12. SERVICE_REQUEST_CREATED

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `SERVICE_REQUEST_CREATED` |
| **Trigger / Tính năng** | Gửi yêu cầu dịch vụ thành công |
| **Priority** | P0 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】サービスリクエストを受け付けました

EN:
【JobShare Business】Your service request has been received
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

以下の内容でサービスリクエストを受け付けました。

サービス：{{service_name}}
リクエスト番号：{{request_id}}
申請日時：{{requested_at}}

ご依頼内容：
{{request_content}}

Workstation担当者が内容を確認し、順次ご連絡いたします。

EN:
Dear {{user_name}},
{{company_name}}

We have received your service request.

Service: {{service_name}}
Request ID: {{request_id}}
Submitted at: {{requested_at}}

Request details:
{{request_content}}

A Workstation representative will review your request and contact you shortly.
```

### CTA (JP → EN)

```text
JP:
リクエスト状況を確認する

EN:
View request status
```

### CTA link / Suggested route

/business/service-requests/{{request_id}}

### Biến bắt buộc

`company_name, user_name, service_name, request_id, requested_at, request_content`

### Ghi chú triển khai

Một template dùng chung cho LP premium / ads / event / profile / dịch vụ khác.

---

## 13. WORKSTATION_MESSAGE_NEW

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `WORKSTATION_MESSAGE_NEW` |
| **Trigger / Tính năng** | Có tin nhắn mới từ Admin/CA Workstation |
| **Priority** | P0 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】Workstationから新しいメッセージがあります

EN:
【JobShare Business】You have a new message from Workstation
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

Workstation担当者から新しいメッセージが届きました。

担当者：{{sender_name}}

メッセージ：
{{message_preview}}

JobShare Businessへログインして、内容をご確認ください。

EN:
Dear {{user_name}},
{{company_name}}

You have received a new message from a Workstation representative.

Representative: {{sender_name}}

Message:
{{message_preview}}

Please log in to JobShare Business to view the full message.
```

### CTA (JP → EN)

```text
JP:
メッセージを確認する

EN:
View message
```

### CTA link / Suggested route

/business/messages?conversation_id={{conversation_id}}

### Biến bắt buộc

`company_name, user_name, sender_name, message_preview, conversation_id`

### Ghi chú triển khai

Có thể dùng chung backend NEW_MESSAGE với template 11.

---

## 14. PARTNER_JOB_PUBLISHED

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `PARTNER_JOB_PUBLISHED` |
| **Trigger / Tính năng** | JD trên Sàn CTV được duyệt và bắt đầu chạy |
| **Priority** | P0 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】求人の掲載を開始しました

EN:
【JobShare Business】Your job posting is now live
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

求人の確認が完了し、採用パートナーネットワークへの掲載を開始しました。

求人：{{job_title}}
掲載ステータス：掲載中
紹介料：{{referral_fee}}

EN:
Dear {{user_name}},
{{company_name}}

Your job posting has been approved and is now live on the JobShare Recruitment Partner Network.

Job: {{job_title}}
Status: Active
Referral fee: {{referral_fee}}
```

### CTA (JP → EN)

```text
JP:
掲載状況を確認する

EN:
View posting status
```

### CTA link / Suggested route

/business/candidate-sharing/jobs/{{job_id}}

### Biến bắt buộc

`company_name, user_name, job_title, referral_fee, job_id`

### Ghi chú triển khai

Gửi sau khi status chuyển Active.

---

## 15. PARTNER_JOB_REVISION_REQUIRED

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `PARTNER_JOB_REVISION_REQUIRED` |
| **Trigger / Tính năng** | JD trên Sàn CTV cần sửa trước khi duyệt |
| **Priority** | P1 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】求人内容のご確認をお願いします

EN:
【JobShare Business】Please review your job posting
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

求人内容について、確認・修正が必要な項目があります。

求人：{{job_title}}

確認事項：
{{review_comment}}

内容をご確認のうえ、修正をお願いいたします。

EN:
Dear {{user_name}},
{{company_name}}

Your job posting requires some additional review or updates.

Job: {{job_title}}

Review comments:
{{review_comment}}

Please review the comments and update the job posting accordingly.
```

### CTA (JP → EN)

```text
JP:
求人を修正する

EN:
Edit job posting
```

### CTA link / Suggested route

/business/candidate-sharing/jobs/{{job_id}}/edit

### Biến bắt buộc

`company_name, user_name, job_title, review_comment, job_id`

### Ghi chú triển khai

Không dùng wording rejected nếu chỉ yêu cầu sửa.

---

## 16A. MANAGED_SCOUT_HEARING_ACCEPTED

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `MANAGED_SCOUT_HEARING_ACCEPTED` |
| **Trigger / Tính năng** | WS hearing xong và ứng viên đồng ý ứng tuyển |
| **Priority** | P0 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】候補者が応募を希望しています

EN:
【JobShare Business】The candidate would like to apply
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

候補者へのヒアリングが完了し、応募希望を確認しました。

候補者：{{candidate_name}}
求人：{{job_title}}

Workstationにて応募書類を確認・更新後、正式に推薦いたします。

EN:
Dear {{user_name}},
{{company_name}}

We have completed the candidate hearing and confirmed that the candidate would like to proceed with the application.

Candidate: {{candidate_name}}
Job: {{job_title}}

Workstation will review and update the application documents before formally referring the candidate.
```

### CTA (JP → EN)

```text
JP:
候補者の状況を確認する

EN:
View candidate status
```

### CTA link / Suggested route

/business/scout/managed/requests/{{request_id}}

### Biến bắt buộc

`company_name, user_name, candidate_name, job_title, request_id`

### Ghi chú triển khai

Trạng thái trước tiến cử chính thức.

---

## 16B. MANAGED_SCOUT_HEARING_DECLINED

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `MANAGED_SCOUT_HEARING_DECLINED` |
| **Trigger / Tính năng** | WS hearing xong và ứng viên từ chối ứng tuyển |
| **Priority** | P0 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】候補者へのヒアリング結果のお知らせ

EN:
【JobShare Business】Candidate hearing result
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

候補者へのヒアリングが完了しましたが、今回は応募を希望されませんでした。

候補者：{{candidate_name}}

必要に応じて、類似候補者の検索をWorkstationへご依頼いただけます。

EN:
Dear {{user_name}},
{{company_name}}

We have completed the candidate hearing; however, the candidate has decided not to proceed with the application at this time.

Candidate: {{candidate_name}}

If needed, you can ask Workstation to search for similar candidates.
```

### CTA (JP → EN)

```text
JP:
詳細を確認する

EN:
View details
```

### CTA link / Suggested route

/business/scout/managed/requests/{{request_id}}

### Biến bắt buộc

`company_name, user_name, candidate_name, request_id`

### Ghi chú triển khai

Web có thể gợi ý tìm ứng viên tương tự.

---

## 17. SERVICE_REQUEST_STATUS_CHANGED

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `SERVICE_REQUEST_STATUS_CHANGED` |
| **Trigger / Tính năng** | Trạng thái yêu cầu dịch vụ thay đổi |
| **Priority** | P1 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】サービスリクエストのステータスが更新されました

EN:
【JobShare Business】Your service request status has been updated
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

サービスリクエストのステータスが更新されました。

サービス：{{service_name}}
リクエスト番号：{{request_id}}

{{old_status}} → {{new_status}}

EN:
Dear {{user_name}},
{{company_name}}

The status of your service request has been updated.

Service: {{service_name}}
Request ID: {{request_id}}

{{old_status}} → {{new_status}}
```

### CTA (JP → EN)

```text
JP:
リクエストを確認する

EN:
View request
```

### CTA link / Suggested route

/business/service-requests/{{request_id}}

### Biến bắt buộc

`company_name, user_name, service_name, request_id, old_status, new_status`

### Ghi chú triển khai

Chỉ gửi status user-facing.

---

## 18. LANDING_PAGE_PUBLISHED

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `LANDING_PAGE_PUBLISHED` |
| **Trigger / Tính năng** | Landing Page được publish ra URL công khai |
| **Priority** | P1 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】採用ランディングページを公開しました

EN:
【JobShare Business】Your recruitment landing page is now live
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

採用ランディングページが公開されました。

ページ名：{{landing_page_name}}
公開URL：{{public_url}}

EN:
Dear {{user_name}},
{{company_name}}

Your recruitment landing page has been successfully published.

Page name: {{landing_page_name}}
Public URL: {{public_url}}
```

### CTA (JP → EN)

```text
JP:
公開ページを見る

EN:
View published page
```

### CTA link / Suggested route

{{public_url}}

### Biến bắt buộc

`company_name, user_name, landing_page_name, public_url`

### Ghi chú triển khai

CTA là URL public thật, không phải editor.

---

## 19. PAYMENT_REQUEST_CREATED

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `PAYMENT_REQUEST_CREATED` |
| **Trigger / Tính năng** | WS tạo yêu cầu thanh toán mới |
| **Priority** | P0 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】お支払いのご依頼があります

EN:
【JobShare Business】A new payment request has been issued
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

新しいお支払い依頼が発行されました。

サービス：{{service_name}}
求人：{{job_title}}
候補者：{{candidate_name}}
費用種別：{{fee_type}}
金額：{{amount}}
支払期限：{{due_date}}

請求書・関連資料はJobShare Businessからご確認いただけます。

EN:
Dear {{user_name}},
{{company_name}}

A new payment request has been issued.

Service: {{service_name}}
Job: {{job_title}}
Candidate: {{candidate_name}}
Fee type: {{fee_type}}
Amount: {{amount}}
Payment due date: {{due_date}}

The invoice and related documents are available in JobShare Business.
```

### CTA (JP → EN)

```text
JP:
支払い内容を確認する

EN:
Review payment details
```

### CTA link / Suggested route

/business/billing?tab=payments&payment_id={{payment_id}}

### Biến bắt buộc

`company_name, user_name, service_name, job_title, candidate_name, fee_type, amount, due_date, payment_id`

### Ghi chú triển khai

job/candidate có thể nullable. Chi tiết cần file PDF/Excel nếu có.

---

## 20. PAYMENT_CONFIRMED

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `PAYMENT_CONFIRMED` |
| **Trigger / Tính năng** | WS xác nhận đã nhận thanh toán |
| **Priority** | P0 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】お支払いを確認しました

EN:
【JobShare Business】Your payment has been confirmed
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

お支払いの確認が完了しました。

金額：{{amount}}
支払番号：{{payment_id}}

お支払いいただき、ありがとうございます。

EN:
Dear {{user_name}},
{{company_name}}

We have confirmed your payment.

Amount: {{amount}}
Payment ID: {{payment_id}}

Thank you for your payment.
```

### CTA (JP → EN)

```text
JP:
支払い詳細を見る

EN:
View payment details
```

### CTA link / Suggested route

/business/billing?tab=payments&payment_id={{payment_id}}

### Biến bắt buộc

`company_name, user_name, amount, payment_id`

### Ghi chú triển khai

Trigger khi payment status = Confirmed/Paid.

---

## 21. INVOICE_ISSUED

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `INVOICE_ISSUED` |
| **Trigger / Tính năng** | Hóa đơn được phát hành |
| **Priority** | P0 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】請求書が発行されました

EN:
【JobShare Business】Your invoice has been issued
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

請求書が発行されました。

請求書番号：{{invoice_number}}
金額：{{amount}}
発行日：{{issued_date}}

JobShare Businessよりご確認・ダウンロードいただけます。

EN:
Dear {{user_name}},
{{company_name}}

A new invoice has been issued.

Invoice number: {{invoice_number}}
Amount: {{amount}}
Issue date: {{issued_date}}

You can view and download the invoice from JobShare Business.
```

### CTA (JP → EN)

```text
JP:
請求書を確認する

EN:
View invoice
```

### CTA link / Suggested route

/business/billing?tab=invoices&invoice_id={{invoice_id}}

### Biến bắt buộc

`company_name, user_name, invoice_number, amount, issued_date, invoice_id`

### Ghi chú triển khai

Có thể attach PDF hoặc download trên platform theo security policy.

---

## 22. PARTNER_JOB_EXPIRING

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `PARTNER_JOB_EXPIRING` |
| **Trigger / Tính năng** | JD đang chạy trên Sàn CTV sắp hết hạn |
| **Priority** | P1 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】掲載中の求人がまもなく終了します

EN:
【JobShare Business】Your job posting will expire soon
```

### Nội dung mail (JP → EN)

```text
JP:
{{company_name}}
{{user_name}} 様

以下の求人の掲載終了日が近づいています。

求人：{{job_title}}
掲載終了日：{{expiry_date}}

引き続き募集する場合は、掲載期間を延長してください。

EN:
Dear {{user_name}},
{{company_name}}

The following job posting is approaching its expiration date.

Job: {{job_title}}
Expiration date: {{expiry_date}}

If you would like to continue recruiting, please extend the posting period.
```

### CTA (JP → EN)

```text
JP:
求人を延長する

EN:
Extend job posting
```

### CTA link / Suggested route

/business/candidate-sharing/jobs/{{job_id}}

### Biến bắt buộc

`company_name, user_name, job_title, expiry_date, job_id`

### Ghi chú triển khai

Đề xuất gửi 7 ngày trước hết hạn, tránh duplicate.

---

## 23. EMAIL_VERIFICATION

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `EMAIL_VERIFICATION` |
| **Trigger / Tính năng** | Xác thực email tài khoản |
| **Priority** | P0 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】メールアドレスの確認をお願いします

EN:
【JobShare Business】Please verify your email address
```

### Nội dung mail (JP → EN)

```text
JP:
{{user_name}} 様

JobShare Businessへのご登録ありがとうございます。

以下のボタンからメールアドレスの確認を完了してください。

EN:
Dear {{user_name}},

Thank you for registering with JobShare Business.

Please verify your email address using the button below.
```

### CTA (JP → EN)

```text
JP:
メールアドレスを確認する

EN:
Verify email address
```

### CTA link / Suggested route

{{verification_url}}

### Biến bắt buộc

`user_name, verification_url`

### Ghi chú triển khai

Token expiry + one-time use.

---

## 24. PASSWORD_RESET

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `PASSWORD_RESET` |
| **Trigger / Tính năng** | Yêu cầu reset mật khẩu |
| **Priority** | P0 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】パスワード再設定のご案内

EN:
【JobShare Business】Password reset request
```

### Nội dung mail (JP → EN)

```text
JP:
{{user_name}} 様

パスワード再設定のリクエストを受け付けました。

以下のリンクより、新しいパスワードを設定してください。

この操作に心当たりがない場合は、本メールを破棄してください。

EN:
Dear {{user_name}},

We received a request to reset your JobShare Business password.

Please use the link below to set a new password.

If you did not request a password reset, please disregard this email.
```

### CTA (JP → EN)

```text
JP:
パスワードを再設定する

EN:
Reset password
```

### CTA link / Suggested route

{{reset_password_url}}

### Biến bắt buộc

`user_name, reset_password_url`

### Ghi chú triển khai

Token expiry + one-time use; không log raw token.

---

# Phần: Common Rules

Quy tắc chung áp dụng cho mọi email JobShare Business.

| Hạng mục | Quy tắc đề xuất cho IT |
| --- | --- |
| **Ngôn ngữ** | Spec hiển thị JP ở trên, EN ở dưới. Khi gửi production nên render 1 ngôn ngữ theo locale tài khoản (ja/en), trừ khi business quyết định gửi song ngữ. |
| **Subject prefix** | Tất cả email dùng prefix 【JobShare Business】. |
| **CTA** | Mỗi email tối đa 1 CTA chính; deep-link đúng context, không đưa về Dashboard chung nếu có màn chi tiết. |
| **Login redirect** | Nếu deep-link cần login: /business/login?returnUrl=<deep_link>, login xong quay lại đúng màn. |
| **Candidate privacy** | Không đưa SĐT/email ứng viên trực tiếp trong email notification. |
| **Message preview** | Khoảng 120 ký tự; escape HTML; không nhúng nội dung file attachment vào email. |
| **Time zone** | Đề xuất Asia/Tokyo cho timestamp của tài khoản doanh nghiệp Nhật, trừ khi user profile có timezone riêng. |
| **Idempotency** | Mỗi event có event_id/idempotency key để tránh gửi mail trùng khi retry queue/job. |
| **Status email** | Chỉ gửi status user-facing, không gửi thay đổi nội bộ kỹ thuật. |
| **Security token** | Verification/reset token phải expiry + one-time use; không log raw token. |
| **Footer JP** | |

```text
本メールはJobShare Businessから自動送信されています。
本メールに心当たりがない場合は、破棄していただきますようお願いいたします。

JobShare Business
Workstation
```

| **Footer EN** | |

```text
This is an automated email from JobShare Business.
If you believe you received this email by mistake, please disregard it.

JobShare Business
Workstation
```

| **Logging** | Nên lưu sent_at, delivery status/bounce nếu provider hỗ trợ, template_key, locale, recipient_user_id, event_id. |

# Phần: Recommended Additions

Đề xuất bổ sung template / trigger (chưa có trong bảng chính hoặc mở rộng sau).

## Mục lục

- [A1. MANAGED_SCOUT_CONTRACT_COMPLETED](#a1-managed-scout-contract-completed) — Hợp đồng Scout Ủy Thác hoàn tất / dịch vụ bắt đầu
- [A2. MANAGED_SCOUT_FORMAL_REFERRAL](#a2-managed-scout-formal-referral) — WS chính thức tiến cử ứng viên sau hearing
- [A3. PAYMENT_OVERDUE_REMINDER](#a3-payment-overdue-reminder) — Yêu cầu thanh toán quá hạn
- [A4. INTERVIEW_SCHEDULE_UPDATED](#a4-interview-schedule-updated) — Lịch phỏng vấn được tạo/thay đổi
- [A5. CREDIT_LOW_BALANCE](#a5-credit-low-balance) — Credit gần hết

## A1. MANAGED_SCOUT_CONTRACT_COMPLETED

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `MANAGED_SCOUT_CONTRACT_COMPLETED` |
| **Trigger / Tính năng** | Hợp đồng Scout Ủy Thác hoàn tất / dịch vụ bắt đầu |
| **Priority** | P1 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】スカウト委託の手続きが完了しました

EN:
【JobShare Business】Your Managed Scout setup is complete
```

### Nội dung mail (JP → EN)

```text
JP:
スカウト委託のお手続きが完了しました。求人を紐づける、または新しい求人を作成して、Workstationによる候補者ヒアリングを開始できます。

EN:
Your Managed Scout setup is complete. You can now link an existing job or create a new one so Workstation can begin candidate outreach and hearing.
```

### CTA (JP → EN)

```text
JP:
詳細を確認する

EN:
View details
```

### CTA link / Suggested route

/business/scout/managed/requests/{{request_id}}

### Biến bắt buộc

`request_id, job_id(optional)`

### Ghi chú triển khai

Nên có vì flow Scout Ủy Thác phụ thuộc bước hợp đồng trước hearing.

---

## A2. MANAGED_SCOUT_FORMAL_REFERRAL

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `MANAGED_SCOUT_FORMAL_REFERRAL` |
| **Trigger / Tính năng** | WS chính thức tiến cử ứng viên sau hearing |
| **Priority** | P0 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】候補者を正式に推薦しました

EN:
【JobShare Business】A candidate has been formally referred
```

### Nội dung mail (JP → EN)

```text
JP:
Workstationより候補者を正式に推薦しました。CV・候補者情報をご確認のうえ、書類選考をお願いいたします。

EN:
Workstation has formally referred a candidate. Please review the CV and candidate details and proceed with document screening.
```

### CTA (JP → EN)

```text
JP:
候補者を確認する

EN:
Review candidate
```

### CTA link / Suggested route

/business/applications/{{application_id}}

### Biến bắt buộc

`application_id, candidate_name, job_title`

### Ghi chú triển khai

Phân biệt rõ hearing đồng ý và tiến cử chính thức.

---

## A3. PAYMENT_OVERDUE_REMINDER

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `PAYMENT_OVERDUE_REMINDER` |
| **Trigger / Tính năng** | Yêu cầu thanh toán quá hạn |
| **Priority** | P1 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】お支払期限を過ぎています

EN:
【JobShare Business】Payment is overdue
```

### Nội dung mail (JP → EN)

```text
JP:
以下のお支払いは期限を過ぎています。内容をご確認のうえ、お手続きをお願いいたします。

EN:
The following payment has passed its due date. Please review the payment details and complete the required action.
```

### CTA (JP → EN)

```text
JP:
支払い内容を確認する

EN:
Review payment
```

### CTA link / Suggested route

/business/billing?tab=payments&payment_id={{payment_id}}

### Biến bắt buộc

`payment_id, amount, due_date`

### Ghi chú triển khai

Đề xuất D+1/D+7; tránh spam nếu đang xử lý.

---

## A4. INTERVIEW_SCHEDULE_UPDATED

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `INTERVIEW_SCHEDULE_UPDATED` |
| **Trigger / Tính năng** | Lịch phỏng vấn được tạo/thay đổi |
| **Priority** | P2 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】面接日程が更新されました

EN:
【JobShare Business】Interview schedule has been updated
```

### Nội dung mail (JP → EN)

```text
JP:
候補者の面接日程が更新されました。JobShare Businessで最新情報をご確認ください。

EN:
The candidate's interview schedule has been updated. Please check JobShare Business for the latest details.
```

### CTA (JP → EN)

```text
JP:
面接情報を確認する

EN:
View interview details
```

### CTA link / Suggested route

/business/applications/{{application_id}}

### Biến bắt buộc

`application_id, candidate_name, interview_at`

### Ghi chú triển khai

Chỉ implement nếu platform có quản lý lịch phỏng vấn.

---

## A5. CREDIT_LOW_BALANCE

| Thuộc tính | Giá trị |
| --- | --- |
| **Template Key** | `CREDIT_LOW_BALANCE` |
| **Trigger / Tính năng** | Credit gần hết |
| **Priority** | P2 |

### Tiêu đề mail (JP → EN)

```text
JP:
【JobShare Business】Credit残高が少なくなっています

EN:
【JobShare Business】Your Credit balance is running low
```

### Nội dung mail (JP → EN)

```text
JP:
ダイレクトスカウトで利用できるCredit残高が少なくなっています。必要に応じて追加申請をご検討ください。

EN:
Your available Direct Scout Credit balance is running low. Please consider requesting additional Credits if needed.
```

### CTA (JP → EN)

```text
JP:
Creditを確認する

EN:
View Credits
```

### CTA link / Suggested route

/business/scout/direct

### Biến bắt buộc

`current_balance, low_balance_threshold`

### Ghi chú triển khai

Optional; threshold cấu hình, hạn chế tần suất.

---
