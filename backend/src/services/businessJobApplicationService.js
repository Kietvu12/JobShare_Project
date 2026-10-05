import { Op, fn, col } from 'sequelize';
import {
  JobApplication,
  Job,
  CVStorage,
  Collaborator,
  Message,
  Business,
  BusinessCtvMarketplaceListing,
  BusinessScoutUnlock,
  BusinessScoutPerformanceRequest,
  JobCategory,
} from '../models/index.js';
import {
  getJobApplicationStatus,
  isValidJobApplicationStatus,
  JOB_APPLICATION_STATUS_MAX,
  MANAGED_PRE_NOMINATION_STATUSES,
  STATUS_PAID,
  STATUS_JOINED_COMPANY,
  STATUS_SCHEDULING_INTERVIEW,
  STATUS_INTERVIEWING,
  STATUS_OFFER_SENT,
  STATUS_WAITING_TO_JOIN,
} from '../constants/jobApplicationStatus.js';
import { SCOUT_PERFORMANCE_REQUEST_STATUS } from '../constants/scoutCredit.js';
import { buildUnlockedScoutPayload, buildPerformanceUnlockedScoutPayload } from './businessScoutService.js';
import { getPerformanceRequestMetaForBusiness } from './scoutPerformanceService.js';
import { statusMessageService } from './statusMessageService.js';
import { collaboratorNotificationService } from './collaboratorNotificationService.js';
import { syncWsChatAfterJoinedCompany } from './businessWsChatService.js';
import { buildCvFileListPayload } from '../controllers/collaborator/cvController.js';

const SENDER_TYPE_BUSINESS = 5;
const HIRED_STATUSES = [12, 14, 15];
const REJECTED_STATUSES = [4, 6, 10, 13, 16, 17, 18];
/** Doanh nghiệp không tự chuyển sang các trạng thái WS xử lý (trùng, sàng lọc WS, Scout Ủy Thác bước 1–6) */
const BUSINESS_WS_ONLY_TARGET_STATUSES = new Set([1, 2, 3, 4, 20, 21, 22, 23]);

/**
 * Bước chuyển hợp lệ của doanh nghiệp theo nguồn — đồng bộ frontend utils/businessApplicationStatusFlow.js.
 * Trạng thái "dừng" không có bước tiếp theo; 16 (huỷ giữa chừng) chọn được ở mọi bước chưa kết thúc.
 */
function getBusinessAllowedNextStatuses(sourceType, status) {
  const n = Number(status);
  const isScoutCredit = sourceType === 'scout_credit';
  const isScoutPerformance = sourceType === 'scout_performance';
  const hasPayment = !isScoutCredit && sourceType !== 'landing' && sourceType !== 'other';

  if (isScoutCredit && n === 19) return [5, 17, 18, 16];
  if (isScoutPerformance && n === 23) return [5, 6, 7, 16];
  if (!isScoutCredit && !isScoutPerformance && n === 2) return [5, 6, 7, 16];

  switch (n) {
    case 3:
    case 5: return [7, 6, 16];
    case 7: return [9, 16];
    case 8: return [9, 7, 16];
    case 9: return [11, 10, 7, 16];
    case 11: return [12, 13, 16];
    case 12: return [14, 16];
    case 14: return hasPayment ? [15, 16] : [16];
    default: return [];
  }
}

function parseStatusFilter(status) {
  const list = String(status)
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isInteger(n));
  if (!list.length) return null;
  return list.length === 1 ? list[0] : { [Op.in]: list };
}

