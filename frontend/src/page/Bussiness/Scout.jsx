import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import {
  Search, SlidersHorizontal, ChevronRight, ChevronLeft,
  UserCheck, X, Unlock, Users, Check, Loader2, Briefcase,
  Sparkles, FilePlus2, BookOpen, AlertTriangle, ArrowRight, Lock,
  MessageSquare, ArrowUpRight, Coins, UserPlus, IdCard, Send, Info,
  RotateCw,
} from 'lucide-react'
import ScoutCandidateFilterFields, { SCOUT_FILTER_INPUT_CLASS } from '../../component/Bussiness/ScoutCandidateFilterFields.jsx'
import WorkLocationFilterModal from '../../component/Shared/WorkLocationFilterModal'
import JobCategoryPickerModal from '../../component/Shared/JobCategoryPickerModal'
import FilterBlock from '../../component/Shared/FilterBlock'
import FilterSelectDropdown from '../../component/Shared/FilterSelectDropdown'
import {
  getDefaultScoutFilters,
  hasActiveScoutFilters,
  passesScoutCandidateFilters,
} from '../../utils/scoutFilterOptions'
import apiService from '../../services/api'
import useBusinessUser from '../../hooks/useBusinessUser'
import { HomepageSidebar } from './Homepage'
import BusinessQuickActionsPanel, { DEFAULT_BUSINESS_QUICK_ACTIONS } from '../../component/Bussiness/BusinessQuickActionsPanel.jsx'
import {
  buildScoreMapFromMatches,
  fetchAllBusinessScoutCandidates,
  fetchJobScoutAiMatches,
} from '../../utils/businessJobAiMatching'
import { highlightSearchText } from '../../utils/searchTextHighlight'
import ScoutCandidateHoverTip from '../../component/Bussiness/ScoutCandidateHoverTip'
import { getScoutCandidateDetailUrl } from '../../utils/scoutCandidateDetailUrl'
import CreditTopUpModal from '../../component/Bussiness/CreditTopUpModal'
import creditIllustration from '../../assets/scout_credit_vi.png'
import performanceIllustration from '../../assets/scout_per_vi.png'
import { BUSINESS_UI_FONT, BUSINESS_UI_FONT_IMPORT } from '../../utils/businessUiFont'
import { getScoutSkillTags, formatScoutExperienceSeniority, formatScoutDesiredSalary, formatScoutListLocation, isScoutEmptyDisplayValue, getScoutListSkillExcerpt } from '../../utils/scoutCandidateDisplay'
import ScoutMatchBadge from '../../component/Bussiness/ScoutMatchBadge'

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
  .scout-candidates-list-ui {
    --scout-cand-fs-title: 14px;
    --scout-cand-fs-body: 13px;
    --scout-cand-fs-caption: 12px;
    --scout-cand-icon: 14px;
    line-height: 1.4;
    color: #334155;
    font-size: var(--scout-cand-fs-body);
  }
  @media (min-width: 1536px) {
    .scout-candidates-list-ui {
      --scout-cand-fs-title: 15px;
      --scout-cand-fs-body: 14px;
      --scout-cand-fs-caption: 12px;
      --scout-cand-icon: 15px;
    }
  }
  .scout-candidates-list-ui .scout-cand-title {
    font-size: var(--scout-cand-fs-title);
    line-height: 1.35;
    font-weight: 700;
  }
  .scout-candidates-list-ui .scout-cand-subtitle {
    font-size: var(--scout-cand-fs-body);
    line-height: 1.35;
    font-weight: 600;
  }
  .scout-candidates-list-ui .scout-cand-meta {
    font-size: var(--scout-cand-fs-body);
    line-height: 1.35;
  }
  .scout-candidates-list-ui .scout-cand-caption {
    font-size: var(--scout-cand-fs-caption);
    line-height: 1.4;
  }
  .scout-candidates-list-ui .scout-cand-icon {
    width: var(--scout-cand-icon);
    height: var(--scout-cand-icon);
    flex-shrink: 0;
  }

  .scout-detail-ui {
    --scout-detail-fs-title: 12px;
    --scout-detail-fs-body: 11px;
    --scout-detail-fs-caption: 10px;
    font-size: var(--scout-detail-fs-body);
    line-height: 1.45;
    color: #334155;
  }
  .scout-detail-ui .scout-detail-title {
    font-size: var(--scout-detail-fs-title);
    font-weight: 700;
    line-height: 1.35;
  }
  .scout-detail-ui .scout-detail-body {
    font-size: var(--scout-detail-fs-body);
    line-height: 1.45;
  }
  .scout-detail-ui .scout-detail-caption {
    font-size: var(--scout-detail-fs-caption);
    line-height: 1.4;
  }
  .candidate-scrollbar::-webkit-scrollbar { width: 4px; }
  .candidate-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .candidate-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .candidate-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
    scrollbar-gutter: stable;
    overflow-anchor: none;
  }
  /* Tooltip card cuối: hiện phía trên để không kéo dài scroll → tránh rung UI */
  .candidate-scrollbar .group:last-child .scout-candidate-hover-tip {
    top: auto;
    bottom: 100%;
    margin-top: 0;
    margin-bottom: 0.25rem;
  }
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
    box-shadow: 0 16px 32px -12px rgba(0, 119, 182, 0.35);
  }
  @media (min-width: 640px) {
    .biz-hp-solution-card:hover {
      transform: translateY(-4px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .biz-hp-solution-card-wrap { animation: none; }
    .biz-hp-solution-card { transition: none; }
    .biz-hp-solution-card:hover { transform: none; }
  }

  .scout-workspace-shell {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #f4f6f8;
  }
  .scout-workspace-body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    overflow: hidden;
  }
  @media (min-width: 1280px) {
    .scout-workspace-body {
      grid-template-columns: minmax(0, 1fr) 204px;
    }
  }
  .scout-workspace-content {
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow: hidden;
  }
  @media (min-width: 1024px) and (max-width: 1279px) {
    .scout-workspace-aside { display: none; }
  }
`

const SCOUT_PERFORMANCE_FEE_TIERS = [
  { level: 'Junior', range: '0 – 2 năm KN', fee: '15%', note: 'Vị trí entry / associate' },
  { level: 'Mid', range: '2 – 7 năm KN', fee: '18 – 20%', note: 'Vị trí mid-level' },
  { level: 'Senior', range: '7+ năm KN', fee: '20 – 25%', note: 'Lead / manager trở lên' },
]

const SCOUT_UNLOCK_COMPARE_ROWS = [
  { label: 'Chi phí mở hồ sơ', credit: 'Tốn credit / hồ sơ', performance: 'Không tốn credit' },
  { label: 'Thông tin liên hệ', credit: 'Email & SĐT ngay lập tức', performance: 'WS tiếp cận thay bạn' },
  { label: 'Ai chủ động liên hệ', credit: 'Doanh nghiệp tự liên hệ', performance: 'Workstation hỗ trợ' },
  { label: 'Phí khi tuyển thành công', credit: 'Chỉ credit mở hồ sơ', performance: '20% thu nhập năm ứng viên' },
]

const CARD_SURFACE = {
  brandLight: 'bg-[#e8f4fa] border border-[#cce5f0]/80 text-slate-900',
  neutral: 'bg-white border border-slate-200/90 text-slate-900',
}

const scoutSolutionCards = [
  {
    num: '01',
    title: 'Scout Trực Tiếp',
    subtitle: 'Tự chủ tìm kiếm & tiếp cận ứng viên',
    variant: 'brandLight',
    icon: Coins,
    mode: 'credit',
    painPoint: 'Khó tìm đủ ứng viên phù hợp trong thời gian ngắn',
    solution: 'Tự tìm kiếm và tiếp cận ứng viên từ kho hồ sơ chất lượng',
    features: [
      'Tìm kiếm AI theo kỹ năng & vị trí',
      'Xem hồ sơ ẩn danh trước khi unlock',
      'Chủ động chat & tiếp cận ứng viên',
    ],
    suitableFor: 'Doanh nghiệp chủ động tìm ứng viên',
    footerNote: 'Chỉ từ 1,000 credit · 1 credit = 1 lượt mở hồ sơ',
  },
  {
    num: '02',
    title: 'Scout Ủy Thác',
    subtitle: 'WS hỗ trợ tìm kiếm & tiếp cận ứng viên',
    variant: 'neutral',
    icon: UserPlus,
    mode: 'performance',
    painPoint: 'Bận rộn, thiếu thời gian sàng lọc và tiếp cận ứng viên',
    solution: 'Workstation tìm kiếm, đánh giá và tiếp cận ứng viên thay bạn',
    features: [
      'WS chủ động tìm & gửi ứng viên theo JD',
      'WS trao đổi điều kiện & sắp xếp phỏng vấn',
      'Gợi ý thay thế khi cần',
    ],
    suitableFor: 'Doanh nghiệp bận rộn, thiếu thời gian tuyển dụng',
    slaLine: 'WS phản hồi ứng viên đầu tiên trong 48h',
    footerNote: 'Không tốn credit mở hồ sơ · Phí 20% khi giới thiệu việc làm thành công',
  },
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
          <p className="mt-2 text-xs font-bold leading-snug text-slate-800 sm:text-[13px]">{card.painPoint}</p>
          <p className={`mt-1.5 line-clamp-2 text-[11px] leading-snug sm:text-xs ${mutedClass}`}>{card.solution}</p>
        </div>

        <div className="pointer-events-none absolute right-0 top-[3.25rem] z-0 translate-x-[18%]" aria-hidden>
          <DecoIcon className="h-[6.5rem] w-[6.5rem] text-[#0077B6]/22 sm:h-28 sm:w-28" strokeWidth={1.1} />
        </div>

        <div className="relative z-10 mt-3 flex min-h-0 flex-1 flex-col">
          <ul className={`flex min-h-0 flex-1 flex-col gap-2 text-[11px] leading-snug sm:text-xs ${bodyClass}`}>
            {card.features.map((line) => (
              <li key={line} className="flex gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0077B6]" strokeWidth={2.5} />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 mt-3 shrink-0 border-t border-slate-200/80 pt-3">
          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 sm:text-[11px]">
            Phù hợp: {card.suitableFor}
          </span>
          {card.slaLine ? (
            <p className="mt-2 text-[10px] font-bold text-emerald-700 sm:text-[11px]">{card.slaLine}</p>
          ) : null}
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

function ScoutOnboardingSidebar({ onNavigate }) {
  const handleAction = (item) => {
    if (item.path) onNavigate(item.path)
  }

  return (
    <div className="flex min-h-0 flex-col gap-3 xl:h-full xl:overflow-y-auto xl:pr-0.5 business-homepage-scroll scrollbar-hide">
      <BusinessQuickActionsPanel actions={DEFAULT_BUSINESS_QUICK_ACTIONS} onActionClick={handleAction} />

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

function getPreviewCandidateScore(candidate) {
  let score = 0
  if (Number(candidate?.experienceYears) > 0) score += 2
  if (candidate?.desiredIncome != null && candidate?.desiredIncome !== '') score += 2
  if (candidate?.desiredWorkLocation) score += 1
  if (getScoutSkillTags(candidate).length > 0) score += 3
  if (candidate?.desiredPosition || candidate?.jobCategory?.name) score += 1
  return score
}

function rankPreviewCandidates(candidates) {
  return [...candidates].sort((a, b) => getPreviewCandidateScore(b) - getPreviewCandidateScore(a))
}

function ScoutMetaChip({ label, children }) {
  if (isScoutEmptyDisplayValue(children)) return null
  return (
    <span
      className="scout-cand-meta inline-flex max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700"
      title={label ? `${label}: ${children}` : String(children)}
    >
      {children}
    </span>
  )
}

function ScoutCandidateRowBody({
  candidate,
  matchScore,
  hl = (text) => text,
  showNew = false,
}) {
  const position = candidate.desiredPosition || candidate.jobCategory?.name
  const exp = formatScoutExperienceSeniority(candidate.experienceYears)
  const salary = formatScoutDesiredSalary(candidate)
  const location = formatScoutListLocation(candidate)
  const skillExcerpt = getScoutListSkillExcerpt(candidate)
  const chips = [
    { label: 'Kinh nghiệm', value: exp },
    { label: 'Khu vực', value: location },
    { label: 'Lương', value: salary },
  ].filter((chip) => !isScoutEmptyDisplayValue(chip.value))

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <p className="scout-cand-title truncate text-slate-900">
          {hl(getDisplayName(candidate))}
        </p>
        {showNew ? (
          <span className="scout-cand-caption rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-700">
            Mới
          </span>
        ) : null}
      </div>
      {position ? (
        <p className="scout-cand-subtitle mt-1 truncate text-slate-600">
          {hl(position)}
        </p>
      ) : null}
      {Number.isFinite(Number(matchScore)) ? (
        <div className="mt-2">
          <ScoutMatchBadge score={matchScore} className="scout-cand-meta !text-[12px] !px-2.5 !py-1" iconClassName="scout-cand-icon" />
        </div>
      ) : null}
      {chips.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <ScoutMetaChip key={chip.label} label={chip.label}>{chip.value}</ScoutMetaChip>
          ))}
        </div>
      ) : null}
      {skillExcerpt ? (
        <p className="scout-cand-caption mt-2 line-clamp-1 text-slate-500" title={skillExcerpt}>
          {hl(skillExcerpt)}
        </p>
      ) : null}
    </>
  )
}

function ScoutPreviewCandidateRow({ candidate, matchScore, scoutCreditCost, onExplore }) {
  return (
    <div className="group flex gap-3 px-3 py-3 transition-colors hover:bg-slate-50/80 sm:gap-3.5 sm:px-4 sm:py-3.5">
      <AvatarCircle candidate={candidate} size={40} />
      <div className="min-w-0 flex-1">
        <ScoutCandidateRowBody candidate={candidate} matchScore={matchScore} />
      </div>
      <button
        type="button"
        onClick={onExplore}
        className="flex h-8 w-8 shrink-0 self-start items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-colors hover:border-[#0077B6]/35 hover:bg-[#e8f4fa] hover:text-[#0077B6] sm:h-9 sm:w-9"
        title={`Mở hồ sơ (${scoutCreditCost} credit)`}
      >
        <Lock className="h-4 w-4" />
      </button>
    </div>
  )
}

function ScoutOnboardingView({ previewCandidates, previewScoreByCvId, scoutCreditCost, onStart, onExplore }) {
  const rankedPreviewCandidates = useMemo(
    () => rankPreviewCandidates(previewCandidates).slice(0, 5),
    [previewCandidates],
  )

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 sm:gap-3">
      <header className="shrink-0">
        <h1 className="text-lg font-bold leading-tight text-slate-900 sm:text-xl">Scout</h1>
        <p className="mt-1 max-w-4xl text-xs leading-snug text-slate-600 sm:text-sm">
          JobShare giúp bạn tiếp cận đúng ứng viên nhanh hơn với Scout Trực Tiếp và Scout Ủy Thác.
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

      <div className="scout-candidates-list-ui mt-auto shrink-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="flex flex-col gap-1 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div>
            <h2 className="scout-cand-title text-slate-900">Ứng viên tiềm năng gợi ý cho bạn</h2>
            <p className="scout-cand-caption mt-0.5 text-slate-500">Xem trước hồ sơ ẩn danh trong kho Scout</p>
          </div>
          <span className="scout-cand-caption inline-flex w-fit items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-500">
            <Lock className="h-3 w-3" />
            Hồ sơ đang được ẩn danh
          </span>
        </div>

        {rankedPreviewCandidates.length === 0 ? (
          <div className="px-3 py-8 text-center sm:px-4 sm:py-10">
            <Users className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-xs text-slate-500 sm:text-sm">
              Chưa có gợi ý ứng viên — bấm &quot;Khám phá toàn bộ ứng viên&quot; để vào kho Scout.
            </p>
          </div>
        ) : (
          <div className="scout-candidates-list-ui divide-y divide-slate-100">
            {rankedPreviewCandidates.map((candidate) => (
              <ScoutPreviewCandidateRow
                key={candidate.id}
                candidate={candidate}
                matchScore={previewScoreByCvId[String(candidate.id)]}
                scoutCreditCost={scoutCreditCost}
                onExplore={onExplore}
              />
            ))}
          </div>
        )}

        <div className="border-t border-slate-100 px-3 py-2 sm:px-4 sm:py-2.5">
          <button
            type="button"
            onClick={onExplore}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-[#0077B6]/35 hover:bg-[#f8fbfd] hover:text-[#0077B6] sm:rounded-xl sm:py-2.5 sm:text-sm"
          >
            Khám phá toàn bộ ứng viên
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

const ANONYMOUS_AVATAR = 'https://api.dicebear.com/7.x/shapes/svg?seed=scout-anonymous'

function ScoutUnlockOptionCard({
  icon: Icon,
  iconWrapClass = 'bg-[#e8f4fa]',
  iconColor = '#0077B6',
  title,
  subtitle,
  description,
  footer,
  buttonLabel,
  loadingLabel,
  onClick,
  disabled = false,
  loading = false,
}) {
  return (
    <div className="scout-detail-ui flex h-full min-h-[11.5rem] flex-col rounded-xl border border-slate-100 bg-white p-3 sm:p-4">
      <div className="flex shrink-0 items-start gap-2">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconWrapClass}`}>
          <Icon {...ICON_MD} color={iconColor} aria-hidden />
        </div>
        <div className="min-w-0 pt-0.5">
          <div className="scout-detail-title text-slate-800">{title}</div>
          {subtitle ? (
            <div className="scout-detail-caption mt-0.5 text-slate-500">{subtitle}</div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col">
        {description ? (
          <p className="scout-detail-body leading-relaxed text-slate-500">{description}</p>
        ) : null}
        {footer ? (
          <div className="mt-auto border-t border-slate-200 pt-2">{footer}</div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className="scout-detail-body mt-3 w-full shrink-0 rounded-md py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#94c5e0] bg-[#0077B6] hover:bg-[#006399] disabled:opacity-100"
      >
        {loading ? loadingLabel : buttonLabel}
      </button>
    </div>
  )
}

function ScoutUnlockCompareTable() {
  return (
    <div className="scout-detail-ui mb-2 overflow-hidden rounded-lg border border-slate-200">
      <table className="scout-detail-body w-full text-left">
        <thead>
          <tr className="bg-slate-50 text-slate-500">
            <th className="px-2 py-1.5 font-semibold" style={{ width: '28%' }} />
            <th className="px-2 py-1.5 font-semibold text-[#0077B6]">Scout Trực Tiếp</th>
            <th className="px-2 py-1.5 font-semibold text-[#0077B6]">Scout Ủy Thác</th>
          </tr>
        </thead>
        <tbody>
          {SCOUT_UNLOCK_COMPARE_ROWS.map((row, idx) => (
            <tr key={row.label} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
              <td className="px-2 py-1.5 font-semibold text-slate-600">{row.label}</td>
              <td className="px-2 py-1.5 text-slate-700">{row.credit}</td>
              <td className="px-2 py-1.5 text-slate-700">{row.performance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MatchScoreRing({ score, size = 34 }) {
  if (score == null) return null
  const pct = Math.min(100, Math.max(0, Math.round(score)))
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  const color = pct >= 85 ? '#10b981' : pct >= 60 ? '#f97316' : '#ef4444'
  const center = size / 2
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold leading-none text-slate-800">
        {pct}%
      </span>
    </div>
  )
}

function isCandidateNew(candidate) {
  const raw = candidate?.scoutListedAt || candidate?.createdAt || candidate?.created_at
  if (!raw) return !candidate?.isUnlocked
  const diff = Date.now() - new Date(raw).getTime()
  return diff >= 0 && diff < 7 * 86400000
}

function ScoutFilterPanel({
  selectedJobId,
  jobs,
  jobsLoading,
  onJobChange,
  scoutFilters,
  setScoutFilters,
  searchInput,
  setSearchInput,
  onApply,
  onClear,
  hasActiveFilters,
  displayCount,
  listLoading,
}) {
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showJobCategoryModal, setShowJobCategoryModal] = useState(false)

  const jobOptions = useMemo(() => [
    { value: '', label: 'Tất cả ứng viên Scout' },
    ...jobs.map((job) => ({
      value: String(job.id),
      label: job.title || job.titleEn || `JD #${job.id}`,
    })),
  ], [jobs])

  const leadingBlock = (
    <FilterBlock icon={Briefcase} label="Gắn JD (AI gợi ý)" compact>
      <FilterSelectDropdown
        value={selectedJobId || ''}
        onChange={onJobChange}
        options={jobOptions}
        placeholder="Tất cả ứng viên Scout"
        searchable
        searchPlaceholder="Tìm theo tên JD..."
        disabled={jobsLoading}
        className={SCOUT_FILTER_INPUT_CLASS}
        maxPanelHeight={220}
      />
    </FilterBlock>
  )

  return (
    <section className="scout-workspace-filters shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5">
        <h2 className="text-xs font-bold text-gray-900">Bộ lọc tìm kiếm</h2>
        <div className="flex items-center gap-2">
          {hasActiveFilters ? (
            <button type="button" onClick={onClear} className="text-[9px] font-semibold text-[#0077B6] hover:underline">
              Xóa điều kiện
            </button>
          ) : null}
          <button
            type="button"
            onClick={onApply}
            disabled={listLoading}
            className="inline-flex h-7 items-center justify-center gap-1 rounded px-2.5 shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: '#facc15' }}
          >
            {listLoading ? (
              <RotateCw className="h-3 w-3 animate-spin text-gray-800" />
            ) : (
              <Search className="h-3 w-3 text-gray-800" />
            )}
            <span className="text-[9px] font-semibold text-gray-800">
              {`Tìm ${Number(displayCount || 0).toLocaleString('vi-VN')} hồ sơ`}
            </span>
          </button>
        </div>
      </div>
      <div className="scout-scrollbar custom-scrollbar max-h-[42vh] overflow-y-auto p-3 xl:max-h-none">
        <ScoutCandidateFilterFields
          leadingBlock={leadingBlock}
          scoutFilters={scoutFilters}
          setScoutFilters={setScoutFilters}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          onOpenLocationModal={() => setShowLocationModal(true)}
          onOpenJobCategoryModal={() => setShowJobCategoryModal(true)}
        />
      </div>
      <WorkLocationFilterModal
        open={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        value={scoutFilters.locations}
        onConfirm={(locations) => setScoutFilters((prev) => ({ ...prev, locations }))}
        language="vi"
        rightPanelTitle="Chọn khu vực"
      />
      <JobCategoryPickerModal
        open={showJobCategoryModal}
        onClose={() => setShowJobCategoryModal(false)}
        language="vi"
        initialLeafId={scoutFilters.jobCategoryId || null}
        onConfirm={({ id, displayName }) => {
          setScoutFilters((prev) => ({
            ...prev,
            jobCategoryId: id != null ? String(id) : '',
            jobCategoryLabel: displayName || '',
          }))
          setShowJobCategoryModal(false)
        }}
      />
    </section>
  )
}

function ScoutCandidateListItem({
  candidate,
  matchScore,
  highlightQuery,
  onOpenDetail,
  hl,
}) {
  const showNew = isCandidateNew(candidate)

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => onOpenDetail(candidate.id)}
        className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-sm sm:px-4 sm:py-3.5"
      >
        <AvatarCircle candidate={candidate} size={48} />
        <div className="min-w-0 flex-1">
          <ScoutCandidateRowBody
            candidate={candidate}
            matchScore={matchScore}
            hl={hl}
            showNew={showNew}
          />
          {highlightQuery && Array.isArray(candidate.searchSnippets) && candidate.searchSnippets.length > 0 && (
            <div className="scout-cand-caption mt-1.5 line-clamp-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-900">
              {candidate.searchSnippets.map((snippet) => (
                <span key={snippet}>{hl(snippet)} </span>
              ))}
            </div>
          )}
        </div>
        {!candidate.isUnlocked ? (
          <Lock className="mt-1 h-4 w-4 shrink-0 text-slate-400" strokeWidth={2} aria-hidden />
        ) : null}
      </button>
      <ScoutCandidateHoverTip candidate={candidate} hl={hl} matchScore={matchScore} />
    </div>
  )
}

function getSkillTags(candidate) {
  return getScoutSkillTags(candidate)
}

function getDisplayName(candidate) {
  if (!candidate) return 'Ứng viên ẩn danh'
  if (candidate.isUnlocked && candidate.name) return candidate.name
  return candidate.anonymousName || 'Ứng viên ẩn danh'
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
            <span className="text-[#0077B6]">Scout Trực Tiếp</span>
          </h2>

          <p className="mt-3 text-sm font-medium leading-[1.65] text-slate-700 sm:text-[15px]">
            Với{' '}
            <span className="font-bold text-[#0077B6]">Scout Trực Tiếp</span>, doanh nghiệp sẽ mở thông tin
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
                alt="Scout Trực Tiếp — doanh nghiệp mở hồ sơ và chủ động liên lạc với ứng viên"
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
              vào quá trình liên hệ và tuyển dụng của doanh nghiệp với hồ sơ mở bằng hình thức Scout Trực Tiếp.
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
              Tôi đã đọc và hiểu rõ nội dung dịch vụ. Tôi xác nhận đồng ý mở hồ sơ bằng Scout Trực Tiếp.
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
  onQuickCreateJd,
  loading = false,
  agreed,
  onAgreedChange,
  jobs = [],
  initialJobId = '',
  wantsSimilar,
  onWantsSimilarChange,
  requirementNote = '',
  onRequirementNoteChange,
}) {
  const [step, setStep] = useState('confirm')
  const [selectedJobId, setSelectedJobId] = useState(initialJobId || '')
  const skipJdStep = !!initialJobId

  const jobOptions = useMemo(() => jobs.map((job) => ({
    value: String(job.id),
    label: job.title || job.titleEn || `JD #${job.id}`,
  })), [jobs])

  useEffect(() => {
    if (!open) {
      setStep('confirm')
      setSelectedJobId(initialJobId || '')
      return
    }
    setStep('confirm')
    setSelectedJobId(initialJobId || '')
  }, [open, initialJobId])

  if (!open) return null

  const selectedJob = jobs.find((j) => String(j.id) === String(selectedJobId))
  const canProceedJd = !!selectedJobId

  const handleConfirm = () => {
    onConfirm?.({
      jobId: selectedJobId || null,
      jobTitle: selectedJob?.title || selectedJob?.titleEn || null,
      wantsSimilarCandidates: !!wantsSimilar,
      message: requirementNote?.trim() || undefined,
    })
  }

  const handleConfirmStepContinue = () => {
    if (skipJdStep) {
      handleConfirm()
      return
    }
    setStep('jd')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 sm:p-4"
      style={{ fontFamily: BUSINESS_UI_FONT }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[960px] rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
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
            {step === 'jd' ? (
              'Chọn JD cho WS hearing'
            ) : (
              <>
                Xác nhận{' '}
                <span className="text-[#E30613]">Scout Ủy Thác</span>
              </>
            )}
          </h2>

          {step === 'confirm' && (
            <>
              {skipJdStep && selectedJob ? (
                <div className="mt-3 rounded-lg bg-[#e8f4fa] px-4 py-2.5 text-sm text-[#006399]">
                  JD: <strong>{selectedJob.title || selectedJob.titleEn}</strong>
                </div>
              ) : null}

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-[1fr_minmax(280px,44%)] sm:gap-6 sm:items-start">
                <div className="space-y-3 text-sm font-medium leading-[1.65] text-slate-700 sm:text-[15px]">
                  <p>
                    Scout Ủy Thác là dịch vụ Workstation thay mặt doanh nghiệp tiếp cận ứng viên,
                    xác nhận mức độ quan tâm và hỗ trợ kết nối phù hợp.
                  </p>
                  <p>
                    Doanh nghiệp <span className="font-bold text-slate-900">không cần sử dụng credit</span>.
                    WS sẽ chủ động liên hệ và cập nhật tiến độ qua hệ thống.
                  </p>
                </div>
                <div className="flex items-center justify-center sm:justify-end">
                  <img
                    src={performanceIllustration}
                    alt="Scout Ủy Thác"
                    className="w-full max-w-[380px] object-contain"
                  />
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600">
                  Bảng phí tham khảo (khi tuyển thành công)
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500">
                      <th className="px-4 py-2 font-semibold">Cấp bậc</th>
                      <th className="px-4 py-2 font-semibold">Kinh nghiệm</th>
                      <th className="px-4 py-2 font-semibold">Phí giới thiệu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SCOUT_PERFORMANCE_FEE_TIERS.map((tier, idx) => (
                      <tr key={tier.level} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="px-4 py-2 font-semibold text-slate-800">{tier.level}</td>
                        <td className="px-4 py-2 text-slate-600">{tier.range}</td>
                        <td className="px-4 py-2 font-bold text-[#E30613]">{tier.fee}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">
                  Phí tính trên thu nhập năm ứng viên. Hợp đồng B2B — liên hệ WS để chốt mức phí cụ thể.
                </p>
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
            </>
          )}

          {step === 'jd' && (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                WS cần JD và yêu cầu tuyển dụng để hearing và giới thiệu ứng viên phù hợp.
                Chọn JD có sẵn hoặc tạo mới trong Quản lý JD.
              </p>
              <label className="block">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700">JD liên quan *</span>
                  {onQuickCreateJd ? (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => onQuickCreateJd({
                        requirementNote,
                        wantsSimilar,
                      })}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#0077B6]/25 bg-[#e8f4fa] px-2.5 py-1 text-xs font-semibold text-[#0077B6] transition hover:border-[#0077B6]/40 hover:bg-[#dff0fa] disabled:opacity-50"
                    >
                      <FilePlus2 className="h-3.5 w-3.5" aria-hidden />
                      Tạo JD mới
                    </button>
                  ) : null}
                </div>
                <FilterSelectDropdown
                  value={selectedJobId}
                  onChange={setSelectedJobId}
                  options={jobOptions}
                  placeholder="— Tìm hoặc chọn JD —"
                  searchable
                  searchPlaceholder="Tìm theo tên JD..."
                  optionSize="comfortable"
                  maxPanelHeight={280}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#0077B6]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Yêu cầu bổ sung (tuỳ chọn)</span>
                <textarea
                  value={requirementNote}
                  onChange={(e) => onRequirementNoteChange?.(e.target.value)}
                  rows={3}
                  placeholder="VD: Ưu tiên ứng viên biết tiếng Nhật N2+, có thể onsite tại Tokyo..."
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#0077B6] resize-y"
                />
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <input
                  type="checkbox"
                  checked={!!wantsSimilar}
                  onChange={(e) => onWantsSimilarChange?.(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#E30613] focus:ring-[#E30613]"
                />
                <span className="text-sm font-medium leading-snug text-slate-700">
                  Đồng thời nhờ WS tìm thêm ứng viên tương tự (headhunt)
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 sm:px-8">
          <div>
            {step === 'jd' ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => setStep('confirm')}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Quay lại
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Hủy
            </button>
            {step === 'confirm' ? (
              <button
                type="button"
                disabled={loading || !agreed}
                onClick={handleConfirmStepContinue}
                className="rounded-lg bg-[#0077B6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#006399] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? 'Đang gửi yêu cầu...'
                  : skipJdStep
                    ? 'Xác nhận và gửi yêu cầu'
                    : 'Tiếp tục'}
              </button>
            ) : (
              <button
                type="button"
                disabled={loading || !canProceedJd}
                onClick={handleConfirm}
                className="rounded-lg bg-[#E30613] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c90511] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Đang gửi yêu cầu...' : 'Xác nhận và gửi yêu cầu'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ScoutPerformanceSuccessModal({
  open,
  onClose,
  requestCode,
  sessionId,
  requestId,
  wantsSimilarCandidates,
  onGoApplications,
  onGoChat,
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 sm:p-4"
      style={{ fontFamily: BUSINESS_UI_FONT }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dcfce7] text-[#059669]">
          <Check className="h-6 w-6" strokeWidth={2.5} />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-900">Đã gửi yêu cầu Scout Ủy Thác</h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          WS sẽ phản hồi trong vòng <strong>24 giờ làm việc</strong>.
          {wantsSimilarCandidates ? ' Đồng thời WS sẽ tìm thêm ứng viên tương tự.' : ''}
        </p>
        {requestCode && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Mã yêu cầu</div>
            <div className="mt-1 text-xl font-bold text-[#0077B6]">{requestCode}</div>
          </div>
        )}
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onGoApplications}
            className="w-full rounded-lg bg-[#0077B6] py-2.5 text-sm font-semibold text-white hover:bg-[#006399]"
          >
            Theo dõi tại Quản lý tiến cử
          </button>
          {sessionId && (
            <button
              type="button"
              onClick={onGoChat}
              className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Mở chat WS
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

function ScoutAttachJobModal({
  open,
  onClose,
  jobs,
  loading,
  onSubmit,
  candidateName,
  jobScoreById = {},
}) {
  const [jobId, setJobId] = useState('')
  const [note, setNote] = useState('')

  const jobOptions = useMemo(() => {
    const sorted = [...(jobs || [])].sort((a, b) => {
      const sa = jobScoreById[String(a.id)] ?? -1
      const sb = jobScoreById[String(b.id)] ?? -1
      return sb - sa
    })
    return sorted.map((job) => {
      const score = jobScoreById[String(job.id)]
      const base = job.title || job.titleEn || `JD #${job.id}`
      const label = score != null && score > 0 ? `${base} · Match ${Math.round(score)}%` : base
      return { value: String(job.id), label }
    })
  }, [jobs, jobScoreById])

  useEffect(() => {
    if (open) {
      setJobId('')
      setNote('')
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-slate-900">Thêm vào pipeline JD</h3>
        <p className="mt-1 text-xs text-slate-500">
          {candidateName ? `Ứng viên: ${candidateName}` : 'Chọn JD để đưa ứng viên vào pipeline tuyển dụng'}
        </p>
        <label className="mt-4 block">
          <span className="text-xs font-semibold text-slate-600">JD *</span>
          <FilterSelectDropdown
            value={jobId}
            onChange={setJobId}
            options={jobOptions}
            placeholder="— Tìm hoặc chọn JD —"
            searchable
            searchPlaceholder="Tìm theo tên JD..."
            optionSize="comfortable"
            maxPanelHeight={280}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#0077B6]"
          />
        </label>
        <label className="mt-3 block">
          <span className="text-[10px] font-semibold text-slate-600">Ghi chú</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tuỳ chọn"
            className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-[#0077B6]"
          />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600">Hủy</button>
          <button
            type="button"
            disabled={!jobId || loading}
            onClick={() => onSubmit({ jobId, note })}
            className="rounded-lg bg-[#0077B6] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Đang thêm...' : 'Thêm vào pipeline'}
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

function AvatarCircle({ candidate, size = 28 }) {
  const name = getDisplayName(candidate)
  const seed = candidate?.isUnlocked ? name : `anon-${candidate?.id || 'x'}`
  const src = candidate?.isUnlocked && candidate?.avatarPhotoPath
    ? candidate.avatarPhotoPath
    : `${ANONYMOUS_AVATAR}&seed=${encodeURIComponent(String(seed))}`

  return (
    <img
      src={src}
      alt=""
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: '#e2e8f0' }}
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
  const cvIdParam = searchParams.get('cvId') || ''
  const { credit: userCredit, user } = useBusinessUser()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 })
  const [credit, setCredit] = useState(userCredit || 0)
  const [scoutCreditCost, setScoutCreditCost] = useState(5)
  const [error, setError] = useState('')
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [matchLoading, setMatchLoading] = useState(false)
  const [scoreByCvId, setScoreByCvId] = useState({})
  const [aiMatchedTotal, setAiMatchedTotal] = useState(0)
  const [allScoutCandidates, setAllScoutCandidates] = useState([])
  const [performanceDetail, setPerformanceDetail] = useState(null)
  const [showPerformanceCta, setShowPerformanceCta] = useState(false)
  const [exploreSubmitting, setExploreSubmitting] = useState(false)
  const [creditTopUpOpen, setCreditTopUpOpen] = useState(false)
  const [activityLoading, setActivityLoading] = useState(true)
  const [forceDashboard, setForceDashboard] = useState(false)
  const [previewCandidates, setPreviewCandidates] = useState([])
  const [previewScoreByCvId, setPreviewScoreByCvId] = useState({})
  const [scoutFilters, setScoutFilters] = useState(getDefaultScoutFilters)
  const [filterAllCandidates, setFilterAllCandidates] = useState([])
  const [filterAllLoading, setFilterAllLoading] = useState(false)

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
          const list = previewRes.data.candidates || []
          setPreviewCandidates(list)
          if (typeof previewRes.data.scoutCreditCost === 'number') {
            setScoutCreditCost(previewRes.data.scoutCreditCost)
          }
          if (typeof previewRes.data.credit === 'number') {
            setCredit(previewRes.data.credit)
          }

          const cvIds = list.map((c) => c.id).filter(Boolean)
          if (cvIds.length) {
            try {
              let firstJobId = null
              const jobsRes = await apiService.getBusinessJobs({ page: 1, limit: 1 })
              if (jobsRes?.success && jobsRes.data?.jobs?.length) {
                firstJobId = jobsRes.data.jobs[0].id
              }
              if (firstJobId) {
                const matches = await fetchJobScoutAiMatches(apiService, firstJobId, cvIds)
                if (!cancelled) {
                  setPreviewScoreByCvId(buildScoreMapFromMatches(matches))
                }
              }
            } catch (matchErr) {
              console.error(matchErr)
            }
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
    if (!cvIdParam) return
    const url = getScoutCandidateDetailUrl(cvIdParam, {
      jobId: selectedJobId,
      performanceRequestId,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('cvId')
      return next
    })
  }, [cvIdParam, selectedJobId, performanceRequestId, setSearchParams])

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
      const res = await apiService.getBusinessScoutPerformanceRequestById(requestId)
      if (res?.success && res.data?.request) {
        const req = res.data.request
        setPerformanceDetail(req)
        const viewRes = await apiService.markBusinessScoutPerformanceRequestViewed(requestId)
        if (viewRes?.data?.showBetterOptionsPrompt) {
          setShowPerformanceCta(true)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    loadPerformanceDetail(performanceRequestId)
  }, [performanceRequestId, loadPerformanceDetail])

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

  const hasActiveFilters = useMemo(
    () => hasActiveScoutFilters(scoutFilters),
    [scoutFilters],
  )

  useEffect(() => {
    if (selectedJobId || !hasActiveFilters) {
      setFilterAllCandidates([])
      return undefined
    }
    let cancelled = false
    setFilterAllLoading(true)
    fetchAllBusinessScoutCandidates(apiService)
      .then(({ candidates: all }) => {
        if (!cancelled) setFilterAllCandidates(all)
      })
      .catch(() => {
        if (!cancelled) setFilterAllCandidates([])
      })
      .finally(() => {
        if (!cancelled) setFilterAllLoading(false)
      })
    return () => { cancelled = true }
  }, [selectedJobId, hasActiveFilters])

  const displayedCandidates = useMemo(() => {
    let base
    if (selectedJobId) {
      base = allScoutCandidates.filter((c) => scoreByCvId[String(c.id)] != null)
    } else if (hasActiveFilters) {
      base = filterAllCandidates
    } else {
      base = candidates
    }

    const q = searchQuery.trim().toLowerCase()
    let filtered = base
    if (q) {
      filtered = filtered.filter((c) => {
        const hay = [
          c.desiredPosition,
          c.desiredWorkLocation,
          c.scoutPublicSummary,
          c.careerSummary,
          ...(Array.isArray(c.technicalSkills) ? c.technicalSkills : []),
        ].filter(Boolean).join(' ').toLowerCase()
        return hay.includes(q)
      })
    }

    filtered = filtered.filter((c) => passesScoutCandidateFilters(c, scoutFilters))

    if (selectedJobId) {
      return [...filtered].sort(
        (a, b) => (scoreByCvId[String(b.id)] || 0) - (scoreByCvId[String(a.id)] || 0),
      )
    }
    return filtered
  }, [selectedJobId, candidates, allScoutCandidates, scoreByCvId, searchQuery, scoutFilters, hasActiveFilters, filterAllCandidates])

  const pagedCandidates = useMemo(() => {
    if (!selectedJobId && !hasActiveFilters) return displayedCandidates
    const start = (page - 1) * limit
    return displayedCandidates.slice(start, start + limit)
  }, [selectedJobId, hasActiveFilters, displayedCandidates, page, limit])

  const jobFilterPagination = useMemo(() => {
    if (!selectedJobId && !hasActiveFilters) return pagination
    const total = displayedCandidates.length
    return {
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    }
  }, [selectedJobId, hasActiveFilters, displayedCandidates.length, pagination, limit])

  useEffect(() => {
    setPage(1)
  }, [scoutFilters.locations, scoutFilters.jobCategoryId, scoutFilters.experience, scoutFilters.japaneseLevel, scoutFilters.visa, scoutFilters.salaryMin, scoutFilters.salaryMax])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

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

  const openCandidateDetail = useCallback((cvId) => {
    const url = getScoutCandidateDetailUrl(cvId, {
      jobId: selectedJobId,
      performanceRequestId,
      search: searchQuery,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [selectedJobId, performanceRequestId, searchQuery])

  const handlePerformanceExplore = async (action) => {
    if (!performanceDetail?.id) return
    setExploreSubmitting(true)
    try {
      const res = await apiService.setBusinessScoutPerformanceExplore(performanceDetail.id, action)
      if (res?.success) {
        setShowPerformanceCta(false)
        setPerformanceDetail((prev) => prev ? { ...prev, businessExploreStatus: action } : prev)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setExploreSubmitting(false)
    }
  }

  const totalPages = jobFilterPagination.totalPages || 0
  const totalItems = (selectedJobId || hasActiveFilters)
    ? (jobFilterPagination.total || 0)
    : (pagination.total || 0)
  const listForRender = (selectedJobId || hasActiveFilters) ? pagedCandidates : candidates
  const listLoading = loading || matchLoading || (hasActiveFilters && filterAllLoading)

  const handleApplyFilters = () => {
    setSearchQuery(searchInput.trim())
    setPage(1)
  }

  const handleClearFilters = () => {
    setScoutFilters(getDefaultScoutFilters())
    setSearchInput('')
    setSearchQuery('')
    setPage(1)
  }

  const listPageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (page <= 3) return [1, 2, 3, 4, 5]
    if (page >= totalPages - 2) {
      return Array.from({ length: 5 }, (_, i) => totalPages - 4 + i)
    }
    return [page - 2, page - 1, page, page + 1, page + 2]
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
            <h3 className="text-sm font-bold text-slate-800 mb-2">Scout Ủy Thác</h3>
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

      <CreditTopUpModal
        open={creditTopUpOpen}
        onClose={() => setCreditTopUpOpen(false)}
        currentCredit={credit}
        onSuccess={() => {
          setCreditTopUpOpen(false)
          apiService.getBusinessCredit().then((res) => {
            if (res?.success && typeof res.data?.credit === 'number') {
              setCredit(res.data.credit)
              if (user) {
                localStorage.setItem('user', JSON.stringify({ ...user, credit: res.data.credit }))
              }
            }
          }).catch(() => {})
        }}
      />
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
                  previewScoreByCvId={previewScoreByCvId}
                  scoutCreditCost={scoutCreditCost}
                  onStart={enterScoutDashboard}
                  onExplore={enterScoutDashboard}
                />
              </div>
              <ScoutOnboardingSidebar onNavigate={navigate} />
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{scoutPageStyles}</style>
      <div className="business-homepage-shell scout-workspace-shell flex h-full min-h-0 flex-col overflow-hidden" style={{ fontFamily: PAGE_FONT }}>
        <div className="business-homepage-ui flex min-h-0 flex-1 flex-col overflow-hidden p-2 lg:p-3">
          <div className="scout-workspace-body min-h-0 flex-1">
            <div className="scout-workspace-content min-h-0">
              <ScoutFilterPanel
                selectedJobId={selectedJobId}
                jobs={jobs}
                jobsLoading={jobsLoading}
                onJobChange={handleJobChange}
                scoutFilters={scoutFilters}
                setScoutFilters={setScoutFilters}
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
                hasActiveFilters={hasActiveFilters}
                displayCount={totalItems}
                listLoading={listLoading}
              />

              <div className="scout-candidates-list-ui flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="scout-cand-caption text-slate-500">
                  Credit: <span className="font-semibold text-slate-600">{credit.toLocaleString('vi-VN')}</span>
                  {' · '}
                  Mở hồ sơ: <span className="font-semibold text-[#0077B6]">{scoutCreditCost} credit</span>
                  {credit < scoutCreditCost ? (
                    <button
                      type="button"
                      onClick={() => setCreditTopUpOpen(true)}
                      className="ml-1 font-semibold text-[#0077B6] hover:underline"
                    >
                      Nạp credit
                    </button>
                  ) : null}
                </p>
                <h2 className="scout-cand-title mt-1 text-slate-900">
                  {listLoading ? 'Đang tải...' : `${totalItems.toLocaleString('vi-VN')} ứng viên tìm thấy`}
                </h2>
                {selectedJobId && !matchLoading ? (
                  <p className="scout-cand-caption mt-0.5 text-slate-500">
                    AI gợi ý cho <strong>{selectedJob?.title || `JD #${selectedJobId}`}</strong>
                    {' · '}{aiMatchedTotal.toLocaleString('vi-VN')} phù hợp
                  </p>
                ) : null}
                {error ? <p className="scout-cand-caption mt-1 text-rose-600">{error}</p> : null}
              </div>

              {performanceDetail?.recommendations?.length > 0 && (
                <div className="border-b border-blue-100 bg-[#e8f4fa] px-3 py-2">
                  <p className="scout-cand-caption font-semibold text-[#006399]">
                    Gợi ý từ JobShare WS ({performanceDetail.recommendations.length})
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {performanceDetail.recommendations.map((rec) => {
                      const c = rec.candidate
                      if (!c) return null
                      const url = getScoutCandidateDetailUrl(c.id, {
                        performanceRequestId,
                        jobId: selectedJobId,
                        search: searchQuery,
                      })
                      return (
                        <button
                          key={rec.id}
                          type="button"
                          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                          className="scout-cand-caption rounded-md border border-[#cce5f0] bg-white px-2 py-1 text-left text-slate-700 hover:border-[#0077B6]"
                        >
                          {c.name || c.code || `CV #${c.id}`}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="candidate-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-2">
                {listLoading ? (
                  <div className="scout-cand-meta flex items-center justify-center gap-2 py-10 text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải danh sách...
                  </div>
                ) : listForRender.length === 0 ? (
                  <div className="scout-cand-meta px-3 py-8 text-center text-slate-500">
                    {selectedJobId ? 'Chưa có ứng viên Scout phù hợp với JD này' : hasActiveFilters ? 'Không có ứng viên phù hợp bộ lọc' : 'Chưa có hồ sơ nào trên sàn Scout'}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {listForRender.map((c) => (
                      <ScoutCandidateListItem
                        key={c.id}
                        candidate={c}
                        matchScore={selectedJobId ? scoreByCvId[String(c.id)] : null}
                        highlightQuery={highlightQuery}
                        onOpenDetail={openCandidateDetail}
                        hl={hl}
                      />
                    ))}
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 border-t border-slate-100 bg-slate-50/80 px-2 py-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="scout-cand-meta flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                    aria-label="Trang trước"
                  >
                    ‹
                  </button>
                  {listPageNumbers.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`scout-cand-meta flex h-7 min-w-[28px] items-center justify-center rounded-md px-1 font-semibold ${
                        page === p
                          ? 'bg-[#0077B6] text-white'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="scout-cand-meta flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                    aria-label="Trang sau"
                  >
                    ›
                  </button>
                </div>
              )}
              </div>
            </div>

            <div className="scout-workspace-aside min-h-0 overflow-y-auto scout-scrollbar">
              <HomepageSidebar onNavigate={navigate} />
            </div>
          </div>
        </div>
      </div>

      {sharedModals}
    </>
  )
}

export default Scout

export {
  ScoutUnlockOptionCard,
  ScoutUnlockCompareTable,
  ScoutCreditConfirmModal,
  ScoutPerformanceConfirmModal,
  ScoutPerformanceSuccessModal,
  ScoutAttachJobModal,
  ScoutActionModal,
  ScoutMatchBadge,
  getDisplayName as getScoutDisplayName,
}

export const SCOUT_DETAIL_ICON_SM = ICON_SM
export const SCOUT_DETAIL_ICON_MD = ICON_MD
