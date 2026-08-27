import { Op } from 'sequelize';
import {
  BusinessScoutUnlock,
  BusinessSavedCandidate,
  BusinessCtvMarketplaceListing,
  CVStorage,
  JobCategory,
  Job,
  JobApplication,
  Collaborator,
} from '../models/index.js';
import {
  SCOUT_LISTING_STATUS,
  SCOUT_PERFORMANCE_PRIVATE_CV_FIELDS,
  SCOUT_PRIVATE_CV_FIELDS,
  SCOUT_UNLOCK_TYPES,
  CTV_MARKETPLACE_ACCESS_TYPE,
  canCvBeListedOnScout,
} from '../constants/scoutCredit.js';
import { getScoutCreditCost, unlockScoutCvForBusiness } from './scoutCreditService.js';
import { buildCvFileListPayload } from '../controllers/collaborator/cvController.js';
import {
  MARKETPLACE_LISTING_STATUS,
  MARKETPLACE_LISTING_STATUS_LABELS,
} from '../constants/candidateSharing.js';
import candidateSharingService from './candidateSharingService.js';
async function attachPerformanceRequestMeta(businessId, payload) {
  if (!businessId || !payload?.id) return payload;
  if (payload.isUnlocked && payload.unlockType && payload.unlockType !== SCOUT_UNLOCK_TYPES.SCOUT_PERFORMANCE) {
    return payload;
  }
  const { getPerformanceRequestMetaForBusiness } = await import('./scoutPerformanceService.js');
  const performanceRequest = await getPerformanceRequestMetaForBusiness({
    businessId,
    cvId: payload.id,
  });
  if (performanceRequest) payload.performanceRequest = performanceRequest;
  return payload;
}

const ANONYMOUS_LABEL = 'Ứng viên ẩn danh';

function parseJsonField(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function flattenSkillStrings(value, out = [], seen = new Set()) {
  if (value == null) return out;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) return out;
    seen.add(trimmed);
    out.push(trimmed);
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => flattenSkillStrings(item, out, seen));
    return out;
  }
  if (typeof value === 'object') {
    for (const key of ['name', 'skill', 'label', 'tool', 'title', 'value', 'skills', 'tools']) {
      if (value[key] != null) flattenSkillStrings(value[key], out, seen);
    }
  }
  return out;
}

function parseSkills(cv) {
  const raw = parseJsonField(cv.technicalSkills ?? cv.technical_skills);
  if (raw != null) {
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = parseJsonField(trimmed);
        const skills = flattenSkillStrings(parsed ?? trimmed);
        if (skills.length) return skills;
      }
      return trimmed.split(/[,;|/]/).map((s) => s.trim()).filter(Boolean);
    }
    const skills = flattenSkillStrings(raw);
    if (skills.length) return skills;
  }
  const tools = [
    ...(parseJsonField(cv.learnedTools) || []),
    ...(parseJsonField(cv.experienceTools) || []),
  ];
  if (tools.length) {
    return flattenSkillStrings(tools).slice(0, 12);
  }
  return [];
}

function extractSearchSnippets(cvJson, search, max = 2) {
  const q = String(search || '').trim();
  if (!q) return [];

  const qLower = q.toLowerCase();
  const fieldValues = [
    cvJson.scoutPublicSummary,
    cvJson.careerSummary,
    cvJson.strengths,
    cvJson.desiredPosition,
    cvJson.desiredWorkLocation,
    cvJson.technicalSkills,
    cvJson.learnedTools,
    cvJson.experienceTools,
    cvJson.workExperiences,
    cvJson.certificates,
    cvJson.motivation,
  ];

  const snippets = [];
  const seen = new Set();

  for (const raw of fieldValues) {
    if (raw == null || raw === '') continue;
    const str = typeof raw === 'string' ? raw : JSON.stringify(raw);
    const lower = str.toLowerCase();
    if (!lower.includes(qLower)) continue;

    let from = 0;
    while (from < lower.length && snippets.length < max) {
      const idx = lower.indexOf(qLower, from);
      if (idx === -1) break;

      const start = Math.max(0, idx - 24);
      const end = Math.min(str.length, idx + q.length + 24);
      let snippet = str.slice(start, end).replace(/\s+/g, ' ').trim();
      if (start > 0) snippet = `…${snippet}`;
      if (end < str.length) snippet = `${snippet}…`;

      if (snippet && !seen.has(snippet)) {
        seen.add(snippet);
        snippets.push(snippet);
      }
      from = idx + q.length;
    }
  }

  return snippets;
}

function pickFields(source, fields) {
  const out = {};
  for (const key of fields) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
}

function flattenWorkExperienceList(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return flattenWorkExperienceList(parsed);
    } catch {
      return [];
    }
  }
  if (raw && typeof raw === 'object') {
    const shokumu = Array.isArray(raw.shokumu_job_history) ? raw.shokumu_job_history : [];
    const rirekisho = Array.isArray(raw.rirekisho_work_history) ? raw.rirekisho_work_history : [];
    if (shokumu.length || rirekisho.length) return [...shokumu, ...rirekisho];
  }
  return [];
}

function bucketApproximateAge(age) {
  const n = Number(age);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 25) return 'Dưới 25 tuổi';
  if (n < 30) return '25–29 tuổi';
  if (n < 35) return '30–34 tuổi';
  if (n < 40) return '35–39 tuổi';
  if (n < 45) return '40–44 tuổi';
  if (n < 50) return '45–49 tuổi';
  return '50 tuổi trở lên';
}

