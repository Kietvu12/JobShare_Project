/** Gói credit nạp qua WS — hiển thị trên trang yêu cầu nạp credit. */
export const BUSINESS_CREDIT_PACKAGES = [
  {
    key: 'basic',
    name: 'Basic',
    credits: 1000,
    priceYen: 30000,
    originalPriceYen: null,
    discountLabel: null,
    profileOpens: 10,
    accent: '#0077B6',
    cardBg: '#f8fbfd',
    iconBg: '#e8f4fa',
  },
  {
    key: 'standard',
    name: 'Standard',
    credits: 3000,
    priceYen: 81000,
    originalPriceYen: 90000,
    discountLabel: '-10%',
    profileOpens: 30,
    accent: '#16a34a',
    cardBg: '#f7fdf9',
    iconBg: '#dcfce7',
  },
  {
    key: 'premium',
    name: 'Premium',
    credits: 5000,
    priceYen: 127500,
    originalPriceYen: 150000,
    discountLabel: '-15%',
    profileOpens: 50,
    accent: '#7c3aed',
    cardBg: '#faf9ff',
    iconBg: '#ede9fe',
  },
];

export function formatCreditAmount(value) {
  return `${Number(value).toLocaleString('vi-VN')} credit`;
}

export function formatYenAmount(value) {
  return `${Number(value).toLocaleString('vi-VN')} yên`;
}

export function getCreditPackageByKey(key) {
  return BUSINESS_CREDIT_PACKAGES.find((p) => p.key === key) || null;
}
