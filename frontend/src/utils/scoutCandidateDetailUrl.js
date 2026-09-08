export function resolveScoutEntryMode({ mode, performanceRequestId } = {}) {
  if (mode === 'credit' || mode === 'performance') return mode
  if (performanceRequestId) return 'performance'
  return null
}

export function getScoutCandidateDetailUrl(cvId, { jobId, performanceRequestId, search, mode } = {}) {
  if (!cvId) return performanceRequestId ? '/business/scout/managed' : '/business/scout/direct'
  const params = new URLSearchParams()
  if (jobId) params.set('jobId', String(jobId))
  if (performanceRequestId) params.set('performanceRequestId', String(performanceRequestId))
  if (search) params.set('search', String(search))
  const resolvedMode = resolveScoutEntryMode({ mode, performanceRequestId })
  if (resolvedMode) params.set('mode', resolvedMode)
  const qs = params.toString()
  return `/business/scout/candidates/${cvId}${qs ? `?${qs}` : ''}`
}

export function getScoutListUrl({ jobId, performanceRequestId } = {}) {
  const base = performanceRequestId ? '/business/scout/managed' : '/business/scout/direct'
  const params = new URLSearchParams()
  if (jobId) params.set('jobId', String(jobId))
  if (performanceRequestId) params.set('performanceRequestId', String(performanceRequestId))
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}