/** Tier 2 — khoảng tuổi gần đúng, không gửi ngày sinh chính xác */
function formatApproximateAgeRange(cvJson) {
  const raw = cvJson?.ages != null && String(cvJson.ages).trim() ? String(cvJson.ages).trim() : '';
  if (raw) {
    const digitsOnly = raw.replace(/\s/g, '');
    const exactAge = parseInt(digitsOnly, 10);
    if (Number.isFinite(exactAge) && String(exactAge) === digitsOnly) {
      return bucketApproximateAge(exactAge);
    }
    return raw;
  }
  if (!cvJson?.birthDate) return null;
  const birth = new Date(cvJson.birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
  return bucketApproximateAge(age);
}

/** Tier 1 — quốc gia cư trú hiện tại (không gửi địa chỉ chi tiết) */
function formatCurrentLocationRegion(cvJson) {
  const residence = cvJson?.currentResidence;
  if (residence == null || residence === '') return null;
  const map = {
    1: 'Nhật Bản',
    2: 'Việt Nam',
    3: 'Khác',
    '1': 'Nhật Bản',
    '2': 'Việt Nam',
    '3': 'Khác',
  };
  return map[residence] || null;
}

function formatWorkPeriodSimple(work) {
  if (work?.period && String(work.period).trim()) return String(work.period).trim();
  const from = work?.start_date || work?.startDate || work?.from || '';
  const to = work?.end_date || work?.endDate || work?.to || '';
  if (from || to) return [from, to].filter(Boolean).join(' – ');
  return '—';
}

/** Tier 2 — ẩn tên công ty, chỉ loại hình / quy mô + vị trí + thời gian */
function anonymizeWorkExperiencesForTier2(raw) {
  const list = flattenWorkExperienceList(raw);
  return list
    .map((work) => {
      const roleCandidate = work?.department_role
        || (typeof work?.description === 'string' ? work.description.split(/[\n。]/)[0] : null);
      const role = roleCandidate && String(roleCandidate).trim()
        ? String(roleCandidate).trim().slice(0, 200)
        : '—';

      const typeParts = [
        work?.business_purpose,
        work?.scale_role,
        work?.business_objective,
      ]
        .map((v) => (v && String(v).trim()) || '')
        .filter(Boolean);

      const companyTypeLabel = typeParts.length
        ? typeParts.join(' · ')
        : 'Loại hình doanh nghiệp (ẩn danh)';

      return {
        role,
        companyTypeLabel,
        period: formatWorkPeriodSimple(work),
        isAnonymized: true,
      };
    })
    .filter((work) => work.role !== '—' || work.period !== '—' || work.companyTypeLabel);
}

function buildLockedScoutPayload(cvJson, { search } = {}) {
  const skills = parseSkills(cvJson);
  const prText =
    (cvJson.scoutPublicSummary && String(cvJson.scoutPublicSummary).trim()) ||
    (cvJson.careerSummary && String(cvJson.careerSummary).trim()) ||
    (cvJson.strengths && String(cvJson.strengths).trim()) ||
    null;

  const payload = {
    id: cvJson.id,
    anonymousName: ANONYMOUS_LABEL,
    desiredPosition: cvJson.desiredPosition || cvJson.jobCategory?.name || null,
    desiredWorkLocation: cvJson.desiredWorkLocation || null,
    currentLocationRegion: formatCurrentLocationRegion(cvJson),
    desiredIncome: cvJson.desiredIncome ?? null,
    experienceYears: cvJson.experienceYears ?? null,
    jlptLevel: cvJson.jlptLevel ?? null,
    jpConversationLevel: cvJson.jpConversationLevel ?? null,
    enConversationLevel: cvJson.enConversationLevel ?? null,
    jpResidenceStatus: cvJson.jpResidenceStatus ?? null,
    scoutPublicSummary: prText,
    technicalSkills: skills,
    jobCategoryId: cvJson.jobCategoryId ?? null,
    jobCategory: cvJson.jobCategory || null,
    isUnlocked: false,
    educations: parseJsonField(cvJson.educations),
    certificates: parseJsonField(cvJson.certificates),
    workExperiences: anonymizeWorkExperiencesForTier2(parseJsonField(cvJson.workExperiences)),
    approximateAgeRange: formatApproximateAgeRange(cvJson),
    nyushaTime: cvJson.nyushaTime || null,
  };

  const snippets = extractSearchSnippets(cvJson, search);
  if (snippets.length) payload.searchSnippets = snippets;

  return payload;
}

function buildUnlockedScoutPayload(cvJson) {
  const skills = parseSkills(cvJson);
  const prText =
    (cvJson.scoutPublicSummary && String(cvJson.scoutPublicSummary).trim()) ||
    (cvJson.careerSummary && String(cvJson.careerSummary).trim()) ||
    null;

  return {
    id: cvJson.id,
    code: cvJson.code || null,
    name: cvJson.name || null,
    anonymousName: ANONYMOUS_LABEL,
    desiredPosition: cvJson.desiredPosition || null,
    desiredWorkLocation: cvJson.desiredWorkLocation || null,
    desiredIncome: cvJson.desiredIncome ?? null,
    experienceYears: cvJson.experienceYears ?? null,
    jlptLevel: cvJson.jlptLevel ?? null,
    jpConversationLevel: cvJson.jpConversationLevel ?? null,
    enConversationLevel: cvJson.enConversationLevel ?? null,
    otherConversationLevel: cvJson.otherConversationLevel ?? null,
    technicalSkills: skills,
    scoutPublicSummary: prText,
    jobCategoryId: cvJson.jobCategoryId ?? null,
    jobCategory: cvJson.jobCategory || null,
    scoutListedAt: cvJson.scoutListedAt || null,
    isUnlocked: true,
    educations: parseJsonField(cvJson.educations),
    workExperiences: parseJsonField(cvJson.workExperiences),
    certificates: parseJsonField(cvJson.certificates),
    learnedTools: parseJsonField(cvJson.learnedTools),
    experienceTools: parseJsonField(cvJson.experienceTools),
    careerSummary: cvJson.careerSummary || null,
    strengths: cvJson.strengths || null,
    motivation: cvJson.motivation || null,
    specialization: cvJson.specialization ?? null,
    qualification: cvJson.qualification ?? null,
    ...pickFields(cvJson, SCOUT_PRIVATE_CV_FIELDS),
  };
}

/** Scout Performance — profile mở một phần, không email/SĐT */
function buildPerformanceUnlockedScoutPayload(cvJson) {
  const payload = buildUnlockedScoutPayload(cvJson);
  delete payload.email;
  delete payload.phone;
  payload.isPerformancePartial = true;
  payload.hideContact = true;
  return {
    ...payload,
    ...pickFields(cvJson, SCOUT_PERFORMANCE_PRIVATE_CV_FIELDS),
    email: undefined,
    phone: undefined,
  };
}

/** Export để Job Application (Sàn CTV) xem full hồ sơ mà không tạo ScoutUnlock */
export { buildUnlockedScoutPayload, buildPerformanceUnlockedScoutPayload, formatCurrentLocationRegion };

function buildPublicScoutPayload(cvJson, { isUnlocked = false, unlockType = null, search } = {}) {
  if (!isUnlocked) return buildLockedScoutPayload(cvJson, { search });
  const payload = unlockType === SCOUT_UNLOCK_TYPES.SCOUT_PERFORMANCE
    ? buildPerformanceUnlockedScoutPayload(cvJson)
    : buildUnlockedScoutPayload(cvJson);
  const snippets = extractSearchSnippets(cvJson, search);
  if (snippets.length) payload.searchSnippets = snippets;
  return payload;
}

function buildUnlockedCandidateMeta(unlock, saved) {
  return {
    unlockId: unlock.id,
    unlockType: unlock.unlockType || SCOUT_UNLOCK_TYPES.SCOUT_CREDIT,
    unlockedAt: unlock.unlockedAt || unlock.createdAt || null,
    creditCost: unlock.creditCost ?? null,
    pipelineStatus: saved?.pipelineStatus || 'new',
    savedAt: saved?.savedAt || saved?.createdAt || null,
    savedCandidateId: saved?.id || null,
  };
}

function buildUnlockedSearchWhere(search) {
  if (!search || !String(search).trim()) return null;
  const q = String(search).trim();
  const like = `%${q}%`;
  return {
    [Op.or]: [
      { name: { [Op.like]: like } },
      { code: { [Op.like]: like } },
      { email: { [Op.like]: like } },
      { phone: { [Op.like]: like } },
      { desiredPosition: { [Op.like]: like } },
      { desiredWorkLocation: { [Op.like]: like } },
      { technicalSkills: { [Op.like]: like } },
      { careerSummary: { [Op.like]: like } },
      { scoutPublicSummary: { [Op.like]: like } },
    ],
  };
}

async function getMarketplaceJobIdSet(businessId) {
  const listings = await BusinessCtvMarketplaceListing.findAll({
    where: { businessId },
    attributes: ['jobId'],
    raw: true,
  });
  return new Set(listings.map((row) => Number(row.jobId)).filter(Boolean));
}

function buildMarketplaceCandidateMeta(application, saved) {
  const appliedAt = application.appliedAt || application.createdAt || null;
  return {
    unlockId: null,
    unlockType: CTV_MARKETPLACE_ACCESS_TYPE,
    unlockedAt: appliedAt,
    creditCost: null,
    pipelineStatus: saved?.pipelineStatus || 'new',
    savedAt: saved?.savedAt || saved?.createdAt || null,
    savedCandidateId: saved?.id || null,
    applicationId: application.id,
    nominationJobId: application.jobId,
    nominationJobTitle: application.job?.title || null,
    nominationJobCode: application.job?.jobCode || null,
    ctvName: application.collaborator?.name || null,
    ctvId: application.collaboratorId || null,
  };
}

async function mapMarketplaceApplicationToCandidate(businessId, application, saved) {
  const cvJson = application.cv?.toJSON?.() || application.cv;
  return {
    ...buildUnlockedScoutPayload(cvJson),
    ...buildMarketplaceCandidateMeta(application, saved),
  };
}

async function fetchMarketplaceNominationApplications(businessId, { cvSearchWhere, pipelineCvIds } = {}) {
  const jobIds = [...await getMarketplaceJobIdSet(businessId)];
  if (!jobIds.length) return [];

  const where = {
    jobId: jobIds.length === 1 ? jobIds[0] : { [Op.in]: jobIds },
    collaboratorId: { [Op.ne]: null },
    cvId: { [Op.ne]: null },
  };
  if (pipelineCvIds?.length) {
    where.cvId = pipelineCvIds.length === 1 ? pipelineCvIds[0] : { [Op.in]: pipelineCvIds };
  }

  const rows = await JobApplication.findAll({
    where,
    include: [
      {
        model: CVStorage,
        as: 'cv',
        required: true,
        where: cvSearchWhere || undefined,
        include: [
          {
            model: JobCategory,
            as: 'jobCategory',
            required: false,
            attributes: ['id', 'name', 'nameEn', 'nameJp', 'slug'],
          },
        ],
      },
      { model: Job, as: 'job', required: false, attributes: ['id', 'title', 'jobCode'] },
      { model: Collaborator, as: 'collaborator', required: false, attributes: ['id', 'name'] },
    ],
    order: [['applied_at', 'DESC'], ['id', 'DESC']],
  });

  const seenCvIds = new Set();
  const deduped = [];
  rows.forEach((row) => {
    const cvId = Number(row.cvId);
    if (!cvId || seenCvIds.has(cvId)) return;
    seenCvIds.add(cvId);
    deduped.push(row);
  });
  return deduped;
}

async function resolvePipelineCvIds(businessId, pipelineStatus) {
  if (!pipelineStatus || !String(pipelineStatus).trim()) return null;
  const savedRows = await BusinessSavedCandidate.findAll({
    where: { businessId, pipelineStatus: String(pipelineStatus).trim() },
    attributes: ['cvId'],
  });
  return savedRows.map((row) => row.cvId);
}

async function mapScoutUnlockRowsToCandidates(businessId, rows, savedMap) {
  return Promise.all(rows.map(async (unlock) => {
    const cvJson = unlock.cv?.toJSON?.() || unlock.cv;
    const saved = savedMap.get(Number(unlock.cvId));
    const rowUnlockType = unlock.unlockType || SCOUT_UNLOCK_TYPES.SCOUT_CREDIT;
    const basePayload = rowUnlockType === SCOUT_UNLOCK_TYPES.SCOUT_PERFORMANCE
      ? buildPerformanceUnlockedScoutPayload(cvJson)
      : buildUnlockedScoutPayload(cvJson);
    let item = {
      ...basePayload,
      ...buildUnlockedCandidateMeta(unlock, saved),
    };
    if (rowUnlockType === SCOUT_UNLOCK_TYPES.SCOUT_PERFORMANCE) {
      item = await attachPerformanceRequestMeta(businessId, item);
    }
    return item;
  }));
}

async function listScoutUnlockCandidatesForBusiness({
  businessId,
  page,
  limit,
  search,
  pipelineStatus,
  unlockType,
  sortBy,
  sortOrder,
}) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const cvSearchWhere = buildUnlockedSearchWhere(search);
  const unlockWhere = { businessId };

  const normalizedUnlockType = unlockType != null && String(unlockType).trim()
    ? String(unlockType).trim()
    : null;
  if (normalizedUnlockType) {
    unlockWhere.unlockType = normalizedUnlockType;
  }

  const pipelineCvIds = await resolvePipelineCvIds(businessId, pipelineStatus);
  if (pipelineCvIds && !pipelineCvIds.length) {
    return {
      candidates: [],
      pagination: { total: 0, page: safePage, limit: safeLimit, totalPages: 0 },
    };
  }
  if (pipelineCvIds?.length) {
    unlockWhere.cvId = pipelineCvIds.length === 1 ? pipelineCvIds[0] : { [Op.in]: pipelineCvIds };
  }

  const allowedSort = ['unlockedAt', 'createdAt', 'creditCost'];
  const sortField = allowedSort.includes(sortBy) ? sortBy : 'unlockedAt';
  const direction = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { count, rows } = await BusinessScoutUnlock.findAndCountAll({
    where: unlockWhere,
    include: [
      {
        model: CVStorage,
        as: 'cv',
        required: true,
        where: cvSearchWhere || undefined,
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
    limit: safeLimit,
    offset,
    order: [[sortField, direction], ['id', 'DESC']],
    distinct: true,
  });

  const cvIds = rows.map((row) => row.cvId);
  const savedRows = cvIds.length
    ? await BusinessSavedCandidate.findAll({ where: { businessId, cvId: cvIds } })
    : [];
  const savedMap = new Map(savedRows.map((row) => [Number(row.cvId), row]));
  const candidates = await mapScoutUnlockRowsToCandidates(businessId, rows, savedMap);

  return {
    candidates,
    pagination: {
      total: count,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(count / safeLimit) || 0,
    },
  };
}

async function listCtvMarketplaceCandidatesForBusiness({
  businessId,
  page,
  limit,
  search,
  pipelineStatus,
  sortOrder,
}) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;
  const cvSearchWhere = buildUnlockedSearchWhere(search);
  const pipelineCvIds = await resolvePipelineCvIds(businessId, pipelineStatus);
  if (pipelineCvIds && !pipelineCvIds.length) {
    return {
      candidates: [],
      pagination: { total: 0, page: safePage, limit: safeLimit, totalPages: 0 },
    };
  }

  const applications = await fetchMarketplaceNominationApplications(businessId, {
    cvSearchWhere,
    pipelineCvIds,
  });
  const direction = String(sortOrder).toUpperCase() === 'ASC' ? 1 : -1;
  applications.sort((a, b) => {
    const ta = new Date(a.appliedAt || a.createdAt || 0).getTime();
    const tb = new Date(b.appliedAt || b.createdAt || 0).getTime();
    return direction === 1 ? ta - tb : tb - ta;
  });

  const total = applications.length;
  const pageApplications = applications.slice(offset, offset + safeLimit);
  const cvIds = pageApplications.map((row) => row.cvId);
  const savedRows = cvIds.length
    ? await BusinessSavedCandidate.findAll({ where: { businessId, cvId: cvIds } })
    : [];
  const savedMap = new Map(savedRows.map((row) => [Number(row.cvId), row]));
  const candidates = await Promise.all(
    pageApplications.map((application) => mapMarketplaceApplicationToCandidate(
      businessId,
      application,
      savedMap.get(Number(application.cvId)),
    )),
  );

  return {
    candidates,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 0,
    },
  };
}

