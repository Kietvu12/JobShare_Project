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
import { useLanguage } from '../../context/LanguageContext'
import useBusinessAppCopy from '../../hooks/useBusinessAppCopy'
import {
  getScoutSampleNews,
  getScoutSampleNotifications,
  getScoutSolutionCards,
  getScoutSolutionCard,
  getScoutFilterCopy,
  formatScoutExperienceSeniorityLocalized,
  getLocalizedScoutDisplayName,
  getScoutWorkspaceCopy,
  getScoutCompareTableRows,
  getScoutPerformanceFeeTiers,
  getScoutJobOptionLabel,
  formatScoutLocaleNumber,
  getDateLocale,
} from '../../i18n/businessAppI18n'
import { getLocalizedJobTitle } from '../../i18n/businessApp/jdBuilder'
import { HomepageSidebar } from './Homepage'
import BusinessQuickActionsPanel, { getDefaultBusinessQuickActions } from '../../component/Bussiness/BusinessQuickActionsPanel.jsx'
import {
  buildScoreMapFromMatches,
  fetchAllBusinessScoutCandidates,
  fetchJobScoutAiMatches,
} from '../../utils/businessJobAiMatching'
import { highlightSearchText } from '../../utils/searchTextHighlight'
import ScoutCandidateHoverTip from '../../component/Bussiness/ScoutCandidateHoverTip'
import { getScoutCandidateDetailUrl } from '../../utils/scoutCandidateDetailUrl'
import CreditTopUpModal from '../../component/Bussiness/CreditTopUpModal'
import ScoutCreditPackagesIntro from '../../component/Bussiness/ScoutCreditPackagesIntro'
import ScoutInsufficientCreditModal from '../../component/Bussiness/ScoutInsufficientCreditModal'
import creditIllustration from '../../assets/scout_credit_vi.png'
import performanceIllustration from '../../assets/scout_per_vi.png'
import { BUSINESS_UI_FONT, BUSINESS_UI_FONT_IMPORT } from '../../utils/businessUiFont'
import { getScoutSkillTags, formatScoutDesiredSalary, formatScoutListLocation, isScoutEmptyDisplayValue, getScoutListSkillExcerpt } from '../../utils/scoutCandidateDisplay'
import { getLocalizedCandidateRole } from '../../utils/jobCategoryDisplay'
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

const CARD_SURFACE = {
  brandLight: 'bg-[#e8f4fa] border border-[#cce5f0]/80 text-slate-900',
  neutral: 'bg-white border border-slate-200/90 text-slate-900',
}

const SCOUT_CARD_ICONS = {
  credit: Coins,
  performance: UserPlus,
}

