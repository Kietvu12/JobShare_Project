import React from 'react'
import {
  normalizeScoutEducations,
  normalizeScoutWorkExperiences,
  normalizeScoutWorkExperiencesTier2,
  formatScoutExperienceSeniority,
  formatScoutDesiredSalary,
  formatScoutListLocation,
  getScoutSkillTags,
  isScoutEmptyDisplayValue,
} from '../../utils/scoutCandidateDisplay'
import ScoutMatchBadge from './ScoutMatchBadge'

function getDisplayName(candidate) {
  if (!candidate) return 'Ứng viên ẩn danh'
  if (candidate.isUnlocked && candidate.name) return candidate.name
  return candidate.anonymousName || 'Ứng viên ẩn danh'
}

export default function ScoutCandidateHoverTip({ candidate, hl = (text) => text, matchScore = null }) {
  if (!candidate) return null

  const educations = normalizeScoutEducations(candidate.educations)
  const workExperiences = candidate.isUnlocked
    ? normalizeScoutWorkExperiences(candidate.workExperiences)
    : normalizeScoutWorkExperiencesTier2(candidate.workExperiences)
  const skills = getScoutSkillTags(candidate).slice(0, 6)
  const position = candidate.desiredPosition || candidate.jobCategory?.name

  return (
    <div
      className="scout-candidate-hover-tip pointer-events-none absolute left-0 right-0 top-full z-30 mt-1 hidden rounded-xl border border-slate-200 bg-white p-3 shadow-lg ring-1 ring-black/5 group-hover:block"
      role="tooltip"
    >
      <div className="scout-cand-title text-slate-900">{hl(getDisplayName(candidate))}</div>
      {position ? (
        <p className="scout-cand-subtitle mt-0.5 text-slate-600">{hl(position)}</p>
      ) : null}

      {Number.isFinite(Number(matchScore)) ? (
        <div className="mt-2">
          <ScoutMatchBadge score={matchScore} />
        </div>
      ) : null}

      {[['KN', formatScoutExperienceSeniority(candidate.experienceYears)], ['Khu vực', formatScoutListLocation(candidate)], ['Lương', formatScoutDesiredSalary(candidate)]]
        .filter(([, v]) => !isScoutEmptyDisplayValue(v)).length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[['KN', formatScoutExperienceSeniority(candidate.experienceYears)], ['Khu vực', formatScoutListLocation(candidate)], ['Lương', formatScoutDesiredSalary(candidate)]]
            .filter(([, v]) => !isScoutEmptyDisplayValue(v))
            .map(([label, value]) => (
              <span key={label} className="scout-cand-caption rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                {value}
              </span>
            ))}
        </div>
      ) : null}

      {skills.length > 0 ? (
        <div className="mt-2">
          <div className="scout-cand-caption mb-1 font-semibold text-slate-500">Kỹ năng</div>
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
          <div className="scout-cand-caption mb-1 font-semibold text-slate-500">Học vấn</div>
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
            Kinh nghiệm làm việc{candidate.isUnlocked ? '' : ' (ẩn danh)'}
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

      {/* <p className="scout-cand-caption mt-2.5 border-t border-slate-100 pt-2 text-[#0077B6]">
        Bấm để xem chi tiết trong tab mới
      </p> */}
    </div>
  )
}
