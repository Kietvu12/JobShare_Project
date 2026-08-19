import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus, Search, MoreHorizontal, LayoutList, LayoutGrid,
  Briefcase, MapPin, Clock,
  Copy, Pause, XCircle, Eye, Pencil, Loader2, ChevronDown, RotateCcw,
  Star, ChevronLeft, ChevronRight,
} from 'lucide-react'
import FilterSelectDropdown from '../../component/Shared/FilterSelectDropdown'
import apiService from '../../services/api'
import useBusinessUser from '../../hooks/useBusinessUser'
import useBusinessAppCopy from '../../hooks/useBusinessAppCopy'
import { useLanguage } from '../../context/LanguageContext'
import {
  formatJobSalary,
  getDateLocale,
  getJobDateFilterOptions,
  getJobRowMenuItems,
  getJobSortOptions,
  getJobStatusFilterOptions,
  getJobStatusMeta,
  getJobStatusTabs,
  getLocalizedJobTitle,
  getRecruitmentLabel,
} from '../../i18n/businessAppI18n'
import {
  importLegacyJobBuilderThreadsFromLocalStorage,
  listJobBuilderThreads,
} from '../../utils/jobBuilderThreadStorage'

const BUSINESS_JOBS_FONT =
  "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif"

const JD_NAVY = '#0f2744'
const JD_NAVY_MID = '#1e3a5f'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const ROW_ICON_VARIANTS = [
  { bg: 'bg-sky-100', text: 'text-sky-600' },
  { bg: 'bg-violet-100', text: 'text-violet-600' },
  { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  { bg: 'bg-amber-100', text: 'text-amber-600' },
  { bg: 'bg-rose-100', text: 'text-rose-600' },
]

const INTERVIEW_STATUSES = new Set([7, 8, 9])
const HIRED_STATUSES = new Set([14, 15])

const EMPTY_JOB_STATS = { candidates: 0, referrals: 0, interviews: 0, hired: 0 }

const FILTER_SELECT_CLASS =
  'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 outline-none focus:border-[#0077B6]/40'

function buildJobStatsMap(applications = []) {
  const map = {}
  applications.forEach((app) => {
    const jobId = String(app?.jobId ?? app?.job_id ?? '')
    if (!jobId) return
    if (!map[jobId]) {
      map[jobId] = { candidateIds: new Set(), referrals: 0, interviews: 0, hired: 0 }
    }
    const bucket = map[jobId]
    bucket.referrals += 1
    const cvId = app?.cvId ?? app?.cv_id ?? app?.cvStorageId
    if (cvId != null) bucket.candidateIds.add(String(cvId))
    const status = Number(app?.status)
    if (INTERVIEW_STATUSES.has(status)) bucket.interviews += 1
    if (HIRED_STATUSES.has(status)) bucket.hired += 1
  })
  const result = {}
  Object.entries(map).forEach(([jobId, bucket]) => {
    result[jobId] = {
      candidates: bucket.candidateIds.size,
      referrals: bucket.referrals,
      interviews: bucket.interviews,
      hired: bucket.hired,
    }
  })
  return result
}

function getJobStats(job, statsMap) {
  const fromApps = statsMap[String(job.id)] || EMPTY_JOB_STATS
  const referrals = Math.max(fromApps.referrals, Number(job.applicationCount) || 0)
  return {
    candidates: fromApps.candidates,
    referrals,
    interviews: fromApps.interviews,
    hired: fromApps.hired,
  }
}

function getRowIconVariant(jobId) {
  const n = Number(jobId) || 0
  return ROW_ICON_VARIANTS[n % ROW_ICON_VARIANTS.length]
}

function JobMetricColumn({ value, label }) {
  return (
    <div className="flex min-w-[56px] flex-col items-center text-center">
      <span className="text-base font-bold leading-none text-[#0077B6] lg:text-lg">{value}</span>
      <span className="mt-1 text-[10px] font-medium text-slate-500">{label}</span>
    </div>
  )
}

function JobListPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  paginationCopy,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1
  const end = Math.min(safePage * pageSize, totalItems)

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (safePage <= 3) return [1, 2, 3, 4, 5]
    if (safePage >= totalPages - 2) {
      return Array.from({ length: 5 }, (_, i) => totalPages - 4 + i)
    }
    return [safePage - 2, safePage - 1, safePage, safePage + 1, safePage + 2]
  }, [safePage, totalPages])

  if (totalItems === 0) return null

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white px-3 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between lg:px-4">
      <p className="text-xs text-slate-500">
        {paginationCopy.showing(start, end, totalItems)}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
            aria-label={paginationCopy.prevPage}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageNumbers.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold ${
                p === safePage
                  ? 'bg-[#0077B6] text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
            aria-label={paginationCopy.nextPage}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="relative">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-2.5 pr-8 text-xs font-medium text-slate-700 outline-none"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{paginationCopy.pageSize(size)}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>
      </div>
    </div>
  )
}

