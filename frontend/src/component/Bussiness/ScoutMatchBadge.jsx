import React from 'react'
import { Gauge } from 'lucide-react'
import { getScoutMatchBadgeClass } from '../../utils/scoutCandidateDisplay'

export default function ScoutMatchBadge({ score, className = '', iconClassName = 'h-3 w-3' }) {
  const n = Number(score)
  if (!Number.isFinite(n)) return null

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold leading-none sm:text-[13px] ${getScoutMatchBadgeClass(n)} ${className}`.trim()}
      title="Điểm phù hợp AI"
    >
      <Gauge className={iconClassName} aria-hidden />
      {Math.round(n)}% match
    </span>
  )
}
