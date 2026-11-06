# Module: Dịch vụ – Partner market (採用パートナーマーケット)

| Step | File | Thao tác |
|------|------|----------|
| 01 | `step-01-tu-dashboard.png` | Dashboard DN |
| 02 | `step-02-onboarding-san-partner.png` | Landing sàn — CTA đăng JD / quản lý |
| 03 | `step-03-modal-dang-jd-len-san.png` | **採用パートナーマーケットにJD掲載** → modal tạo listing |
| 04 | `step-04-dashboard-tab-jd-va-kpi.png` | **マーケット管理へ** — KPI + tab JD |
| 05 | `step-05-modal-dang-jd-tu-dashboard.png` | **マーケットに掲載** từ header dashboard |
| 06–07 | `step-06-chon-jd-tren-bang.png`, `step-07-chi-tiet-jd-tren-san.png` | *(Chỉ khi đã có JD trên bảng)* — chọn dòng & chi tiết listing |

Nếu chưa có JD đăng sàn, script dừng sau step 05 (modal đăng từ dashboard).

```bash
cd scripts/qa-runner && QA_HEADED=1 node run.mjs --only=partner
```
