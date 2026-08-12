/**
 * AI matching Scout CV ↔ Business job — Matching v3 (scoped theo business / Scout pool).
 */

/** Giới hạn query AI service (422 nếu vượt — URL dài / validation). */
const MATCH_V3_TOP_K_MAX = 200;
const MATCH_V3_CV_IDS_CHUNK = 50;

function normalizeCvIdList(cvIds) {
  return (Array.isArray(cvIds) ? cvIds : []).map((id) => String(id)).filter(Boolean);
}

function chunkCvIds(ids, chunkSize = MATCH_V3_CV_IDS_CHUNK) {
  const chunks = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize));
  }
  return chunks;
}

function resolveMatchTopK(requested, idCount) {
  const raw = requested != null ? Number(requested) : MATCH_V3_TOP_K_MAX;
  const capped = Math.min(MATCH_V3_TOP_K_MAX, Math.max(1, Number.isFinite(raw) ? raw : MATCH_V3_TOP_K_MAX));
  if (idCount > 0) return Math.min(capped, idCount);
  return capped;
}

/**
 * Gọi GET scores theo batch cv_ids để tránh 422 (query quá dài / top_k quá lớn).
 */
async function fetchMatchV3CvsScoresBatched(apiService, fetchScores, jobId, cvIds, options = {}) {
  const ids = normalizeCvIdList(cvIds);
  const lang = options.lang;
  const topKDefault = resolveMatchTopK(options.top_k, ids.length);

  if (!ids.length) {
    const raw = await fetchScores(jobId, { top_k: topKDefault, lang });
    return parseAiMatchResponse(raw);
  }

  const chunks = chunkCvIds(ids);
  const idSet = new Set(ids);
  const merged = [];
  const seen = new Set();

  await Promise.all(chunks.map(async (chunk) => {
    const raw = await fetchScores(jobId, {
      top_k: resolveMatchTopK(options.top_k, chunk.length),
      cv_ids: chunk,
      lang,
    });
    parseAiMatchResponse(raw).forEach((row) => {
      const id = String(row.id ?? row.cv_id);
      if (!idSet.has(id) || seen.has(id)) return;
      seen.add(id);
      merged.push(row);
    });
  }));

  return merged;
}

export function normalizeAiMatchRow(row) {
  if (!row || typeof row !== 'object') return null;
  const score = Number(row.score ?? row.similarity_score ?? row.match_score ?? 0);
  const meta = row.metadata || row.meta || {};
  return {
    ...row,
    id: row.id ?? row.cv_id ?? row.cvId,
    cv_id: row.cv_id ?? row.cvId ?? row.id,
    similarity_score: Number.isFinite(score) ? score : 0,
    reasoning: row.reasoning || row.reason || row.matching_reasons?.reason || null,
    metadata: meta,
  };
}

export function normalizeAiMatchJobRow(row) {
  if (!row || typeof row !== 'object') return null;
  const score = Number(row.score ?? row.similarity_score ?? row.match_score ?? 0);
  const jobId = row.job_id ?? row.jobId ?? row.id;
  return {
    ...row,
    id: jobId,
    job_id: jobId,
    similarity_score: Number.isFinite(score) ? score : 0,
    reasoning: row.reasoning || row.reason || row.matching_reasons?.reason || null,
  };
}

export function getMatchScorePercent(row) {
  const raw = Number(row?.similarity_score ?? row?.score ?? row?.match_score ?? 0);
  if (!Number.isFinite(raw)) return 0;
  const pct = raw <= 1 ? raw * 100 : raw;
  return Math.max(0, Math.min(100, pct));
}

function extractMatchList(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.scores)) return raw.scores;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;
  if (Array.isArray(raw?.data?.scores)) return raw.data.scores;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.results)) return raw.results;
  return [];
}

export function parseAiMatchResponse(raw) {
  return extractMatchList(raw).map(normalizeAiMatchRow).filter(Boolean);
}

export function parseAiMatchJobResponse(raw) {
  return extractMatchList(raw).map(normalizeAiMatchJobRow).filter(Boolean);
}

export function summarizeAiMatches(matches) {
  const rows = (matches || []).map((row) => ({
    ...row,
    scorePercent: getMatchScorePercent(row),
  }));

  const veryGood = rows.filter((r) => r.scorePercent >= 85).length;
  const good = rows.filter((r) => r.scorePercent >= 60 && r.scorePercent < 85).length;
  const potential = rows.filter((r) => r.scorePercent >= 40 && r.scorePercent < 60).length;
  const total = rows.length;
  const avgScore = total
    ? Math.round(rows.reduce((sum, r) => sum + r.scorePercent, 0) / total)
    : 0;

  const sorted = [...rows].sort((a, b) => b.scorePercent - a.scorePercent);

  return {
    total,
    veryGood,
    good,
    potential,
    avgScore,
    sorted,
    matchStats: [
      { value: veryGood, label: 'Hồ sơ rất phù hợp', sub: '(Match ≥ 85%)' },
      { value: good, label: 'Hồ sơ phù hợp', sub: '(Match 60% - 84%)' },
      { value: potential, label: 'Hồ sơ tiềm năng', sub: '(Match 40% - 59%)' },
    ],
  };
}

export function getMatchQualityLabel(avgScore) {
  if (avgScore >= 80) return 'Tốt';
  if (avgScore >= 65) return 'Trung bình khá';
  if (avgScore > 0) return 'Trung bình';
  return '—';
}