function localDateString(d = new Date()) {
  const pad = (v) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const AUTO_TRANSITION_INTERVAL_MS = 60 * 1000;
const autoTransitionLastRun = new Map();
const SCOUT_CREDIT_APPROACH_STATUSES = new Set([17, 18, 19]);
const WS_CTV_SOURCE_TYPES = new Set(['ctv_marketplace', 'ctv_nomination', 'scout_performance']);
const OTHER_SOURCE_TYPES = new Set(['landing', 'other']);

/** Nguồn được xem full hồ sơ mà không cần Scout unlock qua Sàn CTV */
const FULL_PROFILE_SOURCE_TYPES = new Set(['ctv_marketplace', 'scout_credit', 'scout_performance']);

/** Scout Credit / Scout Performance: chỉ xem hồ sơ, không chat 3 bên */
const PROFILE_ONLY_NO_CHAT_SOURCE_TYPES = new Set(['scout_credit', 'scout_performance']);

const CV_PROFILE_ATTRIBUTES = [
  'id', 'code', 'name', 'furigana', 'email', 'phone', 'birthDate', 'gender',
  'addressOrigin', 'addressCurrent', 'postalCode', 'passport', 'currentResidence',
  'jpResidenceStatus', 'visaExpirationDate', 'otherCountry', 'currentIncome', 'spouse',
  'desiredPosition', 'desiredWorkLocation', 'desiredIncome', 'experienceYears',
  'jlptLevel', 'jpConversationLevel', 'enConversationLevel', 'otherConversationLevel',
  'technicalSkills', 'scoutPublicSummary', 'careerSummary', 'strengths', 'motivation',
  'specialization', 'qualification', 'educations', 'workExperiences', 'certificates',
  'learnedTools', 'experienceTools', 'jobCategoryId', 'scoutListedAt', 'scoutStatus',
  'curriculumVitae', 'cvOriginalPath', 'cvCareerHistoryPath', 'avatarPhotoPath',
];

export const SOURCE_LABELS = {
  ctv_marketplace: 'Sàn CTV (HR Partner)',
  ctv_nomination: 'Tiến cử CTV',
  scout_performance: 'Scout Performance',
  scout_credit: 'Scout Credit',
  landing: 'Branding LP',
  other: 'Khác',
};

export const SOURCE_COLORS = {
  ctv_marketplace: '#8b5cf6',
  ctv_nomination: '#f59e0b',
  scout_performance: '#f59e0b',
  scout_credit: '#3b82f6',
  landing: '#64748b',
  other: '#94a3b8',
};

async function getOwnedJobIds(businessId) {
  const rows = await Job.findAll({
    where: { businessId },
    attributes: ['id'],
  });
  return rows.map((r) => Number(r.id));
}

export async function loadSourceMaps(businessId, jobIds) {
  const safeJobIds = jobIds.length ? jobIds : [-1];
  const [listings, unlocks, perfRequests] = await Promise.all([
    BusinessCtvMarketplaceListing.findAll({
      where: { businessId, jobId: { [Op.in]: safeJobIds } },
      attributes: ['jobId'],
    }),
    BusinessScoutUnlock.findAll({
      where: { businessId },
      attributes: ['cvId'],
    }),
    BusinessScoutPerformanceRequest.findAll({
      where: { businessId },
      attributes: ['cvId'],
    }),
  ]);

  return {
    marketplaceJobIds: new Set(listings.map((l) => Number(l.jobId))),
    unlockCvIds: new Set(unlocks.map((u) => Number(u.cvId)).filter(Boolean)),
    perfCvIds: new Set(perfRequests.map((p) => Number(p.cvId)).filter(Boolean)),
  };
}

export function resolveSourceType(row, maps) {
  const applicantId = row.applicantId ?? row.applicant_id;
  const collaboratorId = row.collaboratorId ?? row.collaborator_id;
  const adminId = row.adminId ?? row.admin_id;
  const cvId = row.cvId ?? row.cv_id;
  const jobId = row.jobId ?? row.job_id;

  if (applicantId) return 'landing';
  if (collaboratorId && jobId && maps.marketplaceJobIds.has(Number(jobId))) {
    return 'ctv_marketplace';
  }
  if (cvId && maps.perfCvIds.has(Number(cvId))) return 'scout_performance';
  if (collaboratorId) return 'ctv_nomination';
  if (adminId && !collaboratorId) return 'scout_performance';
  if (cvId && maps.unlockCvIds.has(Number(cvId))) return 'scout_credit';
  return 'other';
}

function resolveNominatedBy(row) {
  const collaborator = row.collaborator;
  const adminId = row.adminId ?? row.admin_id;
  const applicantId = row.applicantId ?? row.applicant_id;
  if (collaborator?.name) return collaborator.name;
  if (adminId) return 'WS Admin';
  if (applicantId) return 'Ứng viên tự ứng tuyển';
  return 'Doanh nghiệp';
}

function mapSortField(sortBy) {
  const allowed = {
    id: 'id',
    appliedAt: 'applied_at',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };
  return allowed[sortBy] || 'applied_at';
}

async function loadUnreadCounts(applicationIds) {
  if (!applicationIds.length) return {};
  const rows = await Message.findAll({
    attributes: ['jobApplicationId', [fn('COUNT', col('id')), 'unreadCount']],
    where: {
      jobApplicationId: { [Op.in]: applicationIds },
      senderType: { [Op.ne]: SENDER_TYPE_BUSINESS },
      isReadByBusiness: false,
    },
    group: ['jobApplicationId'],
    raw: true,
  });
  const map = {};
  rows.forEach((r) => {
    map[String(r.jobApplicationId)] = Number(r.unreadCount) || 0;
  });
  return map;
}

function formatApplication(row, maps, unreadMap = {}, { withFullProfile = false } = {}) {
  const j = row.toJSON ? row.toJSON() : row;
  const st = getJobApplicationStatus(j.status);
  const sourceType = resolveSourceType(j, maps);
  const cv = j.cv || {};
  const job = j.job || {};
  const canViewFullProfile = FULL_PROFILE_SOURCE_TYPES.has(sourceType);
  const profileOnlyNoChat = PROFILE_ONLY_NO_CHAT_SOURCE_TYPES.has(sourceType);

  const base = {
    id: j.id,
    jobId: j.jobId,
    cvId: j.cvId,
    cvStorageId: j.cvId,
    status: j.status,
    statusLabel: st.label,
    statusCategory: st.category,
    sourceType,
    sourceLabel: SOURCE_LABELS[sourceType] || SOURCE_LABELS.other,
    sourceColor: SOURCE_COLORS[sourceType] || SOURCE_COLORS.other,
    nominatedBy: resolveNominatedBy(j),
    candidateName: cv.name || j.title || '—',
    candidateEmail: cv.email || null,
    candidatePhone: cv.phone || null,
    candidateSub: cv.desiredPosition || null,
    jobTitle: job.title || '—',
    jobCode: job.jobCode || null,
    ctvName: j.collaborator?.name || null,
    ctvId: j.collaboratorId,
    appliedAt: j.appliedAt || j.createdAt,
    interviewDate: j.interviewDate,
    nyushaDate: j.nyushaDate || null,
    memo: j.memo || null,
    rejectNote: j.rejectNote || null,
    unreadCount: unreadMap[String(j.id)] || 0,
    canViewFullProfile,
    profileOnlyNoChat,
    hasNominationChat: !profileOnlyNoChat,
    /** Scout vẫn khóa — không tạo unlock khi xem hồ sơ từ tiến cử sàn CTV */
    scoutUnlocked: maps.unlockCvIds.has(Number(j.cvId)),
  };

  if (withFullProfile && canViewFullProfile && cv?.id) {
    if (sourceType === 'scout_performance') {
      base.candidateProfile = {
        ...buildPerformanceUnlockedScoutPayload(cv),
        accessVia: 'scout_performance',
        scoutStillLocked: !maps.unlockCvIds.has(Number(cv.id)),
      };
    } else if (sourceType === 'scout_credit') {
      base.candidateProfile = {
        ...buildUnlockedScoutPayload(cv),
        accessVia: 'scout_credit',
        scoutStillLocked: false,
      };
    } else {
      base.candidateProfile = {
        ...buildUnlockedScoutPayload(cv),
        accessVia: 'ctv_marketplace',
        scoutStillLocked: !maps.unlockCvIds.has(Number(cv.id)),
      };
    }
  }

  return base;
}

function matchesTab(sourceType, status, tab) {
  if (!tab || tab === 'all') return true;
  const statusNum = Number(status);
  if (tab === 'hired') return HIRED_STATUSES.includes(statusNum);
  if (tab === 'rejected') return REJECTED_STATUSES.includes(statusNum);
  if (tab === 'scout_credit') return sourceType === 'scout_credit';
  if (tab === 'ws_ctv') return WS_CTV_SOURCE_TYPES.has(sourceType);
  if (tab === 'other') return OTHER_SOURCE_TYPES.has(sourceType);
  return true;
}

function matchesSourceFilter(sourceType, sourceTypeFilter) {
  if (!sourceTypeFilter) return true;
  if (sourceTypeFilter === 'ctv_marketplace') {
    return sourceType === 'ctv_marketplace' || sourceType === 'ctv_nomination';
  }
  return sourceType === sourceTypeFilter;
}

export async function listBusinessJobApplications({
  businessId,
  page = 1,
  limit = 20,
  appliedFrom,
  appliedTo,
  search,
  jobId,
  status,
  tab,
  sourceType,
  sortBy = 'appliedAt',
  sortOrder = 'DESC',
  onlyUnreadMessages,
}) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);

  const ownedJobIds = await getOwnedJobIds(businessId);
  if (!ownedJobIds.length) {
    return {
      applications: [],
      pagination: { total: 0, page: safePage, limit: safeLimit, totalPages: 0 },
    };
  }

  await applyScheduledStatusTransitions(businessId, ownedJobIds);
  const maps = await loadSourceMaps(businessId, ownedJobIds);

  const where = {
    jobId: jobId ? parseInt(jobId, 10) : { [Op.in]: ownedJobIds },
  };

  if (status != null && status !== '') {
    const statusFilter = parseStatusFilter(status);
    if (statusFilter != null) where.status = statusFilter;
  }

  if (appliedFrom || appliedTo) {
    where.appliedAt = {};
    if (appliedFrom) where.appliedAt[Op.gte] = new Date(appliedFrom);
    if (appliedTo) {
      const end = new Date(appliedTo);
      if (!Number.isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        where.appliedAt[Op.lte] = end;
      }
    }
  }

  if (tab === 'hired') where.status = { [Op.in]: HIRED_STATUSES };
  if (tab === 'rejected') where.status = { [Op.in]: REJECTED_STATUSES };

  const jobWhere = { businessId };
  const cvInclude = {
    model: CVStorage,
    as: 'cv',
    required: false,
    attributes: ['id', 'name', 'email', 'phone', 'code', 'desiredPosition'],
  };

  if (search?.trim()) {
    const q = `%${search.trim()}%`;
    cvInclude.required = false;
    where[Op.or] = [
      { '$cv.name$': { [Op.like]: q } },
      { '$cv.email$': { [Op.like]: q } },
      { '$cv.code$': { [Op.like]: q } },
      { '$job.title$': { [Op.like]: q } },
      { '$job.jobCode$': { [Op.like]: q } },
    ];
  }

  const orderField = mapSortField(sortBy);
  const orderDirection = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const needPostFilter = (tab && !['hired', 'rejected', 'all'].includes(tab)) || sourceType;

  if (needPostFilter) {
    const { rows } = await JobApplication.findAndCountAll({
      where,
      include: [
        { model: Job, as: 'job', required: true, where: jobWhere, attributes: ['id', 'title', 'jobCode', 'businessId'] },
        cvInclude,
        { model: Collaborator, as: 'collaborator', required: false, attributes: ['id', 'name', 'email'] },
      ],
      order: [[orderField, orderDirection], ['id', 'DESC']],
    });

    let filtered = rows
      .map((r) => formatApplication(r, maps))
      .filter((app) => matchesTab(app.sourceType, app.status, tab))
      .filter((app) => matchesSourceFilter(app.sourceType, sourceType));

    if (onlyUnreadMessages === '1' || onlyUnreadMessages === 'true') {
      const unreadMap = await loadUnreadCounts(filtered.map((a) => a.id));
      filtered = filtered.filter((a) => (unreadMap[String(a.id)] || 0) > 0);
      filtered.forEach((a) => { a.unreadCount = unreadMap[String(a.id)] || 0; });
    } else {
      const unreadMap = await loadUnreadCounts(filtered.map((a) => a.id));
      filtered.forEach((a) => { a.unreadCount = unreadMap[String(a.id)] || 0; });
    }

    const total = filtered.length;
    const offset = (safePage - 1) * safeLimit;
    const applications = filtered.slice(offset, offset + safeLimit);

    return {
      applications,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit) || 0,
      },
    };
  }

  const offset = (safePage - 1) * safeLimit;
  const { count, rows } = await JobApplication.findAndCountAll({
    where,
    include: [
      { model: Job, as: 'job', required: true, where: jobWhere, attributes: ['id', 'title', 'jobCode', 'businessId'] },
      cvInclude,
      { model: Collaborator, as: 'collaborator', required: false, attributes: ['id', 'name', 'email'] },
    ],
    order: [[orderField, orderDirection], ['id', 'DESC']],
    limit: safeLimit,
    offset,
    distinct: true,
  });

  let applications = rows.map((r) => formatApplication(r, maps));
  const unreadMap = await loadUnreadCounts(applications.map((a) => a.id));
  applications = applications.map((a) => ({
    ...a,
    unreadCount: unreadMap[String(a.id)] || 0,
  }));

  if (onlyUnreadMessages === '1' || onlyUnreadMessages === 'true') {
    applications = applications.filter((a) => a.unreadCount > 0);
  }

  return {
    applications,
    pagination: {
      total: count,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(count / safeLimit) || 0,
    },
  };
}

