import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  Admin,
  Business,
  BusinessScoutPerformanceRequest,
  BusinessWsChatMessage,
  BusinessWsChatSession,
  CVStorage,
  JobCategory,
} from '../models/index.js';
import { SCOUT_PERFORMANCE_REQUEST_STATUS } from '../constants/scoutCredit.js';
import { collaboratorNotificationService } from './collaboratorNotificationService.js';

export const WS_CHAT_SESSION_TYPES = {
  SCOUT_PERFORMANCE: 'scout_performance',
};

export const WS_CHAT_SENDER_TYPES = {
  BUSINESS: 'business',
  ADMIN: 'admin',
  SYSTEM: 'system',
};

export const WS_CHAT_MESSAGE_TYPES = {
  TEXT: 'text',
  PERFORMANCE_OPENED: 'performance_opened',
  SIMILAR_CANDIDATES_REQUEST: 'similar_candidates_request',
  PERFORMANCE_REQUEST: 'performance_request',
  PERFORMANCE_DECISION: 'performance_decision',
};

function buildBusinessWsChatSessionTitle(business) {
  const company = business?.companyName || business?.company_name;
  return company ? `WS — ${company}` : 'WS Team – Tuyển dụng';
}

async function resolveShareRequestForSession(session, transaction = null) {
  if (session.performanceRequestId) {
    return BusinessScoutPerformanceRequest.findByPk(session.performanceRequestId, { transaction });
  }
  const wantsSimilar = await BusinessScoutPerformanceRequest.findOne({
    where: {
      businessId: session.businessId,
      status: SCOUT_PERFORMANCE_REQUEST_STATUS.APPROVED,
      wantsSimilarCandidates: true,
    },
    order: [['id', 'DESC']],
    transaction,
  });
  if (wantsSimilar) return wantsSimilar;
  return BusinessScoutPerformanceRequest.findOne({
    where: {
      businessId: session.businessId,
      status: SCOUT_PERFORMANCE_REQUEST_STATUS.APPROVED,
    },
    order: [['id', 'DESC']],
    transaction,
  });
}

export async function hasWsChatMessageForRequest({ sessionId, messageType, requestId, transaction = null }) {
  const rows = await BusinessWsChatMessage.findAll({
    where: { sessionId, messageType },
    attributes: ['id', 'requestPayload'],
    transaction,
  });
  return rows.some((row) => Number(row.requestPayload?.requestId) === Number(requestId));
}

function formatCvAttachment(cv) {
  const json = cv?.toJSON ? cv.toJSON() : cv;
  return {
    cvId: json.id,
    code: json.code || null,
    name: json.name || null,
    desiredPosition: json.desiredPosition || null,
    jobCategory: json.jobCategory || null,
    experienceYears: json.experienceYears ?? null,
  };
}

function formatMessageRow(row) {
  const json = row.toJSON ? row.toJSON() : row;
  return {
    id: json.id,
    sessionId: json.sessionId,
    senderType: json.senderType,
    messageType: json.messageType || 'text',
    content: json.content || '',
    requestPayload: json.requestPayload || null,
    cvAttachments: Array.isArray(json.cvAttachments) ? json.cvAttachments : [],
    isReadByBusiness: !!json.isReadByBusiness,
    isReadByAdmin: !!json.isReadByAdmin,
    createdAt: json.createdAt,
    admin: json.admin
      ? { id: json.admin.id, name: json.admin.name || json.admin.email }
      : null,
    business: json.business
      ? { id: json.business.id, companyName: json.business.companyName, contactName: json.business.contactName }
      : null,
  };
}

async function updatePerformanceRequestMessageStatus({
  sessionId,
  requestId,
  status,
  adminNote = null,
  transaction = null,
}) {
  const message = await BusinessWsChatMessage.findOne({
    where: {
      sessionId,
      messageType: WS_CHAT_MESSAGE_TYPES.PERFORMANCE_REQUEST,
    },
    order: [['id', 'ASC']],
    transaction,
  });
  if (!message?.requestPayload) return null;

  const payload = {
    ...(message.requestPayload || {}),
    status,
    requestId: requestId || message.requestPayload.requestId,
  };
  if (adminNote) payload.adminNote = adminNote;
  await message.update({ requestPayload: payload }, { transaction });
  return message;
}

