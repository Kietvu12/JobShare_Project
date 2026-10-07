/**
 * Trạng thái đơn theo nguồn trên cổng Doanh nghiệp (Quản lý ứng viên).
 * Mỗi nguồn (Sàn CTV / Scout Trực Tiếp / Scout Ủy Thác) có bộ trạng thái + bước chuyển riêng.
 * Mã số dùng chung job_applications.status (xem utils/jobApplicationStatus.js).
 */
import { getJobApplicationStatus, getJobApplicationStatusLabelByLanguage } from './jobApplicationStatus'

export const STATUS_FLOW_GROUP = {
  SCOUT_CREDIT: 'scout_credit',
  SCOUT_PERFORMANCE: 'scout_performance',
  CTV: 'ctv',
  OTHER: 'other',
}

/** Scout Ủy Thác bước 1–5: WS chuyển trạng thái, doanh nghiệp chỉ xem */
export const SCOUT_PERFORMANCE_WS_STATUSES = [2, 22, 3, 4, 20, 21]
const SCOUT_PERFORMANCE_WS_SET = new Set([1, ...SCOUT_PERFORMANCE_WS_STATUSES])

/** Bước cần nhập thêm dữ liệu khi chuyển */
export const STATUS_REQUIRES = {
  7: 'interviewDate',
  11: 'nyushaDate',
  15: 'paymentAmount',
}

/**
 * Danh sách trạng thái theo nguồn (thứ tự + số bước theo quy trình).
 * `codes`: mã được gộp khi lọc (mã cũ tương đương, vd 8 = đang xếp lịch PV cũ).
 */
const FLOW_STEPS = {
  ctv: [
    { step: '1', codes: [2] },
    { step: '2', codes: [5, 3] },
    { step: '3.1', codes: [1] },
    { step: '3.2', codes: [6, 4] },
    { step: '3.3', codes: [7, 8] },
    { step: '4', codes: [9] },
    { step: '5.1', codes: [10] },
    { step: '5.2', codes: [11] },
    { step: '6', codes: [13] },
    { step: '7', codes: [12] },
    { step: '8', codes: [14] },
    { step: '9', codes: [15] },
    { step: '10', codes: [16] },
  ],
  scout_credit: [
    { step: '1', codes: [19] },
    { step: '2.1', codes: [17] },
    { step: '2.2', codes: [18] },
    { step: '3', codes: [5] },
    { step: '4.1', codes: [6] },
    { step: '4.2', codes: [7, 8] },
    { step: '4.3', codes: [9] },
    { step: '5.1', codes: [10] },
    { step: '5.2', codes: [11] },
    { step: '6.1', codes: [13] },
    { step: '6.2', codes: [12] },
    { step: '7', codes: [14] },
    { step: '8', codes: [16] },
  ],
  scout_performance_ws: [
    { step: '1', codes: [2] },
    { step: '2', codes: [22] },
    { step: '3', codes: [3] },
    { step: '4.1', codes: [4] },
    { step: '4.2', codes: [20] },
    { step: '5', codes: [21] },
  ],
  scout_performance_business: [
    { step: '6', codes: [23] },
    { step: '7', codes: [5] },
    { step: '8.1', codes: [6] },
    { step: '8.2', codes: [7, 8] },
    { step: '9', codes: [9] },
    { step: '10.1', codes: [10] },
    { step: '10.2', codes: [11] },
    { step: '11.1', codes: [13] },
    { step: '11.2', codes: [12] },
    { step: '12', codes: [14] },
    { step: '13', codes: [15] },
    { step: '14', codes: [16] },
  ],
}

export function getStatusFlowGroup(sourceType) {
  if (sourceType === 'scout_credit') return STATUS_FLOW_GROUP.SCOUT_CREDIT
  if (sourceType === 'scout_performance') return STATUS_FLOW_GROUP.SCOUT_PERFORMANCE
  if (sourceType === 'ctv_marketplace' || sourceType === 'ctv_nomination') return STATUS_FLOW_GROUP.CTV
  return STATUS_FLOW_GROUP.OTHER
}

