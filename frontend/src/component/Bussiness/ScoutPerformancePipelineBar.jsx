import React, { useMemo } from 'react'
import { getLocalizedJobTitle } from '../../i18n/businessApp/jdBuilder'
import { getScoutWorkspaceCopy } from '../../i18n/businessApp/scoutWorkspace'
import { BUSINESS_HP_TEXT } from '../../utils/businessHomepageTypography.js'

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

  const pipelineJobTitle = useMemo(() => {
    if (!pipeline?.jobTitle && !pipeline?.jobId) return ''
    return getLocalizedJobTitle({
      id: pipeline.jobId,
      title: pipeline.jobTitle,
      titleEn: pipeline.jobTitleEn,
      titleJp: pipeline.jobTitleJp,
    }, language)
  }, [pipeline, language])

  if (!pipeline?.stage) return null

  const currentIdx = STAGE_ORDER.indexOf(pipeline.stage)
  const isRejected = pipeline.stage === 'hearing_rejected'

  return (
    <div className={`rounded-xl border border-[#cce5f0] bg-[#f8fbfd] px-3 py-3 sm:px-4 ${className}`.trim()}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={`font-bold uppercase tracking-wide text-[#006399] ${BUSINESS_HP_TEXT.caption}`}>{copy.title}</p>
          <p className={`mt-1 font-semibold text-slate-900 ${BUSINESS_HP_TEXT.bodyLg}`}>
            {isRejected ? copy.hearing_rejected : (copy[pipeline.stage] || pipeline.stage)}
          </p>
          {pipelineJobTitle ? (
            <p className={`mt-0.5 text-slate-600 ${BUSINESS_HP_TEXT.body}`}>JD: {pipelineJobTitle}</p>
          ) : null}
        </div>
        {onViewApplications ? (
          <button
            type="button"
            onClick={onViewApplications}
            className={`font-semibold text-[#0077B6] hover:underline ${BUSINESS_HP_TEXT.link}`}
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
                className={`rounded-full px-2.5 py-0.5 font-semibold ${BUSINESS_HP_TEXT.caption} ${
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

      <p className={`mt-2 leading-snug text-slate-600 ${BUSINESS_HP_TEXT.body}`}>
        {pipeline.releaseContact ? copy.contactReleased : copy.contactLocked}
      </p>
    </div>
  )
}
