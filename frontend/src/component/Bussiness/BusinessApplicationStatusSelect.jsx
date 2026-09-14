import React from 'react'
import { Loader2 } from 'lucide-react'
import { getStatusCategoryStyle } from '../../utils/businessApplicationSource'

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
  className = '',
  id,
}) {
  const stageStyle = getStatusCategoryStyle(statusCategory)
  const current = status != null && status !== '' ? Number(status) : 2
  const busy = disabled || updating

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
        className="w-full min-w-0 cursor-pointer appearance-none truncate rounded-lg py-2 pl-3 pr-9 text-xs font-semibold outline-none ring-1 ring-inset ring-black/5 focus:ring-[#0077B6]/40 disabled:cursor-not-allowed disabled:opacity-70 sm:text-sm"
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
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-500"
          aria-hidden
        />
      ) : null}
    </div>
  )
}
