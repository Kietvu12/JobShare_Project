import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, Sparkles, RotateCw, Search, Unlock } from 'lucide-react'
import nothingIllustration from '../../assets/Nothing.png'
import apiService from '../../services/api'
import FilterBlock from '../../component/Shared/FilterBlock'
import FilterSelectDropdown from '../../component/Shared/FilterSelectDropdown'
import ScoutCandidateFilterFields, { SCOUT_FILTER_INPUT_CLASS } from '../../component/Bussiness/ScoutCandidateFilterFields.jsx'
import WorkLocationFilterModal from '../../component/Shared/WorkLocationFilterModal'
import JobCategoryPickerModal from '../../component/Shared/JobCategoryPickerModal'
import { HomepageSidebar } from './Homepage'
import { highlightSearchText } from '../../utils/searchTextHighlight'
import { getBusinessUnlockedCandidateDetailUrl } from '../../utils/businessUnlockedCandidateDetailUrl'
import { fetchAllBusinessUnlockedCandidates } from '../../utils/businessUnlockedCandidates'
import {
  getDefaultScoutFilters,
  hasActiveScoutFilters,
  passesScoutCandidateFilters,
} from '../../utils/scoutFilterOptions'
import ScoutCandidateHoverTip from '../../component/Bussiness/ScoutCandidateHoverTip'
import {
  getScoutSkillTags,
  formatScoutDesiredSalary,
  formatScoutListLocation,
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

const ANONYMOUS_AVATAR = 'https://api.dicebear.com/7.x/shapes/svg?seed=scout-unlocked'
const PAGE_SIZE = 20
const BRAND = '#0077B6'
const PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif"

const LIST_FILTER_ALL = 'all'

function parseListFilter(listParam) {
  if (listParam === 'scout_credit' || listParam === 'scout_performance') return listParam
  return LIST_FILTER_ALL
}

const candidatePageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  .business-homepage-shell { --hp-zoom: 1; }
  @media (min-width: 1024px) and (max-width: 1279px) { .business-homepage-shell { --hp-zoom: 0.9; } }
  @media (min-width: 1280px) and (max-width: 1535px) { .business-homepage-shell { --hp-zoom: 0.86; } }
  @media (min-width: 1024px) and (max-height: 760px) { .business-homepage-shell { --hp-zoom: 0.78; } }
  @media (min-width: 1024px) and (min-height: 761px) and (max-height: 860px) { .business-homepage-shell { --hp-zoom: 0.84; } }
  @media (min-width: 1536px) and (min-height: 861px) { .business-homepage-shell { --hp-zoom: 0.94; } }
  @media (min-width: 1920px) and (min-height: 900px) { .business-homepage-shell { --hp-zoom: 1; } }
  .business-homepage-ui { zoom: var(--hp-zoom); }
  @supports not (zoom: 1) {
    .business-homepage-ui {
      transform: scale(var(--hp-zoom));
      transform-origin: top left;
      width: calc(100% / var(--hp-zoom));
    }
  }
  .candidates-workspace-shell {
    flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; background: #f4f6f8;
  }
  .candidates-workspace-body {
    flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr; gap: 10px; overflow: hidden;
  }
  @media (min-width: 1280px) {
    .candidates-workspace-body { grid-template-columns: minmax(0, 1fr) 204px; }
  }
  .candidates-workspace-content {
    min-height: 0; display: flex; flex-direction: column; gap: 10px; overflow: hidden;
  }
  @media (min-width: 1024px) and (max-width: 1279px) {
    .candidates-workspace-aside { display: none; }
  }
  .scout-candidates-list-ui {
    --scout-cand-fs-title: 12px; --scout-cand-fs-body: 12px; --scout-cand-fs-caption: 11px; --scout-cand-icon: 13px;
    line-height: 1.45; color: #334155; font-size: var(--scout-cand-fs-body);
  }
  .scout-candidates-list-ui .scout-cand-title { font-size: var(--scout-cand-fs-title); line-height: 1.35; font-weight: 700; }
  .scout-candidates-list-ui .scout-cand-subtitle { font-size: var(--scout-cand-fs-body); line-height: 1.35; font-weight: 600; }
  .scout-candidates-list-ui .scout-cand-meta { font-size: var(--scout-cand-fs-body); line-height: 1.35; }
  .scout-candidates-list-ui .scout-cand-caption { font-size: var(--scout-cand-fs-caption); line-height: 1.4; }
  .scout-candidates-list-ui .scout-cand-icon { width: var(--scout-cand-icon); height: var(--scout-cand-icon); flex-shrink: 0; }
  .scout-search-highlight {
    background-color: #fef08a !important; color: #92400e !important;
    padding: 0 2px; border-radius: 2px; font-weight: 600;
  }
  .candidate-scrollbar::-webkit-scrollbar { width: 4px; }
  .candidate-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .candidate-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
  .business-homepage-scroll::-webkit-scrollbar { width: 4px; }
  .business-homepage-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  .scout-scrollbar::-webkit-scrollbar { width: 6px; }
  .scout-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .scout-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .scout-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  .scout-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
`

function AvatarCircle({ candidate, size = 44, language = 'vi' }) {
  const name = getLocalizedScoutDisplayName(candidate, language)
  const src = candidate?.avatarPhotoPath
    ? candidate.avatarPhotoPath
    : `${ANONYMOUS_AVATAR}&seed=${encodeURIComponent(String(name || candidate?.id || 'x'))}`
  return (
    <img
      src={src}
      alt=""
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: '#e2e8f0' }}
      onError={(e) => { e.currentTarget.src = `${ANONYMOUS_AVATAR}&seed=fallback` }}
    />
  )
}

function ScoutMetaChip({ children }) {
  return (
    <span className="scout-cand-meta inline-flex max-w-full truncate rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
      {children}
    </span>
  )
}

function UnlockedCandidateRowBody({ candidate, hl = (t) => t, language }) {
  const position = getLocalizedCandidateRole(candidate, language)
  const pipeline = getLocalizedScoutPipelineMeta(candidate.pipelineStatus, language)
  const unlockSource = getLocalizedScoutUnlockSourceMeta(candidate.unlockType, language)
  const skillExcerpt = getScoutSkillTags(candidate).join(' · ')

  return (
    <>
      <p className="scout-cand-title truncate text-slate-900">{hl(getLocalizedScoutDisplayName(candidate, language))}</p>
      {position ? <p className="scout-cand-subtitle mt-0.5 truncate text-slate-600">{hl(position)}</p> : null}
      <div className="mt-1.5 flex flex-wrap gap-1">
        <ScoutMetaChip>{formatScoutListLocation(candidate)}</ScoutMetaChip>
        <ScoutMetaChip>{formatScoutExperienceSeniorityLocalized(candidate.experienceYears, language)}</ScoutMetaChip>
        <ScoutMetaChip>{formatScoutDesiredSalary(candidate)}</ScoutMetaChip>
        <ScoutMetaChip>{formatScoutLanguageSummaryLocalized(candidate, language)}</ScoutMetaChip>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span
          className="scout-cand-caption rounded-full px-2 py-0.5 font-semibold"
          style={{ color: unlockSource.color, background: `${unlockSource.color}18` }}
        >
          {unlockSource.label}
        </span>
        <span
          className="scout-cand-caption rounded-full px-2 py-0.5 font-semibold"
          style={{ color: pipeline.color, background: pipeline.bg }}
        >
          {pipeline.label}
        </span>
        <span className="scout-cand-caption text-slate-400">{formatCandidateListDate(candidate.unlockedAt, language)}</span>
      </div>
      {skillExcerpt ? (
        <p className="scout-cand-meta mt-1.5 line-clamp-1 text-slate-500" title={skillExcerpt}>{hl(skillExcerpt)}</p>
      ) : null}
    </>
  )
}

function UnlockedCandidateListItem({ candidate, highlightQuery, onOpenDetail, hl, language }) {
  const tipCandidate = { ...candidate, isUnlocked: true }
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => onOpenDetail(candidate.id)}
        className="flex w-full items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-sm"
      >
        <AvatarCircle candidate={candidate} size={44} language={language} />
        <div className="min-w-0 flex-1">
          <UnlockedCandidateRowBody candidate={candidate} hl={hl} language={language} />
        </div>
      </button>
      <ScoutCandidateHoverTip candidate={tipCandidate} hl={hl} language={language} />
    </div>
  )
}

function CandidatesEmptyState({ copy }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
      <img src={nothingIllustration} alt="" className="mb-4 w-full max-w-[220px] object-contain" draggable={false} />
      <p className="max-w-md text-xs font-medium leading-relaxed text-slate-700 sm:text-sm">
        {copy.candidates.list.emptyBody}
      </p>
      <button
        type="button"
        onClick={() => navigate('/business/scout/direct')}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-95 sm:text-sm"
        style={{ background: BRAND }}
      >
        <Sparkles className="h-4 w-4" strokeWidth={2} />
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
}) {
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showJobCategoryModal, setShowJobCategoryModal] = useState(false)

  const leadingBlock = (
    <FilterBlock icon={Unlock} label={copy.candidates.list.unlockSourceLabel} compact>
      <FilterSelectDropdown
        value={listFilter}
        onChange={onListFilterChange}
        options={unlockSourceOptions}
        placeholder={copy.candidates.list.unlockSourceAll}
        className={SCOUT_FILTER_INPUT_CLASS}
      />
    </FilterBlock>
  )

  return (
    <section className="scout-workspace-filters shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5">
        <h2 className="text-xs font-bold text-gray-900">{copy.candidates.list.filtersTitle}</h2>
        <div className="flex items-center gap-2">
          {hasActiveFilters ? (
            <button type="button" onClick={onClear} className="text-[9px] font-semibold text-[#0077B6] hover:underline">
              {copy.candidates.list.clearConditions}
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
              {copy.candidates.list.searchCount(formatCandidateNumber(displayCount || 0, language))}
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
      <div className="border-b border-slate-100 px-3 py-2">
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

  return (
    <>
      <style>{candidatePageStyles}</style>
      <div className="business-homepage-shell candidates-workspace-shell flex h-full min-h-0 flex-col overflow-hidden" style={{ fontFamily: PAGE_FONT }}>
        {error && (
          <div className="mx-3 mt-2 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] text-red-700">
            {error}
          </div>
        )}

        <div className="business-homepage-ui flex min-h-0 flex-1 flex-col overflow-hidden p-2 lg:p-3">
          {showGlobalEmpty ? (
            <CandidatesEmptyState copy={copy} />
          ) : (
            <div className="candidates-workspace-body min-h-0 flex-1">
              <div className="candidates-workspace-content min-h-0">
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
              <div className="candidates-workspace-aside candidate-scrollbar min-h-0 overflow-y-auto business-homepage-scroll">
                <HomepageSidebar onNavigate={navigate} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Candidate
