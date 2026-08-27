import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  Admin,
  Business,
  BusinessCreditRequest,
  BusinessSavedCandidate,
  BusinessScoutPerformanceRequest,
  BusinessScoutUnlock,
  BusinessWsChatMessage,
  BusinessWsChatSession,
  BusinessCtvMarketplaceListing,
  CVStorage,
  Job,
  JobCategory,
} from '../models/index.js';
import {
  SCOUT_PERFORMANCE_REQUEST_STATUS,
  SCOUT_UNLOCK_TYPES,
  BUSINESS_CANDIDATE_PIPELINE_VALUES,
  getBusinessCandidatePipelineLabel,
} from '../constants/scoutCredit.js';
import { CREDIT_REQUEST_STATUS } from '../constants/businessBilling.js';
import { getSaiyoBrandingServiceLabel } from '../constants/saiyoBranding.js';
import { collaboratorNotificationService } from './collaboratorNotificationService.js';
import { createBusinessReferralInvoice, getBusinessReferralInvoiceForApplication } from './adminBusinessReferralInvoiceService.js';

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
  CREDIT_REQUEST: 'credit_request',
  CREDIT_DECISION: 'credit_decision',
  APPROACH_STATUS_UPDATE: 'approach_status_update',
  SAIYO_BRANDING_REQUEST: 'saiyo_branding_request',
  SERVICE_REQUEST: 'service_request',
  LISTING_REQUEST: 'listing_request',
  LISTING_DECISION: 'listing_decision',
  REFERRAL_PAYMENT_DRAFT: 'referral_payment_draft',
  REFERRAL_PAYMENT_INVOICE: 'referral_payment_invoice',
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

export async function hasWsChatMessageForRequest({ sessionId, messageType, requestId, jobApplicationId, transaction = null }) {
  const rows = await BusinessWsChatMessage.findAll({
    where: { sessionId, messageType },
    attributes: ['id', 'requestPayload'],
    transaction,
  });
  return rows.some((row) => {
    const p = row.requestPayload || {};
    if (jobApplicationId != null) {
      return Number(p.jobApplicationId) === Number(jobApplicationId);
    }
    return Number(p.requestId) === Number(requestId) || Number(p.listingId) === Number(requestId);
  });
}

function formatCvAttachment(cv) {
  const json = cv?.toJSON ? cv.toJSON() : cv;
  const owner = json.scoutListedByCollaborator || json.collaborator || null;
  return {
    cvId: json.id,
    code: json.code || null,
    name: json.name || null,
    desiredPosition: json.desiredPosition || null,
    jobCategory: json.jobCategory || null,
    experienceYears: json.experienceYears ?? null,
    collaboratorId: owner?.id ?? json.collaboratorId ?? null,
    collaboratorName: owner?.name || null,
  };
}

function resolveCvOwnerCollaborator(cvJson) {
  const owner = cvJson?.scoutListedByCollaborator || cvJson?.collaborator || null;
  return {
    collaboratorId: owner?.id ?? cvJson?.collaboratorId ?? null,
    collaboratorName: owner?.name || null,
  };
}

function buildPerformanceOpenedPreview({ cvJson, job, business }) {
  const cvLabel = cvJson?.code || (cvJson?.id ? `CV #${cvJson.id}` : 'ứng viên');
  const jobLabel = job?.jobCode || job?.title || (job?.id ? `JD #${job.id}` : null);
  const company = business?.companyName || 'DN';
  if (jobLabel) return `Scout Ủy Thác · ${company} · ${cvLabel} · ${jobLabel}`;
  return `Scout Ủy Thác · ${company} · ${cvLabel}`;
}

function buildPerformanceOpenedContent({ cvJson, job, business, businessNote }) {
  const cvCode = cvJson?.code ? `Mã ${cvJson.code}` : (cvJson?.id ? `CV #${cvJson.id}` : '—');
  const cvName = cvJson?.name ? ` · ${cvJson.name}` : '';
  const owner = resolveCvOwnerCollaborator(cvJson);
  const lines = [
    `${business?.companyName || 'Doanh nghiệp'} mở hồ sơ Scout Ủy Thác để WS hearing.`,
    `Ứng viên: ${cvCode}${cvName}`,
  ];
  if (cvJson?.desiredPosition) lines.push(`Vị trí mong muốn: ${cvJson.desiredPosition}`);
  if (owner.collaboratorName) lines.push(`Hồ sơ thuộc CTV: ${owner.collaboratorName}`);
  if (job?.id) {
    const title = job.title || job.titleEn || job.titleJp || `JD #${job.id}`;
    lines.push(`JD hearing: ${title}${job.jobCode ? ` (${job.jobCode})` : ''}`);
  } else {
    lines.push('JD hearing: Chưa chọn — WS cần hearing yêu cầu tuyển dụng với DN');
  }
  if (businessNote?.trim()) lines.push(`Ghi chú DN: ${businessNote.trim()}`);
  return lines.join('\n');
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

async function updateListingRequestMessageStatus({
  sessionId,
  listingId,
  status,
  adminNote = null,
  platformFeePercent = null,
  transaction = null,
}) {
  const rows = await BusinessWsChatMessage.findAll({
    where: { sessionId, messageType: WS_CHAT_MESSAGE_TYPES.LISTING_REQUEST },
    attributes: ['id', 'requestPayload'],
    transaction,
  });
  const message = rows.find((row) => Number(row.requestPayload?.listingId) === Number(listingId));
  if (!message?.requestPayload) return null;

  const payload = {
    ...(message.requestPayload || {}),
    status,
    listingId: listingId || message.requestPayload.listingId,
  };
  if (adminNote) payload.adminNote = adminNote;
  if (platformFeePercent != null) payload.platformFeePercent = platformFeePercent;
  await message.update({ requestPayload: payload }, { transaction });
  return message;
}

async function updateCreditRequestMessageStatus({
  sessionId,
  requestId,
  status,
  adminNote = null,
  transaction = null,
}) {
  const rows = await BusinessWsChatMessage.findAll({
    where: { sessionId, messageType: WS_CHAT_MESSAGE_TYPES.CREDIT_REQUEST },
    attributes: ['id', 'requestPayload'],
    transaction,
  });
  const message = rows.find((row) => Number(row.requestPayload?.requestId) === Number(requestId));
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

async function notifyAdminsCreditRequestCreated({ creditRequest, business, sessionId }) {
  const companyName = business?.companyName || 'Doanh nghiệp';
  const amount = Number(creditRequest.amount) || 0;
  const code = creditRequest.requestCode || `#${creditRequest.id}`;
  const content = `${companyName} yêu cầu nạp ${amount.toLocaleString('vi-VN')} credit (${code}).`;
  const adminUrl = sessionId
    ? `/admin/public-ctv-chat?tab=business&sessionId=${sessionId}`
    : '/admin/business-credit-requests';

  const admins = await Admin.findAll({
    where: { isActive: true, status: 1, role: { [Op.in]: [1, 2] } },
    attributes: ['id'],
  });
  for (const admin of admins) {
    await collaboratorNotificationService.createAndEmit({
      collaboratorId: null,
      adminId: admin.id,
      title: 'Yêu cầu nạp credit mới',
      content,
      jobId: null,
      url: adminUrl,
    });
  }
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
  business = null,
  job = null,
  businessNote = null,
  transaction = null,
}) {
  const session = await BusinessWsChatSession.findByPk(sessionId, { transaction });
  if (!session) return null;

  const cvJson = cv?.toJSON ? cv.toJSON() : cv;
  const jobJson = job?.toJSON ? job.toJSON() : job;
  const businessJson = business?.toJSON ? business.toJSON() : business;
  const owner = resolveCvOwnerCollaborator(cvJson);
  const cvAttachments = cvJson?.id ? [formatCvAttachment(cvJson)] : [];
  const jobTitle = jobJson?.title || jobJson?.titleEn || jobJson?.titleJp || null;

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
        cvName: cvJson?.name || null,
        desiredPosition: cvJson?.desiredPosition || null,
        jobCategory: cvJson?.jobCategory || null,
        collaboratorId: owner.collaboratorId,
        collaboratorName: owner.collaboratorName,
        jobId: jobJson?.id ?? null,
        jobTitle,
        jobCode: jobJson?.jobCode || null,
        businessCompanyName: businessJson?.companyName || null,
        businessNote: businessNote?.trim() || null,
      },
      cvAttachments,
      content: buildPerformanceOpenedContent({
        cvJson,
        job: jobJson,
        business: businessJson,
        businessNote,
      }),
      isReadByBusiness: true,
      isReadByAdmin: false,
    },
    { transaction },
  );

  await touchSessionPreview(session, {
    content: buildPerformanceOpenedPreview({ cvJson, job: jobJson, business: businessJson }),
    transaction,
  });
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

