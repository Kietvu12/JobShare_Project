import { Op, fn, col } from 'sequelize';
import {
  JobApplication,
  Job,
  CVStorage,
  Collaborator,
  Message,
  BusinessCtvMarketplaceListing,
  BusinessScoutUnlock,
  BusinessScoutPerformanceRequest,
  JobCategory,
} from '../models/index.js';
import { getJobApplicationStatus, STATUS_PAID } from '../constants/jobApplicationStatus.js';
import { buildUnlockedScoutPayload } from './businessScoutService.js';
import { statusMessageService } from './statusMessageService.js';
import { collaboratorNotificationService } from './collaboratorNotificationService.js';
import { buildCvFileListPayload } from '../controllers/collaborator/cvController.js';

const SENDER_TYPE_BUSINESS = 5;
const HIRED_STATUSES = [12, 14, 15];
const REJECTED_STATUSES = [4, 6, 10, 13, 16];
const WS_CTV_SOURCE_TYPES = new Set(['ctv_marketplace', 'ctv_nomination', 'scout_performance']);
const OTHER_SOURCE_TYPES = new Set(['landing', 'other']);

/** Nguồn được xem full hồ sơ mà không cần Scout unlock */
const FULL_PROFILE_SOURCE_TYPES = new Set(['ctv_marketplace']);

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

async function loadSourceMaps(businessId, jobIds) {
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
    unreadCount: unreadMap[String(j.id)] || 0,
    canViewFullProfile,
    /** Scout vẫn khóa — không tạo unlock khi xem hồ sơ từ tiến cử sàn CTV */
    scoutUnlocked: maps.unlockCvIds.has(Number(j.cvId)),
  };

  if (withFullProfile && canViewFullProfile && cv?.id) {
    base.candidateProfile = {
      ...buildUnlockedScoutPayload(cv),
      accessVia: 'ctv_marketplace',
      scoutStillLocked: !maps.unlockCvIds.has(Number(cv.id)),
    };
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
  return sourceType === sourceTypeFilter;
}

export async function listBusinessJobApplications({
  businessId,
  page = 1,
  limit = 20,
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

  const maps = await loadSourceMaps(businessId, ownedJobIds);

  const where = {
    jobId: jobId ? parseInt(jobId, 10) : { [Op.in]: ownedJobIds },
  };

  if (status != null && status !== '') {
    where.status = parseInt(status, 10);
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
  return formatApplication(row, maps, unreadMap, { withFullProfile: true });
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
}) {
  const statusNum = parseInt(status, 10);
  if (Number.isNaN(statusNum) || statusNum < 1 || statusNum > 17) {
    const err = new Error('Trạng thái không hợp lệ (phải từ 1 đến 17)');
    err.statusCode = 400;
    throw err;
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
  await jobApplication.save();

  if (oldStatus !== statusNum) {
    try {
      await statusMessageService.createStatusMessage({
        jobApplicationId: applicationId,
        oldStatus,
        newStatus: statusNum,
        businessId,
        note: rejectNote != null ? String(rejectNote).trim() || null : null,
        paymentAmount: statusNum === STATUS_PAID && paymentAmount != null ? parseFloat(paymentAmount) : null,
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
  }

  const application = await getBusinessJobApplicationById({ businessId, applicationId });
  return { application };
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
};