function formatSessionRow(row, { unreadCount = 0 } = {}) {
  const json = row.toJSON ? row.toJSON() : row;
  const business = json.business || {};
  const cv = json.performanceRequest?.cv || {};
  const request = json.performanceRequest || {};
  return {
    id: json.id,
    businessId: json.businessId,
    performanceRequestId: json.performanceRequestId,
    sessionType: json.sessionType,
    title: json.title,
    status: json.status,
    lastMessageAt: json.lastMessageAt,
    lastMessagePreview: json.lastMessagePreview,
    unreadCount,
    business: business.id
      ? {
          id: business.id,
          companyName: business.companyName || null,
          contactName: business.contactName || null,
        }
      : null,
    performanceRequest: request.id
      ? {
          id: request.id,
          status: request.status,
          cvId: request.cvId,
          message: request.message || null,
          wantsSimilarCandidates: !!request.wantsSimilarCandidates,
        }
      : null,
    triggerCv: cv.id
      ? {
          id: cv.id,
          code: cv.code || null,
          desiredPosition: cv.desiredPosition || null,
          jobCategory: cv.jobCategory || null,
        }
      : null,
  };
}

async function touchSessionPreview(session, { content, cvCount = 0, transaction = null } = {}) {
  const sessionId = session?.id ?? session;
  if (!sessionId) return;

  let preview = (content || '').trim().replace(/\s+/g, ' ').slice(0, 240);
  if (cvCount > 0) {
    preview = preview
      ? `${preview} · ${cvCount} hồ sơ ứng viên`
      : `WS gửi ${cvCount} hồ sơ ứng viên`;
  }

  try {
    await BusinessWsChatSession.update({
      lastMessageAt: new Date(),
      lastMessagePreview: preview || null,
    }, {
      where: { id: sessionId },
      transaction,
    });
  } catch (error) {
    // Preview là best-effort — không chặn unlock / gửi yêu cầu Scout Performance
    console.error('[WsChat] touchSessionPreview failed:', {
      sessionId,
      message: error?.message,
      code: error?.parent?.code || error?.code,
    });
  }
}

/** Một doanh nghiệp = một hộp chat WS (mọi Scout Performance request nằm chung thread). */
export async function ensureWsChatSessionForBusiness({
  businessId,
  business = null,
  sessionType = WS_CHAT_SESSION_TYPES.SCOUT_PERFORMANCE,
  transaction = null,
}) {
  const existing = await BusinessWsChatSession.findOne({
    where: { businessId, sessionType },
    transaction,
  });
  if (existing) return existing;

  const biz = business || await Business.findByPk(businessId, {
    attributes: ['id', 'companyName', 'contactName'],
    transaction,
  });

  return BusinessWsChatSession.create(
    {
      businessId,
      performanceRequestId: null,
      sessionType,
      title: buildBusinessWsChatSessionTitle(biz),
      status: 'active',
    },
    { transaction },
  );
}

export async function ensureWsChatSessionForPerformanceRequest({
  request,
  business,
  cv: _cv,
  transaction = null,
}) {
  return ensureWsChatSessionForBusiness({
    businessId: request.businessId,
    business,
    sessionType: WS_CHAT_SESSION_TYPES.SCOUT_PERFORMANCE,
    transaction,
  });
}

