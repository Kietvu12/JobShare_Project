import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  Admin,
  Business,
  BusinessCreditRequest,
} from '../models/index.js';
import {
  adjustBusinessCredit,
  CREDIT_HISTORY_TYPES,
  CREDIT_REFERENCE_TYPES,
} from './businessCreditService.js';
import { CREDIT_REQUEST_STATUS } from '../constants/businessBilling.js';

function buildRequestCode(id, date) {
  const d = date ? new Date(date) : new Date();
  const ym = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `CR-${ym}-${String(id).padStart(3, '0')}`;
}

function formatCreditRequestRow(row) {
  const json = row.toJSON ? row.toJSON() : row;
  const business = json.business || {};
  const admin = json.handledByAdmin || {};
  return {
    id: json.id,
    requestCode: json.requestCode || json.request_code,
    businessId: json.businessId,
    amount: Number(json.amount) || 0,
    note: json.note || null,
    paymentMethod: json.paymentMethod || json.payment_method || null,
    status: json.status,
    adminNote: json.adminNote || json.admin_note || null,
    creditHistoryId: json.creditHistoryId || json.credit_history_id || null,
    requestedAt: json.requestedAt || json.requested_at || json.createdAt || json.created_at,
    handledAt: json.handledAt || json.handled_at || null,
    createdAt: json.createdAt || json.created_at,
    updatedAt: json.updatedAt || json.updated_at,
    business: business.id
      ? {
          id: business.id,
          companyName: business.companyName || null,
          contactName: business.contactName || null,
          email: business.email || null,
        }
      : null,
    handledByAdmin: admin.id
      ? { id: admin.id, name: admin.name || admin.email }
      : null,
  };
}

export async function createBusinessCreditRequest({ businessId, amount, note, paymentMethod }) {
  const creditAmount = Math.trunc(Number(amount));
  if (!Number.isFinite(creditAmount) || creditAmount <= 0) {
    const err = new Error('Số credit yêu cầu phải lớn hơn 0');
    err.statusCode = 400;
    throw err;
  }

  const pending = await BusinessCreditRequest.findOne({
    where: { businessId, status: CREDIT_REQUEST_STATUS.PENDING },
  });
  if (pending) {
    const err = new Error('Bạn đã có yêu cầu nạp credit đang chờ duyệt. Vui lòng đợi WS xử lý hoặc hủy yêu cầu cũ.');
    err.statusCode = 409;
    throw err;
  }

  const now = new Date();
  const request = await BusinessCreditRequest.create({
    businessId,
    requestCode: `CR-TMP-${Date.now()}`,
    amount: creditAmount,
    note: note ? String(note).trim() : null,
    paymentMethod: paymentMethod ? String(paymentMethod).trim() : 'bank_transfer',
    status: CREDIT_REQUEST_STATUS.PENDING,
    requestedAt: now,
  });

  const requestCode = buildRequestCode(request.id, now);
  await request.update({ requestCode });

  return formatCreditRequestRow(await request.reload());
}

export async function listBusinessCreditRequests({
  businessId,
  page = 1,
  limit = 20,
  status,
}) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;
  const where = { businessId };
  if (status && String(status).trim()) where.status = String(status).trim();

  const { count, rows } = await BusinessCreditRequest.findAndCountAll({
    where,
    limit: safeLimit,
    offset,
    order: [['requested_at', 'DESC'], ['id', 'DESC']],
  });

  return {
    requests: rows.map(formatCreditRequestRow),
    pagination: {
      total: count,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(count / safeLimit) || 0,
    },
  };
}

export async function listAdminCreditRequests({ page = 1, limit = 20, status, search }) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;
  const where = {};
  if (status && String(status).trim()) where.status = String(status).trim();

  const businessWhere = {};
  if (search && String(search).trim()) {
    const q = String(search).trim();
    const like = `%${q}%`;
    businessWhere[Op.or] = [
      { companyName: { [Op.like]: like } },
      { contactName: { [Op.like]: like } },
      { email: { [Op.like]: like } },
    ];
  }

  const { count, rows } = await BusinessCreditRequest.findAndCountAll({
    where,
    include: [
      {
        model: Business,
        as: 'business',
        required: Object.keys(businessWhere).length > 0,
        where: Object.keys(businessWhere).length ? businessWhere : undefined,
        attributes: ['id', 'companyName', 'contactName', 'email', 'credit'],
      },
      {
        model: Admin,
        as: 'handledByAdmin',
        required: false,
        attributes: ['id', 'name', 'email'],
      },
    ],
    limit: safeLimit,
    offset,
    order: [['requested_at', 'DESC'], ['id', 'DESC']],
    distinct: true,
  });

  return {
    requests: rows.map(formatCreditRequestRow),
    pagination: {
      total: count,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(count / safeLimit) || 0,
    },
  };
}

