import { Op } from 'sequelize';
import {
  JobApplication,
  Job,
  CVStorage,
  BusinessInvoice,
  Business,
} from '../models/index.js';
import { STATUS_JOINED_COMPANY, STATUS_PAID } from '../constants/jobApplicationStatus.js';
import { BILLING_INVOICE_STATUS } from '../constants/businessBilling.js';
import { collaboratorNotificationService } from './collaboratorNotificationService.js';

const META_PREFIX = '__wjs_meta__:';

function buildInvoiceCode(id, date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const ym = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `RF-${ym}-${String(id).padStart(4, '0')}`;
}

function buildInvoiceDescription({ jobCode, candidateName, jobTitle, jobApplicationId }) {
  const related = `Tiến cử ${jobCode || '—'} — ${candidateName || 'Ứng viên'}`;
  const meta = JSON.stringify({
    jobApplicationId,
    paymentType: 'referral_fee',
    candidateName: candidateName || null,
    jobCode: jobCode || null,
    jobTitle: jobTitle || null,
    feeBasis: 'Ứng viên đã vào công ty (xác nhận tiến cử)',
  });
  return `${related}\n${META_PREFIX}${meta}`;
}

function parseInvoiceMeta(description) {
  const text = String(description || '');
  const idx = text.indexOf(META_PREFIX);
  if (idx < 0) return null;
  try {
    return JSON.parse(text.slice(idx + META_PREFIX.length));
  } catch {
    return null;
  }
}

function stripInvoiceMetaLine(description) {
  const lines = String(description || '').split('\n');
  return lines.filter((line) => !line.includes(META_PREFIX)).join('\n').trim();
}

function mergeInvoiceMeta(description, patch) {
  const meta = { ...(parseInvoiceMeta(description) || {}), ...patch };
  const head = stripInvoiceMetaLine(description) || String(description || '').split('\n')[0] || '';
  return `${head}\n${META_PREFIX}${JSON.stringify(meta)}`;
}

function isReferralFeeInvoice(row) {
  const meta = parseInvoiceMeta(row.description);
  return meta?.paymentType === 'referral_fee';
}

function formatInvoiceRow(row) {
  const json = row.toJSON ? row.toJSON() : row;
  const meta = parseInvoiceMeta(json.description) || {};
  const business = json.business || {};
  return {
    id: json.id,
    businessId: json.businessId || json.business_id,
    businessName: business.companyName || business.company_name || null,
    invoiceCode: json.invoiceCode || json.invoice_code,
    amount: Number(json.amount) || 0,
    status: json.status,
    dueDate: json.dueDate || json.due_date || null,
    description: json.description || null,
    relatedLabel: stripInvoiceMetaLine(json.description) || String(json.description || '').split('\n')[0] || null,
    jobApplicationId: meta.jobApplicationId ?? null,
    candidateName: meta.candidateName || null,
    jobCode: meta.jobCode || null,
    jobTitle: meta.jobTitle || null,
    feeBasis: meta.feeBasis || null,
    businessConfirmedAt: meta.businessConfirmedAt || null,
    wsConfirmedAt: meta.wsConfirmedAt || null,
    createdAt: json.createdAt || json.created_at || null,
    updatedAt: json.updatedAt || json.updated_at || null,
    paidAt: json.paidAt || json.paid_at || null,
  };
}

async function loadJobApplicationContext(jobApplicationId) {
  const jobApplication = await JobApplication.findByPk(jobApplicationId, {
    include: [
      { model: Job, as: 'job', required: false, attributes: ['id', 'jobCode', 'title', 'businessId'] },
      { model: CVStorage, as: 'cv', required: false, attributes: ['id', 'name', 'code'] },
    ],
  });
  if (!jobApplication) {
    const err = new Error('Không tìm thấy đơn tiến cử');
    err.statusCode = 404;
    throw err;
  }
  const businessId = jobApplication.job?.businessId;
  if (!businessId) {
    const err = new Error('Đơn tiến cử chưa gắn doanh nghiệp');
    err.statusCode = 400;
    throw err;
  }
  return { jobApplication, businessId };
}

