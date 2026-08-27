import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ChevronRight, MoreHorizontal, Phone, Mail, Loader2, BadgeCheck, MessageSquare,
  Copy, ArrowLeft, Briefcase, UserPlus, Sparkles, Download,
} from 'lucide-react'
import apiService from '../../services/api'
import BusinessCandidateNominationModal from '../../component/Bussiness/BusinessCandidateNominationModal'
import useBusinessUser from '../../hooks/useBusinessUser'
import useBusinessAppCopy from '../../hooks/useBusinessAppCopy'
import { downloadScoutOriginalCvFiles } from '../../utils/scoutCvDownload'
import { useLanguage } from '../../context/LanguageContext'
import {
  fetchScoutCvBusinessJobMatches,
  getMatchScorePercent,
} from '../../utils/businessJobAiMatching'
import {
  normalizeScoutCertificates,
  normalizeScoutEducations,
  normalizeScoutWorkExperiences,
  getScoutResidenceStatusLabel,
  formatScoutIncome,
  getScoutSkillTags,
  getScoutPrSummary,
  getScoutMatchBadgeClass,
} from '../../utils/scoutCandidateDisplay'
import { getLocalizedCandidateRole } from '../../utils/jobCategoryDisplay'
import {
  formatCandidateAgeGender,
  formatCandidateExperienceYears,
  formatCandidateGender,
  formatCandidateListDate,
  formatCandidateYesNo,
  getLocalizedJobTitle,
  getLocalizedScoutDisplayName,
  getLocalizedScoutPerformanceExploreMeta,
  getLocalizedScoutPerformanceRequestMeta,
  getLocalizedScoutPerformanceRequestStatusLabel,
  getLocalizedScoutPipelineMeta,
  getLocalizedScoutUnlockSourceMeta,
} from '../../i18n/businessAppI18n'

const ANONYMOUS_AVATAR = 'https://api.dicebear.com/7.x/shapes/svg?seed=scout-unlocked'
const BRAND = '#0077B6'
const PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif"

function isScoutPerformanceUnlock(candidate) {
  return candidate?.unlockType === 'scout_performance'
}

const detailPageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  .business-candidates-ui {
    line-height: 1.45;
    color: #334155;
    --cand-gap: 10px;
    --cand-side-col: minmax(240px, 320px);
    --cand-radius: 12px;
    --cand-fs-2xs: 8px;
    --cand-fs-xs: 9px;
    --cand-fs-sm: 10px;
    --cand-fs-md: 11px;
    --cand-fs-lg: 12px;
    --cand-icon: 12px;
    --cand-avatar-list: 28px;
    --cand-avatar-profile: 40px;
  }
  @media (min-width: 1536px) {
    .business-candidates-ui {
      --cand-fs-2xs: 9px;
      --cand-fs-xs: 10px;
      --cand-fs-sm: 11px;
      --cand-fs-md: 12px;
      --cand-fs-lg: 13px;
      --cand-icon: 13px;
      --cand-avatar-list: 32px;
      --cand-avatar-profile: 44px;
    }
  }
  @media (max-height: 900px) and (min-width: 1024px) {
    .business-candidates-ui {
      --cand-fs-2xs: 7px;
      --cand-fs-xs: 8px;
      --cand-fs-sm: 9px;
      --cand-fs-md: 10px;
      --cand-fs-lg: 11px;
      --cand-icon: 11px;
      --cand-avatar-list: 26px;
      --cand-avatar-profile: 36px;
    }
  }
  .business-candidates-ui .cand-fs-2xs { font-size: var(--cand-fs-2xs); line-height: 1.4; }
  .business-candidates-ui .cand-fs-xs { font-size: var(--cand-fs-xs); line-height: 1.45; }
  .business-candidates-ui .cand-fs-sm { font-size: var(--cand-fs-sm); line-height: 1.45; }
  .business-candidates-ui .cand-fs-md { font-size: var(--cand-fs-md); line-height: 1.4; }
  .business-candidates-ui .cand-fs-lg { font-size: var(--cand-fs-lg); line-height: 1.35; }
  .business-candidates-ui .cand-icon {
    width: var(--cand-icon);
    height: var(--cand-icon);
    flex-shrink: 0;
  }
  .business-candidates-detail-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--cand-gap);
    min-height: 0;
  }
  @media (min-width: 1280px) {
    .business-candidates-detail-grid.has-sidebar {
      grid-template-columns: minmax(0, 1fr) var(--cand-side-col);
    }
  }
  .business-candidates-ui .cand-surface {
    border-radius: var(--cand-radius);
    padding: 10px;
  }
  .business-candidates-ui .cand-metrics {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--cand-gap);
  }
  @media (min-width: 1440px) {
    .business-candidates-ui .cand-metrics {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  .candidate-scrollbar::-webkit-scrollbar { width: 4px; }
  .candidate-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .candidate-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .candidate-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  .candidate-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
`

async function loadBusinessJobsByIds(jobIds) {
  const ids = [...new Set((jobIds || []).map((id) => String(id)).filter(Boolean))]
  if (!ids.length) return {}
  const entries = await Promise.all(ids.map(async (id) => {
    try {
      const res = await apiService.getBusinessJobById(id)
      if (res?.success && res.data?.job) return [id, res.data.job]
    } catch {
      /* skip missing job */
    }
    return [id, null]
  }))
  return Object.fromEntries(entries.filter(([, job]) => job))
}

function MatchedJobsRecommendations({
  cvId,
  businessId,
  onAttach,
  attachingJobId,
  attachedJobIds,
  copy,
  language,
}) {
  const mj = copy.detail.matchedJobs
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!cvId || !businessId) {
      setItems([])
      setLoading(false)
      return undefined
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setLoadError('')
      setItems([])
      try {
        const matches = await fetchScoutCvBusinessJobMatches(apiService, cvId, businessId, { top_k: 50 })
        if (cancelled) return

        const ranked = matches
          .map((row) => ({
            jobId: row.job_id ?? row.jobId ?? row.id,
            score: getMatchScorePercent(row),
          }))
          .filter((item) => item.jobId != null && item.score >= 40)
          .sort((a, b) => b.score - a.score)
          .slice(0, 8)

        if (!ranked.length) {
          setItems([])
          return
        }

        const jobById = await loadBusinessJobsByIds(ranked.map((item) => item.jobId))
        if (cancelled) return

        setItems(
          ranked
            .map((item) => ({
              ...item,
              job: jobById[String(item.jobId)] || null,
            }))
            .filter((item) => item.job),
        )
      } catch (e) {
        console.error(e)
        if (!cancelled) {
          setLoadError(mj.loadError)
          setItems([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [cvId, businessId, mj.loadError])

  return (
    <div className="cand-surface border border-slate-200/80 bg-white shadow-sm">
      <div className="mb-2 flex items-center gap-1.5">
        <Sparkles className="cand-icon text-[#0077B6]" aria-hidden />
        <h3 className="cand-fs-sm font-bold text-slate-900">{mj.title}</h3>
      </div>
      <p className="cand-fs-2xs mb-2 text-slate-500">
        {mj.subtitle}
      </p>

      {loading ? (
        <div className="cand-fs-xs flex items-center justify-center gap-1.5 py-4 text-slate-500">
          <Loader2 className="cand-icon animate-spin" />
          {mj.analyzing}
        </div>
      ) : loadError ? (
        <p className="cand-fs-xs py-2 text-amber-700">{loadError}</p>
      ) : items.length === 0 ? (
        <p className="cand-fs-xs py-2 text-slate-400">{mj.empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map(({ jobId, score, job }) => {
            const key = String(jobId)
            const isAttached = attachedJobIds.has(key)
            const isSubmitting = String(attachingJobId) === key
            const title = getLocalizedJobTitle(job, language) || `JD #${jobId}`
            return (
              <li
                key={key}
                className="rounded-lg border border-slate-100 bg-slate-50/80 p-2"
              >
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#e8f4fa] text-[#0077B6]">
                    <Briefcase className="h-3.5 w-3.5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="cand-fs-sm line-clamp-2 font-semibold text-slate-900">{title}</p>
                    {job.jobCode || job.job_code ? (
                      <p className="cand-fs-2xs mt-0.5 text-slate-400">
                        {mj.jobCode(job.jobCode || job.job_code)}
                      </p>
                    ) : null}
                    <span
                      className={`cand-fs-2xs mt-1 inline-flex rounded-full px-1.5 py-0.5 font-semibold ${getScoutMatchBadgeClass(score)}`}
                    >
                      {mj.match(Math.round(score))}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isAttached || isSubmitting}
                  onClick={() => onAttach?.(jobId)}
                  className="cand-fs-xs mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-[#0077B6]/30 bg-white px-2 py-1.5 font-semibold text-[#0077B6] transition-colors hover:bg-[#e8f4fa] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="cand-icon animate-spin" />
                      {mj.adding}
                    </>
                  ) : isAttached ? (
                    mj.added
                  ) : (
                    <>
                      <UserPlus className="cand-icon" />
                      {mj.addToPipeline}
                    </>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function AvatarCircle({ candidate, size, language = 'vi' }) {
  const name = getLocalizedScoutDisplayName({ ...candidate, isUnlocked: true }, language)
  const resolvedSize = size ?? 28
  const src = candidate?.avatarPhotoPath
    ? candidate.avatarPhotoPath
    : `${ANONYMOUS_AVATAR}&seed=${encodeURIComponent(String(name || candidate?.id || 'x'))}`

  return (
    <img
      src={src}
      alt=""
      style={{ width: resolvedSize, height: resolvedSize, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: '#e2e8f0' }}
      onError={(e) => {
        e.currentTarget.src = `${ANONYMOUS_AVATAR}&seed=fallback`
      }}
    />
  )
}

function MetricCard({ label, value, sub }) {
  return (
    <div className="cand-surface border border-slate-200/80 bg-white shadow-sm">
      <p className="cand-fs-xs font-medium text-slate-500">{label}</p>
      <p className="cand-fs-md mt-0.5 font-bold tracking-tight text-slate-900">{value}</p>
      {sub ? <p className="cand-fs-2xs mt-0.5 text-slate-400">{sub}</p> : null}
    </div>
  )
}

function DetailField({ label, value }) {
  if (!value || value === '—') return null
  return (
    <div>
      <p className="cand-fs-xs font-medium text-slate-400">{label}</p>
      <p className="cand-fs-sm mt-0.5 font-medium text-slate-900 [overflow-wrap:anywhere]">{value}</p>
    </div>
  )
}

function SectionCard({ title, children, className = '' }) {
  return (
    <div className={`cand-surface border border-slate-200/80 bg-white shadow-sm ${className}`}>
      {title ? <h3 className="cand-fs-sm mb-2 font-bold text-slate-900">{title}</h3> : null}
      {children}
    </div>
  )
}

function CandidateDetail({ candidate, loading, copy, language }) {
  const d = copy.detail
  const f = d.fields
  const s = d.sections
  const m = d.metrics

  if (loading && !candidate) {
    return (
      <div className="cand-fs-sm cand-surface flex flex-col items-center justify-center border border-slate-200/80 bg-white py-12 text-slate-500 shadow-sm">
        <Loader2 className="cand-icon mb-2 animate-spin" />
        {d.loadingDetail}
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="cand-fs-sm cand-surface flex flex-col items-center justify-center border border-dashed border-slate-200 bg-white py-12 text-slate-500 shadow-sm">
        {d.selectHint}
      </div>
    )
  }

  const source = getLocalizedScoutUnlockSourceMeta(candidate.unlockType, language)
  const pipeline = getLocalizedScoutPipelineMeta(candidate.pipelineStatus, language)
  const skills = getScoutSkillTags(candidate)
  const educations = normalizeScoutEducations(candidate.educations)
  const workExperiences = normalizeScoutWorkExperiences(candidate.workExperiences)
  const certificates = normalizeScoutCertificates(candidate.certificates)
  const perfReq = candidate.performanceRequest
  const perfStatusMeta = perfReq?.status ? getLocalizedScoutPerformanceRequestMeta(perfReq.status, language) : null

  const copyCode = () => {
    if (candidate.code && navigator.clipboard) {
      navigator.clipboard.writeText(String(candidate.code)).catch(() => {})
    }
  }

  const isPerformanceUnlock = isScoutPerformanceUnlock(candidate)

  const overviewMetrics = isPerformanceUnlock
    ? [
        { label: m.approachStatus, value: pipeline.label, sub: m.pipeline },
        {
          label: m.wsRequest,
          value: perfStatusMeta?.label || '—',
          sub: perfReq?.recommendationCount ? m.recommendations(perfReq.recommendationCount) : undefined,
        },
        { label: m.experience, value: formatCandidateExperienceYears(candidate.experienceYears, language), sub: m.overview },
        { label: m.profileUnlock, value: formatCandidateListDate(candidate.unlockedAt, language), sub: source.label },
      ]
    : [
        { label: m.approachStatus, value: pipeline.label, sub: m.pipeline },
        { label: m.creditUsed, value: candidate.creditCost != null ? String(candidate.creditCost) : '—', sub: m.scoutCredit },
        { label: m.experience, value: formatCandidateExperienceYears(candidate.experienceYears, language), sub: m.overview },
        { label: m.profileUnlock, value: formatCandidateListDate(candidate.unlockedAt, language), sub: source.label },
      ]

  return (
    <div className="candidate-scrollbar flex min-h-0 flex-col gap-3 pb-1">
      <div className="cand-surface border border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <AvatarCircle candidate={candidate} size={40} language={language} />
            <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white">
              <BadgeCheck className="h-2 w-2" aria-hidden />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="cand-fs-lg font-bold text-slate-900">{getLocalizedScoutDisplayName({ ...candidate, isUnlocked: true }, language)}</h2>
              <span
                className="cand-fs-xs rounded-full px-1.5 py-0.5 font-semibold"
                style={{ color: pipeline.color, background: pipeline.bg }}
              >
                {pipeline.label}
              </span>
            </div>
            <p className="cand-fs-sm mt-0.5 text-slate-500">
              {getLocalizedCandidateRole(candidate, language)}
            </p>
            <p className="cand-fs-xs mt-0.5 text-slate-400">
              {formatCandidateAgeGender(candidate, language)}
              {candidate.desiredWorkLocation ? ` · ${candidate.desiredWorkLocation}` : ''}
            </p>
            <p className="cand-fs-xs mt-1 font-medium" style={{ color: source.color }}>
              {d.unlockedLine(source.label, formatCandidateListDate(candidate.unlockedAt, language))}
            </p>
          </div>
          <div className="flex shrink-0 items-start gap-1.5">
            <span
              className="cand-fs-xs rounded-full border border-slate-200 px-1.5 py-0.5 font-semibold"
              style={{ color: source.color, background: `${source.color}12` }}
            >
              {source.label}
            </span>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50"
              aria-label={d.moreActions}
            >
              <MoreHorizontal className="cand-icon" />
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between px-0.5">
          <h3 className="cand-fs-sm font-bold text-slate-900">{d.overview}</h3>
        </div>
        <div className="cand-metrics">
          {overviewMetrics.map((m) => (
            <MetricCard key={m.label} label={m.label} value={m.value} sub={m.sub} />
          ))}
        </div>
      </div>

      <div className="cand-surface border border-slate-200/80 bg-white shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <h3 className="cand-fs-sm font-bold text-slate-900">{d.profileInfo}</h3>
            <span className="cand-fs-2xs rounded-full bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">
              {d.unlockedBadge}
            </span>
          </div>
          {candidate.code ? (
            <button
              type="button"
              onClick={copyCode}
              className="cand-fs-xs inline-flex items-center gap-1 font-medium text-slate-500 hover:text-slate-800"
            >
              {d.cvCode(candidate.code)}
              <Copy className="cand-icon" />
            </button>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField label={f.email} value={candidate.email} />
          <DetailField label={f.phone} value={candidate.phone} />
          <DetailField label={f.furigana} value={candidate.furigana} />
          <DetailField label={f.birthDate} value={formatCandidateListDate(candidate.birthDate, language)} />
          <DetailField label={f.gender} value={formatCandidateGender(candidate.gender, language)} />
          <DetailField label={f.desiredLocation} value={candidate.desiredWorkLocation} />
          <DetailField label={f.experience} value={formatCandidateExperienceYears(candidate.experienceYears, language)} />
          <DetailField label={f.desiredPosition} value={getLocalizedCandidateRole(candidate, language)} />
          <DetailField label={f.desiredSalary} value={candidate.desiredIncome} />
          <DetailField
            label={f.jlptLanguages}
            value={[candidate.jlptLevel, candidate.jpConversationLevel, candidate.enConversationLevel].filter(Boolean).join(' · ') || null}
          />
        </div>
      </div>

      {getScoutPrSummary(candidate) && (
        <SectionCard title={s.pr}>
          <p className="cand-fs-sm whitespace-pre-wrap leading-relaxed text-slate-600">
            {getScoutPrSummary(candidate)}
          </p>
        </SectionCard>
      )}

      {skills.length > 0 && (
        <SectionCard title={s.skills}>
          <p className="cand-fs-sm leading-relaxed text-slate-600">
            {skills.join(' · ')}
          </p>
        </SectionCard>
      )}

      {educations.length > 0 && (
        <SectionCard title={s.education}>
          <ul className="flex flex-col gap-2">
            {educations.map((edu, i) => (
              <li key={i} className="cand-fs-sm border-l-2 border-slate-200 pl-2 text-slate-600">
                <span className="font-semibold text-slate-900">{edu.period}</span>
                {' — '}
                {edu.content}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {workExperiences.length > 0 && (
        <SectionCard title={s.workHistory}>
          <div className="flex flex-col gap-2">
            {workExperiences.map((work, i) => (
              <div key={i} className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                <div className="cand-fs-sm font-bold text-slate-900">{work.companyName}</div>
                <div className="cand-fs-xs mt-0.5 text-slate-500">{work.period}</div>
                {work.description !== '—' && (
                  <div className="cand-fs-sm mt-1 whitespace-pre-wrap leading-relaxed text-slate-600">
                    {work.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {certificates.length > 0 && (
        <SectionCard title={s.certificates}>
          <div className="flex flex-wrap gap-1.5">
            {certificates.map((cert, i) => (
              <div key={i} className="cand-fs-xs rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-slate-600">
                {cert.name}{cert.year ? ` (${cert.year})` : ''}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {(candidate.jpResidenceStatus || candidate.visaExpirationDate || candidate.currentResidence) && (
        <SectionCard title={s.visaResidence}>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailField label={f.residenceStatus} value={getScoutResidenceStatusLabel(candidate.jpResidenceStatus)} />
            <DetailField label={f.visaExpiry} value={formatCandidateListDate(candidate.visaExpirationDate, language)} />
            <DetailField label={f.currentResidence} value={candidate.currentResidence} />
            <DetailField label={f.passport} value={formatCandidateYesNo(candidate.passport, language)} />
          </div>
        </SectionCard>
      )}

      {(candidate.currentIncome != null || candidate.desiredIncome != null) && (
        <SectionCard title={s.salary}>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailField label={f.currentSalary} value={formatScoutIncome(candidate.currentIncome)} />
            <DetailField label={f.desiredSalarySection} value={formatScoutIncome(candidate.desiredIncome)} />
          </div>
        </SectionCard>
      )}

      {candidate.motivation && (
        <SectionCard title={s.motivation}>
          <p className="cand-fs-sm whitespace-pre-wrap leading-relaxed text-slate-600">{candidate.motivation}</p>
        </SectionCard>
      )}
    </div>
  )
}

function CandidateSidebar({
  candidate,
  businessId,
  exploreSubmitting,
  onExploreStatus,
  onOpenNomination,
  onAttachToJob,
  attachingJobId,
  attachedJobIds,
  onDownloadOriginalCv,
  downloadingCv,
  copy,
  language,
}) {
  if (!candidate) {
    return null
  }

  const sb = copy.detail.sidebar
  const tl = copy.detail.timeline
  const pipeline = getLocalizedScoutPipelineMeta(candidate.pipelineStatus, language)
  const source = getLocalizedScoutUnlockSourceMeta(candidate.unlockType, language)
  const isPerformanceUnlock = isScoutPerformanceUnlock(candidate)
  const perfReq = candidate.performanceRequest
  const perfStatusMeta = perfReq?.status ? getLocalizedScoutPerformanceRequestMeta(perfReq.status, language) : null
  const exploreMeta = perfReq?.businessExploreStatus
    ? getLocalizedScoutPerformanceExploreMeta(perfReq.businessExploreStatus, language)
    : null
  const canSetExplore = perfReq?.status === 'approved' && !perfReq?.businessExploreStatus

  const timeline = [
    {
      date: formatCandidateListDate(candidate.unlockedAt, language),
      action: tl.unlockProfile(source.label),
    },
    ...(candidate.savedAt && candidate.savedAt !== candidate.unlockedAt
      ? [{ date: formatCandidateListDate(candidate.savedAt, language), action: tl.addToCandidates }]
      : []),
    ...(perfReq?.requestedAt
      ? [{
        date: formatCandidateListDate(perfReq.requestedAt, language),
        action: tl.perfRequest(getLocalizedScoutPerformanceRequestStatusLabel(perfReq.status, language)),
      }]
      : []),
    ...(perfReq?.handledAt
      ? [{ date: formatCandidateListDate(perfReq.handledAt, language), action: tl.wsHandled }]
      : []),
    ...(perfReq?.businessExploreStatus === 'interested'
      ? [{ date: '—', action: tl.businessInterested }]
      : []),
    ...(perfReq?.wantsSimilarCandidates
      ? [{ date: '—', action: tl.findingSimilar }]
      : []),
  ]

  return (
    <div className="candidate-scrollbar flex min-h-0 flex-col gap-3">
      {isPerformanceUnlock && (
        <div className="cand-surface border border-violet-100 bg-white shadow-sm">
          <h3 className="cand-fs-sm mb-2 font-bold text-slate-900">{sb.perfWsTitle}</h3>
          {!perfReq ? (
            <p className="cand-fs-xs text-slate-400">
              {sb.noPerfRequest}
            </p>
          ) : (
            <>
              {perfStatusMeta && (
                <div
                  className="cand-fs-xs mb-1.5 w-full rounded border border-slate-200 px-1.5 py-1 font-semibold"
                  style={{ color: perfStatusMeta.color, background: perfStatusMeta.bg }}
                >
                  {sb.requestLabel}: {perfStatusMeta.label}
                  {perfReq.recommendationCount > 0 ? ` · ${sb.recommendationsSuffix(perfReq.recommendationCount)}` : ''}
                </div>
              )}
              {exploreMeta ? (
                <div
                  className="cand-fs-xs mb-1.5 w-full rounded border border-slate-200 px-1.5 py-1 font-semibold"
                  style={{ color: exploreMeta.color, background: exploreMeta.bg }}
                >
                  {sb.workingWithWs}: {exploreMeta.label}
                </div>
              ) : perfReq.wantsSimilarCandidates ? (
                <div className="cand-fs-2xs mb-1.5 font-semibold text-violet-600">
                  {sb.findingSimilar}
                </div>
              ) : perfReq.status === 'pending' ? (
                <div className="cand-fs-2xs mb-1.5 text-amber-600">
                  {sb.reviewingRequest}
                </div>
              ) : null}
              {canSetExplore && (
                <div className="mb-1.5">
                  <p className="cand-fs-2xs mb-1.5 text-slate-600">
                    {sb.explorePrompt}
                  </p>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      disabled={exploreSubmitting}
                      onClick={() => onExploreStatus?.(perfReq.id, 'interested')}
                      className="cand-fs-xs w-full rounded bg-indigo-600 px-2 py-1.5 font-semibold text-white disabled:opacity-70"
                    >
                      {sb.exploreYes}
                    </button>
                    <button
                      type="button"
                      disabled={exploreSubmitting}
                      onClick={() => onExploreStatus?.(perfReq.id, 'declined')}
                      className="cand-fs-xs w-full rounded border border-slate-200 bg-slate-50 px-2 py-1.5 font-semibold text-slate-600 disabled:opacity-70"
                    >
                      {sb.exploreNo}
                    </button>
                  </div>
                </div>
              )}
              <Link
                to={perfReq.id ? `/business/scout/managed?performanceRequestId=${perfReq.id}` : '/business/scout/managed'}
                className="cand-fs-2xs mb-1 flex items-center justify-between font-semibold text-[#0077B6]"
              >
                {sb.viewOnScout}
                <ChevronRight className="cand-icon" />
              </Link>
              <Link
                to="/business/messages?tab=ws"
                className="cand-fs-2xs flex items-center gap-1 font-semibold text-violet-600"
              >
                <MessageSquare className="cand-icon" />
                {sb.chatWithWs}
              </Link>
            </>
          )}
        </div>
      )}

      <div className="cand-surface border border-slate-200/80 bg-white shadow-sm">
        <h3 className="cand-fs-sm mb-2 font-bold text-slate-900">
          {isPerformanceUnlock ? sb.approachTitle : sb.statusTitle}
        </h3>
        <div
          className="cand-fs-sm mb-1 w-full rounded-md border border-slate-200 px-2 py-1 font-semibold"
          style={{ color: pipeline.color, background: pipeline.bg }}
        >
          {pipeline.label}
        </div>
        <p className="cand-fs-xs text-slate-400">
          {isPerformanceUnlock ? sb.perfFeeNote : sb.creditCostNote(candidate.creditCost)}
        </p>
      </div>

      <div className="cand-surface border border-slate-200/80 bg-white shadow-sm">
        <h3 className="cand-fs-sm mb-2 font-bold text-slate-900">{sb.activity}</h3>
        <div className="flex flex-col gap-1.5">
          {timeline.map((item, i) => (
            <div key={i} className="flex gap-2">
              <div
                className="cand-fs-2xs flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-bold text-white"
                style={{ background: BRAND }}
              >
                ●
              </div>
              <div className="min-w-0 flex-1">
                <div className="cand-fs-sm font-medium text-slate-700">{item.action}</div>
                <div className="cand-fs-xs mt-0.5 text-slate-400">{item.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!isPerformanceUnlock && (
      <div className="cand-surface border border-slate-200/80 bg-white shadow-sm">
        <button
          type="button"
          onClick={onOpenNomination}
          className="cand-fs-sm flex w-full items-center justify-center gap-1 rounded-lg py-2 font-semibold text-white"
          style={{ background: BRAND }}
        >
          <UserPlus className="cand-icon" />
          {copy.list.nomination?.createNomination || sb.createNomination || 'Tạo tiến cử'}
        </button>
      </div>
      )}

      {!isPerformanceUnlock && (
      <div className="cand-surface border border-slate-200/80 bg-white shadow-sm">
        {candidate.phone ? (
          <a
            href={`tel:${candidate.phone}`}
            className="cand-fs-sm mb-1 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 font-semibold text-white"
            style={{ background: BRAND }}
          >
            <Phone className="cand-icon" />
            {sb.callPhone(candidate.phone)}
          </a>
        ) : (
          <button type="button" disabled className="cand-fs-sm mb-1 w-full rounded-lg bg-slate-100 py-1.5 font-semibold text-slate-400">
            {sb.noPhone}
          </button>
        )}
        {candidate.email ? (
          <a
            href={`mailto:${candidate.email}`}
            className="cand-fs-sm mb-1 flex w-full items-center justify-center gap-1 rounded-lg border py-1.5 font-semibold"
            style={{ borderColor: BRAND, color: BRAND }}
          >
            <Mail className="cand-icon" />
            {sb.email}
          </a>
        ) : (
          <button type="button" disabled className="cand-fs-sm mb-1 w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 font-semibold text-slate-400">
            {sb.noEmail}
          </button>
        )}
        <button
          type="button"
          onClick={onDownloadOriginalCv}
          disabled={downloadingCv}
          className="cand-fs-sm mt-1 flex w-full items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 py-1.5 font-semibold text-emerald-700 disabled:opacity-60"
        >
          {downloadingCv ? (
            <Loader2 className="cand-icon animate-spin" />
          ) : (
            <Download className="cand-icon" />
          )}
          {downloadingCv ? 'Đang tải...' : 'Tải CV gốc'}
        </button>
      </div>
      )}

      {businessId && candidate?.id ? (
        <MatchedJobsRecommendations
          cvId={candidate.id}
          businessId={businessId}
          onAttach={onAttachToJob}
          attachingJobId={attachingJobId}
          attachedJobIds={attachedJobIds}
          copy={copy}
          language={language}
        />
      ) : null}

      <div className="cand-surface border border-slate-200/80 bg-white shadow-sm">
        <Link
          to="/business/scout/direct"
          className="cand-fs-sm flex items-center justify-between font-semibold hover:opacity-80"
          style={{ color: BRAND }}
        >
          {sb.findMoreOnScout}
          <ChevronRight className="cand-icon" />
        </Link>
      </div>
    </div>
  )
}

export default function BusinessUnlockedCandidateDetail() {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useBusinessUser()
  const { language } = useLanguage()
  const copy = useBusinessAppCopy()
  const candidateCopy = copy.candidates
  const d = candidateCopy.detail

  const numericCandidateId = parseInt(candidateId, 10)

  const [candidate, setCandidate] = useState(null)
  const [candidateLoading, setCandidateLoading] = useState(true)
  const [error, setError] = useState('')
  const [exploreSubmitting, setExploreSubmitting] = useState(false)
  const [attachingJobId, setAttachingJobId] = useState(null)
  const [downloadingCv, setDownloadingCv] = useState(false)
  const [attachedJobIds, setAttachedJobIds] = useState(() => new Set())
  const [nominationModalOpen, setNominationModalOpen] = useState(false)
  const candidateLoadSeqRef = useRef(0)

  const backToListUrl = useMemo(() => {
    const params = new URLSearchParams()
    const list = searchParams.get('list')
    const search = searchParams.get('search')
    if (list && list !== 'all') params.set('list', list)
    if (search) params.set('search', search)
    const qs = params.toString()
    return `/business/candidates${qs ? `?${qs}` : ''}`
  }, [searchParams])

  const patchPerformanceExplore = useCallback((cvId, requestId, action) => {
    setCandidate((prev) => {
      if (!prev || prev.id !== cvId) return prev
      return {
        ...prev,
        performanceRequest: {
          ...(prev.performanceRequest || {}),
          id: requestId,
          businessExploreStatus: action,
        },
      }
    })
  }, [])

  const handlePerformanceExplore = useCallback(async (requestId, action) => {
    if (!requestId) return
    setExploreSubmitting(true)
    try {
      const res = await apiService.setBusinessScoutPerformanceExplore(requestId, action)
      if (res?.success && numericCandidateId) {
        patchPerformanceExplore(numericCandidateId, requestId, action)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setExploreSubmitting(false)
    }
  }, [patchPerformanceExplore, numericCandidateId])

  const handleAttachToJob = useCallback(async (jobId) => {
    if (!candidate?.id || !jobId) return
    setAttachingJobId(jobId)
    try {
      const res = await apiService.nominateBusinessCandidate(candidate.id, { jobId })
      if (res?.success) {
        if (res.data?.alreadyExists) {
          window.alert(candidateCopy.list.nomination?.alreadyExists || d.attachError)
        }
        setAttachedJobIds((prev) => new Set([...prev, String(jobId)]))
      } else {
        window.alert(res?.message || d.attachError)
      }
    } catch (e) {
      console.error(e)
      window.alert(e?.message || d.attachError)
    } finally {
      setAttachingJobId(null)
    }
  }, [candidate?.id, candidateCopy.list.nomination?.alreadyExists, d.attachError])

  const handleNominationSuccess = useCallback((data) => {
    const jobId = data?.job?.id ?? data?.application?.jobId
    if (jobId != null) {
      setAttachedJobIds((prev) => new Set([...prev, String(jobId)]))
    }
  }, [])

  const handleDownloadOriginalCv = useCallback(async () => {
    if (!candidate?.id || downloadingCv || isScoutPerformanceUnlock(candidate)) return
    setDownloadingCv(true)
    try {
      await downloadScoutOriginalCvFiles(apiService, candidate.id)
    } catch (e) {
      if (e?.code === 'NO_ORIGINAL_CV' || e?.message === 'NO_ORIGINAL_CV') {
        window.alert('Hồ sơ này chưa có file CV gốc để tải.')
      } else {
        window.alert(e?.message || 'Không thể tải CV gốc. Vui lòng thử lại.')
      }
    } finally {
      setDownloadingCv(false)
    }
  }, [candidate, downloadingCv])

  useEffect(() => {
    if (!numericCandidateId || Number.isNaN(numericCandidateId)) {
      setError(d.invalidId)
      setCandidate(null)
      setCandidateLoading(false)
      return undefined
    }

    const loadSeq = ++candidateLoadSeqRef.current

    const loadDetail = async () => {
      setCandidateLoading(true)
      setError('')
      try {
        const res = await apiService.getBusinessScoutUnlockedCandidateById(numericCandidateId)
        if (loadSeq !== candidateLoadSeqRef.current) return
        if (res?.success && res.data?.candidate) {
          setCandidate(res.data.candidate)
        } else {
          setCandidate(null)
          setError(res?.message || d.notFound)
        }
      } catch (e) {
        if (loadSeq !== candidateLoadSeqRef.current) return
        console.error(e)
        setCandidate(null)
        setError(d.loadError)
      } finally {
        if (loadSeq === candidateLoadSeqRef.current) setCandidateLoading(false)
      }
    }

    loadDetail()
    return undefined
  }, [numericCandidateId, d.invalidId, d.notFound, d.loadError])

  useEffect(() => {
    if (!candidate?.id) return undefined
    let cancelled = false
    apiService.getBusinessCandidateNominationJobs(candidate.id)
      .then((res) => {
        if (cancelled || !res?.success) return
        const ids = (res.data?.jobs || [])
          .filter((job) => job.existingApplicationId)
          .map((job) => String(job.id))
        if (ids.length) setAttachedJobIds(new Set(ids))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [candidate?.id])

  return (
    <>
      <style>{detailPageStyles}</style>
      <div
        className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#f4f6f8]"
        style={{ fontFamily: PAGE_FONT }}
      >
        <div className="w-full shrink-0 border-b border-slate-200/80 bg-white px-3 py-2.5 sm:px-4">
          <button
            type="button"
            onClick={() => navigate(backToListUrl)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {d.backToList}
          </button>
        </div>

        <div className="candidate-scrollbar min-h-0 flex-1 overflow-y-auto p-2 lg:p-3">
          <div className="business-candidates-ui w-full">
            {error && !candidateLoading && !candidate ? (
              <div className="cand-surface flex flex-col items-center justify-center border border-slate-200/80 bg-white px-6 py-12 text-center shadow-sm">
                <p className="cand-fs-sm font-semibold text-slate-800">
                  {error || d.notFound}
                </p>
                <button
                  type="button"
                  onClick={() => navigate(backToListUrl)}
                  className="cand-fs-sm mt-4 rounded-lg px-4 py-2 font-semibold text-white hover:opacity-95"
                  style={{ background: BRAND }}
                >
                  {d.backToList}
                </button>
              </div>
            ) : (
              <div className="business-candidates-detail-grid has-sidebar">
                <CandidateDetail
                  candidate={candidate}
                  loading={candidateLoading}
                  copy={candidateCopy}
                  language={language}
                />
                {candidate ? (
                  <CandidateSidebar
                    candidate={candidate}
                    businessId={user?.id}
                    exploreSubmitting={exploreSubmitting}
                    onExploreStatus={handlePerformanceExplore}
                    onOpenNomination={() => setNominationModalOpen(true)}
                    onAttachToJob={handleAttachToJob}
                    attachingJobId={attachingJobId}
                    attachedJobIds={attachedJobIds}
                    onDownloadOriginalCv={handleDownloadOriginalCv}
                    downloadingCv={downloadingCv}
                    copy={candidateCopy}
                    language={language}
                  />
                ) : candidateLoading ? (
                  <div className="cand-surface hidden border border-slate-200/80 bg-white p-3 shadow-sm xl:block">
                    <div className="cand-fs-xs flex items-center gap-1.5 text-slate-400">
                      <Loader2 className="cand-icon animate-spin" />
                      {copy.common.loading}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
      {candidate ? (
        <BusinessCandidateNominationModal
          open={nominationModalOpen}
          onClose={() => setNominationModalOpen(false)}
          cvId={candidate.id}
          candidateName={getLocalizedScoutDisplayName(candidate, language)}
          copy={candidateCopy.list}
          language={language}
          onSuccess={handleNominationSuccess}
        />
      ) : null}
    </>
  )
}