export async function createWsChatPerformanceOpenedMessage({
  sessionId,
  businessId,
  request,
  cv,
  transaction = null,
}) {
  const session = await BusinessWsChatSession.findByPk(sessionId, { transaction });
  if (!session) return null;

  const cvJson = cv?.toJSON ? cv.toJSON() : cv;
  const cvAttachments = cvJson?.id ? [formatCvAttachment(cvJson)] : [];

  const message = await BusinessWsChatMessage.create(
    {
      sessionId,
      senderType: WS_CHAT_SENDER_TYPES.BUSINESS,
      businessId,
      messageType: WS_CHAT_MESSAGE_TYPES.PERFORMANCE_OPENED,
      requestPayload: {
        requestId: request.id,
        cvId: cvJson?.id,
        cvCode: cvJson?.code || null,
        desiredPosition: cvJson?.desiredPosition || null,
        jobCategory: cvJson?.jobCategory || null,
      },
      cvAttachments,
      content: 'Đã mở hồ sơ bằng Scout Performance',
      isReadByBusiness: true,
      isReadByAdmin: false,
    },
    { transaction },
  );

  await touchSessionPreview(session, { content: 'Đã mở hồ sơ Scout Performance', transaction });
  return message;
}

export async function createWsChatSimilarCandidatesRequestMessage({
  sessionId,
  businessId,
  request,
  cv,
  businessNote,
  transaction = null,
}) {
  const session = await BusinessWsChatSession.findByPk(sessionId, { transaction });
  if (!session) return null;

  const cvJson = cv?.toJSON ? cv.toJSON() : cv;
  const cvAttachments = cvJson?.id ? [formatCvAttachment(cvJson)] : [];

  const message = await BusinessWsChatMessage.create(
    {
      sessionId,
      senderType: WS_CHAT_SENDER_TYPES.BUSINESS,
      businessId,
      messageType: WS_CHAT_MESSAGE_TYPES.SIMILAR_CANDIDATES_REQUEST,
      requestPayload: {
        requestId: request.id,
        cvId: cvJson?.id,
        cvCode: cvJson?.code || null,
        desiredPosition: cvJson?.desiredPosition || null,
        jobCategory: cvJson?.jobCategory || null,
        businessNote: businessNote?.trim() || null,
      },
      cvAttachments,
      content: 'Yêu cầu tìm thêm các ứng viên tương tự',
      isReadByBusiness: true,
      isReadByAdmin: false,
    },
    { transaction },
  );

  await touchSessionPreview(session, { content: 'Yêu cầu tìm thêm ứng viên tương tự', transaction });
  return message;
}

/** @deprecated legacy — giữ cho dữ liệu cũ */
export async function createWsChatPerformanceRequestMessage({
  sessionId,
  businessId,
  request,
  cv,
  businessNote,
  transaction = null,
}) {
  const session = await BusinessWsChatSession.findByPk(sessionId, { transaction });
  if (!session) return null;

  const cvJson = cv?.toJSON ? cv.toJSON() : cv;
  const requestPayload = {
    requestId: request.id,
    status: SCOUT_PERFORMANCE_REQUEST_STATUS.PENDING,
    cvId: cvJson?.id,
    cvCode: cvJson?.code || null,
    desiredPosition: cvJson?.desiredPosition || null,
    jobCategory: cvJson?.jobCategory || null,
    businessNote: businessNote?.trim() || null,
  };
  const cvAttachments = cvJson?.id ? [formatCvAttachment(cvJson)] : [];

  const message = await BusinessWsChatMessage.create(
    {
      sessionId,
      senderType: WS_CHAT_SENDER_TYPES.BUSINESS,
      businessId,
      messageType: WS_CHAT_MESSAGE_TYPES.PERFORMANCE_REQUEST,
      requestPayload,
      cvAttachments,
      content: 'Yêu cầu mở hồ sơ qua Scout Performance',
      isReadByBusiness: true,
      isReadByAdmin: false,
    },
    { transaction },
  );

  await touchSessionPreview(session, { content: 'Yêu cầu mở hồ sơ Scout Performance', transaction });
  return message;
}

export async function createWsChatSystemMessage({
  sessionId,
  content,
  transaction = null,
}) {
  const session = await BusinessWsChatSession.findByPk(sessionId, { transaction });
  if (!session) return null;

  const message = await BusinessWsChatMessage.create(
    {
      sessionId,
      senderType: WS_CHAT_SENDER_TYPES.SYSTEM,
      content,
      isReadByAdmin: true,
      isReadByBusiness: false,
    },
    { transaction },
  );

  await touchSessionPreview(session, { content, transaction });
  return message;
}

