import React, { useMemo } from 'react'
import {
  normalizeScoutEducations,
  normalizeScoutWorkExperiences,
  normalizeScoutWorkExperiencesTier2,
  formatScoutDesiredSalary,
  formatScoutListLocation,
  getScoutSkillTags,
  isScoutEmptyDisplayValue,
} from '../../utils/scoutCandidateDisplay'
import {
  formatScoutExperienceSeniorityLocalized,
  getLocalizedScoutDisplayName,
  getScoutHoverTipCopy,
} from '../../i18n/businessAppI18n'
import { getLocalizedCandidateRole } from '../../utils/jobCategoryDisplay'
import ScoutMatchBadge from './ScoutMatchBadge'

export default function ScoutCandidateHoverTip({
  candidate,
  hl = (text) => text,
  matchScore = null,
  language = 'vi',
}) {
  const tip = useMemo(() => getScoutHoverTipCopy(language), [language])

  if (!candidate) return null

  const educations = normalizeScoutEducations(candidate.educations)
  const workExperiences = candidate.isUnlocked
    ? normalizeScoutWorkExperiences(candidate.workExperiences)
    : normalizeScoutWorkExperiencesTier2(candidate.workExperiences)
  const skills = getScoutSkillTags(candidate).slice(0, 6)
  const position = getLocalizedCandidateRole(candidate, language)
  const exp = formatScoutExperienceSeniorityLocalized(candidate.experienceYears, language)
  const location = formatScoutListLocation(candidate)
  const salary = formatScoutDesiredSalary(candidate)
  const metaChips = [
    exp,
    location,
    salary,
  ].filter((v) => !isScoutEmptyDisplayValue(v))

  return (
    <div
      className="scout-candidate-hover-tip pointer-events-none absolute left-0 right-0 top-full z-30 mt-1 hidden rounded-xl border border-slate-200 bg-white p-3 shadow-lg ring-1 ring-black/5 group-hover:block"
      role="tooltip"
    >
      <div className="scout-cand-title text-slate-900">{hl(getLocalizedScoutDisplayName(candidate, language))}</div>
      {position ? (
        <p className="scout-cand-subtitle mt-0.5 text-slate-600">{hl(position)}</p>
      ) : null}

      {Number.isFinite(Number(matchScore)) ? (
        <div className="mt-2">
          <ScoutMatchBadge score={matchScore} language={language} />
        </div>
      ) : null}

      {metaChips.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {metaChips.map((value) => (
            <span key={value} className="scout-cand-caption rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
              {value}
            </span>
          ))}
        </div>
      ) : null}

      {skills.length > 0 ? (
        <div className="mt-2">
          <div className="scout-cand-caption mb-1 font-semibold text-slate-500">{tip.skills}</div>
          <div className="flex flex-wrap gap-1">
            {skills.map((skill) => (
              <span key={skill} className="scout-cand-caption rounded bg-[#e8f4fa] px-1.5 py-0.5 text-[#0077B6]">
                {hl(skill)}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {educations.length > 0 ? (
        <div className="mt-2.5 border-t border-slate-100 pt-2">
          <div className="scout-cand-caption mb-1 font-semibold text-slate-500">{tip.education}</div>
          <ul className="space-y-1">
            {educations.slice(0, 3).map((edu, i) => (
              <li key={i} className="scout-cand-caption text-slate-600">
                <span className="font-semibold text-slate-700">{hl(edu.period)}</span>
                {' — '}
                {hl(edu.content)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {workExperiences.length > 0 ? (
        <div className="mt-2.5 border-t border-slate-100 pt-2">
          <div className="scout-cand-caption mb-1 font-semibold text-slate-500">
            {tip.workExperience}
            {!candidate.isUnlocked ? tip.workExperienceAnonymous : ''}
          </div>
          <ul className="space-y-1.5">
            {workExperiences.slice(0, 3).map((work, i) => (
              <li key={i} className="scout-cand-caption rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 text-slate-600">
                {candidate.isUnlocked ? (
                  <>
                    <div className="font-semibold text-slate-800">{hl(work.companyName)}</div>
                    <div className="text-slate-500">{hl(work.period)}</div>
                    {work.description && work.description !== '—' ? (
                      <div className="mt-0.5 line-clamp-2">{hl(work.description)}</div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <div className="font-semibold text-slate-800">{hl(work.role)}</div>
                    <div className="text-slate-500">{hl(work.companyTypeLabel)} · {hl(work.period)}</div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