/** Scout Ủy Thác bước 1–5: WS xử lý, doanh nghiệp chỉ theo dõi */
export function isWsManagedPreNomination(sourceType, status) {
  return getStatusFlowGroup(sourceType) === STATUS_FLOW_GROUP.SCOUT_PERFORMANCE
    && SCOUT_PERFORMANCE_WS_SET.has(Number(status))
}

const COPY = {
  vi: {
    common: {
      1: 'Hồ sơ trùng',
      3: 'Đang đánh giá hồ sơ',
      4: 'Không đạt hồ sơ',
      5: 'Đang đánh giá hồ sơ',
      6: 'Không đạt hồ sơ',
      7: 'Đang xếp lịch phỏng vấn',
      8: 'Đang xếp lịch phỏng vấn',
      9: 'Đang phỏng vấn',
      10: 'Trượt phỏng vấn',
      11: 'Đã gửi offer',
      12: 'Chờ vào công ty',
      13: 'Ứng viên từ chối offer',
      14: 'Đã vào công ty',
      15: 'Đã thanh toán',
      16: 'Ứng viên huỷ giữa chừng',
    },
    ctv: {
      2: 'Hồ sơ mới được tiến cử',
    },
    other: {
      2: 'Hồ sơ mới',
    },
    scout_credit: {
      19: 'Mới liên hệ ứng viên',
      17: 'Không có phản hồi',
      18: 'Ứng viên từ chối',
    },
    scout_performance: {
      2: 'Đã gửi yêu cầu uỷ thác WS',
      22: 'Đang chờ hoàn tất hợp đồng',
      3: 'WS đang hearing',
      4: 'Đã hearing – Ứng viên từ chối',
      20: 'Đã hearing – Đồng ý tiến cử',
      21: 'WS đang hoàn thiện hồ sơ',
      23: 'WS mới tiến cử',
    },
    groups: {
      ctv: 'Sàn CTV',
      scout_credit: 'Scout Trực Tiếp',
      scout_performance: 'Scout Ủy Thác',
      scout_performance_ws: 'Scout Ủy Thác – Phần WS xử lý',
      scout_performance_business: 'Scout Ủy Thác',
    },
    actions: {
      candidateAgreed: 'Ứng viên đồng ý & liên hệ lại → Đang đánh giá hồ sơ',
      offerAccepted: 'Ứng viên đồng ý offer → Chờ vào công ty',
      scheduleInterview: 'Đang xếp lịch phỏng vấn (chọn ngày phỏng vấn)',
      sendOffer: 'Đã gửi offer (chọn ngày vào dự kiến)',
      nextRound: 'Xếp lịch phỏng vấn vòng tiếp theo',
    },
  },
  en: {
    common: {
      1: 'Duplicate profile',
      3: 'Reviewing profile',
      4: 'Profile rejected',
      5: 'Reviewing profile',
      6: 'Profile rejected',
      7: 'Scheduling interview',
      8: 'Scheduling interview',
      9: 'Interviewing',
      10: 'Failed interview',
      11: 'Offer sent',
      12: 'Waiting to join',
      13: 'Candidate declined offer',
      14: 'Joined company',
      15: 'Paid',
      16: 'Candidate withdrew',
    },
    ctv: {
      2: 'Newly nominated',
    },
    other: {
      2: 'New profile',
    },
    scout_credit: {
      19: 'Candidate just contacted',
      17: 'No response',
      18: 'Candidate declined',
    },
    scout_performance: {
      2: 'Request sent to WS',
      22: 'Awaiting contract completion',
      3: 'WS hearing in progress',
      4: 'Hearing done – Candidate declined',
      20: 'Hearing done – Agreed to nomination',
      21: 'WS preparing profile',
      23: 'Newly nominated by WS',
    },
    groups: {
      ctv: 'Collaborator Marketplace',
      scout_credit: 'Direct Scout',
      scout_performance: 'Omakase Scout',
      scout_performance_ws: 'Omakase Scout – Handled by WS',
      scout_performance_business: 'Omakase Scout',
    },
    actions: {
      candidateAgreed: 'Candidate agreed & replied → Reviewing profile',
      offerAccepted: 'Candidate accepted offer → Waiting to join',
      scheduleInterview: 'Scheduling interview (pick interview date)',
      sendOffer: 'Offer sent (pick expected start date)',
      nextRound: 'Schedule next interview round',
    },
  },
  ja: {
    common: {
      1: '重複',
      3: '書類選考中',
      4: '書類不合格',
      5: '書類選考中',
      6: '書類不合格',
      7: '面接日程調整中',
      8: '面接日程調整中',
      9: '面接中',
      10: '面接不合格',
      11: '内定通知済み',
      12: '入社待ち',
      13: '候補者が内定辞退',
      14: '入社済み',
      15: '支払済み',
      16: '候補者が途中辞退',
    },
    ctv: {
      2: '新規推薦',
    },
    other: {
      2: '新規応募',
    },
    scout_credit: {
      19: '候補者に連絡済み',
      17: '返答なし',
      18: '候補者が辞退',
    },
    scout_performance: {
      2: 'WSへ委託依頼済み',
      22: '契約手続き待ち',
      3: 'WSヒアリング中',
      4: 'ヒアリング済み－候補者辞退',
      20: 'ヒアリング済み－推薦に同意',
      21: 'WSがプロフィール作成中',
      23: 'WSから新規推薦',
    },
    groups: {
      ctv: '採用パートナーマーケット',
      scout_credit: 'ダイレクトスカウト',
      scout_performance: 'おまかせスカウト',
      scout_performance_ws: 'おまかせスカウト－WS対応',
      scout_performance_business: 'おまかせスカウト',
    },
    actions: {
      candidateAgreed: '候補者が同意・返信 → 書類選考中',
      offerAccepted: '内定承諾 → 入社待ち',
      scheduleInterview: '面接日程調整中（面接日を選択）',
      sendOffer: '内定通知済み（入社予定日を選択）',
      nextRound: '次の面接の日程調整',
    },
  },
}