export async function listWsChatSessionsForBusiness({
  businessId,
  search,
  page = 1,
  limit = 50,
}) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const where = { businessId };
  if (search && String(search).trim()) {
    const q = `%${String(search).trim()}%`;
    where[Op.or] = [
      { title: { [Op.like]: q } },
      { lastMessagePreview: { [Op.like]: q } },
    ];
  }

  const { count, rows } = await BusinessWsChatSession.findAndCountAll({
    where,
    limit: safeLimit,
    offset,
    order: [['last_message_at', 'DESC'], ['id', 'DESC']],
    include: [
      {
        model: BusinessScoutPerformanceRequest,
        as: 'performanceRequest',
        required: false,
        attributes: ['id', 'status', 'cvId', 'message', 'wantsSimilarCandidates'],
        include: [
          {
            model: CVStorage,
            as: 'cv',
            required: false,
            attributes: ['id', 'code', 'desiredPosition'],
            include: [{ model: JobCategory, as: 'jobCategory', required: false, attributes: ['id', 'name'] }],
          },
        ],
      },
    ],
  });

  const sessionIds = rows.map((r) => r.id);
  let unreadBySession = {};
  if (sessionIds.length) {
    const unreadRows = await BusinessWsChatMessage.findAll({
      attributes: [
        'sessionId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'unreadCount'],
      ],
      where: {
        sessionId: { [Op.in]: sessionIds },
        isReadByBusiness: false,
        senderType: { [Op.in]: [WS_CHAT_SENDER_TYPES.ADMIN, WS_CHAT_SENDER_TYPES.SYSTEM] },
      },
      group: ['sessionId'],
      raw: true,
    });
    unreadBySession = Object.fromEntries(
      unreadRows.map((row) => [String(row.sessionId), Number(row.unreadCount || 0)]),
    );
  }

  return {
    sessions: rows.map((row) => formatSessionRow(row, {
      unreadCount: unreadBySession[String(row.id)] || 0,
    })),
    pagination: {
      total: count,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(count / safeLimit) || 0,
    },
  };
}

export async function listWsChatSessionsForAdmin({
  search,
  page = 1,
  limit = 50,
}) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const where = {};
  if (search && String(search).trim()) {
    const q = `%${String(search).trim()}%`;
    where[Op.or] = [
      { title: { [Op.like]: q } },
      { lastMessagePreview: { [Op.like]: q } },
    ];
  }

  const { count, rows } = await BusinessWsChatSession.findAndCountAll({
    where,
    limit: safeLimit,
    offset,
    order: [['last_message_at', 'DESC'], ['id', 'DESC']],
    include: [
      {
        model: Business,
        as: 'business',
        required: true,
        attributes: ['id', 'companyName', 'contactName'],
      },
      {
        model: BusinessScoutPerformanceRequest,
        as: 'performanceRequest',
        required: false,
        attributes: ['id', 'status', 'cvId', 'message', 'requestedAt', 'wantsSimilarCandidates'],
        include: [
          {
            model: CVStorage,
            as: 'cv',
            required: false,
            attributes: ['id', 'code', 'desiredPosition'],
            include: [{ model: JobCategory, as: 'jobCategory', required: false, attributes: ['id', 'name'] }],
          },
        ],
      },
    ],
  });

  const sessionIds = rows.map((r) => r.id);
  let unreadBySession = {};
  if (sessionIds.length) {
    const unreadRows = await BusinessWsChatMessage.findAll({
      attributes: [
        'sessionId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'unreadCount'],
      ],
      where: {
        sessionId: { [Op.in]: sessionIds },
        isReadByAdmin: false,
        senderType: WS_CHAT_SENDER_TYPES.BUSINESS,
      },
      group: ['sessionId'],
      raw: true,
    });
    unreadBySession = Object.fromEntries(
      unreadRows.map((row) => [String(row.sessionId), Number(row.unreadCount || 0)]),
    );
  }

  return {
    sessions: rows.map((row) => formatSessionRow(row, {
      unreadCount: unreadBySession[String(row.id)] || 0,
    })),
    pagination: {
      total: count,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(count / safeLimit) || 0,
    },
  };
}

