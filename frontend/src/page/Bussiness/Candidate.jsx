import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, RotateCw, Search, SlidersHorizontal, Unlock, X } from 'lucide-react'
import nothingIllustration from '../../assets/Nothing.png'
import apiService from '../../services/api'
import FilterBlock from '../../component/Shared/FilterBlock'
import FilterSelectDropdown from '../../component/Shared/FilterSelectDropdown'
import ScoutCandidateFilterFields, {
  SCOUT_FILTER_INPUT_CLASS,
  SCOUT_FILTER_LABEL_CLASS,
  SCOUT_FILTER_PICKER_BTN_CLASS,
  ScoutKeywordSearchField,
} from '../../component/Bussiness/ScoutCandidateFilterFields.jsx'
import WorkLocationFilterModal from '../../component/Shared/WorkLocationFilterModal'
import JobCategoryPickerModal from '../../component/Shared/JobCategoryPickerModal'
import BusinessQuickActionsPageLayout from '../../component/Bussiness/BusinessQuickActionsPageLayout.jsx'
import { CandidateListMatchCorner } from '../../component/Bussiness/ScoutMatchBadge'
import { highlightSearchText } from '../../utils/searchTextHighlight'
import { getBusinessUnlockedCandidateDetailUrl } from '../../utils/businessUnlockedCandidateDetailUrl'
import { fetchAllBusinessUnlockedCandidates } from '../../utils/businessUnlockedCandidates'
import {
  EXPERIENCE_YEARS_OPTIONS,
  JAPANESE_LEVEL_FILTER_OPTIONS,
  getDefaultScoutFilters,
  getLocalizedOptionLabel,
  hasActiveScoutFilters,
  passesScoutCandidateFilters,
} from '../../utils/scoutFilterOptions'
import { getWorkLocationsDisplayText } from '../../utils/workLocationFilter'
import { getScoutFilterCopy, getScoutVisaFilterOptions } from '../../i18n/businessAppI18n'
import { ScoutCandidateHoverHost } from '../../component/Bussiness/ScoutCandidateHoverTip'
import {
  formatScoutDesiredSalary,
  getScoutListSkillChips,
  isScoutEmptyDisplayValue,
  resolveCandidateMatchScore,
} from '../../utils/scoutCandidateDisplay'
import { getLocalizedCandidateRole } from '../../utils/jobCategoryDisplay'
import useBusinessAppCopy from '../../hooks/useBusinessAppCopy'
import { useLanguage } from '../../context/LanguageContext'
import {
  formatCandidateListDate,
  formatCandidateNumber,
  formatScoutExperienceSeniorityLocalized,
  formatScoutLanguageSummaryLocalized,
  getCandidateListFilterEmptyText,
  getCandidateUnlockSourceOptions,
  getLocalizedScoutDisplayName,
  getLocalizedScoutPipelineMeta,
  getLocalizedScoutUnlockSourceMeta,
} from '../../i18n/businessAppI18n'
import {
  BUSINESS_HOMEPAGE_PAGE_BASE_STYLES,
  BUSINESS_HP_TEXT,
  BUSINESS_UI_FONT,
} from '../../utils/businessHomepageTypography.js'

const ANONYMOUS_AVATAR = 'https://api.dicebear.com/7.x/shapes/svg?seed=scout-unlocked'
const PAGE_SIZE = 10
const BRAND = '#0077B6'

const LIST_FILTER_ALL = 'all'

function parseListFilter(listParam) {
  if (listParam === 'scout_credit' || listParam === 'scout_performance' || listParam === 'ctv_marketplace') {
    return listParam
  }
  return LIST_FILTER_ALL
}