export async function createWsChatCreditRequestMessage({
  businessId,
  creditRequest,
  transaction = null,
}) {
  const business = await Business.findByPk(businessId, {
    attributes: ['id', 'companyName', 'contactName'],
    transaction,
  });
  const session = await ensureWsChatSessionForBusiness({ businessId, business, transaction });

  const already = await hasWsChatMessageForRequest({
    sessionId: session.id,
    messageType: WS_CHAT_MESSAGE_TYPES.CREDIT_REQUEST,
    requestId: creditRequest.id,
    transaction,
  });
  if (already) return { message: null, session };

  const amount = Number(creditRequest.amount) || 0;
  const requestCode = creditRequest.requestCode || creditRequest.request_code;
  const content = `Yêu cầu nạp ${amount.toLocaleString('vi-VN')} credit (${requestCode})`;

  const message = await BusinessWsChatMessage.create(
    {
      sessionId: session.id,
      senderType: WS_CHAT_SENDER_TYPES.BUSINESS,
      businessId,
      messageType: WS_CHAT_MESSAGE_TYPES.CREDIT_REQUEST,
      requestPayload: {
        requestId: creditRequest.id,
        requestCode,
        amount,
        note: creditRequest.note || null,
        paymentMethod: creditRequest.paymentMethod || creditRequest.payment_method || 'bank_transfer',
        status: 'pending',
      },
      content,
      isReadByBusiness: true,
      isReadByAdmin: false,
    },
    { transaction },
  );

  await touchSessionPreview(session, { content, transaction });

  if (!transaction && message) {
    await notifyAdminsCreditRequestCreated({ creditRequest, business, sessionId: session.id });
  }

  return { message, session };
}

async function notifyAdminsListingRequestCreated({ listing, business, job, sessionId }) {
  const companyName = business?.companyName || 'Doanh nghiệp';
  const jobTitle = job?.title || job?.jobCode || `#${listing.jobId}`;
  const content = `${companyName} gửi yêu cầu đăng job "${jobTitle}" lên Sàn CTV — duyệt trong tin nhắn WS.`;
  const adminUrl = sessionId
    ? `/admin/public-ctv-chat?tab=business&sessionId=${sessionId}`
    : `/admin/candidate-sharing?listingId=${listing.id}`;

  const admins = await Admin.findAll({
    where: { isActive: true, status: 1, role: { [Op.in]: [1, 2] } },
    attributes: ['id'],
  });
  for (const admin of admins) {
    await collaboratorNotificationService.createAndEmit({
      collaboratorId: null,
      adminId: admin.id,
      title: 'Job Sàn CTV chờ duyệt',
      content,
      jobId: listing.jobId,
      url: adminUrl,
    });
  }
}

export async function createWsChatListingRequestMessage({
  businessId,
  listing,
  job,
  transaction = null,
}) {
  const business = await Business.findByPk(businessId, {
    attributes: ['id', 'companyName', 'contactName'],
    transaction,
  });
  const session = await ensureWsChatSessionForBusiness({ businessId, business, transaction });

  const listingId = listing?.id ?? listing?.listingId;
  const already = await hasWsChatMessageForRequest({
    sessionId: session.id,
    messageType: WS_CHAT_MESSAGE_TYPES.LISTING_REQUEST,
    requestId: listingId,
    transaction,
  });
  if (already) return { message: null, session };

  const jobTitle = job?.title || job?.titleEn || job?.titleJp || `Job #${job?.id || listing.jobId}`;
  const jobCode = job?.jobCode || job?.job_code || null;
  const platformFeePercent = Number(listing.platformFeePercent ?? listing.platform_fee_percent ?? 20);
  const content = `Yêu cầu đăng job lên Sàn CTV: ${jobTitle}${jobCode ? ` (${jobCode})` : ''}`;

  const message = await BusinessWsChatMessage.create(
    {
      sessionId: session.id,
      senderType: WS_CHAT_SENDER_TYPES.BUSINESS,
      businessId,
      messageType: WS_CHAT_MESSAGE_TYPES.LISTING_REQUEST,
      requestPayload: {
        listingId,
        jobId: listing.jobId,
        jobTitle,
        jobCode,
        referralFeeType: listing.referralFeeType || null,
        referralFeeValue: listing.referralFeeValue != null ? Number(listing.referralFeeValue) : null,
        platformFeePercent,
        status: 'pending',
      },
      content,
      isReadByBusiness: true,
      isReadByAdmin: false,
    },
    { transaction },
  );

  await touchSessionPreview(session, { content, transaction });

  if (!transaction && message) {
    await notifyAdminsListingRequestCreated({
      listing: { id: listingId, jobId: listing.jobId },
      business,
      job,
      sessionId: session.id,
    });
  }

  return { message, session };
}

