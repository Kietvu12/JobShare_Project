export const WS_SUPPORT_PHONE_DISPLAY = '0972899728';
export const WS_SUPPORT_PHONE_DISPLAY_INTL = '(+84) 972899728';
export const WS_SUPPORT_PHONE_TEL = '+84972899728';
export const WS_SUPPORT_ZALO_URL = 'https://zalo.me/0972899728';

export function formatPhoneTel(raw) {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('84')) return `+${digits}`;
  if (digits.startsWith('0')) return `+84${digits.slice(1)}`;
  return `+${digits}`;
}