async function loadSessionForBusiness(sessionId, businessId) {
  const session = await BusinessWsChatSession.findOne({
    where: { id: sessionId, businessId },
    include: [
      {
        model: BusinessScoutPerformanceRequest,
        as: 'performanceRequest',
        required: false,
        include: [
          {
            model: CVStorage,
            as: 'cv',
            required: false,
            include: [{ model: JobCategory, as: 'jobCategory', required: false }],
          },
        ],
      },
    ],
  });
  if (!session) {
    const err = new Error('Không tìm thấy cuộc trò chuyện');
    err.statusCode = 404;
    throw err;
  }
  return session;
}

async function loadSessionForAdmin(sessionId) {
  const session = await BusinessWsChatSession.findByPk(sessionId, {
    include: [
      {
        model: Business,
        as: 'business',
        required: true,
        attributes: ['id', 'companyName', 'contactName'],
      },
      {
        model: BusinessScoutPerformanceRequest,
        as: 'performanceRequest',
        required: false,
        include: [
          {
            model: CVStorage,
            as: 'cv',
            required: false,
            include: [{ model: JobCategory, as: 'jobCategory', required: false }],
          },
        ],
      },
    ],
  });
  if (!session) {
    const err = new Error('Không tìm thấy cuộc trò chuyện');
    err.statusCode = 404;
    throw err;
  }
  return session;
}

export async function getWsChatSessionForBusiness({ sessionId, businessId }) {
  const session = await loadSessionForBusiness(sessionId, businessId);
  return formatSessionRow(session);
}

export async function getWsChatSessionForAdmin({ sessionId }) {
  const session = await loadSessionForAdmin(sessionId);
  return formatSessionRow(session);
}

export async function listWsChatMessagesForBusiness({ sessionId, businessId }) {
  await loadSessionForBusiness(sessionId, businessId);

  const messages = await BusinessWsChatMessage.findAll({
    where: { sessionId },
    include: [
      { model: Admin, as: 'admin', required: false, attributes: ['id', 'name', 'email'] },
      { model: Business, as: 'business', required: false, attributes: ['id', 'companyName', 'contactName'] },
    ],
    order: [['created_at', 'ASC']],
  });

  const unreadIds = messages
    .filter((m) => !m.isReadByBusiness && m.senderType !== WS_CHAT_SENDER_TYPES.BUSINESS)
    .map((m) => m.id);
  if (unreadIds.length) {
    await BusinessWsChatMessage.update(
      { isReadByBusiness: true },
      { where: { id: { [Op.in]: unreadIds } } },
    );
  }

  return messages.map(formatMessageRow);
}

export async function listWsChatMessagesForAdmin({ sessionId }) {
  await loadSessionForAdmin(sessionId);

  const messages = await BusinessWsChatMessage.findAll({
    where: { sessionId },
    include: [
      { model: Admin, as: 'admin', required: false, attributes: ['id', 'name', 'email'] },
      { model: Business, as: 'business', required: false, attributes: ['id', 'companyName', 'contactName'] },
    ],
    order: [['created_at', 'ASC']],
  });

  const unreadIds = messages
    .filter((m) => !m.isReadByAdmin && m.senderType === WS_CHAT_SENDER_TYPES.BUSINESS)
    .map((m) => m.id);
  if (unreadIds.length) {
    await BusinessWsChatMessage.update(
      { isReadByAdmin: true },
      { where: { id: { [Op.in]: unreadIds } } },
    );
  }

  return messages.map(formatMessageRow);
}

