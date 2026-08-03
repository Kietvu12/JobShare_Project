import apiService from '../services/api'
import { isPersistableJobValue } from './jobCommissionUi'

const STORAGE_KEY = 'wjs_pending_marketplace_listing'

export function savePendingMarketplaceListingDraft(draft) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...draft,
        createdAt: Date.now(),
      }),
    )
  } catch {
    /* quota */
  }
}

export function peekPendingMarketplaceListingDraft() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function clearPendingMarketplaceListingDraft() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function mapJobValuesForListingApi(jobValues) {
  return (jobValues || [])
    .filter(isPersistableJobValue)
    .map((jv) => ({
      typeId: jv.typeId ? Number(jv.typeId) : null,
      valueId: jv.valueId ? Number(jv.valueId) : null,
      value: jv.value != null && String(jv.value).trim() !== '' ? String(jv.value).trim() : null,
      isRequired: !!jv.isRequired,
      viewOnCollaborator: jv.viewOnCollaborator || null,
    }))
}

export function buildMarketplaceListingBody(jobId, draft) {
  return {
    jobId: Number(jobId),
    headcount: 1,
    requirements: draft?.requirements ?? null,
    recruitmentDeadline: draft?.recruitmentDeadline || null,
    platformFeePercent: draft?.platformFeePercent ?? null,
    jobCommissionType: draft.jobCommissionType,
    jobValues: mapJobValuesForListingApi(draft?.jobValues),
  }
}

/** Tạo listing + gửi WS duyệt đưa job lên sàn CTV. */
export async function createAndSubmitMarketplaceListing(jobId, draft) {
  const res = await apiService.createBusinessCandidateSharingListing(
    buildMarketplaceListingBody(jobId, draft),
  )
  if (!res?.success || !res.data?.listing) {
    throw new Error(res?.message || 'Tạo listing thất bại')
  }
  const submitRes = await apiService.submitBusinessCandidateSharingListing(res.data.listing.id)
  if (!submitRes?.success) {
    throw new Error(submitRes?.message || 'Gửi WS duyệt thất bại')
  }
  return {
    listing: res.data.listing,
    wsSessionId: submitRes?.data?.wsSessionId || null,
  }
}
