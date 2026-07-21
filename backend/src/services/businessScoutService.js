import { Op } from 'sequelize';
import {
  BusinessScoutUnlock,
  BusinessSavedCandidate,
  CVStorage,
  JobCategory,
} from '../models/index.js';
import {
  SCOUT_LISTING_STATUS,
  SCOUT_PRIVATE_CV_FIELDS,
  SCOUT_UNLOCK_TYPES,
  canCvBeListedOnScout,
} from '../constants/scoutCredit.js';
import { getScoutCreditCost, unlockScoutCvForBusiness } from './scoutCreditService.js';
import { getPendingPerformanceRequestForBusiness } from './scoutPerformanceService.js';

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
    scoutPublicSummary: prText,
    technicalSkills: skills,
    isUnlocked: false,
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

/** Export để Job Application (Sàn CTV) xem full hồ sơ mà không tạo ScoutUnlock */
export { buildUnlockedScoutPayload };

function buildPublicScoutPayload(cvJson, { isUnlocked = false, search } = {}) {
  if (!isUnlocked) return buildLockedScoutPayload(cvJson, { search });
  const payload = buildUnlockedScoutPayload(cvJson);
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
  sortBy = 'unlockedAt',
  sortOrder = 'DESC',
}) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const cvSearchWhere = buildUnlockedSearchWhere(search);
  const unlockWhere = { businessId };

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

  const candidates = rows.map((unlock) => {
    const cvJson = unlock.cv?.toJSON?.() || unlock.cv;
    const saved = savedMap.get(Number(unlock.cvId));
    return {
      ...buildUnlockedScoutPayload(cvJson),
      ...buildUnlockedCandidateMeta(unlock, saved),
    };
  });

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
  return {
    candidate: {
      ...buildUnlockedScoutPayload(cvJson),
      ...buildUnlockedCandidateMeta(unlock, saved),
    },
    unlockedAt: unlock.unlockedAt || unlock.createdAt || null,
  };
}

async function attachPerformanceRequestMeta(businessId, payload) {
  if (!businessId || !payload?.id || payload.isUnlocked) return payload;
  const performanceRequest = await getPendingPerformanceRequestForBusiness({
    businessId,
    cvId: payload.id,
  });
  if (performanceRequest) payload.performanceRequest = performanceRequest;
  return payload;
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

function buildListWhere({ search }) {
  const where = {
    scoutStatus: SCOUT_LISTING_STATUS.LISTED,
    status: 1,
    isDuplicate: false,
    duplicateWithCvId: null,
  };

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

  const { count, rows } = await CVStorage.findAndCountAll({
    where: buildListWhere({ search }),
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
      const payload = buildPublicScoutPayload(json, { isUnlocked, search });
      if (isUnlocked) payload.unlockType = unlockTypeMap.get(Number(cv.id)) || null;
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
  let payload = buildPublicScoutPayload(json, { isUnlocked, search });
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
  buildPublicScoutPayload,
};
