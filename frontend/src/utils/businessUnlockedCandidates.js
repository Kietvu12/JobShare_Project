export async function fetchAllBusinessUnlockedCandidates(apiService, { unlockType } = {}) {
  const candidates = []
  let page = 1
  const limit = 50
  let totalPages = 1

  do {
    const res = await apiService.getBusinessScoutUnlockedCandidates({
      page,
      limit,
      unlockType: unlockType || undefined,
      sortBy: 'unlockedAt',
      sortOrder: 'DESC',
    })
    if (!res?.success) break
    const list = res.data?.candidates || []
    candidates.push(...list)
    totalPages = res.data?.pagination?.totalPages || 1
    page += 1
  } while (page <= totalPages)

  return { candidates, total: candidates.length }
}