function getCopy(language) {
  return COPY[language] || COPY.vi
}

/** Nhãn trạng thái theo nguồn (doanh nghiệp) */
export function getBusinessStatusLabel(status, sourceType, language = 'vi') {
  const n = Number(status)
  const c = getCopy(language)
  const group = getStatusFlowGroup(sourceType)
  return c[group]?.[n]
    || c.common[n]
    || c.scout_credit[n]
    || c.scout_performance[n]
    || getJobApplicationStatusLabelByLanguage(n, language)
}

/** Huỷ giữa chừng: chọn được ở mọi bước chưa kết thúc */
const WITHDRAW = { value: 16 }

/** Bước chuyển chung từ lúc đánh giá hồ sơ → vào công ty (7 → 9 và 12 → 14 còn tự chuyển theo ngày đã set) */
function getPipelineSteps(n, { hasPayment }) {
  switch (n) {
    case 3:
    case 5:
      return [{ value: 7, actionKey: 'scheduleInterview' }, { value: 6 }, WITHDRAW]
    case 7:
      return [{ value: 9 }, WITHDRAW]
    case 8:
      return [{ value: 9 }, { value: 7, actionKey: 'scheduleInterview' }, WITHDRAW]
    case 9:
      return [{ value: 11, actionKey: 'sendOffer' }, { value: 10 }, { value: 7, actionKey: 'nextRound' }, WITHDRAW]
    case 11:
      return [{ value: 12, actionKey: 'offerAccepted' }, { value: 13 }, WITHDRAW]
    case 12:
      return [{ value: 14 }, WITHDRAW]
    case 14:
      return hasPayment ? [{ value: 15 }, WITHDRAW] : [WITHDRAW]
    default:
      return []
  }
}

/**
 * Bước tiếp theo hợp lệ cho doanh nghiệp: [{ value, actionKey?, reschedule? }]
 * Trạng thái "dừng" không có bước tiếp theo.
 */