function getJobCategoryId(job) {
  return String(job?.jobCategoryId ?? job?.job_category_id ?? job?.category?.id ?? '')
}

function getJobCategoryName(job) {
  const cat = job?.category || job?.jobCategory
  return cat?.name || cat?.nameEn || cat?.nameJp || ''
}

function jobMatchesDateFilter(job, dateFilter) {
  if (!dateFilter) return true
  const updated = new Date(job?.updatedAt || job?.updated_at || 0)
  if (Number.isNaN(updated.getTime())) return false
  const days = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 90
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return updated.getTime() >= cutoff
}

function JobFilterField({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11px] font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  )
}

function formatDate(value, locale = 'vi-VN') {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(locale)
}

function getJobLocation(job) {
  return job?.interviewLocation
    || job?.interview_location
    || job?.workLocation
    || job?.work_location
    || job?.location
    || '—'
}

function getJobTitle(job, language = 'vi') {
  return getLocalizedJobTitle(job, language)
}

function getJobCode(job) {
  return job?.jobCode || job?.job_code || job?.jobNumber || job?.job_number || `JD-${job?.id}`
}

const jobListStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  .business-jobs-list-shell {
    height: 100%;
    min-height: 0;
    font-family: ${BUSINESS_JOBS_FONT};
    background: #f4f6f8;
  }
