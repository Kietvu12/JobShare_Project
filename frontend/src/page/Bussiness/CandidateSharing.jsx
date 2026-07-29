import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import {
  ChevronRight, Plus, Loader2, X, Network, Handshake, Shield, BarChart3,
  FileText, Settings, Users, History, BookOpen, AlertTriangle, ArrowRight,
} from 'lucide-react'
import apiService from '../../services/api'
import NominationChat from '../../component/Chat/NominationChat'
import JobCommissionEditor, { validateCommissionForMarketplace } from '../../component/Bussiness/JobCommissionEditor'
import { isPersistableJobValue } from '../../utils/jobCommissionUi'
import {
  SIMPLE_FEE_MODES,
  parseJobCommissionToSimple,
  simpleCommissionToPayload,
} from '../../utils/businessSimpleCommission'
import { normalizeJobSalaryCurrency } from '../../utils/jobSalaryCurrency'

const scrollbarStyle = `
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
`

const valueCards = [
  {
    icon: Network,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    title: 'Mở rộng mạng lưới',
    desc: 'Kết nối hàng nghìn CTV HR Partner trên toàn quốc, mở rộng nguồn ứng viên nhanh chóng.',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop',
  },
  {
    icon: Handshake,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    title: 'Tuyển dụng hiệu quả',
    desc: 'CTV chuyên nghiệp tìm kiếm và tiến cử ứng viên phù hợp, giảm tải cho đội HR.',
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=200&fit=crop',
  },
  {
    icon: Shield,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    title: 'Đảm bảo thông tin',
    desc: 'JobShare là trung gian đảm bảo bảo mật thông tin doanh nghiệp và ứng viên.',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=200&fit=crop',
  },
  {
    icon: BarChart3,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    title: 'Minh bạch & Tối ưu',
    desc: 'Theo dõi tiến độ, phí thưởng và hiệu quả tuyển dụng minh bạch trên một nền tảng.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop',
  },
]

const processSteps = [
  { num: '01', title: 'Chọn JD của bạn', desc: 'Chọn job description sẵn có hoặc tạo JD mới trên JobShare.' },
  { num: '02', title: 'Thiết lập phí', desc: 'Cài đặt phí thưởng CTV bạn sẵn sàng trả cho mỗi lần tuyển thành công.' },
  { num: '03', title: 'Đăng lên Sàn HR', desc: 'Gửi duyệt WS — hệ thống tự động kết nối với CTV phù hợp.' },
  { num: '04', title: 'CTV tiếp cận & ứng tuyển', desc: 'CTV tìm ứng viên, tiến cử và JobShare hỗ trợ quản lý tiến trình.' },
]

const highlightFeatures = [
  { icon: FileText, title: 'Đăng JD dễ dàng', desc: 'Chọn JD có sẵn, thiết lập phí và đăng lên sàn chỉ vài bước.' },
  { icon: Settings, title: 'Thiết lập phí linh hoạt', desc: '% thu nhập năm, cố định hoặc theo tháng lương — một bước, không JLPT.' },
  { icon: Users, title: 'Kết nối CTV chất lượng', desc: 'Mạng lưới CTV HR Partner được WS kiểm duyệt và đánh giá.' },
  { icon: Shield, title: 'Bảo vệ & minh bạch', desc: 'Thanh toán qua JobShare, hợp đồng và lịch sử giao dịch rõ ràng.' },
]

const onboardQuickActions = [
  { icon: Plus, title: 'Đăng tin tuyển dụng', desc: 'Đưa JD lên Sàn HR', action: 'create' },
  { icon: FileText, title: 'Quản lý tin tuyển dụng', desc: 'Theo dõi job trên sàn', action: 'create', viewWhenListed: true },
  { icon: Users, title: 'Kết nối CTV', desc: 'Xem CTV quan tâm job', action: 'dashboard' },
  { icon: History, title: 'Lịch sử giao dịch', desc: 'Thanh toán & chia phí', path: '/business/candidate-sharing?tab=costs' },
  { icon: BookOpen, title: 'Hướng dẫn sử dụng', desc: 'Tài liệu hướng dẫn Sàn HR', path: '/business/knowledge' },
]