export async function syncWsChatAfterListingSubmitted({ businessId, listingId }) {
  try {
    const listing = await BusinessCtvMarketplaceListing.findOne({
      where: { id: listingId, businessId },
      include: [{ model: Job, as: 'job', required: false, attributes: ['id', 'title', 'titleEn', 'titleJp', 'jobCode'] }],
    });
    if (!listing) return null;
    const job = listing.job || (listing.jobId ? await Job.findByPk(listing.jobId, { attributes: ['id', 'title', 'titleEn', 'titleJp', 'jobCode'] }) : null);
    const { message, session } = await createWsChatListingRequestMessage({
      businessId,
      listing,
      job,
    });
    return {
      sessionId: session?.id || null,
      message: message ? formatMessageRow(message) : null,
    };
  } catch (error) {
    console.error('[WsChat] syncWsChatAfterListingSubmitted failed:', error?.message || error);
    return null;
  }
}

export async function syncWsChatAfterListingApproval({
  listingId,
  businessId,
  adminId = null,
  adminNote = null,
  platformFeePercent = null,
  jobTitle = null,
}) {
  const session = await BusinessWsChatSession.findOne({
    where: {
      businessId,
      sessionType: WS_CHAT_SESSION_TYPES.SCOUT_PERFORMANCE,
    },
  });
  if (!session) return null;

  const feeLabel = platformFeePercent != null ? `${Number(platformFeePercent)}%` : null;
  await updateListingRequestMessageStatus({
    sessionId: session.id,
    listingId,
    status: 'approved',
    adminNote: adminNote?.trim() || null,
    platformFeePercent: platformFeePercent != null ? Number(platformFeePercent) : null,
  });

  const decisionMessage = await BusinessWsChatMessage.create({
    sessionId: session.id,
    senderType: WS_CHAT_SENDER_TYPES.ADMIN,
    adminId,
    messageType: WS_CHAT_MESSAGE_TYPES.LISTING_DECISION,
    content: adminNote?.trim()
      || `WS đã duyệt và publish job${jobTitle ? ` "${jobTitle}"` : ''} lên Sàn CTV${feeLabel ? ` (phí dịch vụ: ${feeLabel})` : ''}.`,
    requestPayload: {
      listingId,
      status: 'approved',
      decision: 'accepted',
      platformFeePercent: platformFeePercent != null ? Number(platformFeePercent) : null,
      adminNote: adminNote?.trim() || null,
    },
    isReadByAdmin: true,
    isReadByBusiness: false,
  });

  await touchSessionPreview(session, {
    content: adminNote?.trim() || 'Đã duyệt đăng job lên Sàn CTV',
  });

  await collaboratorNotificationService.createAndEmit({
    businessId: session.businessId,
    collaboratorId: null,
    adminId: null,
    title: 'Job đã được WS duyệt trên Sàn CTV',
    content: adminNote?.trim() || `Job${jobTitle ? ` "${jobTitle}"` : ''} đã được publish lên Sàn HR Partner.`,
    jobId: null,
    url: `/business/messages?tab=ws&wsView=chat&sessionId=${session.id}`,
  });

  return formatMessageRow(await decisionMessage.reload({
    include: [{ model: Admin, as: 'admin', required: false, attributes: ['id', 'name', 'email'] }],
  }));
}

export async function syncWsChatAfterListingRejection({
  listingId,
  businessId,
  adminId = null,
  adminNote = null,
  rejectionReason = null,
  jobTitle = null,
}) {
  const session = await BusinessWsChatSession.findOne({
    where: {
      businessId,
      sessionType: WS_CHAT_SESSION_TYPES.SCOUT_PERFORMANCE,
    },
  });
  if (!session) return null;

  const reason = rejectionReason?.trim() || adminNote?.trim() || null;
  await updateListingRequestMessageStatus({
    sessionId: session.id,
    listingId,
    status: 'rejected',
    adminNote: reason,
  });

  const decisionMessage = await BusinessWsChatMessage.create({
    sessionId: session.id,
    senderType: WS_CHAT_SENDER_TYPES.ADMIN,
    adminId,
    messageType: WS_CHAT_MESSAGE_TYPES.LISTING_DECISION,
    content: reason || `WS đã từ chối yêu cầu đăng job${jobTitle ? ` "${jobTitle}"` : ''} lên Sàn CTV.`,
    requestPayload: {
      listingId,
      status: 'rejected',
      decision: 'rejected',
      adminNote: reason,
    },
    isReadByAdmin: true,
    isReadByBusiness: false,
  });

  await touchSessionPreview(session, { content: reason || 'Yêu cầu đăng Sàn CTV bị từ chối' });

  await collaboratorNotificationService.createAndEmit({
    businessId: session.businessId,
    collaboratorId: null,
    adminId: null,
    title: 'Yêu cầu đăng Sàn CTV bị từ chối',
    content: reason || `JobShare WS đã từ chối yêu cầu đăng job lên Sàn CTV.`,
    jobId: null,
    url: `/business/messages?tab=ws&wsView=chat&sessionId=${session.id}`,
  });

  return formatMessageRow(await decisionMessage.reload({
    include: [{ model: Admin, as: 'admin', required: false, attributes: ['id', 'name', 'email'] }],
  }));
}