`

const MENU_ICONS = {
  view: Eye,
  edit: Pencil,
  duplicate: Copy,
  pause: Pause,
  close: XCircle,
}

function JobRowMenu({ job, onClose, onAction, menuItems, closeMenuLabel }) {
  const items = menuItems.filter((item) => !item.hiddenStatus?.(job.status))

  return (
    <>
      <button type="button" className="fixed inset-0 z-30 cursor-default" aria-label={closeMenuLabel} onClick={onClose} />
      <div className="absolute right-0 top-full z-40 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
        {items.map(({ id, label }) => {
          const Icon = MENU_ICONS[id]
          return (
            <button
              key={id}
              type="button"
              onClick={() => onAction(id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
            >
              {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" /> : null}
              {label}
            </button>
          )
        })}
      </div>
    </>
  )
}

function JobListRow({
  job,
  stats,
  onOpen,
  onMenuAction,
  language,
  jobsCopy,
  commonCopy,
  menuItems,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const statusMeta = getJobStatusMeta(job.status, language)
  const title = getJobTitle(job, language)
  const iconVariant = getRowIconVariant(job.id)
  const metrics = stats || EMPTY_JOB_STATS
  const dateLocale = getDateLocale(language)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(job.id)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(job.id)}
      className="group relative flex cursor-pointer flex-col gap-3 rounded-xl border border-slate-200/90 bg-white px-3 py-3 transition hover:border-[#0077B6]/25 hover:bg-[#f8fbfd] sm:px-4 lg:flex-row lg:items-center"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3 lg:items-center lg:gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconVariant.bg} ${iconVariant.text}`}>
          <Briefcase className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-bold text-slate-900 lg:text-[15px]">{title}</h3>
            <Star className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusMeta.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
              {statusMeta.label}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] font-medium text-slate-500">{getJobCode(job)}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" />{getJobLocation(job)}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3 shrink-0" />{getRecruitmentLabel(job, language)}</span>
            <span>{formatJobSalary(job, language)}</span>
          </div>
        </div>

        <div className="relative shrink-0 lg:hidden" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label={commonCopy.actions}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen ? (
            <JobRowMenu
              job={job}
              menuItems={menuItems}
              closeMenuLabel={commonCopy.closeMenu}
              onClose={() => setMenuOpen(false)}
              onAction={(action) => {
                setMenuOpen(false)
                onMenuAction(action, job)
              }}
            />
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 border-t border-slate-100 pt-3 lg:flex lg:shrink-0 lg:items-center lg:gap-4 lg:border-0 lg:pt-0 xl:gap-5">
        <JobMetricColumn value={metrics.candidates} label={jobsCopy.metrics.candidates} />
        <JobMetricColumn value={metrics.referrals} label={jobsCopy.metrics.referrals} />
        <JobMetricColumn value={metrics.interviews} label={jobsCopy.metrics.interviews} />
        <JobMetricColumn value={metrics.hired} label={jobsCopy.metrics.hired} />
      </div>

      <div className="hidden shrink-0 flex-col items-end gap-2 lg:flex">
        <p className="whitespace-nowrap text-[10px] text-slate-400">
          {commonCopy.updatedAt(formatDate(job.updatedAt || job.updated_at, dateLocale))}
        </p>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label={commonCopy.actions}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen ? (
            <JobRowMenu
              job={job}
              menuItems={menuItems}
              closeMenuLabel={commonCopy.closeMenu}
              onClose={() => setMenuOpen(false)}
              onAction={(action) => {
                setMenuOpen(false)
                onMenuAction(action, job)
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function DraftThreadRow({ thread, onOpen, jobsCopy, commonCopy, language }) {
  const dateLocale = getDateLocale(language)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(thread.id)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(thread.id)}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-dashed border-amber-200 bg-amber-50/50 px-3 py-3 transition hover:border-amber-300 sm:px-4"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600">
        <Briefcase className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-bold text-slate-900">{thread.title || jobsCopy.draft.defaultTitle}</h3>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{jobsCopy.draft.badge}</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">{jobsCopy.draft.hint}</p>
        <p className="mt-1 text-[10px] text-slate-400">{commonCopy.updatedAt(formatDate(thread.updatedAt, dateLocale))}</p>
      </div>
    </div>
  )
}

const JobManagement = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user: businessUser } = useBusinessUser()
  const { language } = useLanguage()
  const copy = useBusinessAppCopy()
  const jobsCopy = copy.jobs
  const commonCopy = copy.common
  const statusTabs = useMemo(() => getJobStatusTabs(language), [language])
  const sortOptions = useMemo(() => getJobSortOptions(language), [language])
  const statusFilterOptions = useMemo(() => getJobStatusFilterOptions(language), [language])
  const dateFilterOptions = useMemo(() => getJobDateFilterOptions(language), [language])
  const menuItems = useMemo(() => getJobRowMenuItems(jobsCopy), [jobsCopy])
  const dateLocale = getDateLocale(language)

  const [jobs, setJobs] = useState([])
  const [draftThreads, setDraftThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '')
  const [statusTab, setStatusTab] = useState(searchParams.get('tab') || 'all')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '')
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '')
  const [dateFilter, setDateFilter] = useState(searchParams.get('date') || '')
  const [sortBy, setSortBy] = useState('updated')
  const [viewMode, setViewMode] = useState('list')
  const [jobStatsMap, setJobStatsMap] = useState({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const searchTimerRef = useRef(null)

  const loadApplicationStats = useCallback(async () => {
    try {
      const all = []
      let currentPage = 1
      let totalPages = 1
      do {
        const res = await apiService.getBusinessApplications({ page: currentPage, limit: 100 })
        if (!res?.success) break
        all.push(...(res.data?.applications || []))
        totalPages = res.data?.pagination?.totalPages || 0
        currentPage += 1
      } while (currentPage <= totalPages)
      setJobStatsMap(buildJobStatsMap(all))
    } catch {
      setJobStatsMap({})
    }
  }, [])

  const loadJobs = useCallback(async (search = '') => {
    setLoading(true)
    try {
      const all = []
      let page = 1
      let totalPages = 1
      do {
        const res = await apiService.getBusinessJobs({
          page,
          limit: 50,
          search: search || undefined,
        })
        if (!res?.success) break
        all.push(...(res.data?.jobs || []))
        totalPages = res.data?.pagination?.totalPages || 0
        page += 1
      } while (page <= totalPages)
      setJobs(all)
    } catch (err) {
      console.error(err)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDraftThreads = useCallback(async () => {
    try {
      await importLegacyJobBuilderThreadsFromLocalStorage()
      const threads = await listJobBuilderThreads()
      setDraftThreads(threads.filter((t) => !t.jobId))
    } catch {
      setDraftThreads([])
    }
  }, [])

  useEffect(() => {
    if (!businessUser?.id) return
    loadDraftThreads()
    loadApplicationStats()
  }, [businessUser?.id, loadDraftThreads, loadApplicationStats])

  useEffect(() => {
    if (!businessUser?.id) return
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      loadJobs(searchInput.trim())
      const next = new URLSearchParams()
      if (statusTab !== 'all') next.set('tab', statusTab)
      if (searchInput.trim()) next.set('search', searchInput.trim())
      if (categoryFilter) next.set('category', categoryFilter)
      if (locationFilter) next.set('location', locationFilter)
      if (dateFilter) next.set('date', dateFilter)
      setSearchParams(next, { replace: true })
    }, 350)
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [searchInput, businessUser?.id, loadJobs, setSearchParams, statusTab, categoryFilter, locationFilter, dateFilter])

  const categoryOptions = useMemo(() => {
    const map = new Map()
    jobs.forEach((job) => {
      const id = getJobCategoryId(job)
      if (!id) return
      const label = getJobCategoryName(job) || `Ngành #${id}`
      map.set(id, label)
    })
    return [
      { value: '', label: 'Tất cả ngành nghề' },
      ...Array.from(map.entries())
        .sort((a, b) => a[1].localeCompare(b[1], 'vi'))
        .map(([value, label]) => ({ value, label })),
    ]
  }, [jobs])

  const locationOptions = useMemo(() => {
    const set = new Set()
    jobs.forEach((job) => {
      const loc = getJobLocation(job)
      if (loc && loc !== '—') set.add(loc)
    })
    return [
      { value: '', label: jobsCopy.filters.allLocation },
      ...Array.from(set)
        .sort((a, b) => a.localeCompare(b, dateLocale))
        .map((loc) => ({ value: loc, label: loc })),
    ]
  }, [jobs, jobsCopy.filters.allLocation, dateLocale])

  const tabCounts = useMemo(() => {
    const counts = { all: jobs.length, recruiting: 0, draft: 0, paused: 0, closed: 0 }
    jobs.forEach((job) => {
      const s = Number(job.status)
      if (s === 1) counts.recruiting += 1
      if (s === 0) counts.draft += 1
      if (s === 2 || s === 3) counts.closed += 1
    })
    counts.draft += draftThreads.length
    return counts
  }, [jobs, draftThreads])

  const filteredJobs = useMemo(() => {
    const tab = statusTabs.find((t) => t.id === statusTab)
    let list = jobs
    if (tab?.statuses?.length) {
      list = list.filter((job) => tab.statuses.includes(Number(job.status)))
    } else if (statusTab === 'paused') {
      list = []
    }
    if (categoryFilter) {
      list = list.filter((job) => getJobCategoryId(job) === String(categoryFilter))
    }
    if (locationFilter) {
      list = list.filter((job) => getJobLocation(job) === locationFilter)
    }
    if (dateFilter) {
      list = list.filter((job) => jobMatchesDateFilter(job, dateFilter))
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'title') {
        return getJobTitle(a, language).localeCompare(getJobTitle(b, language), dateLocale)
      }
      if (sortBy === 'created') {
        return new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0)
      }
      return new Date(b.updatedAt || b.updated_at || 0) - new Date(a.updatedAt || a.updated_at || 0)
    })
  }, [jobs, sortBy, statusTab, categoryFilter, locationFilter, dateFilter, statusTabs, dateLocale])

  const showDraftThreads = statusTab === 'all' || statusTab === 'draft'

  const listItems = useMemo(() => {
    const items = []
    if (showDraftThreads) {
      draftThreads.forEach((thread) => items.push({ type: 'draft', thread }))
    }
    filteredJobs.forEach((job) => items.push({ type: 'job', job }))
    return items
  }, [showDraftThreads, draftThreads, filteredJobs])

  const totalListItems = listItems.length
  const totalPages = Math.max(1, Math.ceil(totalListItems / pageSize))
  const safePage = Math.min(page, totalPages)

  const pagedListItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return listItems.slice(start, start + pageSize)
  }, [listItems, pageSize, safePage])

  useEffect(() => {
    setPage(1)
  }, [searchInput, statusTab, categoryFilter, locationFilter, dateFilter, sortBy, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const handleStatusTab = (tabId) => {
    setStatusTab(tabId)
  }

  const handleStatusFilterChange = (value) => {
    setStatusTab(value || 'all')
  }

  const openJobDetail = (jobId) => {
    navigate(`/business/jobs/${jobId}`)
  }

  const openDraftThread = (threadId) => {
    navigate(`/business/jobs/create?threadId=${encodeURIComponent(threadId)}`)
  }

  const handleMenuAction = async (action, job) => {
    if (action === 'view') {
      openJobDetail(job.id)
      return
    }
    if (action === 'edit') {
      navigate(`/business/jobs/${job.id}/edit`)
      return
    }
    if (action === 'pause') {
      try {
        const res = await apiService.updateBusinessJob(job.id, { status: 0 })
        if (res?.success) loadJobs(searchInput.trim())
        else window.alert(res?.message || jobsCopy.alerts.pauseFailed)
      } catch {
        window.alert(jobsCopy.alerts.pauseFailed)
      }
      return
    }
    if (action === 'close') {
      if (!window.confirm(jobsCopy.alerts.closeConfirm(getJobTitle(job, language)))) return
      try {
        const res = await apiService.updateBusinessJob(job.id, { status: 2 })
        if (res?.success) loadJobs(searchInput.trim())
        else window.alert(res?.message || jobsCopy.alerts.closeFailed)
      } catch {
        window.alert(jobsCopy.alerts.closeFailed)
      }
    }
  }

  const clearFilters = () => {
    setSearchInput('')
    setStatusTab('all')
    setCategoryFilter('')
    setLocationFilter('')
    setDateFilter('')
    setPage(1)
    setSearchParams({}, { replace: true })
    loadJobs('')
  }

  const hasActiveFilters = Boolean(
    searchInput.trim()
    || statusTab !== 'all'
    || categoryFilter
    || locationFilter
    || dateFilter,
  )

  return (
    <>
      <style>{jobListStyles}</style>
      <div className="business-jobs-list-shell flex h-full min-h-0 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto p-3 lg:p-4">
          <div className="w-full space-y-3 px-1 lg:px-2">
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-slate-900 lg:text-xl">{jobsCopy.title}</h1>
                <p className="mt-1 text-xs text-slate-500 lg:text-sm">
                  {jobsCopy.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/business/jobs/create')}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 lg:text-sm"
                style={{ backgroundColor: JD_NAVY_MID }}
              >
                <Plus className="h-4 w-4" />
                {jobsCopy.createJd}
              </button>
            </header>

            <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm lg:p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex flex-1 items-center rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={jobsCopy.searchPlaceholder}
                    className="min-w-0 flex-1 bg-transparent pr-8 text-xs text-slate-800 outline-none placeholder:text-slate-400 lg:text-sm"
                  />
                  <Search className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
                </div>
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {commonCopy.clearFilters}
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <JobFilterField label={jobsCopy.filters.status}>
                  <FilterSelectDropdown
                    value={statusTab}
                    onChange={handleStatusFilterChange}
                    options={statusFilterOptions}
                    placeholder={jobsCopy.filters.allStatus}
                    className={FILTER_SELECT_CLASS}
                    maxPanelHeight={220}
                  />
                </JobFilterField>
                <JobFilterField label={jobsCopy.filters.category}>
                  <FilterSelectDropdown
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                    options={categoryOptions}
                    placeholder={jobsCopy.filters.allCategory}
                    searchable
                    searchPlaceholder={jobsCopy.filters.searchCategory}
                    className={FILTER_SELECT_CLASS}
                    maxPanelHeight={240}
                  />
                </JobFilterField>
                <JobFilterField label={jobsCopy.filters.location}>
                  <FilterSelectDropdown
                    value={locationFilter}
                    onChange={setLocationFilter}
                    options={locationOptions}
                    placeholder={jobsCopy.filters.allLocation}
                    searchable
                    searchPlaceholder={jobsCopy.filters.searchLocation}
                    className={FILTER_SELECT_CLASS}
                    maxPanelHeight={240}
                  />
                </JobFilterField>
                <JobFilterField label={jobsCopy.filters.date}>
                  <FilterSelectDropdown
                    value={dateFilter}
                    onChange={setDateFilter}
                    options={dateFilterOptions}
                    placeholder={jobsCopy.filters.allTime}
                    className={FILTER_SELECT_CLASS}
                    maxPanelHeight={200}
                  />
                </JobFilterField>
              </div>

              <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-3">
                <div className="flex flex-wrap gap-4">
                  {statusTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleStatusTab(tab.id)}
                      className={`border-b-2 pb-2 text-[11px] font-semibold transition lg:text-xs ${
                        statusTab === tab.id
                          ? 'border-[#0077B6] text-[#0077B6]'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {tab.label} ({tabCounts[tab.id] ?? 0})
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">{commonCopy.sortLabel}</span>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-2.5 pr-7 text-[11px] font-medium text-slate-700 outline-none"
                      >
                        {sortOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                  <div className="flex rounded-lg border border-slate-200 p-0.5">
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`rounded-md p-1.5 ${viewMode === 'list' ? 'bg-[#0077B6] text-white' : 'text-slate-400 hover:text-slate-600'}`}
                      aria-label={commonCopy.listView}
                    >
                      <LayoutList className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`rounded-md p-1.5 ${viewMode === 'grid' ? 'bg-[#0077B6] text-white' : 'text-slate-400 hover:text-slate-600'}`}
                      aria-label={commonCopy.gridView}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-[#0077B6]" />
              </div>
            ) : totalListItems === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
                <Briefcase className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-600">{jobsCopy.empty.title}</p>
                <p className="mt-1 text-xs text-slate-400">{jobsCopy.empty.hint}</p>
                <button
                  type="button"
                  onClick={() => navigate('/business/jobs/create')}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white"
                  style={{ backgroundColor: JD_NAVY_MID }}
                >
                  <Plus className="h-4 w-4" />
                  {jobsCopy.createJd}
                </button>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-2 md:grid-cols-2' : 'flex flex-col gap-2'}>
                  {pagedListItems.map((item) => (
                    item.type === 'draft' ? (
                      <DraftThreadRow
                        key={item.thread.id}
                        thread={item.thread}
                        onOpen={openDraftThread}
                        jobsCopy={jobsCopy}
                        commonCopy={commonCopy}
                        language={language}
                      />
                    ) : (
                      <JobListRow
                        key={item.job.id}
                        job={item.job}
                        stats={getJobStats(item.job, jobStatsMap)}
                        onOpen={openJobDetail}
                        onMenuAction={handleMenuAction}
                        language={language}
                        jobsCopy={jobsCopy}
                        commonCopy={commonCopy}
                        menuItems={menuItems}
                      />
                    )
                  ))}
                </div>
                <JobListPagination
                  page={safePage}
                  pageSize={pageSize}
                  totalItems={totalListItems}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size)
                    setPage(1)
                  }}
                  paginationCopy={commonCopy.pagination}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default JobManagement
