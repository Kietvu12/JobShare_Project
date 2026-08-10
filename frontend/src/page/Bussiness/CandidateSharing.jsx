import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import {
  ChevronRight, Plus, Loader2, X, Network, Handshake, Shield, BarChart3,
  FileText, Settings, Users, History, BookOpen, AlertTriangle, ArrowRight, Search, Briefcase, Sparkles,
} from 'lucide-react'
import apiService from '../../services/api'
import NominationChat from '../../component/Chat/NominationChat'
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
import BusinessQuickActionsPanel, { DEFAULT_BUSINESS_QUICK_ACTIONS } from '../../component/Bussiness/BusinessQuickActionsPanel.jsx'

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
`

const valueCards = [
  {
    icon: Network,
    color: 'text-[#0077B6]',
    bg: 'bg-[#e8f4fa]',
    title: 'Mở rộng mạng lưới',
    desc: 'Kết nối hàng nghìn CTV HR Partner trên toàn quốc, mở rộng nguồn ứng viên nhanh chóng.',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop',
  },
  {
    icon: Handshake,
    color: 'text-[#0077B6]',
    bg: 'bg-[#e8f4fa]',
    title: 'Tuyển dụng hiệu quả',
    desc: 'CTV chuyên nghiệp tìm kiếm và tiến cử ứng viên phù hợp, giảm tải cho đội HR.',
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=200&fit=crop',
  },
  {
    icon: Shield,
    color: 'text-[#0077B6]',
    bg: 'bg-[#e8f4fa]',
    title: 'Đảm bảo thông tin',
    desc: 'JobShare là trung gian đảm bảo bảo mật thông tin doanh nghiệp và ứng viên.',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=200&fit=crop',
  },
  {
    icon: BarChart3,
    color: 'text-[#0077B6]',
    bg: 'bg-[#e8f4fa]',
    title: 'Minh bạch & Tối ưu',
    desc: 'Theo dõi tiến độ, phí thưởng và hiệu quả tuyển dụng minh bạch trên một nền tảng.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop',
  },
]

const processSteps = [
  { num: '01', title: 'Chọn JD của bạn', desc: 'Chọn job description sẵn có hoặc tạo JD mới trên JobShare.' },
  { num: '02', title: 'Thiết lập phí', desc: 'Cài đặt phí thưởng CTV bạn sẵn sàng trả cho mỗi lần tuyển thành công.' },
  { num: '03', title: 'Đăng lên Sàn HR', desc: 'Gửi duyệt WS — hệ thống tự động kết nối với CTV phù hợp.' },
  { num: '04', title: 'CTV tiếp cận & ứng tuyển', desc: 'CTV tiến cử trên JobShare — email DN chỉ là thông báo, không thay pipeline chính.' },
]

const highlightFeatures = [
  { icon: FileText, title: 'Đăng JD dễ dàng', desc: 'Chọn JD có sẵn, thiết lập phí và đăng lên sàn chỉ vài bước.' },
  { icon: Settings, title: 'Thiết lập phí linh hoạt', desc: '% thu nhập năm, cố định hoặc theo tháng lương — một bước, không JLPT.' },
  { icon: Users, title: 'Kết nối CTV chất lượng', desc: 'Mạng lưới CTV HR Partner được WS kiểm duyệt và đánh giá.' },
  { icon: Shield, title: 'Bảo vệ & minh bạch', desc: 'Thanh toán qua JobShare, hợp đồng và lịch sử giao dịch rõ ràng.' },
]

const onboardNotifications = [
  { dot: 'bg-emerald-500', text: 'Chào mừng bạn đến với Sàn HR JobShare!', time: 'Vừa xong' },
  { dot: 'bg-[#0077B6]', text: 'Đăng job đầu tiên để kết nối với CTV HR Partner', time: '1 phút trước' },
  { dot: 'bg-blue-500', text: 'Thiết lập phí thưởng CTV trước khi đăng tin', time: '2 phút trước' },
  { dot: 'bg-rose-500', text: 'WS sẽ duyệt tin trước khi hiển thị trên sàn', time: '3 phút trước', warn: true },
]

const onboardNews = [
  { title: 'Mở rộng kết nối tuyển dụng với CTV trên JobShare', date: '20/05/2024', img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=200&h=150&fit=crop' },
  { title: 'Hướng dẫn thiết lập phí thưởng CTV hiệu quả', date: '18/05/2024', img: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=200&h=150&fit=crop' },
  { title: 'Quy trình duyệt tin và tiến cử ứng viên trên Sàn HR', date: '15/05/2024', img: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=200&h=150&fit=crop' },
]

function OnboardingSidebar({ onNavigate }) {
  const handleAction = (item) => {
    if (item.path) onNavigate(item.path)
  }

  return (
    <div className="flex min-h-0 flex-col gap-3 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:pr-0.5 business-homepage-scroll scrollbar-hide">
      <BusinessQuickActionsPanel
        actions={DEFAULT_BUSINESS_QUICK_ACTIONS}
        onActionClick={handleAction}
      />

      <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xs font-bold text-slate-900">
            Thông báo
            <span className="rounded-full bg-[#0077B6] px-1.5 py-0.5 text-[9px] font-bold text-white">4</span>
          </h2>
          <button type="button" className="shrink-0 text-[10px] font-semibold text-[#0077B6]">Xem tất cả</button>
        </div>
        <div className="flex flex-col divide-y divide-slate-100">
          {onboardNotifications.map((n) => (
            <div key={n.text} className="flex items-start gap-2.5 py-3 first:pt-0 last:pb-0">
              {n.warn ? (
                <AlertTriangle className="mt-1 h-3.5 w-3.5 shrink-0 text-rose-500" />
              ) : (
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.dot}`} />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] leading-relaxed text-slate-700">{n.text}</p>
                <p className="mt-1.5 text-[10px] leading-none text-slate-400">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-xs font-bold text-slate-900">Tin tức &amp; Insights</h2>
          <button type="button" className="shrink-0 text-[10px] font-semibold text-[#0077B6]">Xem tất cả</button>
        </div>
        <div className="flex flex-col gap-3">
          {onboardNews.map((n) => (
            <div key={n.title} className="flex gap-2.5">
              <img src={n.img} alt="" className="h-10 w-14 shrink-0 rounded-md object-cover" />
              <div className="min-w-0">
                <p className="line-clamp-2 text-[11px] font-medium leading-relaxed text-slate-800">{n.title}</p>
                <p className="mt-1.5 text-[10px] text-slate-400">{n.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function OnboardingView({ hasMarketplaceData, onCreate, onViewDetails }) {
  const handleCta = () => {
    if (hasMarketplaceData) onViewDetails()
    else onCreate()
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4 2xl:gap-5 min-w-0 xl:flex-1 xl:min-h-0 xl:h-full">
      <div className="shrink-0">
        <h1 className="text-lg sm:text-xl 2xl:text-2xl font-bold text-slate-800 leading-snug">
          Sàn HR – Kết nối tuyển dụng, Tiên phong hiệu quả
        </h1>
        <p className="text-xs sm:text-sm 2xl:text-base text-slate-500 mt-0.5 sm:mt-1 max-w-4xl leading-relaxed">
          JobShare Sàn HR kết nối doanh nghiệp với hàng nghìn CTV HR Partner chuyên nghiệp trên toàn quốc.
          Nền tảng trung gian đảm bảo bảo mật thông tin và minh bạch trong suốt quá trình tuyển dụng.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3 2xl:gap-4 items-stretch shrink-0">
        {valueCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.title} className="bg-white rounded-lg sm:rounded-xl border border-slate-100 overflow-hidden shadow-sm flex flex-col min-w-0">
              <div className="aspect-[2/1] max-h-28 sm:max-h-32 2xl:max-h-36 overflow-hidden">
                <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-2.5 sm:p-3 flex flex-col gap-1 flex-1">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${card.color}`} />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">{card.title}</h3>
                <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed">{card.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-lg sm:rounded-xl border border-slate-100 p-3 sm:p-4 2xl:p-5 shrink-0">
        <h2 className="text-xs sm:text-sm font-bold text-slate-800 mb-3 sm:mb-4">Quy trình đăng tuyển trên Sàn HR</h2>
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

      <div className="shrink-0">
        <h2 className="text-xs sm:text-sm font-bold text-slate-800 mb-2 sm:mb-3">Tính năng nổi bật</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {highlightFeatures.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="bg-white rounded-lg sm:rounded-xl border border-slate-100 p-2.5 sm:p-3 flex gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#e8f4fa] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#0077B6]" />
                </div>
                <div>
                  <h3 className="text-[11px] sm:text-xs font-bold text-slate-800">{f.title}</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-lg sm:rounded-xl border border-[#cce5f0]/80 bg-[#e8f4fa]/90 px-3 py-3 sm:px-4 sm:py-4 2xl:px-5 2xl:py-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 shrink-0 xl:mt-auto">
        <div className="hidden sm:block flex-shrink-0 w-24 h-20 sm:w-28 sm:h-24 rounded-lg overflow-hidden bg-white/80 border border-[#cce5f0]/80">
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=200&fit=crop"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm sm:text-base 2xl:text-lg font-bold text-slate-800">Sẵn sàng mở rộng đội ngũ của bạn?</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
            {hasMarketplaceData
              ? 'Theo dõi job trên sàn, đơn tiến cử và trao đổi với CTV HR Partner ngay trên JobShare.'
              : 'Đăng tin ngay để kết nối với hàng nghìn CTV HR Partner trên JobShare.'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCta}
          className="flex-shrink-0 inline-flex items-center justify-center gap-2 bg-[#0077B6] hover:bg-[#006399] text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 transition-colors w-full sm:w-auto"
        >
          {hasMarketplaceData ? 'Xem chi tiết' : 'Đăng tin ngay'}
          <ArrowRight className="w-4 h-4" />
        </button>
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

const businessModalTitleClass = 'text-xs font-bold leading-snug text-slate-900 sm:text-[13px]'
const businessModalSubtitleClass = 'mt-1 text-[11px] font-medium leading-relaxed text-slate-600 sm:text-xs'
const businessLabelClass = 'block text-[11px] font-semibold text-slate-700 mb-1.5 sm:text-xs'
const businessInputClass =
  'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[11px] sm:text-xs text-slate-900 outline-none focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/25'
const businessBtnSecondaryClass =
  'w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 sm:py-2.5'
const businessBtnPrimaryClass =
  'w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#0077B6] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-[#0077B6]/15 transition-colors hover:bg-[#006399] disabled:opacity-60 sm:py-2.5'

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

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape' && !creating) onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, creating])

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
    navigate('/business/jobs?quickMarketplace=1')
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
        className="business-homepage-shell relative z-10 flex w-full max-w-3xl max-h-[90vh] min-h-0 justify-center pointer-events-none"
        style={{ fontFamily: PAGE_FONT }}
      >
        <div className="business-homepage-ui pointer-events-auto relative flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl antialiased">
        <button
          type="button"
          onClick={() => !creating && onClose?.()}
          disabled={creating}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          aria-label="Đóng hộp thoại"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>

        <div className="shrink-0 border-b border-slate-100 px-5 pb-4 pt-5 pr-12">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#0077B6]/20 bg-[#0077B6]/5"
              aria-hidden
            >
              <Briefcase className="h-4 w-4 text-[#0077B6]" strokeWidth={2} />
            </div>
            <div className="min-w-0 pt-0.5">
              <h2 id="create-listing-modal-title" className={businessModalTitleClass}>
                Đăng JD lên Sàn HR
              </h2>
              <p className={businessModalSubtitleClass}>
                Chọn công việc, thiết lập phí thưởng CTV và gửi WS duyệt.
              </p>
            </div>
          </div>
        </div>

        <div className="ctv-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <section className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 sm:p-4">
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

          <section className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 sm:p-4">
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

          <section className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4 space-y-2">
            <p className="text-[11px] font-bold text-slate-800 sm:text-xs">Quy tắc tiến cử trên Sàn HR</p>
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

          <section className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 sm:p-4">
            <label className={businessLabelClass}>Hạn tuyển</label>
            <input
              type="date"
              value={recruitmentDeadline}
              onChange={(e) => setRecruitmentDeadline(e.target.value)}
              className={businessInputClass}
            />
          </section>
        </div>

        <div className="shrink-0 flex flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-4">
          <p className="text-[10px] leading-relaxed text-slate-500 sm:text-[11px]">
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-[#0077B6]/35 bg-[#e8f4fa] px-4 py-2 text-xs font-bold text-[#0077B6] transition-colors hover:bg-[#0077B6]/10 disabled:opacity-60 sm:py-2.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
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
        </div>
      </div>
    </div>,
    document.body,
  )
}

const statusColor = (s) => {
  if (s === 'Đang chạy') return { bg: '#d1fae5', color: '#059669' }
  if (s === 'Chờ WS duyệt') return { bg: '#fef9c3', color: '#d97706' }
  if (s === 'Tạm dừng') return { bg: '#f1f5f9', color: '#64748b' }
  if (s === 'Đã đóng') return { bg: '#fee2e2', color: '#dc2626' }
  if (s === 'Mới gửi') return { bg: '#dbeafe', color: '#2563eb' }
  if (s === 'Đang xử lý') return { bg: '#ede9fe', color: '#7c3aed' }
  return { bg: '#f1f5f9', color: '#64748b' }
}

const Avatar = ({ id, size = 24, bg = '#e0e7ff', color = '#4f46e5' }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: size * 0.38, fontWeight: 700, flexShrink: 0 }}>
    {id}
  </div>
)

const VALID_TABS = ['jobs', 'nominations', 'candidates', 'costs']

const HOW_IT_WORKS_STEPS = [
  'Chọn job & thiết lập phí thưởng (hiển thị rõ DN trả / CTV nhận 70%)',
  'Gửi đề xuất cho WS duyệt — cam kết xác nhận tuyển dụng trên nền tảng',
  'Sau khi WS duyệt — job hiện trên sàn cho CTV đủ điểm',
  'CTV tiến cử qua JobShare (email chỉ là thông báo)',
  'Tuyển thành công → DN xác nhận trên sàn → Thanh toán & chia phí',
]

function MarketplaceHowItWorks() {
  return (
    <div className="shrink-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-3 py-2">
        <span className="text-xs font-bold text-slate-900">Cách hoạt động</span>
      </div>
      <div className="flex flex-col gap-2 px-3 py-2.5">
        {HOW_IT_WORKS_STEPS.map((step, i) => (
          <div key={step} className="flex items-start gap-2">
            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#e8f4fa] text-[9px] font-bold text-[#0077B6]">
              {i + 1}
            </div>
            <span className="text-[11px] leading-snug text-slate-600">{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ThreeWayChatPanel({ selectedNomination }) {
  return (
    <div className="flex h-full min-h-0 max-h-full flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
      <div className="shrink-0 border-b border-slate-100 px-3 py-2.5">
        <h3 className="text-xs font-bold text-slate-900 sm:text-sm">Trao đổi 3 bên</h3>
        <p className="text-[10px] text-slate-500">Doanh nghiệp · JobShare WS · CTV</p>
      </div>
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
      const [dashRes, listRes, nomRes, setRes] = await Promise.all([
        apiService.getBusinessCandidateSharingDashboard(),
        apiService.getBusinessCandidateSharingListings({ page: 1, limit: 50 }),
        apiService.getBusinessCandidateSharingNominations(nomParams),
        apiService.getBusinessCandidateSharingSettlements({ page: 1, limit: 50 }),
      ])
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
      { label: 'Job đã đăng sàn', value: s.totalListings ?? 0, change: `${s.activeOnMarket ?? 0} đang chạy`, changeColor: '#64748b', linkLabel: 'Xem tất cả' },
      { label: 'Đơn tiến cử', value: s.totalNominations ?? 0, change: `${s.totalInterests ?? 0} CTV quan tâm`, changeColor: '#10b981', linkLabel: 'Xem chi tiết' },
      { label: 'Ứng viên đang xử lý', value: s.pipelineCandidates ?? 0, change: null, changeColor: '#3b82f6', linkLabel: 'Xem chi tiết' },
      { label: 'Tuyển thành công', value: s.hired ?? 0, change: s.pendingApproval ? `${s.pendingApproval} chờ duyệt` : null, changeColor: '#10b981', linkLabel: 'Xem báo cáo' },
    ]
  }, [stats])

  const jobsData = useMemo(() => listings.map((l) => ({
    id: l.id,
    jobId: l.job?.id,
    title: l.job?.title || '—',
    code: l.job?.jobCode || '—',
    ctvPayment: l.feeLabel,
    status: l.statusLabel,
    ctvCount: l.interestCount,
    candidateCount: l.nominationsCount,
    deadline: formatDateShort(l.recruitmentDeadline || l.job?.deadline),
    raw: l,
  })), [listings])

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
    { key: 'jobs', label: 'Job trên sàn' },
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

  const showOnboarding = !loading && !forceDashboard && !deepLinkDashboard

  const enterMarketplaceDashboard = useCallback(() => {
    setForceDashboard(true)
  }, [])

  useEffect(() => {
    if (deepLinkDashboard) setForceDashboard(true)
  }, [deepLinkDashboard])

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

  const statTabByIndex = ['jobs', 'nominations', 'candidates', 'costs']

  const handleCreatedListing = useCallback(async () => {
    await loadData()
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

  const showChatColumn = tab !== 'costs'

  const tablePanelClass =
    'ctv-marketplace-table-panel overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm shrink-0'
  const tableBodyScrollClass = 'ctv-marketplace-table-body ctv-scrollbar overflow-x-auto'

  const renderNominationsTable = (list, emptyMessage, { showHireAction = false } = {}) => (
    <div className={tableBodyScrollClass}>
      <table className="w-full min-w-[640px] border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-400">
            {['Ứng viên', 'Vị trí', 'CTV tiến cử', 'Ngày', 'Trạng thái', ...(showHireAction ? [''] : [])].map((h, idx) => (
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
      <div className="business-homepage-shell ctv-marketplace-dashboard bg-[#f4f6f8]" style={{ fontFamily: PAGE_FONT }}>
        <div className="business-homepage-ui flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200/90 bg-white px-3 py-2 sm:px-4">
          <div className="min-w-0">
            <h1 className="text-sm font-bold leading-tight text-slate-900">Sàn CTV</h1>
            <p className="hidden text-[10px] text-slate-500 sm:block">Job · tiến cử · chat 3 bên</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#0077B6] px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm shadow-[#0077B6]/15 transition-colors hover:bg-[#006399] sm:px-3 sm:py-1.5 sm:text-[11px]"
          >
            <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Đưa job lên sàn
          </button>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-1.5 border-b border-slate-200/90 bg-white px-2 py-1.5 sm:grid-cols-4 sm:gap-2 sm:px-3 sm:py-2">
          {statCards.map((card, i) => (
            <button
              key={card.label}
              type="button"
              onClick={() => handleTabChange(statTabByIndex[i] || 'jobs')}
              className="rounded-md border border-slate-200/80 bg-slate-50/70 px-2 py-1.5 text-left transition-colors hover:border-[#cce5f0] hover:bg-[#e8f4fa]/60 sm:px-2.5"
            >
              <div className="truncate text-[9px] font-medium leading-tight text-slate-500 sm:text-[10px]">{card.label}</div>
              <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
                <span className="text-base font-bold tabular-nums leading-none text-slate-900 sm:text-lg">{card.value}</span>
                {card.change && (
                  <span className="text-[9px] font-semibold leading-tight sm:text-[10px]" style={{ color: card.changeColor }}>
                    {card.changeColor === '#10b981' ? '↑ ' : ''}{card.change}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="shrink-0 border-b border-slate-200/90 bg-white px-2 pb-0.5 sm:px-3">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide sm:gap-5">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => handleTabChange(t.key)}
                className={`shrink-0 border-b-2 py-2 text-[11px] font-semibold transition-colors sm:text-xs ${
                  tab === t.key
                    ? 'border-[#0077B6] text-[#0077B6]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div
          className={
            showChatColumn
              ? 'grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] items-stretch gap-3 overflow-hidden px-3 pb-3 pt-3 sm:gap-3.5 sm:px-4 sm:pb-4 sm:pt-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] xl:grid-rows-1'
              : 'min-h-0 flex-1 overflow-hidden px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4'
          }
        >
          <div className="ctv-marketplace-col ctv-scrollbar flex min-h-0 flex-col gap-2.5">
            {tab === 'jobs' && (
              <>
                <div className={tablePanelClass}>
                  <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2.5">
                    <span className="text-xs font-bold text-slate-900 sm:text-sm">Job đang đăng trên sàn</span>
                    <span className="rounded-full bg-[#e8f4fa] px-1.5 py-0.5 text-[10px] font-bold text-[#0077B6]">{jobsData.length}</span>
                  </div>
                  <div className={tableBodyScrollClass}>
                    <table className="w-full min-w-[720px] border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-400">
                          {['Vị trí', 'Phí thưởng CTV', 'Trạng thái', 'CTV', 'Đơn', 'Hạn'].map((h) => (
                            <th key={h} className={`px-3 py-2 font-semibold ${h === 'Vị trí' || h === 'Phí thưởng CTV' ? 'text-left' : 'text-center'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {jobsData.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-12 text-center align-top text-slate-400">
                              Chưa có job trên sàn. Bấm &quot;Đưa job lên sàn&quot; để bắt đầu.
                            </td>
                          </tr>
                        ) : jobsData.map((job) => {
                          const sc = statusColor(job.status)
                          const openJobInManagement = () => {
                            if (!job.jobId) return
                            navigate(`/business/jobs?jobId=${encodeURIComponent(String(job.jobId))}`)
                          }
                          return (
                            <tr
                              key={job.id}
                              role={job.jobId ? 'button' : undefined}
                              tabIndex={job.jobId ? 0 : undefined}
                              onClick={job.jobId ? openJobInManagement : undefined}
                              onKeyDown={job.jobId ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openJobInManagement() } } : undefined}
                              className={`border-t border-slate-100 hover:bg-slate-50/60 ${job.jobId ? 'cursor-pointer' : ''}`}
                            >
                              <td className="px-3 py-2">
                                <div className="font-semibold text-slate-800">{job.title}</div>
                                <div className="text-[10px] text-slate-400">{job.code}</div>
                              </td>
                              <td className="whitespace-pre-line px-3 py-2 text-[11px] text-slate-600">{job.ctvPayment}</td>
                              <td className="px-3 py-2 text-center">
                                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ color: sc.color, background: sc.bg }}>{job.status}</span>
                              </td>
                              <td className="px-3 py-2 text-center font-medium text-slate-700">{job.ctvCount ?? '—'}</td>
                              <td className="px-3 py-2 text-center font-medium text-slate-700">{job.candidateCount ?? '—'}</td>
                              <td className="px-3 py-2 text-center text-slate-500">{job.deadline}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className={tablePanelClass}>
                  <div className="shrink-0 border-b border-slate-100 px-3 py-2.5">
                    <span className="text-xs font-bold text-slate-900">Đơn tiến cử — chọn để chat</span>
                  </div>
                  {renderNominationsTable(nominationsData, 'Chưa có đơn tiến cử', { showHireAction: true })}
                </div>
              </>
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
            <div className="ctv-marketplace-col ctv-scrollbar flex min-h-0 flex-col gap-2.5">
              <div className="flex min-h-[min(420px,52vh)] min-h-0 flex-1 flex-col xl:min-h-[360px]">
                <ThreeWayChatPanel selectedNomination={selectedNomination} />
              </div>
              {tab === 'jobs' && <MarketplaceHowItWorks />}
            </div>
          )}
        </div>
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
          <div className="business-homepage-ui w-full min-h-0 p-3 sm:p-4 2xl:p-5 xl:h-full xl:flex xl:flex-col">
            <div className="w-full xl:flex-1 xl:min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] gap-3 sm:gap-4 2xl:gap-5 items-stretch">
              <div className="flex flex-col min-w-0 xl:overflow-y-auto xl:min-h-0 xl:h-full xl:pr-1 scrollbar-hide">
                <OnboardingView
                  hasMarketplaceData={hasListings}
                  onCreate={openCreateModal}
                  onViewDetails={enterMarketplaceDashboard}
                />
              </div>
              <OnboardingSidebar onNavigate={navigate} />
            </div>
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