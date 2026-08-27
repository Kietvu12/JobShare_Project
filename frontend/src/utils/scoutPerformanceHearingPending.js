const SESSION_KEY = 'wjs_scout_performance_hearing_pending';

export function setScoutPerformanceHearingPending(payload) {
  if (!payload?.cvId) return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      cvId: payload.cvId,
      returnPath: payload.returnPath || '',
      wantsSimilarCandidates: !!payload.wantsSimilarCandidates,
      message: payload.message || undefined,
    }));
  } catch {
    /* ignore quota */
  }
}

export function peekScoutPerformanceHearingPending() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function consumeScoutPerformanceHearingPending() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SESSION_KEY);
    return JSON.parse(raw);
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearScoutPerformanceHearingPending() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function getScoutPerformanceHearingReturnPath(pending, cvId) {
  return pending?.returnPath
    || `/business/scout/candidates/${encodeURIComponent(String(cvId || pending?.cvId || ''))}`;
}

/** Sau khi tạo JD xong — gửi yêu cầu Scout Ủy Thác hearing. */
export async function submitScoutPerformanceHearingForJob(apiService, jobId, pending) {
  if (!pending?.cvId || !jobId) {
    throw new Error('Thiếu thông tin ứng viên hoặc JD');
  }

  let jobTitle = '';
  try {
    const res = await apiService.getBusinessJobById(jobId);
    const job = res?.data?.job || res?.data;
    jobTitle = job?.title || job?.titleEn || job?.titleJp || '';
  } catch {
    /* giữ title mặc định */
  }

  const hearingRes = await apiService.createBusinessScoutPerformanceRequest(pending.cvId, {
    jobId,
    jobTitle: jobTitle || undefined,
    wantsSimilarCandidates: !!pending.wantsSimilarCandidates,
    message: pending.message,
  });

  return {
    hearingRes,
    returnPath: getScoutPerformanceHearingReturnPath(pending, pending.cvId),
  };
}