const onboardNotifications = [
  { dot: 'bg-emerald-500', text: 'Chào mừng bạn đến với Sàn HR JobShare!', time: 'Vừa xong' },
  { dot: 'bg-violet-500', text: 'Đăng job đầu tiên để kết nối với CTV HR Partner', time: '1 phút trước' },
  { dot: 'bg-blue-500', text: 'Thiết lập phí thưởng CTV trước khi đăng tin', time: '2 phút trước' },
  { dot: 'bg-rose-500', text: 'WS sẽ duyệt tin trước khi hiển thị trên sàn', time: '3 phút trước', warn: true },
]

const onboardNews = [
  { title: 'Mở rộng kết nối tuyển dụng với CTV trên JobShare', date: '20/05/2024', img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=200&h=150&fit=crop' },
  { title: 'Hướng dẫn thiết lập phí thưởng CTV hiệu quả', date: '18/05/2024', img: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=200&h=150&fit=crop' },
  { title: 'Quy trình duyệt tin và tiến cử ứng viên trên Sàn HR', date: '15/05/2024', img: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=200&h=150&fit=crop' },
]

function OnboardingSidebar({ onCreate, onViewDetails, hasMarketplaceData, onNavigate }) {
  const handleAction = (item) => {
    if (item.action === 'create') {
      if (hasMarketplaceData && item.viewWhenListed) onViewDetails()
      else onCreate()
      return
    }
    if (item.action === 'dashboard') onViewDetails()
    else if (item.path) onNavigate(item.path)
  }

  return (
    <div className="flex flex-col gap-2 sm:gap-3 2xl:gap-4 min-w-0 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:pr-1 scrollbar-hide">
      <div className="bg-white rounded-lg sm:rounded-xl border border-slate-100 p-2 sm:p-3">
        <h2 className="text-xs sm:text-sm font-bold text-slate-800 mb-1.5 sm:mb-2">Thao tác nhanh</h2>
        <div className="flex flex-col gap-0.5">
          {onboardQuickActions.map((a) => {
            const Icon = a.icon
            return (
              <button
                key={a.title}
                type="button"
                onClick={() => handleAction(a)}
                className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-slate-50 transition-colors text-left w-full"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] sm:text-xs font-semibold text-slate-800 leading-snug">{a.title}</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">{a.desc}</div>
                </div>
                <span className="ml-auto text-slate-300 flex-shrink-0 text-xs sm:text-sm">›</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg sm:rounded-xl border border-slate-100 p-2 sm:p-3">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1 sm:gap-1.5">
            Thông báo
            <span className="bg-rose-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full px-1 sm:px-1.5 py-0.5">4</span>
          </h2>
          <button type="button" className="text-[10px] sm:text-xs font-semibold text-violet-600">Xem tất cả</button>
        </div>
        <div className="flex flex-col gap-2 sm:gap-2.5">
          {onboardNotifications.map((n) => (
            <div key={n.text} className="flex items-start gap-1.5 sm:gap-2">
              {n.warn
                ? <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                : <span className={`w-2 h-2 rounded-full ${n.dot} mt-1 flex-shrink-0`} />}
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-slate-700 leading-snug">{n.text}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg sm:rounded-xl border border-slate-100 p-2 sm:p-3">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <h2 className="text-xs sm:text-sm font-bold text-slate-800">Tin tức &amp; Insights</h2>
          <button type="button" className="text-[10px] sm:text-xs font-semibold text-violet-600">Xem tất cả</button>
        </div>
        <div className="flex flex-col gap-2 sm:gap-3">
          {onboardNews.map((n) => (
            <div key={n.title} className="flex gap-2 sm:gap-3">
              <img src={n.img} alt={n.title} className="w-12 h-9 sm:w-14 sm:h-10 rounded-md sm:rounded-lg object-cover flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-medium text-slate-700 leading-snug line-clamp-2">{n.title}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">{n.date}</p>
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
                <div className="hidden xl:block absolute top-4 left-[calc(100%-8px)] w-full h-px bg-violet-100 z-0" />
              )}
              <span className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-violet-600 text-white text-[10px] sm:text-xs font-bold relative z-10">
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
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-violet-600" />
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

      <div className="rounded-lg sm:rounded-xl border border-violet-100 bg-violet-50/90 px-3 py-3 sm:px-4 sm:py-4 2xl:px-5 2xl:py-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 shrink-0 xl:mt-auto">
        <div className="hidden sm:block flex-shrink-0 w-24 h-20 sm:w-28 sm:h-24 rounded-lg overflow-hidden bg-white/80 border border-violet-100">
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
          className="flex-shrink-0 inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 transition-colors w-full sm:w-auto"
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

function CreateListingModal({ open, onClose, onCreated, initialJobId = '' }) {
  const [jobs, setJobs] = useState([])
  const [jobId, setJobId] = useState('')
  const [jobCommissionType, setJobCommissionType] = useState('percent')
  const [jobValues, setJobValues] = useState(() => simpleCommissionToPayload(SIMPLE_FEE_MODES.PERCENT_ANNUAL, '').jobValues)
  const [salaryCurrency, setSalaryCurrency] = useState('JPY')
  const [commissionSeedJob, setCommissionSeedJob] = useState(null)
  const [headcount, setHeadcount] = useState(1)
  const [requirements, setRequirements] = useState('')
  const [recruitmentDeadline, setRecruitmentDeadline] = useState('')
  const [creating, setCreating] = useState(false)
  const [loadingJobMeta, setLoadingJobMeta] = useState(false)

  useEffect(() => {
    if (!open) return
    let mounted = true
    apiService.getBusinessJobs({ page: 1, limit: 50, status: 1 }).then((res) => {
      if (mounted && res?.success) setJobs(res.data?.jobs || res.data?.items || [])
    })
    return () => { mounted = false }
  }, [open])

  useEffect(() => {
    if (!open) return
    setJobId(initialJobId ? String(initialJobId) : '')
    const emptyPayload = simpleCommissionToPayload(SIMPLE_FEE_MODES.PERCENT_ANNUAL, '')
    setJobCommissionType(emptyPayload.jobCommissionType)
    setJobValues(emptyPayload.jobValues)
    setSalaryCurrency('JPY')
    setCommissionSeedJob(null)
    setHeadcount(1)
    setRequirements('')
    setRecruitmentDeadline('')
  }, [open, initialJobId])

  useEffect(() => {
    if (!jobId) return
    let mounted = true
    setLoadingJobMeta(true)
    apiService.getBusinessJobById(jobId).then((res) => {
      if (!mounted) return
      const job = res?.data?.job || res?.data
      setCommissionSeedJob(job || null)
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

  const handleCreate = async (submitAfter) => {
    if (!jobId) { alert('Chọn JD'); return }
    const commissionError = validateCommissionForMarketplace(jobCommissionType, jobValues)
    if (commissionError) { alert(commissionError); return }
    setCreating(true)
    try {
      const res = await apiService.createBusinessCandidateSharingListing({
        jobId: Number(jobId),
        headcount: Number(headcount) || 1,
        requirements: requirements.trim() || null,
        recruitmentDeadline: recruitmentDeadline || null,
        jobCommissionType,
        jobValues: jobValues.filter(isPersistableJobValue).map((jv) => ({
          typeId: jv.typeId ? Number(jv.typeId) : null,
          valueId: jv.valueId ? Number(jv.valueId) : null,
          value: jv.value != null && String(jv.value).trim() !== '' ? String(jv.value).trim() : null,
          isRequired: !!jv.isRequired,
          viewOnCollaborator: jv.viewOnCollaborator || null,
        })),
      })
      if (res?.success && res.data?.listing) {
        if (submitAfter) {
          await apiService.submitBusinessCandidateSharingListing(res.data.listing.id)
        }
        onCreated()
        onClose()
      } else {
        alert(res?.message || 'Tạo thất bại')
      }
    } catch (e) {
      console.error(e)
      alert(e?.message || 'Tạo thất bại')
    } finally {
      setCreating(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-sm font-bold">Đưa job lên sàn CTV</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Chọn JD và thiết lập phí thưởng CTV trước khi gửi duyệt</p>
          </div>
          <button type="button" onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="p-4 space-y-4 text-sm">
          <div>
            <label className="text-xs font-semibold text-slate-600">Chọn JD <span className="text-red-500">*</span></label>
            <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm">
              <option value="">-- Chọn việc làm --</option>
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.title} ({j.jobCode})</option>)}
            </select>
          </div>

          {loadingJobMeta && jobId ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải thông tin JD...
            </div>
          ) : null}

          <JobCommissionEditor
            jobCommissionType={jobCommissionType}
            onCommissionTypeChange={setJobCommissionType}
            jobValues={jobValues}
            onJobValuesChange={setJobValues}
            commissionSeedJob={commissionSeedJob}
            salaryCurrency={salaryCurrency}
            onSalaryCurrencyChange={setSalaryCurrency}
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-600">Số lượng tuyển</label>
              <input type="number" min={1} value={headcount} onChange={(e) => setHeadcount(e.target.value)} className="w-full mt-1 border rounded-lg px-2 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Hạn tuyển</label>
              <input type="date" value={recruitmentDeadline} onChange={(e) => setRecruitmentDeadline(e.target.value)} className="w-full mt-1 border rounded-lg px-2 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Điều kiện tuyển bổ sung</label>
            <textarea rows={3} value={requirements} onChange={(e) => setRequirements(e.target.value)} className="w-full mt-1 border rounded-lg px-2 py-2 text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t">
          <button type="button" onClick={onClose} className="text-xs px-3 py-2 border rounded-lg">Hủy</button>
          <button type="button" disabled={creating} onClick={() => handleCreate(false)} className="text-xs px-3 py-2 border rounded-lg">Lưu nháp</button>
          <button type="button" disabled={creating} onClick={() => handleCreate(true)} className="text-xs px-3 py-2 rounded-lg bg-blue-600 text-white">
            {creating ? 'Đang gửi...' : 'Gửi WS duyệt'}
          </button>
        </div>
      </div>
    </div>
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
        apiService.getBusinessCandidateSharingSettlements({ page: 1, limit: 5 }),
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

  const handleCreatedListing = useCallback(async () => {
    await loadData()
  }, [loadData])

  const marketplaceShell = (
    <>
      <style>{scrollbarStyle}</style>
      <CreateListingModal
        open={showCreate}
        onClose={closeCreateModal}
        onCreated={handleCreatedListing}
        initialJobId={createJobId}
      />
      <div className="h-full min-h-0 w-full flex flex-col bg-slate-50" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: 11 }}>
        <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '8px 14px 0', background: '#fff' }}>
          <button type="button" onClick={() => setShowCreate(true)} style={{ fontSize: 9, fontWeight: 600, color: '#fff', background: '#3b82f6', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus style={{ width: 10, height: 10 }} /> Đưa job lên sàn
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '7px 14px', background: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          {statCards.map((card, i) => (
            <div key={i} style={{ padding: '7px 10px', background: '#f8fafc', borderRadius: 7, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 8, color: '#64748b', fontWeight: 500, marginBottom: 2 }}>{card.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', lineHeight: 1.1, marginBottom: 2 }}>{card.value}</div>
              {card.change && (
                <div style={{ fontSize: 8, color: card.changeColor, fontWeight: 600, marginBottom: 3 }}>
                  {card.changeColor === '#10b981' ? '↑ ' : ''}{card.change}
                </div>
              )}
              <div style={{ fontSize: 8, color: '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
                {card.linkLabel} <ChevronRight style={{ width: 8, height: 8 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0, padding: '0 14px' }}>
          <div style={{ display: 'flex', gap: 20 }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                fontSize: 10, fontWeight: tab === t.key ? 700 : 500,
                color: tab === t.key ? '#3b82f6' : '#64748b',
                padding: '7px 0', borderBottom: tab === t.key ? '2px solid #3b82f6' : '2px solid transparent',
                background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Two-column layout — each col scrolls independently */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 10, padding: '10px 14px' }}>

          {/* LEFT COLUMN — scrollable */}
          <div className="ctv-scrollbar" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Jobs Table */}
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>Job đang đăng trên sàn</span>
                  <span style={{ fontSize: 8, fontWeight: 700, color: '#3b82f6', background: '#eff6ff', borderRadius: 20, padding: '1px 6px' }}>{jobsData.length}</span>
                </div>
                <span style={{ fontSize: 8, color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 5, padding: '2px 7px', cursor: 'pointer' }}>Trạng thái: Tất cả ▾</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 8, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Vị trí tuyển dụng', 'Phí thưởng CTV\n(theo JD)', 'Trạng thái', 'CTV', 'Đơn', 'Hạn tuyển', ''].map((h, i) => (
                        <th key={i} style={{ padding: '6px 10px', textAlign: i >= 2 ? 'center' : 'left', fontWeight: 600, color: '#64748b', whiteSpace: 'pre-line', fontSize: 8 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobsData.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Chưa có job trên sàn. Bấm &quot;Đưa job lên sàn&quot; để bắt đầu.</td></tr>
                    ) : jobsData.map(job => {
                      const sc = statusColor(job.status)
                      return (
                        <tr key={job.id} style={{ borderTop: '1px solid #f1f5f9', background: '#fff' }}>
                          <td style={{ padding: '6px 10px' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 9 }}>{job.title}</div>
                            <div style={{ fontSize: 7, color: '#94a3b8' }}>({job.code})</div>
                          </td>
                          <td style={{ padding: '6px 10px', fontSize: 7, color: '#475569', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{job.ctvPayment}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                            <span style={{ fontSize: 7, fontWeight: 600, color: sc.color, background: sc.bg, borderRadius: 20, padding: '1px 6px', whiteSpace: 'nowrap' }}>{job.status}</span>
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'center', color: '#475569', fontWeight: 600, fontSize: 9 }}>{job.ctvCount ?? '-'}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'center', color: '#475569', fontWeight: 600, fontSize: 9 }}>{job.candidateCount ?? '-'}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'center', color: '#475569', fontSize: 7 }}>{job.deadline}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'center' }} />
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '6px 12px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 8, color: '#3b82f6', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                  Xem tất cả job <ChevronRight style={{ width: 8, height: 8 }} />
                </span>
              </div>
            </div>

            {/* Đơn tiến cử mới */}
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>Đơn tiến cử mới</span>
                <span style={{ fontSize: 8, fontWeight: 700, color: '#3b82f6', background: '#eff6ff', borderRadius: 20, padding: '1px 6px' }}>{nominationsData.length}</span>
              </div>
              <table style={{ width: '100%', fontSize: 8, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['Ứng viên được tiến cử', 'Vị trí', 'CTV tiến cử', 'Ngày tiến cử', 'Trạng thái', 'Thao tác'].map((h, i) => (
                      <th key={i} style={{ padding: '6px 10px', textAlign: i >= 3 ? 'center' : 'left', fontWeight: 600, color: '#64748b', fontSize: 8 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {nominationsData.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Chưa có đơn tiến cử</td></tr>
                  ) : nominationsData.map((n) => {
                    const sc = statusColor(n.status)
                    const sel = String(selectedNomination?.id) === String(n.nominationId)
                    return (
                      <tr
                        key={n.nominationId}
                        style={{ borderTop: '1px solid #f1f5f9', cursor: 'pointer', background: sel ? '#f0f7ff' : '#fff' }}
                        onClick={() => setSelectedNomination(n.raw)}
                      >
                        <td style={{ padding: '6px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Avatar id={n.id} size={22} />
                            <div>
                              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 9 }}>{n.name}</div>
                              <div style={{ fontSize: 7, color: '#94a3b8' }}>{n.subName}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 9 }}>{n.position}</div>
                          <div style={{ fontSize: 7, color: '#94a3b8' }}>({n.posCode})</div>
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 9 }}>{n.ctv}</div>
                          <div style={{ fontSize: 7, color: '#f59e0b', fontWeight: 700 }}>{n.rating != null ? `★ ${n.rating}` : ''}</div>
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', color: '#475569', fontSize: 7 }}>{n.date}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                          <span style={{ fontSize: 7, fontWeight: 600, color: sc.color, background: sc.bg, borderRadius: 20, padding: '1px 6px' }}>{n.status}</span>
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'center' }} />
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div style={{ padding: '6px 12px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 8, color: '#3b82f6', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                  Xem tất cả đơn tiến cử <ChevronRight style={{ width: 8, height: 8 }} />
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — scrollable */}
          <div className="ctv-scrollbar" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Trao đổi 3 bên — NominationChat (DN + WS + CTV) */}
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', flexShrink: 0, minHeight: 420, display: 'flex', flexDirection: 'column' }}>
              {selectedNomination ? (
                <NominationChat
                  jobApplicationId={selectedNomination.id}
                  userType="business"
                  currentStatus={selectedNomination.status}
                  introCandidateName={selectedNomination.candidateName || '—'}
                  introJobTitle={selectedNomination.jobTitle || '—'}
                  mobileHeaderName={selectedNomination.candidateName || 'Chat 3 bên'}
                  mobileHeaderAvatar={(selectedNomination.candidateName || '?').charAt(0).toUpperCase()}
                />
              ) : (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 10 }}>
                  Chọn đơn tiến cử để trao đổi với CTV và WS
                </div>
              )}
            </div>

            {/* Thanh toán & chia phí */}
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>Thanh toán & chia phí</span>
                <span style={{ fontSize: 8, color: '#3b82f6', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                  Xem tất cả <ChevronRight style={{ width: 8, height: 8 }} />
                </span>
              </div>
              <div style={{ padding: '10px 12px' }}>
                {settlements.length === 0 ? (
                  <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', padding: 12 }}>Chưa có giao dịch thanh toán</div>
                ) : settlements.slice(0, 1).map((set) => (
                  <div key={set.id}>
                <span style={{ fontSize: 7, fontWeight: 700, color: set.status === 'paid' ? '#059669' : '#d97706', background: set.status === 'paid' ? '#d1fae5' : '#fef3c7', borderRadius: 20, padding: '2px 7px' }}>{set.statusLabel}</span>
                <div style={{ marginTop: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#1e293b' }}>{set.candidateName}</div>
                  <div style={{ fontSize: 7, color: '#64748b' }}>{set.jobTitle} ({set.jobCode})</div>
                </div>
                <div>
                  <div style={{ fontSize: 7, color: '#64748b', fontWeight: 500, marginBottom: 2 }}>Doanh nghiệp trả cho WS</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#1e293b' }}>{Number(set.totalAmountBusiness || 0).toLocaleString('vi-VN')}đ</div>
                </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '6px 12px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 8, color: '#3b82f6', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                  Xem tất cả giao dịch <ChevronRight style={{ width: 8, height: 8 }} />
                </span>
              </div>
            </div>

            {/* Cách hoạt động */}
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>Cách hoạt động</span>
              </div>
              <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  'Chọn job (phí thưởng lấy từ JD đã cài)',
                  'Gửi đề xuất cho WS duyệt',
                  'Sau khi WS duyệt — job hiện trên sàn cho CTV',
                  'CTV tiến cử ứng viên',
                  'Tuyển thành công → Thanh toán & chia phí',
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                    <div style={{ width: 15, height: 15, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: '#3b82f6', flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: 8, color: '#475569', lineHeight: 1.4 }}>{step}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '6px 12px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 8, color: '#3b82f6', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                  Xem hướng dẫn chi tiết <ChevronRight style={{ width: 8, height: 8 }} />
                </span>
              </div>
            </div>
          </div>
        </div>
        </>
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
        <div className="business-homepage-shell min-h-0 h-full bg-slate-50 overflow-x-hidden xl:h-full xl:overflow-hidden">
          <div className="business-homepage-ui w-full min-h-0 p-3 sm:p-4 2xl:p-5 xl:h-full xl:flex xl:flex-col">
            <div className="w-full xl:flex-1 xl:min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] gap-3 sm:gap-4 2xl:gap-5 items-stretch">
              <div className="flex flex-col min-w-0 xl:overflow-y-auto xl:min-h-0 xl:h-full xl:pr-1 scrollbar-hide">
                <OnboardingView
                  hasMarketplaceData={hasListings}
                  onCreate={openCreateModal}
                  onViewDetails={enterMarketplaceDashboard}
                />
              </div>
              <OnboardingSidebar
                onCreate={openCreateModal}
                onViewDetails={enterMarketplaceDashboard}
                hasMarketplaceData={hasListings}
                onNavigate={navigate}
              />
            </div>
          </div>
        </div>
      </>
    )
  }

  return marketplaceShell
}

export default CandidateSharing