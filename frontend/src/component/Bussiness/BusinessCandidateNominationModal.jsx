import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import apiService from '../../services/api'
import FilterSelectDropdown from '../Shared/FilterSelectDropdown'
import { getLocalizedJobTitle } from '../../i18n/businessAppI18n'

export default function BusinessCandidateNominationModal({
  open,
  onClose,
  cvId,
  candidateName,
  copy,
  language = 'vi',
  onSuccess,
}) {
  const navigate = useNavigate()
  const n = copy?.nomination || {}
  const [jobs, setJobs] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [jobId, setJobId] = useState('')
  const [note, setNote] = useState('')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!open || !cvId) return undefined
    let cancelled = false
    setJobId('')
    setNote('')
    setLoadError('')
    setLoadingJobs(true)
    apiService.getBusinessCandidateNominationJobs(cvId)
      .then((res) => {
        if (cancelled) return
        if (res?.success) {
          setJobs(res.data?.jobs || [])
        } else {
          setJobs([])
          setLoadError(res?.message || n.loadError || 'Không tải được danh sách JD')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setJobs([])
          setLoadError(n.loadError || 'Không tải được danh sách JD')
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingJobs(false)
      })
    return () => { cancelled = true }
  }, [open, cvId, n.loadError])

  const jobOptions = useMemo(() => jobs.map((job) => {
    const title = getLocalizedJobTitle(job, language) || job.title || `JD #${job.id}`
    const code = job.jobCode ? ` · ${job.jobCode}` : ''
    const badge = job.onMarketplace
      ? (n.onMarketplaceBadge || 'Đã lên sàn')
      : (job.listingStatusLabel
        ? `${n.notOnMarketplaceBadge || 'Chưa lên sàn'} (${job.listingStatusLabel})`
        : (n.notOnMarketplaceBadge || 'Chưa lên sàn'))
    return {
      value: String(job.id),
      label: `${title}${code} — ${badge}`,
      job,
    }
  }), [jobs, language, n.onMarketplaceBadge, n.notOnMarketplaceBadge])

  const selectedJob = useMemo(
    () => jobs.find((job) => String(job.id) === String(jobId)) || null,
    [jobs, jobId],
  )

  const handleSubmit = async () => {
    if (!cvId || !jobId || submitting) return
    const job = selectedJob
    if (!job?.onMarketplace) {
      const title = getLocalizedJobTitle(job, language) || job?.title || 'JD'
      window.alert(
        typeof n.jobNotOnMarketplace === 'function'
          ? n.jobNotOnMarketplace(title, job?.listingStatusLabel)
          : `JD "${title}" chưa được đưa lên Sàn CTV. Vui lòng đăng job lên sàn trước khi tiến cử.`,
      )
      return
    }
    if (job.existingApplicationId) {
      window.alert(n.alreadyExists || 'Ứng viên đã có đơn tiến cử cho JD này')
      return
    }

    setSubmitting(true)
    try {
      const res = await apiService.nominateBusinessCandidate(cvId, { jobId, note })
      if (res?.success) {
        onSuccess?.(res.data)
        window.alert(res.message || n.success || 'Đã tạo đơn tiến cử')
        onClose?.()
      } else {
        window.alert(res?.message || n.submitError || 'Không thể tạo tiến cử')
      }
    } catch (e) {
      window.alert(e?.message || n.submitError || 'Không thể tạo tiến cử')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold text-slate-900">{n.title || 'Tạo tiến cử'}</h3>
        <p className="mt-1 text-xs text-slate-500">
          {candidateName
            ? `${n.candidatePrefix || 'Ứng viên'}: ${candidateName}`
            : (n.subtitle || 'Chọn JD đã đăng trên Sàn CTV')}
        </p>

        {loadingJobs ? (
          <div className="mt-4 flex items-center justify-center gap-2 py-6 text-xs text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {n.loadingJobs || 'Đang tải danh sách JD...'}
          </div>
        ) : loadError ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{loadError}</p>
        ) : (
          <>
            <label className="mt-4 block">
              <span className="text-xs font-semibold text-slate-600">{n.selectJob || 'Chọn JD'} *</span>
              <FilterSelectDropdown
                value={jobId}
                onChange={setJobId}
                options={jobOptions}
                placeholder={n.selectJobPlaceholder || 'Chọn job để tiến cử'}
                searchable
                searchPlaceholder={n.searchJobPlaceholder || 'Tìm JD...'}
                optionSize="comfortable"
                maxPanelHeight={280}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#0077B6]"
              />
            </label>
            {selectedJob && !selectedJob.onMarketplace ? (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {typeof n.jobNotOnMarketplace === 'function'
                  ? n.jobNotOnMarketplace(
                    getLocalizedJobTitle(selectedJob, language) || selectedJob.title,
                    selectedJob.listingStatusLabel,
                  )
                  : 'JD này chưa được đưa lên Sàn CTV.'}
                {' '}
                <button
                  type="button"
                  className="font-semibold text-[#0077B6] underline"
                  onClick={() => {
                    onClose?.()
                    navigate(selectedJob.listingId
                      ? `/business/candidate-sharing?tab=jobs&listingId=${selectedJob.listingId}`
                      : '/business/candidate-sharing?tab=jobs')
                  }}
                >
                  {n.goToMarketplace || 'Đến Sàn CTV'}
                </button>
              </div>
            ) : null}
            {selectedJob?.existingApplicationId ? (
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {n.alreadyExists || 'Ứng viên đã có đơn tiến cử cho JD này.'}
              </div>
            ) : null}
            <label className="mt-3 block">
              <span className="text-[10px] font-semibold text-slate-600">{n.note || 'Ghi chú'}</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={n.notePlaceholder || 'Tuỳ chọn'}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-[#0077B6]"
              />
            </label>
          </>
        )}

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
          >
            {n.cancel || 'Hủy'}
          </button>
          <button
            type="button"
            disabled={!jobId || submitting || loadingJobs}
            onClick={handleSubmit}
            className="rounded-lg bg-[#0077B6] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {submitting ? (n.submitting || 'Đang tạo...') : (n.submit || 'Tạo tiến cử')}
          </button>
        </div>
      </div>
    </div>
  )
}
