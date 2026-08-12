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