function ScoutSolutionCard({ card, onStart, animationDelay = 0, scoutCopy }) {
  const surface = CARD_SURFACE[card.variant] || CARD_SURFACE.neutral
  const DecoIcon = SCOUT_CARD_ICONS[card.mode] || Coins
  const bodyClass = 'text-slate-600'
  const mutedClass = 'text-slate-500'

  return (
    <div className="biz-hp-solution-card-wrap h-full w-full" style={{ animationDelay: `${animationDelay}s` }}>
      <article
        className={`biz-hp-solution-card relative flex h-full min-h-[280px] w-full flex-col overflow-hidden rounded-[1.25rem] p-3.5 sm:p-4 lg:min-h-[240px] lg:flex-row lg:gap-6 lg:p-5 ${surface}`}
      >
        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-800 shadow-sm ring-1 ring-slate-100">
              {card.num}
            </span>
          </div>

          <div className="relative z-10 mt-2 pr-14 lg:pr-0">
            <h3 className="text-base font-bold leading-tight sm:text-lg">{card.title}</h3>
            <p className="mt-2 text-xs font-bold leading-snug text-slate-800 sm:text-[13px]">{card.painPoint}</p>
            <p className={`mt-1.5 text-[11px] leading-snug sm:text-xs ${mutedClass}`}>{card.solution}</p>
          </div>

          <div className="relative z-10 mt-3 lg:mt-auto lg:pt-4">
            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 sm:text-[11px]">
              {scoutCopy.suitableFor} {card.suitableFor}
            </span>
            {card.slaLine ? (
              <p className="mt-2 text-[10px] font-bold text-emerald-700 sm:text-[11px]">{card.slaLine}</p>
            ) : null}
            {card.footerNote ? (
              <p className="mt-2 text-[10px] font-semibold text-[#0077B6] sm:text-[11px]">{card.footerNote}</p>
            ) : null}
          </div>
        </div>

        <div className="pointer-events-none absolute right-0 top-[3.25rem] z-0 translate-x-[18%] lg:right-4 lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-0" aria-hidden>
          <DecoIcon className="h-[6.5rem] w-[6.5rem] text-[#0077B6]/22 sm:h-28 sm:w-28" strokeWidth={1.1} />
        </div>

        <div className="relative z-10 mt-3 flex min-w-0 flex-1 flex-col border-slate-200/80 lg:mt-0 lg:border-l lg:pl-6 lg:pt-1">
          <ul className={`flex min-h-0 flex-1 flex-col gap-2 text-[11px] leading-snug sm:text-xs ${bodyClass}`}>
            {card.features.map((line) => (
              <li key={line} className="flex gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0077B6]" strokeWidth={2.5} />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 shrink-0 border-t border-slate-200/80 pt-3 lg:mt-auto">
            <button
              type="button"
              onClick={() => onStart(card.mode)}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0077B6] py-2.5 text-xs font-semibold text-white shadow-sm shadow-[#0077B6]/15 transition-colors hover:bg-[#006399] sm:text-sm"
            >
              {scoutCopy.startWith(card.title)}
              <ArrowRight className="h-4 w-4 shrink-0" />
            </button>
          </div>
        </div>
      </article>
    </div>
  )
}

function ScoutOnboardingSidebar({ onNavigate }) {
  const { language } = useLanguage()
  const copy = useBusinessAppCopy()
  const scoutCopy = copy.scout
  const quickActions = useMemo(() => getDefaultBusinessQuickActions(language), [language])
  const scoutNotifications = useMemo(() => getScoutSampleNotifications(language), [language])
  const scoutNews = useMemo(() => getScoutSampleNews(language), [language])

  const handleAction = (item) => {
    if (item.path) onNavigate(item.path)
  }

  return (
    <div className="flex min-h-0 flex-col gap-3 xl:h-full xl:overflow-y-auto xl:pr-0.5 business-homepage-scroll scrollbar-hide">
      <BusinessQuickActionsPanel actions={quickActions} onActionClick={handleAction} />

      <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xs font-bold text-slate-900">
            {scoutCopy.notifications}
            <span className="rounded-full bg-[#0077B6] px-1.5 py-0.5 text-[9px] font-bold text-white">4</span>
          </h2>
          <button type="button" className="shrink-0 text-[10px] font-semibold text-[#0077B6]">{copy.homepage.viewAll}</button>
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
          <h2 className="text-xs font-bold text-slate-900">{scoutCopy.newsInsights}</h2>
          <button type="button" className="shrink-0 text-[10px] font-semibold text-[#0077B6]">{copy.homepage.viewAll}</button>
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
  const { language } = useLanguage()
  const copy = useBusinessAppCopy()
  const chipLabels = copy.scout.chips
  const newBadgeLabel = copy.scout.newBadge
  const position = getLocalizedCandidateRole(candidate, language)
  const exp = formatScoutExperienceSeniorityLocalized(candidate.experienceYears, language)
  const salary = formatScoutDesiredSalary(candidate)
  const location = formatScoutListLocation(candidate)
  const skillExcerpt = getScoutListSkillExcerpt(candidate)
  const chips = [
    { label: chipLabels.experience, value: exp },
    { label: chipLabels.location, value: location },
    { label: chipLabels.salary, value: salary },
  ].filter((chip) => !isScoutEmptyDisplayValue(chip.value))

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <p className="scout-cand-title truncate text-slate-900">
          {hl(getLocalizedScoutDisplayName(candidate, language))}
        </p>
        {showNew ? (
          <span className="scout-cand-caption rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-700">
            {newBadgeLabel}
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
          <ScoutMatchBadge score={matchScore} language={language} className="scout-cand-meta !text-[12px] !px-2.5 !py-1" iconClassName="scout-cand-icon" />
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

function ScoutPreviewCandidateRow({ candidate, matchScore, scoutCreditCost, onExplore, language = 'vi' }) {
  const ws = getScoutWorkspaceCopy(language)
  return (
    <div className="group flex gap-3 px-3 py-3 transition-colors hover:bg-slate-50/80 sm:gap-3.5 sm:px-4 sm:py-3.5">
      <AvatarCircle candidate={candidate} size={40} language={language} />
      <div className="min-w-0 flex-1">
        <ScoutCandidateRowBody candidate={candidate} matchScore={matchScore} />
      </div>
      <button
        type="button"
        onClick={onExplore}
        className="flex h-8 w-8 shrink-0 self-start items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-colors hover:border-[#0077B6]/35 hover:bg-[#e8f4fa] hover:text-[#0077B6] sm:h-9 sm:w-9"
        title={ws.onboarding.direct.unlockTitle(scoutCreditCost)}
      >
        <Lock className="h-4 w-4" />
      </button>
    </div>
  )
}

function ScoutManagedFeeTable() {
  const { language } = useLanguage()
  const ws = getScoutWorkspaceCopy(language)
  const onboarding = ws.onboarding.managed
  const feeTiers = getScoutPerformanceFeeTiers(language)

  return (
    <div className="mt-auto w-full shrink-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-3 py-2.5 sm:px-4">
        <h2 className="scout-cand-title text-slate-900">{onboarding.feeTableTitle}</h2>
        <p className="scout-cand-caption mt-0.5 text-slate-500">{onboarding.feeTableNote}</p>
      </div>
      <div className="overflow-x-auto px-3 py-2 sm:px-4">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500">
              <th className="py-2 pr-2 font-semibold">{onboarding.feeTableLevel}</th>
              <th className="py-2 pr-2 font-semibold">{onboarding.feeTableExperience}</th>
              <th className="py-2 pr-2 font-semibold">{onboarding.feeTableFee}</th>
              <th className="py-2 font-semibold">{onboarding.feeTableNoteCol}</th>
            </tr>
          </thead>
          <tbody>
            {feeTiers.map((tier) => (
              <tr key={tier.level} className="border-b border-slate-50 last:border-0">
                <td className="py-2 pr-2 font-semibold text-slate-800">{tier.level}</td>
                <td className="py-2 pr-2 text-slate-600">{tier.range}</td>
                <td className="py-2 pr-2 font-bold text-[#0077B6]">{tier.fee}</td>
                <td className="py-2 text-slate-500">{tier.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 px-3 py-2.5 sm:px-4">
        <p className="text-[11px] leading-snug text-slate-600 sm:text-xs">{onboarding.wsSupportHint}</p>
      </div>
    </div>
  )
}

function ScoutOnboardingCandidatePreview({
  onboarding,
  rankedPreviewCandidates,
  previewScoreByCvId,
  scoutCreditCost,
  onExplore,
  language,
  showExploreFooter = true,
}) {
  return (
    <div className="scout-candidates-list-ui w-full shrink-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div>
          <h2 className="scout-cand-title text-slate-900">{onboarding.previewTitle}</h2>
          <p className="scout-cand-caption mt-0.5 text-slate-500">{onboarding.previewSubtitle}</p>
        </div>
        <span className="scout-cand-caption inline-flex w-fit items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-500">
          <Lock className="h-3 w-3" />
          {onboarding.anonymousBadge}
        </span>
      </div>

      {rankedPreviewCandidates.length === 0 ? (
        <div className="px-3 py-8 text-center sm:px-4 sm:py-10">
          <Users className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-xs text-slate-500 sm:text-sm">
            {onboarding.previewEmpty}
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
              language={language}
            />
          ))}
        </div>
      )}

      {showExploreFooter ? (
        <div className="border-t border-slate-100 px-3 py-2 sm:px-4 sm:py-2.5">
          <button
            type="button"
            onClick={onExplore}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-[#0077B6]/35 hover:bg-[#f8fbfd] hover:text-[#0077B6] sm:rounded-xl sm:py-2.5 sm:text-sm"
          >
            {onboarding.exploreAll}
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      ) : null}
    </div>
  )
}

function ScoutOnboardingView({ variant = 'credit', previewCandidates, previewScoreByCvId, scoutCreditCost, onStart, onExplore, language: languageProp }) {
  const { language: ctxLanguage } = useLanguage()
  const language = languageProp || ctxLanguage
  const copy = useBusinessAppCopy()
  const scoutCopy = copy.scout
  const ws = getScoutWorkspaceCopy(language)
  const onboardingKey = variant === 'performance' ? 'managed' : 'direct'
  const onboarding = ws.onboarding[onboardingKey]
  const scoutCard = useMemo(
    () => getScoutSolutionCard(language, variant === 'performance' ? 'performance' : 'credit'),
    [language, variant],
  )
  const rankedPreviewCandidates = useMemo(
    () => rankPreviewCandidates(previewCandidates).slice(0, 5),
    [previewCandidates],
  )

  if (!scoutCard) return null

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 sm:gap-3">
      <header className="shrink-0">
        <h1 className="text-lg font-bold leading-tight text-slate-900 sm:text-xl">{onboarding.pageTitle}</h1>
        <p className="mt-1 text-xs leading-snug text-slate-600 sm:text-sm">
          {onboarding.pageSubtitle}
        </p>
      </header>

      <div className="grid w-full shrink-0 grid-cols-1 items-stretch gap-2 sm:gap-3">
        <ScoutSolutionCard
          card={scoutCard}
          onStart={onStart}
          animationDelay={0.06}
          scoutCopy={scoutCopy}
        />
      </div>

      {variant === 'credit' ? (
        <ScoutCreditPackagesIntro language={language} showIntro showSubmit />
      ) : (
        <>
          <ScoutOnboardingCandidatePreview
            onboarding={onboarding}
            rankedPreviewCandidates={rankedPreviewCandidates}
            previewScoreByCvId={previewScoreByCvId}
            scoutCreditCost={scoutCreditCost}
            onExplore={onExplore}
            language={language}
            showExploreFooter={false}
          />

          <div className="flex w-full min-h-0 flex-1 flex-col gap-2 sm:gap-3">
            <ScoutManagedFeeTable />
            <div className="shrink-0">
              <button
                type="button"
                onClick={onExplore}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0077B6] py-2.5 text-xs font-semibold text-white shadow-sm shadow-[#0077B6]/15 transition-colors hover:bg-[#006399] sm:text-sm"
              >
                {onboarding.exploreAll}
                <ArrowRight className="h-4 w-4 shrink-0" />
              </button>
            </div>
          </div>
        </>
      )}
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
  const { language } = useLanguage()
  const compare = getScoutWorkspaceCopy(language).compareTable
  const rows = getScoutCompareTableRows(language)
  return (
    <div className="scout-detail-ui mb-2 overflow-hidden rounded-lg border border-slate-200">
      <table className="scout-detail-body w-full text-left">
        <thead>
          <tr className="bg-slate-50 text-slate-500">
            <th className="px-2 py-1.5 font-semibold" style={{ width: '28%' }} />
            <th className="px-2 py-1.5 font-semibold text-[#0077B6]">{compare.directScout}</th>
            <th className="px-2 py-1.5 font-semibold text-[#0077B6]">{compare.managedScout}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
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
  language = 'vi',
}) {
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showJobCategoryModal, setShowJobCategoryModal] = useState(false)
  const ws = getScoutWorkspaceCopy(language)

  const jobOptions = useMemo(() => [
    { value: '', label: ws.workspace.allScoutCandidates },
    ...jobs.map((job) => ({
      value: String(job.id),
      label: getScoutJobOptionLabel(job, language),
    })),
  ], [jobs, language, ws.workspace.allScoutCandidates])

  const leadingBlock = (
    <FilterBlock icon={Briefcase} label={ws.workspace.attachJd} compact>
      <FilterSelectDropdown
        value={selectedJobId || ''}
        onChange={onJobChange}
        options={jobOptions}
        placeholder={ws.workspace.allScoutCandidates}
        searchable
        searchPlaceholder={ws.workspace.searchJdPlaceholder}
        disabled={jobsLoading}
        className={SCOUT_FILTER_INPUT_CLASS}
        maxPanelHeight={220}
      />
    </FilterBlock>
  )

  return (
    <section className="scout-workspace-filters shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5">
        <h2 className="text-xs font-bold text-gray-900">{ws.workspace.filterTitle}</h2>
        <div className="flex items-center gap-2">
          {hasActiveFilters ? (
            <button type="button" onClick={onClear} className="text-[9px] font-semibold text-[#0077B6] hover:underline">
              {ws.workspace.clearFilters}
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
              {ws.workspace.searchProfiles(displayCount, getDateLocale(language))}
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
          language={language}
        />
      </div>
      <WorkLocationFilterModal
        open={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        value={scoutFilters.locations}
        onConfirm={(locations) => setScoutFilters((prev) => ({ ...prev, locations }))}
        language={language}
        rightPanelTitle={getScoutFilterCopy(language).locationModalTitle}
      />
      <JobCategoryPickerModal
        open={showJobCategoryModal}
        onClose={() => setShowJobCategoryModal(false)}
        language={language}
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
  language = 'vi',
}) {
  const showNew = isCandidateNew(candidate)

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => onOpenDetail(candidate.id)}
        className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-sm sm:px-4 sm:py-3.5"
      >
        <AvatarCircle candidate={candidate} size={48} language={language} />
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
      <ScoutCandidateHoverTip candidate={candidate} hl={hl} matchScore={matchScore} language={language} />
    </div>
  )
}

function getSkillTags(candidate) {
  return getScoutSkillTags(candidate)
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
  const { language } = useLanguage()
  const ws = getScoutWorkspaceCopy(language)
  const m = ws.modals.credit
  const c = ws.common

  if (!open) return null

  const features = [
    {
      icon: IdCard,
      title: m.features[0].title,
      desc: m.features[0].desc,
    },
    {
      icon: Send,
      title: m.features[1].title,
      desc: m.features[1].desc,
    },
    {
      icon: Coins,
      title: m.features[2].title,
      desc: (
        <>
          {m.features[2].descPrefix}{' '}
          <span className="font-bold text-[#0077B6]">{creditCost} credits</span>
          {m.features[2].descSuffix}
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
          aria-label={c.close}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pt-6 pb-5 sm:px-8 sm:pt-7">
          <h2 className="pr-10 text-lg font-bold leading-snug text-slate-900 sm:text-xl">
            {m.title}{' '}
            <span className="text-[#0077B6]">{m.titleHighlight}</span>
          </h2>

          <p className="mt-3 text-sm font-medium leading-[1.65] text-slate-700 sm:text-[15px]">
            {m.intro}
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
                alt={m.imageAlt}
                className="w-full max-w-[380px] object-contain"
              />
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#e8f4fa] px-5 py-4 sm:px-6 sm:py-[18px]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0077B6] text-white">
              <Info className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <p className="min-w-0 text-sm font-medium leading-[1.55] text-slate-700 sm:text-[15px]">
              {m.disclaimer}
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
              {m.agree}
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
            {c.cancel}
          </button>
          <button
            type="button"
            disabled={loading || !agreed}
            onClick={onConfirm}
            className="rounded-lg bg-[#0077B6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#006399] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? m.opening : m.confirmUnlock(creditCost)}
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
  const { language } = useLanguage()
  const ws = getScoutWorkspaceCopy(language)
  const m = ws.modals.performance
  const c = ws.common
  const feeTiers = getScoutPerformanceFeeTiers(language)
  const [step, setStep] = useState('confirm')
  const [selectedJobId, setSelectedJobId] = useState(initialJobId || '')
  const skipJdStep = !!initialJobId

  const jobOptions = useMemo(() => jobs.map((job) => ({
    value: String(job.id),
    label: getScoutJobOptionLabel(job, language),
  })), [jobs, language])

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
          aria-label={c.close}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pt-6 pb-5 sm:px-8 sm:pt-7">
          <h2 className="pr-10 text-lg font-bold leading-snug text-slate-900 sm:text-xl">
            {step === 'jd' ? (
              m.jdStepTitle
            ) : (
              <>
                {m.confirmTitle}{' '}
                <span className="text-[#E30613]">{m.confirmTitleHighlight}</span>
              </>
            )}
          </h2>

          {step === 'confirm' && (
            <>
              {skipJdStep && selectedJob ? (
                <div className="mt-3 rounded-lg bg-[#e8f4fa] px-4 py-2.5 text-sm text-[#006399]">
                  {m.jdSelected(getLocalizedJobTitle(selectedJob, language))}
                </div>
              ) : null}

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-[1fr_minmax(280px,44%)] sm:gap-6 sm:items-start">
                <div className="space-y-3 text-sm font-medium leading-[1.65] text-slate-700 sm:text-[15px]">
                  <p>{m.intro1}</p>
                  <p>
                    {m.intro2Prefix}{' '}
                    <span className="font-bold text-slate-900">{m.intro2Highlight}</span>
                    {m.intro2Suffix}
                  </p>
                </div>
                <div className="flex items-center justify-center sm:justify-end">
                  <img
                    src={performanceIllustration}
                    alt={m.imageAlt}
                    className="w-full max-w-[380px] object-contain"
                  />
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600">
                  {m.feeTableTitle}
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500">
                      <th className="px-4 py-2 font-semibold">{m.feeColLevel}</th>
                      <th className="px-4 py-2 font-semibold">{m.feeColExperience}</th>
                      <th className="px-4 py-2 font-semibold">{m.feeColFee}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeTiers.map((tier, idx) => (
                      <tr key={tier.level} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="px-4 py-2 font-semibold text-slate-800">{tier.level}</td>
                        <td className="px-4 py-2 text-slate-600">{tier.range}</td>
                        <td className="px-4 py-2 font-bold text-[#E30613]">{tier.fee}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">
                  {m.feeFootnote}
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
                  {m.agree}
                </span>
              </label>
            </>
          )}

          {step === 'jd' && (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                {m.jdStepIntro}
              </p>
              <label className="block">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700">{m.relatedJd}</span>
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
                      {m.createJd}
                    </button>
                  ) : null}
                </div>
                <FilterSelectDropdown
                  value={selectedJobId}
                  onChange={setSelectedJobId}
                  options={jobOptions}
                  placeholder={ws.workspace.selectJdPlaceholder}
                  searchable
                  searchPlaceholder={ws.workspace.searchJdPlaceholder}
                  optionSize="comfortable"
                  maxPanelHeight={280}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#0077B6]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">{m.extraRequirements}</span>
                <textarea
                  value={requirementNote}
                  onChange={(e) => onRequirementNoteChange?.(e.target.value)}
                  rows={3}
                  placeholder={m.extraRequirementsPlaceholder}
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
                  {m.headhuntSimilar}
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
                {c.back}
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
              {c.cancel}
            </button>
            {step === 'confirm' ? (
              <button
                type="button"
                disabled={loading || !agreed}
                onClick={handleConfirmStepContinue}
                className="rounded-lg bg-[#0077B6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#006399] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? m.sending
                  : skipJdStep
                    ? m.confirmSend
                    : c.continue}
              </button>
            ) : (
              <button
                type="button"
                disabled={loading || !canProceedJd}
                onClick={handleConfirm}
                className="rounded-lg bg-[#E30613] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c90511] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? m.sending : m.confirmSend}
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
  const { language } = useLanguage()
  const m = getScoutWorkspaceCopy(language).modals.performanceSuccess
  const c = getScoutWorkspaceCopy(language).common
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
        <h2 className="mt-4 text-lg font-bold text-slate-900">{m.title}</h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {m.body}
          {wantsSimilarCandidates ? m.bodySimilar : ''}
        </p>
        {requestCode && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{m.requestCode}</div>
            <div className="mt-1 text-xl font-bold text-[#0077B6]">{requestCode}</div>
          </div>
        )}
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onGoApplications}
            className="w-full rounded-lg bg-[#0077B6] py-2.5 text-sm font-semibold text-white hover:bg-[#006399]"
          >
            {m.trackApplications}
          </button>
          {sessionId && (
            <button
              type="button"
              onClick={onGoChat}
              className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {m.openWsChat}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            {c.close}
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
  const { language } = useLanguage()
  const ws = getScoutWorkspaceCopy(language)
  const m = ws.modals.attachJob
  const c = ws.common
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
      const base = getScoutJobOptionLabel(job, language)
      const label = score != null && score > 0 ? `${base}${m.matchSuffix(score)}` : base
      return { value: String(job.id), label }
    })
  }, [jobs, jobScoreById, language, m])

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
        <h3 className="text-sm font-bold text-slate-900">{m.title}</h3>
        <p className="mt-1 text-xs text-slate-500">
          {candidateName ? `${m.candidatePrefix} ${candidateName}` : m.selectJdHint}
        </p>
        <label className="mt-4 block">
          <span className="text-xs font-semibold text-slate-600">{c.jdLabel} *</span>
          <FilterSelectDropdown
            value={jobId}
            onChange={setJobId}
            options={jobOptions}
            placeholder={ws.workspace.selectJdPlaceholder}
            searchable
            searchPlaceholder={ws.workspace.searchJdPlaceholder}
            optionSize="comfortable"
            maxPanelHeight={280}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#0077B6]"
          />
        </label>
        <label className="mt-3 block">
          <span className="text-[10px] font-semibold text-slate-600">{m.note}</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={c.optional}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-[#0077B6]"
          />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600">{c.cancel}</button>
          <button
            type="button"
            disabled={!jobId || loading}
            onClick={() => onSubmit({ jobId, note })}
            className="rounded-lg bg-[#0077B6] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {loading ? m.adding : m.addToPipeline}
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
  confirmLabel,
  cancelLabel,
  noticeVariant = 'info',
  onConfirm,
  onClose,
  loading = false,
  children,
}) {
  const { language } = useLanguage()
  const c = getScoutWorkspaceCopy(language).common
  if (!open) return null

  const isConfirm = kind === 'similar-candidates-prompt'
  const resolvedConfirmLabel = confirmLabel || c.confirm
  const resolvedCancelLabel = cancelLabel || c.cancel
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
                {resolvedCancelLabel}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={onConfirm}
                className="text-xs px-3 py-2 rounded-lg text-white bg-[#0077B6] disabled:opacity-50"
              >
                {loading ? c.processing : resolvedConfirmLabel}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className={`text-xs px-3 py-2 rounded-lg text-white ${noticeButtonClass}`}
            >
              {c.understand}
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

function AvatarCircle({ candidate, size = 28, language = 'vi' }) {
  const name = getLocalizedScoutDisplayName(candidate, language)
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

const Scout = ({ variant = 'credit' } = {}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { language } = useLanguage()
  const ws = useMemo(() => getScoutWorkspaceCopy(language), [language])
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
  const [insufficientCreditModalOpen, setInsufficientCreditModalOpen] = useState(false)
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

  const refreshCreditBalance = useCallback(() => {
    apiService.getBusinessCredit().then((res) => {
      if (res?.success && typeof res.data?.credit === 'number') {
        setCredit(res.data.credit)
        if (user) {
          localStorage.setItem('user', JSON.stringify({ ...user, credit: res.data.credit }))
        }
      }
    }).catch(() => {})
  }, [user])

  const handleOnboardingStart = useCallback(() => {
    if (variant === 'credit' && credit < scoutCreditCost) {
      setInsufficientCreditModalOpen(true)
      return
    }
    enterScoutDashboard()
  }, [variant, credit, scoutCreditCost, enterScoutDashboard])

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
        setError(res?.message || ws.workspace.loadError)
      }
    } catch (e) {
      console.error(e)
      setCandidates([])
      setError(ws.workspace.loadError)
    } finally {
      setLoading(false)
    }
  }, [page, limit, searchQuery, selectedJobId, showOnboarding, ws.workspace.loadError])

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
            <h3 className="text-sm font-bold text-slate-800 mb-2">{ws.modals.performanceCta.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {ws.modals.performanceCta.message}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                disabled={exploreSubmitting}
                onClick={() => handlePerformanceExplore('declined')}
                className="text-xs px-3 py-2 border border-slate-200 rounded-lg text-slate-600"
              >
                {ws.modals.performanceCta.decline}
              </button>
              <button
                type="button"
                disabled={exploreSubmitting}
                onClick={() => handlePerformanceExplore('interested')}
                className="text-xs px-3 py-2 rounded-lg text-white bg-[#0077B6] disabled:opacity-50"
              >
                {ws.modals.performanceCta.interested}
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
          refreshCreditBalance()
        }}
      />

      <ScoutInsufficientCreditModal
        open={insufficientCreditModalOpen}
        onClose={() => setInsufficientCreditModalOpen(false)}
        language={language}
        onTopUpSuccess={() => {
          refreshCreditBalance()
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
                  variant={variant}
                  previewCandidates={previewCandidates}
                  previewScoreByCvId={previewScoreByCvId}
                  scoutCreditCost={scoutCreditCost}
                  onStart={handleOnboardingStart}
                  onExplore={enterScoutDashboard}
                  language={language}
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
                language={language}
              />

              <div className="scout-candidates-list-ui flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="scout-cand-caption text-slate-500">
                  {ws.workspace.creditLabel}: <span className="font-semibold text-slate-600">{formatScoutLocaleNumber(credit, language)}</span>
                  {' · '}
                  {ws.workspace.unlockLabel}: <span className="font-semibold text-[#0077B6]">{scoutCreditCost} {ws.workspace.creditUnit}</span>
                  {credit < scoutCreditCost ? (
                    <button
                      type="button"
                      onClick={() => setCreditTopUpOpen(true)}
                      className="ml-1 font-semibold text-[#0077B6] hover:underline"
                    >
                      {ws.workspace.topUpCredit}
                    </button>
                  ) : null}
                </p>
                <h2 className="scout-cand-title mt-1 text-slate-900">
                  {listLoading ? ws.workspace.loading : ws.workspace.candidatesFound(totalItems, getDateLocale(language))}
                </h2>
                {selectedJobId && !matchLoading ? (
                  <p className="scout-cand-caption mt-0.5 text-slate-500">
                    {ws.workspace.aiSuggestFor(getLocalizedJobTitle(selectedJob, language) || `JD #${selectedJobId}`)}
                    {' · '}{ws.workspace.aiMatched(aiMatchedTotal, getDateLocale(language))}
                  </p>
                ) : null}
                {error ? <p className="scout-cand-caption mt-1 text-rose-600">{error}</p> : null}
              </div>

              {performanceDetail?.recommendations?.length > 0 && (
                <div className="border-b border-blue-100 bg-[#e8f4fa] px-3 py-2">
                  <p className="scout-cand-caption font-semibold text-[#006399]">
                    {ws.workspace.wsRecommendations(performanceDetail.recommendations.length)}
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
                    {ws.workspace.loadingList}
                  </div>
                ) : listForRender.length === 0 ? (
                  <div className="scout-cand-meta px-3 py-8 text-center text-slate-500">
                    {selectedJobId ? ws.workspace.emptyJobMatch : hasActiveFilters ? ws.workspace.emptyFilters : ws.workspace.emptyScout}
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
                        language={language}
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
                    aria-label={ws.workspace.prevPage}
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
                    aria-label={ws.workspace.nextPage}
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
  getLocalizedScoutDisplayName as getScoutDisplayName,
}

export const SCOUT_DETAIL_ICON_SM = ICON_SM
export const SCOUT_DETAIL_ICON_MD = ICON_MD
