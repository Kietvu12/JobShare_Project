import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  Admin,
  Business,
  BusinessSavedCandidate,
  BusinessScoutPerformanceRequest,
  BusinessScoutUnlock,
  CVStorage,
  Collaborator,
  JobCategory,
} from '../models/index.js';
import {
  SCOUT_LISTING_STATUS,
  SCOUT_PERFORMANCE_REQUEST_STATUS,
  SCOUT_UNLOCK_TYPES,
  canCvBeListedOnScout,
} from '../constants/scoutCredit.js';
import { collaboratorNotificationService } from './collaboratorNotificationService.js';

const ANONYMOUS_LABEL = 'Ứng viên ẩn danh';

function formatRequestRow(row) {
  const json = row.toJSON ? row.toJSON() : row;
  const cv = json.cv || {};
  const business = json.business || {};
  return {
    id: json.id,
    businessId: json.businessId,
    cvId: json.cvId,
    status: json.status,
    message: json.message || null,
    adminNote: json.adminNote || null,
    requestedAt: json.requestedAt || json.createdAt || null,
    handledAt: json.handledAt || null,
    scoutUnlockId: json.scoutUnlockId || null,
    business: business.id
      ? {
          id: business.id,
          companyName: business.companyName || null,
          contactName: business.contactName || null,
        }
      : null,
    cv: cv.id
      ? {
          id: cv.id,
          code: cv.code || null,
          name: cv.name || null,
          anonymousLabel: ANONYMOUS_LABEL,
          desiredPosition: cv.desiredPosition || null,
          collaboratorId: cv.collaboratorId || null,
          jobCategory: cv.jobCategory || null,
        }
      : null,
    handledByAdmin: json.handledByAdmin
      ? { id: json.handledByAdmin.id, name: json.handledByAdmin.name || json.handledByAdmin.email }
      : null,
    handledByCollaborator: json.handledByCollaborator
      ? { id: json.handledByCollaborator.id, name: json.handledByCollaborator.name }
      : null,
  };
}

async function notifyScoutPerformanceRequestCreated({ request, business, cv }) {
  const companyName = business?.companyName || 'Doanh nghiệp';
  const cvLabel = cv?.code ? `CV ${cv.code}` : `CV #${cv?.id || request.cvId}`;
  const content = `${companyName} gửi yêu cầu Scout Performance mở hồ sơ ${cvLabel} trên sàn Scout.`;

  const admins = await Admin.findAll({
    where: { isActive: true, status: 1, role: { [Op.in]: [1, 2] } },
    attributes: ['id'],
  });
  for (const admin of admins) {
    await collaboratorNotificationService.createAndEmit({
      collaboratorId: null,
      adminId: admin.id,
      title: 'Yêu cầu Scout Performance mới',
      content,
      jobId: null,
      url: `/admin/scout-performance?requestId=${request.id}`,
    });
  }

  const collaboratorId = cv?.collaboratorId || cv?.scoutListedByCollaboratorId;
  if (collaboratorId) {
    await collaboratorNotificationService.createAndEmit({
      collaboratorId,
      adminId: null,
      title: 'Yêu cầu Scout Performance',
      content: `${companyName} yêu cầu mở hồ sơ ứng viên của bạn trên Scout (Performance).`,
      jobId: null,
      url: `/agent/scout-performance?requestId=${request.id}`,
    });
  }
}

async function assertCvCanRequestPerformance(cv) {
  if (!cv || !canCvBeListedOnScout(cv)) {
    const err = new Error('Hồ sơ không còn hợp lệ trên sàn Scout');
    err.statusCode = 400;
    throw err;
  }
  if (Number(cv.scoutStatus) !== SCOUT_LISTING_STATUS.LISTED) {
    const err = new Error('Hồ sơ không còn trên sàn Scout');
    err.statusCode = 400;
    throw err;
  }
}

async function assertNotAlreadyUnlocked(businessId, cvId) {
  const existing = await BusinessScoutUnlock.findOne({ where: { businessId, cvId } });
  if (existing) {
    const err = new Error('Doanh nghiệp đã mở hồ sơ này trước đó');
    err.statusCode = 400;
    throw err;
  }
}

function buildCtvCvAccessWhere(collaboratorId) {
  return {
    [Op.or]: [
      { collaboratorId },
      { scoutListedByCollaboratorId: collaboratorId },
    ],
  };
}

