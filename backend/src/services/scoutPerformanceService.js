import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  Admin,
  Business,
  BusinessSavedCandidate,
  BusinessScoutPerformanceRecommendation,
  BusinessScoutPerformanceRequest,
  BusinessScoutUnlock,
  BusinessWsChatSession,
  BusinessWsChatMessage,
  CVStorage,
  Collaborator,
  JobCategory,
} from '../models/index.js';
import {
  SCOUT_LISTING_STATUS,
  SCOUT_PERFORMANCE_EXPLORE_STATUS,
  SCOUT_PERFORMANCE_RECOMMENDATION_SOURCES,
  SCOUT_PERFORMANCE_REQUEST_STATUS,
  SCOUT_UNLOCK_TYPES,
  canCvBeListedOnScout,
} from '../constants/scoutCredit.js';
import { buildPerformanceUnlockedScoutPayload } from './businessScoutService.js';
import { collaboratorNotificationService } from './collaboratorNotificationService.js';
import {
  createWsChatPerformanceOpenedMessage,
  createWsChatSimilarCandidatesRequestMessage,
  ensureWsChatSessionForPerformanceRequest,
  hasWsChatMessageForRequest,
  WS_CHAT_MESSAGE_TYPES,
} from './businessWsChatService.js';

const ANONYMOUS_LABEL = 'Ứng viên ẩn danh';

function inferRecommendationSource(cv) {
  if (Number(cv?.scoutStatus) === SCOUT_LISTING_STATUS.LISTED) {
    return SCOUT_PERFORMANCE_RECOMMENDATION_SOURCES.SCOUT;
  }
  if (cv?.collaboratorId) {
    return SCOUT_PERFORMANCE_RECOMMENDATION_SOURCES.CTV;
  }
  return SCOUT_PERFORMANCE_RECOMMENDATION_SOURCES.SYSTEM;
}

function formatRecommendationRow(row) {
  const json = row.toJSON ? row.toJSON() : row;
  const cv = json.cv || {};
  const cvJson = cv.toJSON ? cv.toJSON() : cv;
  return {
    id: json.id,
    requestId: json.requestId,
    cvId: json.cvId,
    source: json.source || SCOUT_PERFORMANCE_RECOMMENDATION_SOURCES.SYSTEM,
    adminNote: json.adminNote || null,
    sortOrder: json.sortOrder ?? 0,
    candidate: cvJson?.id ? buildPerformanceUnlockedScoutPayload({ ...cvJson, jobCategory: cvJson.jobCategory }) : null,
  };
}

function formatRequestRow(row, { includeRecommendations = false } = {}) {
  const json = row.toJSON ? row.toJSON() : row;
  const cv = json.cv || {};
  const business = json.business || {};
  const out = {
    id: json.id,
    businessId: json.businessId,
    cvId: json.cvId,
    status: json.status,
    message: json.message || null,
    adminNote: json.adminNote || null,
    requestedAt: json.requestedAt || json.createdAt || null,
    handledAt: json.handledAt || null,
    scoutUnlockId: json.scoutUnlockId || null,
    businessViewedAt: json.businessViewedAt || null,
    businessExploreStatus: json.businessExploreStatus || null,
    wantsSimilarCandidates: !!json.wantsSimilarCandidates,
    recommendationCount: json.recommendations?.length ?? json.recommendationCount ?? 0,
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
  if (includeRecommendations && Array.isArray(json.recommendations)) {
    out.recommendations = json.recommendations.map(formatRecommendationRow);
  }
  return out;
}

async function notifySimilarCandidatesRequested({ request, business, cv, sessionId }) {
  const companyName = business?.companyName || 'Doanh nghiệp';
  const cvLabel = cv?.code ? `CV ${cv.code}` : `CV #${cv?.id || request.cvId}`;
  const content = `${companyName} muốn WS tìm thêm ứng viên tương tự hồ sơ ${cvLabel}.`;
  const adminUrl = sessionId
    ? `/admin/public-ctv-chat?tab=business&sessionId=${sessionId}`
    : `/admin/scout-performance?requestId=${request.id}`;

  const admins = await Admin.findAll({
    where: { isActive: true, status: 1, role: { [Op.in]: [1, 2] } },
    attributes: ['id'],
  });
  for (const admin of admins) {
    await collaboratorNotificationService.createAndEmit({
      collaboratorId: null,
      adminId: admin.id,
      title: 'Scout Performance — tìm ứng viên tương tự',
      content,
      jobId: null,
      url: adminUrl,
    });
  }
}

async function notifyScoutPerformanceRequestCreated({ request, business, cv, sessionId }) {
  const companyName = business?.companyName || 'Doanh nghiệp';
  const cvLabel = cv?.code ? `CV ${cv.code}` : `CV #${cv?.id || request.cvId}`;
  const content = `${companyName} gửi yêu cầu Scout Performance từ hồ sơ ${cvLabel} trên sàn Scout.`;
  const adminUrl = sessionId
    ? `/admin/public-ctv-chat?tab=business&sessionId=${sessionId}`
    : `/admin/scout-performance?requestId=${request.id}`;

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
      url: adminUrl,
    });
  }

  const collaboratorId = cv?.collaboratorId || cv?.scoutListedByCollaboratorId;
  if (collaboratorId) {
    await collaboratorNotificationService.createAndEmit({
      collaboratorId,
      adminId: null,
      title: 'Yêu cầu Scout Performance',
      content: `${companyName} yêu cầu dịch vụ Scout Performance cho ứng viên của bạn.`,
      jobId: null,
      url: `/agent/scout-performance?requestId=${request.id}`,
    });
  }
}

