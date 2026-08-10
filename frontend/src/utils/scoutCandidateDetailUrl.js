export function getScoutCandidateDetailUrl(cvId, { jobId, performanceRequestId, search } = {}) {
  if (!cvId) return '/business/scout'
  const params = new URLSearchParams()
  if (jobId) params.set('jobId', String(jobId))
  if (performanceRequestId) params.set('performanceRequestId', String(performanceRequestId))
  if (search) params.set('search', String(search))
  const qs = params.toString()
  return `/business/scout/candidates/${cvId}${qs ? `?${qs}` : ''}`
}
