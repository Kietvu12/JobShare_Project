import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import {
  Search, SlidersHorizontal, ChevronRight, ChevronLeft,
  UserCheck, X, Unlock, Users, Check, BadgeCheck, Loader2, Briefcase,
  Sparkles, FilePlus2, BookOpen, AlertTriangle, ArrowRight, Lock,
  MessageSquare, Gauge, ArrowUpRight, Coins, UserPlus, IdCard, Send, Info,
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
import performanceIllustration from '../../assets/Credit/Credit_VN.png'
import creditIllustration from '../../assets/Performance/Performance_VN.png'
import { BUSINESS_UI_FONT, BUSINESS_UI_FONT_IMPORT } from '../../utils/businessUiFont'

const ICON_SM = { width: 10, height: 10 }
const ICON_MD = { width: 12, height: 12 }

const PAGE_FONT = BUSINESS_UI_FONT

const scoutPageStyles = `
  ${BUSINESS_UI_FONT_IMPORT}
  .scout-scrollbar::-webkit-scrollbar { width: 6px; }
  .scout-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .scout-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .scout-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  .scout-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
  .business-homepage-scroll::-webkit-scrollbar { width: 4px; }
  .business-homepage-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  .scout-search-highlight {
    background-color: #fef08a !important;
    color: #92400e !important;
    padding: 0 2px;
    border-radius: 2px;
    font-weight: 600;
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
  }
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

  .business-homepage-shell { --hp-zoom: 1; }
  @media (min-width: 1024px) and (max-width: 1279px) {
    .business-homepage-shell { --hp-zoom: 0.9; }
  }
  @media (min-width: 1280px) and (max-width: 1535px) {
    .business-homepage-shell { --hp-zoom: 0.86; }
  }
  @media (min-width: 1024px) and (max-height: 760px) {
    .business-homepage-shell { --hp-zoom: 0.78; }
  }
  @media (min-width: 1024px) and (min-height: 761px) and (max-height: 860px) {
    .business-homepage-shell { --hp-zoom: 0.84; }
  }
  @media (min-width: 1536px) and (min-height: 861px) {
    .business-homepage-shell { --hp-zoom: 0.94; }
  }
  @media (min-width: 1920px) and (min-height: 900px) {
    .business-homepage-shell { --hp-zoom: 1; }
  }
  .business-homepage-ui { zoom: var(--hp-zoom); }
  @supports not (zoom: 1) {
    .business-homepage-ui {
      transform: scale(var(--hp-zoom));
      transform-origin: top left;
      width: calc(100% / var(--hp-zoom));
    }
  }

  @keyframes biz-hp-card-slide-in {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .biz-hp-solution-card-wrap {
    height: 100%;
    animation: biz-hp-card-slide-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  }
  .biz-hp-solution-card {
    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.28s ease;
  }
  .biz-hp-solution-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 32px -12px rgba(0, 119, 182, 0.35);
  }
  @media (prefers-reduced-motion: reduce) {
    .biz-hp-solution-card-wrap { animation: none; }
    .biz-hp-solution-card { transition: none; }
    .biz-hp-solution-card:hover { transform: none; }
  }
`

const CARD_SURFACE = {
  brandLight: 'bg-[#e8f4fa] border border-[#cce5f0]/80 text-slate-900',
  neutral: 'bg-white border border-slate-200/90 text-slate-900',
}

const scoutSolutionCards = [
  {
    num: '01',
    title: 'Scout Credit',
    subtitle: 'Tự chủ tìm kiếm & tiếp cận ứng viên',
    variant: 'brandLight',
    icon: Coins,
    mode: 'credit',
    features: [
      'Tìm kiếm AI theo kỹ năng & vị trí',
      'Xem hồ sơ ẩn danh trước khi unlock',
      'Chủ động chat & tiếp cận ứng viên',
      'Quản lý danh sách yêu thích',
      'Thanh toán credit linh hoạt',
    ],
    suitableFor: 'Doanh nghiệp chủ động tìm ứng viên, cần linh hoạt và kiểm soát chi phí tuyển dụng.',
    footerNote: 'Chỉ từ 1,000 credit · 1 credit = 1 lượt mở hồ sơ',
  },
  {
    num: '02',
    title: 'Scout Performance',
    subtitle: 'WS hỗ trợ tìm kiếm & tiếp cận ứng viên',
    variant: 'neutral',
    icon: UserPlus,
    mode: 'performance',
    features: [
      'WS tìm kiếm & đánh giá ứng viên',
      'WS chủ động gửi ứng viên theo JD',
      'Gợi ý thay thế khi cần',
      'Phí 20% dịch vụ giới thiệu việc làm khi tuyển thành công',
    ],
    suitableFor: 'Doanh nghiệp bận rộn, thiếu thời gian tìm kiếm ứng viên chất lượng.',
    footerNote: 'Không tốn credit mở hồ sơ · Phí 20% khi giới thiệu việc làm thành công',
  },
]

const scoutQuickActions = [
  { icon: Sparkles, title: 'Tạo JD mới (AI)', desc: 'Tạo JD miễn phí bằng AI', path: '/business/jobs' },
  { icon: Search, title: 'Tìm ứng viên (Scout Credit)', desc: 'Tìm trong kho ứng viên', action: 'explore' },
  { icon: MessageSquare, title: 'Gửi yêu cầu WS (Performance)', desc: 'Nhờ WS hỗ trợ tìm kiếm', action: 'explore' },
  { icon: Users, title: 'Dùng Scout Performance', desc: 'Mở hồ sơ & chat WS', action: 'explore' },
  { icon: BookOpen, title: 'Xem hướng dẫn sử dụng', desc: 'Tài liệu hướng dẫn Scout', path: '/business/knowledge' },
]

const scoutNotifications = [
  { dot: 'bg-[#0077B6]', text: 'Có 3 ứng viên mới phù hợp với Mechanical Engineer', time: '10 phút trước' },
  { dot: 'bg-[#0077B6]', text: 'WS đã gửi 5 ứng viên gợi ý cho IT Developer', time: '1 giờ trước' },
  { dot: 'bg-slate-400', text: 'Ứng viên T.N.H đã trả lời tin nhắn', time: '2 giờ trước' },
  { dot: 'bg-rose-500', text: 'Credit Scout sắp hết — nạp thêm để tiếp tục unlock', time: '3 giờ trước', warn: true },
]

const scoutNews = [
  { title: 'Báo cáo thị trường lao động IT Nhật Bản Q2/2024', date: '20/05/2024', img: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=200&h=150&fit=crop' },
  { title: '5 cách tiếp cận ứng viên kỹ thuật hiệu quả qua Scout', date: '18/05/2024', img: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=200&h=150&fit=crop' },
]

function ScoutSolutionCard({ card, onStart, animationDelay = 0 }) {
  const surface = CARD_SURFACE[card.variant] || CARD_SURFACE.neutral
  const DecoIcon = card.icon
  const bodyClass = 'text-slate-600'
  const mutedClass = 'text-slate-500'

  return (
    <div className="biz-hp-solution-card-wrap h-full" style={{ animationDelay: `${animationDelay}s` }}>
      <article
        className={`biz-hp-solution-card relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-[1.25rem] p-3.5 sm:p-4 ${surface}`}
      >
        <div className="relative z-20 flex items-start justify-between gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-800 shadow-sm ring-1 ring-slate-100">
            {card.num}
          </span>
        </div>

        <div className="relative z-10 mt-2 pr-14">
          <h3 className="line-clamp-2 text-base font-bold leading-tight sm:text-lg">{card.title}</h3>
          <p className={`mt-1 line-clamp-2 text-xs leading-snug sm:text-[13px] ${mutedClass}`}>{card.subtitle}</p>
        </div>

        <div className="pointer-events-none absolute right-0 top-[3.25rem] z-0 translate-x-[18%]" aria-hidden>
          <DecoIcon className="h-[6.5rem] w-[6.5rem] text-[#0077B6]/22 sm:h-28 sm:w-28" strokeWidth={1.1} />
        </div>

        <div className="relative z-10 mt-3 flex min-h-0 flex-1 flex-col">
          <h4 className="shrink-0 text-xs font-bold text-[#0077B6] sm:text-[13px]">Tính năng nổi bật</h4>
          <ul className={`mt-2 flex min-h-0 flex-1 flex-col gap-2 text-[11px] leading-snug sm:text-xs ${bodyClass}`}>
            {card.features.map((line) => (
              <li key={line} className="flex gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0077B6]" strokeWidth={2.5} />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 mt-3 shrink-0 border-t border-slate-200/80 pt-3">
          <h4 className="text-xs font-bold text-[#0077B6] sm:text-[13px]">Phù hợp với</h4>
          <p className={`mt-1.5 text-[11px] leading-snug sm:text-xs ${bodyClass}`}>{card.suitableFor}</p>
          {card.footerNote ? (
            <p className="mt-2 text-[10px] font-semibold text-[#0077B6] sm:text-[11px]">{card.footerNote}</p>
          ) : null}
          <button
            type="button"
            onClick={() => onStart(card.mode)}
            className="mt-3 w-full rounded-lg bg-[#0077B6] py-2.5 text-xs font-semibold text-white shadow-sm shadow-[#0077B6]/15 transition-colors hover:bg-[#006399] sm:text-sm inline-flex items-center justify-center gap-1.5"
          >
            Bắt đầu với {card.title}
            <ArrowRight className="h-4 w-4 shrink-0" />
          </button>
        </div>
      </article>
    </div>
  )
}

function ScoutOnboardingSidebar({ onExplore, onNavigate }) {
  const handleAction = (item) => {
    if (item.action === 'explore') onExplore()
    else if (item.path) onNavigate(item.path)
  }

  return (
    <div className="flex min-h-0 flex-col gap-3 xl:h-full xl:overflow-y-auto xl:pr-0.5 business-homepage-scroll scrollbar-hide">
      <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
        <h2 className="text-xs font-bold text-slate-900">Thao tác nhanh</h2>
        <div className="mt-2.5 flex flex-col gap-1">
          {scoutQuickActions.map((a) => {
            const Icon = a.icon
            return (
              <button
                key={a.title}
                type="button"
                onClick={() => handleAction(a)}
                className="flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-[#e8f4fa]"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e8f4fa] text-[#0077B6]">
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold leading-snug text-slate-800">{a.title}</div>
                  <div className="truncate text-[10px] text-slate-500">{a.desc}</div>
                </div>
                <ArrowUpRight className="h-3 w-3 shrink-0 text-slate-300" />
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xs font-bold text-slate-900">
            Thông báo
            <span className="rounded-full bg-[#0077B6] px-1.5 py-0.5 text-[9px] font-bold text-white">4</span>
          </h2>
          <button type="button" className="shrink-0 text-[10px] font-semibold text-[#0077B6]">Xem tất cả</button>
        </div>
        <div className="flex flex-col divide-y divide-slate-100">
          {scoutNotifications.map((n) => (
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
          {scoutNews.map((n) => (
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

function ScoutOnboardingView({ previewCandidates, scoutCreditCost, onStart, onExplore }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2 sm:gap-3">
      <header className="shrink-0">
        <h1 className="text-lg font-bold leading-tight text-slate-900 sm:text-xl">Scout</h1>
        <p className="mt-1 max-w-4xl text-xs leading-snug text-slate-600 sm:text-sm">
          JobShare giúp bạn tiếp cận đúng ứng viên nhanh hơn với Scout Credit và Scout Performance.
        </p>
      </header>

      <div className="grid shrink-0 grid-cols-1 items-stretch gap-2 sm:grid-cols-2 sm:gap-3">
        {scoutSolutionCards.map((card, index) => (
          <ScoutSolutionCard
            key={card.num}
            card={card}
            onStart={onStart}
            animationDelay={0.06 + index * 0.1}
          />
        ))}
      </div>

      <div className="mt-auto shrink-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="flex flex-col gap-1 border-b border-slate-100 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <h2 className="text-xs font-bold text-slate-900 sm:text-sm">Ứng viên tiềm năng gợi ý cho bạn</h2>
          <span className="text-[10px] text-slate-500 sm:text-[11px]">Hồ sơ đang được ẩn danh</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="text-[10px] sm:text-xs text-slate-400 uppercase bg-slate-50 border-b border-slate-100">
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
                  <td colSpan={7} className="px-3 py-6 sm:py-8 text-center text-xs sm:text-sm text-slate-400">
                    Chưa có gợi ý ứng viên — bấm &quot;Khám phá toàn bộ ứng viên&quot; để vào kho Scout.
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
                          <div className="text-xs sm:text-sm font-semibold text-slate-800">{getDisplayName(c)}</div>
                          <div className="text-[10px] sm:text-xs text-slate-400">{c.desiredPosition || c.jobCategory?.name || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-xs sm:text-sm text-slate-600">{formatExperienceYears(c.experienceYears)}</td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-1">
                        {skills.map((s) => (
                          <span key={s} className="rounded-full bg-[#e8f4fa] px-1.5 py-0.5 text-[10px] font-medium text-[#0077B6] sm:text-xs">{s}</span>
                        ))}
                        {more > 0 && <span className="text-[10px] text-slate-400">+{more}</span>}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-xs sm:text-sm text-slate-600">{c.desiredIncome || '—'}</td>
                    <td className="px-2 py-2 text-xs sm:text-sm text-slate-600">{c.desiredWorkLocation || '—'}</td>
                    <td className="px-2 py-2 text-center">
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#0077B6] sm:text-sm">
                        <Gauge className="w-3.5 h-3.5" />
                        —
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={onExplore}
                        className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-[#e8f4fa] sm:h-8 sm:w-8"
                        title={`Mở hồ sơ (${scoutCreditCost} credit)`}
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-t border-slate-100">
          <button
            type="button"
            onClick={onExplore}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-[#0077B6]/35 hover:text-[#0077B6] sm:rounded-xl sm:py-2.5 sm:text-sm"
          >
            Khám phá toàn bộ ứng viên
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
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

function ScoutCreditConfirmModal({
  open,
  onClose,
  onConfirm,
  loading = false,
  agreed,
  onAgreedChange,
  creditCost = 5,
}) {
  if (!open) return null

  const features = [
    {
      icon: IdCard,
      title: 'Doanh nghiệp mở thông tin liên hệ',
      desc: 'Nhận email và số điện thoại của ứng viên ngay lập tức.',
    },
    {
      icon: Send,
      title: 'Chủ động liên lạc với ứng viên',
      desc: 'Doanh nghiệp tự liên hệ và trao đổi trực tiếp với ứng viên.',
    },
    {
      icon: Coins,
      title: 'Chi phí mở hồ sơ',
      desc: (
        <>
          Mỗi lần mở hồ sơ ứng viên là{' '}
          <span className="font-bold text-[#0077B6]">{creditCost} credits</span>.
        </>
      ),
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 sm:p-4"
      style={{ fontFamily: BUSINESS_UI_FONT }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[960px] rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pt-6 pb-5 sm:px-8 sm:pt-7">
          <h2 className="pr-10 text-lg font-bold leading-snug text-slate-900 sm:text-xl">
            Mở hồ sơ bằng{' '}
            <span className="text-[#0077B6]">Scout Credit</span>
          </h2>

          <p className="mt-3 text-sm font-medium leading-[1.65] text-slate-700 sm:text-[15px]">
            Với{' '}
            <span className="font-bold text-[#0077B6]">Scout Credit</span>, doanh nghiệp sẽ mở thông tin
            liên hệ (email, số điện thoại) của ứng viên và{' '}
            <span className="font-bold text-[#0077B6]">chủ động liên lạc</span>.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-[1fr_minmax(280px,44%)] sm:gap-6 sm:items-center">
            <ul className="space-y-4">
              {features.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0077B6] text-white">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-bold leading-snug text-slate-900 sm:text-[15px]">{title}</p>
                    <p className="mt-0.5 text-sm font-medium leading-[1.55] text-slate-600 sm:text-[15px]">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-center sm:justify-end">
              <img
                src={creditIllustration}
                alt="Scout Credit — doanh nghiệp mở hồ sơ và chủ động liên lạc với ứng viên"
                className="w-full max-w-[380px] object-contain"
              />
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#e8f4fa] px-5 py-4 sm:px-6 sm:py-[18px]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0077B6] text-white">
              <Info className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <p className="min-w-0 text-sm font-medium leading-[1.55] text-slate-700 sm:text-[15px]">
              Workstation sẽ{' '}
              <span className="font-bold text-[#0077B6]">không can thiệp</span>{' '}
              vào quá trình liên hệ và tuyển dụng của doanh nghiệp với hồ sơ mở bằng hình thức Scout Credit.
            </p>
          </div>

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => onAgreedChange?.(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#0077B6] focus:ring-[#0077B6]"
            />
            <span className="text-sm font-medium leading-snug text-slate-700 sm:text-[15px]">
              Tôi đã đọc và hiểu rõ nội dung dịch vụ. Tôi xác nhận đồng ý mở hồ sơ bằng Scout Credit.
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 sm:px-8">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={loading || !agreed}
            onClick={onConfirm}
            className="rounded-lg bg-[#0077B6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#006399] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Đang mở hồ sơ...' : `Xác nhận và mở hồ sơ (${creditCost} credits)`}
          </button>
        </div>
      </div>
    </div>
  )
}

function ScoutPerformanceConfirmModal({
  open,
  onClose,
  onConfirm,
  loading = false,
  agreed,
  onAgreedChange,
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 sm:p-4"
      style={{ fontFamily: BUSINESS_UI_FONT }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[960px] rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pt-6 pb-5 sm:px-8 sm:pt-7">
          <h2 className="pr-10 text-lg font-bold leading-snug text-slate-900 sm:text-xl">
            Mở hồ sơ bằng{' '}
            <span className="text-[#E30613]">Scout Performance</span>
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-[1fr_minmax(280px,44%)] sm:gap-6 sm:items-center">
            <div className="space-y-3 text-sm font-medium leading-[1.65] text-slate-700 sm:text-[15px]">
              <p>
                Scout Performance là dịch vụ Workstation thay mặt doanh nghiệp tiếp cận ứng viên,
                xác nhận mức độ quan tâm, trao đổi điều kiện và hỗ trợ kết nối phù hợp.
              </p>
              <p>
                Doanh nghiệp{' '}
                <span className="font-bold text-slate-900">không cần sử dụng credit</span>{' '}
                để mở thông tin liên hệ của ứng viên. Sau khi gửi yêu cầu, đội ngũ Workstation
                sẽ chủ động liên hệ và cập nhật tiến độ qua hệ thống.
              </p>
            </div>
            <div className="flex items-center justify-center sm:justify-end">
              <img
                src={performanceIllustration}
                alt="Scout Performance — Workstation hỗ trợ doanh nghiệp tiếp cận và tuyển dụng ứng viên"
                className="w-full max-w-[380px] object-contain"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4 rounded-2xl bg-[#FFF8E7] px-5 py-4 sm:px-6 sm:py-[18px]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E30613] text-lg font-bold text-white">
              %
            </div>
            <div className="min-w-0 text-sm font-medium leading-[1.55] text-slate-800 sm:text-[15px]">
              <p>
                Trường hợp tuyển dụng thành công,{' '}
                <span className="font-bold text-slate-900">
                  doanh nghiệp thanh toán cho Workstation phí giới thiệu nhân sự
                </span>
              </p>
              <p className="mt-1">
                tương đương{' '}
                <span className="text-lg font-bold text-[#E30613] sm:text-xl">20% thu nhập năm</span>{' '}
                của ứng viên.
              </p>
            </div>
          </div>

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => onAgreedChange?.(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#E30613] focus:ring-[#E30613]"
            />
            <span className="text-sm font-medium leading-snug text-slate-700 sm:text-[15px]">
              Tôi đã đọc, hiểu rõ nội dung dịch vụ và đồng ý với điều kiện phí nêu trên.
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 sm:px-8">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={loading || !agreed}
            onClick={onConfirm}
            className="rounded-lg bg-[#E30613] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c90511] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Đang gửi yêu cầu...' : 'Xác nhận và gửi yêu cầu'}
          </button>
        </div>
      </div>
    </div>
  )
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

  const isConfirm = kind === 'similar-candidates-prompt'
  const noticeButtonClass = noticeVariant === 'error'
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-[#0077B6] hover:bg-[#006399]'

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
                className="text-xs px-3 py-2 rounded-lg text-white bg-[#0077B6] disabled:opacity-50"
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
  const location = useLocation()
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
  const [performanceTermsAgreed, setPerformanceTermsAgreed] = useState(false)
  const [creditTermsAgreed, setCreditTermsAgreed] = useState(false)
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
  const [forceDashboard, setForceDashboard] = useState(false)
  const [previewCandidates, setPreviewCandidates] = useState([])

  useEffect(() => {
    let cancelled = false
    async function loadPreview() {
      try {
        const previewRes = await apiService.getBusinessScoutCandidates({
          page: 1,
          limit: 5,
          sortBy: 'scoutListedAt',
          sortOrder: 'DESC',
        }).catch(() => null)
        if (cancelled) return
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
    loadPreview()
    return () => { cancelled = true }
  }, [])

  const enterScoutDashboard = useCallback(() => {
    setForceDashboard(true)
  }, [])

  /** Màn landing Scout luôn hiển thị trước; vào kho khi bấm CTA hoặc deep link job/performance. */
  const showOnboarding = !activityLoading
    && !forceDashboard
    && !performanceRequestId
    && !selectedJobId

  useEffect(() => {
    if (performanceRequestId || selectedJobId) {
      setForceDashboard(true)
    }
  }, [performanceRequestId, selectedJobId])

  useEffect(() => {
    if (performanceRequestId || selectedJobId) return
    setForceDashboard(false)
  }, [location.key, performanceRequestId, selectedJobId])

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
    setPerformanceTermsAgreed(false)
    setCreditTermsAgreed(false)
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

  const handlePerformanceRequestClick = () => {
    if (!selectedCand?.id) return
    if (selectedCand.isUnlocked && selectedCand.unlockType !== 'scout_performance') return
    if (selectedCand.unlockType === 'scout_performance') return

    setPerformanceTermsAgreed(false)
    setActionModal({
      open: true,
      kind: 'performance-confirm',
      title: 'Mở hồ sơ bằng Scout Performance',
      message: '',
      noticeVariant: 'info',
      requestId: null,
      sessionId: null,
    })
  }

  const submitPerformanceUnlock = async () => {
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
    setCreditTermsAgreed(false)
    setActionModal({
      open: true,
      kind: 'credit-confirm',
      title: 'Mở hồ sơ bằng Scout Credit',
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
                className="text-xs px-3 py-2 rounded-lg text-white bg-[#0077B6] disabled:opacity-50"
              >
                Có, tôi muốn tìm hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      <ScoutPerformanceConfirmModal
        open={actionModal.open && actionModal.kind === 'performance-confirm'}
        onClose={closeActionModal}
        onConfirm={submitPerformanceUnlock}
        loading={performanceRequesting}
        agreed={performanceTermsAgreed}
        onAgreedChange={setPerformanceTermsAgreed}
      />

      <ScoutCreditConfirmModal
        open={actionModal.open && actionModal.kind === 'credit-confirm'}
        onClose={closeActionModal}
        onConfirm={submitUnlock}
        loading={unlocking}
        agreed={creditTermsAgreed}
        onAgreedChange={setCreditTermsAgreed}
        creditCost={scoutCreditCost}
      />

      <ScoutActionModal
        open={
          actionModal.open
          && actionModal.kind !== 'performance-confirm'
          && actionModal.kind !== 'credit-confirm'
        }
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
            : closeActionModal
        }
        loading={
          actionModal.kind === 'similar-candidates-prompt' ? performanceRequesting : unlocking
        }
        confirmLabel={
          actionModal.kind === 'similar-candidates-prompt'
            ? 'Có'
            : 'Xác nhận'
        }
        cancelLabel={actionModal.kind === 'similar-candidates-prompt' ? 'Không' : 'Hủy'}
      >
      </ScoutActionModal>
    </>
  )

  if (activityLoading) {
    return (
      <>
        <style>{scoutPageStyles}</style>
        <div className="business-homepage-shell flex h-full min-h-0 items-center justify-center bg-[#f4f6f8]" style={{ fontFamily: PAGE_FONT }}>
          <Loader2 className="h-6 w-6 animate-spin text-[#0077B6]" />
        </div>
      </>
    )
  }

  if (showOnboarding) {
    return (
      <>
        <style>{scoutPageStyles}</style>
        {sharedModals}
        <div className="business-homepage-shell min-h-0 h-full overflow-x-hidden bg-[#f4f6f8] xl:h-full xl:overflow-hidden" style={{ fontFamily: PAGE_FONT }}>
          <div className="business-homepage-ui w-full min-h-0 p-2.5 sm:p-3 xl:h-full xl:flex xl:flex-col">
            <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-2.5 xl:h-full xl:grid-cols-[minmax(0,1fr)_minmax(196px,228px)] xl:gap-3 xl:overflow-hidden">
              <div className="business-homepage-scroll scrollbar-hide flex min-h-0 flex-col xl:h-full xl:overflow-y-auto xl:pr-0.5">
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
        </div>
      </>
    )
  }

  return (
    <>
      <style>{scoutPageStyles}</style>
      <div className="business-homepage-shell flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f6f8]" style={{ fontFamily: PAGE_FONT }}>
        <div className="business-homepage-ui flex min-h-0 flex-1 flex-col p-2 lg:p-3">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3 flex-1 min-h-0 overflow-hidden w-full">
          <div className="flex flex-col gap-2 scout-scrollbar" style={{ minHeight: 0, overflowY: 'auto' }}>
            <div className="bg-white rounded-xl border border-slate-100" style={{ padding: 10 }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                <Briefcase {...ICON_SM} color="#0077B6" aria-hidden />
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
                <button type="button" style={{ fontSize: 9, fontWeight: 600, color: '#0077B6', background: 'none', border: 'none', cursor: 'default', padding: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
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
                          border: selectedId === c.id ? '1px solid #0077B6' : '1px solid #e2e8f0',
                          background: selectedId === c.id ? '#e8f4fa' : 'white',
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
                                <span key={skill} style={{ fontSize: 7, fontWeight: 500, color: '#0077B6', background: '#e8f4fa', borderRadius: 10, padding: '1px 5px' }}>
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
                        background: page === p ? '#0077B6' : 'white',
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
                  <div className="bg-white rounded-xl border border-blue-100" style={{ padding: 10, background: '#e8f4fa' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#006399', marginBottom: 6 }}>
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
                              border: active ? '1px solid #0077B6' : '1px solid #e8f4fa',
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
                  accessLabelColor={isPerformancePartialUnlock ? '#0077B6' : '#047857'}
                  footerNote={isPerformancePartialUnlock
                    ? 'Email và SĐT không hiển thị. JobShare WS sẽ hỗ trợ liên hệ khi bạn quan tâm. Phí dịch vụ 20% khi giới thiệu việc làm thành công.'
                    : null}
                />

                {!displayCandidate.isUnlocked && !isPerformancePartialUnlock && (
                  <div className="bg-white rounded-xl border border-slate-100" style={{ padding: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0077B6' }}>
                        <Unlock {...ICON_MD} color="#0077B6" aria-hidden />
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
                      style={{ width: '100%', fontSize: 9, fontWeight: 600, color: 'white', background: unlocking || credit < scoutCreditCost ? '#94c5e0' : '#0077B6', border: 'none', borderRadius: 6, padding: '7px', cursor: unlocking || credit < scoutCreditCost ? 'not-allowed' : 'pointer', marginBottom: 6 }}
                    >
                      {unlocking ? 'Đang mở...' : 'Mở liên hệ ứng viên'}
                    </button>

                    <div style={{ fontSize: 7, color: '#94a3b8', textAlign: 'center' }}>
                      Sau khi mở sẽ hiển thị email, SĐT và thông tin liên hệ
                    </div>
                  </div>
                )}

                {displayCandidate.isUnlocked && isPerformancePartialUnlock && (
                  <div className="bg-white rounded-xl border border-blue-100" style={{ padding: 10, background: '#e8f4fa' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#0077B6', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Check {...ICON_MD} color="#0077B6" aria-hidden />
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
                  <div className="rounded-xl border border-[#cce5f0]/80 bg-[#e8f4fa]" style={{ padding: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#0077B6', marginBottom: 4 }}>
                      Đã yêu cầu tìm ứng viên tương tự
                    </div>
                    <div style={{ fontSize: 8, color: '#0077B6', lineHeight: 1.35 }}>
                      JobShare WS đang tìm và gửi gợi ý qua Tin nhắn → WS.
                    </div>
                  </div>
                )}

                {!performanceDetail && !isPerformancePartialUnlock && (
                <div className="bg-white rounded-xl border border-slate-100" style={{ padding: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e8f4fa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0077B6' }}>
                      <Users {...ICON_MD} color="#0077B6" aria-hidden />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>Scout Performance</div>
                      <div style={{ fontSize: 8, color: '#64748b' }}>Mở hồ sơ ngay — WS hỗ trợ tìm thêm nếu cần</div>
                    </div>
                  </div>

                  <p style={{ fontSize: 8, color: '#64748b', lineHeight: 1.45, marginBottom: 8 }}>
                    Mở hồ sơ ngay không tốn credit. Khi giới thiệu việc làm thành công, phí dịch vụ là 20%.
                    Sau đó bạn có thể nhờ đội ngũ WorkStation tìm thêm ứng viên tương tự qua chat.
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
                      background: performanceRequesting ? '#94a3b8' : '#0077B6',
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
                      'Phí 20% khi giới thiệu việc làm thành công',
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
      </div>

      {sharedModals}
    </>
  )
}

export default Scout
