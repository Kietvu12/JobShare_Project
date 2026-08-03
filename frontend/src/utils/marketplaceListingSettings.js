import {
  normalizeJobCommissionType,
  pickPrimaryCommissionJobValue,
} from './jobCommissionUi'

/** Phí nền tảng WS khi CTV tiến cử trực tiếp (feedback: 30% DN → WS, 70% CTV) */
export const MARKETPLACE_PLATFORM_FEE_PERCENT = 30

export const MIN_CTV_RATING_OPTIONS = [
  { value: 0, label: 'Không yêu cầu' },
  { value: 3, label: 'Từ 3 sao trở lên' },
  { value: 4, label: 'Từ 4 sao trở lên' },
  { value: 5, label: 'Chỉ CTV 5 sao' },
]

export function buildMarketplaceRequirements({ minCtvRating = 0 }) {
  const lines = [
    '[Sàn CTV — Cài đặt đăng tin]',
    'Kênh tiến cử: Chỉ qua nền tảng (email DN chỉ là thông báo)',
    'Thanh toán: DN xác nhận tuyển thành công trên JobShare',
  ]
  if (minCtvRating > 0) {
    lines.push(`Điểm CTV tối thiểu: ${minCtvRating}/5`)
  }
  return lines.join('\n')
}

export function computeListingFeeSplitPreview({
  jobCommissionType,
  jobValues,
  platformFeePercent = MARKETPLACE_PLATFORM_FEE_PERCENT,
}) {
  const ctvShare = (100 - platformFeePercent) / 100
  const rows = Array.isArray(jobValues) ? jobValues : []
  const primary = pickPrimaryCommissionJobValue(rows) ?? rows[0] ?? null
  const commissionType = normalizeJobCommissionType({ jobCommissionType })

  if (commissionType === 'fixed') {
    const raw = primary?.value
    if (raw == null || String(raw).trim() === '') return null
    const businessPays = parseFloat(String(raw))
    if (!Number.isFinite(businessPays) || businessPays <= 0) return null
    const ctvReceives = Math.round(businessPays * ctvShare)
    const platformFee = businessPays - ctvReceives
    return {
      mode: 'fixed',
      businessPaysLabel: `${businessPays.toLocaleString('vi-VN')}đ`,
      ctvReceivesLabel: `${ctvReceives.toLocaleString('vi-VN')}đ (${Math.round(ctvShare * 100)}%)`,
      platformFeeLabel: `${platformFee.toLocaleString('vi-VN')}đ (${platformFeePercent}%)`,
    }
  }

  let jobPercent = NaN
  const rawPct = primary?.value != null ? parseFloat(String(primary.value)) : NaN
  if (Number.isFinite(rawPct) && rawPct > 0) jobPercent = rawPct
  else {
    for (const jv of rows) {
      const n = jv?.value != null ? parseFloat(String(jv.value)) : NaN
      if (Number.isFinite(n) && n > 0) { jobPercent = n; break }
    }
  }
  if (!Number.isFinite(jobPercent) || jobPercent <= 0) return null

  const ctvPct = jobPercent * ctvShare
  const platformPctOfFee = jobPercent * (platformFeePercent / 100)
  const fmt = (n) => (Number.isInteger(n) ? n : n.toFixed(1))
  return {
    mode: 'percent',
    businessPaysLabel: `${fmt(jobPercent)}% thu nhập năm`,
    ctvReceivesLabel: `${fmt(ctvPct)}% thu nhập năm (${Math.round(ctvShare * 100)}%)`,
    platformFeeLabel: `${fmt(platformPctOfFee)}% thu nhập năm (${platformFeePercent}%)`,
  }
}
