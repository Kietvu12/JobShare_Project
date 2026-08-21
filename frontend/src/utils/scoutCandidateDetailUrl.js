export function getScoutCandidateDetailUrl(cvId, { jobId, performanceRequestId, search } = {}) {
  if (!cvId) return performanceRequestId ? '/business/scout/managed' : '/business/scout/direct'
  const params = new URLSearchParams()
  if (jobId) params.set('jobId', String(jobId))
  if (performanceRequestId) params.set('performanceRequestId', String(performanceRequestId))
  if (search) params.set('search', String(search))
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
