import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Search, SlidersHorizontal, ChevronRight, ChevronLeft,
  UserCheck, X, Unlock, Users, Check, BadgeCheck, Loader2, Briefcase,
  Sparkles, FilePlus2, BookOpen, AlertTriangle, ArrowRight, Lock,
  MessageSquare, Gauge,
} from 'lucide-react'
import apiService from '../../services/api'
import useBusinessUser from '../../hooks/useBusinessUser'
import {
  buildScoreMapFromMatches,
  fetchAllBusinessScoutCandidates,
  fetchJobScoutAiMatches,
} from '../../utils/businessJobAiMatching'
import { highlightSearchText } from '../../utils/searchTextHighlight'
import ScoutCandidateProfilePanel from '../../component/Bussiness/ScoutCandidateProfilePanel'

const ICON_SM = { width: 10, height: 10 }
const ICON_MD = { width: 12, height: 12 }

const scrollbarStyle = `
  .scout-scrollbar::-webkit-scrollbar { width: 6px; }
  .scout-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .scout-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .scout-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  .scout-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
  .scout-search-highlight {
    background-color: #fef08a !important;
    color: #92400e !important;
    padding: 0 2px;
    border-radius: 2px;
    font-weight: 600;
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
  }
  .scout-onboard-scroll::-webkit-scrollbar { display: none; }
  .scout-onboard-scroll { -ms-overflow-style: none; scrollbar-width: none; }
`

const scoutSolutionCards = [
  {
    num: '01',
    title: 'Scout Credit',
    subtitle: 'Tự chủ tìm kiếm & tiếp cận ứng viên',
    theme: {
      badge: 'bg-blue-600',
      border: 'border-blue-100',
      bg: 'bg-gradient-to-b from-blue-50 to-white',
      btn: 'bg-blue-600 hover:bg-blue-700',
      accent: 'text-blue-600',
    },
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=280&fit=crop',
    features: [
      'Tìm kiếm AI theo kỹ năng & vị trí',
      'Xem hồ sơ ẩn danh trước khi unlock',
      'Chủ động chat & tiếp cận ứng viên',
      'Quản lý danh sách yêu thích',
      'Thanh toán credit linh hoạt',
    ],
    footer: 'Chỉ từ 1,000 credit · 1 credit = 1 lượt mở hồ sơ',
    mode: 'credit',
  },
  {
    num: '02',
    title: 'Scout Performance',
    subtitle: 'WS hỗ trợ tìm kiếm & tiếp cận ứng viên',
    theme: {
      badge: 'bg-emerald-600',
      border: 'border-emerald-100',
      bg: 'bg-gradient-to-b from-emerald-50 to-white',
      btn: 'bg-emerald-600 hover:bg-emerald-700',
      accent: 'text-emerald-600',
    },
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=280&fit=crop',
    features: [
      'WS tìm kiếm & đánh giá ứng viên',
      'WS chủ động gửi ứng viên theo JD',
      'Gợi ý thay thế khi cần',
      'Phí theo kết quả tuyển dụng',
    ],
    footer: 'Hiệu quả – Tiết kiệm thời gian HR',
    mode: 'performance',
  },
]

const scoutQuickActions = [
  { icon: Sparkles, title: 'Tạo JD mới (AI)', desc: 'Tạo JD miễn phí bằng AI', path: '/business/jobs/ai-builder' },
  { icon: Search, title: 'Tìm ứng viên (Scout Credit)', desc: 'Tìm trong kho ứng viên', action: 'explore' },
  { icon: MessageSquare, title: 'Gửi yêu cầu WS (Performance)', desc: 'Nhờ WS hỗ trợ tìm kiếm', action: 'explore' },
  { icon: Users, title: 'Dùng Scout Performance', desc: 'Mở hồ sơ & chat WS', action: 'explore' },
  { icon: BookOpen, title: 'Xem hướng dẫn sử dụng', desc: 'Tài liệu hướng dẫn Scout', path: '/business/knowledge' },
]

const scoutNotifications = [
  { dot: 'bg-emerald-500', text: 'Có 3 ứng viên mới phù hợp với Mechanical Engineer', time: '10 phút trước' },
  { dot: 'bg-violet-500', text: 'WS đã gửi 5 ứng viên gợi ý cho IT Developer', time: '1 giờ trước' },
  { dot: 'bg-blue-500', text: 'Ứng viên T.N.H đã trả lời tin nhắn', time: '2 giờ trước' },
  { dot: 'bg-rose-500', text: 'Credit Scout sắp hết — nạp thêm để tiếp tục unlock', time: '3 giờ trước', warn: true },
]