async function notifyAdminsSaiyoBrandingRequestCreated({ business, sessionId, serviceTitle }) {
  const companyName = business?.companyName || 'Doanh nghiệp';
  const content = `${companyName} yêu cầu dịch vụ Saiyo Branding: ${serviceTitle}.`;
  const adminUrl = sessionId
    ? `/admin/public-ctv-chat?tab=business&sessionId=${sessionId}`
    : '/admin/public-ctv-chat?tab=business';

  const admins = await Admin.findAll({
    where: { isActive: true, status: 1, role: { [Op.in]: [1, 2] } },
    attributes: ['id'],
  });
  for (const admin of admins) {
    await collaboratorNotificationService.createAndEmit({
      collaboratorId: null,
      adminId: admin.id,
      title: 'Yêu cầu Saiyo Branding mới',
      content,
      jobId: null,
      url: adminUrl,
    });
  }
}

export async function createWsChatSaiyoBrandingServiceRequestMessage({
  businessId,
  serviceKey,
  serviceTitle,
  note = null,
  transaction = null,
}) {
  const business = await Business.findByPk(businessId, {
    attributes: ['id', 'companyName', 'contactName'],
    transaction,
  });
  const session = await ensureWsChatSessionForBusiness({ businessId, business, transaction });

  const title = serviceTitle?.trim() || getSaiyoBrandingServiceLabel(serviceKey);
  const content = `Yêu cầu dịch vụ Saiyo Branding: ${title}`;
  const requestedAt = new Date().toISOString();

  const message = await BusinessWsChatMessage.create(
    {
      sessionId: session.id,
      senderType: WS_CHAT_SENDER_TYPES.BUSINESS,
      businessId,
      messageType: WS_CHAT_MESSAGE_TYPES.SAIYO_BRANDING_REQUEST,
      requestPayload: {
        serviceKey,
        serviceTitle: title,
        note: note ? String(note).trim() : null,
        status: 'pending',
        requestedAt,
      },
      content,
      isReadByBusiness: true,
      isReadByAdmin: false,
    },
    { transaction },
  );

  await touchSessionPreview(session, { content, transaction });

  if (!transaction && message) {
    await notifyAdminsSaiyoBrandingRequestCreated({ business, sessionId: session.id, serviceTitle: title });
  }

  return { message, session };
}

export async function createWsChatBusinessServiceRequestMessage({
  businessId,
  serviceKey,
  serviceTitle,
  note = null,
  transaction = null,
}) {
  const business = await Business.findByPk(businessId, {
    attributes: ['id', 'companyName', 'contactName'],
    transaction,
  });
  const session = await ensureWsChatSessionForBusiness({ businessId, business, transaction });

  const title = serviceTitle?.trim() || String(serviceKey || 'Dịch vụ');
  const content = `Yêu cầu dịch vụ: ${title}`;
  const requestedAt = new Date().toISOString();

  const message = await BusinessWsChatMessage.create(
    {
      sessionId: session.id,
      senderType: WS_CHAT_SENDER_TYPES.BUSINESS,
      businessId,
      messageType: WS_CHAT_MESSAGE_TYPES.SERVICE_REQUEST,
      requestPayload: {
        serviceKey,
        serviceTitle: title,
        note: note ? String(note).trim() : null,
        status: 'pending',
        requestedAt,
      },
      content,
      isReadByBusiness: true,
      isReadByAdmin: false,
    },
    { transaction },
  );

  const requestCode = `SR-${String(new Date().getFullYear()).slice(2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(message.id).padStart(3, '0')}`;
  const payload = {
    ...(message.requestPayload || {}),
    requestCode,
  };
  await message.update({ requestPayload: payload }, { transaction });

  await touchSessionPreview(session, { content, transaction });

  if (!transaction && message) {
    try {
      await notifyAdminsSaiyoBrandingRequestCreated({
        business,
        sessionId: session.id,
        serviceTitle: title,
      });
    } catch (err) {
      console.error('[ServiceRequest] admin notify failed:', err?.message || err);
    }
  }

  return { message, session, requestCode };
}

const ALLOWED_SERVICE_REQUEST_KEYS = new Set([
  'landing_page_premium',
  'recruitment_ads',
  'seminar_campaign',
  'company_profile',
  'other_service',
]);

const SERVICE_REQUEST_TITLE_MAP = {
  landing_page_premium: 'Yêu cầu Landing Page premium',
  recruitment_ads: 'Yêu cầu chạy quảng cáo tuyển dụng',
  seminar_campaign: 'Yêu cầu tổ chức Seminar / Campaign tuyển dụng',
  company_profile: 'Yêu cầu thiết kế profile company',
  other_service: 'Yêu cầu dịch vụ khác',
};

export async function createBusinessServiceRequest({ businessId, serviceKey, serviceTitle, note }) {
  const key = String(serviceKey || '').trim();
  if (!ALLOWED_SERVICE_REQUEST_KEYS.has(key)) {
    const err = new Error(`Loại dịch vụ không hợp lệ (${key || 'trống'})`);
    err.statusCode = 400;
    throw err;
  }

  const title = String(serviceTitle || SERVICE_REQUEST_TITLE_MAP[key] || key).trim();
  const { message, session, requestCode } = await createWsChatBusinessServiceRequestMessage({
    businessId,
    serviceKey: key,
    serviceTitle: title,
    note,
  });

  return {
    requestCode,
    serviceKey: key,
    serviceTitle: title,
    note: note ? String(note).trim() : null,
    sessionId: session?.id || null,
    messageId: message?.id || null,
  };
}