export async function sendWsChatMessageFromBusiness({ sessionId, businessId, content }) {
  const trimmed = (content || '').trim();
  if (!trimmed) {
    const err = new Error('Nội dung tin nhắn không được để trống');
    err.statusCode = 400;
    throw err;
  }

  const session = await loadSessionForBusiness(sessionId, businessId);
  const message = await BusinessWsChatMessage.create({
    sessionId: session.id,
    senderType: WS_CHAT_SENDER_TYPES.BUSINESS,
    businessId,
    content: trimmed,
    isReadByBusiness: true,
    isReadByAdmin: false,
  });

  await touchSessionPreview(session, { content: trimmed });

  const business = await Business.findByPk(businessId, { attributes: ['companyName'] });
  const companyName = business?.companyName || 'Doanh nghiệp';
  const admins = await Admin.findAll({
    where: { isActive: true, status: 1, role: { [Op.in]: [1, 2] } },
    attributes: ['id'],
  });
  for (const admin of admins) {
    await collaboratorNotificationService.createAndEmit({
      collaboratorId: null,
      adminId: admin.id,
      title: 'Tin nhắn Scout Performance mới',
      content: `${companyName} gửi tin nhắn trong cuộc trò chuyện Scout Performance.`,
      jobId: null,
      url: `/admin/public-ctv-chat?tab=business&sessionId=${session.id}`,
    });
  }

  return formatMessageRow(message);
}

export async function sendWsChatMessageFromAdmin({
  sessionId,
  adminId,
  content,
  cvIds = [],
}) {
  const trimmed = (content || '').trim();
  const uniqueCvIds = [...new Set(
    (Array.isArray(cvIds) ? cvIds : [])
      .map((id) => parseInt(id, 10))
      .filter((id) => Number.isFinite(id) && id > 0),
  )];

  if (!trimmed && !uniqueCvIds.length) {
    const err = new Error('Nội dung hoặc hồ sơ ứng viên là bắt buộc');
    err.statusCode = 400;
    throw err;
  }

  const session = await loadSessionForAdmin(sessionId);
  const shareRequest = uniqueCvIds.length
    ? await resolveShareRequestForSession(session)
    : null;

  if (uniqueCvIds.length && !shareRequest) {
    const err = new Error('Chưa có yêu cầu Scout Performance để gắn hồ sơ gợi ý');
    err.statusCode = 400;
    throw err;
  }

  if (uniqueCvIds.length && shareRequest?.status === SCOUT_PERFORMANCE_REQUEST_STATUS.PENDING) {
    const err = new Error('Yêu cầu Scout Performance cũ chưa xử lý — vui lòng cập nhật hệ thống');
    err.statusCode = 400;
    throw err;
  }

  let cvAttachments = [];
  if (uniqueCvIds.length) {
    const { sharePerformanceCandidatesToBusiness } = await import('./scoutPerformanceService.js');
    const shareResult = await sharePerformanceCandidatesToBusiness({
      requestId: shareRequest.id,
      cvIds: uniqueCvIds,
      adminId,
      viaChat: true,
    });
    cvAttachments = shareResult.attachments || [];
  }

  const message = await BusinessWsChatMessage.create({
    sessionId: session.id,
    senderType: WS_CHAT_SENDER_TYPES.ADMIN,
    adminId,
    content: trimmed || (cvAttachments.length ? 'JobShare WS gửi hồ sơ ứng viên gợi ý' : ''),
    cvAttachments,
    isReadByAdmin: true,
    isReadByBusiness: false,
  });

  await touchSessionPreview(session, { content: trimmed, cvCount: cvAttachments.length });

  if (uniqueCvIds.length) {
    await collaboratorNotificationService.createAndEmit({
      businessId: session.businessId,
      collaboratorId: null,
      adminId: null,
      title: 'Scout Performance — có hồ sơ mới',
      content: `JobShare WS đã gửi ${cvAttachments.length} hồ sơ ứng viên trong cuộc trò chuyện Scout Performance.`,
      jobId: null,
      url: `/business/messages?tab=ws&sessionId=${session.id}`,
    });
  }

  return formatMessageRow(await message.reload({
    include: [{ model: Admin, as: 'admin', required: false, attributes: ['id', 'name', 'email'] }],
  }));
}

