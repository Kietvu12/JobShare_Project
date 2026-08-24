import React, { useMemo } from 'react'
import { Gauge } from 'lucide-react'
import { getScoutMatchBadgeClass } from '../../utils/scoutCandidateDisplay'
import { getScoutMatchBadgeCopy } from '../../i18n/businessAppI18n'

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
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 biz-ui-body font-bold leading-none ${getScoutMatchBadgeClass(n)} ${className}`.trim()}
      title={copy.title}
    >
      <Gauge className={iconClassName} aria-hidden />
      {copy.label(Math.round(n))}
    </span>
  )
}
