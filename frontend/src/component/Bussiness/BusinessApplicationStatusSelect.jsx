import React from 'react'
import { Loader2 } from 'lucide-react'
import { getStatusCategoryStyle } from '../../utils/businessApplicationSource'
import { BUSINESS_HP_TEXT } from '../../utils/businessHomepageTypography.js'

/**
 * Dropdown trạng thái đơn tiến cử — bảng danh sách & drawer chi tiết.
 */
export default function BusinessApplicationStatusSelect({
  status,
  statusCategory,
  statusLabel,
  statusOptions,
  onChange,
  disabled = false,
  updating = false,
  compact = false,
  className = '',
  id,
}) {
  const stageStyle = getStatusCategoryStyle(statusCategory)
  const current = status != null && status !== '' ? Number(status) : 2
  const noNextStep = (statusOptions?.length || 0) <= 1
  const busy = disabled || updating || noNextStep

  return (
    <div
      className={`relative min-w-0 ${className}`.trim()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <select
        id={id}
        value={String(current)}
        disabled={busy}
        onChange={(e) => {
          e.stopPropagation()
          const next = Number(e.target.value)
          if (next !== current) onChange(next)
        }}
        className={`w-full min-w-0 cursor-pointer appearance-none whitespace-nowrap rounded-lg font-semibold outline-none ring-1 ring-inset ring-black/5 focus:ring-[#0077B6]/40 disabled:cursor-default ${noNextStep ? '' : 'disabled:opacity-70'} ${
          compact
            ? 'py-1 pl-2 pr-7 text-[10px] sm:text-[11px]'
            : `py-2 pl-3 pr-9 ${BUSINESS_HP_TEXT.body}`
        }`}
        style={{ color: stageStyle.color, backgroundColor: stageStyle.bg }}
        aria-label={statusLabel || 'Trạng thái đơn tiến cử'}
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {updating ? (
        <Loader2
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 animate-spin text-slate-500 ${compact ? 'right-1.5 h-3 w-3' : 'right-2.5 h-4 w-4'}`}
          aria-hidden
        />
      ) : null}
    </div>
  )
}