async function findInvoiceByJobApplicationId(businessId, jobApplicationId) {
  try {
    const rows = await BusinessInvoice.findAll({
      where: { businessId },
      order: [['id', 'DESC']],
    });
    return rows.find((row) => {
      const meta = parseInvoiceMeta(row.description);
      return meta?.jobApplicationId === Number(jobApplicationId);
    }) || null;
  } catch (err) {
    if (String(err?.message || '').includes("doesn't exist")) return null;
    throw err;
  }
}

export async function getBusinessReferralInvoiceForApplication(jobApplicationId) {
  const { businessId } = await loadJobApplicationContext(jobApplicationId);
  const row = await findInvoiceByJobApplicationId(businessId, jobApplicationId);
  return row ? formatInvoiceRow(row) : null;
}

export async function createBusinessReferralInvoice({ jobApplicationId, amount, adminId = null, wsSessionId = null }) {
  const parsedAmount = parseFloat(amount);
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    const err = new Error('Vui lòng nhập số tiền thanh toán hợp lệ');
    err.statusCode = 400;
    throw err;
  }

  const { jobApplication, businessId } = await loadJobApplicationContext(jobApplicationId);
  if (Number(jobApplication.status) < STATUS_JOINED_COMPANY) {
    const err = new Error('Chỉ tạo yêu cầu thanh toán khi ứng viên đã vào công ty');
    err.statusCode = 400;
    throw err;
  }

  const existing = await findInvoiceByJobApplicationId(businessId, jobApplicationId);
  if (existing && existing.status !== BILLING_INVOICE_STATUS.CANCELLED) {
    const err = new Error('Đã có yêu cầu thanh toán cho đơn tiến cử này');
    err.statusCode = 409;
    err.existingInvoice = formatInvoiceRow(existing);
    throw err;
  }

  const jobCode = jobApplication.job?.jobCode || String(jobApplicationId);
  const jobTitle = jobApplication.job?.title || null;
  const candidateName = jobApplication.cv?.name || null;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  const dueDateOnly = dueDate.toISOString().slice(0, 10);

  const invoice = await BusinessInvoice.create({
    businessId,
    invoiceCode: 'TEMP',
    amount: parsedAmount,
    currency: 'VND',
    status: BILLING_INVOICE_STATUS.UNPAID,
    dueDate: dueDateOnly,
    description: buildInvoiceDescription({ jobCode, candidateName, jobTitle, jobApplicationId }),
  });

  invoice.invoiceCode = buildInvoiceCode(invoice.id);
  await invoice.save();

  try {
    await collaboratorNotificationService.notifyBusinessReferralInvoiceCreated({
      businessId,
      amount: parsedAmount,
      jobCode,
      candidateName,
      invoiceId: invoice.id,
      jobApplicationId,
      wsSessionId,
    });
  } catch (notifyErr) {
    console.error('[adminBusinessReferralInvoice] notify business:', notifyErr?.message || notifyErr);
  }

  return {
    invoice: formatInvoiceRow(invoice),
    adminId,
    jobCode,
    candidateName,
    businessId,
  };
}

