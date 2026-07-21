/** business_ctv_marketplace_listings.status */
export const MARKETPLACE_LISTING_STATUS = {
  DRAFT: 0,
  PENDING_APPROVAL: 1,
  APPROVED: 2,
  PUBLISHED: 3,
  PAUSED: 4,
  CLOSED: 5,
  REJECTED: 6,
};

export const MARKETPLACE_LISTING_STATUS_LABELS = {
  0: 'Nháp',
  1: 'Chờ WS duyệt',
  2: 'Đã duyệt',
  3: 'Đang chạy',
  4: 'Tạm dừng',
  5: 'Đã đóng',
  6: 'Từ chối',
};

export const MARKETPLACE_SETTLEMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled',
};

export const DEFAULT_PLATFORM_FEE_PERCENT = 20;

export const MARKETPLACE_PICKUP_NAME = 'Sàn CTV — Doanh nghiệp';

/** Job application statuses counted as "in pipeline" for business dashboard */
export const MARKETPLACE_PIPELINE_STATUSES = [2, 3, 5, 7, 8, 9, 11, 12];

/** Hired / success */
export const MARKETPLACE_HIRED_STATUSES = [12, 14, 15];
