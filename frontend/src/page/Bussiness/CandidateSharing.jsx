import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import {
  ChevronRight, Plus, Loader2, X, BarChart3,
  FileText, Users, ArrowRight, Search, Briefcase,
  Sparkles, Wallet, Link2, SlidersHorizontal, UserCheck,
  MoreHorizontal, AlertTriangle,
} from 'lucide-react'
import nothingIllustration from '../../assets/Nothing.png'
import apiService from '../../services/api'
import NominationChat from '../../component/Chat/NominationChat'
import BusinessQuickActionsPageLayout from '../../component/Bussiness/BusinessQuickActionsPageLayout.jsx'
import JobCommissionEditor, { validateCommissionForMarketplace } from '../../component/Bussiness/JobCommissionEditor'
import {
  createAndSubmitMarketplaceListing,
  mapJobValuesForListingApi,
  savePendingMarketplaceListingDraft,
} from '../../utils/marketplaceListingFlow'
import {
  MARKETPLACE_PLATFORM_FEE_PERCENT,
  MIN_CTV_RATING_OPTIONS,
  buildMarketplaceRequirements,
  computeListingFeeSplitPreview,
} from '../../utils/marketplaceListingSettings'
import {
  SIMPLE_FEE_MODES,
  parseJobCommissionToSimple,
  simpleCommissionToPayload,
} from '../../utils/businessSimpleCommission'
import { normalizeJobSalaryCurrency } from '../../utils/jobSalaryCurrency'
import { useLanguage } from '../../context/LanguageContext'
import { getBusinessAppCopy, getHomepageSolutionCards } from '../../i18n/businessAppI18n'

const PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif"
const BRAND = '#0077B6'
const PIPELINE_STATUSES = new Set([2, 3, 5, 7, 8, 9, 11, 12])

const scrollbarStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  .ctv-scrollbar::-webkit-scrollbar { width: 4px; }
  .ctv-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .ctv-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .ctv-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  .ctv-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
  .ctv-onboard-scroll::-webkit-scrollbar { display: none; }
  .ctv-onboard-scroll { -ms-overflow-style: none; scrollbar-width: none; }

  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

  .business-homepage-scroll::-webkit-scrollbar { width: 4px; }
  .business-homepage-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

  .business-homepage-shell {
    --hp-zoom: 1;
  }
  @media (min-width: 1024px) and (max-width: 1279px) {
    .business-homepage-shell { --hp-zoom: 0.88; }
  }
  @media (min-width: 1280px) and (max-width: 1535px) {
    .business-homepage-shell { --hp-zoom: 0.8; }
  }
  @media (min-width: 1536px) and (max-width: 1919px) {
    .business-homepage-shell { --hp-zoom: 0.94; }
  }
  @media (min-width: 1920px) {
    .business-homepage-shell { --hp-zoom: 1; }
  }
  .business-homepage-ui {
    zoom: var(--hp-zoom);
  }
  @supports not (zoom: 1) {
    .business-homepage-ui {
      transform: scale(var(--hp-zoom));
      transform-origin: top left;
      width: calc(100% / var(--hp-zoom));
    }
  }
  .ctv-marketplace-dashboard {
    height: 100%;
    min-height: 0;
    max-height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .ctv-marketplace-table-panel {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 280px;
  }
  @media (min-width: 1280px) {
    .ctv-marketplace-table-panel {
      min-height: 320px;
    }
  }
  .ctv-marketplace-table-body {
    flex: 1 1 auto;
    min-height: 220px;
    overflow: auto;
  }
  .ctv-marketplace-col {
    min-height: 0;
    height: 100%;
    max-height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
  }
  .ctv-marketplace-body {
    min-height: 0;
    flex: 1 1 auto;
    overflow: hidden;
  }
`

const unifiedBenefits = [
  { icon: Sparkles, title: 'Tạo JD nhanh bằng AI', desc: 'Soạn JD chuẩn tuyển dụng, tối ưu cho Sàn CTV.' },
  { icon: Wallet, title: 'Không phí trả trước', desc: 'Chỉ thanh toán phí tuyển dụng khi tuyển thành công.' },
  { icon: Link2, title: 'Kết nối trực tiếp mạng CTV WS', desc: 'CTV JobShare tiếp cận JD và tiến cử trên nền tảng.' },
  { icon: SlidersHorizontal, title: 'Tự set phí theo ngân sách', desc: 'Thiết lập mức phí tuyển dụng linh hoạt theo JD.' },
]

const processSteps = [
  { num: '01', title: 'Chọn JD của bạn', desc: 'Chọn JD có sẵn hoặc tạo JD mới trên JobShare.' },
  { num: '02', title: 'Thiết lập phí', desc: 'Cài đặt phí thưởng CTV bạn sẵn sàng trả khi tuyển thành công.' },
  { num: '03', title: 'Đăng lên Sàn CTV', desc: 'Đăng lên Sàn cộng tác viên tuyển dụng WS.' },
  { num: '04', title: 'CTV tiến cử', desc: 'CTV JobShare tiếp cận & tiến cử trực tiếp cho doanh nghiệp.' },
]

const compareDimensions = [
  { key: 'how', label: 'Cách làm', ctv: 'DN đăng JD + tự thiết lập phí tuyển dụng', managed: 'WS hearing nhu cầu & sàng lọc hồ sơ' },
  { key: 'ws', label: 'Vai trò WS', ctv: 'Nền tảng & hỗ trợ vận hành Sàn', managed: 'WS trung gian, đồng hành quy trình' },
  { key: 'connect', label: 'Kết nối', ctv: 'CTV kết nối & tiến cử trực tiếp cho DN', managed: 'WS điều phối, DN nhận hồ sơ đã lọc' },
  { key: 'fee', label: 'Phí', ctv: 'Chỉ trả khi tuyển thành công (theo JD)', managed: 'Phí dịch vụ khoảng 20–30% thu nhập năm' },
  { key: 'control', label: 'Mức chủ động', ctv: 'DN chủ động ngân sách & JD', managed: 'WS dẫn dắt, DN tập trung quyết định cuối' },
]

function formatPlatformStat(value, suffix = '') {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toLocaleString('vi-VN')}${suffix}`
}

const CTV_CARD = 'rounded-xl border border-slate-200 bg-white shadow-sm'