export async function approveBusinessCreditRequest({ requestId, adminId, adminNote }) {
  const transaction = await sequelize.transaction();
  try {
    const request = await BusinessCreditRequest.findByPk(requestId, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    if (!request) {
      const err = new Error('Không tìm thấy yêu cầu nạp credit');
      err.statusCode = 404;
      throw err;
    }
    if (request.status !== CREDIT_REQUEST_STATUS.PENDING) {
      const err = new Error('Yêu cầu đã được xử lý');
      err.statusCode = 400;
      throw err;
    }

    const result = await adjustBusinessCredit({
      businessId: request.businessId,
      changeAmount: request.amount,
      type: CREDIT_HISTORY_TYPES.ADMIN_GRANT,
      note: request.note || `Duyệt yêu cầu nạp credit ${request.requestCode}`,
      adminId: adminId || null,
      referenceType: CREDIT_REFERENCE_TYPES.CREDIT_REQUEST,
      referenceId: request.id,
      transaction,
    });

    await request.update(
      {
        status: CREDIT_REQUEST_STATUS.APPROVED,
        adminId: adminId || null,
        adminNote: adminNote ? String(adminNote).trim() : null,
        creditHistoryId: result.history.id,
        handledAt: new Date(),
      },
      { transaction },
    );

    await transaction.commit();
    return formatCreditRequestRow(await BusinessCreditRequest.findByPk(request.id, {
      include: [
        { model: Business, as: 'business', attributes: ['id', 'companyName', 'contactName', 'email'] },
        { model: Admin, as: 'handledByAdmin', attributes: ['id', 'name', 'email'] },
      ],
    }));
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function rejectBusinessCreditRequest({ requestId, adminId, adminNote }) {
  const request = await BusinessCreditRequest.findByPk(requestId);
  if (!request) {
    const err = new Error('Không tìm thấy yêu cầu nạp credit');
    err.statusCode = 404;
    throw err;
  }
  if (request.status !== CREDIT_REQUEST_STATUS.PENDING) {
    const err = new Error('Yêu cầu đã được xử lý');
    err.statusCode = 400;
    throw err;
  }

  await request.update({
    status: CREDIT_REQUEST_STATUS.REJECTED,
    adminId: adminId || null,
    adminNote: adminNote ? String(adminNote).trim() : null,
    handledAt: new Date(),
  });

  return formatCreditRequestRow(request);
}

const creditRequestIncludes = [
  {
    model: Business,
    as: 'business',
    attributes: ['id', 'companyName', 'contactName', 'email', 'credit'],
  },
  {
    model: Admin,
    as: 'handledByAdmin',
    required: false,
    attributes: ['id', 'name', 'email'],
  },
];

async function findCreditRequestById(requestId, { businessId, transaction } = {}) {
  const where = { id: requestId };
  if (businessId) where.businessId = businessId;

  return BusinessCreditRequest.findOne({
    where,
    include: creditRequestIncludes,
    transaction,
  });
}

function assertPendingRequest(request) {
  if (!request) {
    const err = new Error('Không tìm thấy yêu cầu nạp credit');
    err.statusCode = 404;
    throw err;
  }
  if (request.status !== CREDIT_REQUEST_STATUS.PENDING) {
    const err = new Error('Chỉ có thể thao tác với yêu cầu đang chờ duyệt');
    err.statusCode = 400;
    throw err;
  }
}

export async function getBusinessCreditRequestById({ requestId, businessId }) {
  const request = await findCreditRequestById(requestId, { businessId });
  if (!request) {
    const err = new Error('Không tìm thấy yêu cầu nạp credit');
    err.statusCode = 404;
    throw err;
  }
  return formatCreditRequestRow(request);
}

export async function updateBusinessCreditRequest({
  requestId,
  businessId,
  amount,
  note,
  paymentMethod,
}) {
  const request = await BusinessCreditRequest.findOne({
    where: { id: requestId, ...(businessId ? { businessId } : {}) },
  });
  assertPendingRequest(request);

  const creditAmount = Math.trunc(Number(amount));
  if (!Number.isFinite(creditAmount) || creditAmount <= 0) {
    const err = new Error('Số credit yêu cầu phải lớn hơn 0');
    err.statusCode = 400;
    throw err;
  }

  await request.update({
    amount: creditAmount,
    note: note != null ? (note ? String(note).trim() : null) : request.note,
    paymentMethod: paymentMethod != null
      ? String(paymentMethod).trim()
      : request.paymentMethod,
  });

  return formatCreditRequestRow(await findCreditRequestById(request.id));
}

export async function cancelBusinessCreditRequest({ requestId, businessId, adminId }) {
  const request = await BusinessCreditRequest.findOne({
    where: { id: requestId, ...(businessId ? { businessId } : {}) },
  });
  assertPendingRequest(request);

  await request.update({
    status: CREDIT_REQUEST_STATUS.CANCELLED,
    adminId: adminId || null,
    handledAt: new Date(),
  });

  return formatCreditRequestRow(await findCreditRequestById(request.id));
}

export default {
  createBusinessCreditRequest,
  listBusinessCreditRequests,
  listAdminCreditRequests,
  getBusinessCreditRequestById,
  updateBusinessCreditRequest,
  cancelBusinessCreditRequest,
  approveBusinessCreditRequest,
  rejectBusinessCreditRequest,
};