export async function getBusinessJobApplicationStats({ businessId }) {
  const ownedJobIds = await getOwnedJobIds(businessId);
  if (!ownedJobIds.length) {
    return {
      total: 0,
      wsCtv: 0,
      scoutCredit: 0,
      hired: 0,
      pipeline: 0,
      bySource: [],
      byStatusCategory: [],
    };
  }

  await applyScheduledStatusTransitions(businessId, ownedJobIds);
  const maps = await loadSourceMaps(businessId, ownedJobIds);
  const rows = await JobApplication.findAll({
    where: { jobId: { [Op.in]: ownedJobIds } },
    include: [
      { model: Job, as: 'job', required: true, where: { businessId }, attributes: ['id'] },
      { model: Collaborator, as: 'collaborator', required: false, attributes: ['id', 'name'] },
    ],
    attributes: ['id', 'status', 'jobId', 'cvId', 'collaboratorId', 'adminId', 'applicantId'],
  });

  const bySource = {};
  const byStatusCategory = {};
  let wsCtv = 0;
  let scoutCredit = 0;
  let hired = 0;
  let pipeline = 0;

  rows.forEach((row) => {
    const app = formatApplication(row, maps);
    bySource[app.sourceType] = (bySource[app.sourceType] || 0) + 1;
    byStatusCategory[app.statusCategory] = (byStatusCategory[app.statusCategory] || 0) + 1;
    if (WS_CTV_SOURCE_TYPES.has(app.sourceType)) wsCtv += 1;
    if (app.sourceType === 'scout_credit') scoutCredit += 1;
    if (HIRED_STATUSES.includes(Number(app.status))) hired += 1;
    if (['processing', 'interview', 'waiting'].includes(app.statusCategory)) pipeline += 1;
  });

  const total = rows.length;
  const bySourceList = Object.entries(bySource).map(([key, value]) => ({
    sourceType: key,
    label: SOURCE_LABELS[key] || key,
    color: SOURCE_COLORS[key] || '#94a3b8',
    value,
    percent: total ? Math.round((value / total) * 100) : 0,
  }));

  const byStatusCategoryList = Object.entries(byStatusCategory).map(([key, value]) => ({
    category: key,
    value,
  }));

  return {
    total,
    wsCtv,
    scoutCredit,
    hired,
    pipeline,
    bySource: bySourceList,
    byStatusCategory: byStatusCategoryList,
  };
}