function CtvKpiCard({ icon: Icon, iconBg, iconColor, title, value, subValue }) {
  return (
    <div className={`${CTV_CARD} p-2.5`}>
      <div className="flex items-start gap-2">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ background: iconBg }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] leading-tight text-slate-500">{title}</div>
          <div className="mt-0.5 text-base font-bold tabular-nums leading-tight text-slate-900">{value}</div>
          {subValue ? (
            <div className="mt-0.5 text-[10px] font-medium text-slate-600">{subValue}</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function formatReferralFeeCell(fee) {
  const raw = String(fee || '').trim()
  if (!raw || raw === '—') return '—'
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length <= 1) return lines[0] || '—'
  return lines.join(' · ')
}

function OnboardingView({
  hasMarketplaceData,
  platformOverview,
  onCreate,
  onViewDetails,
  onNavigate,
  breadcrumbHome,
  breadcrumbCurrent,
}) {
  const platformKpis = [
    {
      icon: Users,
      label: 'CTV đang hoạt động',
      value: formatPlatformStat(platformOverview?.activeCtv),
    },
    {
      icon: Briefcase,
      label: 'JD đang chạy trên Sàn CTV',
      value: formatPlatformStat(platformOverview?.activeListings),
    },
    {
      icon: UserCheck,
      label: 'Ứng viên đã được tiến cử',
      value: formatPlatformStat(platformOverview?.totalNominations),
    },
    {
      icon: BarChart3,
      label: 'Tỷ lệ tuyển thành công TB',
      value: platformOverview?.successRatePercent != null
        ? `${platformOverview.successRatePercent}%`
        : '—',
    },
  ]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:gap-4 2xl:gap-5 min-w-0 pb-2">
      <div className="shrink-0">
        <nav aria-label="Breadcrumb" className="text-[11px] text-slate-500 lg:text-xs">
          <button
            type="button"
            onClick={() => onNavigate('/business')}
            className="transition hover:text-[#0077B6]"
          >
            {breadcrumbHome}
          </button>
          <span className="mx-1.5 text-slate-400">&gt;</span>
          <span className="font-medium text-slate-700">{breadcrumbCurrent}</span>
        </nav>
      </div>

      <div className="rounded-xl border border-[#0077B6]/20 bg-gradient-to-br from-[#e8f4fa] to-white p-4 sm:p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#0077B6] sm:text-[11px]">Sàn CTV · WS JobShare</p>
        <h1 className="mt-1 text-base font-bold leading-snug text-slate-900 sm:text-lg 2xl:text-xl">
          Đăng JD với ngân sách tuyển dụng của doanh nghiệp — CTV JobShare tiến cử trực tiếp cho doanh nghiệp.
        </h1>
        <p className="mt-2 max-w-2xl text-[11px] leading-relaxed text-slate-600 sm:text-xs">
          Chọn JD có sẵn hoặc tạo JD mới trên JobShare, thiết lập phí và đăng lên Sàn cộng tác viên tuyển dụng WS.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0077B6] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#006399] sm:text-sm"
          >
            Đăng JD lên Sàn CTV
            <ArrowRight className="h-4 w-4" />
          </button>
          {hasMarketplaceData ? (
            <button
              type="button"
              onClick={onViewDetails}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:text-sm"
            >
              Vào quản lý Sàn CTV
            </button>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-3 py-2.5 sm:px-4">
          <h2 className="text-xs font-bold text-slate-900 sm:text-sm">So sánh nhanh: Sàn CTV vs Scout Ủy Thác</h2>
          <p className="mt-0.5 text-[10px] text-slate-500 sm:text-[11px]">Chọn mô hình phù hợp ngân sách và mức chủ động của doanh nghiệp.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-[10px] sm:text-[11px]">
            <thead>
              <tr className="bg-slate-50 text-left text-slate-500">
                <th className="px-3 py-2 font-semibold sm:px-4">Tiêu chí</th>
                <th className="px-3 py-2 font-semibold text-[#0077B6] sm:px-4">Sàn CTV</th>
                <th className="px-3 py-2 font-semibold text-[#E879A8] sm:px-4">Scout Ủy Thác</th>
              </tr>
            </thead>
            <tbody>
              {compareDimensions.map((row) => (
                <tr key={row.key} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-semibold text-slate-700 sm:px-4">{row.label}</td>
                  <td className="px-3 py-2 text-slate-600 sm:px-4">{row.ctv}</td>
                  <td className="px-3 py-2 text-slate-600 sm:px-4">{row.managed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-3 py-2 text-right sm:px-4">
          <button
            type="button"
            onClick={() => onNavigate('/business/scout/managed')}
            className="text-[10px] font-semibold text-[#0077B6] hover:underline sm:text-[11px]"
          >
            Tìm hiểu Scout Ủy Thác →
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
        <h2 className="text-xs font-bold text-slate-900 sm:text-sm">Lợi ích & tính năng</h2>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
          {unifiedBenefits.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="flex gap-2.5 rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 sm:p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f4fa]">
                  <Icon className="h-4 w-4 text-[#0077B6]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[11px] font-bold text-slate-800 sm:text-xs">{item.title}</h3>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500 sm:text-[11px]">{item.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 2xl:p-5 shrink-0">
        <h2 className="text-xs font-bold text-slate-800 mb-3 sm:mb-4">Quy trình 4 bước trên Sàn CTV</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {processSteps.map((step, idx) => (
            <div key={step.num} className="relative flex flex-col gap-1.5 sm:gap-2">
              {idx < processSteps.length - 1 && (
                <div className="hidden xl:block absolute top-4 left-[calc(100%-8px)] w-full h-px bg-[#cce5f0] z-0" />
              )}
              <span className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0077B6] text-white text-[10px] sm:text-xs font-bold relative z-10">
                {step.num}
              </span>
              <h3 className="text-[11px] sm:text-xs font-bold text-slate-800">{step.title}</h3>
              <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/90 bg-white p-3 sm:p-4">
        <h2 className="text-xs font-bold text-slate-900 sm:text-sm">Số liệu nền tảng Sàn CTV</h2>
        <p className="mt-0.5 text-[10px] text-slate-500 sm:text-[11px]">Cập nhật theo hoạt động thực tế trên JobShare.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {platformKpis.map((kpi) => {
            const Icon = kpi.icon
            return (
              <div key={kpi.label} className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 sm:p-3">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-[#0077B6]" strokeWidth={2} />
                  <span className="text-[9px] font-medium leading-snug text-slate-500 sm:text-[10px]">{kpi.label}</span>
                </div>
                <div className="text-base font-bold tabular-nums text-slate-900 sm:text-lg">{kpi.value}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function formatDateShort(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('vi-VN')
  } catch {
    return '—'
  }
}

function formatJobPickerLabel(job) {
  if (!job) return ''
  const title = job.title || job.titleEn || job.titleJp || `Job #${job.id}`
  const code = job.jobCode || job.job_code || ''
  return code ? `${title} (${code})` : title
}

const businessModalTitleClass = 'text-[11px] font-bold leading-snug text-slate-900 sm:text-xs'
const businessModalSubtitleClass = 'mt-0.5 text-[10px] font-medium leading-relaxed text-slate-600 sm:text-[11px]'
const businessLabelClass = 'block text-[10px] font-semibold text-slate-700 mb-1 sm:text-[11px]'
const businessInputClass =
  'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[10px] sm:text-[11px] text-slate-900 outline-none focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/25'
const businessBtnSecondaryClass =
  'w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 sm:px-4 sm:py-2 sm:text-[11px]'
const businessBtnPrimaryClass =
  'w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0077B6] px-3 py-1.5 text-[10px] font-bold text-white shadow-sm shadow-[#0077B6]/15 transition-colors hover:bg-[#006399] disabled:opacity-60 sm:px-4 sm:py-2 sm:text-[11px]'

function CreateListingModal({ open, onClose, onCreated, initialJobId = '' }) {
  const navigate = useNavigate()
  const [jobId, setJobId] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)
  const [jobSearchQuery, setJobSearchQuery] = useState('')
  const [jobSearchResults, setJobSearchResults] = useState([])
  const [jobSearchLoading, setJobSearchLoading] = useState(false)
  const [jobSearchOpen, setJobSearchOpen] = useState(false)
  const [jobCommissionType, setJobCommissionType] = useState('percent')
  const [jobValues, setJobValues] = useState(() => simpleCommissionToPayload(SIMPLE_FEE_MODES.PERCENT_ANNUAL, '').jobValues)
  const [salaryCurrency, setSalaryCurrency] = useState('JPY')
  const [commissionSeedJob, setCommissionSeedJob] = useState(null)
  const [recruitmentDeadline, setRecruitmentDeadline] = useState('')
  const [minCtvRating, setMinCtvRating] = useState(0)
  const [platformBillingAck, setPlatformBillingAck] = useState(false)
  const [creating, setCreating] = useState(false)
  const [loadingJobMeta, setLoadingJobMeta] = useState(false)
  const [jobsAvailability, setJobsAvailability] = useState({ loading: false, hasJobs: true })

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape' && !creating) onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, creating])

  useEffect(() => {
    if (!open) return undefined
    if (initialJobId) {
      setJobsAvailability({ loading: false, hasJobs: true })
      return undefined
    }
    let mounted = true
    setJobsAvailability({ loading: true, hasJobs: true })
    apiService.getBusinessJobs({ page: 1, limit: 1 }).then((res) => {
      if (!mounted) return
      const jobs = res?.data?.jobs || res?.data?.items || []
      const total = res?.data?.pagination?.total
      const hasJobs = typeof total === 'number' ? total > 0 : jobs.length > 0
      setJobsAvailability({ loading: false, hasJobs: res?.success ? hasJobs : true })
    }).catch(() => {
      if (mounted) setJobsAvailability({ loading: false, hasJobs: true })
    })
    return () => { mounted = false }
  }, [open, initialJobId])

  useEffect(() => {
    if (!open) return
    setJobId(initialJobId ? String(initialJobId) : '')
    setSelectedJob(null)
    setJobSearchQuery('')
    setJobSearchResults([])
    setJobSearchOpen(false)
    const emptyPayload = simpleCommissionToPayload(SIMPLE_FEE_MODES.PERCENT_ANNUAL, '')
    setJobCommissionType(emptyPayload.jobCommissionType)
    setJobValues(emptyPayload.jobValues)
    setSalaryCurrency('JPY')
    setCommissionSeedJob(null)
    setRecruitmentDeadline('')
    setMinCtvRating(0)
    setPlatformBillingAck(false)
  }, [open, initialJobId])

  useEffect(() => {
    if (!open || !initialJobId) return
    let mounted = true
    apiService.getBusinessJobById(initialJobId).then((res) => {
      if (!mounted) return
      const job = res?.data?.job || res?.data
      if (job?.id) {
        setSelectedJob(job)
        setJobId(String(job.id))
      }
    }).catch(() => {})
    return () => { mounted = false }
  }, [open, initialJobId])

  useEffect(() => {
    if (!open || selectedJob) return
    const q = jobSearchQuery.trim()
    if (q.length < 1) {
      setJobSearchResults([])
      setJobSearchLoading(false)
      return undefined
    }
    setJobSearchLoading(true)
    let mounted = true
    const timer = setTimeout(() => {
      apiService.getBusinessJobs({ page: 1, limit: 20, search: q }).then((res) => {
        if (!mounted) return
        setJobSearchResults(res?.data?.jobs || res?.data?.items || [])
      }).catch(() => {
        if (mounted) setJobSearchResults([])
      }).finally(() => {
        if (mounted) setJobSearchLoading(false)
      })
    }, 280)
    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [open, jobSearchQuery, selectedJob])

  useEffect(() => {
    if (!jobId) return
    let mounted = true
    setLoadingJobMeta(true)
    apiService.getBusinessJobById(jobId).then((res) => {
      if (!mounted) return
      const job = res?.data?.job || res?.data
      setCommissionSeedJob(job || null)
      if (job?.id) setSelectedJob(job)
      const parsed = parseJobCommissionToSimple(job)
      const payload = simpleCommissionToPayload(parsed.feeMode, parsed.amount, {
        viewOnCollaborator: parsed.viewOnCollaborator,
      })
      setJobCommissionType(payload.jobCommissionType)
      setJobValues(payload.jobValues)
      if (job?.salaryCurrency) {
        setSalaryCurrency(normalizeJobSalaryCurrency(job.salaryCurrency))
      }
      if (job?.deadline) {
        setRecruitmentDeadline(String(job.deadline).slice(0, 10))
      }
    }).catch(() => {
      if (mounted) setCommissionSeedJob(null)
    }).finally(() => {
      if (mounted) setLoadingJobMeta(false)
    })
    return () => { mounted = false }
  }, [jobId])

  const clearSelectedJob = () => {
    setJobId('')
    setSelectedJob(null)
    setCommissionSeedJob(null)
    setJobSearchQuery('')
    setJobSearchResults([])
    setJobSearchOpen(false)
  }

  const pickJob = (job) => {
    if (!job?.id) return
    setJobId(String(job.id))
    setSelectedJob(job)
    setJobSearchQuery('')
    setJobSearchResults([])
    setJobSearchOpen(false)
  }

  const feeSplitPreview = useMemo(
    () => computeListingFeeSplitPreview({
      jobCommissionType,
      jobValues,
      platformFeePercent: MARKETPLACE_PLATFORM_FEE_PERCENT,
    }),
    [jobCommissionType, jobValues],
  )

  const buildListingDraftFromForm = () => ({
    jobCommissionType,
    jobValues: mapJobValuesForListingApi(jobValues),
    recruitmentDeadline: recruitmentDeadline || null,
    platformFeePercent: MARKETPLACE_PLATFORM_FEE_PERCENT,
    requirements: buildMarketplaceRequirements({ minCtvRating: Number(minCtvRating) || 0 }),
  })

  const handleQuickCreate = () => {
    const commissionError = validateCommissionForMarketplace(jobCommissionType, jobValues)
    if (commissionError) {
      alert(commissionError)
      return
    }
    if (!platformBillingAck) {
      alert('Vui lòng xác nhận cam kết xác nhận tuyển thành công trên nền tảng JobShare.')
      return
    }
    savePendingMarketplaceListingDraft(buildListingDraftFromForm())
    onClose?.()
    navigate('/business/jobs/create?quickMarketplace=1')
  }

  const handleEmptyQuickCreate = () => {
    onClose?.()
    navigate('/business/jobs/create')
  }

  const handleCreate = async () => {
    if (!jobId) { alert('Chọn công việc'); return }
    const commissionError = validateCommissionForMarketplace(jobCommissionType, jobValues)
    if (commissionError) { alert(commissionError); return }
    if (!platformBillingAck) {
      alert('Vui lòng xác nhận cam kết xác nhận tuyển thành công trên nền tảng JobShare.')
      return
    }
    setCreating(true)
    try {
      const { wsSessionId } = await createAndSubmitMarketplaceListing(
        Number(jobId),
        buildListingDraftFromForm(),
      )
      onCreated()
      onClose()
      if (wsSessionId) {
        navigate(`/business/messages?tab=ws&wsView=chat&sessionId=${wsSessionId}`)
      }
    } catch (e) {
      console.error(e)
      alert(e?.message || 'Tạo thất bại')
    } finally {
      setCreating(false)
    }
  }

  if (!open) return null

  const showNoJobsEmpty = !initialJobId && !jobsAvailability.loading && !jobsAvailability.hasJobs

  return createPortal(
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-listing-modal-title"
    >
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-slate-900/45"
        onClick={() => !creating && onClose?.()}
      />
      <div
        className="relative z-10 flex w-full max-w-3xl max-h-[90vh] min-h-0 justify-center pointer-events-none"
        style={{ fontFamily: PAGE_FONT }}
      >
        <div className="create-listing-modal pointer-events-auto relative flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl antialiased">
        <button
          type="button"
          onClick={() => !creating && onClose?.()}
          disabled={creating}
          className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          aria-label="Đóng hộp thoại"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>

        {!showNoJobsEmpty ? (
        <div className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 pr-11">
          <div className="flex items-start gap-2.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#0077B6]/20 bg-[#0077B6]/5"
              aria-hidden
            >
              <Briefcase className="h-3.5 w-3.5 text-[#0077B6]" strokeWidth={2} />
            </div>
            <div className="min-w-0 pt-0.5">
              <h2 id="create-listing-modal-title" className={businessModalTitleClass}>
                Đăng JD lên Sàn CTV
              </h2>
              <p className={businessModalSubtitleClass}>
                Chọn công việc, thiết lập phí thưởng CTV và gửi WS duyệt.
              </p>
            </div>
          </div>
        </div>
        ) : (
          <h2 id="create-listing-modal-title" className="sr-only">Chưa có job nào</h2>
        )}

        <div className={`ctv-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3 space-y-3 ${showNoJobsEmpty ? 'pt-10' : ''}`}>
          {!initialJobId && jobsAvailability.loading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#0077B6]" />
            </div>
          ) : showNoJobsEmpty ? (
            <div className="flex flex-col items-center justify-center px-2 py-6 text-center sm:py-8">
              <img
                src={nothingIllustration}
                alt=""
                className="mb-4 w-full max-w-[220px] object-contain"
                draggable={false}
              />
              <p className="text-sm font-semibold text-slate-800">Chưa có job nào</p>
              <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
                Tạo JD mới để bắt đầu đăng tin và kết nối với CTV HR Partner trên JobShare.
              </p>
              <button
                type="button"
                onClick={handleEmptyQuickCreate}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-[#0077B6] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#0077B6]/15 transition-colors hover:bg-[#006399] sm:text-sm"
              >
                Tạo nhanh
              </button>
            </div>
          ) : (
          <>
          <section className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 sm:p-3">
            <div className="relative">
              <label className={businessLabelClass}>
                Chọn JD cần CTV hỗ trợ <span className="text-red-500">*</span>
              </label>
              {selectedJob ? (
                <div className="flex items-center gap-2 rounded-lg border border-[#0077B6]/30 bg-white px-3 py-2.5 shadow-sm">
                  <span className="flex-1 min-w-0 text-[11px] font-medium text-slate-800 truncate sm:text-xs">
                    {formatJobPickerLabel(selectedJob)}
                  </span>
                  <button
                    type="button"
                    onClick={clearSelectedJob}
                    disabled={creating}
                    className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50"
                    aria-label="Bỏ chọn JD"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={jobSearchQuery}
                    onChange={(e) => {
                      setJobSearchQuery(e.target.value)
                      setJobSearchOpen(true)
                    }}
                    onFocus={() => setJobSearchOpen(true)}
                    placeholder="Nhập mã JD hoặc tiêu đề công việc..."
                    className={`${businessInputClass} pl-9`}
                    autoComplete="off"
                  />
                  {jobSearchOpen && jobSearchQuery.trim() ? (
                    <div className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg ctv-scrollbar">
                      {jobSearchLoading ? (
                        <div className="flex items-center gap-2 px-3 py-2.5 text-[11px] text-slate-500">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0077B6]" />
                          Đang tìm...
                        </div>
                      ) : jobSearchResults.length === 0 ? (
                        <p className="px-3 py-2.5 text-[11px] text-slate-500">Không tìm thấy JD phù hợp.</p>
                      ) : (
                        jobSearchResults.map((j) => (
                          <button
                            key={j.id}
                            type="button"
                            onClick={() => pickJob(j)}
                            className="w-full px-3 py-2.5 text-left text-[11px] font-medium text-slate-800 transition-colors hover:bg-[#0077B6]/5 hover:text-[#0077B6] sm:text-xs"
                          >
                            {formatJobPickerLabel(j)}
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
              )}
              {initialJobId && selectedJob && String(selectedJob.id) === String(initialJobId) ? (
                <p className="mt-2 text-[10px] font-semibold text-[#0077B6]">JD vừa tạo đã được chọn sẵn.</p>
              ) : null}
            </div>

            {loadingJobMeta && jobId ? (
              <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0077B6]" />
                Đang tải thông tin JD...
              </div>
            ) : null}
          </section>

          <JobCommissionEditor
            compact
            jobCommissionType={jobCommissionType}
            onCommissionTypeChange={setJobCommissionType}
            jobValues={jobValues}
            onJobValuesChange={setJobValues}
            commissionSeedJob={commissionSeedJob}
            salaryCurrency={salaryCurrency}
            onSalaryCurrencyChange={setSalaryCurrency}
          />

          {feeSplitPreview ? (
            <section className="rounded-lg border border-[#0077B6]/25 bg-[#e8f4fa]/50 p-3 sm:p-4">
              <p className="mb-2 text-[11px] font-bold text-slate-800 sm:text-xs">Minh bạch phí thưởng cho CTV</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200/80 bg-white px-3 py-2">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">DN trả tối đa</p>
                  <p className="mt-0.5 text-xs font-bold text-[#0077B6]">{feeSplitPreview.businessPaysLabel}</p>
                </div>
                <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-3 py-2">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700">CTV nhận</p>
                  <p className="mt-0.5 text-xs font-bold text-emerald-800">{feeSplitPreview.ctvReceivesLabel}</p>
                </div>
                <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-amber-700">Phí nền tảng WS</p>
                  <p className="mt-0.5 text-xs font-bold text-amber-900">{feeSplitPreview.platformFeeLabel}</p>
                </div>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                CTV thấy hai con số trên sàn trước khi tiến cử — khuyến khích tham gia minh bạch.
              </p>
            </section>
          ) : null}

          <section className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 sm:p-3">
            <label className={businessLabelClass}>Điểm CTV tối thiểu được tiến cử</label>
            <select
              value={minCtvRating}
              onChange={(e) => setMinCtvRating(Number(e.target.value))}
              disabled={creating}
              className={businessInputClass}
            >
              {MIN_CTV_RATING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
              Lọc CTV chất lượng thấp khi tiến cử trực tiếp (không qua WS sàng lọc).
            </p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-2.5 sm:p-3 space-y-1.5">
            <p className="text-[11px] font-bold text-slate-800 sm:text-xs">Quy tắc tiến cử trên Sàn CTV</p>
            <ul className="list-disc space-y-1 pl-4 text-[10px] leading-relaxed text-slate-600 sm:text-[11px]">
              <li>Email doanh nghiệp chỉ dùng để <strong>thông báo</strong> — hồ sơ phải ghi nhận trong mục Quản lý tiến cử.</li>
              <li>Doanh nghiệp <strong>xác nhận tuyển thành công trên JobShare</strong> để kích hoạt thanh toán &amp; chia phí.</li>
              <li>JobShare thu {MARKETPLACE_PLATFORM_FEE_PERCENT}% phí thành công — CTV nhận {100 - MARKETPLACE_PLATFORM_FEE_PERCENT}%.</li>
            </ul>
            <label className="flex cursor-pointer items-start gap-2 pt-1">
              <input
                type="checkbox"
                checked={platformBillingAck}
                onChange={(e) => setPlatformBillingAck(e.target.checked)}
                disabled={creating}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0077B6] focus:ring-[#0077B6]/30"
              />
              <span className="text-[10px] leading-relaxed text-slate-700 sm:text-[11px]">
                Tôi cam kết xác nhận tuyển thành công trên nền tảng JobShare và thanh toán qua hệ thống (không tự thỏa thuận ngoài sàn).
                <span className="text-red-500"> *</span>
              </span>
            </label>
          </section>

          <section className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 sm:p-3">
            <label className={businessLabelClass}>Hạn tuyển</label>
            <input
              type="date"
              value={recruitmentDeadline}
              onChange={(e) => setRecruitmentDeadline(e.target.value)}
              className={businessInputClass}
            />
          </section>
          </>
          )}
        </div>

        {!showNoJobsEmpty && !jobsAvailability.loading ? (
        <div className="shrink-0 flex flex-col gap-1.5 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
          <p className="text-[9px] leading-relaxed text-slate-500 sm:text-[10px]">
            <strong className="font-semibold text-slate-600">Tạo nhanh:</strong>
            {' '}
            Tạo JD mới bằng AI rồi tự gửi WS duyệt đưa lên sàn (dùng phí thưởng &amp; hạn tuyển đã nhập bên trên).
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className={businessBtnSecondaryClass}
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={creating}
            onClick={handleQuickCreate}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#0077B6]/35 bg-[#e8f4fa] px-3 py-1.5 text-[10px] font-bold text-[#0077B6] transition-colors hover:bg-[#0077B6]/10 disabled:opacity-60 sm:px-4 sm:py-2 sm:text-[11px]"
          >
            Tạo nhanh
          </button>
          <button
            type="button"
            disabled={creating}
            onClick={() => handleCreate()}
            className={businessBtnPrimaryClass}
          >
            {creating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Gửi WS duyệt'
            )}
          </button>
          </div>
        </div>
        ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}

const MARKETPLACE_LISTING_STATUS = {
  DRAFT: 0,
  PENDING_APPROVAL: 1,
  PUBLISHED: 3,
  PAUSED: 4,
  CLOSED: 5,
}

function parseDeadline(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function isDeadlineExpiringSoon(value, withinDays = 7) {
  const d = parseDeadline(value)
  if (!d) return false
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const limit = new Date(now)
  limit.setDate(limit.getDate() + withinDays)
  return d >= now && d <= limit
}

function isDeadlinePast(value) {
  const d = parseDeadline(value)
  if (!d) return false
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return d < now
}

function listingStatusStyle(statusCode, label) {
  const code = Number(statusCode)
  if (code === MARKETPLACE_LISTING_STATUS.PUBLISHED || label === 'Đang chạy') {
    return { bg: '#d1fae5', color: '#059669' }
  }
  if (code === MARKETPLACE_LISTING_STATUS.PENDING_APPROVAL || (label && label.includes('chờ WS'))) {
    return { bg: '#fef9c3', color: '#d97706' }
  }
  if (code === MARKETPLACE_LISTING_STATUS.DRAFT || label === 'Nháp') {
    return { bg: '#f1f5f9', color: '#64748b' }
  }
  if (code === MARKETPLACE_LISTING_STATUS.PAUSED || label === 'Tạm dừng') {
    return { bg: '#e2e8f0', color: '#475569' }
  }
  if (code === MARKETPLACE_LISTING_STATUS.CLOSED || label === 'Đã đóng') {
    return { bg: '#fee2e2', color: '#dc2626' }
  }
  return { bg: '#f1f5f9', color: '#64748b' }
}

const statusColor = (s) => {
  if (s === 'Đang chạy') return { bg: '#d1fae5', color: '#059669' }
  if (s === 'Đang chờ WS duyệt' || s === 'Chờ WS duyệt') return { bg: '#fef9c3', color: '#d97706' }
  if (s === 'Nháp') return { bg: '#f1f5f9', color: '#64748b' }
  if (s === 'Tạm dừng') return { bg: '#e2e8f0', color: '#475569' }
  if (s === 'Đã đóng') return { bg: '#fee2e2', color: '#dc2626' }
  if (s === 'Mới gửi') return { bg: '#dbeafe', color: '#2563eb' }
  if (s === 'Đang xử lý') return { bg: '#ede9fe', color: '#7c3aed' }
  return { bg: '#f1f5f9', color: '#64748b' }
}

function openSanCtvListingDetail(navigate, listingId) {
  if (!listingId || !navigate) return
  navigate(`/business/candidate-sharing/listings/${encodeURIComponent(String(listingId))}`)
}

const Avatar = ({ id, size = 24, bg = '#e0e7ff', color = '#4f46e5' }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: size * 0.38, fontWeight: 700, flexShrink: 0 }}>
    {id}
  </div>
)

const VALID_TABS = ['jobs', 'nominations', 'candidates', 'costs']

function ThreeWayChatPanel({ selectedNomination }) {
  return (
    <div className="flex h-full min-h-0 max-h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {selectedNomination ? (
          <NominationChat
            jobApplicationId={selectedNomination.id}
            userType="business"
            currentStatus={selectedNomination.status}
            introCandidateName={selectedNomination.candidateName || '—'}
            introJobTitle={selectedNomination.jobTitle || '—'}
            mobileHeaderName={selectedNomination.candidateName || 'Chat 3 bên'}
            mobileHeaderAvatar={(selectedNomination.candidateName || '?').charAt(0).toUpperCase()}
            embeddedPanel
            disableBusinessFreeStatusChange
            contactBarVariant="subtle"
          />
        ) : (
          <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-xs text-slate-400">
            Chọn một đơn tiến cử ở bảng bên trái để trao đổi với CTV và WS
          </div>
        )}
      </div>
    </div>
  )
}

const CandidateSharing = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const copy = useMemo(() => getBusinessAppCopy(language), [language])
  const breadcrumbCurrent = useMemo(() => {
    const card = getHomepageSolutionCards(language).find((c) => c.tagId === 'hr-partner-network')
    return card?.title || 'Sàn cộng tác viên tuyển dụng WS'
  }, [language])
  const breadcrumbHome = copy.jobs.breadcrumb.home
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlTab = searchParams.get('tab')
  const urlNominationId = searchParams.get('nominationId')
  const urlListingId = searchParams.get('listingId')
  const urlJobId = searchParams.get('jobId')
  const urlCreate = searchParams.get('create')

  const [tab, setTab] = useState(() => (
    urlTab && VALID_TABS.includes(urlTab) ? urlTab : 'jobs'
  ))
  const [loading, setLoading] = useState(true)
  const [forceDashboard, setForceDashboard] = useState(false)
  const [stats, setStats] = useState(null)
  const [platformOverview, setPlatformOverview] = useState(null)
  const [jobFilterStatus, setJobFilterStatus] = useState('')
  const [jobFilterDeadline, setJobFilterDeadline] = useState('')
  const [jobFilterHasNomination, setJobFilterHasNomination] = useState('')
  const [jobFilterHasInterest, setJobFilterHasInterest] = useState('')
  const [openListingMenuId, setOpenListingMenuId] = useState(null)
  const [listingActionBusyId, setListingActionBusyId] = useState(null)
  const [listings, setListings] = useState([])
  const [nominations, setNominations] = useState([])
  const [settlements, setSettlements] = useState([])
  const [selectedNomination, setSelectedNomination] = useState(null)
  const [confirmingHireId, setConfirmingHireId] = useState(null)
  const [showCreate, setShowCreate] = useState(() => urlCreate === '1' || !!urlJobId)
  const [createJobId, setCreateJobId] = useState(() => urlJobId || '')

  useEffect(() => {
    if (urlCreate === '1' || urlJobId) {
      setShowCreate(true)
      if (urlJobId) setCreateJobId(String(urlJobId))
    }
  }, [urlCreate, urlJobId])

  const closeCreateModal = () => {
    setShowCreate(false)
    if (urlCreate || urlJobId) {
      const next = new URLSearchParams(searchParams)
      next.delete('create')
      next.delete('jobId')
      setSearchParams(next, { replace: true })
    }
  }

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const nomParams = {
        page: 1,
        limit: urlNominationId ? 50 : 10,
        ...(urlListingId ? { listingId: urlListingId } : {}),
      }
      const [dashRes, listRes, nomRes, setRes, platformRes] = await Promise.all([
        apiService.getBusinessCandidateSharingDashboard(),
        apiService.getBusinessCandidateSharingListings({ page: 1, limit: 50 }),
        apiService.getBusinessCandidateSharingNominations(nomParams),
        apiService.getBusinessCandidateSharingSettlements({ page: 1, limit: 50 }),
        apiService.getBusinessCandidateSharingPlatformOverview(),
      ])
      if (platformRes?.success) setPlatformOverview(platformRes.data)
      if (dashRes?.success) {
        setStats(dashRes.data?.stats || null)
        if (dashRes.data?.recentListings?.length) setListings(dashRes.data.recentListings)
      }
      if (listRes?.success) setListings(listRes.data?.listings || [])
      if (nomRes?.success) setNominations(nomRes.data?.nominations || [])
      if (setRes?.success) setSettlements(setRes.data?.settlements || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [urlNominationId, urlListingId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (urlTab && VALID_TABS.includes(urlTab)) setTab(urlTab)
  }, [urlTab])

  useEffect(() => {
    if (!nominations.length) return
    if (urlNominationId) {
      const match = nominations.find((n) => String(n.id) === String(urlNominationId))
      if (match) {
        setSelectedNomination(match)
        return
      }
    }
    if (!selectedNomination) setSelectedNomination(nominations[0])
  }, [nominations, selectedNomination, urlNominationId])

  const statCards = useMemo(() => {
    const s = stats || {}
    return [
      {
        icon: Briefcase,
        iconBg: '#e8f4fa',
        iconColor: BRAND,
        title: 'JD đã đăng',
        value: s.totalListings ?? 0,
        subValue: `${s.activeOnMarket ?? 0} đang chạy`,
      },
      {
        icon: FileText,
        iconBg: '#ffedd5',
        iconColor: '#ea580c',
        title: 'Đơn tiến cử',
        value: s.totalNominations ?? 0,
        subValue: `${s.totalInterests ?? 0} CTV quan tâm`,
      },
      {
        icon: Users,
        iconBg: '#dbeafe',
        iconColor: '#2563eb',
        title: 'Ứng viên đang xử lý',
        value: s.pipelineCandidates ?? 0,
        subValue: null,
      },
      {
        icon: UserCheck,
        iconBg: '#dcfce7',
        iconColor: '#16a34a',
        title: 'Tuyển thành công',
        value: s.hired ?? 0,
        subValue: s.pendingApproval ? `${s.pendingApproval} chờ duyệt` : null,
      },
    ]
  }, [stats])

  const jobsData = useMemo(() => listings.map((l) => {
    const deadlineRaw = l.recruitmentDeadline || l.job?.deadline
    return {
      id: l.id,
      jobId: l.job?.id,
      title: l.job?.title || '—',
      code: l.job?.jobCode || '—',
      referralFee: l.feeLabel || '—',
      status: l.statusLabel,
      statusCode: l.status,
      ctvCount: l.interestCount,
      nominationCount: l.nominationsCount,
      deadline: formatDateShort(deadlineRaw),
      deadlineRaw,
      expiringSoon: isDeadlineExpiringSoon(deadlineRaw),
      deadlinePast: isDeadlinePast(deadlineRaw),
      raw: l,
    }
  }), [listings])

  const filteredJobsData = useMemo(() => jobsData.filter((job) => {
    if (jobFilterStatus !== '' && String(job.statusCode) !== jobFilterStatus) return false
    if (jobFilterDeadline === 'expiring' && !job.expiringSoon) return false
    if (jobFilterDeadline === 'expired' && !job.deadlinePast) return false
    if (jobFilterHasNomination === 'yes' && !(job.nominationCount > 0)) return false
    if (jobFilterHasNomination === 'no' && job.nominationCount > 0) return false
    if (jobFilterHasInterest === 'yes' && !(job.ctvCount > 0)) return false
    if (jobFilterHasInterest === 'no' && job.ctvCount > 0) return false
    return true
  }), [jobsData, jobFilterStatus, jobFilterDeadline, jobFilterHasNomination, jobFilterHasInterest])

  const nominationsData = useMemo(() => nominations.map((n) => ({
    nominationId: n.id,
    id: (n.candidateName || '?').charAt(0).toUpperCase(),
    name: n.candidateName,
    subName: n.candidateSub ? `(${n.candidateSub})` : '',
    position: n.jobTitle,
    posCode: n.jobCode,
    ctv: n.ctvName,
    rating: n.matchScore,
    date: formatDateShort(n.appliedAt),
    status: n.statusLabel,
    statusCode: n.status,
    cvStorageId: n.cvStorageId,
    raw: n,
  })), [nominations])

  const tabs = [
    { key: 'jobs', label: 'Danh sách JD' },
    { key: 'nominations', label: 'Đơn tiến cử' },
    { key: 'candidates', label: 'Ứng viên' },
    { key: 'costs', label: 'Thanh toán & chia phí' },
  ]

  const hasListings = listings.length > 0 || (stats?.totalListings ?? 0) > 0

  const deepLinkDashboard = Boolean(
    urlNominationId
    || urlListingId
    || (urlTab && VALID_TABS.includes(urlTab) && urlTab !== 'jobs'),
  )

  const showOnboarding = !loading && !forceDashboard && !deepLinkDashboard && !hasListings

  const enterMarketplaceDashboard = useCallback(() => {
    setForceDashboard(true)
  }, [])

  useEffect(() => {
    if (deepLinkDashboard) setForceDashboard(true)
  }, [deepLinkDashboard])

  useEffect(() => {
    if (!urlListingId) return
    const nom = urlNominationId
    const path = `/business/candidate-sharing/listings/${encodeURIComponent(String(urlListingId))}`
    navigate(nom ? `${path}?tab=nominations&nominationId=${encodeURIComponent(String(nom))}` : path, { replace: true })
  }, [urlListingId, urlNominationId, navigate])

  useEffect(() => {
    if (deepLinkDashboard) return
    setForceDashboard(false)
  }, [location.key, deepLinkDashboard])

  const openCreateModal = () => setShowCreate(true)

  const handleTabChange = useCallback((key) => {
    setTab(key)
    const next = new URLSearchParams(searchParams)
    if (key === 'jobs') next.delete('tab')
    else next.set('tab', key)
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const candidatesData = useMemo(
    () => nominationsData.filter((n) => PIPELINE_STATUSES.has(Number(n.statusCode))),
    [nominationsData],
  )

  const handleCreatedListing = useCallback(async () => {
    await loadData()
  }, [loadData])

  const handleListingPause = useCallback(async (listingId) => {
    setListingActionBusyId(listingId)
    setOpenListingMenuId(null)
    try {
      const res = await apiService.pauseBusinessCandidateSharingListing(listingId)
      if (res?.success) await loadData()
      else alert(res?.message || 'Không thể tạm dừng JD trên Sàn CTV')
    } catch (e) {
      alert(e?.message || 'Không thể tạm dừng JD trên Sàn CTV')
    } finally {
      setListingActionBusyId(null)
    }
  }, [loadData])

  const handleListingClose = useCallback(async (listingId) => {
    if (!window.confirm('Đóng JD này trên Sàn CTV? CTV sẽ không tiếp cử thêm.')) return
    setListingActionBusyId(listingId)
    setOpenListingMenuId(null)
    try {
      const res = await apiService.closeBusinessCandidateSharingListing(listingId)
      if (res?.success) await loadData()
      else alert(res?.message || 'Không thể đóng JD')
    } catch (e) {
      alert(e?.message || 'Không thể đóng JD')
    } finally {
      setListingActionBusyId(null)
    }
  }, [loadData])

  const handleListingExtend = useCallback(async (job) => {
    const next = window.prompt('Gia hạn hạn tuyển (YYYY-MM-DD):', job.deadlineRaw?.slice(0, 10) || '')
    if (!next) return
    setListingActionBusyId(job.id)
    setOpenListingMenuId(null)
    try {
      const res = await apiService.updateBusinessCandidateSharingListing(job.id, { recruitmentDeadline: next })
      if (res?.success) await loadData()
      else alert(res?.message || 'Không thể gia hạn')
    } catch (e) {
      alert(e?.message || 'Không thể gia hạn')
    } finally {
      setListingActionBusyId(null)
    }
  }, [loadData])

  const handleListingEditFee = useCallback((job) => {
    setOpenListingMenuId(null)
    if (job.jobId) {
      window.open(`${window.location.origin}/business/jobs/${encodeURIComponent(String(job.jobId))}`, '_blank', 'noopener,noreferrer')
    }
  }, [])

  const handleListingSubmitDraft = useCallback(async (listingId) => {
    setListingActionBusyId(listingId)
    setOpenListingMenuId(null)
    try {
      const res = await apiService.submitBusinessCandidateSharingListing(listingId)
      if (res?.success) await loadData()
      else alert(res?.message || 'Không thể gửi duyệt')
    } catch (e) {
      alert(e?.message || 'Không thể gửi duyệt')
    } finally {
      setListingActionBusyId(null)
    }
  }, [loadData])

  const HIRE_CONFIRM_ELIGIBLE = new Set([11, 12])

  const handleConfirmHire = useCallback(async (nomination, e) => {
    e?.stopPropagation?.()
    if (!nomination?.id || confirmingHireId) return
    if (!window.confirm(`Xác nhận "${nomination.candidateName || 'ứng viên'}" đã tuyển thành công?\n\nThao tác này kích hoạt quy trình thanh toán & chia phí trên JobShare.`)) {
      return
    }
    setConfirmingHireId(nomination.id)
    try {
      const res = await apiService.updateBusinessApplicationStatus(nomination.id, { status: 14 })
      if (res?.success) {
        await loadData()
      } else {
        alert(res?.message || 'Không thể xác nhận tuyển thành công')
      }
    } catch (err) {
      alert(err?.message || 'Không thể xác nhận tuyển thành công')
    } finally {
      setConfirmingHireId(null)
    }
  }, [confirmingHireId, loadData])

  const showChatColumn = tab !== 'costs' && tab !== 'jobs'

  const tablePanelClass =
    'ctv-marketplace-table-panel overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm shrink-0'
  const tableBodyScrollClass = 'ctv-marketplace-table-body ctv-scrollbar overflow-x-auto'

  const renderNominationsTable = (list, emptyMessage, { showHireAction = false } = {}) => (
    <div className={tableBodyScrollClass}>
      <table className="w-full min-w-[640px] border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-400">
            {['Ứng viên', 'Vị trí', 'Cộng tác viên', 'Ngày', 'Trạng thái', ...(showHireAction ? [''] : [])].map((h, idx) => (
              <th
                key={h || `action-${idx}`}
                className={`px-3 py-2 font-semibold ${h === 'Ngày' || h === 'Trạng thái' || h === '' ? 'text-center' : 'text-left'}`}
              >
                {h === '' ? 'Thao tác' : h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td colSpan={showHireAction ? 6 : 5} className="px-3 py-16 text-center align-top text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : list.map((n) => {
            const sc = statusColor(n.status)
            const sel = String(selectedNomination?.id) === String(n.nominationId)
            const statusCode = Number(n.statusCode)
            const canConfirmHire = showHireAction && HIRE_CONFIRM_ELIGIBLE.has(statusCode)
            const hireDone = statusCode === 14 || statusCode === 15
            return (
              <tr
                key={n.nominationId}
                className={`cursor-pointer border-t border-slate-100 transition-colors ${sel ? 'bg-[#e8f4fa]/80' : 'hover:bg-slate-50/80'}`}
                onClick={() => setSelectedNomination(n.raw)}
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Avatar id={n.id} size={22} />
                    <div>
                      <div className="font-semibold text-slate-800">{n.name}</div>
                      {n.subName ? <div className="text-[10px] text-slate-400">{n.subName}</div> : null}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium text-slate-800">{n.position}</div>
                  <div className="text-[10px] text-slate-400">{n.posCode}</div>
                </td>
                <td className="px-3 py-2 font-medium text-slate-700">{n.ctv}</td>
                <td className="px-3 py-2 text-center text-slate-500">{n.date}</td>
                <td className="px-3 py-2 text-center">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ color: sc.color, background: sc.bg }}>
                    {n.status}
                  </span>
                </td>
                {showHireAction ? (
                  <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                    {canConfirmHire ? (
                      <button
                        type="button"
                        disabled={confirmingHireId === n.nominationId}
                        onClick={(e) => handleConfirmHire(n.raw, e)}
                        className="rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {confirmingHireId === n.nominationId ? '...' : 'Xác nhận tuyển'}
                      </button>
                    ) : hireDone ? (
                      <span className="text-[10px] font-medium text-emerald-600">Đã xác nhận</span>
                    ) : (
                      <span className="text-[10px] text-slate-300">—</span>
                    )}
                  </td>
                ) : null}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  const marketplaceShell = (
    <>
      <style>{scrollbarStyle}</style>
      <CreateListingModal
        open={showCreate}
        onClose={closeCreateModal}
        onCreated={handleCreatedListing}
        initialJobId={createJobId}
      />
      <div
        className="business-homepage-shell min-h-0 h-full overflow-x-hidden bg-[#f4f6f8] xl:h-full xl:overflow-hidden"
        style={{ fontFamily: PAGE_FONT }}
      >
        <div className="business-homepage-ui flex h-full min-h-0 w-full flex-1 flex-col p-2.5 sm:p-3">
          <BusinessQuickActionsPageLayout onNavigate={navigate} className="min-h-0 flex-1">
            <div className="ctv-marketplace-dashboard flex h-full min-h-0 flex-col overflow-hidden">
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <nav aria-label="Breadcrumb" className="text-[11px] text-slate-500 lg:text-xs">
            <button
              type="button"
              onClick={() => navigate('/business')}
              className="transition hover:text-[#0077B6]"
            >
              {breadcrumbHome}
            </button>
            <span className="mx-1.5 text-slate-400">&gt;</span>
            <span className="font-medium text-slate-700">{breadcrumbCurrent}</span>
          </nav>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0077B6] px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-[#006399] sm:text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Đăng JD lên Sàn CTV
          </button>
        </header>

        <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
          {statCards.map((card) => (
            <CtvKpiCard key={card.title} {...card} />
          ))}
        </div>

        <div className="flex shrink-0 gap-4 overflow-x-auto border-b border-slate-200 scrollbar-hide">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => handleTabChange(t.key)}
              className={`-mb-px shrink-0 border-b-2 px-1 pb-2 text-[11px] font-semibold transition-colors sm:text-xs ${
                tab === t.key
                  ? 'border-[#0077B6] text-[#0077B6]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="ctv-marketplace-body min-h-0 flex-1 overflow-hidden">
            <div
              className={
                showChatColumn
                  ? 'grid h-full min-h-0 grid-cols-1 gap-2 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:gap-3'
                  : 'min-h-0 overflow-hidden'
              }
            >
          <div className="ctv-marketplace-col ctv-scrollbar flex min-h-0 flex-col gap-2.5">
            {tab === 'jobs' && (
              <div className={tablePanelClass}>
                <div className={`${CTV_CARD} flex shrink-0 flex-wrap items-center justify-between gap-2 border-0 px-3 py-2 shadow-none`}>
                  <span className="text-xs font-bold text-slate-900 sm:text-sm">JD đã đăng trên Sàn CTV</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {filteredJobsData.length}/{jobsData.length}
                  </span>
                </div>
                <div className="flex shrink-0 flex-wrap items-end gap-2 border-b border-slate-100 bg-white px-3 py-2">
                  <label className="text-[10px] font-semibold text-slate-600">
                    Trạng thái
                    <select
                      value={jobFilterStatus}
                      onChange={(e) => setJobFilterStatus(e.target.value)}
                      className="mt-0.5 block min-w-[7.5rem] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800"
                    >
                      <option value="">Tất cả</option>
                      <option value="0">Nháp</option>
                      <option value="1">Đang chờ WS duyệt</option>
                      <option value="3">Đang chạy</option>
                      <option value="4">Tạm dừng</option>
                      <option value="5">Đã đóng</option>
                    </select>
                  </label>
                  <label className="text-[10px] font-semibold text-slate-600">
                    Thời hạn
                    <select
                      value={jobFilterDeadline}
                      onChange={(e) => setJobFilterDeadline(e.target.value)}
                      className="mt-0.5 block min-w-[7.5rem] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800"
                    >
                      <option value="">Tất cả</option>
                      <option value="expiring">Sắp hết hạn</option>
                      <option value="expired">Đã hết hạn</option>
                    </select>
                  </label>
                  <label className="text-[10px] font-semibold text-slate-600">
                    Đơn tiến cử
                    <select
                      value={jobFilterHasNomination}
                      onChange={(e) => setJobFilterHasNomination(e.target.value)}
                      className="mt-0.5 block min-w-[6.5rem] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800"
                    >
                      <option value="">Tất cả</option>
                      <option value="yes">Có</option>
                      <option value="no">Không</option>
                    </select>
                  </label>
                  <label className="text-[10px] font-semibold text-slate-600">
                    CTV quan tâm
                    <select
                      value={jobFilterHasInterest}
                      onChange={(e) => setJobFilterHasInterest(e.target.value)}
                      className="mt-0.5 block min-w-[6.5rem] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800"
                    >
                      <option value="">Tất cả</option>
                      <option value="yes">Có</option>
                      <option value="no">Không</option>
                    </select>
                  </label>
                </div>
                <div className={tableBodyScrollClass}>
                  <table className="w-full min-w-[800px] border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-400">
                        {['JD', 'Phí giới thiệu', 'Trạng thái', 'CTV', 'Đơn tiến cử', 'Hạn', ''].map((h) => (
                          <th
                            key={h || 'actions'}
                            className={`px-2 py-1.5 font-semibold sm:px-3 ${h === 'JD' || h === 'Phí giới thiệu' ? 'text-left' : 'text-center'}`}
                          >
                            {h === '' ? 'Thao tác' : h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredJobsData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-3 py-10 text-center align-top text-[11px] text-slate-400">
                            {jobsData.length === 0
                              ? 'Chưa có JD trên Sàn CTV. Bấm "+ Đăng JD lên Sàn CTV" để bắt đầu.'
                              : 'Không có JD khớp bộ lọc.'}
                          </td>
                        </tr>
                      ) : filteredJobsData.map((job) => {
                        const sc = listingStatusStyle(job.statusCode, job.status)
                        const busy = listingActionBusyId === job.id
                        const openDetail = () => openSanCtvListingDetail(navigate, job.id)
                        return (
                          <tr
                            key={job.id}
                            role={job.jobId ? 'button' : undefined}
                            tabIndex={job.jobId ? 0 : undefined}
                            onClick={job.jobId ? openDetail : undefined}
                            onKeyDown={job.jobId ? (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                openDetail()
                              }
                            } : undefined}
                            className={`border-t border-slate-100 hover:bg-slate-50/70 ${job.jobId ? 'cursor-pointer' : ''}`}
                          >
                            <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                              <div className="font-semibold text-slate-800">{job.title}</div>
                              <div className="text-[10px] text-slate-400">{job.code}</div>
                            </td>
                            <td className="max-w-[200px] px-2 py-1.5 text-[11px] leading-snug text-slate-600 sm:px-3">
                              <span className="line-clamp-2" title={job.referralFee}>
                                {formatReferralFeeCell(job.referralFee)}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-center sm:px-3">
                              <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold" style={{ color: sc.color, background: sc.bg }}>
                                {job.status}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-center font-medium tabular-nums text-slate-700 sm:px-3">{job.ctvCount ?? '—'}</td>
                            <td className="px-2 py-1.5 text-center font-medium tabular-nums text-slate-700 sm:px-3">{job.nominationCount ?? '—'}</td>
                            <td className="px-2 py-1.5 text-center sm:px-3">
                              <div className="text-slate-600">{job.deadline}</div>
                              {job.expiringSoon ? (
                                <div className="mt-0.5 inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-700">
                                  <AlertTriangle className="h-3 w-3" aria-hidden />
                                  Sắp hết hạn
                                </div>
                              ) : null}
                            </td>
                            <td className="relative px-2 py-1.5 text-center sm:px-3" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => setOpenListingMenuId((prev) => (prev === job.id ? null : job.id))}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                aria-label="Thao tác"
                              >
                                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                              </button>
                              {openListingMenuId === job.id ? (
                                <div className="absolute right-2 top-full z-20 mt-1 min-w-[10.5rem] rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg sm:right-3">
                                  {job.jobId ? (
                                    <button type="button" className="block w-full px-3 py-1.5 text-left text-[10px] font-medium text-slate-700 hover:bg-slate-50" onClick={() => openDetail()}>
                                      Xem chi tiết
                                    </button>
                                  ) : null}
                                  {job.jobId ? (
                                    <button type="button" className="block w-full px-3 py-1.5 text-left text-[10px] font-medium text-slate-700 hover:bg-slate-50" onClick={() => handleListingEditFee(job)}>
                                      Chỉnh phí giới thiệu
                                    </button>
                                  ) : null}
                                  {Number(job.statusCode) === MARKETPLACE_LISTING_STATUS.DRAFT ? (
                                    <button type="button" className="block w-full px-3 py-1.5 text-left text-[10px] font-medium text-[#0077B6] hover:bg-slate-50" onClick={() => handleListingSubmitDraft(job.id)}>
                                      Gửi WS duyệt
                                    </button>
                                  ) : null}
                                  {Number(job.statusCode) === MARKETPLACE_LISTING_STATUS.PUBLISHED ? (
                                    <button type="button" className="block w-full px-3 py-1.5 text-left text-[10px] font-medium text-slate-700 hover:bg-slate-50" onClick={() => handleListingPause(job.id)}>
                                      Tạm dừng
                                    </button>
                                  ) : null}
                                  {[MARKETPLACE_LISTING_STATUS.PUBLISHED, MARKETPLACE_LISTING_STATUS.PAUSED].includes(Number(job.statusCode)) ? (
                                    <button type="button" className="block w-full px-3 py-1.5 text-left text-[10px] font-medium text-rose-700 hover:bg-rose-50" onClick={() => handleListingClose(job.id)}>
                                      Đóng JD
                                    </button>
                                  ) : null}
                                  {(job.expiringSoon || Number(job.statusCode) === MARKETPLACE_LISTING_STATUS.PUBLISHED) ? (
                                    <button type="button" className="block w-full px-3 py-1.5 text-left text-[10px] font-medium text-amber-800 hover:bg-amber-50" onClick={() => handleListingExtend(job)}>
                                      Gia hạn
                                    </button>
                                  ) : null}
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'nominations' && (
              <div className={tablePanelClass}>
                <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
                  <span className="text-xs font-bold text-slate-900 sm:text-sm">Đơn tiến cử</span>
                  <span className="rounded-full bg-[#e8f4fa] px-1.5 py-0.5 text-[10px] font-bold text-[#0077B6]">{nominationsData.length}</span>
                </div>
                {renderNominationsTable(nominationsData, 'Chưa có đơn tiến cử', { showHireAction: true })}
              </div>
            )}

            {tab === 'candidates' && (
              <div className={tablePanelClass}>
                <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
                  <span className="text-xs font-bold text-slate-900 sm:text-sm">Ứng viên đang xử lý</span>
                  <span className="rounded-full bg-[#e8f4fa] px-1.5 py-0.5 text-[10px] font-bold text-[#0077B6]">{candidatesData.length}</span>
                </div>
                {renderNominationsTable(candidatesData, 'Chưa có ứng viên trong pipeline', { showHireAction: true })}
              </div>
            )}

            {tab === 'costs' && (
              <div className={tablePanelClass}>
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2.5">
                  <span className="text-xs font-bold text-slate-900 sm:text-sm">Thanh toán &amp; chia phí</span>
                  <span className="rounded-full bg-[#e8f4fa] px-1.5 py-0.5 text-[10px] font-bold text-[#0077B6]">{settlements.length}</span>
                </div>
                {settlements.length === 0 ? (
                  <div className={`${tableBodyScrollClass} flex items-start justify-center px-3 py-16 text-center text-xs text-slate-400`}>
                    Chưa có giao dịch thanh toán
                  </div>
                ) : (
                  <div className={tableBodyScrollClass}>
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-400">
                          {['Ứng viên', 'Vị trí', 'Trạng thái', 'Số tiền (DN → WS)', 'Ngày'].map((h) => (
                            <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {settlements.map((set) => (
                          <tr key={set.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                            <td className="px-3 py-2 font-semibold text-slate-800">{set.candidateName || '—'}</td>
                            <td className="px-3 py-2 text-slate-600">{set.jobTitle} {set.jobCode ? `(${set.jobCode})` : ''}</td>
                            <td className="px-3 py-2">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${set.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {set.statusLabel}
                              </span>
                            </td>
                            <td className="px-3 py-2 tabular-nums font-semibold text-slate-800">{Number(set.totalAmountBusiness || 0).toLocaleString('vi-VN')}đ</td>
                            <td className="px-3 py-2 text-slate-500">{formatDateShort(set.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {showChatColumn && (
            <div className="ctv-marketplace-col ctv-scrollbar flex min-h-0 flex-col">
              <div className="flex min-h-[min(380px,48vh)] flex-1 flex-col lg:min-h-[320px]">
                <ThreeWayChatPanel selectedNomination={selectedNomination} />
              </div>
            </div>
          )}
            </div>
              </div>
            </div>
            </div>
          </BusinessQuickActionsPageLayout>
        </div>
      </div>
    </>
  )

  if (loading) {
    return (
      <>
        <style>{scrollbarStyle}</style>
        <CreateListingModal
          open={showCreate}
          onClose={closeCreateModal}
          onCreated={handleCreatedListing}
          initialJobId={createJobId}
        />
        <div className="h-full min-h-0 w-full flex items-center justify-center bg-slate-50">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin" /> Đang tải sàn CTV...
          </div>
        </div>
      </>
    )
  }

  if (showOnboarding) {
    return (
      <>
        <style>{scrollbarStyle}</style>
        <CreateListingModal
          open={showCreate}
          onClose={closeCreateModal}
          onCreated={handleCreatedListing}
          initialJobId={createJobId}
        />
        <div className="business-homepage-shell min-h-0 h-full overflow-x-hidden bg-[#f4f6f8] xl:h-full xl:overflow-hidden" style={{ fontFamily: PAGE_FONT }}>
          <div className="business-homepage-ui flex h-full min-h-0 w-full flex-1 flex-col p-2.5 sm:p-3">
            <BusinessQuickActionsPageLayout onNavigate={navigate}>
              <OnboardingView
                hasMarketplaceData={hasListings}
                platformOverview={platformOverview}
                onCreate={openCreateModal}
                onViewDetails={enterMarketplaceDashboard}
                onNavigate={navigate}
                breadcrumbHome={breadcrumbHome}
                breadcrumbCurrent={breadcrumbCurrent}
              />
            </BusinessQuickActionsPageLayout>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="h-full min-h-0 max-h-full overflow-hidden">
      {marketplaceShell}
    </div>
  )
}

export default CandidateSharing