export async function searchWsChatCandidateMentions({ search, limit = 12 }) {
  const { searchCvsForPerformanceRecommendation } = await import('./scoutPerformanceService.js');
  const rows = await searchCvsForPerformanceRecommendation({ search, limit });
  const list = Array.isArray(rows) ? rows : (rows?.candidates || []);
  return list.map((cv) => ({
    id: cv.id,
    code: cv.code || null,
    name: cv.name || null,
    desiredPosition: cv.desiredPosition || null,
    label: cv.code
      ? `${cv.code}${cv.name ? ` — ${cv.name}` : ''}`
      : (cv.name || `CV #${cv.id}`),
  }));
}

export async function acceptPerformanceRequestInChat({
  sessionId,
  adminId,
  cvIds = [],
  note,
}) {
  const session = await loadSessionForAdmin(sessionId);
  if (!session.performanceRequestId) {
    const err = new Error('Phiên chat không liên kết yêu cầu Scout Performance');
    err.statusCode = 400;
    throw err;
  }

  const { approveScoutPerformanceRequest } = await import('./scoutPerformanceService.js');
  const request = await approveScoutPerformanceRequest({
    requestId: session.performanceRequestId,
    adminId,
    note,
    recommendationCvIds: cvIds,
  });

  return { request };
}

export async function rejectPerformanceRequestInChat({
  sessionId,
  adminId,
  note,
}) {
  const session = await loadSessionForAdmin(sessionId);
  if (!session.performanceRequestId) {
    const err = new Error('Phiên chat không liên kết yêu cầu Scout Performance');
    err.statusCode = 400;
    throw err;
  }

  const { rejectScoutPerformanceRequest } = await import('./scoutPerformanceService.js');
  const request = await rejectScoutPerformanceRequest({
    requestId: session.performanceRequestId,
    adminId,
    note,
  });

  return { request };
}

export async function getWsChatSessionByPerformanceRequestId({ requestId, businessId = null, admin = false }) {
  const request = await BusinessScoutPerformanceRequest.findByPk(requestId, {
    attributes: ['id', 'businessId'],
  });
  if (!request) return null;
  if (businessId && Number(request.businessId) !== Number(businessId)) return null;

  const session = await BusinessWsChatSession.findOne({
    where: {
      businessId: request.businessId,
      sessionType: WS_CHAT_SESSION_TYPES.SCOUT_PERFORMANCE,
    },
    include: [
      {
        model: Business,
        as: 'business',
        required: false,
        attributes: ['id', 'companyName', 'contactName'],
      },
      {
        model: BusinessScoutPerformanceRequest,
        as: 'performanceRequest',
        required: false,
        include: [
          {
            model: CVStorage,
            as: 'cv',
            required: false,
            include: [{ model: JobCategory, as: 'jobCategory', required: false }],
          },
        ],
      },
    ],
  });
  return session ? formatSessionRow(session) : null;
}

export async function syncWsChatAfterPerformanceApproval({
  requestId,
  adminId = null,
  note = null,
  requestedCvId = null,
}) {
  const request = await BusinessScoutPerformanceRequest.findByPk(requestId, {
    attributes: ['id', 'businessId'],
  });
  if (!request) return null;

  const session = await BusinessWsChatSession.findOne({
    where: {
      businessId: request.businessId,
      sessionType: WS_CHAT_SESSION_TYPES.SCOUT_PERFORMANCE,
    },
  });
  if (!session) return null;

  await updatePerformanceRequestMessageStatus({
    sessionId: session.id,
    requestId,
    status: SCOUT_PERFORMANCE_REQUEST_STATUS.APPROVED,
    adminNote: note?.trim() || null,
  });

  let cvAttachments = [];
  if (requestedCvId) {
    const cv = await CVStorage.findByPk(requestedCvId, {
      attributes: ['id', 'code', 'name', 'desiredPosition', 'experienceYears'],
      include: [{ model: JobCategory, as: 'jobCategory', required: false, attributes: ['id', 'name'] }],
    });
    if (cv) cvAttachments = [formatCvAttachment(cv)];
  }

  const decisionMessage = await BusinessWsChatMessage.create({
    sessionId: session.id,
    senderType: WS_CHAT_SENDER_TYPES.ADMIN,
    adminId,
    messageType: WS_CHAT_MESSAGE_TYPES.PERFORMANCE_DECISION,
    content: note?.trim() || 'JobShare WS đã chấp nhận yêu cầu mở hồ sơ.',
    cvAttachments,
    requestPayload: {
      requestId,
      status: SCOUT_PERFORMANCE_REQUEST_STATUS.APPROVED,
      decision: 'accepted',
    },
    isReadByAdmin: true,
    isReadByBusiness: false,
  });

  await touchSessionPreview(session, {
    content: note?.trim() || 'Đã chấp nhận yêu cầu mở hồ sơ',
    cvCount: 0,
  });

  return formatMessageRow(await decisionMessage.reload({
    include: [{ model: Admin, as: 'admin', required: false, attributes: ['id', 'name', 'email'] }],
  }));
}

