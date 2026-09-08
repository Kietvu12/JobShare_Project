const CREDIT_APPROVED_TITLES = new Set([
  'Yêu cầu nạp credit đã được duyệt',
  'Credit top-up approved',
  'クレジットチャージが承認されました',
]);

export function isCreditTopUpApprovedNotification(notification) {
  const title = String(notification?.title || '').trim();
  return CREDIT_APPROVED_TITLES.has(title);
}

export const CREDIT_TOPUP_SCOUT_DIRECT_PATH = '/business/scout/direct';
