import React, { useMemo } from 'react'
import { getScoutWorkspaceCopy } from '../../i18n/businessApp/scoutWorkspace'

const STAGE_ORDER = [
  'awaiting_contract',
  'ws_hearing',
  'common_pipeline',
]

export default function ScoutPerformancePipelineBar({
  pipeline,
  language = 'vi',
  onViewApplications,
  className = '',
}) {
  const copy = useMemo(
    () => getScoutWorkspaceCopy(language).onboarding.managed.pipeline,
    [language],
  )

  if (!pipeline?.stage) return null

  const currentIdx = STAGE_ORDER.indexOf(pipeline.stage)
  const isRejected = pipeline.stage === 'hearing_rejected'

  return (
    <div className={`rounded-xl border border-[#cce5f0] bg-[#f8fbfd] px-3 py-3 sm:px-4 ${className}`.trim()}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#006399]">{copy.title}</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {isRejected ? copy.hearing_rejected : (copy[pipeline.stage] || pipeline.stage)}
          </p>
          {pipeline.jobTitle ? (
            <p className="mt-0.5 text-xs text-slate-600">JD: {pipeline.jobTitle}</p>
          ) : null}
        </div>
        {onViewApplications ? (
          <button
            type="button"
            onClick={onViewApplications}
            className="text-xs font-semibold text-[#0077B6] hover:underline"
          >
            {copy.viewApplications}
          </button>
        ) : null}
      </div>

      {!isRejected ? (
        <ol className="mt-3 flex flex-wrap gap-2">
          {STAGE_ORDER.map((key, idx) => {
            const active = pipeline.stage === key
            const done = currentIdx > idx
            return (
              <li
                key={key}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold sm:text-[11px] ${
                  active
                    ? 'bg-[#0077B6] text-white'
                    : done
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-white text-slate-500 ring-1 ring-slate-200'
                }`}
              >
                {copy[key]}
              </li>
            )
          })}
        </ol>
      ) : null}

      <p className="mt-2 text-[11px] leading-snug text-slate-600 sm:text-xs">
        {pipeline.releaseContact ? copy.contactReleased : copy.contactLocked}
      </p>
    </div>
  )
}
