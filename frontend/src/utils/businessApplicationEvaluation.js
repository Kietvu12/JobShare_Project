/** Trạng thái đánh giá hồ sơ trên Quản lý tiến cử */

export const PROFILE_EVALUATION = {
  PENDING: 'pending',
  PASS: 'pass',
  FAIL: 'fail',
}

const FAIL_STATUSES = new Set([1, 4, 6, 10, 13, 16])
const PASS_SCREENING_STATUSES = new Set([7, 8, 9, 11, 12, 14, 15])

export function resolveProfileEvaluation(application) {
  const status = Number(application?.status)
  if (FAIL_STATUSES.has(status)) return PROFILE_EVALUATION.FAIL
  if (PASS_SCREENING_STATUSES.has(status) && application?.interviewDate) {
    return PROFILE_EVALUATION.PASS
  }
  return PROFILE_EVALUATION.PENDING
}

export function formatInterviewReminderLabel(dateValue, language = 'vi') {
  if (!dateValue) return ''
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  const locale = language === 'ja' ? 'ja-JP' : language === 'en' ? 'en-US' : 'vi-VN'
  return date.toLocaleString(locale, {
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function buildInterviewReminderMemo({ date, time, note, language = 'vi' }) {
  const dateTime = new Date(`${date}T${time}`)
  if (Number.isNaN(dateTime.getTime())) return ''
  const when = formatInterviewReminderLabel(dateTime.toISOString(), language)
  const prefix = language === 'en'
    ? '📅 Interview reminder'
    : language === 'ja'
      ? '📅 面接リマインダー'
      : '📅 Nhắc phỏng vấn'
  const trimmedNote = note?.trim()
  return trimmedNote ? `${prefix}: ${when}\n${trimmedNote}` : `${prefix}: ${when}`
}
