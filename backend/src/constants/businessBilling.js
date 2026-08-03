/** Tab lọc danh sách yêu cầu billing */
export const BILLING_REQUEST_TABS = {
  ALL: 'all',
  PROCESSING: 'processing',
  WAITING: 'waiting',
  DONE: 'done',
  CLOSED: 'closed',
};

/**
 * Luồng yêu cầu thanh toán (Billing):
 * - Scout Performance: WS gửi yêu cầu cho Doanh nghiệp (chat WS ↔ DN) — đã có.
 * - Giới thiệu sàn CTV thành công: thẻ hiển thị trong tin nhắn 3 bên nhưng người gửi là Admin → DN
 *   (kèm case ứng viên, tên CTV, phí tuyển dụng). WS thu DN rồi trả CTV sau khi trừ phí dịch vụ.
 *   Loại: PARTNER_CTV — cần gắn settlement + thẻ chat (chưa triển khai đầy đủ).
 */

/** Loại yêu cầu hiển thị trên billing */
export const BILLING_REQUEST_TYPES = {
  SCOUT_PERFORMANCE: 'scout_performance',
  SCOUT_CREDIT: 'scout_credit',
  SAIYO_BRANDING: 'saiyo_branding',
  PARTNER_CTV: 'partner_ctv',
  CREDIT_TOPUP: 'credit_topup',
  LANDING_PAGE_PREMIUM: 'landing_page_premium',
  RECRUITMENT_ADS: 'recruitment_ads',
  SEMINAR_CAMPAIGN: 'seminar_campaign',
  COMPANY_PROFILE: 'company_profile',
  OTHER_SERVICE: 'other_service',
};

export const BILLING_REQUEST_TYPE_LABELS = {
  [BILLING_REQUEST_TYPES.SCOUT_PERFORMANCE]: 'Scout Performance',
  [BILLING_REQUEST_TYPES.SCOUT_CREDIT]: 'Scout Credit',
  [BILLING_REQUEST_TYPES.SAIYO_BRANDING]: 'Saiyo Branding',
  [BILLING_REQUEST_TYPES.PARTNER_CTV]: 'Partner CTV',
  [BILLING_REQUEST_TYPES.CREDIT_TOPUP]: 'Nạp credit',
  [BILLING_REQUEST_TYPES.LANDING_PAGE_PREMIUM]: 'Landing Page premium',
  [BILLING_REQUEST_TYPES.RECRUITMENT_ADS]: 'Chạy quảng cáo tuyển dụng',
  [BILLING_REQUEST_TYPES.SEMINAR_CAMPAIGN]: 'Seminar / Campaign tuyển dụng',
  [BILLING_REQUEST_TYPES.COMPANY_PROFILE]: 'Thiết kế profile company',
  [BILLING_REQUEST_TYPES.OTHER_SERVICE]: 'Yêu cầu khác',
};

/** business_credit_requests.status */
export const CREDIT_REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

export const CREDIT_REQUEST_STATUS_LABELS = {
  pending: 'Chờ duyệt',
  approved: 'Hoàn thành',
  rejected: 'Từ chối',
  cancelled: 'Đã hủy',
};

export const BILLING_INVOICE_STATUS = {
  DRAFT: 'draft',
  UNPAID: 'unpaid',
  PROCESSING: 'processing',
  PAID: 'paid',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS_STYLES = {
  unpaid: { label: 'Chưa thanh toán', statusBg: '#fee2e2', statusColor: '#dc2626', tab: 'unpaid' },
  processing: { label: 'Đang xử lý', statusBg: '#ffedd5', statusColor: '#ea580c', tab: 'processing' },
  paid: { label: 'Đã thanh toán', statusBg: '#dcfce7', statusColor: '#16a34a', tab: 'paid' },
  draft: { label: 'Draft', statusBg: '#f1f5f9', statusColor: '#64748b', tab: 'draft' },
  cancelled: { label: 'Đã hủy', statusBg: '#f1f5f9', statusColor: '#64748b', tab: 'closed' },
};

export const BILLING_STATUS_STYLES = {
  processing: { label: 'Đang xử lý', statusBg: '#ffedd5', statusColor: '#ea580c', category: 'processing' },
  waiting: { label: 'Chờ phản hồi', statusBg: '#dbeafe', statusColor: '#2563eb', category: 'waiting' },
  waiting_ws: { label: 'Đang chờ WS', statusBg: '#fee2e2', statusColor: '#dc2626', category: 'waiting' },
  done: { label: 'Hoàn thành', statusBg: '#dcfce7', statusColor: '#16a34a', category: 'done' },
  closed: { label: 'Đã đóng', statusBg: '#f1f5f9', statusColor: '#64748b', category: 'closed' },
  expiring: { label: 'Sắp hết hạn', statusBg: '#ede9fe', statusColor: '#7c3aed', category: 'processing' },
};
