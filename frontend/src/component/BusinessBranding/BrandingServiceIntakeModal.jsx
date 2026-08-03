import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Search, X } from 'lucide-react'
import apiService from '../../services/api'
import { BUSINESS_UI_FONT } from '../../utils/businessUiFont'

const BRAND = '#0077B6'

const AD_CHANNELS = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'google', label: 'Google Ads' },
]

const EVENT_TYPES = [
  { id: 'online', label: 'Online (webinar / livestream)' },
  { id: 'offline', label: 'Offline (job fair / hội thảo)' },
  { id: 'hybrid', label: 'Hybrid (kết hợp)' },
]

const EVENT_SCALES = [
  { id: 'under50', label: 'Dưới 50 người' },
  { id: '50-100', label: '50 – 100 người' },
  { id: '100-300', label: '100 – 300 người' },
  { id: '300plus', label: 'Trên 300 người' },
]

const PROFILE_FORMATS = [
  { id: 'pdf', label: 'PDF (in ấn / gửi file)' },
  { id: 'online', label: 'Online (trang web / microsite)' },
  { id: 'both', label: 'Cả PDF & Online' },
]

const PROFILE_LANGUAGES = [
  { id: 'vn', label: 'Tiếng Việt' },
  { id: 'en', label: 'English' },
  { id: 'jp', label: '日本語' },
]

function formatJobLabel(job) {
  if (!job) return ''
  const code = job.jobCode ? `[${job.jobCode}] ` : ''
  return `${code}${job.title || 'JD không tên'}`
}

export default function BrandingServiceIntakeModal({
  open,
  serviceKey,
  onClose,
  onSubmit,
  submitting = false,
}) {
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
      const channelLabels = channels.map((id) => AD_CHANNELS.find((c) => c.id === id)?.label).filter(Boolean)
      const lines = [
        '--- Quảng cáo tuyển dụng ---',
        selectedJob ? `JD: ${formatJobLabel(selectedJob)}` : 'JD: (chưa chọn)',
        budget.trim() ? `Ngân sách dự kiến: ${budget.trim()}` : 'Ngân sách dự kiến: (chưa nhập)',
        channelLabels.length ? `Kênh mong muốn: ${channelLabels.join(', ')}` : 'Kênh mong muốn: (chưa chọn)',
      ]
      return lines.join('\n')
    }
    if (isEvent) {
      const typeLabel = EVENT_TYPES.find((t) => t.id === eventType)?.label || eventType
      const scaleLabel = EVENT_SCALES.find((s) => s.id === eventScale)?.label || eventScale
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
      const formatLabel = PROFILE_FORMATS.find((f) => f.id === profileFormat)?.label || profileFormat
      const langLabels = profileLanguages
        .map((id) => PROFILE_LANGUAGES.find((l) => l.id === id)?.label)
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

  const title = isAds
    ? 'Quảng cáo tuyển dụng'
    : isEvent
      ? 'Seminar & event tuyển dụng'
      : 'Company profile'
  const subtitle = isAds
    ? 'Chọn JD, ngân sách và kênh quảng cáo để WS triển khai chính xác hơn.'
    : isEvent
      ? 'Cho WS biết loại sự kiện, thời gian và quy mô trước khi lên kế hoạch.'
      : 'Chọn định dạng, ngôn ngữ và đính kèm tài liệu nguồn trước khi WS thiết kế.'

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
        aria-label="Đóng"
        className="absolute inset-0 bg-slate-900/45"
        onClick={() => !submitting && onClose?.()}
      />
      <div className="relative flex max-h-[min(90vh,640px)] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="shrink-0 border-b border-slate-100 px-5 pb-4 pt-5 pr-12">
          <button
            type="button"
            onClick={() => !submitting && onClose?.()}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            aria-label="Đóng hộp thoại"
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
                    JD cần quảng cáo <span className="text-red-500">*</span>
                  </label>
                  {selectedJob ? (
                    <div className="flex items-center gap-2 rounded-lg border border-[#0077B6]/30 bg-[#e8f4fa]/50 px-3 py-2.5">
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-800">
                        {formatJobLabel(selectedJob)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedJob(null)}
                        disabled={submitting}
                        className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-600"
                        aria-label="Bỏ chọn JD"
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
                        placeholder="Tìm theo tên hoặc mã JD..."
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
                                {formatJobLabel(job)}
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
                    Ngân sách dự kiến (VNĐ/tháng) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="VD: 10.000.000 – 20.000.000"
                    disabled={submitting}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#0077B6]/20"
                  />
                </section>

                <section>
                  <p className="mb-2 text-[11px] font-semibold text-slate-700 sm:text-xs">
                    Kênh quảng cáo mong muốn <span className="text-red-500">*</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {AD_CHANNELS.map((ch) => {
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
                    Loại sự kiện <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-800 focus:border-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#0077B6]/20"
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </section>

                <section>
                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-700 sm:text-xs">
                    Thời gian dự kiến <span className="text-red-500">*</span>
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
                    Quy mô dự kiến <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={eventScale}
                    onChange={(e) => setEventScale(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-800 focus:border-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#0077B6]/20"
                  >
                    {EVENT_SCALES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </section>

                <section>
                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-700 sm:text-xs">
                    Ghi chú thêm (tuỳ chọn)
                  </label>
                  <textarea
                    value={eventNote}
                    onChange={(e) => setEventNote(e.target.value)}
                    rows={3}
                    placeholder="Mục tiêu sự kiện, địa điểm, yêu cầu đặc biệt..."
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
                    Định dạng đầu ra <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={profileFormat}
                    onChange={(e) => setProfileFormat(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-800 focus:border-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#0077B6]/20"
                  >
                    {PROFILE_FORMATS.map((f) => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </section>

                <section>
                  <p className="mb-2 text-[11px] font-semibold text-slate-700 sm:text-xs">
                    Ngôn ngữ <span className="text-red-500">*</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PROFILE_LANGUAGES.map((lang) => {
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
                    Tài liệu / link tham khảo (tuỳ chọn)
                  </label>
                  <textarea
                    value={profileMaterials}
                    onChange={(e) => setProfileMaterials(e.target.value)}
                    rows={4}
                    placeholder="Link logo, brochure, website công ty, bản nháp nội dung..."
                    disabled={submitting}
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#0077B6]/20"
                  />
                </section>

                <section>
                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-700 sm:text-xs">
                    Ghi chú thêm (tuỳ chọn)
                  </label>
                  <textarea
                    value={profileNote}
                    onChange={(e) => setProfileNote(e.target.value)}
                    rows={2}
                    placeholder="Tone giọng, màu thương hiệu, deadline mong muốn..."
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
              Hủy
            </button>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0077B6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#006399] disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Gửi yêu cầu tới WS
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
