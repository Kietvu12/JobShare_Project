/** Nguồn đơn tiến cử — đồng bộ backend businessJobApplicationService */

export const BUSINESS_APPLICATION_SOURCE = {
  ctv_marketplace: {
    label: 'Sàn CTV (HR Partner)',
    color: '#8b5cf6',
    tab: 'ws_ctv',
  },
  ctv_nomination: {
    label: 'Tiến cử CTV',
    color: '#f59e0b',
    tab: 'ws_ctv',
  },
  scout_performance: {
    label: 'Scout Performance',
    color: '#f59e0b',
    tab: 'ws_ctv',
  },
  scout_credit: {
    label: 'Scout Credit',
    color: '#3b82f6',
    tab: 'scout_credit',
  },
  landing: {
    label: 'Branding LP',
    color: '#64748b',
    tab: 'other',
  },
  other: {
    label: 'Khác',
    color: '#94a3b8',
    tab: 'other',
  },
};

export const BUSINESS_APPLICATION_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'ws_ctv', label: 'Tiến cử (WS/CTV)' },
  { key: 'scout_credit', label: 'Scout Credit' },
  { key: 'hired', label: 'Đã tuyển dụng' },
  { key: 'rejected', label: 'Không phù hợp' },
  { key: 'other', label: 'Khác' },
];

export function getBusinessApplicationSourceMeta(sourceType) {
  return BUSINESS_APPLICATION_SOURCE[sourceType] || BUSINESS_APPLICATION_SOURCE.other;
}

export function getStatusCategoryStyle(category) {
  const map = {
    processing: { color: '#ea580c', bg: '#ffedd5' },
    interview: { color: '#4338ca', bg: '#e0e7ff' },
    waiting: { color: '#0891b2', bg: '#cffafe' },
    success: { color: '#059669', bg: '#d1fae5' },
    rejected: { color: '#b45309', bg: '#fed7aa' },
    cancelled: { color: '#64748b', bg: '#f1f5f9' },
  };
  return map[category] || { color: '#64748b', bg: '#f1f5f9' };
}

export function formatApplicationDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch {
    return '—';
  }
}

export function formatRelativeTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Hôm nay';
  if (days === 1) return '1 ngày trước';
  return `${days} ngày trước`;
}
