/**
 * Thông số tham khảo (bundle Price index-CKZ9M_CP.js, đối chiếu 2026-10-19).
 * Chưa phải bảng giá đã duyệt — thay bằng cấu hình chính thức trước khi dùng thương mại.
 */
export const PRICING_CONFIG = {
  currency: 'JPY',
  referenceDate: '2026-10-19',
  creditsPerUnlock: 100,
  partnerPlatformPercent: 20,
  managedRates: {
    junior: [15, 15],
    mid: [18, 20],
    senior: [20, 25],
  },
  packages: [
    { key: 'basic', name: 'Basic', credits: 1000, price: 30000 },
    { key: 'standard', name: 'Standard', credits: 3000, price: 81000 },
    { key: 'premium', name: 'Premium', credits: 5000, price: 127500 },
  ],
  defaults: {
    headcount: 1,
    income: 5000000,
    budget: 1000000,
    level: 'mid',
    opens: 20,
    partner: 500000,
  },
};

export const SIMULATOR_FIELD_KEYS = Object.keys(PRICING_CONFIG.defaults);