export async function getBusinessJobApplicationById({ businessId, applicationId }) {
  const ownedJobIds = await getOwnedJobIds(businessId);
  if (!ownedJobIds.length) return null;

  await applyScheduledStatusTransitions(businessId, ownedJobIds);
  const maps = await loadSourceMaps(businessId, ownedJobIds);
  const row = await JobApplication.findOne({
    where: { id: applicationId, jobId: { [Op.in]: ownedJobIds } },
    include: [
      { model: Job, as: 'job', required: true, where: { businessId }, attributes: ['id', 'title', 'jobCode', 'businessId'] },
      {
        model: CVStorage,
        as: 'cv',
        required: false,
        attributes: CV_PROFILE_ATTRIBUTES,
        include: [
          {
            model: JobCategory,
            as: 'jobCategory',
            required: false,
            attributes: ['id', 'name', 'nameEn', 'nameJp', 'slug'],
          },
        ],
      },
      { model: Collaborator, as: 'collaborator', required: false, attributes: ['id', 'name', 'email'] },
    ],
  });

  if (!row) return null;
  const unreadMap = await loadUnreadCounts([row.id]);
  const application = formatApplication(row, maps, unreadMap, { withFullProfile: true });
  if (application.sourceType === 'scout_performance' && application.cvId) {
    try {
      const meta = await getPerformanceRequestMetaForBusiness({ businessId, cvId: application.cvId });
      if (meta) {
        const closed = [
          SCOUT_PERFORMANCE_REQUEST_STATUS.REJECTED,
          SCOUT_PERFORMANCE_REQUEST_STATUS.CANCELLED,
        ].includes(meta.status);
        application.performanceRequest = {
          id: meta.id,
          status: meta.status,
          wantsSimilarCandidates: meta.wantsSimilarCandidates,
          canRequestSimilar: !closed && !meta.wantsSimilarCandidates,
        };
      }
    } catch (metaError) {
      console.error('[businessJobApplication] performanceRequest meta:', metaError?.message || metaError);
    }
  }
  return application;
}

