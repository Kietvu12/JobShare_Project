import React, { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Loader2, Sparkles, AlertTriangle } from 'lucide-react'
import { getLocalizedJobTitle } from '../../i18n/businessAppI18n'
import { getScoutMatchBadgeClass } from '../../utils/scoutCandidateDisplay'
import { fetchAiMatchV3Reason } from '../../utils/businessJobAiMatching'
import apiService from '../../services/api'

function formatJobLocation(job) {
  return (
    job?.interviewLocation
    || job?.interview_location
    || job?.workLocation
    || job?.work_location
    || null
  )
}

function formatJobSalary(job) {
  const min = job?.salaryMin ?? job?.salary_min
  const max = job?.salaryMax ?? job?.salary_max
  const currency = job?.salaryCurrency || job?.salary_currency || 'JPY'
  if (min != null && max != null) return `${min} – ${max} ${currency}`
  if (min != null) return `Từ ${min} ${currency}`
  if (max != null) return `Đến ${max} ${currency}`
  return job?.salaryDisplay || job?.salary_display || null
}

function formatJobExperience(job) {
  return (
    job?.categoryExperience
    || job?.category_experience
    || job?.experienceRequirement
    || job?.experience_requirement
    || null
  )
}

function formatJobJlpt(job) {
  return (
    job?.japaneseLevel
    || job?.japanese_level
    || job?.jlptRequirement
    || job?.jlpt_requirement
    || null
  )
}

function buildAttachWarnings(candidate, score, copy) {
  const warnings = []
  const w = copy?.warnings || {}
  if (Number.isFinite(score) && score < 50) {
    warnings.push(w.lowMatch || 'Match thấp. Hãy xem xét kỹ trước khi đưa vào tuyển chọn.')
  }
  if (!candidate?.email && !candidate?.phone) {
    warnings.push(w.missingContact || 'Thiếu email và số điện thoại trên hồ sơ.')
  }
  if (!candidate?.jlptLevel && !candidate?.experienceYears) {
    warnings.push(w.incompleteProfile || 'Hồ sơ thiếu JLPT hoặc kinh nghiệm — khó đối chiếu yêu cầu JD.')
  }
  return warnings
}

export default function BusinessCandidateAttachJobConfirmModal({
  open,
  onClose,
  job,
  jobId,
  score,
  candidate,
  cvId,
  language = 'vi',
  copy,
  submitting = false,
  onConfirm,
}) {
  const [reasonLoading, setReasonLoading] = useState(false)
  const [aiReason, setAiReason] = useState('')

  const fields = copy?.fields || {}
  const title = getLocalizedJobTitle(job, language) || (jobId ? `JD #${jobId}` : '')
  const warnings = useMemo(
    () => buildAttachWarnings(candidate, score, copy),
    [candidate, score, copy],
  )

  useEffect(() => {
    if (!open || !jobId || !cvId) {
      setAiReason('')
      return undefined
    }
    let cancelled = false
    setReasonLoading(true)
    fetchAiMatchV3Reason(apiService, { jobId, cvId, lang: language })
      .then((reason) => {
        if (!cancelled) setAiReason(reason || '')
      })
      .catch(() => {
        if (!cancelled) setAiReason('')
      })
      .finally(() => {
        if (!cancelled) setReasonLoading(false)
      })
    return () => { cancelled = true }
  }, [open, jobId, cvId, language])

  if (!open || !job) return null

  const requirementLines = [
    job?.requirementsSummary,
    job?.mustHaveSkills,
    job?.requiredSkills,
  ].filter(Boolean).map(String)

  const jobDetailUrl = `/business/jobs/${job.id}`

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/45" aria-label="Đóng" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[min(92vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-900">{copy?.title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{copy?.subtitle}</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">{title}</p>
              {job.jobCode || job.job_code ? (
                <p className="mt-0.5 text-[10px] text-slate-400">Mã: {job.jobCode || job.job_code}</p>
              ) : null}
            </div>
            {Number.isFinite(Number(score)) ? (
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${getScoutMatchBadgeClass(score)}`}>
                {copy?.matchLabel ? copy.matchLabel(Math.round(score)) : `${Math.round(score)}% match`}
              </span>
            ) : null}
          </div>

          <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            {formatJobLocation(job) ? (
              <div>
                <dt className="font-medium text-slate-400">{fields.location || 'Địa điểm'}</dt>
                <dd className="mt-0.5 font-medium text-slate-800">{formatJobLocation(job)}</dd>
              </div>
            ) : null}
            {formatJobSalary(job) ? (
              <div>
                <dt className="font-medium text-slate-400">{fields.salary || 'Mức lương'}</dt>
                <dd className="mt-0.5 font-medium text-slate-800">{formatJobSalary(job)}</dd>
              </div>
            ) : null}
            {formatJobExperience(job) ? (
              <div>
                <dt className="font-medium text-slate-400">{fields.experience || 'Kinh nghiệm'}</dt>
                <dd className="mt-0.5 font-medium text-slate-800">{formatJobExperience(job)}</dd>
              </div>
            ) : null}
            {formatJobJlpt(job) ? (
              <div>
                <dt className="font-medium text-slate-400">{fields.jlpt || 'JLPT'}</dt>
                <dd className="mt-0.5 font-medium text-slate-800">{formatJobJlpt(job)}</dd>
              </div>
            ) : null}
          </dl>

          {requirementLines.length > 0 ? (
            <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 p-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {fields.requirements || 'Điều kiện bắt buộc'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                {requirementLines.join('\n')}
              </p>
            </div>
          ) : null}

          {warnings.length > 0 ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
              <p className="flex items-center gap-1 text-xs font-semibold text-amber-900">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {copy?.warningsTitle}
              </p>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-amber-900">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-3 rounded-lg border border-[#0077B6]/15 bg-[#f8fbfd] p-2.5">
            <p className="flex items-center gap-1 text-xs font-semibold text-[#0077B6]">
              <Sparkles className="h-3.5 w-3.5" />
              {copy?.aiReasonTitle}
            </p>
            {reasonLoading ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {copy?.aiReasonLoading}
              </p>
            ) : aiReason ? (
              <p className="mt-1.5 text-xs leading-relaxed text-slate-700">{aiReason}</p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-500">
                {copy?.aiReasonFallback
                  ? copy.aiReasonFallback(Math.round(score || 0))
                  : `Phù hợp khoảng ${Math.round(score || 0)}% theo AI matching.`}
              </p>
            )}
          </div>

          <a
            href={jobDetailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0077B6] hover:underline"
          >
            {copy?.viewJobDetail}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="flex gap-2 border-t border-slate-100 bg-slate-50/80 px-4 py-3">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {copy?.cancel}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-[#0077B6] py-2 text-xs font-bold text-white hover:bg-[#006699] disabled:opacity-50"
          >
            {submitting ? (
              <span className="inline-flex items-center justify-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {copy?.submitting}
              </span>
            ) : (
              copy?.confirm
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
