/**
 * AI matching Scout CV ↔ Business job (vector JD + POST /v2/matching/ctv/match).
 */

export function normalizeAiMatchRow(row) {
  if (!row || typeof row !== 'object') return null;
  const score = Number(row.score ?? row.similarity_score ?? row.match_score ?? 0);
  const meta = row.metadata || row.meta || {};
  return {
    ...row,
    id: row.id ?? row.cv_id ?? row.cvId,
    similarity_score: Number.isFinite(score) ? score : 0,
    reasoning: row.reasoning || row.reason || row.matching_reasons?.reason || null,
    metadata: meta,
  };
}

export function getMatchScorePercent(row) {
  const raw = Number(row?.similarity_score ?? row?.score ?? row?.match_score ?? 0);
  if (!Number.isFinite(raw)) return 0;
  const pct = raw <= 1 ? raw * 100 : raw;
  return Math.max(0, Math.min(100, pct));
}

export function parseAiMatchResponse(raw) {
  const sourceList = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.items)
      ? raw.items
      : Array.isArray(raw?.data?.items)
        ? raw.data.items
        : Array.isArray(raw?.data)
          ? raw.data
          : [];
  return sourceList.map(normalizeAiMatchRow).filter(Boolean);
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

export async function fetchJobScoutAiMatches(apiService, jobId, cvIds) {
  const ids = (Array.isArray(cvIds) ? cvIds : []).map((id) => String(id)).filter(Boolean);
  if (!jobId || !ids.length) return [];

  const raw = await apiService.getAiMatchScoreForJobCv({
    job_id: jobId,
    cv_ids: ids,
  });
  return parseAiMatchResponse(raw);
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

export function mergeScoutCandidateWithMatch(candidate, matchRow, index) {
  const score = getMatchScorePercent(matchRow);
  const skills = Array.isArray(candidate?.technicalSkills)
    ? candidate.technicalSkills.filter(Boolean).map(String)
    : typeof candidate?.technicalSkills === 'string'
      ? candidate.technicalSkills.split(/[,;|/]/).map((s) => s.trim()).filter(Boolean)
      : [];
  const expYears = Number(candidate?.experienceYears);
  const exp = Number.isFinite(expYears) && expYears > 0 ? `${expYears} năm kinh nghiệm` : '—';

  return {
    id: candidate?.id ?? matchRow?.id,
    name: candidate?.anonymousName || candidate?.name || `Ẩn danh #${index + 1}`,
    role: candidate?.desiredPosition || candidate?.jobCategory?.name || '—',
    match: Math.round(score),
    exp,
    location: candidate?.desiredWorkLocation || '—',
    skills: skills.slice(0, 3),
    extra: Math.max(0, skills.length - 3),
  };
}
