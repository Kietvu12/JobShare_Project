import { Op } from 'sequelize';
import {
  BusinessCreditHistory,
  BusinessScoutPerformanceRequest,
  BusinessScoutUnlock,
  BusinessLandingPage,
  BusinessCtvMarketplaceListing,
  BusinessInvoice,
  BusinessCreditRequest,
  CVStorage,
  Job,
  Admin,
} from '../models/index.js';
import { SCOUT_PERFORMANCE_REQUEST_STATUS } from '../constants/scoutCredit.js';
import { MARKETPLACE_LISTING_STATUS } from '../constants/candidateSharing.js';
import { LANDING_PAGE_STATUS } from '../constants/businessLandingPage.js';
import { CREDIT_HISTORY_TYPES } from './businessCreditService.js';
import {
  BILLING_REQUEST_TABS,
  BILLING_REQUEST_TYPES,
  BILLING_REQUEST_TYPE_LABELS,
  BILLING_INVOICE_STATUS,
  BILLING_STATUS_STYLES,
  CREDIT_REQUEST_STATUS,
} from '../constants/businessBilling.js';

function formatDateVi(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN');
}

function formatDateTimeVi(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const date = d.toLocaleDateString('vi-VN');
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
}

function formatMoneyVnd(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '0 VND';
  return `${Math.round(n).toLocaleString('vi-VN')} VND`;
}

function getInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return 'WS';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function buildRequestCode(type, id, date) {
  const d = date ? new Date(date) : new Date();
  const ym = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}`;
  const prefixMap = {
    [BILLING_REQUEST_TYPES.SCOUT_PERFORMANCE]: 'SP',
    [BILLING_REQUEST_TYPES.SCOUT_CREDIT]: 'SC',
    [BILLING_REQUEST_TYPES.SAIYO_BRANDING]: 'SB',
    [BILLING_REQUEST_TYPES.PARTNER_CTV]: 'PC',
    [BILLING_REQUEST_TYPES.CREDIT_TOPUP]: 'CR',
  };
  const prefix = prefixMap[type] || 'RQ';
  return `${prefix}-${ym}-${String(id).padStart(3, '0')}`;
}

function mapPerformanceStatus(status) {
  const s = String(status || '').trim();
  if (s === SCOUT_PERFORMANCE_REQUEST_STATUS.PENDING) return BILLING_STATUS_STYLES.processing;
  if (s === SCOUT_PERFORMANCE_REQUEST_STATUS.APPROVED) return BILLING_STATUS_STYLES.done;
  if (s === SCOUT_PERFORMANCE_REQUEST_STATUS.REJECTED) return BILLING_STATUS_STYLES.closed;
  if (s === SCOUT_PERFORMANCE_REQUEST_STATUS.CANCELLED) return BILLING_STATUS_STYLES.closed;
  return BILLING_STATUS_STYLES.processing;
}

function mapCreditRequestStatus(status) {
  const s = String(status || '').trim();
  if (s === CREDIT_REQUEST_STATUS.PENDING) return BILLING_STATUS_STYLES.waiting_ws;
  if (s === CREDIT_REQUEST_STATUS.APPROVED) return BILLING_STATUS_STYLES.done;
  if (s === CREDIT_REQUEST_STATUS.REJECTED || s === CREDIT_REQUEST_STATUS.CANCELLED) {
    return BILLING_STATUS_STYLES.closed;
  }
  return BILLING_STATUS_STYLES.processing;
}

function mapMarketplaceStatus(status) {
  const n = Number(status);
  if (n === MARKETPLACE_LISTING_STATUS.PENDING_APPROVAL) return BILLING_STATUS_STYLES.waiting_ws;
  if (n === MARKETPLACE_LISTING_STATUS.APPROVED) return BILLING_STATUS_STYLES.processing;
  if (n === MARKETPLACE_LISTING_STATUS.PUBLISHED) return BILLING_STATUS_STYLES.done;
  if (n === MARKETPLACE_LISTING_STATUS.REJECTED || n === MARKETPLACE_LISTING_STATUS.CLOSED) {
    return BILLING_STATUS_STYLES.closed;
  }
  if (n === MARKETPLACE_LISTING_STATUS.DRAFT) return BILLING_STATUS_STYLES.processing;
  if (n === MARKETPLACE_LISTING_STATUS.PAUSED) return BILLING_STATUS_STYLES.expiring;
  return BILLING_STATUS_STYLES.processing;
}

function mapLandingStatus(status) {
  const n = Number(status);
  if (n === LANDING_PAGE_STATUS.DRAFT) return BILLING_STATUS_STYLES.processing;
  if (n === LANDING_PAGE_STATUS.ACTIVE) return BILLING_STATUS_STYLES.done;
  if (n === LANDING_PAGE_STATUS.PAUSED) return BILLING_STATUS_STYLES.expiring;
  if (n === LANDING_PAGE_STATUS.CLOSED) return BILLING_STATUS_STYLES.closed;
  return BILLING_STATUS_STYLES.processing;
}

function buildJdLabel(job, fallbackTitle) {
  if (job?.title) {
    const code = job.jobCode || job.job_code || job.id;
    return code ? `${job.title} (${code})` : job.title;
  }
  return fallbackTitle || '—';
}

function buildCandidateLabel(cv) {
  if (!cv) return '—';
  const name = cv.name || 'Ứng viên ẩn danh';
  const code = cv.code ? ` • ${cv.code}` : '';
  return `${name}${code}`;
}

function resolveWsName(admin, fallback = 'JobShare WS') {
  if (admin?.name) return admin.name;
  if (admin?.email) return admin.email.split('@')[0];
  return fallback;
}

function mapCreditHistoryType(row) {
  const type = String(row.type || '').trim();
  const refType = String(row.referenceType || row.reference_type || '').trim();
  if (type === CREDIT_HISTORY_TYPES.ADMIN_GRANT || type === CREDIT_HISTORY_TYPES.ADJUSTMENT) {
    const delta = Number(row.changeAmount ?? row.change_amount ?? 0);
    if (delta > 0) return 'Nạp credit';
  }
  if (refType === 'scout_unlock' || type === CREDIT_HISTORY_TYPES.USAGE) {
    return 'Mở hồ sơ ứng viên';
  }
  if (type === CREDIT_HISTORY_TYPES.ADMIN_DEDUCT) return 'Khấu trừ credit';
  if (type === CREDIT_HISTORY_TYPES.USAGE) return 'Sử dụng credit';
  return 'Giao dịch credit';
}

function formatTransactionRow(row) {
  const json = row.toJSON ? row.toJSON() : row;
  const change = Number(json.changeAmount ?? json.change_amount ?? 0);
  const balance = Number(json.balanceAfter ?? json.balance_after ?? 0);
  return {
    id: json.id,
    date: formatDateTimeVi(json.createdAt || json.created_at),
    type: mapCreditHistoryType(json),
    change,
    balance,
    content: json.note || mapCreditHistoryType(json),
    createdAt: json.createdAt || json.created_at,
  };
}

function formatRequestRow(item) {
  const style = item.statusStyle || BILLING_STATUS_STYLES.processing;
  const wsName = item.wsName || 'JobShare WS';
  return {
    id: item.requestCode,
    requestCode: item.requestCode,
    sourceType: item.sourceType,
    type: item.typeLabel,
    jd: item.jdLabel,
    candidate: item.candidateLabel,
    status: style.label,
    statusBg: style.statusBg,
    statusColor: style.statusColor,
    statusCategory: style.category,
    ws: wsName,
    wsInitials: getInitials(wsName),
    created: formatDateVi(item.createdAt),
    updated: formatDateVi(item.updatedAt),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    rawId: item.rawId,
    rawStatus: item.rawStatus || null,
  };
}

async function collectAllRequests(businessId) {
  const items = [];

  const perfRows = await BusinessScoutPerformanceRequest.findAll({
    where: { businessId },
    include: [
      {
        model: CVStorage,
        as: 'cv',
        required: false,
        attributes: ['id', 'code', 'name', 'desiredPosition'],
      },
      {
        model: Admin,
        as: 'handledByAdmin',
        required: false,
        attributes: ['id', 'name', 'email'],
      },
    ],
    order: [['requested_at', 'DESC'], ['id', 'DESC']],
    limit: 200,
  });

  for (const row of perfRows) {
    const json = row.toJSON();
    const cv = json.cv || {};
    const createdAt = json.requestedAt || json.createdAt || json.created_at;
    const updatedAt = json.handledAt || json.updatedAt || json.updated_at || createdAt;
    const statusStyle = mapPerformanceStatus(json.status);
    items.push({
      sourceType: BILLING_REQUEST_TYPES.SCOUT_PERFORMANCE,
      typeLabel: BILLING_REQUEST_TYPE_LABELS[BILLING_REQUEST_TYPES.SCOUT_PERFORMANCE],
      requestCode: buildRequestCode(BILLING_REQUEST_TYPES.SCOUT_PERFORMANCE, json.id, createdAt),
      jdLabel: cv.desiredPosition ? `${cv.desiredPosition}${cv.code ? ` (${cv.code})` : ''}` : '—',
      candidateLabel: buildCandidateLabel(cv),
      statusStyle,
      wsName: resolveWsName(json.handledByAdmin),
      createdAt,
      updatedAt,
      rawId: json.id,
    });
  }

  const unlockRows = await BusinessScoutUnlock.findAll({
    where: { businessId },
    include: [
      {
        model: CVStorage,
        as: 'cv',
        required: false,
        attributes: ['id', 'code', 'name', 'desiredPosition'],
      },
    ],
    order: [['unlocked_at', 'DESC'], ['id', 'DESC']],
    limit: 100,
  });

  for (const row of unlockRows) {
    const json = row.toJSON();
    const cv = json.cv || {};
    const createdAt = json.unlockedAt || json.createdAt || json.created_at;
    items.push({
      sourceType: BILLING_REQUEST_TYPES.SCOUT_CREDIT,
      typeLabel: BILLING_REQUEST_TYPE_LABELS[BILLING_REQUEST_TYPES.SCOUT_CREDIT],
      requestCode: buildRequestCode(BILLING_REQUEST_TYPES.SCOUT_CREDIT, json.id, createdAt),
      jdLabel: cv.desiredPosition ? `${cv.desiredPosition}${cv.code ? ` (${cv.code})` : ''}` : '—',
      candidateLabel: buildCandidateLabel(cv),
      statusStyle: BILLING_STATUS_STYLES.done,
      wsName: 'JobShare WS',
      createdAt,
      updatedAt: createdAt,
      rawId: json.id,
    });
  }

  const landingRows = await BusinessLandingPage.findAll({
    where: { businessId },
    include: [
      {
        model: Job,
        as: 'job',
        required: false,
        attributes: ['id', 'title', 'jobCode'],
      },
    ],
    order: [['updated_at', 'DESC']],
    limit: 100,
  });

  for (const row of landingRows) {
    const json = row.toJSON();
    const createdAt = json.createdAt || json.created_at;
    const updatedAt = json.updatedAt || json.updated_at;
    items.push({
      sourceType: BILLING_REQUEST_TYPES.SAIYO_BRANDING,
      typeLabel: BILLING_REQUEST_TYPE_LABELS[BILLING_REQUEST_TYPES.SAIYO_BRANDING],
      requestCode: buildRequestCode(BILLING_REQUEST_TYPES.SAIYO_BRANDING, json.id, createdAt),
      jdLabel: buildJdLabel(json.job, json.title),
      candidateLabel: '—',
      statusStyle: mapLandingStatus(json.status),
      wsName: 'JobShare WS',
      createdAt,
      updatedAt,
      rawId: json.id,
    });
  }

  const listingRows = await BusinessCtvMarketplaceListing.findAll({
    where: { businessId },
    include: [
      {
        model: Job,
        as: 'job',
        required: false,
        attributes: ['id', 'title', 'jobCode'],
      },
      {
        model: Admin,
        as: 'handledByAdmin',
        required: false,
        attributes: ['id', 'name', 'email'],
      },
    ],
    order: [['updated_at', 'DESC']],
    limit: 100,
  });

  for (const row of listingRows) {
    const json = row.toJSON();
    const createdAt = json.createdAt || json.created_at;
    const updatedAt = json.updatedAt || json.updated_at;
    items.push({
      sourceType: BILLING_REQUEST_TYPES.PARTNER_CTV,
      typeLabel: BILLING_REQUEST_TYPE_LABELS[BILLING_REQUEST_TYPES.PARTNER_CTV],
      requestCode: buildRequestCode(BILLING_REQUEST_TYPES.PARTNER_CTV, json.id, createdAt),
      jdLabel: buildJdLabel(json.job),
      candidateLabel: '—',
      statusStyle: mapMarketplaceStatus(json.status),
      wsName: resolveWsName(json.handledByAdmin),
      createdAt,
      updatedAt,
      rawId: json.id,
    });
  }

  const creditRequestRows = await BusinessCreditRequest.findAll({
    where: { businessId },
    include: [
      {
        model: Admin,
        as: 'handledByAdmin',
        required: false,
        attributes: ['id', 'name', 'email'],
      },
    ],
    order: [['requested_at', 'DESC'], ['id', 'DESC']],
    limit: 100,
  }).catch((err) => {
    if (String(err?.message || '').includes("doesn't exist")) return [];
    throw err;
  });

  for (const row of creditRequestRows) {
    const json = row.toJSON();
    const createdAt = json.requestedAt || json.createdAt || json.created_at;
    const updatedAt = json.handledAt || json.updatedAt || json.updated_at || createdAt;
    items.push({
      sourceType: BILLING_REQUEST_TYPES.CREDIT_TOPUP,
      typeLabel: BILLING_REQUEST_TYPE_LABELS[BILLING_REQUEST_TYPES.CREDIT_TOPUP],
      requestCode: json.requestCode || json.request_code || buildRequestCode(BILLING_REQUEST_TYPES.CREDIT_TOPUP, json.id, createdAt),
      jdLabel: '—',
      candidateLabel: `${Number(json.amount || 0).toLocaleString('vi-VN')} credit${json.note ? ` • ${json.note}` : ''}`,
      statusStyle: mapCreditRequestStatus(json.status),
      wsName: resolveWsName(json.handledByAdmin),
      createdAt,
      updatedAt,
      rawId: json.id,
      rawStatus: json.status,
    });
  }

  items.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  return items;
}

function countByTab(items) {
  const counts = {
    [BILLING_REQUEST_TABS.ALL]: items.length,
    [BILLING_REQUEST_TABS.PROCESSING]: 0,
    [BILLING_REQUEST_TABS.WAITING]: 0,
    [BILLING_REQUEST_TABS.DONE]: 0,
    [BILLING_REQUEST_TABS.CLOSED]: 0,
  };
  for (const item of items) {
    const cat = item.statusStyle?.category;
    if (cat === 'processing') counts[BILLING_REQUEST_TABS.PROCESSING] += 1;
    if (cat === 'waiting') counts[BILLING_REQUEST_TABS.WAITING] += 1;
    if (cat === 'done') counts[BILLING_REQUEST_TABS.DONE] += 1;
    if (cat === 'closed') counts[BILLING_REQUEST_TABS.CLOSED] += 1;
  }
  return counts;
}

function filterRequests(items, { tab, type, search }) {
  let filtered = items;
  if (tab && tab !== BILLING_REQUEST_TABS.ALL) {
    filtered = filtered.filter((item) => item.statusStyle?.category === tab);
  }
  if (type && type !== 'all') {
    filtered = filtered.filter((item) => item.sourceType === type);
  }
  if (search && String(search).trim()) {
    const q = String(search).trim().toLowerCase();
    filtered = filtered.filter((item) => {
      const haystack = [
        item.requestCode,
        item.typeLabel,
        item.jdLabel,
        item.candidateLabel,
        item.wsName,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }
  return filtered;
}

async function getCreditUsedThisMonth(businessId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const rows = await BusinessCreditHistory.findAll({
    where: {
      businessId,
      change_amount: { [Op.lt]: 0 },
      created_at: { [Op.gte]: monthStart },
    },
    attributes: ['change_amount'],
    raw: true,
  });
  return rows.reduce((sum, row) => sum + Math.abs(Number(row.change_amount ?? row.changeAmount ?? 0)), 0);
}

async function buildServices(businessId) {
  const unlockCount = await BusinessScoutUnlock.count({ where: { businessId } });
  const perfPending = await BusinessScoutPerformanceRequest.count({
    where: { businessId, status: SCOUT_PERFORMANCE_REQUEST_STATUS.PENDING },
  });
  const perfRunning = await BusinessScoutPerformanceRequest.count({
    where: {
      businessId,
      status: { [Op.in]: [SCOUT_PERFORMANCE_REQUEST_STATUS.PENDING, SCOUT_PERFORMANCE_REQUEST_STATUS.APPROVED] },
    },
  });
  const activeLanding = await BusinessLandingPage.count({
    where: { businessId, status: LANDING_PAGE_STATUS.ACTIVE },
  });
  const publishedCtv = await BusinessCtvMarketplaceListing.count({
    where: { businessId, status: MARKETPLACE_LISTING_STATUS.PUBLISHED },
  });
  const ctvCollaborators = await BusinessCtvMarketplaceListing.sum('nominationsCount', {
    where: { businessId, status: MARKETPLACE_LISTING_STATUS.PUBLISHED },
  });

  return [
    {
      key: 'scout_credit',
      title: 'Scout Credit',
      status: unlockCount > 0 ? 'Đang hoạt động' : 'Chưa sử dụng',
      statusBg: unlockCount > 0 ? '#dcfce7' : '#f1f5f9',
      statusColor: unlockCount > 0 ? '#16a34a' : '#64748b',
      desc: unlockCount > 0 ? `Đã unlock: ${unlockCount} hồ sơ` : 'Chưa unlock hồ sơ nào',
    },
    {
      key: 'scout_performance',
      title: 'Scout Performance',
      status: perfPending > 0 ? 'Đang xử lý' : perfRunning > 0 ? 'Đang hoạt động' : 'Chưa sử dụng',
      statusBg: perfPending > 0 ? '#dbeafe' : perfRunning > 0 ? '#dcfce7' : '#f1f5f9',
      statusColor: perfPending > 0 ? '#2563eb' : perfRunning > 0 ? '#16a34a' : '#64748b',
      desc: perfPending > 0 ? `${perfPending} yêu cầu đang chờ` : 'Chưa có yêu cầu đang chạy',
    },
    {
      key: 'saiyo_branding',
      title: 'Saiyo Branding',
      status: activeLanding > 0 ? 'Đang hoạt động' : 'Chưa sử dụng',
      statusBg: activeLanding > 0 ? '#dcfce7' : '#f1f5f9',
      statusColor: activeLanding > 0 ? '#16a34a' : '#64748b',
      desc: activeLanding > 0 ? `${activeLanding} landing page đang live` : 'Chưa có landing page live',
    },
    {
      key: 'partner_ctv',
      title: 'Partner CTV',
      status: publishedCtv > 0 ? 'Đang hoạt động' : 'Chưa sử dụng',
      statusBg: publishedCtv > 0 ? '#dcfce7' : '#f1f5f9',
      statusColor: publishedCtv > 0 ? '#16a34a' : '#64748b',
      desc: publishedCtv > 0
        ? `${Number(ctvCollaborators || 0)} tiến cử qua Sàn CTV`
        : 'Chưa đăng job lên Sàn CTV',
    },
  ];
}

async function buildActivities(businessId) {
  const activities = [];

  const creditRows = await BusinessCreditHistory.findAll({
    where: { businessId },
    order: [['created_at', 'DESC']],
    limit: 5,
    attributes: ['change_amount', 'note', 'type', 'created_at'],
    raw: true,
  });
  for (const row of creditRows) {
    const change = Number(row.change_amount ?? row.changeAmount ?? 0);
    let text = row.note;
    if (!text) {
      text = change > 0
        ? `Nạp credit thành công +${change} credit`
        : `Credit đã trừ ${Math.abs(change)}`;
    }
    activities.push({
      time: formatDateTimeVi(row.created_at ?? row.createdAt),
      text,
      createdAt: row.created_at ?? row.createdAt,
    });
  }

  const perfRows = await BusinessScoutPerformanceRequest.findAll({
    where: { businessId },
    order: [['updated_at', 'DESC']],
    limit: 5,
    attributes: ['id', 'status', 'updated_at', 'requested_at'],
    raw: true,
  });
  for (const row of perfRows) {
    const code = buildRequestCode(BILLING_REQUEST_TYPES.SCOUT_PERFORMANCE, row.id, row.requested_at ?? row.requestedAt);
    activities.push({
      time: formatDateTimeVi(row.updated_at ?? row.updatedAt),
      text: `JobShare đã cập nhật trạng thái request ${code}`,
      createdAt: row.updated_at ?? row.updatedAt,
    });
  }

  activities.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return activities.slice(0, 10);
}

async function fetchUnpaidInvoices(businessId, limit = 10) {
  try {
    return await BusinessInvoice.findAll({
      where: { businessId, status: BILLING_INVOICE_STATUS.UNPAID },
      order: [['due_date', 'ASC'], ['id', 'DESC']],
      limit,
    });
  } catch (err) {
    if (String(err?.message || '').includes("doesn't exist")) return [];
    throw err;
  }
}

function formatInvoiceRow(row) {
  const json = row.toJSON ? row.toJSON() : row;
  return {
    id: json.invoiceCode || json.invoice_code,
    invoiceCode: json.invoiceCode || json.invoice_code,
    amount: formatMoneyVnd(json.amount),
    amountValue: Number(json.amount) || 0,
    due: json.dueDate || json.due_date
      ? `Hạn: ${formatDateVi(json.dueDate || json.due_date)}`
      : '—',
    dueDate: json.dueDate || json.due_date,
    status: json.status,
    statusLabel: json.status === BILLING_INVOICE_STATUS.PAID ? 'Đã thanh toán' : 'Chưa thanh toán',
    description: json.description || null,
  };
}

export async function getBusinessBillingDashboard({ businessId, credit }) {
  const allRequests = await collectAllRequests(businessId);
  const tabCounts = countByTab(allRequests);
  const creditUsedThisMonth = await getCreditUsedThisMonth(businessId);
  const processingRequestsCount = tabCounts[BILLING_REQUEST_TABS.PROCESSING] + tabCounts[BILLING_REQUEST_TABS.WAITING];

  const unpaidInvoices = await fetchUnpaidInvoices(businessId);

  const services = await buildServices(businessId);
  const activeServicesCount = services.filter((s) => s.status === 'Đang hoạt động' || s.status === 'Đang xử lý').length;

  const recentRequests = allRequests.slice(0, 5).map((item) => {
    const row = formatRequestRow(item);
    return {
      id: row.requestCode,
      title: row.type,
      sub: row.candidate !== '—' ? row.candidate : row.jd,
      date: row.created,
      status: row.status,
      statusBg: row.statusBg,
      statusColor: row.statusColor,
    };
  });

  const activities = await buildActivities(businessId);

  return {
    summary: {
      credit: Number(credit) || 0,
      creditLabel: `${Number(credit || 0).toLocaleString('vi-VN')} credit`,
      creditUsedThisMonth,
      creditUsedThisMonthLabel: `${creditUsedThisMonth.toLocaleString('vi-VN')} credit`,
      processingRequestsCount,
      activeServicesCount,
      unpaidInvoicesCount: unpaidInvoices.length,
    },
    services,
    recentRequests,
    unpaidInvoices: unpaidInvoices.map(formatInvoiceRow),
    activities,
    requestTabCounts: tabCounts,
  };
}

export async function listBusinessBillingTransactions({ businessId, page = 1, limit = 20 }) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const { count, rows } = await BusinessCreditHistory.findAndCountAll({
    where: { businessId },
    limit: safeLimit,
    offset,
    order: [['created_at', 'DESC']],
  });

  return {
    transactions: rows.map(formatTransactionRow),
    pagination: {
      total: count,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(count / safeLimit) || 0,
    },
  };
}

export async function listBusinessBillingRequests({
  businessId,
  page = 1,
  limit = 20,
  tab,
  type,
  search,
}) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);

  const allItems = await collectAllRequests(businessId);
  const tabCounts = countByTab(allItems);
  const filtered = filterRequests(allItems, { tab, type, search });
  const total = filtered.length;
  const offset = (safePage - 1) * safeLimit;
  const slice = filtered.slice(offset, offset + safeLimit);

  return {
    requests: slice.map(formatRequestRow),
    tabCounts,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 0,
      from: total === 0 ? 0 : offset + 1,
      to: Math.min(offset + safeLimit, total),
    },
  };
}

export async function listBusinessBillingInvoices({ businessId, page = 1, limit = 20, status }) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;
  const where = { businessId };
  if (status && String(status).trim()) where.status = String(status).trim();

  try {
    const { count, rows } = await BusinessInvoice.findAndCountAll({
      where,
      limit: safeLimit,
      offset,
      order: [['due_date', 'ASC'], ['id', 'DESC']],
    });

    return {
      invoices: rows.map(formatInvoiceRow),
      pagination: {
        total: count,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(count / safeLimit) || 0,
      },
    };
  } catch (err) {
    if (String(err?.message || '').includes("doesn't exist")) {
      return {
        invoices: [],
        pagination: { total: 0, page: safePage, limit: safeLimit, totalPages: 0 },
      };
    }
    throw err;
  }
}

export default {
  getBusinessBillingDashboard,
  listBusinessBillingTransactions,
  listBusinessBillingRequests,
  listBusinessBillingInvoices,
};