/** Backfill: pending credit requests chưa có tin nhắn chat (yêu cầu tạo trước khi bật sync). */
export async function ensurePendingCreditRequestsInWsChat({ businessId }) {
  if (!businessId) return;

  const pendingRows = await BusinessCreditRequest.findAll({
    where: { businessId, status: CREDIT_REQUEST_STATUS.PENDING },
    order: [['id', 'ASC']],
  });
  if (!pendingRows.length) return;

  for (const row of pendingRows) {
    const json = row.toJSON ? row.toJSON() : row;
    try {
      await createWsChatCreditRequestMessage({
        businessId,
        creditRequest: {
          id: json.id,
          requestCode: json.requestCode || json.request_code,
          amount: json.amount,
          note: json.note,
          paymentMethod: json.paymentMethod || json.payment_method,
        },
      });
    } catch (err) {
      console.error('[WsChat] ensurePendingCreditRequestsInWsChat failed:', {
        businessId,
        requestId: json.id,
        message: err?.message || err,
      });
    }
  }
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

  const sessionInclude = [
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
  ];

  let { count, rows } = await BusinessWsChatSession.findAndCountAll({
    where,
    limit: safeLimit,
    offset,
    order: [['last_message_at', 'DESC'], ['id', 'DESC']],
    include: sessionInclude,
  });

  if (count === 0 && safePage === 1 && !(search && String(search).trim())) {
    const business = await Business.findByPk(businessId, {
      attributes: ['id', 'companyName', 'contactName'],
    });
    await ensureWsChatSessionForBusiness({ businessId, business });
    ({ count, rows } = await BusinessWsChatSession.findAndCountAll({
      where,
      limit: safeLimit,
      offset,
      order: [['last_message_at', 'DESC'], ['id', 'DESC']],
      include: sessionInclude,
    }));
  }

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
  await ensurePendingCreditRequestsInWsChat({ businessId });

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

  return messages
    .filter((m) => m.messageType !== WS_CHAT_MESSAGE_TYPES.REFERRAL_PAYMENT_DRAFT)
    .map(formatMessageRow);
}

