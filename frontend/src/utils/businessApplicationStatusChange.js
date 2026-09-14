import {
  getJobApplicationStatus,
  getJobApplicationStatusOptionsByLanguage,
} from './jobApplicationStatus'

/** Trạng thái DN được chọn trên drawer / cột bảng Quản lý tiến cử */
export const BUSINESS_APPLICATION_PORTAL_STATUS_VALUES = [5, 6, 8, 10, 11, 12, 13, 14]

export function getBusinessApplicationPortalStatusOptions(language, currentStatus) {
  const all = getJobApplicationStatusOptionsByLanguage(language)
  const byValue = new Map(all.map((o) => [Number(o.value), o]))
  const current = currentStatus != null && currentStatus !== '' ? Number(currentStatus) : null

  const values = [...BUSINESS_APPLICATION_PORTAL_STATUS_VALUES]
  if (Number.isFinite(current) && !values.includes(current)) {
    values.unshift(current)
  }

  return values.map((v) => byValue.get(v)).filter(Boolean)
}

export function isAllowedBusinessApplicationPortalStatus(status) {
  return BUSINESS_APPLICATION_PORTAL_STATUS_VALUES.includes(Number(status))
}

/**
 * @returns {Promise<{ success: boolean, skipped?: boolean, message?: string }>}
 */
export async function changeBusinessApplicationStatus(
  apiService,
  applicationId,
  newStatus,
  currentStatus,
  statusOptions = [],
) {
  if (Number(currentStatus) === Number(newStatus)) {
    return { success: true, skipped: true }
  }

  if (!isAllowedBusinessApplicationPortalStatus(newStatus)) {
    return { success: false, message: 'Trạng thái không được phép chọn' }
  }

  const payload = { status: newStatus }

  if (newStatus === 15) {
    const raw = window.prompt('Nhập số tiền thanh toán (VND):')
    if (raw == null) return { success: false, skipped: true }
    const paymentAmount = parseFloat(String(raw).replace(/,/g, ''))
    if (Number.isNaN(paymentAmount) || paymentAmount < 0) {
      return { success: false, message: 'Số tiền thanh toán không hợp lệ' }
    }
    payload.paymentAmount = paymentAmount
  }

  const res = await apiService.updateBusinessApplicationStatus(applicationId, payload)
  if (!res?.success) {
    return { success: false, message: res?.message || 'Không thể cập nhật trạng thái' }
  }

  return { success: true, patch: buildApplicationStatusPatch(newStatus, statusOptions) }
}

export function buildApplicationStatusPatch(newStatus, statusOptions = []) {
  const info = getJobApplicationStatus(newStatus)
  const statusLabel = statusOptions.find((o) => Number(o.value) === Number(newStatus))?.label
  return {
    status: newStatus,
    statusLabel: statusLabel || info.label,
    statusCategory: info.category,
  }
}
