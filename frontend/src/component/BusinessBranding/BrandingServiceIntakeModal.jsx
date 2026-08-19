import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Search, X } from 'lucide-react'
import apiService from '../../services/api'
import { BUSINESS_UI_FONT } from '../../utils/businessUiFont'
import { useLanguage } from '../../context/LanguageContext'
import { getBrandingCopy, formatBrandingJobLabel } from '../../i18n/businessAppI18n'

const BRAND = '#0077B6'

export default function BrandingServiceIntakeModal({
  open,
  serviceKey,
  onClose,
  onSubmit,
  submitting = false,
}) {
  const { language } = useLanguage()
  const copy = useMemo(() => getBrandingCopy(language), [language])
  const intake = copy.intake

  const isAds = serviceKey === 'recruitment_ads'
  const isEvent = serviceKey === 'recruitment_event'
  const isProfile = serviceKey === 'company_profile'

  const [jobQuery, setJobQuery] = useState('')
  const [jobResults, setJobResults] = useState([])
  const [jobLoading, setJobLoading] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)

  const [budget, setBudget] = useState('')
  const [channels, setChannels] = useState([])

  const [eventType, setEventType] = useState('online')
  const [eventDate, setEventDate] = useState('')
  const [eventScale, setEventScale] = useState('50-100')
  const [eventNote, setEventNote] = useState('')

  const [profileFormat, setProfileFormat] = useState('both')
  const [profileLanguages, setProfileLanguages] = useState(['vn'])
  const [profileMaterials, setProfileMaterials] = useState('')
  const [profileNote, setProfileNote] = useState('')

  const resetForm = useCallback(() => {
    setJobQuery('')
    setJobResults([])
    setSelectedJob(null)
    setBudget('')
    setChannels([])
    setEventType('online')
    setEventDate('')
    setEventScale('50-100')
    setEventNote('')
    setProfileFormat('both')
    setProfileLanguages(['vn'])
    setProfileMaterials('')
    setProfileNote('')
  }, [])

  useEffect(() => {
    if (!open) {
      resetForm()
      return undefined
    }
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting) onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, submitting, onClose, resetForm])

  useEffect(() => {
    if (!open || !isAds) return undefined
    const q = jobQuery.trim()
    if (q.length < 1) {
      setJobResults([])
      return undefined
    }
    const timer = setTimeout(() => {
      setJobLoading(true)
      apiService.getBusinessJobs({ page: 1, limit: 20, search: q })
        .then((res) => setJobResults(res?.data?.jobs || res?.data?.items || []))
        .catch(() => setJobResults([]))
        .finally(() => setJobLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [open, isAds, jobQuery])

  const toggleChannel = (id) => {
    setChannels((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  const toggleProfileLanguage = (id) => {
    setProfileLanguages((prev) => (prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]))
  }

  const buildNote = () => {
    if (isAds) {
      const channelLabels = channels.map((id) => intake.adChannels.find((c) => c.id === id)?.label).filter(Boolean)
      const lines = [
        '--- Quảng cáo tuyển dụng ---',
        selectedJob ? `JD: ${formatBrandingJobLabel(selectedJob, language)}` : 'JD: (chưa chọn)',
        budget.trim() ? `Ngân sách dự kiến: ${budget.trim()}` : 'Ngân sách dự kiến: (chưa nhập)',
        channelLabels.length ? `Kênh mong muốn: ${channelLabels.join(', ')}` : 'Kênh mong muốn: (chưa chọn)',
      ]
      return lines.join('\n')
    }
    if (isEvent) {
      const typeLabel = intake.eventTypes.find((t) => t.id === eventType)?.label || eventType
      const scaleLabel = intake.eventScales.find((s) => s.id === eventScale)?.label || eventScale
      const lines = [
        '--- Seminar & event tuyển dụng ---',
        `Loại sự kiện: ${typeLabel}`,
        eventDate ? `Thời gian dự kiến: ${eventDate}` : 'Thời gian dự kiến: (chưa nhập)',
        `Quy mô: ${scaleLabel}`,
      ]
      if (eventNote.trim()) lines.push(`Ghi chú thêm: ${eventNote.trim()}`)
      return lines.join('\n')
    }
    if (isProfile) {
      const formatLabel = intake.profileFormats.find((f) => f.id === profileFormat)?.label || profileFormat
      const langLabels = profileLanguages
        .map((id) => intake.profileLangs.find((l) => l.id === id)?.label)
        .filter(Boolean)
      const lines = [
        '--- Company profile ---',
        `Định dạng mong muốn: ${formatLabel}`,
        langLabels.length ? `Ngôn ngữ: ${langLabels.join(', ')}` : 'Ngôn ngữ: (chưa chọn)',
      ]
      if (profileMaterials.trim()) lines.push(`Tài liệu / link tham khảo:\n${profileMaterials.trim()}`)
      if (profileNote.trim()) lines.push(`Ghi chú thêm: ${profileNote.trim()}`)
      return lines.join('\n')
    }
    return ''
  }

  const canSubmit = isAds
    ? selectedJob && budget.trim() && channels.length > 0
    : isEvent
      ? eventType && eventDate && eventScale
      : isProfile
        ? profileFormat && profileLanguages.length > 0
        : false

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit || submitting) return
    onSubmit?.({ serviceKey, note: buildNote() })
  }

  if (!open || (!isAds && !isEvent && !isProfile)) return null

  const title = isAds ? intake.adsTitle : isEvent ? intake.eventTitle : intake.profileTitle
  const subtitle = isAds ? intake.adsSubtitle : isEvent ? intake.eventSubtitle : intake.profileSubtitle

  return createPortal(
    <div
      className="fixed inset-0 z-[10040] flex items-center justify-center p-4"
      style={{ fontFamily: BUSINESS_UI_FONT }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="branding-intake-title"
    >
      <button
        type="button"
        aria-label={copy.template.close}
        className="absolute inset-0 bg-slate-900/45"
        onClick={() => !submitting && onClose?.()}
      />
      <div className="relative flex max-h-[min(90vh,640px)] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="shrink-0 border-b border-slate-100 px-5 pb-4 pt-5 pr-12">
          <button
            type="button"
            onClick={() => !submitting && onClose?.()}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            aria-label={copy.template.closeDialog}
          >
            <X className="h-4 w-4" />
          </button>
          <h2 id="branding-intake-title" className="text-base font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {isAds ? (
              <>
                <section>
                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-700 sm:text-xs">
                    {intake.jdRequired} <span className="text-red-500">*</span>
                  </label>
                  {selectedJob ? (
                    <div className="flex items-center gap-2 rounded-lg border border-[#0077B6]/30 bg-[#e8f4fa]/50 px-3 py-2.5">
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-800">
                        {formatBrandingJobLabel(selectedJob, language)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedJob(null)}
                        disabled={submitting}
                        className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-600"
                        aria-label={intake.clearJd}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="search"
                        value={jobQuery}
                        onChange={(e) => setJobQuery(e.target.value)}
                        placeholder={intake.searchJd}
                        disabled={submitting}
                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#0077B6]/20"
                      />
                      {jobLoading ? (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#0077B6]" />
                      ) : null}
                      {jobResults.length > 0 && jobQuery.trim() ? (
                        <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                          {jobResults.map((job) => (
                            <li key={job.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedJob(job)
                                  setJobQuery('')
                                  setJobResults([])
                                }}
                                className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                              >
                                {formatBrandingJobLabel(job, language)}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  )}
                </section>

                <section>
                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-700 sm:text-xs">
                    {intake.budget} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder={intake.budgetPlaceholder}
                    disabled={submitting}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#0077B6]/20"
                  />
                </section>

                <section>
                  <p className="mb-2 text-[11px] font-semibold text-slate-700 sm:text-xs">
                    {intake.channels} <span className="text-red-500">*</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {intake.adChannels.map((ch) => {
                      const checked = channels.includes(ch.id)
                      return (
                        <label
                          key={ch.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                            checked
                              ? 'border-[#0077B6] bg-[#e8f4fa] text-[#0077B6]'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={checked}
                            onChange={() => toggleChannel(ch.id)}
                            disabled={submitting}
                          />
                          <span className={`h-3.5 w-3.5 shrink-0 rounded border ${checked ? 'border-[#0077B6] bg-[#0077B6]' : 'border-slate-300 bg-white'}`}>
                            {checked ? <span className="block text-[8px] leading-[14px] text-center text-white">✓</span> : null}
                          </span>
                          {ch.label}
                        </label>
                      )
                    })}
                  </div>
                </section>
              </>
            ) : null}

            {isEvent ? (
              <>
                <section>
                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-700 sm:text-xs">
                    {intake.eventType} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-800 focus:border-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#0077B6]/20"
                  >
                    {intake.eventTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </section>

                <section>
                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-700 sm:text-xs">
                    {intake.eventDate} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    disabled={submitting}
                    min={new Date().toISOString().slice(0, 10)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-800 focus:border-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#0077B6]/20"
                  />
                </section>

                <section>
                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-700 sm:text-xs">
                    {intake.eventScale} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={eventScale}
                    onChange={(e) => setEventScale(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-800 focus:border-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#0077B6]/20"
                  >
                    {intake.eventScales.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </section>

                <section>
                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-700 sm:text-xs">
                    {intake.eventNote}
                  </label>
                  <textarea
                    value={eventNote}
                    onChange={(e) => setEventNote(e.target.value)}
                    rows={3}
                    placeholder={intake.eventNotePlaceholder}
                    disabled={submitting}
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#0077B6]/20"
                  />
                </section>
              </>
            ) : null}

            {isProfile ? (
              <>
                <section>
                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-700 sm:text-xs">
                    {intake.profileFormat} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={profileFormat}
                    onChange={(e) => setProfileFormat(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-800 focus:border-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#0077B6]/20"
                  >
                    {intake.profileFormats.map((f) => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </section>

                <section>
                  <p className="mb-2 text-[11px] font-semibold text-slate-700 sm:text-xs">
                    {intake.profileLanguages} <span className="text-red-500">*</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {intake.profileLangs.map((lang) => {
                      const checked = profileLanguages.includes(lang.id)
                      return (
                        <label
                          key={lang.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
                            checked ? 'border-[#0077B6] bg-[#e8f4fa] text-[#0077B6]' : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={checked}
                            onChange={() => toggleProfileLanguage(lang.id)}
                            disabled={submitting}
                          />
                          {lang.label}
                        </label>
                      )
                    })}
                  </div>
                </section>

                <section>
                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-700 sm:text-xs">
                    {intake.profileMaterials}
                  </label>
                  <textarea
                    value={profileMaterials}
                    onChange={(e) => setProfileMaterials(e.target.value)}
                    rows={4}
                    placeholder={intake.profileMaterialsPlaceholder}
                    disabled={submitting}
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#0077B6]/20"
                  />
                </section>

                <section>
                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-700 sm:text-xs">
                    {intake.profileNote}
                  </label>
                  <textarea
                    value={profileNote}
                    onChange={(e) => setProfileNote(e.target.value)}
                    rows={2}
                    placeholder={intake.profileNotePlaceholder}
                    disabled={submitting}
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#0077B6]/20"
                  />
                </section>
              </>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              {intake.cancel}
            </button>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0077B6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#006399] disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {intake.submit}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