const candidatePageStyles = `
  ${BUSINESS_HOMEPAGE_PAGE_BASE_STYLES}
  .candidates-workspace-shell {
    flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; background: #f4f6f8;
    font-family: ${BUSINESS_UI_FONT};
  }
  .candidates-workspace-shell .business-homepage-ui {
    height: 100%;
    min-height: 0;
  }
  @supports not (zoom: 1) {
    .candidates-workspace-shell .business-homepage-ui {
      height: calc(100% / var(--hp-zoom));
    }
  }
  .candidates-workspace-body {
    flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr; gap: 10px; overflow: hidden;
  }
  .candidates-workspace-content {
    min-height: 0; min-width: 0; display: flex; flex-direction: column; flex: 1; gap: 8px; overflow: hidden;
  }
  .candidates-filter-sticky {
    position: sticky;
    top: 0;
    z-index: 20;
  }
  .scout-candidates-list-ui {
    line-height: 1.45;
    color: #334155;
    font-size: var(--biz-hp-body);
  }
  .scout-candidates-list-ui .scout-cand-title {
    font-size: var(--biz-hp-section);
    line-height: 1.35;
    font-weight: 700;
    color: #0f172a;
  }
  .scout-candidates-list-ui .scout-cand-subtitle {
    font-size: var(--biz-hp-body);
    line-height: 1.35;
    font-weight: 600;
  }
  .scout-candidates-list-ui .scout-cand-meta { font-size: var(--biz-hp-body); line-height: 1.35; }
  .scout-candidates-list-ui .scout-cand-caption { font-size: var(--biz-hp-caption); line-height: 1.4; color: #64748b; }
  .scout-candidates-list-ui .scout-cand-icon {
    width: var(--biz-hp-jd-icon);
    height: var(--biz-hp-jd-icon);
    flex-shrink: 0;
  }
  @media (min-width: 1024px) and (max-width: 1535px) {
    .candidates-workspace-body { gap: 8px; }
    .candidates-workspace-content { gap: 6px; }
    .candidates-filter-head {
      padding: 0.875rem 1rem !important;
    }
    .candidates-filter-scroll {
      padding: 0.875rem 1rem !important;
    }
    .candidates-list-head {
      padding: 0.375rem 0.625rem !important;
    }
    .candidates-list-item {
      padding: 0.375rem 0.5rem !important;
    }
    .candidates-list-avatar {
      width: 34px !important;
      height: 34px !important;
    }
  }
  .scout-search-highlight {
    background-color: #fef08a !important; color: #92400e !important;
    padding: 0 2px; border-radius: 2px; font-weight: 600;
  }
  .candidate-scrollbar .group:last-child .scout-candidate-hover-tip-anchor {
    top: auto;
    bottom: 100%;
    padding-top: 0;
    padding-bottom: 0.25rem;
  }
`

function AvatarCircle({ candidate, size = 44, language = 'vi', className = '' }) {
  const name = getLocalizedScoutDisplayName(candidate, language)
  const src = candidate?.avatarPhotoPath
    ? candidate.avatarPhotoPath
    : `${ANONYMOUS_AVATAR}&seed=${encodeURIComponent(String(name || candidate?.id || 'x'))}`
  return (
    <img
      src={src}
      alt=""
      className={className}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: '#e2e8f0' }}
      onError={(e) => { e.currentTarget.src = `${ANONYMOUS_AVATAR}&seed=fallback` }}
    />
  )
}

function ScoutMetaChip({ children }) {
  if (isScoutEmptyDisplayValue(children)) return null
  return (
    <span className="scout-cand-caption inline-flex max-w-full truncate rounded-md border border-slate-200/80 bg-slate-50 px-1.5 py-px font-medium text-slate-600">
      {children}
    </span>
  )
}

