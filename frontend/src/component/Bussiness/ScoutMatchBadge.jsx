import React, { useMemo } from 'react'
import { Gauge } from 'lucide-react'
import { getScoutMatchBadgeClass } from '../../utils/scoutCandidateDisplay'
import { getCandidateCopy, getScoutMatchBadgeCopy } from '../../i18n/businessAppI18n'

export default function ScoutMatchBadge({
  score,
  className = '',
  iconClassName = 'h-3 w-3',
  language = 'vi',
}) {
  const n = Number(score)
  const copy = useMemo(() => getScoutMatchBadgeCopy(language), [language])

  if (!Number.isFinite(n)) return null

  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold leading-none ${getScoutMatchBadgeClass(n)} ${className}`.trim()}
      title={copy.title}
    >
      <Gauge className={iconClassName} aria-hidden />
      {copy.label(Math.round(n))}
    </span>
  )
}

/** Góc phải card — luôn hiển thị; null score = chưa tính match */
export function CandidateListMatchCorner({
  score,
  language = 'vi',
  className = '',
  pendingLabel,
}) {
  const listCopy = useMemo(() => getCandidateCopy(language).list, [language])
  const matchCopy = useMemo(() => getScoutMatchBadgeCopy(language), [language])
  const n = score == null ? null : Number(score)
  const pendingText = pendingLabel || listCopy.matchNotCalculated

  if (n == null || !Number.isFinite(n)) {
    return (
      <span
        className={`inline-flex max-w-[7.5rem] items-center rounded-full border border-dashed border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold leading-tight text-slate-500 ${className}`.trim()}
        title={pendingText}
      >
        {pendingText}
      </span>
    )
  }

  return (
    <span title={matchCopy.title}>
      <ScoutMatchBadge
        score={n}
        language={language}
        className={`shrink-0 !px-2 !py-0.5 !text-[10px] ${className}`.trim()}
        iconClassName="h-2.5 w-2.5"
      />
    </span>
  )
}
