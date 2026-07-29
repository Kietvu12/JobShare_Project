export const SAIYO_BRANDING_SERVICE_KEYS = {
  RECRUITMENT_ADS: 'recruitment_ads',
  RECRUITMENT_EVENT: 'recruitment_event',
  COMPANY_PROFILE: 'company_profile',
  CONSULTATION: 'consultation',
};

export const SAIYO_BRANDING_SERVICE_LABELS = {
  [SAIYO_BRANDING_SERVICE_KEYS.RECRUITMENT_ADS]: 'Chạy quảng cáo tuyển dụng',
  [SAIYO_BRANDING_SERVICE_KEYS.RECRUITMENT_EVENT]: 'Tổ chức seminar, event tuyển dụng',
  [SAIYO_BRANDING_SERVICE_KEYS.COMPANY_PROFILE]: 'Làm company profile (chuẩn thương hiệu)',
  [SAIYO_BRANDING_SERVICE_KEYS.CONSULTATION]: 'Tư vấn Saiyo Branding',
};

export function getSaiyoBrandingServiceLabel(serviceKey) {
  return SAIYO_BRANDING_SERVICE_LABELS[serviceKey] || String(serviceKey || 'Dịch vụ Saiyo Branding');
}

export function isValidSaiyoBrandingServiceKey(serviceKey) {
  return Object.values(SAIYO_BRANDING_SERVICE_KEYS).includes(String(serviceKey || '').trim());
}