export async function syncWsChatAfterPerformanceRejection({
  requestId,
  adminId = null,
  note = null,
}) {
  const request = await BusinessScoutPerformanceRequest.findByPk(requestId, {
    attributes: ['id', 'businessId'],
  });
  if (!request) return null;

  const session = await BusinessWsChatSession.findOne({
    where: {
      businessId: request.businessId,
      sessionType: WS_CHAT_SESSION_TYPES.SCOUT_PERFORMANCE,
    },
  });
  if (!session) return null;

  await updatePerformanceRequestMessageStatus({
    sessionId: session.id,
    requestId,
    status: SCOUT_PERFORMANCE_REQUEST_STATUS.REJECTED,
    adminNote: note?.trim() || null,
  });

  const decisionMessage = await BusinessWsChatMessage.create({
    sessionId: session.id,
    senderType: WS_CHAT_SENDER_TYPES.ADMIN,
    adminId,
    messageType: WS_CHAT_MESSAGE_TYPES.PERFORMANCE_DECISION,
    content: note?.trim() || 'JobShare WS đã từ chối yêu cầu Scout Performance.',
    requestPayload: {
      requestId,
      status: SCOUT_PERFORMANCE_REQUEST_STATUS.REJECTED,
      decision: 'rejected',
    },
    isReadByAdmin: true,
    isReadByBusiness: false,
  });

  await touchSessionPreview(session, { content: note || 'Yêu cầu đã bị từ chối' });

  await collaboratorNotificationService.createAndEmit({
    businessId: session.businessId,
    collaboratorId: null,
    adminId: null,
    title: 'Scout Performance — yêu cầu bị từ chối',
    content: note?.trim() || 'JobShare WS đã từ chối yêu cầu Scout Performance.',
    jobId: null,
    url: `/business/messages?tab=ws&sessionId=${session.id}`,
  });

  return formatMessageRow(await decisionMessage.reload({
    include: [{ model: Admin, as: 'admin', required: false, attributes: ['id', 'name', 'email'] }],
  }));
}

export default {
  ensureWsChatSessionForBusiness,
  ensureWsChatSessionForPerformanceRequest,
  hasWsChatMessageForRequest,
  createWsChatSystemMessage,
  createWsChatPerformanceOpenedMessage,
  createWsChatSimilarCandidatesRequestMessage,
  createWsChatPerformanceRequestMessage,
  acceptPerformanceRequestInChat,
  rejectPerformanceRequestInChat,
  listWsChatSessionsForBusiness,
  listWsChatSessionsForAdmin,
  getWsChatSessionForBusiness,
  getWsChatSessionForAdmin,
  listWsChatMessagesForBusiness,
  listWsChatMessagesForAdmin,
  sendWsChatMessageFromBusiness,
  sendWsChatMessageFromAdmin,
  searchWsChatCandidateMentions,
  syncWsChatAfterPerformanceApproval,
  syncWsChatAfterPerformanceRejection,
  getWsChatSessionByPerformanceRequestId,
};