export async function createScoutPerformanceRequest({ businessId, cvId, message }) {
  const cv = await CVStorage.findByPk(cvId);
  await assertCvCanRequestPerformance(cv);
  await assertNotAlreadyUnlocked(businessId, cvId);

  const pending = await BusinessScoutPerformanceRequest.findOne({
    where: {
      businessId,
      cvId,
      status: SCOUT_PERFORMANCE_REQUEST_STATUS.PENDING,
    },
  });
  if (pending) {
    const err = new Error('Đã có yêu cầu Scout Performance đang chờ duyệt');
    err.statusCode = 400;
    throw err;
  }

  const business = await Business.findByPk(businessId, {
    attributes: ['id', 'companyName', 'contactName'],
  });

  const request = await BusinessScoutPerformanceRequest.create({
    businessId,
    cvId,
    status: SCOUT_PERFORMANCE_REQUEST_STATUS.PENDING,
    message: message?.trim() || null,
    requestedAt: new Date(),
  });

  try {
    await notifyScoutPerformanceRequestCreated({ request, business, cv });
  } catch (notifyErr) {
    console.error('[ScoutPerformance] notify error:', notifyErr);
  }

  return formatRequestRow({
    ...request.toJSON(),
    business: business?.toJSON?.() || business,
    cv: cv.toJSON(),
  });
}

export async function getPendingPerformanceRequestForBusiness({ businessId, cvId }) {
  const row = await BusinessScoutPerformanceRequest.findOne({
    where: {
      businessId,
      cvId,
      status: SCOUT_PERFORMANCE_REQUEST_STATUS.PENDING,
    },
    order: [['id', 'DESC']],
  });
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    message: row.message,
    requestedAt: row.requestedAt || row.createdAt,
  };
}

export async function listScoutPerformanceRequests({
  page = 1,
  limit = 20,
  status,
  search,
  businessId,
  collaboratorId,
}) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const where = {};
  if (businessId) where.businessId = businessId;
  if (status && String(status).trim()) where.status = String(status).trim();

  const cvWhereParts = [];
  if (collaboratorId) cvWhereParts.push(buildCtvCvAccessWhere(collaboratorId));
  if (search && String(search).trim()) {
    const q = String(search).trim();
    const like = `%${q}%`;
    cvWhereParts.push({
      [Op.or]: [
        { code: { [Op.like]: like } },
        { name: { [Op.like]: like } },
        { desiredPosition: { [Op.like]: like } },
      ],
    });
  }
  let cvWhere;
  if (cvWhereParts.length === 1) cvWhere = cvWhereParts[0];
  else if (cvWhereParts.length > 1) cvWhere = { [Op.and]: cvWhereParts };

  const businessWhere = {};
  if (search && String(search).trim()) {
    const q = String(search).trim();
    const like = `%${q}%`;
    businessWhere[Op.or] = [
      { companyName: { [Op.like]: like } },
      { contactName: { [Op.like]: like } },
    ];
  }

  const { count, rows } = await BusinessScoutPerformanceRequest.findAndCountAll({
    where,
    include: [
      {
        model: Business,
        as: 'business',
        required: Object.keys(businessWhere).length > 0,
        where: Object.keys(businessWhere).length ? businessWhere : undefined,
        attributes: ['id', 'companyName', 'contactName'],
      },
      {
        model: CVStorage,
        as: 'cv',
        required: true,
        where: cvWhere || undefined,
        include: [
          {
            model: JobCategory,
            as: 'jobCategory',
            required: false,
            attributes: ['id', 'name', 'nameEn', 'nameJp', 'slug'],
          },
        ],
      },
      {
        model: Admin,
        as: 'handledByAdmin',
        required: false,
        attributes: ['id', 'name', 'email'],
      },
      {
        model: Collaborator,
        as: 'handledByCollaborator',
        required: false,
        attributes: ['id', 'name'],
      },
    ],
    limit: safeLimit,
    offset,
    order: [['requestedAt', 'DESC'], ['id', 'DESC']],
    distinct: true,
  });

  return {
    requests: rows.map(formatRequestRow),
    pagination: {
      total: count,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(count / safeLimit) || 0,
    },
  };
}