function UnlockedCandidateRowBody({ candidate, hl = (t) => t, language, listCopy }) {
  const position = getLocalizedCandidateRole(candidate, language)
  const pipeline = getLocalizedScoutPipelineMeta(candidate.pipelineStatus, language)
  const unlockSource = getLocalizedScoutUnlockSourceMeta(candidate.unlockType, language)
  const exp = formatScoutExperienceSeniorityLocalized(candidate.experienceYears, language)
  const salary = formatScoutDesiredSalary(candidate)
  const jlpt = formatScoutLanguageSummaryLocalized(candidate, language)
  const { visible: skillTags, extra: skillExtra, title: skillTitle } = getScoutListSkillChips(candidate, 5)
  const positionLine = [position, !isScoutEmptyDisplayValue(exp) ? exp : ''].filter(Boolean).join(' · ')

  return (
    <>
      <p className="scout-cand-title truncate pr-24 text-slate-900">{hl(getLocalizedScoutDisplayName(candidate, language))}</p>
      {positionLine ? (
        <p className="scout-cand-subtitle mt-0.5 truncate text-slate-600">{hl(positionLine)}</p>
      ) : null}
      {candidate.nominationJobTitle ? (
        <p className="scout-cand-caption mt-0.5 truncate text-slate-500">
          {listCopy?.nominatedToJob || 'Tiến cử vào JD'}: {hl(candidate.nominationJobTitle)}
        </p>
      ) : null}
      <div className="mt-1 flex flex-wrap gap-1">
        <ScoutMetaChip>{jlpt}</ScoutMetaChip>
        <ScoutMetaChip>{salary}</ScoutMetaChip>
      </div>
      {skillTags.length > 0 ? (
        <div className="mt-1 flex flex-wrap items-center gap-1" title={skillTitle}>
          {skillTags.map((sk) => (
            <span key={sk} className="scout-cand-caption max-w-[8rem] truncate rounded border border-slate-200/80 bg-white px-1.5 py-px text-slate-600">
              {hl(sk)}
            </span>
          ))}
          {skillExtra > 0 ? (
            <span className="scout-cand-caption font-semibold text-slate-500">+{skillExtra}</span>
          ) : null}
        </div>
      ) : null}
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <span
          className="scout-cand-caption rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset ring-black/5"
          style={{ color: unlockSource.color, background: unlockSource.bg || `${unlockSource.color}14` }}
        >
          {unlockSource.label}
        </span>
        <span
          className="scout-cand-caption rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset ring-black/5"
          style={{ color: pipeline.color, background: pipeline.bg }}
        >
          {pipeline.label}
        </span>
        {candidate.unlockedAt ? (
          <span className="scout-cand-caption text-slate-400">{formatCandidateListDate(candidate.unlockedAt, language)}</span>
        ) : null}
      </div>
    </>
  )
}

function UnlockedCandidateListItem({ candidate, onOpenDetail, hl, language, listCopy }) {
  const tipCandidate = { ...candidate, isUnlocked: true }
  const matchScore = resolveCandidateMatchScore(candidate)
  return (
    <ScoutCandidateHoverHost
      className="group relative"
      candidate={tipCandidate}
      hl={hl}
      matchScore={matchScore}
      language={language}
    >
      <button
        type="button"
        onClick={() => onOpenDetail(candidate.id)}
        className="candidates-list-item relative flex w-full items-start gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-left transition hover:border-slate-300 hover:bg-slate-50/80 lg:gap-2 lg:px-2.5 lg:py-2"
      >
        <AvatarCircle candidate={candidate} size={40} language={language} className="candidates-list-avatar" />
        <div className="min-w-0 flex-1">
          <UnlockedCandidateRowBody candidate={candidate} hl={hl} language={language} listCopy={listCopy} />
        </div>
        <div className="pointer-events-none absolute right-2 top-2 z-[1] max-w-[42%]">
          <CandidateListMatchCorner score={matchScore} language={language} />
        </div>
      </button>
    </ScoutCandidateHoverHost>
  )
}

function CandidateFilterChips({ chips }) {
  if (!chips?.length) return null
  return (
    <div className="flex flex-wrap gap-1 border-t border-slate-100 bg-slate-50/60 px-2 py-1.5">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={chip.onRemove}
          className={`inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-white py-0.5 pl-2 pr-1 font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 ${BUSINESS_HP_TEXT.caption}`}
          title="Bỏ điều kiện"
        >
          <span className="truncate">{chip.label}</span>
          <X className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
        </button>
      ))}
    </div>
  )
}

function CandidatesEmptyState({ copy }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
      <img src={nothingIllustration} alt="" className="mb-4 w-full max-w-[220px] object-contain" draggable={false} />
      <p className={`max-w-md font-medium leading-relaxed text-slate-700 ${BUSINESS_HP_TEXT.body}`}>
        {copy.candidates.list.emptyBody}
      </p>
      <button
        type="button"
        onClick={() => navigate('/business/scout/direct')}
        className={`mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-white shadow-sm transition hover:opacity-95 ${BUSINESS_HP_TEXT.button}`}
        style={{ background: BRAND }}
      >
        {copy.candidates.list.emptyCta}
      </button>
    </div>
  )
}

