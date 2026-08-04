import { Op } from 'sequelize';
import {
  BusinessScoutUnlock,
  BusinessSavedCandidate,
  CVStorage,
  JobCategory,
  Job,
  JobApplication,
} from '../models/index.js';
import {
  SCOUT_LISTING_STATUS,
  SCOUT_PERFORMANCE_PRIVATE_CV_FIELDS,
  SCOUT_PRIVATE_CV_FIELDS,
  SCOUT_UNLOCK_TYPES,
  canCvBeListedOnScout,
} from '../constants/scoutCredit.js';
import { getScoutCreditCost, unlockScoutCvForBusiness } from './scoutCreditService.js';
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
export { buildUnlockedScoutPayload, buildPerformanceUnlockedScoutPayload };

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

  if (pipelineStatus && String(pipelineStatus).trim()) {
    const status = String(pipelineStatus).trim();
    const savedRows = await BusinessSavedCandidate.findAll({
      where: { businessId, pipelineStatus: status },
      attributes: ['cvId'],
    });
    const cvIds = savedRows.map((row) => row.cvId);
    if (!cvIds.length) {
      return {
        candidates: [],
        pagination: {
          total: 0,
          page: safePage,
          limit: safeLimit,
          totalPages: 0,
        },
      };
    }
    unlockWhere.cvId = cvIds;
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

  const candidates = await Promise.all(rows.map(async (unlock) => {
    const cvJson = unlock.cv?.toJSON?.() || unlock.cv;
    const saved = savedMap.get(Number(unlock.cvId));
    const unlockType = unlock.unlockType || SCOUT_UNLOCK_TYPES.SCOUT_CREDIT;
    const basePayload = unlockType === SCOUT_UNLOCK_TYPES.SCOUT_PERFORMANCE
      ? buildPerformanceUnlockedScoutPayload(cvJson)
      : buildUnlockedScoutPayload(cvJson);
    let item = {
      ...basePayload,
      ...buildUnlockedCandidateMeta(unlock, saved),
    };
    if (unlockType === SCOUT_UNLOCK_TYPES.SCOUT_PERFORMANCE) {
      item = await attachPerformanceRequestMeta(businessId, item);
    }
    return item;
  }));

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

  if (!unlock?.cv) {
    const err = new Error('Không tìm thấy hồ sơ đã mở Scout');
    err.statusCode = 404;
    throw err;
  }

  const saved = await BusinessSavedCandidate.findOne({
    where: { businessId, cvId },
  });

  const cvJson = unlock.cv.toJSON();
  const unlockType = unlock.unlockType || SCOUT_UNLOCK_TYPES.SCOUT_CREDIT;
  const basePayload = unlockType === SCOUT_UNLOCK_TYPES.SCOUT_PERFORMANCE
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

export default {
  listScoutCandidatesForBusiness,
  listUnlockedCandidatesForBusiness,
  getScoutCandidateForBusiness,
  getUnlockedCandidateForBusiness,
  unlockScoutCandidateForBusiness,
  attachScoutCandidateToJob,
  buildPublicScoutPayload,
};
