import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Briefcase, Loader2, RotateCw, Search, X, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import ScoutCandidateFilterFields, { SCOUT_FILTER_INPUT_CLASS } from '../Bussiness/ScoutCandidateFilterFields'
import ScoutCandidateHoverTip from '../Bussiness/ScoutCandidateHoverTip'
import ScoutMatchBadge from '../Bussiness/ScoutMatchBadge'
import FilterBlock from '../Shared/FilterBlock'
import FilterSelectDropdown from '../Shared/FilterSelectDropdown'
import WorkLocationFilterModal from '../Shared/WorkLocationFilterModal'
import JobCategoryPickerModal from '../Shared/JobCategoryPickerModal'
import { useLanguage } from '../../context/LanguageContext'
import {
  getScoutFilterCopy,
  getScoutWorkspaceCopy,
  getDateLocale,
  formatScoutExperienceSeniorityLocalized,
  getLocalizedScoutDisplayName,
  getScoutJobOptionLabel,
  getLocalizedJobTitle,
} from '../../i18n/businessAppI18n'
import {
  getDefaultScoutFilters,
  hasActiveScoutFilters,
  passesScoutCandidateFilters,
} from '../../utils/scoutFilterOptions'
import {
  formatScoutDesiredSalary,
  formatScoutListLocation,
  getScoutListSkillExcerpt,
  getScoutPrSummary,
  isScoutEmptyDisplayValue,
} from '../../utils/scoutCandidateDisplay'
import { getLocalizedCandidateRole } from '../../utils/jobCategoryDisplay'
import { highlightSearchText } from '../../utils/searchTextHighlight'
import { buildScoreMapFromMatches, fetchJobAiCvMatches } from '../../utils/businessJobAiMatching'
import { BUSINESS_UI_FONT, BUSINESS_UI_FONT_IMPORT } from '../../utils/businessUiFont'
import apiService from '../../services/api'

const SOURCE_LABEL = { scout: 'Scout', ctv: 'CTV', system: 'Hệ thống' }
const PAGE_SIZE = 20
const ANONYMOUS_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?backgroundColor=e2e8f0'

const pickerStyles = `
  ${BUSINESS_UI_FONT_IMPORT}
  .admin-scout-picker-ui {
    --scout-cand-fs-title: 14px;
    --scout-cand-fs-body: 13px;
    --scout-cand-fs-caption: 12px;
    font-size: var(--scout-cand-fs-body);
    line-height: 1.4;
    color: #334155;
  }
  .admin-scout-picker-ui .scout-cand-title {
    font-size: var(--scout-cand-fs-title);
    line-height: 1.35;
    font-weight: 700;
  }
  .admin-scout-picker-ui .scout-cand-subtitle {
    font-size: var(--scout-cand-fs-body);
    line-height: 1.35;
    font-weight: 600;
  }
  .admin-scout-picker-ui .scout-cand-meta {
    font-size: var(--scout-cand-fs-body);
    line-height: 1.35;
  }
  .admin-scout-picker-ui .scout-cand-caption {
    font-size: var(--scout-cand-fs-caption);
    line-height: 1.4;
  }
  .admin-scout-picker-ui .scout-cand-icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
  .admin-scout-picker-ui .scout-filter-title {
    font-size: 12px;
    line-height: 1.35;
    font-weight: 700;
  }
  .admin-scout-picker-ui .scout-filter-action {
    font-size: 11px;
    line-height: 1.35;
    font-weight: 600;
  }
  .admin-scout-picker-scroll::-webkit-scrollbar { width: 5px; }
  .admin-scout-picker-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .admin-scout-picker-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
  .scout-search-highlight {
    background-color: #fef08a !important;
    color: #92400e !important;
    padding: 0 2px;
    border-radius: 2px;
    font-weight: 600;
  }
  .admin-scout-picker-scroll .group:last-child .scout-candidate-hover-tip {
    top: auto;
    bottom: 100%;
    margin-top: 0;
    margin-bottom: 0.25rem;
  }
`