export async function listWsChatMessagesForAdmin({ sessionId }) {
  const session = await loadSessionForAdmin(sessionId);
  await ensurePendingCreditRequestsInWsChat({ businessId: session.businessId });

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

export async function syncWsChatAfterCreditRequestCreated({ businessId, creditRequest }) {
  try {
    const { message, session } = await createWsChatCreditRequestMessage({ businessId, creditRequest });
    return {
      sessionId: session?.id || null,
      message: message ? formatMessageRow(message) : null,
    };
  } catch (error) {
    console.error('[WsChat] syncWsChatAfterCreditRequestCreated failed:', error?.message || error);
    return null;
  }
}

async function notifyAdminsReferralPaymentDraftCreated({
  businessName,
  candidateName,
  jobCode,
  jobApplicationId,
  sessionId,
}) {
  const admins = await Admin.findAll({
    where: { isActive: true, status: 1, role: { [Op.in]: [1, 2] } },
    attributes: ['id'],
  });
  const safeBusiness = businessName || 'Doanh nghiệp';
  const safeJobCode = jobCode || 'N/A';
  const safeCandidate = candidateName || 'Ứng viên';
  const content = `${safeBusiness} đã chuyển đơn tiến cử ${safeJobCode} (${safeCandidate}) thành Đã vào công ty. Vui lòng nhập số tiền phí giới thiệu trong chat WS.`;
  const url = sessionId
    ? `/admin/public-ctv-chat?tab=business&sessionId=${sessionId}`
    : '/admin/public-ctv-chat?tab=business';

  for (const admin of admins) {
    await collaboratorNotificationService.createAndEmit({
      collaboratorId: null,
      adminId: admin.id,
      title: 'Đã vào công ty — tạo yêu cầu TT',
      content,
      jobId: null,
      url,
    });
  }
}

/** Khi ứng viên vào công ty: tạo thẻ form phí giới thiệu trong chat WS (không phải chat đơn tiến cử). */
export async function syncWsChatAfterJoinedCompany({
  jobApplicationId,
  businessId,
  businessName = null,
  candidateName = null,
  jobCode = null,
}) {
  try {
    if (!jobApplicationId || !businessId) return null;

    const existingInvoice = await getBusinessReferralInvoiceForApplication(jobApplicationId).catch(() => null);
    if (existingInvoice) return { sessionId: null, session: null, message: null };

    const business = await Business.findByPk(businessId, {
      attributes: ['id', 'companyName', 'contactName'],
    });
    const session = await ensureWsChatSessionForBusiness({ businessId, business });

    const hasDraft = await hasWsChatMessageForRequest({
      sessionId: session.id,
      messageType: WS_CHAT_MESSAGE_TYPES.REFERRAL_PAYMENT_DRAFT,
      jobApplicationId,
    });
    const hasInvoiceMsg = await hasWsChatMessageForRequest({
      sessionId: session.id,
      messageType: WS_CHAT_MESSAGE_TYPES.REFERRAL_PAYMENT_INVOICE,
      jobApplicationId,
    });
    if (hasDraft || hasInvoiceMsg) {
      return { sessionId: session.id, session, message: null };
    }

    const companyLabel = businessName || business?.companyName || 'Doanh nghiệp';
    const candidateLabel = candidateName || 'Ứng viên';
    const jobLabel = jobCode || String(jobApplicationId);
    const content = `${companyLabel} — ${candidateLabel} đã vào công ty (${jobLabel}). Nhập số tiền phí giới thiệu.`;

    const message = await BusinessWsChatMessage.create({
      sessionId: session.id,
      senderType: WS_CHAT_SENDER_TYPES.SYSTEM,
      businessId,
      messageType: WS_CHAT_MESSAGE_TYPES.REFERRAL_PAYMENT_DRAFT,
      requestPayload: {
        jobApplicationId: Number(jobApplicationId),
        jobCode: jobCode || null,
        candidateName: candidateName || null,
        businessName: companyLabel,
        status: 'pending_amount',
        amount: null,
      },
      content,
      isReadByAdmin: false,
      isReadByBusiness: false,
    });

    await touchSessionPreview(session, { content: `Phí giới thiệu — ${candidateLabel}` });

    await notifyAdminsReferralPaymentDraftCreated({
      businessName: companyLabel,
      candidateName: candidateLabel,
      jobCode: jobLabel,
      jobApplicationId,
      sessionId: session.id,
    });

    return {
      sessionId: session.id,
      session,
      message: formatMessageRow(message),
    };
  } catch (error) {
    console.error('[WsChat] syncWsChatAfterJoinedCompany failed:', error?.message || error);
    return null;
  }
}

/** Admin nhập số tiền trong chat WS → tạo hóa đơn Billing + gửi yêu cầu TT cho DN. */
export async function submitReferralPaymentInWsChat({
  sessionId,
  adminId,
  jobApplicationId,
  amount,
}) {
  const session = await loadSessionForAdmin(sessionId);
  if (!session?.businessId) {
    const err = new Error('Không tìm thấy phiên chat WS');
    err.statusCode = 404;
    throw err;
  }

  const draftRows = await BusinessWsChatMessage.findAll({
    where: {
      sessionId,
      messageType: WS_CHAT_MESSAGE_TYPES.REFERRAL_PAYMENT_DRAFT,
    },
    order: [['id', 'DESC']],
  });
  const draft = draftRows.find(
    (row) => Number(row.requestPayload?.jobApplicationId) === Number(jobApplicationId),
  );
  if (!draft) {
    const err = new Error('Không tìm thấy yêu cầu phí giới thiệu trong chat');
    err.statusCode = 404;
    throw err;
  }
  if (draft.requestPayload?.status !== 'pending_amount') {
    const err = new Error('Yêu cầu phí giới thiệu đã được xử lý');
    err.statusCode = 409;
    throw err;
  }

  const invoiceResult = await createBusinessReferralInvoice({
    jobApplicationId,
    amount,
    adminId,
    wsSessionId: sessionId,
  });
  const invoice = invoiceResult.invoice;
  const payload = draft.requestPayload || {};

  draft.requestPayload = {
    ...payload,
    status: 'submitted',
    amount: invoice.amount,
    invoiceId: invoice.id,
    invoiceCode: invoice.invoiceCode,
  };
  draft.isReadByAdmin = true;
  await draft.save();

  const invoiceContent = `Yêu cầu thanh toán phí giới thiệu: ${Number(invoice.amount).toLocaleString('vi-VN')} VNĐ (${invoice.invoiceCode})`;
  const invoiceMessage = await BusinessWsChatMessage.create({
    sessionId,
    senderType: WS_CHAT_SENDER_TYPES.SYSTEM,
    adminId: adminId || null,
    businessId: session.businessId,
    messageType: WS_CHAT_MESSAGE_TYPES.REFERRAL_PAYMENT_INVOICE,
    requestPayload: {
      jobApplicationId: Number(jobApplicationId),
      jobCode: payload.jobCode || invoiceResult.jobCode || null,
      candidateName: payload.candidateName || invoiceResult.candidateName || null,
      invoiceId: invoice.id,
      invoiceCode: invoice.invoiceCode,
      amount: invoice.amount,
      status: invoice.status || 'unpaid',
    },
    content: invoiceContent,
    isReadByAdmin: true,
    isReadByBusiness: false,
  });

  await touchSessionPreview(session, { content: invoiceContent });

  return {
    invoice,
    draftMessage: formatMessageRow(await draft.reload({
      include: [{ model: Admin, as: 'admin', required: false, attributes: ['id', 'name', 'email'] }],
    })),
    invoiceMessage: formatMessageRow(await invoiceMessage.reload({
      include: [{ model: Admin, as: 'admin', required: false, attributes: ['id', 'name', 'email'] }],
    })),
  };
}

export async function syncAllPendingCreditRequestsForBusiness({ businessId }) {
  await ensurePendingCreditRequestsInWsChat({ businessId });
  const session = await BusinessWsChatSession.findOne({
    where: { businessId, sessionType: WS_CHAT_SESSION_TYPES.SCOUT_PERFORMANCE },
  });
  return { sessionId: session?.id || null };
}

export async function syncWsChatAfterCreditApproval({
  requestId,
  businessId,
  adminId = null,
  adminNote = null,
  amount = null,
  requestCode = null,
}) {
  const session = await BusinessWsChatSession.findOne({
    where: {
      businessId,
      sessionType: WS_CHAT_SESSION_TYPES.SCOUT_PERFORMANCE,
    },
  });
  if (!session) return null;

  await updateCreditRequestMessageStatus({
    sessionId: session.id,
    requestId,
    status: 'approved',
    adminNote: adminNote?.trim() || null,
  });

  const creditLabel = amount != null ? `${Number(amount).toLocaleString('vi-VN')} credit` : 'credit';
  const codeLabel = requestCode ? ` (${requestCode})` : '';
  const decisionMessage = await BusinessWsChatMessage.create({
    sessionId: session.id,
    senderType: WS_CHAT_SENDER_TYPES.ADMIN,
    adminId,
    messageType: WS_CHAT_MESSAGE_TYPES.CREDIT_DECISION,
    content: adminNote?.trim() || `WS đã duyệt yêu cầu nạp ${creditLabel}${codeLabel}. Credit đã được cộng vào tài khoản.`,
    requestPayload: {
      requestId,
      requestCode,
      amount,
      status: 'approved',
      decision: 'accepted',
      adminNote: adminNote?.trim() || null,
    },
    isReadByAdmin: true,
    isReadByBusiness: false,
  });

  await touchSessionPreview(session, {
    content: adminNote?.trim() || `Đã duyệt yêu cầu nạp ${creditLabel}`,
  });

  await collaboratorNotificationService.createAndEmit({
    businessId: session.businessId,
    collaboratorId: null,
    adminId: null,
    title: 'Yêu cầu nạp credit đã được duyệt',
    content: adminNote?.trim() || `WS đã duyệt và cộng ${creditLabel} vào tài khoản của bạn.`,
    jobId: null,
    url: `/business/messages?tab=ws&wsView=chat&sessionId=${session.id}`,
  });

  return formatMessageRow(await decisionMessage.reload({
    include: [{ model: Admin, as: 'admin', required: false, attributes: ['id', 'name', 'email'] }],
  }));
}

export async function syncWsChatAfterCreditRejection({
  requestId,
  businessId,
  adminId = null,
  adminNote = null,
  requestCode = null,
}) {
  const session = await BusinessWsChatSession.findOne({
    where: {
      businessId,
      sessionType: WS_CHAT_SESSION_TYPES.SCOUT_PERFORMANCE,
    },
  });
  if (!session) return null;

  await updateCreditRequestMessageStatus({
    sessionId: session.id,
    requestId,
    status: 'rejected',
    adminNote: adminNote?.trim() || null,
  });

  const codeLabel = requestCode ? ` (${requestCode})` : '';
  const decisionMessage = await BusinessWsChatMessage.create({
    sessionId: session.id,
    senderType: WS_CHAT_SENDER_TYPES.ADMIN,
    adminId,
    messageType: WS_CHAT_MESSAGE_TYPES.CREDIT_DECISION,
    content: adminNote?.trim() || `WS đã từ chối yêu cầu nạp credit${codeLabel}.`,
    requestPayload: {
      requestId,
      requestCode,
      status: 'rejected',
      decision: 'rejected',
      adminNote: adminNote?.trim() || null,
    },
    isReadByAdmin: true,
    isReadByBusiness: false,
  });

  await touchSessionPreview(session, { content: adminNote?.trim() || 'Yêu cầu nạp credit bị từ chối' });

  await collaboratorNotificationService.createAndEmit({
    businessId: session.businessId,
    collaboratorId: null,
    adminId: null,
    title: 'Yêu cầu nạp credit bị từ chối',
    content: adminNote?.trim() || `WS đã từ chối yêu cầu nạp credit${codeLabel}.`,
    jobId: null,
    url: `/business/messages?tab=ws&wsView=chat&sessionId=${session.id}`,
  });

  return formatMessageRow(await decisionMessage.reload({
    include: [{ model: Admin, as: 'admin', required: false, attributes: ['id', 'name', 'email'] }],
  }));
}

export async function syncWsChatAfterCreditCancellation({
  requestId,
  businessId,
}) {
  const session = await BusinessWsChatSession.findOne({
    where: {
      businessId,
      sessionType: WS_CHAT_SESSION_TYPES.SCOUT_PERFORMANCE,
    },
  });
  if (!session) return null;

  await updateCreditRequestMessageStatus({
    sessionId: session.id,
    requestId,
    status: 'cancelled',
  });

  return createWsChatSystemMessage({
    sessionId: session.id,
    content: 'Doanh nghiệp đã hủy yêu cầu nạp credit đang chờ duyệt.',
  });
}

export async function acceptCreditRequestInChat({
  sessionId,
  adminId,
  requestId,
  note,
}) {
  const session = await loadSessionForAdmin(sessionId);
  const creditRequestId = parseInt(requestId, 10);
  if (!Number.isFinite(creditRequestId) || creditRequestId <= 0) {
    const err = new Error('Thiếu mã yêu cầu nạp credit');
    err.statusCode = 400;
    throw err;
  }

  const { approveBusinessCreditRequest } = await import('./businessCreditRequestService.js');
  const request = await approveBusinessCreditRequest({
    requestId: creditRequestId,
    adminId,
    adminNote: note,
  });

  if (Number(request.businessId) !== Number(session.businessId)) {
    const err = new Error('Yêu cầu không thuộc cuộc trò chuyện này');
    err.statusCode = 403;
    throw err;
  }

  return { request };
}

export async function rejectCreditRequestInChat({
  sessionId,
  adminId,
  requestId,
  note,
}) {
  const session = await loadSessionForAdmin(sessionId);
  const creditRequestId = parseInt(requestId, 10);
  if (!Number.isFinite(creditRequestId) || creditRequestId <= 0) {
    const err = new Error('Thiếu mã yêu cầu nạp credit');
    err.statusCode = 400;
    throw err;
  }

  const { rejectBusinessCreditRequest } = await import('./businessCreditRequestService.js');
  const request = await rejectBusinessCreditRequest({
    requestId: creditRequestId,
    adminId,
    adminNote: note,
  });

  if (Number(request.businessId) !== Number(session.businessId)) {
    const err = new Error('Yêu cầu không thuộc cuộc trò chuyện này');
    err.statusCode = 403;
    throw err;
  }

  return { request };
}

export async function acceptListingRequestInChat({
  sessionId,
  adminId,
  listingId,
  platformFeePercent,
  note,
  autoPublish = true,
}) {
  const session = await loadSessionForAdmin(sessionId);
  const parsedListingId = parseInt(listingId, 10);
  if (!Number.isFinite(parsedListingId) || parsedListingId <= 0) {
    const err = new Error('Thiếu mã listing Sàn CTV');
    err.statusCode = 400;
    throw err;
  }

  const listingRow = await BusinessCtvMarketplaceListing.findByPk(parsedListingId, {
    include: [{ model: Job, as: 'job', attributes: ['id', 'title', 'jobCode'] }],
  });
  if (!listingRow) {
    const err = new Error('Không tìm thấy listing');
    err.statusCode = 404;
    throw err;
  }
  if (Number(listingRow.businessId) !== Number(session.businessId)) {
    const err = new Error('Listing không thuộc cuộc trò chuyện này');
    err.statusCode = 403;
    throw err;
  }

  const { approveAndPublishListing } = await import('./candidateSharingService.js');
  const listing = await approveAndPublishListing({
    listingId: parsedListingId,
    adminId,
    adminNote: note,
    autoPublish: autoPublish !== false,
    platformFeePercent,
    skipWsSync: true,
  });

  await syncWsChatAfterListingApproval({
    listingId: parsedListingId,
    businessId: session.businessId,
    adminId,
    adminNote: note,
    platformFeePercent: listing.platformFeePercent,
    jobTitle: listingRow.job?.title || listingRow.job?.jobCode,
  });

  return { listing };
}

export async function rejectListingRequestInChat({
  sessionId,
  adminId,
  listingId,
  note,
  rejectionReason,
}) {
  const session = await loadSessionForAdmin(sessionId);
  const parsedListingId = parseInt(listingId, 10);
  if (!Number.isFinite(parsedListingId) || parsedListingId <= 0) {
    const err = new Error('Thiếu mã listing Sàn CTV');
    err.statusCode = 400;
    throw err;
  }

  const listingRow = await BusinessCtvMarketplaceListing.findByPk(parsedListingId, {
    include: [{ model: Job, as: 'job', attributes: ['id', 'title', 'jobCode'] }],
  });
  if (!listingRow) {
    const err = new Error('Không tìm thấy listing');
    err.statusCode = 404;
    throw err;
  }
  if (Number(listingRow.businessId) !== Number(session.businessId)) {
    const err = new Error('Listing không thuộc cuộc trò chuyện này');
    err.statusCode = 403;
    throw err;
  }

  const { rejectListing } = await import('./candidateSharingService.js');
  const listing = await rejectListing({
    listingId: parsedListingId,
    adminId,
    rejectionReason: rejectionReason || note,
    adminNote: note,
    skipWsSync: true,
  });

  await syncWsChatAfterListingRejection({
    listingId: parsedListingId,
    businessId: session.businessId,
    adminId,
    adminNote: note,
    rejectionReason: rejectionReason || note,
    jobTitle: listingRow.job?.title || listingRow.job?.jobCode,
  });

  return { listing };
}

export async function listScoutPerformanceCandidatesForWsSession({ sessionId }) {
  const session = await loadSessionForAdmin(sessionId);
  const { listUnlockedCandidatesForBusiness } = await import('./businessScoutService.js');
  return listUnlockedCandidatesForBusiness({
    businessId: session.businessId,
    unlockType: SCOUT_UNLOCK_TYPES.SCOUT_PERFORMANCE,
    page: 1,
    limit: 100,
    sortBy: 'unlockedAt',
    sortOrder: 'DESC',
  });
}

export async function listBusinessJobsForWsSession({ sessionId }) {
  const session = await loadSessionForAdmin(sessionId);
  const rows = await Job.findAll({
    where: {
      businessId: session.businessId,
      status: 1,
    },
    attributes: ['id', 'jobCode', 'title', 'titleEn', 'titleJp', 'slug', 'status', 'updatedAt'],
    order: [['updated_at', 'DESC'], ['id', 'DESC']],
    limit: 200,
  });
  return {
    jobs: rows.map((row) => {
      const json = row.toJSON();
      return {
        id: json.id,
        jobCode: json.jobCode || null,
        title: json.title || null,
        titleEn: json.titleEn || null,
        titleJp: json.titleJp || null,
        slug: json.slug || null,
        status: json.status,
        updatedAt: json.updatedAt || null,
      };
    }),
  };
}

export async function updateScoutPerformanceApproachStatusInWsChat({
  sessionId,
  adminId,
  cvId,
  pipelineStatus,
}) {
  const session = await loadSessionForAdmin(sessionId);
  const parsedCvId = parseInt(cvId, 10);
  if (!Number.isFinite(parsedCvId) || parsedCvId <= 0) {
    const err = new Error('ID hồ sơ không hợp lệ');
    err.statusCode = 400;
    throw err;
  }

  const normalizedStatus = String(pipelineStatus || '').trim();
  if (!BUSINESS_CANDIDATE_PIPELINE_VALUES.includes(normalizedStatus)) {
    const err = new Error('Trạng thái tiếp cận không hợp lệ');
    err.statusCode = 400;
    throw err;
  }

  const unlock = await BusinessScoutUnlock.findOne({
    where: {
      businessId: session.businessId,
      cvId: parsedCvId,
      unlockType: SCOUT_UNLOCK_TYPES.SCOUT_PERFORMANCE,
    },
    include: [
      {
        model: CVStorage,
        as: 'cv',
        required: true,
        include: [
          {
            model: JobCategory,
            as: 'jobCategory',
            required: false,
            attributes: ['id', 'name', 'nameEn', 'nameJp', 'slug'],
          },
        ],
      },
    ],
  });

  if (!unlock?.cv) {
    const err = new Error('Không tìm thấy ứng viên Scout Performance của doanh nghiệp này');
    err.statusCode = 404;
    throw err;
  }

  const label = getBusinessCandidatePipelineLabel(normalizedStatus);
  const cvJson = unlock.cv.toJSON();

  let saved = await BusinessSavedCandidate.findOne({
    where: { businessId: session.businessId, cvId: parsedCvId },
  });

  const previousPipelineStatus = saved?.pipelineStatus || null;

  if (!saved) {
    saved = await BusinessSavedCandidate.create({
      businessId: session.businessId,
      cvId: parsedCvId,
      source: SCOUT_UNLOCK_TYPES.SCOUT_PERFORMANCE,
      scoutUnlockId: unlock.id,
      pipelineStatus: normalizedStatus,
      savedAt: new Date(),
    });
  } else if (saved.pipelineStatus !== normalizedStatus) {
    await saved.update({ pipelineStatus: normalizedStatus });
  }

  if (previousPipelineStatus === normalizedStatus) {
    return {
      candidate: {
        id: parsedCvId,
        code: cvJson.code || null,
        pipelineStatus: normalizedStatus,
        pipelineStatusLabel: label,
      },
      message: null,
      unchanged: true,
    };
  }

  const cvLabel = cvJson.code || `CV #${parsedCvId}`;
  const content = `WS đã đổi trạng thái tiếp cận ứng viên ${cvLabel} sang thành — ${label}`;

  const message = await BusinessWsChatMessage.create({
    sessionId: session.id,
    senderType: WS_CHAT_SENDER_TYPES.SYSTEM,
    adminId: adminId || null,
    messageType: WS_CHAT_MESSAGE_TYPES.APPROACH_STATUS_UPDATE,
    content,
    requestPayload: {
      cvId: parsedCvId,
      pipelineStatus: normalizedStatus,
      pipelineStatusLabel: label,
      cvCode: cvJson.code || null,
      previousPipelineStatus,
    },
    cvAttachments: [formatCvAttachment(cvJson)],
    isReadByBusiness: false,
    isReadByAdmin: true,
  });

  await touchSessionPreview(session, { content });

  return {
    candidate: {
      id: parsedCvId,
      code: cvJson.code || null,
      name: cvJson.name || null,
      desiredPosition: cvJson.desiredPosition || null,
      pipelineStatus: normalizedStatus,
      pipelineStatusLabel: label,
    },
    message: formatMessageRow(message),
  };
}

export default {
  ensureWsChatSessionForBusiness,
  ensureWsChatSessionForPerformanceRequest,
  hasWsChatMessageForRequest,
  createWsChatSystemMessage,
  createWsChatPerformanceOpenedMessage,
  createWsChatSimilarCandidatesRequestMessage,
  createWsChatPerformanceRequestMessage,
  createWsChatCreditRequestMessage,
  createWsChatSaiyoBrandingServiceRequestMessage,
  acceptPerformanceRequestInChat,
  rejectPerformanceRequestInChat,
  acceptCreditRequestInChat,
  rejectCreditRequestInChat,
  acceptListingRequestInChat,
  rejectListingRequestInChat,
  listScoutPerformanceCandidatesForWsSession,
  listBusinessJobsForWsSession,
  updateScoutPerformanceApproachStatusInWsChat,
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
  ensurePendingCreditRequestsInWsChat,
  syncAllPendingCreditRequestsForBusiness,
  syncWsChatAfterCreditRequestCreated,
  syncWsChatAfterJoinedCompany,
  submitReferralPaymentInWsChat,
  syncWsChatAfterCreditApproval,
  syncWsChatAfterCreditRejection,
  syncWsChatAfterCreditCancellation,
  getWsChatSessionByPerformanceRequestId,
};
