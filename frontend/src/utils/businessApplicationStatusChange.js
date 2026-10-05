import { getJobApplicationStatus } from './jobApplicationStatus'
import { getBusinessStatusOptions, STATUS_REQUIRES } from './businessApplicationStatusFlow'
import { openBusinessStatusDetailDialog } from '../component/Bussiness/BusinessStatusDetailDialog.jsx'

/** Options dropdown trạng thái trên drawer / cột bảng Quản lý ứng viên — theo nguồn đơn */
export function getBusinessApplicationPortalStatusOptions(language, currentStatus, sourceType) {
  return getBusinessStatusOptions(currentStatus, sourceType, language)
}

/**
 * @param {{ value: number }[]} statusOptions - options từ getBusinessApplicationPortalStatusOptions (phần tử đầu = trạng thái hiện tại)
 * @returns {Promise<{ success: boolean, skipped?: boolean, message?: string, patch?: object }>}
 */
export async function changeBusinessApplicationStatus(
  apiService,
  applicationId,
  newStatus,
  currentStatus,
  statusOptions = [],
  language = 'vi',
) {
  if (Number(currentStatus) === Number(newStatus)) {
    return { success: true, skipped: true }
  }

  const option = statusOptions.find((o) => !o.isCurrent && Number(o.value) === Number(newStatus))
  if (!option) {
    return { success: false, message: 'Trạng thái không được phép chọn' }
  }

  const payload = { status: newStatus }
  const requires = option.requires || STATUS_REQUIRES[newStatus]
  if (requires) {
    const extra = await openBusinessStatusDetailDialog(requires, language)
    if (!extra) return { success: false, skipped: true }
    Object.assign(payload, extra)
  }

  const res = await apiService.updateBusinessApplicationStatus(applicationId, payload)
  if (!res?.success) {
    return { success: false, message: res?.message || 'Không thể cập nhật trạng thái' }
  }

  const patch = buildApplicationStatusPatch(newStatus, statusOptions)
  if (payload.interviewDate) patch.interviewDate = payload.interviewDate
  if (payload.nyushaDate) patch.nyushaDate = payload.nyushaDate
  return { success: true, patch }
}

export function buildApplicationStatusPatch(newStatus, statusOptions = []) {
  const info = getJobApplicationStatus(newStatus)
  const statusLabel = statusOptions.find((o) => Number(o.value) === Number(newStatus))?.statusLabel
  return {
    status: newStatus,
    statusLabel: statusLabel || info.label,
    statusCategory: info.category,
  }
}