function getNextSteps(status, group) {
  const n = Number(status)

  if (group === STATUS_FLOW_GROUP.SCOUT_CREDIT) {
    if (n === 19) return [{ value: 5, actionKey: 'candidateAgreed' }, { value: 17 }, { value: 18 }, WITHDRAW]
    return getPipelineSteps(n, { hasPayment: false })
  }

  if (group === STATUS_FLOW_GROUP.SCOUT_PERFORMANCE) {
    if (SCOUT_PERFORMANCE_WS_SET.has(n)) return []
    if (n === 23) return [{ value: 5 }, { value: 6 }, { value: 7, actionKey: 'scheduleInterview' }, WITHDRAW]
    return getPipelineSteps(n, { hasPayment: true })
  }

  if (n === 2) return [{ value: 5 }, { value: 6 }, { value: 7, actionKey: 'scheduleInterview' }, WITHDRAW]
  return getPipelineSteps(n, { hasPayment: group === STATUS_FLOW_GROUP.CTV })
}

/**
 * Options cho dropdown trạng thái: phần tử đầu = trạng thái hiện tại, sau đó là các bước tiếp theo.
 * @returns {{ value: number, label: string, statusLabel: string, isCurrent?: boolean, requires?: string }[]}
 */
export function getBusinessStatusOptions(status, sourceType, language = 'vi') {
  const current = Number(status)
  const c = getCopy(language)
  const group = getStatusFlowGroup(sourceType)
  const currentLabel = getBusinessStatusLabel(current, sourceType, language)
  const options = [{ value: current, label: currentLabel, statusLabel: currentLabel, isCurrent: true }]
  getNextSteps(current, group).forEach((step) => {
    if (step.value === current) return
    const statusLabel = getBusinessStatusLabel(step.value, sourceType, language)
    const label = `→ ${step.actionKey ? c.actions[step.actionKey] : statusLabel}`
    options.push({
      value: step.value,
      label,
      statusLabel,
      requires: STATUS_REQUIRES[step.value] || null,
    })
  })
  return options
}

export function isAllowedBusinessStatusTransition(fromStatus, toStatus, sourceType) {
  const group = getStatusFlowGroup(sourceType)
  return getNextSteps(fromStatus, group).some((s) => Number(s.value) === Number(toStatus))
}

function stepsToOptions(steps, sourceType, language) {
  return steps.map(({ codes }) => ({
    value: `${sourceType}:${codes.join(',')}`,
    label: getBusinessStatusLabel(codes[0], sourceType, language),
  }))
}

/**
 * Option groups cho bộ lọc trạng thái — chỉ hiện bộ trạng thái của nguồn đang lọc.
 * Không chọn nguồn → hiện đủ bộ của cả 3 nguồn (value kèm nguồn: `scout_performance:23`).
 */
export function getBusinessStatusFilterGroups(sourceFilter, language = 'vi') {
  const c = getCopy(language)
  const groups = []
  if (!sourceFilter || sourceFilter === 'ctv_marketplace') {
    groups.push({ key: 'ctv', label: c.groups.ctv, options: stepsToOptions(FLOW_STEPS.ctv, 'ctv_marketplace', language) })
  }
  if (!sourceFilter || sourceFilter === 'scout_credit') {
    groups.push({ key: 'scout_credit', label: c.groups.scout_credit, options: stepsToOptions(FLOW_STEPS.scout_credit, 'scout_credit', language) })
  }
  if (!sourceFilter || sourceFilter === 'scout_performance') {
    groups.push({
      key: 'scout_performance_business',
      label: c.groups.scout_performance,
      options: stepsToOptions(FLOW_STEPS.scout_performance_business, 'scout_performance', language),
    })
  }
  return groups
}

/** @returns {{ status: string, sourceType: string|null }} status có thể là danh sách "5,3" */
export function parseBusinessStatusFilterValue(value) {
  const raw = String(value || '')
  const idx = raw.indexOf(':')
  if (idx < 0) return { status: raw, sourceType: null }
  return { status: raw.slice(idx + 1), sourceType: raw.slice(0, idx) || null }
}

export function buildBusinessStatusPatch(newStatus, sourceType, language = 'vi') {
  const info = getJobApplicationStatus(newStatus)
  return {
    status: Number(newStatus),
    statusLabel: getBusinessStatusLabel(newStatus, sourceType, language),
    statusCategory: info.category,
  }
}