function parseJsonField(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function assertOwnedApplication(businessId, applicationId) {
  const ownedJobIds = await getOwnedJobIds(businessId);
  if (!ownedJobIds.length) {
    const err = new Error('Không tìm thấy đơn tiến cử');
    err.statusCode = 404;
    throw err;
  }
  const row = await JobApplication.findOne({
    where: { id: applicationId, jobId: { [Op.in]: ownedJobIds } },
    include: [{ model: Job, as: 'job', required: true, attributes: ['id', 'businessId'] }],
  });
  if (!row) {
    const err = new Error('Không tìm thấy đơn tiến cử');
    err.statusCode = 404;
    throw err;
  }
  return row;
}

export async function getBusinessApplicationCv({ businessId, applicationId }) {
  const application = await getBusinessJobApplicationById({ businessId, applicationId });
  if (!application) {
    const err = new Error('Không tìm thấy đơn tiến cử');
    err.statusCode = 404;
    throw err;
  }
  if (!application.canViewFullProfile || !application.cvId) {
    const err = new Error('Không có quyền xem hồ sơ đầy đủ');
    err.statusCode = 403;
    throw err;
  }

  const cv = await CVStorage.findByPk(application.cvId, {
    include: [
      {
        model: Collaborator,
        as: 'collaborator',
        required: false,
        attributes: ['id', 'name', 'email', 'code', 'phone'],
      },
      {
        model: JobCategory,
        as: 'jobCategory',
        required: false,
        attributes: ['id', 'name', 'nameEn', 'nameJp', 'slug', 'parentId'],
      },
    ],
  });
  if (!cv) {
    const err = new Error('Không tìm thấy hồ sơ ứng viên');
    err.statusCode = 404;
    throw err;
  }

  const cvJson = cv.toJSON();
  cvJson.educations = parseJsonField(cvJson.educations);
  cvJson.workExperiences = parseJsonField(cvJson.workExperiences);
  cvJson.certificates = parseJsonField(cvJson.certificates);
  cvJson.learnedTools = parseJsonField(cvJson.learnedTools);
  cvJson.experienceTools = parseJsonField(cvJson.experienceTools);

  if (application.sourceType === 'scout_performance') {
    return {
      cv: {
        ...buildPerformanceUnlockedScoutPayload(cvJson),
        accessVia: 'scout_performance',
        scoutStillLocked: !application.scoutUnlocked,
      },
    };
  }

  if (application.sourceType === 'scout_credit') {
    return {
      cv: {
        ...buildUnlockedScoutPayload(cvJson),
        accessVia: 'scout_credit',
        scoutStillLocked: false,
      },
    };
  }

  cvJson.accessVia = 'ctv_marketplace';
  cvJson.scoutStillLocked = application.candidateProfile?.scoutStillLocked ?? !application.scoutUnlocked;

  return { cv: cvJson };
}

export async function getBusinessApplicationCvFileList({ businessId, applicationId, req }) {
  const application = await getBusinessJobApplicationById({ businessId, applicationId });
  if (!application?.canViewFullProfile || !application.cvId) {
    const err = new Error('Không có quyền xem file hồ sơ');
    err.statusCode = 403;
    throw err;
  }
  const cv = await CVStorage.findByPk(application.cvId);
  if (!cv) {
    const err = new Error('Không tìm thấy hồ sơ ứng viên');
    err.statusCode = 404;
    throw err;
  }
  return buildCvFileListPayload(cv, req);
}

export async function updateBusinessJobApplicationStatus({
  businessId,
  applicationId,
  status,
  rejectNote,
  paymentAmount,
  interviewDate,
  nyushaDate,
  memo,
}) {
  const statusNum = parseInt(status, 10);
  if (!isValidJobApplicationStatus(statusNum)) {
    const err = new Error(`Trạng thái không hợp lệ (phải từ 1 đến ${JOB_APPLICATION_STATUS_MAX})`);
    err.statusCode = 400;
    throw err;
  }

  const current = await getBusinessJobApplicationById({ businessId, applicationId });
  if (!current) {
    const err = new Error('Không tìm thấy đơn tiến cử');
    err.statusCode = 404;
    throw err;
  }
  const currentStatusNum = Number(current.status);
  if (currentStatusNum !== statusNum) {
    if (current.sourceType === 'scout_performance' && MANAGED_PRE_NOMINATION_STATUSES.includes(currentStatusNum)) {
      const err = new Error('Trạng thái Scout Ủy Thác trước tiến cử do WS xử lý — doanh nghiệp chỉ theo dõi');
      err.statusCode = 403;
      throw err;
    }
    if (BUSINESS_WS_ONLY_TARGET_STATUSES.has(statusNum)) {
      const err = new Error('Trạng thái này do WS xử lý');
      err.statusCode = 403;
      throw err;
    }
    if (SCOUT_CREDIT_APPROACH_STATUSES.has(statusNum) && current.sourceType !== 'scout_credit') {
      const err = new Error('Trạng thái tiếp cận chỉ áp dụng cho ứng viên Scout Credit');
      err.statusCode = 400;
      throw err;
    }
    if (!getBusinessAllowedNextStatuses(current.sourceType, currentStatusNum).includes(statusNum)) {
      const err = new Error('Không thể chuyển sang trạng thái này từ bước hiện tại');
      err.statusCode = 400;
      throw err;
    }
    if (statusNum === STATUS_SCHEDULING_INTERVIEW && !interviewDate) {
      const err = new Error('Vui lòng chọn ngày phỏng vấn');
      err.statusCode = 400;
      throw err;
    }
    if (statusNum === STATUS_OFFER_SENT && !nyushaDate) {
      const err = new Error('Vui lòng chọn ngày vào công ty dự kiến');
      err.statusCode = 400;
      throw err;
    }
  }

  if (statusNum === STATUS_PAID) {
    const amount = paymentAmount != null ? parseFloat(paymentAmount) : NaN;
    if (Number.isNaN(amount) || amount < 0) {
      const err = new Error('Vui lòng nhập số tiền thanh toán hợp lệ');
      err.statusCode = 400;
      throw err;
    }
  }

  const jobApplication = await assertOwnedApplication(businessId, applicationId);
  const oldStatus = jobApplication.status;

  jobApplication.status = statusNum;
  if (rejectNote !== undefined) {
    jobApplication.rejectNote = rejectNote;
  }
  if (interviewDate) {
    jobApplication.interviewDate = interviewDate;
  }
  if (nyushaDate) {
    jobApplication.nyushaDate = String(nyushaDate).slice(0, 10);
  }
  if (memo !== undefined) {
    jobApplication.memo = memo != null && String(memo).trim() !== ''
      ? String(memo).trim()
      : null;
  }
  await jobApplication.save();

  if (oldStatus !== statusNum) {
    await runStatusChangeSideEffects({
      jobApplication,
      oldStatus,
      statusNum,
      businessId,
      note: rejectNote != null ? String(rejectNote).trim() || null : null,
      paymentAmount: statusNum === STATUS_PAID && paymentAmount != null ? parseFloat(paymentAmount) : null,
      changedBy: 'business',
      interviewDate: interviewDate || jobApplication.interviewDate,
    });
  }

  const application = await getBusinessJobApplicationById({ businessId, applicationId });
  return { application };
}

async function runStatusChangeSideEffects({
  jobApplication,
  oldStatus,
  statusNum,
  businessId,
  note = null,
  paymentAmount = null,
  changedBy = 'business',
  interviewDate = null,
}) {
    try {
      await statusMessageService.createStatusMessage({
        jobApplicationId: jobApplication.id,
        oldStatus,
        newStatus: statusNum,
        businessId,
        note,
        paymentAmount,
      });
    } catch (messageError) {
      console.error('[businessJobApplication] createStatusMessage:', messageError?.message || messageError);
    }

    if (jobApplication.collaboratorId) {
      try {
        const fullJobApplication = await JobApplication.findByPk(jobApplication.id, {
          include: [
            { model: Job, as: 'job', required: false, attributes: ['id', 'jobCode', 'title'] },
            { model: CVStorage, as: 'cv', required: false, attributes: ['id', 'name', 'code'] },
          ],
        });
        await collaboratorNotificationService.notifyStatusChanged({
          collaboratorId: jobApplication.collaboratorId,
          candidateName: fullJobApplication?.cv?.name || null,
          jobCode: fullJobApplication?.job?.jobCode || String(jobApplication.id),
          status: statusNum,
          nyushaDate: jobApplication.nyushaDate || null,
          jobId: jobApplication.jobId || null,
          jobApplicationId: jobApplication.id,
        });
      } catch (notificationError) {
        console.error('[businessJobApplication] notifyStatusChanged:', notificationError?.message || notificationError);
      }
    }

    if (statusNum === STATUS_JOINED_COMPANY && oldStatus !== STATUS_JOINED_COMPANY) {
      try {
        const fullJobApplication = await JobApplication.findByPk(jobApplication.id, {
          include: [
            { model: Job, as: 'job', required: false, attributes: ['id', 'jobCode', 'businessId'] },
            { model: CVStorage, as: 'cv', required: false, attributes: ['id', 'name', 'code'] },
          ],
        });
        const linkedBusinessId = fullJobApplication?.job?.businessId || businessId;
        let businessName = 'Doanh nghiệp';
        if (linkedBusinessId) {
          const biz = await Business.findByPk(linkedBusinessId, { attributes: ['id', 'companyName'] });
          businessName = biz?.companyName || businessName;
        }
        await syncWsChatAfterJoinedCompany({
          jobApplicationId: jobApplication.id,
          businessId: linkedBusinessId,
          businessName,
          candidateName: fullJobApplication?.cv?.name || null,
          jobCode: fullJobApplication?.job?.jobCode || String(jobApplication.id),
        });
      } catch (adminNotifyError) {
        console.error('[businessJobApplication] syncWsChatAfterJoinedCompany:', adminNotifyError?.message || adminNotifyError);
      }
    }

    if (oldStatus !== statusNum && changedBy !== 'business') {
      try {
        const ownedJobIds = jobApplication.jobId ? [Number(jobApplication.jobId)] : [];
        const maps = ownedJobIds.length ? await loadSourceMaps(businessId, ownedJobIds) : {
          marketplaceJobIds: new Set(),
          unlockCvIds: new Set(),
          perfCvIds: new Set(),
        };
        const sourceType = resolveSourceType(jobApplication, maps);
        const { dispatchApplicationStatusEmails, fireBusinessNotificationEmail } = await import('./businessNotificationEmail/businessNotificationEmailHooks.js');
        fireBusinessNotificationEmail(dispatchApplicationStatusEmails({
          applicationId: jobApplication.id,
          oldStatus,
          newStatus: statusNum,
          sourceType,
          changedBy,
          interviewDate,
        }));
      } catch (emailErr) {
        console.error('[businessJobApplication] status email:', emailErr?.message || emailErr);
      }
    }
}

/**
 * Tự chuyển trạng thái theo ngày đã set:
 * - Đang xếp lịch PV (7, legacy 8) → Đang phỏng vấn (9) khi tới interview_date
 * - Chờ vào công ty (12) → Đã vào công ty (14) khi tới nyusha_date
 */
async function applyScheduledStatusTransitions(businessId, jobIds) {
  if (!jobIds.length) return;
  const lastRun = autoTransitionLastRun.get(businessId) || 0;
  if (Date.now() - lastRun < AUTO_TRANSITION_INTERVAL_MS) return;
  autoTransitionLastRun.set(businessId, Date.now());

  try {
    const due = await JobApplication.findAll({
      where: {
        jobId: { [Op.in]: jobIds },
        [Op.or]: [
          {
            status: { [Op.in]: [STATUS_SCHEDULING_INTERVIEW, 8] },
            interviewDate: { [Op.ne]: null, [Op.lte]: new Date() },
          },
          {
            status: STATUS_WAITING_TO_JOIN,
            nyushaDate: { [Op.ne]: null, [Op.lte]: localDateString() },
          },
        ],
      },
    });
    for (const jobApplication of due) {
      const oldStatus = Number(jobApplication.status);
      const statusNum = oldStatus === STATUS_WAITING_TO_JOIN ? STATUS_JOINED_COMPANY : STATUS_INTERVIEWING;
      jobApplication.status = statusNum;
      await jobApplication.save();
      await runStatusChangeSideEffects({
        jobApplication,
        oldStatus,
        statusNum,
        businessId,
        changedBy: 'system',
        interviewDate: jobApplication.interviewDate,
      });
    }
  } catch (err) {
    console.error('[businessJobApplication] applyScheduledStatusTransitions:', err?.message || err);
  }
}

export async function notifyAdminJobApplicationStatusChange({
  jobApplication,
  oldStatus,
  newStatus,
  interviewDate = null,
}) {
  const jobId = jobApplication.jobId;
  const job = jobId
    ? await Job.findByPk(jobId, { attributes: ['id', 'businessId'] })
    : null;
  const businessId = job?.businessId;
  if (!businessId) return;

  const ownedJobIds = [Number(jobId)];
  const maps = await loadSourceMaps(businessId, ownedJobIds);
  const sourceType = resolveSourceType(jobApplication, maps);
  const { dispatchApplicationStatusEmails, fireBusinessNotificationEmail } = await import('./businessNotificationEmail/businessNotificationEmailHooks.js');
  fireBusinessNotificationEmail(dispatchApplicationStatusEmails({
    applicationId: jobApplication.id,
    oldStatus,
    newStatus,
    sourceType,
    changedBy: 'admin',
    interviewDate: interviewDate || jobApplication.interviewDate,
  }));
}

export default {
  listBusinessJobApplications,
  getBusinessJobApplicationStats,
  getBusinessJobApplicationById,
  getBusinessApplicationCv,
  getBusinessApplicationCvFileList,
  updateBusinessJobApplicationStatus,
  resolveSourceType,
  SOURCE_LABELS,
  notifyAdminJobApplicationStatusChange,
};
