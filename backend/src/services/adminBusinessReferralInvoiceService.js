import {
  JobApplication,
  Job,
  CVStorage,
  Business,
  BusinessInvoice,
  Message,
} from '../models/index.js';
import { STATUS_JOINED_COMPANY } from '../constants/jobApplicationStatus.js';
import { BILLING_INVOICE_STATUS } from '../constants/businessBilling.js';
import { collaboratorNotificationService } from './collaboratorNotificationService.js';

const META_PREFIX = '__wjs_meta__:';

function buildInvoiceCode(id, date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const ym = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `RF-${ym}-${String(id).padStart(4, '0')}`;
}

function buildInvoiceDescription({ jobCode, candidateName, jobApplicationId }) {
  const related = `Tiến cử ${jobCode || '—'} — ${candidateName || 'Ứng viên'}`;
  const meta = JSON.stringify({ jobApplicationId, paymentType: 'referral_fee' });
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

function formatInvoiceRow(row) {
  const json = row.toJSON ? row.toJSON() : row;
  const meta = parseInvoiceMeta(json.description);
  return {
    id: json.id,
    invoiceCode: json.invoiceCode || json.invoice_code,
    amount: Number(json.amount) || 0,
    status: json.status,
    dueDate: json.dueDate || json.due_date || null,
    description: json.description || null,
    relatedLabel: String(json.description || '').split('\n')[0] || null,
    jobApplicationId: meta?.jobApplicationId ?? null,
    createdAt: json.createdAt || json.created_at || null,
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

async function createReferralInvoiceChatMessage({ jobApplicationId, collaboratorId, amount, invoiceCode }) {
  if (!jobApplicationId) return null;
  const content = [
    '💼 **Admin đã tạo yêu cầu thanh toán phí giới thiệu**',
    invoiceCode ? `**Mã hóa đơn:** ${invoiceCode}` : '',
    amount != null ? `**Số tiền:** ${Number(amount).toLocaleString('vi-VN')} VNĐ` : '',
    'Doanh nghiệp vui lòng thanh toán theo hướng dẫn tại mục Billing.',
    '\n*Tin nhắn tự động từ hệ thống*',
  ].filter(Boolean).join('\n');

  try {
    return await Message.create({
      jobApplicationId,
      adminId: null,
      collaboratorId: collaboratorId || null,
      senderType: 3,
      content,
      isReadByAdmin: true,
      isReadByCollaborator: false,
      isReadByApplicant: false,
    });
  } catch (err) {
    console.error('[adminBusinessReferralInvoice] create chat message:', err);
    return null;
  }
}

export async function getBusinessReferralInvoiceForApplication(jobApplicationId) {
  const { businessId } = await loadJobApplicationContext(jobApplicationId);
  const row = await findInvoiceByJobApplicationId(businessId, jobApplicationId);
  return row ? formatInvoiceRow(row) : null;
}

export async function createBusinessReferralInvoice({ jobApplicationId, amount, adminId = null }) {
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
    description: buildInvoiceDescription({ jobCode, candidateName, jobApplicationId }),
  });

  invoice.invoiceCode = buildInvoiceCode(invoice.id);
  await invoice.save();

  await createReferralInvoiceChatMessage({
    jobApplicationId,
    collaboratorId: jobApplication.collaboratorId,
    amount: parsedAmount,
    invoiceCode: invoice.invoiceCode,
  });

  try {
    await collaboratorNotificationService.notifyBusinessReferralInvoiceCreated({
      businessId,
      amount: parsedAmount,
      jobCode,
      candidateName,
      invoiceId: invoice.id,
      jobApplicationId,
    });
  } catch (notifyErr) {
    console.error('[adminBusinessReferralInvoice] notify business:', notifyErr?.message || notifyErr);
  }

  return {
    invoice: formatInvoiceRow(invoice),
    adminId,
  };
}

export default {
  getBusinessReferralInvoiceForApplication,
  createBusinessReferralInvoice,
};
