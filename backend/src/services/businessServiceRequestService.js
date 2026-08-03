import { BILLING_REQUEST_TYPES } from '../constants/businessBilling.js';
import { createWsChatBusinessServiceRequestMessage } from './businessWsChatService.js';

const ALLOWED_SERVICE_KEYS = new Set([
  BILLING_REQUEST_TYPES.LANDING_PAGE_PREMIUM,
  BILLING_REQUEST_TYPES.RECRUITMENT_ADS,
  BILLING_REQUEST_TYPES.SEMINAR_CAMPAIGN,
  BILLING_REQUEST_TYPES.COMPANY_PROFILE,
  BILLING_REQUEST_TYPES.OTHER_SERVICE,
]);

const SERVICE_TITLE_MAP = {
  [BILLING_REQUEST_TYPES.LANDING_PAGE_PREMIUM]: 'Yêu cầu Landing Page premium',
  [BILLING_REQUEST_TYPES.RECRUITMENT_ADS]: 'Yêu cầu chạy quảng cáo tuyển dụng',
  [BILLING_REQUEST_TYPES.SEMINAR_CAMPAIGN]: 'Yêu cầu tổ chức Seminar / Campaign tuyển dụng',
  [BILLING_REQUEST_TYPES.COMPANY_PROFILE]: 'Yêu cầu thiết kế profile company',
  [BILLING_REQUEST_TYPES.OTHER_SERVICE]: 'Yêu cầu dịch vụ khác',
};

export async function createBusinessServiceRequest({ businessId, serviceKey, serviceTitle, note }) {
  const key = String(serviceKey || '').trim();
  if (!ALLOWED_SERVICE_KEYS.has(key)) {
    const err = new Error('Loại dịch vụ không hợp lệ');
    err.statusCode = 400;
    throw err;
  }

  const title = String(serviceTitle || SERVICE_TITLE_MAP[key] || key).trim();
  const { message, session, requestCode } = await createWsChatBusinessServiceRequestMessage({
    businessId,
    serviceKey: key,
    serviceTitle: title,
    note,
  });

  return {
    requestCode,
    serviceKey: key,
    serviceTitle: title,
    note: note ? String(note).trim() : null,
    sessionId: session?.id || null,
    messageId: message?.id || null,
  };
}