async function fetchScoutUnlockRowsForListing(businessId, { search, pipelineStatus, unlockType }) {
  const cvSearchWhere = buildUnlockedSearchWhere(search);
  const unlockWhere = { businessId };
  const normalizedUnlockType = unlockType != null && String(unlockType).trim()
    ? String(unlockType).trim()
    : null;
  if (normalizedUnlockType) {
    unlockWhere.unlockType = normalizedUnlockType;
  }

  const pipelineCvIds = await resolvePipelineCvIds(businessId, pipelineStatus);
  if (pipelineCvIds && !pipelineCvIds.length) return [];
  if (pipelineCvIds?.length) {
    unlockWhere.cvId = pipelineCvIds.length === 1 ? pipelineCvIds[0] : { [Op.in]: pipelineCvIds };
  }

  return BusinessScoutUnlock.findAll({
    where: unlockWhere,
    include: [
      {
        model: CVStorage,
        as: 'cv',
        required: true,
        where: cvSearchWhere || undefined,
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
    order: [['unlockedAt', 'DESC'], ['id', 'DESC']],
  });
}

async function listAllAccessibleCandidatesForBusiness(params) {
  const {
    businessId,
    page,
    limit,
    search,
    pipelineStatus,
    sortOrder,
  } = params;
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;
  const direction = String(sortOrder).toUpperCase() === 'ASC' ? 1 : -1;

  const [scoutRows, marketplaceApplications] = await Promise.all([
    fetchScoutUnlockRowsForListing(businessId, { search, pipelineStatus }),
    (async () => {
      const pipelineCvIds = await resolvePipelineCvIds(businessId, pipelineStatus);
      if (pipelineCvIds && !pipelineCvIds.length) return [];
      return fetchMarketplaceNominationApplications(businessId, {
        cvSearchWhere: buildUnlockedSearchWhere(search),
        pipelineCvIds,
      });
    })(),
  ]);

  const allCvIds = [
    ...scoutRows.map((row) => Number(row.cvId)),
    ...marketplaceApplications.map((row) => Number(row.cvId)),
  ].filter(Boolean);
  const savedRows = allCvIds.length
    ? await BusinessSavedCandidate.findAll({ where: { businessId, cvId: [...new Set(allCvIds)] } })
    : [];
  const savedMap = new Map(savedRows.map((row) => [Number(row.cvId), row]));

  const byCvId = new Map();
  const scoutCandidates = await mapScoutUnlockRowsToCandidates(businessId, scoutRows, savedMap);
  scoutCandidates.forEach((candidate) => {
    byCvId.set(Number(candidate.id), candidate);
  });

  for (const application of marketplaceApplications) {
    const cvId = Number(application.cvId);
    if (!cvId || byCvId.has(cvId)) continue;
    byCvId.set(
      cvId,
      await mapMarketplaceApplicationToCandidate(
        businessId,
        application,
        savedMap.get(cvId),
      ),
    );
  }

  const merged = [...byCvId.values()].sort((a, b) => {
    const ta = new Date(a.unlockedAt || 0).getTime();
    const tb = new Date(b.unlockedAt || 0).getTime();
    return direction === 1 ? ta - tb : tb - ta;
  });

  const total = merged.length;
  const candidates = merged.slice(offset, offset + safeLimit);

  return {
    candidates,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 0,
    },
  };
}

export async function listUnlockedCandidatesForBusiness({
  businessId,
  page = 1,
  limit = 20,
  search,
  pipelineStatus,
  unlockType,
  sortBy = 'unlockedAt',
  sortOrder = 'DESC',
}) {
  const normalizedUnlockType = unlockType != null && String(unlockType).trim()
    ? String(unlockType).trim()
    : null;

  if (normalizedUnlockType === CTV_MARKETPLACE_ACCESS_TYPE) {
    return listCtvMarketplaceCandidatesForBusiness({
      businessId,
      page,
      limit,
      search,
      pipelineStatus,
      sortOrder,
    });
  }

  if (
    normalizedUnlockType === SCOUT_UNLOCK_TYPES.SCOUT_CREDIT
    || normalizedUnlockType === SCOUT_UNLOCK_TYPES.SCOUT_PERFORMANCE
  ) {
    return listScoutUnlockCandidatesForBusiness({
      businessId,
      page,
      limit,
      search,
      pipelineStatus,
      unlockType: normalizedUnlockType,
      sortBy,
      sortOrder,
    });
  }

  return listAllAccessibleCandidatesForBusiness({
    businessId,
    page,
    limit,
    search,
    pipelineStatus,
    sortBy,
    sortOrder,
  });
}

export async function getUnlockedCandidateForBusiness({ businessId, cvId }) {
  const unlock = await BusinessScoutUnlock.findOne({
    where: { businessId, cvId },
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

  if (unlock?.cv) {
    const saved = await BusinessSavedCandidate.findOne({
      where: { businessId, cvId },
    });

    const cvJson = unlock.cv.toJSON();
    const rowUnlockType = unlock.unlockType || SCOUT_UNLOCK_TYPES.SCOUT_CREDIT;
    const basePayload = rowUnlockType === SCOUT_UNLOCK_TYPES.SCOUT_PERFORMANCE
      ? buildPerformanceUnlockedScoutPayload(cvJson)
      : buildUnlockedScoutPayload(cvJson);
    let candidate = {
      ...basePayload,
      ...buildUnlockedCandidateMeta(unlock, saved),
    };
    candidate = await attachPerformanceRequestMeta(businessId, candidate);
    return {
      candidate,
      unlockedAt: unlock.unlockedAt || unlock.createdAt || null,
    };
  }

  const jobIds = [...await getMarketplaceJobIdSet(businessId)];
  if (!jobIds.length) {
    const err = new Error('Không tìm thấy hồ sơ ứng viên');
    err.statusCode = 404;
    throw err;
  }

  const application = await JobApplication.findOne({
    where: {
      cvId,
      jobId: jobIds.length === 1 ? jobIds[0] : { [Op.in]: jobIds },
      collaboratorId: { [Op.ne]: null },
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
      { model: Job, as: 'job', required: false, attributes: ['id', 'title', 'jobCode'] },
      { model: Collaborator, as: 'collaborator', required: false, attributes: ['id', 'name'] },
    ],
    order: [['applied_at', 'DESC'], ['id', 'DESC']],
  });

  if (!application?.cv) {
    const err = new Error('Không tìm thấy hồ sơ ứng viên');
    err.statusCode = 404;
    throw err;
  }

  const saved = await BusinessSavedCandidate.findOne({
    where: { businessId, cvId },
  });
  const candidate = await mapMarketplaceApplicationToCandidate(businessId, application, saved);
  return {
    candidate,
    unlockedAt: candidate.unlockedAt || null,
  };
}

async function getUnlockedCvIdSet(businessId, cvIds) {
  if (!cvIds.length) return new Set();
  const rows = await BusinessScoutUnlock.findAll({
    where: {
      businessId,
      cvId: cvIds,
    },
    attributes: ['cvId'],
  });
  return new Set(rows.map((r) => Number(r.cvId)));
}

async function getAllUnlockedCvIdsForBusiness(businessId) {
  if (!businessId) return [];
  const rows = await BusinessScoutUnlock.findAll({
    where: { businessId },
    attributes: ['cvId'],
    raw: true,
  });
  return [...new Set(rows.map((r) => Number(r.cvId)).filter(Boolean))];
}

function buildListWhere({ search, excludeCvIds }) {
  const where = {
    scoutStatus: SCOUT_LISTING_STATUS.LISTED,
    status: 1,
    isDuplicate: false,
    duplicateWithCvId: null,
  };

  if (excludeCvIds?.length) {
    where.id = { [Op.notIn]: excludeCvIds };
  }

  if (search && String(search).trim()) {
    const q = String(search).trim();
    const like = `%${q}%`;
    where[Op.and] = [
      {
        [Op.or]: [
          { desiredPosition: { [Op.like]: like } },
          { desiredWorkLocation: { [Op.like]: like } },
          { technicalSkills: { [Op.like]: like } },
          { careerSummary: { [Op.like]: like } },
          { strengths: { [Op.like]: like } },
          { scoutPublicSummary: { [Op.like]: like } },
          { code: { [Op.like]: like } },
        ],
      },
    ];
  }

  return where;
}

export async function listScoutCandidatesForBusiness({
  businessId,
  page = 1,
  limit = 20,
  search,
  sortBy = 'scoutListedAt',
  sortOrder = 'DESC',
}) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const allowedSort = ['scoutListedAt', 'experienceYears', 'desiredPosition', 'id'];
  const sortField = allowedSort.includes(sortBy) ? sortBy : 'scoutListedAt';
  const direction = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const unlockedCvIds = await getAllUnlockedCvIdsForBusiness(businessId);

  const { count, rows } = await CVStorage.findAndCountAll({
    where: buildListWhere({ search, excludeCvIds: unlockedCvIds }),
    include: [
      {
        model: JobCategory,
        as: 'jobCategory',
        required: false,
        attributes: ['id', 'name', 'nameEn', 'nameJp', 'slug'],
      },
    ],
    limit: safeLimit,
    offset,
    order: [[sortField, direction], ['id', 'DESC']],
  });

  const cvIds = rows.map((cv) => cv.id);
  const unlockedSet = await getUnlockedCvIdSet(businessId, cvIds);
  const unlockRows = cvIds.length
    ? await BusinessScoutUnlock.findAll({ where: { businessId, cvId: cvIds }, attributes: ['cvId', 'unlockType'] })
    : [];
  const unlockTypeMap = new Map(unlockRows.map((r) => [Number(r.cvId), r.unlockType]));
  const scoutCreditCost = await getScoutCreditCost();

  const candidates = await Promise.all(
    rows.map(async (cv) => {
      const json = cv.toJSON();
      const isUnlocked = unlockedSet.has(Number(cv.id));
      const unlockType = unlockTypeMap.get(Number(cv.id)) || null;
      const payload = buildPublicScoutPayload(json, { isUnlocked, unlockType, search });
      if (isUnlocked) payload.unlockType = unlockType;
      return attachPerformanceRequestMeta(businessId, payload);
    }),
  );

  return {
    candidates,
    scoutCreditCost,
    pagination: {
      total: count,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(count / safeLimit) || 0,
    },
  };
}

export async function getScoutCandidateForBusiness({ businessId, cvId, search }) {
  const cv = await CVStorage.findOne({
    where: {
      id: cvId,
      scoutStatus: SCOUT_LISTING_STATUS.LISTED,
    },
    include: [
      {
        model: JobCategory,
        as: 'jobCategory',
        required: false,
        attributes: ['id', 'name', 'nameEn', 'nameJp', 'slug'],
      },
    ],
  });

  if (!cv || !canCvBeListedOnScout(cv)) {
    const err = new Error('Không tìm thấy hồ sơ trên sàn Scout');
    err.statusCode = 404;
    throw err;
  }

  const unlock = await BusinessScoutUnlock.findOne({
    where: {
      businessId,
      cvId,
    },
  });

  const isUnlocked = Boolean(unlock);
  const json = cv.toJSON();
  let payload = buildPublicScoutPayload(json, {
    isUnlocked,
    unlockType: unlock?.unlockType || null,
    search,
  });
  payload = await attachPerformanceRequestMeta(businessId, payload);
  if (unlock) payload.unlockType = unlock.unlockType;

  const scoutCreditCost = await getScoutCreditCost();

  return {
    candidate: payload,
    scoutCreditCost,
    unlockedAt: unlock?.unlockedAt || null,
    unlockType: unlock?.unlockType || null,
  };
}

export async function assertCandidateAccessibleForBusiness({ businessId, cvId }) {
  const safeCvId = parseInt(cvId, 10);
  if (!Number.isFinite(safeCvId)) {
    const err = new Error('ID hồ sơ không hợp lệ');
    err.statusCode = 400;
    throw err;
  }

  const unlock = await BusinessScoutUnlock.findOne({ where: { businessId, cvId: safeCvId } });
  if (unlock) {
    return {
      cvId: safeCvId,
      accessType: unlock.unlockType || SCOUT_UNLOCK_TYPES.SCOUT_CREDIT,
    };
  }

  const jobIds = [...await getMarketplaceJobIdSet(businessId)];
  if (jobIds.length) {
    const application = await JobApplication.findOne({
      where: {
        cvId: safeCvId,
        jobId: jobIds.length === 1 ? jobIds[0] : { [Op.in]: jobIds },
        collaboratorId: { [Op.ne]: null },
      },
      attributes: ['id'],
    });
    if (application) {
      return { cvId: safeCvId, accessType: CTV_MARKETPLACE_ACCESS_TYPE };
    }
  }

  const err = new Error('Không có quyền truy cập hồ sơ ứng viên');
  err.statusCode = 403;
  throw err;
}

export async function listNominationJobsForAccessibleCandidate({ businessId, cvId }) {
  const { cvId: safeCvId } = await assertCandidateAccessibleForBusiness({ businessId, cvId });

  const jobs = await Job.findAll({
    where: { businessId },
    attributes: ['id', 'title', 'jobCode', 'status'],
    order: [['updated_at', 'DESC'], ['id', 'DESC']],
  });
  if (!jobs.length) return { jobs: [] };

  const jobIds = jobs.map((job) => job.id);
  const listings = await BusinessCtvMarketplaceListing.findAll({
    where: { businessId, jobId: jobIds },
    attributes: ['id', 'jobId', 'status'],
  });
  const listingByJobId = new Map(listings.map((row) => [Number(row.jobId), row]));

  const existingApps = await JobApplication.findAll({
    where: {
      cvId: safeCvId,
      jobId: jobIds.length === 1 ? jobIds[0] : { [Op.in]: jobIds },
    },
    attributes: ['id', 'jobId', 'status'],
  });
  const appByJobId = new Map(existingApps.map((row) => [Number(row.jobId), row]));

  return {
    jobs: jobs.map((job) => {
      const listing = listingByJobId.get(Number(job.id));
      const isPublished = listing?.status === MARKETPLACE_LISTING_STATUS.PUBLISHED;
      const existingApplication = appByJobId.get(Number(job.id));
      return {
        id: job.id,
        title: job.title,
        jobCode: job.jobCode || null,
        onMarketplace: isPublished,
        listingId: listing?.id ?? null,
        listingStatus: listing?.status ?? null,
        listingStatusLabel: listing?.status != null
          ? (MARKETPLACE_LISTING_STATUS_LABELS[listing.status] || String(listing.status))
          : null,
        existingApplicationId: existingApplication?.id ?? null,
        canNominate: isPublished && !existingApplication,
      };
    }),
  };
}

export async function nominateAccessibleCandidateToJob({ businessId, cvId, jobId, note }) {
  const safeCvId = parseInt(cvId, 10);
  const safeJobId = parseInt(jobId, 10);
  if (!Number.isFinite(safeCvId) || !Number.isFinite(safeJobId)) {
    const err = new Error('ID hồ sơ hoặc JD không hợp lệ');
    err.statusCode = 400;
    throw err;
  }

  const access = await assertCandidateAccessibleForBusiness({ businessId, cvId: safeCvId });

  const job = await Job.findOne({ where: { id: safeJobId, businessId } });
  if (!job) {
    const err = new Error('Không tìm thấy JD thuộc doanh nghiệp');
    err.statusCode = 404;
    throw err;
  }

  const listing = await BusinessCtvMarketplaceListing.findOne({
    where: { businessId, jobId: safeJobId },
  });
  if (!listing || listing.status !== MARKETPLACE_LISTING_STATUS.PUBLISHED) {
    const statusLabel = listing?.status != null
      ? MARKETPLACE_LISTING_STATUS_LABELS[listing.status]
      : null;
    const err = new Error(
      listing
        ? `JD "${job.title}" chưa được đưa lên Sàn CTV (trạng thái: ${statusLabel}). Vui lòng đăng job lên sàn trước khi tiến cử.`
        : `JD "${job.title}" chưa được đưa lên Sàn CTV. Vui lòng tạo và đăng job lên sàn tại mục Sàn CTV trước khi tiến cử.`,
    );
    err.statusCode = 400;
    err.code = 'JOB_NOT_ON_MARKETPLACE';
    throw err;
  }

  const cv = await CVStorage.findByPk(safeCvId);
  if (!cv) {
    const err = new Error('Không tìm thấy hồ sơ ứng viên');
    err.statusCode = 404;
    throw err;
  }

  const existing = await JobApplication.findOne({
    where: { jobId: safeJobId, cvId: safeCvId },
  });
  if (existing) {
    return {
      application: existing.toJSON(),
      alreadyExists: true,
      job: { id: job.id, title: job.title, jobCode: job.jobCode || null },
      listingId: listing.id,
    };
  }

  const application = await JobApplication.create({
    jobId: safeJobId,
    cvId: safeCvId,
    cvCode: cv.code || null,
    title: cv.name || cv.desiredPosition || 'Ứng viên',
    status: 5,
    appliedAt: new Date(),
    memo: note?.trim() || `Doanh nghiệp tiến cử (${access.accessType})`,
  });

  await BusinessSavedCandidate.update(
    { pipelineStatus: 'processing' },
    { where: { businessId, cvId: safeCvId } },
  );

  try {
    await candidateSharingService.syncListingCounters(listing.id);
  } catch (syncErr) {
    console.error('[nominateAccessibleCandidateToJob] syncListingCounters:', syncErr?.message || syncErr);
  }

  return {
    application: application.toJSON(),
    alreadyExists: false,
    job: { id: job.id, title: job.title, jobCode: job.jobCode || null },
    listingId: listing.id,
  };
}

export async function attachScoutCandidateToJob({ businessId, cvId, jobId, note }) {
  const safeCvId = parseInt(cvId, 10);
  const safeJobId = parseInt(jobId, 10);
  if (!Number.isFinite(safeCvId) || !Number.isFinite(safeJobId)) {
    const err = new Error('ID hồ sơ hoặc JD không hợp lệ');
    err.statusCode = 400;
    throw err;
  }

  const unlock = await BusinessScoutUnlock.findOne({ where: { businessId, cvId: safeCvId } });
  if (!unlock) {
    const err = new Error('Cần mở hồ sơ ứng viên trước khi thêm vào JD');
    err.statusCode = 403;
    throw err;
  }

  const job = await Job.findOne({ where: { id: safeJobId, businessId } });
  if (!job) {
    const err = new Error('Không tìm thấy JD thuộc doanh nghiệp');
    err.statusCode = 404;
    throw err;
  }

  const cv = await CVStorage.findByPk(safeCvId);
  if (!cv) {
    const err = new Error('Không tìm thấy hồ sơ ứng viên');
    err.statusCode = 404;
    throw err;
  }

  const existing = await JobApplication.findOne({
    where: { jobId: safeJobId, cvId: safeCvId },
  });
  if (existing) {
    return {
      application: existing.toJSON(),
      alreadyExists: true,
      job: { id: job.id, title: job.title, jobCode: job.jobCode || null },
    };
  }

  const application = await JobApplication.create({
    jobId: safeJobId,
    cvId: safeCvId,
    cvCode: cv.code || null,
    title: cv.name || cv.desiredPosition || 'Ứng viên Scout',
    status: 5,
    appliedAt: new Date(),
    memo: note?.trim() || `Thêm từ Scout (${unlock.unlockType || 'scout_credit'})`,
  });

  await BusinessSavedCandidate.update(
    { pipelineStatus: 'processing' },
    { where: { businessId, cvId: safeCvId } },
  );

  return {
    application: application.toJSON(),
    alreadyExists: false,
    job: { id: job.id, title: job.title, jobCode: job.jobCode || null },
  };
}

export async function unlockScoutCandidateForBusiness({ businessId, cvId }) {
  const result = await unlockScoutCvForBusiness({ businessId, cvId });
  const detail = await getScoutCandidateForBusiness({ businessId, cvId });
  return {
    ...result,
    ...detail,
  };
}

export async function getScoutUnlockedCvFileList({ businessId, cvId, req }) {
  const safeCvId = parseInt(cvId, 10);
  if (!Number.isFinite(safeCvId)) {
    const err = new Error('ID hồ sơ không hợp lệ');
    err.statusCode = 400;
    throw err;
  }

  const unlock = await BusinessScoutUnlock.findOne({
    where: { businessId, cvId: safeCvId },
  });
  if (unlock) {
    if (unlock.unlockType !== SCOUT_UNLOCK_TYPES.SCOUT_CREDIT) {
      const err = new Error('Chỉ hồ sơ mở bằng Scout Credit mới được tải CV gốc');
      err.statusCode = 403;
      throw err;
    }
  } else {
    const jobIds = [...await getMarketplaceJobIdSet(businessId)];
    const hasMarketplaceAccess = jobIds.length
      ? await JobApplication.findOne({
        where: {
          cvId: safeCvId,
          jobId: jobIds.length === 1 ? jobIds[0] : { [Op.in]: jobIds },
          collaboratorId: { [Op.ne]: null },
        },
        attributes: ['id'],
      })
      : null;
    if (!hasMarketplaceAccess) {
      const err = new Error('Cần mở hồ sơ ứng viên trước khi tải CV');
      err.statusCode = 403;
      throw err;
    }
  }

  const cv = await CVStorage.findByPk(safeCvId);
  if (!cv) {
    const err = new Error('Không tìm thấy hồ sơ ứng viên');
    err.statusCode = 404;
    throw err;
  }

  return buildCvFileListPayload(cv, req);
}

export default {
  listScoutCandidatesForBusiness,
  listUnlockedCandidatesForBusiness,
  getScoutCandidateForBusiness,
  getUnlockedCandidateForBusiness,
  unlockScoutCandidateForBusiness,
  attachScoutCandidateToJob,
  listNominationJobsForAccessibleCandidate,
  nominateAccessibleCandidateToJob,
  getScoutUnlockedCvFileList,
  buildPublicScoutPayload,
};
