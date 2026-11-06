# QA Production – Luồng Doanh nghiệp (theo module)

**Môi trường:** Production · **Ngày:** 26/10/2026

| Portal | Đăng nhập |
|--------|-----------|
| Doanh nghiệp | https://ws-jobshare.com/business/login · `kietvu389@gmail.com` / `12345678` |
| Admin | https://admin.ws-jobshare.com/admin/login · `admin@example.com` / `123456` |

Ảnh được đặt **theo từng module**, mỗi bước một file `step-NN-*.png` (thao tác tuần tự như user thật).

## Cấu trúc thư mục

| Module | Thư mục | README |
|--------|---------|--------|
| Nạp credit (DN + Admin) | [`credit-topup/`](credit-topup/README.md) | Business + Admin |
| Scout trực tiếp | [`service-direct-scout/`](service-direct-scout/README.md) | |
| Scout ủy thác | [`service-managed-scout/`](service-managed-scout/README.md) | |
| Employer branding | [`service-employer-branding/`](service-employer-branding/README.md) | |
| Partner market | [`service-partner-market/`](service-partner-market/README.md) | |
| Thanh toán phí giới thiệu | [`payment-referral/`](payment-referral/README.md) | Business + Admin |

## Chụp lại / bổ sung step

```bash
cd scripts/qa-runner
npm install
npx playwright install chromium
node run.mjs
QA_HEADED=1 node run.mjs --only=scout-direct,scout-managed,branding,partner
```

Script: [`scripts/qa-production-step-screenshots.mjs`](../../../scripts/qa-production-step-screenshots.mjs) · runner `scripts/qa-runner/run.mjs`.

**4 dịch vụ:** script thao tác thật (workspace Scout, tab chi tiết ứng viên + modal unlock/ủy thác, intake branding, modal đăng JD sàn…). UI production QA thường **tiếng Việt**.

**Lưu ý:** Partner step 06–07 cần đã có JD trên bảng sàn; credit/billing phụ thuộc dữ liệu production.