const scoutNews = [
  { title: 'Báo cáo thị trường lao động IT Nhật Bản Q2/2024', date: '20/05/2024', img: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=200&h=150&fit=crop' },
  { title: '5 cách tiếp cận ứng viên kỹ thuật hiệu quả qua Scout', date: '18/05/2024', img: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=200&h=150&fit=crop' },
]

function ScoutSolutionCard({ card, onStart }) {
  return (
    <div className={`rounded-2xl border ${card.theme.border} ${card.theme.bg} p-3 flex flex-col h-full shadow-sm`}>
      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-white text-[10px] font-bold ${card.theme.badge}`}>
        {card.num}
      </span>
      <h3 className="text-sm font-bold text-slate-800 mt-2">{card.title}</h3>
      <p className="text-[10px] text-slate-500 mt-0.5">{card.subtitle}</p>

      <div className="rounded-xl overflow-hidden bg-white/60 border border-white/80 my-3 aspect-[4/3]">
        <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
      </div>

      <ul className="flex flex-col gap-1.5 mb-3 flex-1">
        {card.features.map((f) => (
          <li key={f} className="flex items-start gap-1.5 text-[10px] text-slate-600">
            <Check className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${card.theme.accent}`} />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <p className={`text-[9px] font-medium mb-2 ${card.theme.accent}`}>{card.footer}</p>

      <button
        type="button"
        onClick={() => onStart(card.mode)}
        className={`w-full ${card.theme.btn} text-white text-[11px] font-semibold rounded-xl py-2.5 transition-colors inline-flex items-center justify-center gap-1.5`}
      >
        Bắt đầu với {card.title}
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function ScoutOnboardingSidebar({ onExplore, onNavigate }) {
  const handleAction = (item) => {
    if (item.action === 'explore') onExplore()
    else if (item.path) onNavigate(item.path)
  }

  return (
    <div className="flex flex-col gap-2 lg:gap-3 min-w-0 overflow-y-auto scout-onboard-scroll pr-1">
      <div className="bg-white rounded-xl border border-slate-100 p-2 lg:p-2.5">
        <h2 className="text-xs font-bold text-slate-800 mb-1.5">Thao tác nhanh</h2>
        <div className="flex flex-col gap-0.5">
          {scoutQuickActions.map((a) => {
            const Icon = a.icon
            return (
              <button
                key={a.title}
                type="button"
                onClick={() => handleAction(a)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 transition-colors text-left w-full"
              >
                <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3 h-3 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] font-semibold text-slate-800">{a.title}</div>
                  <div className="text-[8px] text-slate-400 truncate">{a.desc}</div>
                </div>
                <ChevronRight className="ml-auto w-3 h-3 text-slate-300 flex-shrink-0" />
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-2 lg:p-2.5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            Thông báo
            <span className="bg-rose-500 text-white text-[8px] font-bold rounded-full px-1.5 py-0.5">4</span>
          </h2>
          <button type="button" className="text-[9px] font-semibold text-blue-600">Xem tất cả</button>
        </div>
        <div className="flex flex-col gap-2">
          {scoutNotifications.map((n) => (
            <div key={n.text} className="flex items-start gap-1.5">
              {n.warn
                ? <AlertTriangle className="w-3 h-3 text-rose-500 mt-0.5 flex-shrink-0" />
                : <span className={`w-1.5 h-1.5 rounded-full ${n.dot} mt-1 flex-shrink-0`} />}
              <div className="min-w-0">
                <p className="text-[9px] text-slate-700 leading-snug">{n.text}</p>
                <p className="text-[8px] text-slate-400 mt-0.5">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-2 lg:p-2.5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-slate-800">Tin tức &amp; Insights</h2>
          <button type="button" className="text-[9px] font-semibold text-blue-600">Xem tất cả</button>
        </div>
        <div className="flex flex-col gap-2">
          {scoutNews.map((n) => (
            <div key={n.title} className="flex gap-2">
              <img src={n.img} alt={n.title} className="w-12 h-9 rounded-lg object-cover flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-medium text-slate-700 leading-snug line-clamp-2">{n.title}</p>
                <p className="text-[8px] text-slate-400 mt-0.5">{n.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ScoutOnboardingView({ previewCandidates, scoutCreditCost, onStart, onExplore }) {
  return (
    <>
      <div>
        <h1 className="text-sm lg:text-base font-bold text-slate-800">Scout</h1>
        <p className="text-[10px] lg:text-xs text-slate-500 mt-0.5 max-w-2xl">
          JobShare giúp bạn tiếp cận đúng ứng viên nhanh hơn với 2 giải pháp linh hoạt.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch">
        {scoutSolutionCards.map((card) => (
          <ScoutSolutionCard key={card.num} card={card} onStart={onStart} />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <h2 className="text-xs font-bold text-slate-800">Ứng viên tiềm năng gợi ý cho bạn</h2>
          <span className="text-[9px] text-slate-400">Hồ sơ đang được ẩn danh</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="text-[8px] text-slate-400 uppercase bg-slate-50 border-b border-slate-100">
                <th className="font-medium px-3 py-2">Ứng viên</th>
                <th className="font-medium px-2 py-2">Kinh nghiệm</th>
                <th className="font-medium px-2 py-2">Kỹ năng</th>
                <th className="font-medium px-2 py-2">Mức lương mong muốn</th>
                <th className="font-medium px-2 py-2">Địa điểm</th>
                <th className="font-medium px-2 py-2 text-center">Phù hợp</th>
                <th className="font-medium px-2 py-2 text-center w-10" />
              </tr>
            </thead>
            <tbody>
              {previewCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-[10px] text-slate-400">
                    Đang tải gợi ý ứng viên...
                  </td>
                </tr>
              ) : previewCandidates.map((c) => {
                const skills = getSkillTags(c).slice(0, 2)
                const more = Math.max(0, getSkillTags(c).length - 2)
                return (
                  <tr key={c.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <AvatarCircle candidate={c} size={28} />
                        <div>
                          <div className="text-[10px] font-semibold text-slate-800">{getDisplayName(c)}</div>
                          <div className="text-[8px] text-slate-400">{c.desiredPosition || c.jobCategory?.name || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-[9px] text-slate-600">{formatExperienceYears(c.experienceYears)}</td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-1">
                        {skills.map((s) => (
                          <span key={s} className="text-[7px] font-medium text-blue-600 bg-blue-50 rounded-full px-1.5 py-0.5">{s}</span>
                        ))}
                        {more > 0 && <span className="text-[7px] text-slate-400">+{more}</span>}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-[9px] text-slate-600">{c.desiredIncome || '—'}</td>
                    <td className="px-2 py-2 text-[9px] text-slate-600">{c.desiredWorkLocation || '—'}</td>
                    <td className="px-2 py-2 text-center">
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600">
                        <Gauge className="w-3 h-3" />
                        —
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={onExplore}
                        className="w-6 h-6 rounded-full bg-slate-100 hover:bg-blue-50 flex items-center justify-center mx-auto transition-colors"
                        title={`Mở hồ sơ (${scoutCreditCost} credit)`}
                      >
                        <Lock className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onExplore}
            className="w-full text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 rounded-xl py-2.5 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            Khám phá toàn bộ ứng viên
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  )
}

const ANONYMOUS_AVATAR = 'https://api.dicebear.com/7.x/shapes/svg?seed=scout-anonymous'

function formatExperienceYears(years) {
  const n = Number(years)
  if (!Number.isFinite(n) || n <= 0) return '—'
  return `${n} năm`
}

function getSkillTags(candidate) {
  const raw = candidate?.technicalSkills
  if (Array.isArray(raw)) return raw.filter(Boolean).map(String)
  if (typeof raw === 'string' && raw.trim()) {
    const trimmed = raw.trim()
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String)
      } catch {
        // fall through
      }
    }
    return trimmed.split(/[,;|/]/).map((s) => s.trim()).filter(Boolean)
  }
  return []
}

function getVisibleSkills(candidate, highlightQuery) {
  const skills = getSkillTags(candidate)
  if (highlightQuery) return { skills, hiddenCount: 0 }
  return {
    skills: skills.slice(0, 2),
    hiddenCount: Math.max(0, skills.length - 2),
  }
}

function getDisplayName(candidate) {
  if (!candidate) return 'Ứng viên ẩn danh'
  if (candidate.isUnlocked && candidate.name) return candidate.name
  return candidate.anonymousName || candidate.name || 'Ứng viên ẩn danh'
}

function getPerformanceRequestContextLabel(candidate) {
  const position = candidate?.desiredPosition || candidate?.jobCategory?.name
  const skills = getSkillTags(candidate).slice(0, 3)
  if (position && skills.length) {
    return `vị trí "${position}" (${skills.join(', ')})`
  }
  if (position) return `vị trí "${position}"`
  if (skills.length) return `kỹ năng: ${skills.join(', ')}`
  return 'hồ sơ ứng viên bạn đang xem'
}

function ScoutActionModal({
  open,
  kind,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  noticeVariant = 'info',
  onConfirm,
  onClose,
  loading = false,
  children,
}) {
  if (!open) return null

  const isConfirm = kind === 'performance-confirm' || kind === 'unlock-confirm' || kind === 'similar-candidates-prompt'
  const noticeButtonClass = noticeVariant === 'error'
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-blue-600 hover:bg-blue-700'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-5 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold text-slate-800 mb-2">{title}</h3>
        {children || (message ? <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{message}</p> : null)}
        <div className={`flex gap-2 justify-end ${children || message ? 'mt-4' : ''}`}>
          {isConfirm ? (
            <>
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="text-xs px-3 py-2 border border-slate-200 rounded-lg text-slate-600 disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={onConfirm}
                className="text-xs px-3 py-2 rounded-lg text-white bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : confirmLabel}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className={`text-xs px-3 py-2 rounded-lg text-white ${noticeButtonClass}`}
            >
              Đã hiểu
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function getPrSummary(candidate) {
  return (
    candidate?.scoutPublicSummary ||
    candidate?.careerSummary ||
    candidate?.strengths ||
    ''
  )
}

function AvatarCircle({ candidate, size = 36 }) {
  const name = getDisplayName(candidate)
  const seed = candidate?.isUnlocked ? name : `anon-${candidate?.id || 'x'}`
  const src = candidate?.isUnlocked && candidate?.avatarPhotoPath
    ? candidate.avatarPhotoPath
    : `${ANONYMOUS_AVATAR}&seed=${encodeURIComponent(String(seed))}`

  return (
    <img
      src={src}
      alt=""
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', background: '#e2e8f0' }}
      onError={(e) => {
        e.currentTarget.src = `${ANONYMOUS_AVATAR}&seed=fallback`
      }}
    />
  )
}

const Scout = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedJobId = searchParams.get('jobId') || ''
  const performanceRequestId = searchParams.get('performanceRequestId') || ''
  const { credit: userCredit, user, companyName } = useBusinessUser()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 })
  const [selectedId, setSelectedId] = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [credit, setCredit] = useState(userCredit || 0)
  const [scoutCreditCost, setScoutCreditCost] = useState(5)
  const [unlocking, setUnlocking] = useState(false)
  const [performanceRequesting, setPerformanceRequesting] = useState(false)
  const [error, setError] = useState('')
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [matchLoading, setMatchLoading] = useState(false)
  const [scoreByCvId, setScoreByCvId] = useState({})
  const [aiMatchedTotal, setAiMatchedTotal] = useState(0)
  const [allScoutCandidates, setAllScoutCandidates] = useState([])
  const [performanceDetail, setPerformanceDetail] = useState(null)
  const [performanceDetailLoading, setPerformanceDetailLoading] = useState(false)
  const [showPerformanceCta, setShowPerformanceCta] = useState(false)
  const [activeRecommendationId, setActiveRecommendationId] = useState(null)
  const [exploreSubmitting, setExploreSubmitting] = useState(false)
  const [actionModal, setActionModal] = useState({
    open: false,
    kind: null,
    title: '',
    message: '',
    noticeVariant: 'info',
    requestId: null,
    sessionId: null,
  })
  const [activityLoading, setActivityLoading] = useState(true)
  const [hasScoutActivity, setHasScoutActivity] = useState(false)
  const [forceDashboard, setForceDashboard] = useState(false)
  const [previewCandidates, setPreviewCandidates] = useState([])

  useEffect(() => {
    let cancelled = false
    async function loadActivity() {
      try {
        const [unlockRes, perfRes, previewRes] = await Promise.all([
          apiService.getBusinessScoutUnlockedCandidates({ page: 1, limit: 1 }).catch(() => null),
          apiService.getBusinessScoutPerformanceRequests({ page: 1, limit: 1 }).catch(() => null),
          apiService.getBusinessScoutCandidates({
            page: 1,
            limit: 5,
            sortBy: 'scoutListedAt',
            sortOrder: 'DESC',
          }).catch(() => null),
        ])
        if (cancelled) return
        const unlockTotal = Number(unlockRes?.data?.pagination?.total ?? 0)
        const perfTotal = Number(perfRes?.data?.pagination?.total ?? 0)
        setHasScoutActivity(unlockTotal > 0 || perfTotal > 0)
        if (previewRes?.success && previewRes.data) {
          setPreviewCandidates(previewRes.data.candidates || [])
          if (typeof previewRes.data.scoutCreditCost === 'number') {
            setScoutCreditCost(previewRes.data.scoutCreditCost)
          }
          if (typeof previewRes.data.credit === 'number') {
            setCredit(previewRes.data.credit)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setActivityLoading(false)
      }
    }
    loadActivity()
    return () => { cancelled = true }
  }, [])

  const enterScoutDashboard = useCallback(() => {
    setForceDashboard(true)
  }, [])

  const showOnboarding = !activityLoading
    && !hasScoutActivity
    && !forceDashboard
    && !performanceRequestId
    && !selectedJobId

  useEffect(() => {
    setCredit(userCredit || 0)
  }, [userCredit])

  const loadJobs = useCallback(async () => {
    setJobsLoading(true)
    try {
      let currentPage = 1
      let totalPages = 1
      const all = []
      do {
        const res = await apiService.getBusinessJobs({ page: currentPage, limit: 50 })
        if (!res?.success) break
        all.push(...(res.data?.jobs || []))
        totalPages = res.data?.pagination?.totalPages || 0
        currentPage += 1
      } while (currentPage <= totalPages)
      setJobs(all)
    } catch {
      setJobs([])
    } finally {
      setJobsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  const loadJobAiMatches = useCallback(async (jobId) => {
    if (!jobId) {
      setScoreByCvId({})
      setAiMatchedTotal(0)
      setAllScoutCandidates([])
      return
    }
    setMatchLoading(true)
    try {
      const { candidates: scoutList, cvIds } = await fetchAllBusinessScoutCandidates(apiService)
      setAllScoutCandidates(scoutList)
      if (!cvIds.length) {
        setScoreByCvId({})
        setAiMatchedTotal(0)
        return
      }
      const matches = await fetchJobScoutAiMatches(apiService, jobId, cvIds)
      setScoreByCvId(buildScoreMapFromMatches(matches))
      setAiMatchedTotal(matches.length)
    } catch (e) {
      console.error(e)
      setScoreByCvId({})
      setAiMatchedTotal(0)
    } finally {
      setMatchLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJobAiMatches(selectedJobId)
  }, [selectedJobId, loadJobAiMatches])

  const loadPerformanceDetail = useCallback(async (requestId) => {
    if (!requestId) {
      setPerformanceDetail(null)
      setShowPerformanceCta(false)
      return
    }
    try {
      setPerformanceDetailLoading(true)
      const res = await apiService.getBusinessScoutPerformanceRequestById(requestId)
      if (res?.success && res.data?.request) {
        const req = res.data.request
        setPerformanceDetail(req)
        const viewRes = await apiService.markBusinessScoutPerformanceRequestViewed(requestId)
        if (viewRes?.data?.showBetterOptionsPrompt) {
          setShowPerformanceCta(true)
        }
        const firstRec = req.recommendations?.[0]?.candidate
        if (firstRec?.id) {
          setActiveRecommendationId(firstRec.id)
          setSelectedId(firstRec.id)
        } else if (req.cvId) {
          setSelectedId(req.cvId)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setPerformanceDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPerformanceDetail(performanceRequestId)
  }, [performanceRequestId, loadPerformanceDetail])

  const activeRecommendationCandidate = useMemo(() => {
    if (!performanceDetail?.recommendations?.length) return null
    const rec = performanceDetail.recommendations.find(
      (r) => Number(r.cvId) === Number(activeRecommendationId),
    ) || performanceDetail.recommendations[0]
    return rec?.candidate || null
  }, [performanceDetail, activeRecommendationId])

  const loadList = useCallback(async () => {
    if (selectedJobId || showOnboarding) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError('')
      const res = await apiService.getBusinessScoutCandidates({
        page,
        limit,
        search: searchQuery || undefined,
        sortBy: 'scoutListedAt',
        sortOrder: 'DESC',
      })
      if (res?.success && res.data) {
        const list = res.data.candidates || []
        setCandidates(list)
        setPagination(res.data.pagination || { total: 0, totalPages: 0 })
        if (typeof res.data.scoutCreditCost === 'number') {
          setScoutCreditCost(res.data.scoutCreditCost)
        }
        if (typeof res.data.credit === 'number') {
          setCredit(res.data.credit)
        }
        if (list.length > 0) {
          setSelectedId((prev) => {
            if (prev && list.some((c) => c.id === prev)) return prev
            return list[0].id
          })
        } else {
          setSelectedId(null)
          setSelectedDetail(null)
        }
      } else {
        setCandidates([])
        setError(res?.message || 'Không tải được danh sách Scout')
      }
    } catch (e) {
      console.error(e)
      setCandidates([])
      setError('Không tải được danh sách Scout')
    } finally {
      setLoading(false)
    }
  }, [page, limit, searchQuery, selectedJobId, showOnboarding])

  useEffect(() => {
    loadList()
  }, [loadList])

  const displayedCandidates = useMemo(() => {
    if (!selectedJobId) return candidates
    const filtered = allScoutCandidates.filter((c) => scoreByCvId[String(c.id)] != null)
    const q = searchQuery.trim().toLowerCase()
    const searched = q
      ? filtered.filter((c) => {
        const hay = [
          c.desiredPosition,
          c.desiredWorkLocation,
          c.scoutPublicSummary,
          c.careerSummary,
          ...(Array.isArray(c.technicalSkills) ? c.technicalSkills : []),
        ].filter(Boolean).join(' ').toLowerCase()
        return hay.includes(q)
      })
      : filtered
    return [...searched].sort(
      (a, b) => (scoreByCvId[String(b.id)] || 0) - (scoreByCvId[String(a.id)] || 0),
    )
  }, [selectedJobId, candidates, allScoutCandidates, scoreByCvId, searchQuery])

  const pagedCandidates = useMemo(() => {
    if (!selectedJobId) return displayedCandidates
    const start = (page - 1) * limit
    return displayedCandidates.slice(start, start + limit)
  }, [selectedJobId, displayedCandidates, page, limit])

  const jobFilterPagination = useMemo(() => {
    if (!selectedJobId) return pagination
    const total = displayedCandidates.length
    return {
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    }
  }, [selectedJobId, displayedCandidates.length, pagination, limit])

  useEffect(() => {
    if (!selectedJobId) return
    const list = pagedCandidates
    if (list.length > 0) {
      setSelectedId((prev) => {
        if (prev && list.some((c) => c.id === prev)) return prev
        return list[0].id
      })
    } else {
      setSelectedId(null)
      setSelectedDetail(null)
    }
  }, [selectedJobId, pagedCandidates])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null)
      return
    }
    let mounted = true
    const loadDetail = async () => {
      try {
        setDetailLoading(true)
        const res = await apiService.getBusinessScoutCandidateById(selectedId, {
          search: searchQuery || undefined,
        })
        if (!mounted) return
        if (res?.success && res.data?.candidate) {
          setSelectedDetail(res.data.candidate)
          if (typeof res.data.scoutCreditCost === 'number') {
            setScoutCreditCost(res.data.scoutCreditCost)
          }
          if (typeof res.data.credit === 'number') {
            setCredit(res.data.credit)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setDetailLoading(false)
      }
    }
    loadDetail()
    return () => { mounted = false }
  }, [selectedId, searchQuery])

  const selectedCand = useMemo(() => {
    if (selectedDetail) return selectedDetail
    const pool = selectedJobId ? pagedCandidates : candidates
    return pool.find((c) => c.id === selectedId) || null
  }, [selectedDetail, candidates, pagedCandidates, selectedId, selectedJobId])

  const selectedJob = useMemo(
    () => jobs.find((j) => String(j.id) === String(selectedJobId)) || null,
    [jobs, selectedJobId],
  )

  const handleJobChange = (jobId) => {
    setPage(1)
    if (jobId) {
      setSearchParams({ jobId: String(jobId) })
    } else {
      setSearchParams(performanceRequestId ? { performanceRequestId } : {})
    }
  }

  const patchCandidateUnlocked = (cvId, fullCandidate) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === cvId ? { ...c, ...fullCandidate, isUnlocked: true } : c)),
    )
    setSelectedDetail(fullCandidate)
  }

  const closeActionModal = () => {
    setActionModal({
      open: false, kind: null, title: '', message: '', noticeVariant: 'info', requestId: null, sessionId: null,
    })
  }

  const goToWsChat = (sessionId) => {
    if (sessionId) navigate(`/business/messages?tab=ws&sessionId=${sessionId}`)
  }

  const openNoticeModal = (title, message, noticeVariant = 'info') => {
    setActionModal({ open: true, kind: 'notice', title, message, noticeVariant, requestId: null, sessionId: null })
  }

  const handlePerformanceRequestClick = async () => {
    if (!selectedCand?.id) return
    if (selectedCand.isUnlocked && selectedCand.unlockType !== 'scout_performance') return
    if (selectedCand.unlockType === 'scout_performance') return

    setPerformanceRequesting(true)
    try {
      const res = await apiService.createBusinessScoutPerformanceRequest(selectedCand.id, {})
      if (res?.success) {
        const req = res.data?.request
        const candidate = req?.candidate
        if (candidate) {
          patchCandidateUnlocked(selectedCand.id, {
            ...candidate,
            isUnlocked: true,
            unlockType: 'scout_performance',
            hideContact: true,
            isPerformancePartial: true,
          })
        }
        setSelectedDetail((prev) => (prev && candidate ? { ...prev, ...candidate, isUnlocked: true, unlockType: 'scout_performance' } : prev))
        setCandidates((prev) => prev.map((c) => (
          c.id === selectedCand.id
            ? {
              ...c,
              ...(candidate || {}),
              isUnlocked: true,
              unlockType: 'scout_performance',
              performanceRequest: {
                id: req?.id,
                status: req?.status || 'approved',
                wantsSimilarCandidates: !!req?.wantsSimilarCandidates,
              },
            }
            : c
        )))
        setActionModal({
          open: true,
          kind: 'similar-candidates-prompt',
          title: 'Tìm thêm ứng viên tương tự?',
          message: 'Bạn có muốn tìm thêm các hồ sơ ứng viên tương tự với sự trợ giúp của đội ngũ WorkStation không?',
          noticeVariant: 'info',
          requestId: req?.id || null,
          sessionId: req?.sessionId || null,
        })
      } else {
        openNoticeModal('Mở hồ sơ thất bại', res?.message || 'Không thể mở hồ sơ bằng Scout Performance.', 'error')
      }
    } catch (e) {
      console.error(e)
      openNoticeModal('Mở hồ sơ thất bại', 'Không thể mở hồ sơ bằng Scout Performance. Vui lòng thử lại.', 'error')
    } finally {
      setPerformanceRequesting(false)
    }
  }

  const skipSimilarCandidates = () => {
    const sessionId = actionModal.sessionId
    closeActionModal()
    goToWsChat(sessionId)
  }

  const confirmSimilarCandidates = async () => {
    const { requestId, sessionId } = actionModal
    if (!requestId) {
      closeActionModal()
      return
    }
    setPerformanceRequesting(true)
    try {
      const res = await apiService.requestSimilarScoutPerformanceCandidates(requestId, {})
      closeActionModal()
      if (res?.success) {
        setCandidates((prev) => prev.map((c) => (
          c.id === selectedCand?.id
            ? {
              ...c,
              performanceRequest: {
                ...(c.performanceRequest || {}),
                id: requestId,
                status: 'approved',
                wantsSimilarCandidates: true,
              },
            }
            : c
        )))
        goToWsChat(sessionId || res.data?.request?.sessionId)
      } else {
        openNoticeModal('Gửi yêu cầu thất bại', res?.message || 'Không thể gửi yêu cầu tìm ứng viên tương tự.', 'error')
      }
    } catch (e) {
      console.error(e)
      openNoticeModal('Gửi yêu cầu thất bại', 'Không thể gửi yêu cầu tìm ứng viên tương tự.', 'error')
    } finally {
      setPerformanceRequesting(false)
    }
  }

  const handlePerformanceExplore = async (action) => {
    if (!performanceDetail?.id) return
    setExploreSubmitting(true)
    try {
      const res = await apiService.setBusinessScoutPerformanceExplore(performanceDetail.id, action)
      if (res?.success) {
        setShowPerformanceCta(false)
        setPerformanceDetail((prev) => prev ? { ...prev, businessExploreStatus: action } : prev)
        if (action === 'interested') {
          openNoticeModal(
            'Cảm ơn bạn',
            res.message || 'JobShare WS sẽ liên hệ hỗ trợ thêm về các ứng viên gợi ý.',
            'success',
          )
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setExploreSubmitting(false)
    }
  }

  const displayCandidate = activeRecommendationCandidate || selectedDetail || selectedCand

  const isPerformancePartialUnlock = displayCandidate?.unlockType === 'scout_performance'
    || displayCandidate?.hideContact
    || displayCandidate?.isPerformancePartial
    || selectedCand?.unlockType === 'scout_performance'

  const handleUnlockClick = () => {
    if (isPerformancePartialUnlock) return
    if (!selectedCand?.id || selectedCand.isUnlocked) return
    if (credit < scoutCreditCost) {
      openNoticeModal(
        'Không đủ credit',
        `Cần ${scoutCreditCost} credit để mở liên hệ, hiện có ${credit} credit.`,
        'error',
      )
      return
    }
    setActionModal({
      open: true,
      kind: 'unlock-confirm',
      title: 'Mở liên hệ ứng viên',
      message: '',
      noticeVariant: 'info',
    })
  }

  const submitUnlock = async () => {
    if (!selectedCand?.id || selectedCand.isUnlocked) return
    setUnlocking(true)
    try {
      const res = await apiService.unlockBusinessScoutCandidate(selectedCand.id)
      if (res?.success && res.data?.candidate) {
        patchCandidateUnlocked(selectedCand.id, res.data.candidate)
        if (typeof res.data.credit === 'number') {
          setCredit(res.data.credit)
          if (user) {
            localStorage.setItem('user', JSON.stringify({ ...user, credit: res.data.credit }))
          }
        }
        closeActionModal()
        openNoticeModal('Đã mở hồ sơ', res.message || 'Bạn có thể xem email, SĐT và thông tin liên hệ đầy đủ.', 'success')
      } else {
        openNoticeModal('Mở hồ sơ thất bại', res?.message || 'Không thể mở liên hệ ứng viên.', 'error')
      }
    } catch (e) {
      console.error(e)
      openNoticeModal('Mở hồ sơ thất bại', 'Không thể mở liên hệ ứng viên. Vui lòng thử lại.', 'error')
    } finally {
      setUnlocking(false)
    }
  }

  const totalPages = jobFilterPagination.totalPages || 0
  const totalItems = selectedJobId ? (jobFilterPagination.total || 0) : (pagination.total || 0)
  const listForRender = selectedJobId ? pagedCandidates : candidates

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = []
    if (page <= 4) {
      for (let i = 1; i <= 5; i += 1) pages.push(i)
    } else if (page >= totalPages - 3) {
      for (let i = totalPages - 4; i <= totalPages; i += 1) pages.push(i)
    } else {
      for (let i = page - 2; i <= page + 2; i += 1) pages.push(i)
    }
    return pages
  }, [page, totalPages])

  const highlightQuery = useMemo(
    () => (searchInput.trim() || searchQuery.trim()),
    [searchInput, searchQuery],
  )

  const hl = (text) => highlightSearchText(text, highlightQuery)

  const sharedModals = (
    <>
      {showPerformanceCta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-md shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 mb-2">Scout Performance</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Chúng tôi có những lựa chọn tốt hơn dành cho bạn. Bạn có muốn tìm hiểu thêm không?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                disabled={exploreSubmitting}
                onClick={() => handlePerformanceExplore('declined')}
                className="text-xs px-3 py-2 border border-slate-200 rounded-lg text-slate-600"
              >
                Không, cảm ơn
              </button>
              <button
                type="button"
                disabled={exploreSubmitting}
                onClick={() => handlePerformanceExplore('interested')}
                className="text-xs px-3 py-2 rounded-lg text-white bg-blue-600 disabled:opacity-50"
              >
                Có, tôi muốn tìm hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      <ScoutActionModal
        open={actionModal.open}
        kind={actionModal.kind}
        title={actionModal.title}
        message={actionModal.message}
        noticeVariant={actionModal.noticeVariant}
        onClose={
          actionModal.kind === 'similar-candidates-prompt' ? skipSimilarCandidates : closeActionModal
        }
        onConfirm={
          actionModal.kind === 'similar-candidates-prompt'
            ? confirmSimilarCandidates
            : actionModal.kind === 'unlock-confirm'
              ? submitUnlock
              : closeActionModal
        }
        loading={actionModal.kind === 'similar-candidates-prompt' ? performanceRequesting : unlocking}
        confirmLabel={
          actionModal.kind === 'similar-candidates-prompt'
            ? 'Có'
            : actionModal.kind === 'unlock-confirm'
              ? `Dùng ${scoutCreditCost} credit`
              : 'Xác nhận'
        }
        cancelLabel={actionModal.kind === 'similar-candidates-prompt' ? 'Không' : 'Hủy'}
      >
        {actionModal.kind === 'unlock-confirm' && selectedCand && (
          <p className="text-xs text-slate-600 leading-relaxed">
            Dùng <strong>{scoutCreditCost} credit</strong> để mở email, SĐT và thông tin liên hệ đầy đủ
            {selectedCand.isUnlocked && selectedCand.name ? ` của ${selectedCand.name}` : ''}?
          </p>
        )}
      </ScoutActionModal>
    </>
  )

  if (activityLoading) {
    return (
      <>
        <style>{scrollbarStyle}</style>
        <div className="h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </>
    )
  }

  if (showOnboarding) {
    return (
      <>
        <style>{scrollbarStyle}</style>
        {sharedModals}
        <div className="h-screen bg-slate-50 p-2 lg:p-3 overflow-hidden">
          <div className="max-w-[1440px] mx-auto h-full grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-2 lg:gap-3">
            <div className="flex flex-col gap-2 lg:gap-3 min-w-0 overflow-y-auto scout-onboard-scroll pr-1">
              <ScoutOnboardingView
                previewCandidates={previewCandidates}
                scoutCreditCost={scoutCreditCost}
                onStart={enterScoutDashboard}
                onExplore={enterScoutDashboard}
              />
            </div>
            <ScoutOnboardingSidebar onExplore={enterScoutDashboard} onNavigate={navigate} />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{scrollbarStyle}</style>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12, flex: 1, overflow: 'hidden', padding: 12 }}>
          <div className="flex flex-col gap-2 scout-scrollbar" style={{ minHeight: 0, overflowY: 'auto' }}>
            <div className="bg-white rounded-xl border border-slate-100" style={{ padding: 10 }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                <Briefcase {...ICON_SM} color="#6366f1" aria-hidden />
                <select
                  value={selectedJobId}
                  onChange={(e) => handleJobChange(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg bg-white text-slate-700 outline-none"
                  style={{ fontSize: 9, padding: '5px 8px' }}
                  disabled={jobsLoading}
                >
                  <option value="">Tất cả ứng viên Scout</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title || job.titleEn || `JD #${job.id}`}
                    </option>
                  ))}
                </select>
              </div>
              {selectedJobId && (
                <div style={{ fontSize: 8, color: '#64748b', marginBottom: 8, lineHeight: 1.4 }}>
                  {matchLoading ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="animate-spin" width={10} height={10} />
                      Đang phân tích AI cho JD...
                    </span>
                  ) : (
                    <>
                      Gợi ý từ AI cho <strong>{selectedJob?.title || `JD #${selectedJobId}`}</strong>:
                      {' '}{aiMatchedTotal.toLocaleString('vi-VN')} ứng viên phù hợp
                    </>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg" style={{ padding: '5px 8px', marginBottom: 8 }}>
                <Search {...ICON_SM} color="#94a3b8" style={{ flexShrink: 0 }} aria-hidden />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Nhập từ khóa (vd: React Developer, Sales...)"
                  className="bg-transparent outline-none w-full"
                  style={{ fontSize: 9, color: '#475569' }}
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 8 }}>
                <button type="button" style={{ fontSize: 9, fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'default', padding: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SlidersHorizontal {...ICON_SM} aria-hidden />
                  Credit: {credit} · Mở hồ sơ: {scoutCreditCost} credit
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b' }}>
                  {loading || matchLoading ? 'Đang tải...' : `${totalItems.toLocaleString('vi-VN')} ứng viên${selectedJobId ? ' phù hợp' : ' trên Scout'}`}
                </div>
                <div style={{ fontSize: 8, color: '#64748b' }}>{companyName || ''}</div>
              </div>
              {error && (
                <div style={{ fontSize: 8, color: '#dc2626', marginTop: 4 }}>{error}</div>
              )}
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }} className="scout-scrollbar">
              {loading ? (
                <div className="bg-white rounded-xl border border-slate-100 flex items-center justify-center" style={{ padding: 24, color: '#64748b', fontSize: 10 }}>
                  <Loader2 className="animate-spin mr-2" width={14} height={14} />
                  Đang tải danh sách...
                </div>
              ) : listForRender.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-100 text-center" style={{ padding: 24, color: '#64748b', fontSize: 10 }}>
                  {selectedJobId ? 'Chưa có ứng viên Scout phù hợp với JD này' : 'Chưa có hồ sơ nào trên sàn Scout'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {listForRender.map((c) => {
                    const { skills: visibleSkills, hiddenCount: more } = getVisibleSkills(c, highlightQuery)
                    const matchScore = selectedJobId ? scoreByCvId[String(c.id)] : null
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          border: selectedId === c.id ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                          background: selectedId === c.id ? '#eff6ff' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <AvatarCircle candidate={c} size={36} />
                            {c.isUnlocked && (
                              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#10b981', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <BadgeCheck {...ICON_SM} color="#fff" aria-hidden />
                              </div>
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#1e293b' }}>{hl(getDisplayName(c))}</div>
                            {c.isUnlocked ? (
                              <>
                                <div style={{ fontSize: 9, color: '#64748b' }}>{hl(c.desiredPosition || c.jobCategory?.name || '—')}</div>
                                <div className="flex items-center flex-wrap gap-x-2 gap-y-1" style={{ marginTop: 4, fontSize: 8, color: '#94a3b8' }}>
                                  <span>{hl(formatExperienceYears(c.experienceYears))}</span>
                                  <span>•</span>
                                  <span>{hl(c.desiredWorkLocation || '—')}</span>
                                </div>
                                <div style={{ fontSize: 8, color: '#1e293b', fontWeight: 600, marginTop: 3 }}>
                                  {hl(c.desiredIncome || '—')}
                                </div>
                              </>
                            ) : null}
                            {getPrSummary(c) && (
                              <div style={{ fontSize: 8, color: '#64748b', marginTop: 4, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {hl(getPrSummary(c))}
                              </div>
                            )}
                            {highlightQuery && Array.isArray(c.searchSnippets) && c.searchSnippets.length > 0 && (
                              <div style={{ fontSize: 8, color: '#475569', marginTop: 4, lineHeight: 1.35, padding: '4px 6px', background: '#fffbeb', borderRadius: 6, border: '1px solid #fde68a' }}>
                                {c.searchSnippets.map((snippet) => (
                                  <div key={snippet}>{hl(snippet)}</div>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center flex-wrap gap-1" style={{ marginTop: 4 }}>
                              {visibleSkills.map((skill) => (
                                <span key={skill} style={{ fontSize: 7, fontWeight: 500, color: '#3b82f6', background: '#eff6ff', borderRadius: 10, padding: '1px 5px' }}>
                                  {hl(skill)}
                                </span>
                              ))}
                              {more > 0 && (
                                <span style={{ fontSize: 7, color: '#94a3b8', background: '#f1f5f9', borderRadius: 10, padding: '1px 5px' }}>
                                  +{more}
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            {matchScore != null && (
                              <span style={{
                                fontSize: 8,
                                fontWeight: 700,
                                color: matchScore >= 85 ? '#166534' : matchScore >= 60 ? '#c2410c' : '#b91c1c',
                                background: matchScore >= 85 ? '#dcfce7' : matchScore >= 60 ? '#ffedd5' : '#fee2e2',
                                borderRadius: 10,
                                padding: '2px 6px',
                              }}
                              >
                                {Math.round(matchScore)}%
                              </span>
                            )}
                            <ChevronRight {...ICON_SM} color="#cbd5e1" aria-hidden />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="bg-white rounded-xl border border-slate-100 flex items-center justify-between" style={{ padding: '8px 12px' }}>
                <span style={{ fontSize: 8, color: '#94a3b8' }}>Hiển thị {limit} / trang</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    style={{ width: 18, height: 18, borderRadius: 2, border: '1px solid #e2e8f0', background: 'white', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    aria-label="Trang trước"
                  >
                    <ChevronLeft {...ICON_SM} aria-hidden />
                  </button>
                  {pageNumbers.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 2,
                        background: page === p ? '#3b82f6' : 'white',
                        color: page === p ? 'white' : '#64748b',
                        border: page === p ? 'none' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                        fontSize: 8,
                        fontWeight: 600,
                      }}
                    >
                      {p}
                    </button>
                  ))}
                  {totalPages > 7 && page < totalPages - 3 && (
                    <>
                      <span style={{ fontSize: 8, color: '#94a3b8' }}>...</span>
                      <button type="button" onClick={() => setPage(totalPages)} style={{ fontSize: 8, color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 2, width: 18, height: 18, background: 'white' }}>
                        {totalPages}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    style={{ width: 18, height: 18, borderRadius: 2, border: '1px solid #e2e8f0', background: 'white', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    aria-label="Trang sau"
                  >
                    <ChevronRight {...ICON_SM} aria-hidden />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 scout-scrollbar" style={{ minHeight: 0, overflowY: 'auto' }}>
            {!displayCandidate ? (
              <div className="bg-white rounded-xl border border-slate-100 text-center" style={{ padding: 20, fontSize: 10, color: '#94a3b8' }}>
                Chọn ứng viên để xem chi tiết
              </div>
            ) : (
              <>
                {(detailLoading || performanceDetailLoading) && (
                  <div style={{ fontSize: 8, color: '#64748b', marginBottom: 6, padding: '0 4px' }}>Đang tải chi tiết...</div>
                )}

                {performanceDetail?.recommendations?.length > 0 && (
                  <div className="bg-white rounded-xl border border-blue-100" style={{ padding: 10, background: '#eff6ff' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#1d4ed8', marginBottom: 6 }}>
                      Gợi ý từ JobShare WS ({performanceDetail.recommendations.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {performanceDetail.recommendations.map((rec) => {
                        const c = rec.candidate
                        if (!c) return null
                        const active = Number(activeRecommendationId) === Number(c.id)
                        return (
                          <button
                            key={rec.id}
                            type="button"
                            onClick={() => { setActiveRecommendationId(c.id); setSelectedId(c.id) }}
                            style={{
                              textAlign: 'left', padding: 6, borderRadius: 6, fontSize: 8,
                              border: active ? '1px solid #3b82f6' : '1px solid #dbeafe',
                              background: active ? 'white' : '#f8fafc', cursor: 'pointer',
                            }}
                          >
                            <div style={{ fontWeight: 700, color: '#1e293b' }}>{c.name || c.code || `CV #${c.id}`}</div>
                            <div style={{ color: '#64748b' }}>{c.desiredPosition || '—'}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <ScoutCandidateProfilePanel
                  candidate={displayCandidate}
                  highlightQuery={highlightQuery}
                  onClose={() => setSelectedId(null)}
                  showLockedHint={!displayCandidate.isUnlocked}
                  hideContact={isPerformancePartialUnlock}
                  accessLabel={isPerformancePartialUnlock ? 'Scout Performance — hồ sơ gợi ý' : 'Hồ sơ đã mở — thông tin đầy đủ'}
                  accessLabelColor={isPerformancePartialUnlock ? '#2563eb' : '#047857'}
                  footerNote={isPerformancePartialUnlock ? 'Email và SĐT không hiển thị. JobShare WS sẽ hỗ trợ liên hệ khi bạn quan tâm ứng viên này.' : null}
                />

                {!displayCandidate.isUnlocked && !isPerformancePartialUnlock && (
                  <div className="bg-white rounded-xl border border-slate-100" style={{ padding: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                        <Unlock {...ICON_MD} color="#8b5cf6" aria-hidden />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>Mở liên hệ bằng Credit</div>
                        <div style={{ fontSize: 8, color: '#64748b' }}>Credit hiện có: {credit}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{scoutCreditCost}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>credit</div>
                    </div>

                    <button
                      type="button"
                      onClick={handleUnlockClick}
                      disabled={unlocking || credit < scoutCreditCost}
                      style={{ width: '100%', fontSize: 9, fontWeight: 600, color: 'white', background: unlocking || credit < scoutCreditCost ? '#c4b5fd' : '#8b5cf6', border: 'none', borderRadius: 6, padding: '7px', cursor: unlocking || credit < scoutCreditCost ? 'not-allowed' : 'pointer', marginBottom: 6 }}
                    >
                      {unlocking ? 'Đang mở...' : 'Mở liên hệ ứng viên'}
                    </button>

                    <div style={{ fontSize: 7, color: '#94a3b8', textAlign: 'center' }}>
                      Sau khi mở sẽ hiển thị email, SĐT và thông tin liên hệ
                    </div>
                  </div>
                )}

                {displayCandidate.isUnlocked && isPerformancePartialUnlock && (
                  <div className="bg-white rounded-xl border border-blue-100" style={{ padding: 10, background: '#eff6ff' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Check {...ICON_MD} color="#2563eb" aria-hidden />
                      Hồ sơ gợi ý Scout Performance (không hiển thị email/SĐT)
                    </div>
                  </div>
                )}

                {displayCandidate.isUnlocked && !isPerformancePartialUnlock && (
                  <div className="bg-white rounded-xl border border-emerald-100" style={{ padding: 10, background: '#ecfdf5' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#047857', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Check {...ICON_MD} color="#047857" aria-hidden />
                      Đã mở hồ sơ bằng Scout Credit
                    </div>
                  </div>
                )}

                {!isPerformancePartialUnlock && selectedCand?.performanceRequest?.wantsSimilarCandidates && (
                  <div className="bg-white rounded-xl border border-indigo-200" style={{ padding: 10, background: '#eef2ff' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#4338ca', marginBottom: 4 }}>
                      Đã yêu cầu tìm ứng viên tương tự
                    </div>
                    <div style={{ fontSize: 8, color: '#6366f1', lineHeight: 1.35 }}>
                      JobShare WS đang tìm và gửi gợi ý qua Tin nhắn → WS.
                    </div>
                  </div>
                )}

                {!performanceDetail && !isPerformancePartialUnlock && (
                <div className="bg-white rounded-xl border border-slate-100" style={{ padding: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                      <Users {...ICON_MD} color="#3b82f6" aria-hidden />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>Scout Performance</div>
                      <div style={{ fontSize: 8, color: '#64748b' }}>Mở hồ sơ ngay — WS hỗ trợ tìm thêm nếu cần</div>
                    </div>
                  </div>

                  <p style={{ fontSize: 8, color: '#64748b', lineHeight: 1.45, marginBottom: 8 }}>
                    Mở hồ sơ ngay không tốn credit. Sau đó bạn có thể nhờ đội ngũ WorkStation tìm thêm ứng viên tương tự qua chat.
                  </p>

                  <button
                    type="button"
                    disabled={
                      performanceRequesting
                      || (selectedCand?.isUnlocked && selectedCand?.unlockType !== 'scout_performance')
                      || selectedCand?.unlockType === 'scout_performance'
                    }
                    onClick={handlePerformanceRequestClick}
                    style={{
                      width: '100%', fontSize: 9, fontWeight: 600, color: 'white',
                      background: performanceRequesting ? '#94a3b8' : '#3b82f6',
                      border: 'none', borderRadius: 6, padding: '7px',
                      cursor: performanceRequesting ? 'not-allowed' : 'pointer',
                      marginBottom: 6,
                    }}
                  >
                    {performanceRequesting
                      ? 'Đang mở hồ sơ...'
                      : selectedCand?.unlockType === 'scout_performance'
                        ? 'Đã mở bằng Scout Performance'
                        : 'Mở bằng Scout Performance'}
                  </button>

                  <div className="flex flex-col" style={{ gap: 3 }}>
                    {[
                      'Không tốn credit',
                      'Mở hồ sơ ngay (không hiển thị email/SĐT)',
                      'Có thể nhờ WS tìm thêm ứng viên tương tự',
                    ].map((item) => (
                      <div key={item} style={{ fontSize: 7, color: '#10b981', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Check {...ICON_SM} color="#10b981" aria-hidden />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                )}

                <div style={{ textAlign: 'center', paddingTop: 8, borderTop: '1px solid #e2e8f0', marginTop: 'auto' }}>
                  <button type="button" disabled style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8', background: 'none', border: 'none', cursor: 'not-allowed' }}>
                    Lưu ứng viên (sắp ra mắt)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {sharedModals}
    </>
  )
}

export default Scout