async function notifyBusinessScoutPerformanceApproved({ request, business, recommendationCount, sessionId }) {
  const countLabel = recommendationCount > 0
    ? `${recommendationCount} ứng viên phù hợp`
    : 'các lựa chọn phù hợp';
  const url = sessionId
    ? `/business/messages?tab=ws&sessionId=${sessionId}`
    : `/business/scout?performanceRequestId=${request.id}`;
  await collaboratorNotificationService.createAndEmit({
    businessId: request.businessId,
    collaboratorId: null,
    adminId: null,
    title: 'Scout Performance — có gợi ý mới',
    content: `JobShare WS đã chuẩn bị ${countLabel} cho ${business?.companyName || 'doanh nghiệp'}. Bấm để xem chi tiết.`,
    jobId: null,
    url,
  });
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

async function assertNotAlreadyUnlockedViaCredit(businessId, cvId) {
  const existing = await BusinessScoutUnlock.findOne({ where: { businessId, cvId } });
  if (existing && existing.unlockType !== SCOUT_UNLOCK_TYPES.SCOUT_PERFORMANCE) {
    const err = new Error('Doanh nghiệp đã mở hồ sơ này bằng Scout Credit');
    err.statusCode = 400;
    throw err;
  }
  return existing;
}

export async function createScoutPerformanceRequest({ businessId, cvId, message }) {
  const cv = await CVStorage.findByPk(cvId, {
    include: [{ model: JobCategory, as: 'jobCategory', required: false }],
  });
  await assertCvCanRequestPerformance(cv);
  const existingUnlock = await assertNotAlreadyUnlockedViaCredit(businessId, cvId);

  const business = await Business.findByPk(businessId, {
    attributes: ['id', 'companyName', 'contactName'],
  });

  const result = await sequelize.transaction(async (transaction) => {
    let unlock = existingUnlock;
    if (!unlock) {
      unlock = await performScoutPerformanceUnlock({ businessId, cvId, transaction });
    }

    let request = await BusinessScoutPerformanceRequest.findOne({
      where: { businessId, cvId },
      order: [['id', 'DESC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!request) {
      request = await BusinessScoutPerformanceRequest.create({
        businessId,
        cvId,
        status: SCOUT_PERFORMANCE_REQUEST_STATUS.APPROVED,
        scoutUnlockId: unlock.id,
        requestedAt: new Date(),
        handledAt: new Date(),
        message: message?.trim() || null,
        wantsSimilarCandidates: false,
      }, { transaction });
    } else {
      await request.update({
        status: SCOUT_PERFORMANCE_REQUEST_STATUS.APPROVED,
        scoutUnlockId: unlock.id,
        handledAt: request.handledAt || new Date(),
        requestedAt: request.requestedAt || new Date(),
        message: message?.trim() || request.message || null,
      }, { transaction });
    }

    await createRecommendationsForRequest({
      requestId: request.id,
      cvIds: [Number(cvId)],
      transaction,
    });

    return { request, unlock };
  });

  let session = null;
  try {
    session = await ensureWsChatSessionForPerformanceRequest({
      request: result.request,
      business,
      cv,
    });

    const openedExists = await hasWsChatMessageForRequest({
      sessionId: session.id,
      messageType: WS_CHAT_MESSAGE_TYPES.PERFORMANCE_OPENED,
      requestId: result.request.id,
    });
    if (!openedExists) {
      await createWsChatPerformanceOpenedMessage({
        sessionId: session.id,
        businessId,
        request: result.request,
        cv,
      });
    }
  } catch (chatError) {
    console.error('[ScoutPerformance] ws chat sync after open failed:', chatError);
  }

  const { getUnlockedCandidateForBusiness } = await import('./businessScoutService.js');
  const detail = await getUnlockedCandidateForBusiness({ businessId, cvId });

  return {
    ...formatRequestRow({
      ...result.request.toJSON(),
      business: business?.toJSON?.() || business,
      cv: cv.toJSON(),
    }),
    sessionId: session?.id || null,
    candidate: detail.candidate,
    wantsSimilarCandidates: !!result.request.wantsSimilarCandidates,
  };
}

export async function requestSimilarScoutPerformanceCandidates({
  businessId,
  requestId,
  message,
}) {
  const request = await BusinessScoutPerformanceRequest.findOne({
    where: {
      id: requestId,
      businessId,
    },
    include: [
      { model: Business, as: 'business', attributes: ['id', 'companyName', 'contactName'] },
      {
        model: CVStorage,
        as: 'cv',
        include: [{ model: JobCategory, as: 'jobCategory', required: false }],
      },
    ],
  });
  if (!request) {
    const err = new Error('Không tìm thấy yêu cầu Scout Performance');
    err.statusCode = 404;
    throw err;
  }

  if ([SCOUT_PERFORMANCE_REQUEST_STATUS.REJECTED, SCOUT_PERFORMANCE_REQUEST_STATUS.CANCELLED].includes(request.status)) {
    const err = new Error('Yêu cầu Scout Performance không còn hiệu lực');
    err.statusCode = 400;
    throw err;
  }

  if (request.status === SCOUT_PERFORMANCE_REQUEST_STATUS.PENDING) {
    await request.update({
      status: SCOUT_PERFORMANCE_REQUEST_STATUS.APPROVED,
      handledAt: request.handledAt || new Date(),
    });
  }

  if (request.wantsSimilarCandidates) {
    const err = new Error('Đã gửi yêu cầu tìm ứng viên tương tự');
    err.statusCode = 400;
    throw err;
  }

  await request.update({
    wantsSimilarCandidates: true,
    message: message?.trim() || request.message || null,
  });

  let session = null;
  try {
    session = await ensureWsChatSessionForPerformanceRequest({
      request,
      business: request.business,
      cv: request.cv,
    });
    if (session) {
      const similarExists = await hasWsChatMessageForRequest({
        sessionId: session.id,
        messageType: WS_CHAT_MESSAGE_TYPES.SIMILAR_CANDIDATES_REQUEST,
        requestId: request.id,
      });
      if (!similarExists) {
        await createWsChatSimilarCandidatesRequestMessage({
          sessionId: session.id,
          businessId,
          request,
          cv: request.cv,
          businessNote: message,
        });
      }
    }
  } catch (chatError) {
    console.error('[ScoutPerformance] similar candidates chat sync failed:', chatError);
  }

  try {
    await notifySimilarCandidatesRequested({
      request,
      business: request.business,
      cv: request.cv,
      sessionId: session?.id || null,
    });
  } catch (notifyErr) {
    console.error('[ScoutPerformance] notify similar error:', notifyErr);
  }

  await request.reload({
    include: [
      { model: Business, as: 'business', attributes: ['id', 'companyName', 'contactName'] },
      {
        model: CVStorage,
        as: 'cv',
        include: [{ model: JobCategory, as: 'jobCategory', required: false }],
      },
    ],
  });

  return {
    ...formatRequestRow({
      ...request.toJSON(),
      business: request.business?.toJSON?.() || request.business,
      cv: request.cv?.toJSON?.() || request.cv,
    }),
    sessionId: session?.id || null,
    wantsSimilarCandidates: true,
  };
}

function buildCtvCvAccessWhere(collaboratorId) {
  return {
    [Op.or]: [
      { collaboratorId },
      { scoutListedByCollaboratorId: collaboratorId },
    ],
  };
}

function normalizeRecommendationCvIds(rawIds, fallbackCvId) {
  const ids = [...new Set(
    (Array.isArray(rawIds) ? rawIds : [])
      .map((id) => parseInt(id, 10))
      .filter((id) => Number.isFinite(id) && id > 0),
  )];
  if (!ids.length && fallbackCvId) ids.push(Number(fallbackCvId));
  return ids;
}

export async function getPendingPerformanceRequestForBusiness({ businessId, cvId }) {
  return getPerformanceRequestMetaForBusiness({
    businessId,
    cvId,
    statuses: [SCOUT_PERFORMANCE_REQUEST_STATUS.PENDING],
  });
}

export async function getPerformanceRequestMetaForBusiness({
  businessId,
  cvId,
  statuses = [
    SCOUT_PERFORMANCE_REQUEST_STATUS.PENDING,
    SCOUT_PERFORMANCE_REQUEST_STATUS.APPROVED,
  ],
}) {
  const row = await BusinessScoutPerformanceRequest.findOne({
    where: {
      businessId,
      cvId,
      status: { [Op.in]: statuses },
    },
    include: [
      {
        model: BusinessScoutPerformanceRecommendation,
        as: 'recommendations',
        required: false,
        attributes: ['id'],
      },
    ],
    order: [['id', 'DESC']],
  });
  if (!row) return null;
  const json = row.toJSON();
  return {
    id: row.id,
    status: row.status,
    message: row.message,
    requestedAt: row.requestedAt || row.createdAt,
    handledAt: row.handledAt || null,
    businessViewedAt: row.businessViewedAt || null,
    businessExploreStatus: row.businessExploreStatus || null,
    wantsSimilarCandidates: !!row.wantsSimilarCandidates,
    recommendationCount: json.recommendations?.length || 0,
    showBetterOptionsPrompt: row.status === SCOUT_PERFORMANCE_REQUEST_STATUS.APPROVED
      && row.wantsSimilarCandidates
      && !row.businessViewedAt,
  };
}

export async function searchCvsForPerformanceRecommendation({ search, limit = 20 }) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const where = {
    status: 1,
    isDuplicate: false,
    duplicateWithCvId: null,
  };
  if (search && String(search).trim()) {
    const q = String(search).trim();
    const like = `%${q}%`;
    where[Op.or] = [
      { code: { [Op.like]: like } },
      { name: { [Op.like]: like } },
      { desiredPosition: { [Op.like]: like } },
      { technicalSkills: { [Op.like]: like } },
      { email: { [Op.like]: like } },
      { phone: { [Op.like]: like } },
      { '$jobCategory.name$': { [Op.like]: like } },
    ];
  }

  const rows = await CVStorage.findAll({
    where,
    attributes: ['id', 'code', 'name', 'desiredPosition', 'scoutStatus', 'collaboratorId', 'experienceYears', 'technicalSkills'],
    include: [
      {
        model: JobCategory,
        as: 'jobCategory',
        required: false,
        attributes: ['id', 'name'],
      },
    ],
    order: [['updated_at', 'DESC'], ['id', 'DESC']],
    limit: safeLimit,
  });

  return rows.map((cv) => {
    const json = cv.toJSON();
    return {
      id: json.id,
      code: json.code || null,
      name: json.name || null,
      desiredPosition: json.desiredPosition || null,
      experienceYears: json.experienceYears ?? null,
      scoutStatus: json.scoutStatus,
      onScout: Number(json.scoutStatus) === SCOUT_LISTING_STATUS.LISTED,
      source: inferRecommendationSource(json),
      jobCategory: json.jobCategory || null,
    };
  });
}

export async function getScoutPerformanceRequestDetail({ requestId, businessId }) {
  const where = { id: requestId };
  if (businessId) where.businessId = businessId;

  const row = await BusinessScoutPerformanceRequest.findOne({
    where,
    include: [
      { model: Business, as: 'business', attributes: ['id', 'companyName', 'contactName'] },
      {
        model: CVStorage,
        as: 'cv',
        include: [{ model: JobCategory, as: 'jobCategory', required: false }],
      },
      {
        model: BusinessScoutPerformanceRecommendation,
        as: 'recommendations',
        required: false,
        include: [
          {
            model: CVStorage,
            as: 'cv',
            include: [{ model: JobCategory, as: 'jobCategory', required: false }],
          },
        ],
      },
    ],
  });

  if (!row) {
    const err = new Error('Không tìm thấy yêu cầu Scout Performance');
    err.statusCode = 404;
    throw err;
  }

  const json = row.toJSON();
  json.recommendations = (json.recommendations || []).sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );

  return formatRequestRow(json, { includeRecommendations: true });
}

export async function markScoutPerformanceRequestViewed({ requestId, businessId }) {
  const row = await BusinessScoutPerformanceRequest.findOne({
    where: { id: requestId, businessId },
  });
  if (!row) {
    const err = new Error('Không tìm thấy yêu cầu Scout Performance');
    err.statusCode = 404;
    throw err;
  }
  const firstView = !row.businessViewedAt;
  if (firstView && row.status === SCOUT_PERFORMANCE_REQUEST_STATUS.APPROVED) {
    await row.update({ businessViewedAt: new Date() });
  }
  return {
    requestId: row.id,
    status: row.status,
    firstView: firstView && row.status === SCOUT_PERFORMANCE_REQUEST_STATUS.APPROVED,
    showBetterOptionsPrompt: firstView && row.status === SCOUT_PERFORMANCE_REQUEST_STATUS.APPROVED,
    businessExploreStatus: row.businessExploreStatus || null,
  };
}

export async function setScoutPerformanceExploreStatus({ requestId, businessId, action }) {
  const normalized = String(action || '').trim().toLowerCase();
  if (![SCOUT_PERFORMANCE_EXPLORE_STATUS.INTERESTED, SCOUT_PERFORMANCE_EXPLORE_STATUS.DECLINED].includes(normalized)) {
    const err = new Error('Hành động không hợp lệ');
    err.statusCode = 400;
    throw err;
  }
  const row = await BusinessScoutPerformanceRequest.findOne({
    where: {
      id: requestId,
      businessId,
      status: SCOUT_PERFORMANCE_REQUEST_STATUS.APPROVED,
    },
  });
  if (!row) {
    const err = new Error('Không tìm thấy yêu cầu Scout Performance đã duyệt');
    err.statusCode = 404;
    throw err;
  }
  await row.update({
    businessExploreStatus: normalized,
    businessViewedAt: row.businessViewedAt || new Date(),
  });
  return {
    requestId: row.id,
    businessExploreStatus: normalized,
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
      {
        model: BusinessScoutPerformanceRecommendation,
        as: 'recommendations',
        required: false,
        attributes: ['id'],
      },
    ],
    limit: safeLimit,
    offset,
    order: [['requestedAt', 'DESC'], ['id', 'DESC']],
    distinct: true,
  });

  return {
    requests: rows.map((row) => formatRequestRow(row)),
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
  } else if (unlock.unlockType !== SCOUT_UNLOCK_TYPES.SCOUT_PERFORMANCE) {
    await unlock.update(
      {
        unlockType: SCOUT_UNLOCK_TYPES.SCOUT_PERFORMANCE,
        creditCost: 0,
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

async function createRecommendationsForRequest({ requestId, cvIds, transaction }) {
  const cvs = await CVStorage.findAll({
    where: { id: cvIds, status: 1, isDuplicate: false },
    transaction,
  });
  const cvMap = new Map(cvs.map((cv) => [Number(cv.id), cv]));
  const created = [];
  let sortOrder = 0;
  for (const cvId of cvIds) {
    const cv = cvMap.get(Number(cvId));
    if (!cv) continue;
    const [rec] = await BusinessScoutPerformanceRecommendation.findOrCreate({
      where: { requestId, cvId: Number(cvId) },
      defaults: {
        source: inferRecommendationSource(cv),
        sortOrder,
      },
      transaction,
    });
    if (rec.sortOrder !== sortOrder) {
      await rec.update({ sortOrder }, { transaction });
    }
    created.push(rec);
    sortOrder += 1;
  }
  return created;
}

export async function sharePerformanceCandidatesToBusiness({
  requestId,
  cvIds,
  adminId = null,
  collaboratorId = null,
  note,
  viaChat = false,
}) {
  return sequelize.transaction(async (transaction) => {
    const request = await BusinessScoutPerformanceRequest.findByPk(requestId, {
      include: [
        { model: Business, as: 'business', attributes: ['id', 'companyName', 'contactName'] },
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
    if (collaboratorId) {
      if (request.status === SCOUT_PERFORMANCE_REQUEST_STATUS.PENDING) {
        assertCtvCanHandleRequest(request, collaboratorId);
      }
    }
    if (![
      SCOUT_PERFORMANCE_REQUEST_STATUS.APPROVED,
    ].includes(request.status)) {
      const err = new Error('Yêu cầu không còn ở trạng thái có thể gửi gợi ý');
      err.statusCode = 400;
      throw err;
    }

    const normalizedCvIds = normalizeRecommendationCvIds(cvIds, null);
    if (!normalizedCvIds.length) {
      const err = new Error('Vui lòng chọn ít nhất một ứng viên');
      err.statusCode = 400;
      throw err;
    }

    const recommendations = await createRecommendationsForRequest({
      requestId: request.id,
      cvIds: normalizedCvIds,
      transaction,
    });

    let primaryUnlock = request.scoutUnlockId
      ? await BusinessScoutUnlock.findByPk(request.scoutUnlockId, { transaction })
      : null;

    for (const cvId of normalizedCvIds) {
      const unlock = await performScoutPerformanceUnlock({
        businessId: request.businessId,
        cvId,
        transaction,
      });
      if (!primaryUnlock) primaryUnlock = unlock;
      if (Number(cvId) === Number(request.cvId)) primaryUnlock = unlock;
    }

    const wasPending = request.status === SCOUT_PERFORMANCE_REQUEST_STATUS.PENDING;
    if (wasPending) {
      await request.update(
        {
          status: SCOUT_PERFORMANCE_REQUEST_STATUS.APPROVED,
          adminNote: note?.trim() || request.adminNote || null,
          handledByAdminId: adminId || request.handledByAdminId || null,
          handledByCollaboratorId: collaboratorId || request.handledByCollaboratorId || null,
          scoutUnlockId: primaryUnlock?.id || request.scoutUnlockId,
          handledAt: request.handledAt || new Date(),
          businessViewedAt: null,
          businessExploreStatus: null,
        },
        { transaction },
      );
    }

    const cvs = await CVStorage.findAll({
      where: { id: normalizedCvIds },
      attributes: ['id', 'code', 'name', 'desiredPosition', 'experienceYears'],
      include: [{ model: JobCategory, as: 'jobCategory', required: false, attributes: ['id', 'name'] }],
      transaction,
    });
    const attachments = cvs.map((cv) => {
      const json = cv.toJSON();
      return {
        cvId: json.id,
        code: json.code || null,
        name: json.name || null,
        desiredPosition: json.desiredPosition || null,
        jobCategory: json.jobCategory || null,
        experienceYears: json.experienceYears ?? null,
      };
    });

    if (wasPending && !viaChat) {
      const session = await BusinessWsChatSession.findOne({
        where: { performanceRequestId: request.id },
        transaction,
      });
      try {
        await notifyBusinessScoutPerformanceApproved({
          request,
          business: request.business,
          recommendationCount: recommendations.length,
          sessionId: session?.id || null,
        });
      } catch (notifyErr) {
        console.error('[ScoutPerformance] notify business error:', notifyErr);
      }
    }

    return {
      requestId: request.id,
      recommendationCount: recommendations.length,
      attachments,
      newlyApproved: wasPending,
    };
  });
}

export async function approveScoutPerformanceRequest({
  requestId,
  adminId = null,
  collaboratorId = null,
  note,
  recommendationCvIds = [],
}) {
  const formatted = await sequelize.transaction(async (transaction) => {
    const request = await loadRequestForAction(requestId, transaction);
    if (collaboratorId) assertCtvCanHandleRequest(request, collaboratorId);

    const cvIds = normalizeRecommendationCvIds(recommendationCvIds, request.cvId);
    if (!cvIds.length) {
      const err = new Error('Vui lòng chọn ít nhất một ứng viên gợi ý');
      err.statusCode = 400;
      throw err;
    }

    const recommendations = await createRecommendationsForRequest({
      requestId: request.id,
      cvIds,
      transaction,
    });

    let primaryUnlock = null;
    for (const cvId of cvIds) {
      const unlock = await performScoutPerformanceUnlock({
        businessId: request.businessId,
        cvId,
        transaction,
      });
      if (Number(cvId) === Number(request.cvId)) primaryUnlock = unlock;
    }
    if (!primaryUnlock) {
      primaryUnlock = await performScoutPerformanceUnlock({
        businessId: request.businessId,
        cvId: cvIds[0],
        transaction,
      });
    }

    await request.update(
      {
        status: SCOUT_PERFORMANCE_REQUEST_STATUS.APPROVED,
        adminNote: note?.trim() || null,
        handledByAdminId: adminId || null,
        handledByCollaboratorId: collaboratorId || null,
        scoutUnlockId: primaryUnlock.id,
        handledAt: new Date(),
        businessViewedAt: null,
        businessExploreStatus: null,
      },
      { transaction },
    );

    const result = formatRequestRow(await request.reload({
      include: [
        { model: Business, as: 'business', attributes: ['id', 'companyName', 'contactName'] },
        {
          model: CVStorage,
          as: 'cv',
          include: [{ model: JobCategory, as: 'jobCategory', required: false }],
        },
        {
          model: BusinessScoutPerformanceRecommendation,
          as: 'recommendations',
          include: [{ model: CVStorage, as: 'cv' }],
        },
      ],
      transaction,
    }), { includeRecommendations: true });

    try {
      const session = await BusinessWsChatSession.findOne({
        where: { performanceRequestId: request.id },
        transaction,
      });
      await notifyBusinessScoutPerformanceApproved({
        request,
        business: request.business,
        recommendationCount: recommendations.length,
        sessionId: session?.id || null,
      });
    } catch (notifyErr) {
      console.error('[ScoutPerformance] notify business error:', notifyErr);
    }

    return result;
  });

  try {
    const { syncWsChatAfterPerformanceApproval } = await import('./businessWsChatService.js');
    await syncWsChatAfterPerformanceApproval({
      requestId,
      adminId,
      note,
      requestedCvId: formatted?.cvId || formatted?.cv?.id || null,
    });
  } catch (syncErr) {
    console.error('[ScoutPerformance] ws chat sync error:', syncErr);
  }

  return formatted;
}

export async function rejectScoutPerformanceRequest({
  requestId,
  adminId = null,
  collaboratorId = null,
  note,
}) {
  const formatted = await sequelize.transaction(async (transaction) => {
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

  try {
    const { syncWsChatAfterPerformanceRejection } = await import('./businessWsChatService.js');
    await syncWsChatAfterPerformanceRejection({ requestId, adminId, note });
  } catch (syncErr) {
    console.error('[ScoutPerformance] ws chat sync error:', syncErr);
  }

  return formatted;
}

export default {
  createScoutPerformanceRequest,
  requestSimilarScoutPerformanceCandidates,
  getPendingPerformanceRequestForBusiness,
  getPerformanceRequestMetaForBusiness,
  searchCvsForPerformanceRecommendation,
  getScoutPerformanceRequestDetail,
  markScoutPerformanceRequestViewed,
  setScoutPerformanceExploreStatus,
  listScoutPerformanceRequests,
  approveScoutPerformanceRequest,
  rejectScoutPerformanceRequest,
  sharePerformanceCandidatesToBusiness,
};