async function fetchAllAdminRecommendationCandidates(params = {}) {
  const candidates = []
  let page = 1
  let totalPages = 1

  do {
    const res = await apiService.listAdminWsChatRecommendationCandidates({
      ...params,
      page,
      limit: 50,
    })
    if (!res?.success) break
    candidates.push(...(res.data?.candidates || []))
    totalPages = res.data?.pagination?.totalPages || 1
    page += 1
  } while (page <= totalPages)

  return { candidates }
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

function PickerAvatar({ candidate, language, size = 48 }) {
  const name = getLocalizedScoutDisplayName(candidate, language)
  const src = candidate?.avatarPhotoPath
    ? candidate.avatarPhotoPath
    : `${ANONYMOUS_AVATAR}&seed=${encodeURIComponent(String(name || candidate?.id || 'x'))}`

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

function AdminScoutCandidatePickerRow({
  candidate,
  selected,
  disabled,
  onToggle,
  hl,
  language,
  matchScore = null,
}) {
  const sourceLabel = SOURCE_LABEL[candidate.source] || candidate.source || '—'
  const position = getLocalizedCandidateRole(candidate, language)
  const exp = formatScoutExperienceSeniorityLocalized(candidate.experienceYears, language)
  const salary = formatScoutDesiredSalary(candidate)
  const location = formatScoutListLocation(candidate)
  const skillExcerpt = getScoutListSkillExcerpt(candidate)
  const prSummary = getScoutPrSummary(candidate)
  const chips = [
    { label: 'KN', value: exp },
    { label: 'Địa điểm', value: location },
    { label: 'Lương', value: salary },
  ].filter((chip) => !isScoutEmptyDisplayValue(chip.value))

  return (
    <div className="group relative">
      <label
        className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors sm:px-4 sm:py-3.5 ${
          selected
            ? 'border-[#0077B6] bg-[#e8f4fa]'
            : disabled
              ? 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-70'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
        }`}
      >
        <input
          type="checkbox"
          checked={selected}
          disabled={disabled}
          onChange={() => onToggle(candidate.id)}
          className="mt-3 h-4 w-4 shrink-0 accent-[#0077B6]"
        />
        <PickerAvatar candidate={candidate} language={language} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="scout-cand-title truncate text-slate-900">
              {hl(getLocalizedScoutDisplayName(candidate, language))}
            </p>
            <span className="scout-cand-caption rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
              {candidate.code || `CV #${candidate.id}`}
            </span>
            <span className="scout-cand-caption rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">
              {sourceLabel}
            </span>
            {candidate.onScout && (
              <span className="scout-cand-caption rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                Scout
              </span>
            )}
            {disabled && (
              <span className="scout-cand-caption rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                Đã thêm
              </span>
            )}
          </div>
          {position ? (
            <p className="scout-cand-subtitle mt-1 truncate text-slate-600">{hl(position)}</p>
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
          {prSummary ? (
            <p className="scout-cand-caption mt-2 line-clamp-2 text-slate-600" title={prSummary}>
              {hl(prSummary)}
            </p>
          ) : null}
          {skillExcerpt ? (
            <p className="scout-cand-caption mt-1 line-clamp-1 text-slate-500" title={skillExcerpt}>
              <span className="font-semibold text-slate-600">Kỹ năng: </span>
              {hl(skillExcerpt)}
            </p>
          ) : null}
        </div>
      </label>
      <ScoutCandidateHoverTip
        candidate={candidate}
        hl={hl}
        matchScore={matchScore}
        language={language}
      />
    </div>
  )
}

export default function AdminWsScoutCandidatePickerModal({
  open,
  onClose,
  sessionId,
  excludeCvIds = [],
  onAdded,
}) {
  const { language } = useLanguage()
  const ws = useMemo(() => getScoutWorkspaceCopy(language), [language])
  const filterCopy = useMemo(() => getScoutFilterCopy(language), [language])

  const [scoutFilters, setScoutFilters] = useState(getDefaultScoutFilters)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [candidates, setCandidates] = useState([])
  const [filterAllCandidates, setFilterAllCandidates] = useState([])
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 })
  const [listLoading, setListLoading] = useState(false)
  const [filterAllLoading, setFilterAllLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showJobCategoryModal, setShowJobCategoryModal] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState('')
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [allMatchCandidates, setAllMatchCandidates] = useState([])
  const [scoreByCvId, setScoreByCvId] = useState({})
  const [matchLoading, setMatchLoading] = useState(false)
  const [aiMatchedTotal, setAiMatchedTotal] = useState(0)

  const excludeSet = useMemo(
    () => new Set((excludeCvIds || []).map((id) => Number(id)).filter(Boolean)),
    [excludeCvIds],
  )
  const excludeParam = useMemo(() => [...excludeSet].join(','), [excludeSet])
  const hasActiveFilters = useMemo(() => hasActiveScoutFilters(scoutFilters), [scoutFilters])

  const highlightQuery = useMemo(
    () => (searchQuery.trim().length >= 2 ? searchQuery.trim() : ''),
    [searchQuery],
  )
  const hl = useCallback(
    (text) => highlightSearchText(text, highlightQuery),
    [highlightQuery],
  )

  useEffect(() => {
    if (!open) return undefined
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput, open])

  useEffect(() => {
    if (!open) {
      setScoutFilters(getDefaultScoutFilters())
      setSearchInput('')
      setSearchQuery('')
      setPage(1)
      setCandidates([])
      setFilterAllCandidates([])
      setSelectedIds([])
      setError('')
      setSelectedJobId('')
      setJobs([])
      setAllMatchCandidates([])
      setScoreByCvId({})
      setAiMatchedTotal(0)
    }
  }, [open])

  const loadJobs = useCallback(async () => {
    if (!open || !sessionId) return
    setJobsLoading(true)
    try {
      const res = await apiService.getAdminWsChatBusinessJobs(sessionId)
      setJobs(res?.data?.jobs || [])
    } catch (e) {
      console.error(e)
      setJobs([])
    } finally {
      setJobsLoading(false)
    }
  }, [open, sessionId])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  const loadJobAiMatches = useCallback(async (jobId) => {
    if (!jobId) {
      setScoreByCvId({})
      setAiMatchedTotal(0)
      setAllMatchCandidates([])
      return
    }
    setMatchLoading(true)
    try {
      const { candidates: all } = await fetchAllAdminRecommendationCandidates({
        excludeCvIds: excludeParam || undefined,
      })
      setAllMatchCandidates(all)
      const cvIds = all.map((c) => String(c.id)).filter(Boolean)
      if (!cvIds.length) {
        setScoreByCvId({})
        setAiMatchedTotal(0)
        return
      }
      const matches = await fetchJobAiCvMatches(apiService, jobId, { cv_ids: cvIds, top_k: cvIds.length })
      setScoreByCvId(buildScoreMapFromMatches(matches))
      setAiMatchedTotal(matches.length)
    } catch (e) {
      console.error(e)
      setScoreByCvId({})
      setAiMatchedTotal(0)
    } finally {
      setMatchLoading(false)
    }
  }, [excludeParam])

  useEffect(() => {
    loadJobAiMatches(selectedJobId)
  }, [selectedJobId, loadJobAiMatches])

  const loadPagedList = useCallback(async () => {
    if (!open || hasActiveFilters || selectedJobId) return
    setListLoading(true)
    setError('')
    try {
      const res = await apiService.listAdminWsChatRecommendationCandidates({
        page,
        limit: PAGE_SIZE,
        search: searchQuery || undefined,
        excludeCvIds: excludeParam || undefined,
      })
      if (res?.success) {
        setCandidates(res.data?.candidates || [])
        setPagination(res.data?.pagination || { total: 0, totalPages: 0 })
      } else {
        setCandidates([])
        setError(res?.message || 'Không tải được danh sách ứng viên')
      }
    } catch (e) {
      console.error(e)
      setCandidates([])
      setError('Không tải được danh sách ứng viên')
    } finally {
      setListLoading(false)
    }
  }, [open, hasActiveFilters, selectedJobId, page, searchQuery, excludeParam])

  useEffect(() => {
    loadPagedList()
  }, [loadPagedList])

  useEffect(() => {
    if (!open || !hasActiveFilters) {
      setFilterAllCandidates([])
      return undefined
    }
    let cancelled = false
    setFilterAllLoading(true)
    fetchAllAdminRecommendationCandidates({
      search: searchQuery || undefined,
      excludeCvIds: excludeParam || undefined,
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
  }, [open, hasActiveFilters, searchQuery, excludeParam])

  const displayedCandidates = useMemo(() => {
    let base
    if (selectedJobId) {
      base = allMatchCandidates.filter((c) => scoreByCvId[String(c.id)] != null)
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
          c.code,
          c.name,
          c.desiredPosition,
          c.desiredWorkLocation,
          c.currentLocationRegion,
          c.scoutPublicSummary,
          c.careerSummary,
          c.strengths,
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
  }, [
    selectedJobId,
    allMatchCandidates,
    scoreByCvId,
    hasActiveFilters,
    filterAllCandidates,
    candidates,
    searchQuery,
    scoutFilters,
  ])

  const pagedCandidates = useMemo(() => {
    if (!selectedJobId && !hasActiveFilters) return displayedCandidates
    const start = (page - 1) * PAGE_SIZE
    return displayedCandidates.slice(start, start + PAGE_SIZE)
  }, [selectedJobId, hasActiveFilters, displayedCandidates, page])

  const effectivePagination = useMemo(() => {
    if (!selectedJobId && !hasActiveFilters) return pagination
    const total = displayedCandidates.length
    return {
      total,
      page,
      limit: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE) || 0,
    }
  }, [selectedJobId, hasActiveFilters, pagination, displayedCandidates.length, page])

  const totalItems = selectedJobId || hasActiveFilters
    ? displayedCandidates.length
    : (pagination.total || displayedCandidates.length)

  const selectedJob = useMemo(
    () => jobs.find((j) => String(j.id) === String(selectedJobId)) || null,
    [jobs, selectedJobId],
  )

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
        onChange={(next) => {
          setSelectedJobId(next || '')
          setPage(1)
        }}
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

  const toggleSelected = (cvId) => {
    const id = Number(cvId)
    if (!id || excludeSet.has(id)) return
    setSelectedIds((prev) => (
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ))
  }

  const handleApplySearch = () => {
    setSearchQuery(searchInput.trim())
    setPage(1)
  }

  const handleClearFilters = () => {
    setScoutFilters(getDefaultScoutFilters())
    setPage(1)
  }

  const handleSubmit = async () => {
    if (!sessionId || !selectedIds.length) return
    setSubmitting(true)
    setError('')
    try {
      const res = await apiService.sendAdminWsChatMessage(sessionId, {
        content: `JobShare WS gửi ${selectedIds.length} hồ sơ ứng viên gợi ý Scout Performance`,
        cvIds: selectedIds,
      })
      if (res?.success) {
        onAdded?.(res)
        onClose?.()
      } else {
        setError(res?.message || 'Không thể thêm ứng viên')
      }
    } catch (e) {
      console.error(e)
      setError(e?.message || 'Không thể thêm ứng viên')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const listLoadingState = listLoading || filterAllLoading || matchLoading

  return createPortal(
    <div className="fixed inset-0 z-[120] flex flex-col bg-slate-900/50">
      <style>{pickerStyles}</style>
      <div
        className="admin-scout-picker-ui flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f4f6f8]"
        style={{ fontFamily: BUSINESS_UI_FONT }}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="scout-cand-title text-slate-900">Thêm ứng viên Scout Performance</div>
            <div className="scout-cand-caption mt-0.5 text-slate-500">
              Tìm trên toàn bộ hồ sơ hợp lệ trong hệ thống — chọn và gửi cho doanh nghiệp
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 lg:p-4">
          <section className="scout-workspace-filters mb-3 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5">
              <h2 className="scout-filter-title text-gray-900">{ws.workspace.filterTitle}</h2>
              <div className="flex items-center gap-2">
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="scout-filter-action text-[#0077B6] hover:underline"
                  >
                    {ws.workspace.clearFilters}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleApplySearch}
                  disabled={listLoadingState}
                  className="inline-flex h-7 items-center justify-center gap-1 rounded px-2.5 shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: '#facc15' }}
                >
                  {listLoadingState ? (
                    <RotateCw className="h-3 w-3 animate-spin text-gray-800" />
                  ) : (
                    <Search className="h-3 w-3 text-gray-800" />
                  )}
                  <span className="scout-filter-action text-gray-800">
                    {ws.workspace.searchProfiles(totalItems, getDateLocale(language))}
                  </span>
                </button>
              </div>
            </div>
            <div className="admin-scout-picker-scroll max-h-[34vh] overflow-y-auto p-3 xl:max-h-none">
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
          </section>

          {error && (
            <div className="mb-2 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 scout-cand-caption text-red-700">
              {error}
            </div>
          )}

          <div className="scout-candidates-list-ui flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <div className="shrink-0 border-b border-slate-100 px-3 py-2.5">
              <h2 className="scout-cand-title text-slate-900">
                {listLoadingState
                  ? ws.workspace.loading
                  : ws.workspace.candidatesFound(totalItems, getDateLocale(language))}
              </h2>
              <p className="scout-cand-caption mt-0.5 text-slate-500">
                {selectedIds.length > 0
                  ? `Đã chọn ${selectedIds.length} ứng viên`
                  : 'Chọn ứng viên để gửi cho doanh nghiệp'}
              </p>
              {selectedJobId && !matchLoading ? (
                <p className="scout-cand-caption mt-1 text-slate-500">
                  {ws.workspace.aiSuggestFor(getLocalizedJobTitle(selectedJob, language) || `JD #${selectedJobId}`)}
                  {' · '}
                  {ws.workspace.aiMatched(aiMatchedTotal, getDateLocale(language))}
                </p>
              ) : null}
            </div>

            <div className="admin-scout-picker-scroll min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {listLoadingState && (
                <div className="scout-cand-meta flex items-center justify-center gap-2 py-10 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {ws.workspace.loadingList}
                </div>
              )}
              {!listLoadingState && pagedCandidates.length === 0 && (
                <div className="scout-cand-meta px-3 py-8 text-center text-slate-500">
                  {selectedJobId ? ws.workspace.emptyJobMatch : hasActiveFilters ? ws.workspace.emptyFilters : ws.workspace.emptyScout}
                </div>
              )}
              {!listLoadingState && pagedCandidates.length > 0 && (
                <div className="flex flex-col gap-2">
                  {pagedCandidates.map((candidate) => {
                    const id = Number(candidate.id)
                    return (
                      <AdminScoutCandidatePickerRow
                        key={candidate.id}
                        candidate={candidate}
                        selected={selectedIds.includes(id)}
                        disabled={excludeSet.has(id)}
                        onToggle={toggleSelected}
                        hl={hl}
                        language={language}
                        matchScore={selectedJobId ? scoreByCvId[String(candidate.id)] : null}
                      />
                    )
                  })}
                </div>
              )}
            </div>

            {effectivePagination.totalPages > 1 && (
              <div className="flex shrink-0 items-center justify-between border-t border-slate-100 px-3 py-2.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="scout-cand-caption inline-flex items-center gap-1 rounded border border-slate-200 px-3 py-1.5 text-slate-600 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Trước
                </button>
                <span className="scout-cand-caption text-slate-500">
                  {page} / {effectivePagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= effectivePagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="scout-cand-caption inline-flex items-center gap-1 rounded border border-slate-200 px-3 py-1.5 text-slate-600 disabled:opacity-40"
                >
                  Sau
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="scout-cand-caption rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedIds.length || submitting}
            className="scout-cand-caption inline-flex items-center gap-1.5 rounded-lg bg-[#0077B6] px-4 py-2 font-semibold text-white hover:bg-[#006399] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Gửi {selectedIds.length > 0 ? `(${selectedIds.length})` : ''} cho doanh nghiệp
          </button>
        </div>
      </div>

      <WorkLocationFilterModal
        open={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        value={scoutFilters.locations}
        onConfirm={(locations) => setScoutFilters((prev) => ({ ...prev, locations }))}
        language={language}
        rightPanelTitle={filterCopy.locationModalTitle}
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
    </div>,
    document.body,
  )
}