export async function fetchAllBusinessScoutCandidates(apiService) {
  const candidates = [];
  let page = 1;
  const limit = 50;
  let totalPages = 1;
  let total = 0;

  do {
    const res = await apiService.getBusinessScoutCandidates({
      page,
      limit,
      sortBy: 'scoutListedAt',
      sortOrder: 'DESC',
    });
    if (!res?.success) break;
    const list = res.data?.candidates || [];
    candidates.push(...list);
    total = res.data?.pagination?.total ?? candidates.length;
    totalPages = res.data?.pagination?.totalPages || 1;
    page += 1;
  } while (page <= totalPages);

  const cvIds = candidates.map((c) => String(c.id)).filter(Boolean);
  return { candidates, cvIds, total: total || candidates.length };
}

/**
 * Job → CV scores (pool Scout business — cả ẩn danh & đã mở).
 * GET /v3/matching/match/job/{job_id}/cvs/scores
 */
export async function fetchJobAiCvMatches(apiService, jobId, options = {}) {
  if (!jobId) return [];
  return fetchMatchV3CvsScoresBatched(
    apiService,
    (id, params) => apiService.getAiMatchV3CvsScoresForJob(id, params),
    jobId,
    options.cv_ids,
    options,
  );
}

/**
 * Scout job → CV scores (business Scout pool).
 * GET /v3/matching/scout/job/{job_id}/cvs/scores
 */
export async function fetchJobScoutAiMatches(apiService, jobId, cvIds, options = {}) {
  if (!jobId) return [];
  return fetchMatchV3CvsScoresBatched(
    apiService,
    (id, params) => apiService.getAiMatchV3ScoutCvsScoresForJob(id, params),
    jobId,
    cvIds,
    options,
  );
}

/**
 * Scout CV → jobs của business.
 * GET /v3/matching/scout/cv/{cv_id}/business/{business_id}/jobs/scores
 */
export async function fetchScoutCvBusinessJobMatches(apiService, cvId, businessId, options = {}) {
  if (!cvId || !businessId) return [];
  const raw = await apiService.getAiMatchV3ScoutJobsScoresForCvBusiness(cvId, businessId, {
    top_k: options.top_k ?? 100,
    lang: options.lang,
  });
  return parseAiMatchJobResponse(raw);
}

/**
 * Lý do match cặp job–CV.
 * GET /v3/matching/reason
 */
export async function fetchAiMatchV3Reason(apiService, { jobId, cvId, lang } = {}) {
  if (!jobId || !cvId) return null;
  const raw = await apiService.getAiMatchV3Reason({
    job_id: jobId,
    cv_id: cvId,
    lang,
  });
  const reason = raw?.reason
    ?? raw?.reasoning
    ?? raw?.matching_reasons?.reason
    ?? raw?.data?.reason
    ?? raw?.data?.reasoning
    ?? null;
  if (typeof reason === 'string') return reason.trim() || null;
  if (reason && typeof reason === 'object') {
    return reason.vi || reason.en || reason.jp || reason.text || null;
  }
  return null;
}

export function buildScoreMapFromMatches(matches) {
  const map = {};
  (matches || []).forEach((row) => {
    const id = row?.id ?? row?.cv_id ?? row?.cvId;
    if (id == null) return;
    map[String(id)] = getMatchScorePercent(row);
  });
  return map;
}

export function buildJobScoreMapFromMatches(matches) {
  const map = {};
  (matches || []).forEach((row) => {
    const id = row?.job_id ?? row?.jobId ?? row?.id;
    if (id == null) return;
    map[String(id)] = getMatchScorePercent(row);
  });
  return map;
}

export function mergeScoutCandidateWithMatch(candidate, matchRow, index) {
  const score = getMatchScorePercent(matchRow);
  const meta = matchRow?.metadata || matchRow?.meta || {};
  const skills = Array.isArray(candidate?.technicalSkills)
    ? candidate.technicalSkills.filter(Boolean).map(String)
    : typeof candidate?.technicalSkills === 'string'
      ? candidate.technicalSkills.split(/[,;|/]/).map((s) => s.trim()).filter(Boolean)
      : Array.isArray(meta.skills)
        ? meta.skills.filter(Boolean).map(String)
        : typeof meta.skills === 'string'
          ? meta.skills.split(/[,;|/]/).map((s) => s.trim()).filter(Boolean)
          : [];
  const expYears = Number(
    candidate?.experienceYears ?? meta.experience_years ?? meta.experienceYears,
  );
  const exp = Number.isFinite(expYears) && expYears > 0 ? `${expYears} năm kinh nghiệm` : '—';

  const displayName = candidate?.isUnlocked && candidate?.name
    ? candidate.name
    : candidate?.anonymousName
      || meta.anonymous_name
      || meta.anonymousName
      || (candidate?.name && !candidate?.isUnlocked ? null : candidate?.name)
      || `Ẩn danh #${index + 1}`;

  return {
    id: candidate?.id ?? matchRow?.id ?? matchRow?.cv_id,
    name: displayName,
    role: candidate?.desiredPosition
      || candidate?.jobCategory?.name
      || meta.desired_position
      || meta.desiredPosition
      || meta.job_category
      || '—',
    match: Math.round(score),
    exp,
    location: candidate?.desiredWorkLocation
      || meta.desired_work_location
      || meta.desiredWorkLocation
      || meta.location
      || '—',
    skills: skills.slice(0, 3),
    extra: Math.max(0, skills.length - 3),
    isUnlocked: Boolean(candidate?.isUnlocked),
  };
}
