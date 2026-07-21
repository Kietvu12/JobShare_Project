/** Tab lọc danh sách yêu cầu billing */
export const BILLING_REQUEST_TABS = {
  ALL: 'all',
  PROCESSING: 'processing',
  WAITING: 'waiting',
  DONE: 'done',
  CLOSED: 'closed',
};

/** Loại yêu cầu hiển thị trên billing */
export const BILLING_REQUEST_TYPES = {
  SCOUT_PERFORMANCE: 'scout_performance',
  SCOUT_CREDIT: 'scout_credit',
  SAIYO_BRANDING: 'saiyo_branding',
  PARTNER_CTV: 'partner_ctv',
  CREDIT_TOPUP: 'credit_topup',
};

export const BILLING_REQUEST_TYPE_LABELS = {
  [BILLING_REQUEST_TYPES.SCOUT_PERFORMANCE]: 'Scout Performance',
  [BILLING_REQUEST_TYPES.SCOUT_CREDIT]: 'Scout Credit',
  [BILLING_REQUEST_TYPES.SAIYO_BRANDING]: 'Saiyo Branding',
  [BILLING_REQUEST_TYPES.PARTNER_CTV]: 'Partner CTV',
  [BILLING_REQUEST_TYPES.CREDIT_TOPUP]: 'Nạp credit',
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
  PAID: 'paid',
  CANCELLED: 'cancelled',
};

export const BILLING_STATUS_STYLES = {
  processing: { label: 'Đang xử lý', statusBg: '#ffedd5', statusColor: '#ea580c', category: 'processing' },
  waiting: { label: 'Chờ phản hồi', statusBg: '#dbeafe', statusColor: '#2563eb', category: 'waiting' },
  waiting_ws: { label: 'Đang chờ WS', statusBg: '#fee2e2', statusColor: '#dc2626', category: 'waiting' },
  done: { label: 'Hoàn thành', statusBg: '#dcfce7', statusColor: '#16a34a', category: 'done' },
  closed: { label: 'Đã đóng', statusBg: '#f1f5f9', statusColor: '#64748b', category: 'closed' },
  expiring: { label: 'Sắp hết hạn', statusBg: '#ede9fe', statusColor: '#7c3aed', category: 'processing' },
};