function UnlockedCandidateFilterPanel({
  listFilter,
  onListFilterChange,
  scoutFilters,
  setScoutFilters,
  searchInput,
  setSearchInput,
  onApply,
  onClear,
  hasActiveFilters,
  displayCount,
  listLoading,
  copy,
  language,
  unlockSourceOptions,
  filterChips,
}) {
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showJobCategoryModal, setShowJobCategoryModal] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(() => hasActiveFilters)

  useEffect(() => {
    if (hasActiveFilters) setAdvancedOpen(true)
  }, [hasActiveFilters])

  const filterFieldProps = {
    inputClassName: SCOUT_FILTER_INPUT_CLASS,
    pickerBtnClassName: SCOUT_FILTER_PICKER_BTN_CLASS,
    filterLabelClassName: SCOUT_FILTER_LABEL_CLASS,
    fieldMinHeightClass: 'min-h-9',
    dropdownOptionSize: 'comfortable',
  }

  const leadingBlock = (
    <FilterBlock
      icon={Unlock}
      label={copy.candidates.list.unlockSourceLabel}
      compact
      labelClassName={SCOUT_FILTER_LABEL_CLASS}
      fieldMinHeightClass="min-h-9"
    >
      <FilterSelectDropdown
        value={listFilter}
        onChange={onListFilterChange}
        options={unlockSourceOptions}
        placeholder={copy.candidates.list.unlockSourceAll}
        className={SCOUT_FILTER_INPUT_CLASS}
        optionSize="comfortable"
      />
    </FilterBlock>
  )

  const listCopy = copy.candidates.list
  const advancedToggleClass = advancedOpen
    ? 'border-[#0077B6]/40 bg-[#f0f9ff] text-[#0077B6]'
    : 'border-gray-200 bg-white text-gray-700 hover:border-[#0077B6]/30 hover:bg-[#f8fbfd]'

  return (
    <section className="candidates-filter-sticky scout-candidates-list-ui scout-workspace-filters shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="candidates-filter-head flex flex-wrap items-end gap-3 px-4 py-3.5 lg:gap-4 lg:px-5 lg:py-4">
        <div className="min-w-0 flex-1 basis-[min(100%,16rem)]">
          <ScoutKeywordSearchField
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            language={language}
            inputClassName={SCOUT_FILTER_INPUT_CLASS}
            filterLabelClassName={SCOUT_FILTER_LABEL_CLASS}
            fieldMinHeightClass="min-h-9"
            onEnter={onApply}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 pb-1">
          <button
            type="button"
            onClick={() => setAdvancedOpen((open) => !open)}
            aria-expanded={advancedOpen}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 font-semibold transition-colors ${BUSINESS_HP_TEXT.caption} ${advancedToggleClass}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
            {advancedOpen ? listCopy.collapseAdvancedFilters : listCopy.advancedFilters}
          </button>
          {!listLoading ? (
            <span className={`hidden font-semibold text-slate-500 sm:inline ${BUSINESS_HP_TEXT.caption}`}>
              {listCopy.resultCount(formatCandidateNumber(displayCount || 0, language))}
            </span>
          ) : null}
          {hasActiveFilters ? (
            <button type="button" onClick={onClear} className={`font-semibold text-[#0077B6] hover:underline ${BUSINESS_HP_TEXT.caption}`}>
              {listCopy.clearConditions}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onApply}
            disabled={listLoading}
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#facc15] px-3 shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${BUSINESS_HP_TEXT.button}`}
          >
            {listLoading ? (
              <RotateCw className="h-3.5 w-3.5 animate-spin text-gray-800" />
            ) : (
              <Search className="h-3.5 w-3.5 text-gray-800" />
            )}
            <span className="font-semibold text-gray-800">{listCopy.searchButton}</span>
          </button>
        </div>
      </div>
      <CandidateFilterChips chips={filterChips} />
      {advancedOpen ? (
        <div className="candidates-filter-scroll border-t border-gray-100 p-3.5 lg:p-4">
          <ScoutCandidateFilterFields
            leadingBlock={leadingBlock}
            scoutFilters={scoutFilters}
            setScoutFilters={setScoutFilters}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            onOpenLocationModal={() => setShowLocationModal(true)}
            onOpenJobCategoryModal={() => setShowJobCategoryModal(true)}
            language={language}
            includeKeywordField={false}
            {...filterFieldProps}
          />
        </div>
      ) : null}
      <WorkLocationFilterModal
        open={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        value={scoutFilters.locations}
        onConfirm={(locations) => setScoutFilters((prev) => ({ ...prev, locations }))}
        language={language}
        rightPanelTitle={copy.candidates.list.locationModalTitle}
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

function CandidateListPanel({
  candidates,
  loading,
  total,
  page,
  totalPages,
  onPageChange,
  listFilter,
  onOpenDetail,
  hl,
  copy,
  language,
}) {
  const emptySearchText = getCandidateListFilterEmptyText(listFilter, language)
  const listPageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (page <= 3) return [1, 2, 3, 4, 5]
    if (page >= totalPages - 2) {
      return Array.from({ length: 5 }, (_, i) => totalPages - 4 + i)
    }
    return [page - 2, page - 1, page, page + 1, page + 2]
  }, [page, totalPages])

  return (
    <div className="scout-candidates-list-ui flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="candidates-list-head border-b border-slate-100 px-2.5 py-1.5 lg:px-3 lg:py-2">
        <h2 className="scout-cand-title text-slate-900">
          {loading ? copy.candidates.list.loading : copy.candidates.list.openedCount(formatCandidateNumber(total, language))}
        </h2>
        <p className="scout-cand-caption mt-0.5 text-slate-500">{copy.candidates.list.clickHint}</p>
      </div>

      <div className="candidate-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {loading ? (
          <div className="scout-cand-meta flex items-center justify-center gap-2 py-10 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {copy.candidates.list.loadingList}
          </div>
        ) : candidates.length === 0 ? (
          <div className="scout-cand-meta px-3 py-8 text-center text-slate-500">{emptySearchText}</div>
        ) : (
          <div className="flex flex-col gap-2">
            {candidates.map((c) => (
              <UnlockedCandidateListItem
                key={c.id}
                candidate={c}
                onOpenDetail={onOpenDetail}
                hl={hl}
                language={language}
                listCopy={copy.candidates.list}
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
            onClick={() => onPageChange(page - 1)}
            className="scout-cand-meta flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
            aria-label={copy.common.pagination.prevPage}
          >
            ‹
          </button>
          {listPageNumbers.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
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
            onClick={() => onPageChange(page + 1)}
            className="scout-cand-meta flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
            aria-label={copy.common.pagination.nextPage}
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}

const Candidate = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const copy = useBusinessAppCopy()
  const [searchParams, setSearchParams] = useSearchParams()
  const listFilter = parseListFilter(searchParams.get('list'))

  const unlockSourceOptions = useMemo(
    () => getCandidateUnlockSourceOptions(language),
    [language],
  )

  const handleListFilterChange = useCallback((nextFilter) => {
    if (nextFilter === LIST_FILTER_ALL) {
      setSearchParams({}, { replace: true })
    } else {
      setSearchParams({ list: nextFilter }, { replace: true })
    }
  }, [setSearchParams])

  const [candidates, setCandidates] = useState([])
  const [filterAllCandidates, setFilterAllCandidates] = useState([])
  const [filterAllLoading, setFilterAllLoading] = useState(false)
  const [scoutFilters, setScoutFilters] = useState(getDefaultScoutFilters)
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 })
  const [error, setError] = useState('')

  const hasActiveFilters = useMemo(
    () => hasActiveScoutFilters(scoutFilters),
    [scoutFilters],
  )

  const loadList = useCallback(async () => {
    if (hasActiveFilters) return
    try {
      setLoading(true)
      setError('')
      const res = await apiService.getBusinessScoutUnlockedCandidates({
        page,
        limit: PAGE_SIZE,
        search: searchQuery || undefined,
        unlockType: listFilter === LIST_FILTER_ALL ? undefined : listFilter,
        sortBy: 'unlockedAt',
        sortOrder: 'DESC',
      })
      if (res?.success && res.data) {
        setCandidates(res.data.candidates || [])
        setPagination(res.data.pagination || { total: 0, totalPages: 0 })
      } else {
        setCandidates([])
        setError(res?.message || copy.candidates.list.loadError)
      }
    } catch (e) {
      console.error(e)
      setCandidates([])
      setError(copy.candidates.list.loadError)
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery, listFilter, hasActiveFilters, copy.candidates.list.loadError])

  useEffect(() => { setPage(1) }, [listFilter])

  useEffect(() => { loadList() }, [loadList])

  useEffect(() => {
    if (!hasActiveFilters) {
      setFilterAllCandidates([])
      return undefined
    }
    let cancelled = false
    setFilterAllLoading(true)
    fetchAllBusinessUnlockedCandidates(apiService, {
      unlockType: listFilter === LIST_FILTER_ALL ? undefined : listFilter,
    })
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
  }, [hasActiveFilters, listFilter])

  const displayedCandidates = useMemo(() => {
    const base = hasActiveFilters ? filterAllCandidates : candidates

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

    if (hasActiveFilters) {
      filtered = filtered.filter((c) => passesScoutCandidateFilters(c, scoutFilters))
    }

    return filtered
  }, [hasActiveFilters, candidates, filterAllCandidates, searchQuery, scoutFilters])

  const pagedCandidates = useMemo(() => {
    if (!hasActiveFilters) return displayedCandidates
    const start = (page - 1) * PAGE_SIZE
    return displayedCandidates.slice(start, start + PAGE_SIZE)
  }, [hasActiveFilters, displayedCandidates, page])

  const filterPagination = useMemo(() => {
    if (!hasActiveFilters) return pagination
    const total = displayedCandidates.length
    return {
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    }
  }, [hasActiveFilters, displayedCandidates.length, pagination])

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

  const totalPages = filterPagination.totalPages || 0
  const totalItems = hasActiveFilters
    ? (filterPagination.total || 0)
    : (pagination.total || 0)
  const listForRender = hasActiveFilters ? pagedCandidates : candidates
  const listLoading = loading || (hasActiveFilters && filterAllLoading)
  const showGlobalEmpty = !listLoading && totalItems === 0 && !searchQuery.trim() && listFilter === LIST_FILTER_ALL && !hasActiveFilters
  const highlightQuery = useMemo(
    () => (searchInput.trim() || searchQuery.trim()),
    [searchInput, searchQuery],
  )

  const openCandidateDetail = useCallback((candidateId) => {
    const url = getBusinessUnlockedCandidateDetailUrl(candidateId, {
      list: listFilter,
      search: searchQuery,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [listFilter, searchQuery])

  const hl = useCallback((text) => highlightSearchText(text, highlightQuery), [highlightQuery])

  const filterChips = useMemo(() => {
    const chips = []
    const fc = getScoutFilterCopy(language)
    const list = copy.candidates.list
    const visaOptions = getScoutVisaFilterOptions(language)

    if (listFilter !== LIST_FILTER_ALL) {
      const sourceLabel = unlockSourceOptions.find((o) => o.value === listFilter)?.label || listFilter
      chips.push({
        id: 'source',
        label: `${list.unlockSourceLabel}: ${sourceLabel}`,
        onRemove: () => handleListFilterChange(LIST_FILTER_ALL),
      })
    }

    const q = searchQuery.trim()
    if (q) {
      chips.push({
        id: 'search',
        label: `${fc.keyword}: "${q}"`,
        onRemove: () => {
          setSearchInput('')
          setSearchQuery('')
          setPage(1)
        },
      })
    }

    if (Array.isArray(scoutFilters.locations) && scoutFilters.locations.length > 0) {
      chips.push({
        id: 'locations',
        label: `${fc.location}: ${getWorkLocationsDisplayText(scoutFilters.locations, language)}`,
        onRemove: () => setScoutFilters((prev) => ({ ...prev, locations: [] })),
      })
    }

    if (scoutFilters.jobCategoryId) {
      chips.push({
        id: 'jobCategory',
        label: `${fc.jobCategory}: ${scoutFilters.jobCategoryLabel || scoutFilters.jobCategoryId}`,
        onRemove: () => setScoutFilters((prev) => ({ ...prev, jobCategoryId: '', jobCategoryLabel: '' })),
      })
    }

    if (scoutFilters.experience) {
      const opt = EXPERIENCE_YEARS_OPTIONS.find((o) => o.value === scoutFilters.experience)
      chips.push({
        id: 'experience',
        label: `${fc.experience}: ${getLocalizedOptionLabel(opt, language)}`,
        onRemove: () => setScoutFilters((prev) => ({ ...prev, experience: '' })),
      })
    }

    if (scoutFilters.japaneseLevel) {
      const opt = JAPANESE_LEVEL_FILTER_OPTIONS.find((o) => o.value === scoutFilters.japaneseLevel)
      chips.push({
        id: 'japaneseLevel',
        label: `${fc.japaneseLevel}: ${getLocalizedOptionLabel(opt, language)}`,
        onRemove: () => setScoutFilters((prev) => ({ ...prev, japaneseLevel: '' })),
      })
    }

    if (scoutFilters.visa) {
      const opt = visaOptions.find((o) => o.value === scoutFilters.visa)
      chips.push({
        id: 'visa',
        label: `${fc.visa}: ${opt?.label || scoutFilters.visa}`,
        onRemove: () => setScoutFilters((prev) => ({ ...prev, visa: '' })),
      })
    }

    const min = scoutFilters.salaryMin
    const max = scoutFilters.salaryMax
    if (min !== '' && min != null) {
      chips.push({
        id: 'salaryMin',
        label: `${fc.salaryFrom}: ${min}`,
        onRemove: () => setScoutFilters((prev) => ({ ...prev, salaryMin: '' })),
      })
    }
    if (max !== '' && max != null) {
      chips.push({
        id: 'salaryMax',
        label: `${fc.salaryTo}: ${max}`,
        onRemove: () => setScoutFilters((prev) => ({ ...prev, salaryMax: '' })),
      })
    }

    return chips
  }, [
    listFilter,
    searchQuery,
    scoutFilters,
    language,
    unlockSourceOptions,
    copy.candidates.list,
    handleListFilterChange,
  ])

  return (
    <>
      <style>{candidatePageStyles}</style>
      <div className="business-homepage-shell candidates-workspace-shell flex h-full min-h-0 flex-col overflow-hidden">
        {error && (
          <div className={`mx-3 mt-2 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-red-700 ${BUSINESS_HP_TEXT.caption}`}>
            {error}
          </div>
        )}

        <div className="business-homepage-ui business-app-ui flex h-full min-h-0 flex-1 flex-col overflow-hidden p-2 lg:p-3">
          <BusinessQuickActionsPageLayout onNavigate={navigate}>
            {showGlobalEmpty ? (
              <CandidatesEmptyState copy={copy} />
            ) : (
              <div className="candidates-workspace-body min-h-0 flex-1">
                <div className="candidates-workspace-content">
                  <UnlockedCandidateFilterPanel
                    listFilter={listFilter}
                    onListFilterChange={handleListFilterChange}
                    scoutFilters={scoutFilters}
                    setScoutFilters={setScoutFilters}
                    searchInput={searchInput}
                    setSearchInput={setSearchInput}
                    onApply={handleApplyFilters}
                    onClear={handleClearFilters}
                    hasActiveFilters={hasActiveFilters}
                    displayCount={totalItems}
                    listLoading={listLoading}
                    copy={copy}
                    language={language}
                    unlockSourceOptions={unlockSourceOptions}
                    filterChips={filterChips}
                  />
                  <CandidateListPanel
                    candidates={listForRender}
                    loading={listLoading}
                    total={totalItems}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    listFilter={listFilter}
                    onOpenDetail={openCandidateDetail}
                    hl={hl}
                    copy={copy}
                    language={language}
                  />
                </div>
              </div>
            )}
          </BusinessQuickActionsPageLayout>
        </div>
      </div>
    </>
  )
}

export default Candidate