async function loadRequestForAction(requestId, transaction) {
  const request = await BusinessScoutPerformanceRequest.findByPk(requestId, {
    include: [
      { model: Business, as: 'business', attributes: ['id', 'companyName'] },
      { model: CVStorage, as: 'cv' },
    ],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!request) {
    const err = new Error('Không tìm thấy yêu cầu Scout Performance');
    err.statusCode = 404;
    throw err;
  }
  if (request.status !== SCOUT_PERFORMANCE_REQUEST_STATUS.PENDING) {
    const err = new Error('Yêu cầu đã được xử lý');
    err.statusCode = 400;
    throw err;
  }
  return request;
}

function assertCtvCanHandleRequest(request, collaboratorId) {
  const cv = request.cv;
  const ownerId = Number(cv?.collaboratorId);
  const listedById = Number(cv?.scoutListedByCollaboratorId);
  const ctvId = Number(collaboratorId);
  if (ownerId !== ctvId && listedById !== ctvId) {
    const err = new Error('Bạn không có quyền xử lý yêu cầu này');
    err.statusCode = 403;
    throw err;
  }
}

async function performScoutPerformanceUnlock({ businessId, cvId, transaction }) {
  let unlock = await BusinessScoutUnlock.findOne({
    where: { businessId, cvId },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!unlock) {
    unlock = await BusinessScoutUnlock.create(
      {
        businessId,
        cvId,
        unlockType: SCOUT_UNLOCK_TYPES.SCOUT_PERFORMANCE,
        creditCost: 0,
        unlockedAt: new Date(),
      },
      { transaction },
    );
  }

  const [saved, created] = await BusinessSavedCandidate.findOrCreate({
    where: { businessId, cvId },
    defaults: {
      source: SCOUT_UNLOCK_TYPES.SCOUT_PERFORMANCE,
      scoutUnlockId: unlock.id,
      pipelineStatus: 'new',
      savedAt: new Date(),
    },
    transaction,
  });

  if (!created) {
    await saved.update(
      {
        source: SCOUT_UNLOCK_TYPES.SCOUT_PERFORMANCE,
        scoutUnlockId: unlock.id,
      },
      { transaction },
    );
  }

  return unlock;
}

export async function approveScoutPerformanceRequest({
  requestId,
  adminId = null,
  collaboratorId = null,
  note,
}) {
  return sequelize.transaction(async (transaction) => {
    const request = await loadRequestForAction(requestId, transaction);
    if (collaboratorId) assertCtvCanHandleRequest(request, collaboratorId);

    const unlock = await performScoutPerformanceUnlock({
      businessId: request.businessId,
      cvId: request.cvId,
      transaction,
    });

    await request.update(
      {
        status: SCOUT_PERFORMANCE_REQUEST_STATUS.APPROVED,
        adminNote: note?.trim() || null,
        handledByAdminId: adminId || null,
        handledByCollaboratorId: collaboratorId || null,
        scoutUnlockId: unlock.id,
        handledAt: new Date(),
      },
      { transaction },
    );

    return formatRequestRow(await request.reload({
      include: [
        { model: Business, as: 'business', attributes: ['id', 'companyName', 'contactName'] },
        {
          model: CVStorage,
          as: 'cv',
          include: [{ model: JobCategory, as: 'jobCategory', required: false }],
        },
      ],
      transaction,
    }));
  });
}

export async function rejectScoutPerformanceRequest({
  requestId,
  adminId = null,
  collaboratorId = null,
  note,
}) {
  return sequelize.transaction(async (transaction) => {
    const request = await loadRequestForAction(requestId, transaction);
    if (collaboratorId) assertCtvCanHandleRequest(request, collaboratorId);

    await request.update(
      {
        status: SCOUT_PERFORMANCE_REQUEST_STATUS.REJECTED,
        adminNote: note?.trim() || null,
        handledByAdminId: adminId || null,
        handledByCollaboratorId: collaboratorId || null,
        handledAt: new Date(),
      },
      { transaction },
    );

    return formatRequestRow(await request.reload({
      include: [
        { model: Business, as: 'business', attributes: ['id', 'companyName', 'contactName'] },
        {
          model: CVStorage,
          as: 'cv',
          include: [{ model: JobCategory, as: 'jobCategory', required: false }],
        },
      ],
      transaction,
    }));
  });
}

export default {
  createScoutPerformanceRequest,
  getPendingPerformanceRequestForBusiness,
  listScoutPerformanceRequests,
  approveScoutPerformanceRequest,
  rejectScoutPerformanceRequest,
};
