export function getBusinessUnlockedCandidateDetailUrl(candidateId, { list, search } = {}) {
  const params = new URLSearchParams()
  if (list && list !== 'all') params.set('list', list)
  if (search) params.set('search', search)
  const qs = params.toString()
  return `/business/candidates/${candidateId}${qs ? `?${qs}` : ''}`
}