export async function listAdminReferralInvoices({
  page = 1,
  limit = 20,
  search = '',
  status = '',
  dateFrom = '',
  dateTo = '',
}) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);

  const rows = await BusinessInvoice.findAll({
    where: {
      description: { [Op.like]: '%"paymentType":"referral_fee"%' },
    },
    include: [{
      model: Business,
      as: 'business',
      required: false,
      attributes: ['id', 'companyName'],
    }],
    order: [['updated_at', 'DESC']],
  });

  let filtered = rows.filter(isReferralFeeInvoice);
  const q = String(search || '').trim().toLowerCase();
  if (q) {
    filtered = filtered.filter((row) => {
      const f = formatInvoiceRow(row);
      const haystack = [
        f.invoiceCode,
        f.businessName,
        f.candidateName,
        f.jobCode,
        f.jobTitle,
        f.relatedLabel,
        String(f.id),
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }
  if (status) {
    filtered = filtered.filter((row) => String(row.status || '').trim() === String(status).trim());
  }
  if (dateFrom) {
    const from = new Date(dateFrom);
    if (!Number.isNaN(from.getTime())) {
      filtered = filtered.filter((row) => new Date(row.createdAt || row.created_at) >= from);
    }
  }
  if (dateTo) {
    const to = new Date(dateTo);
    if (!Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((row) => new Date(row.createdAt || row.created_at) <= to);
    }
  }

  const total = filtered.length;
  const offset = (safePage - 1) * safeLimit;
  const pageRows = filtered.slice(offset, offset + safeLimit);
  const invoices = pageRows.map(formatInvoiceRow);

  const summary = {
    paid: { count: 0, amount: 0 },
    unpaid: { count: 0, amount: 0 },
    processing: { count: 0, amount: 0 },
  };
  filtered.forEach((row) => {
    const st = String(row.status || '').trim();
    const amt = Number(row.amount) || 0;
    if (st === BILLING_INVOICE_STATUS.PAID) {
      summary.paid.count += 1;
      summary.paid.amount += amt;
    } else if (st === BILLING_INVOICE_STATUS.PROCESSING) {
      summary.processing.count += 1;
      summary.processing.amount += amt;
    } else if (st === BILLING_INVOICE_STATUS.UNPAID) {
      summary.unpaid.count += 1;
      summary.unpaid.amount += amt;
    }
  });

  return {
    invoices,
    summary,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

export async function confirmAdminReferralInvoicePaid({ invoiceId, adminId = null, note = null }) {
  const invoice = await BusinessInvoice.findByPk(invoiceId, {
    include: [{
      model: Business,
      as: 'business',
      required: false,
      attributes: ['id', 'companyName'],
    }],
  });
  if (!invoice || !isReferralFeeInvoice(invoice)) {
    const err = new Error('Không tìm thấy yêu cầu thanh toán phí giới thiệu');
    err.statusCode = 404;
    throw err;
  }
  if (invoice.status !== BILLING_INVOICE_STATUS.PROCESSING) {
    const err = new Error('Chỉ xác nhận hoàn tất khi doanh nghiệp đã xác nhận chuyển khoản (Đang xác nhận)');
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();
  const nowIso = now.toISOString();
  invoice.status = BILLING_INVOICE_STATUS.PAID;
  invoice.paidAt = now;
  invoice.description = mergeInvoiceMeta(invoice.description, {
    wsConfirmedAt: nowIso,
    wsConfirmedByAdminId: adminId || null,
    wsConfirmNote: note != null && String(note).trim() !== '' ? String(note).trim() : null,
  });
  await invoice.save();

  const formatted = formatInvoiceRow(invoice);
  const jobApplicationId = formatted.jobApplicationId;

  if (jobApplicationId) {
    try {
      const jobApplication = await JobApplication.findByPk(jobApplicationId);
      if (jobApplication && Number(jobApplication.status) >= STATUS_JOINED_COMPANY && Number(jobApplication.status) < STATUS_PAID) {
        jobApplication.status = STATUS_PAID;
        await jobApplication.save();
      }
    } catch (appErr) {
      console.error('[adminBusinessReferralInvoice] update job application paid:', appErr?.message || appErr);
    }
  }

  try {
    const { syncWsChatAfterAdminReferralInvoicePaid } = await import('./businessWsChatService.js');
    await syncWsChatAfterAdminReferralInvoicePaid({
      businessId: invoice.businessId,
      invoiceId: invoice.id,
      invoiceCode: formatted.invoiceCode,
      amount: formatted.amount,
      candidateName: formatted.candidateName,
      jobCode: formatted.jobCode,
      jobApplicationId,
      adminId,
    });
  } catch (syncErr) {
    console.error('[adminBusinessReferralInvoice] ws chat sync:', syncErr?.message || syncErr);
  }

  return { invoice: formatted };
}

export async function getBusinessReferralInvoiceForOwnedApplication({ businessId, applicationId }) {
  const owned = await JobApplication.findOne({
    where: { id: applicationId },
    include: [{ model: Job, as: 'job', required: true, attributes: ['id', 'businessId'] }],
  });
  if (!owned?.job || Number(owned.job.businessId) !== Number(businessId)) {
    const err = new Error('Không tìm thấy đơn tiến cử');
    err.statusCode = 404;
    throw err;
  }
  const row = await findInvoiceByJobApplicationId(businessId, applicationId);
  return row ? formatInvoiceRow(row) : null;
}

export default {
  getBusinessReferralInvoiceForApplication,
  getBusinessReferralInvoiceForOwnedApplication,
  createBusinessReferralInvoice,
  listAdminReferralInvoices,
  confirmAdminReferralInvoicePaid,
};
