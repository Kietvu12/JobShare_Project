import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Search, ChevronRight, ChevronLeft,
  MessageSquare, Loader2, LayoutGrid, List,
} from 'lucide-react'
import BusinessQuickActionsPageLayout from '../../component/Bussiness/BusinessQuickActionsPageLayout.jsx'
import apiService from '../../services/api'
import BusinessApplicationDetailDrawer from '../../component/Bussiness/BusinessApplicationDetailDrawer'
import BusinessApplicationStatusSelect from '../../component/Bussiness/BusinessApplicationStatusSelect.jsx'
import {
  buildApplicationStatusPatch,
  changeBusinessApplicationStatus,
  getBusinessApplicationPortalStatusOptions,
} from '../../utils/businessApplicationStatusChange'
import {
  getStatusCategoryStyle,
  isApplicationProfileOnly,
} from '../../utils/businessApplicationSource'
import { getJobApplicationStatusOptionsByLanguage } from '../../utils/jobApplicationStatus'
import {
  buildJobByIdMap,
  formatApplicationDateLocalized,
  formatApplicationDateTimeLocalized,
  formatApplicationRelativeTimeLocalized,
  localizeApplication,
  localizeApplications,
  localizeApplicationStats,
} from '../../utils/businessApplicationDisplay'
import useBusinessAppCopy from '../../hooks/useBusinessAppCopy'
import { useLanguage } from '../../context/LanguageContext'
import {
  getApplicationSourceOptions,
  getApplicationStageLabels,
  getKanbanColumns,
} from '../../i18n/businessAppI18n'
import { getLocalizedJobTitle } from '../../i18n/businessApp/jdBuilder'

const PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif"
const BRAND = '#0077B6'
const BRAND_LIGHT = '#e8f4fa'

const applicationsPageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  .business-homepage-scroll::-webkit-scrollbar { width: 4px; }
  .business-homepage-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
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
`

const scrollbarHideStyle = applicationsPageStyles

const LIST_TAB = 'all'
const CTV_SOURCE_TYPES = new Set(['ctv_marketplace', 'ctv_nomination'])

function sumStatusCategories(stats, categories) {
  return (stats?.byStatusCategory || [])
    .filter((c) => categories.includes(c.category))
    .reduce((acc, c) => acc + (c.value || 0), 0)
}

function ApplicationSourceCell({ app }) {
  const showCtv = CTV_SOURCE_TYPES.has(app.sourceType) && app.ctvName
  return (
    <>
      <span className="text-xs font-semibold" style={{ color: app.sourceColor }}>
        {app.sourceLabel}
      </span>
      {showCtv ? (
        <div className="mt-0.5 text-xs text-slate-500 truncate" title={app.ctvName}>
          CTV: {app.ctvName}
        </div>
      ) : null}
    </>
  )
}

function getKanbanColumnId(status, kanbanColumns) {
  const n = Number(status)
  const col = kanbanColumns.find((c) => c.statuses.includes(n))
  return col?.id || 'new'
}

function KanbanCard({ app, onOpen, onDragStart }) {
  const stageStyle = getStatusCategoryStyle(app.statusCategory)
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, app)}
      onClick={() => onOpen(app)}
      className="cursor-pointer rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <div className="text-xs font-semibold text-slate-800 truncate sm:text-sm">{app.candidateName}</div>
      <div className="mt-0.5 text-xs text-slate-500 truncate">{app.jobTitle}</div>
      <div className="mt-2 flex items-center justify-between gap-1">
        <span className="text-[11px] font-semibold truncate" style={{ color: app.sourceColor }}>
          {app.sourceLabel}
        </span>
        <span
          className="shrink-0 rounded px-1 py-0.5 text-[10px] font-semibold sm:text-xs"
          style={{ color: stageStyle.color, background: stageStyle.bg }}
        >
          {app.statusLabel}
        </span>
      </div>
    </div>
  )
}

function ApplicationsKanban({ applications, onOpen, onStatusChange, updatingId, kanbanColumns, updatingLabel }) {
  const [dragApp, setDragApp] = useState(null)

  const grouped = useMemo(() => {
    const map = Object.fromEntries(kanbanColumns.map((c) => [c.id, []]))
    applications.forEach((app) => {
      const colId = getKanbanColumnId(app.status, kanbanColumns)
      if (map[colId]) map[colId].push(app)
      else map.new.push(app)
    })
    return map
  }, [applications, kanbanColumns])

  const handleDrop = (column) => async (e) => {
    e.preventDefault()
    if (!dragApp || Number(dragApp.status) === column.defaultStatus) {
      setDragApp(null)
      return
    }
    await onStatusChange(dragApp, column.defaultStatus)
    setDragApp(null)
  }

  return (
    <div className="flex min-h-0 flex-1 gap-2 overflow-x-auto p-3 business-homepage-scroll">
      {kanbanColumns.map((col) => (
        <div
          key={col.id}
          className="flex w-[168px] shrink-0 flex-col rounded-xl bg-slate-50/80 ring-1 ring-slate-100"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop(col)}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-2.5 py-2">
            <span className="text-xs font-bold text-slate-700">{col.label}</span>
            <span className="rounded-full bg-white px-1.5 py-0.5 text-[11px] font-bold text-slate-500 tabular-nums sm:text-xs">
              {grouped[col.id]?.length || 0}
            </span>
          </div>
          <div className="flex min-h-[120px] flex-col gap-2 overflow-y-auto p-2 business-homepage-scroll">
            {(grouped[col.id] || []).map((app) => (
              <KanbanCard
                key={app.id}
                app={app}
                onOpen={onOpen}
                onDragStart={(_, a) => setDragApp(a)}
              />
            ))}
            {updatingId && grouped[col.id]?.some((a) => a.id === updatingId) && (
              <div className="text-center text-xs text-slate-400 py-1">{updatingLabel}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function PieChart({ stats, emptyLabel, totalLabel }) {
  const slices = stats?.bySource || []
  const total = stats?.total || 0
  if (!total) {
    return (
      <div className="text-xs text-slate-400 text-center py-3">
        {emptyLabel}
      </div>
    )
  }

  let currentAngle = -90
  const paths = slices.map((d) => {
    const percentage = (d.value / total) * 100
    const sliceAngle = (percentage / 100) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + sliceAngle
    const r = 35
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    const x1 = 50 + r * Math.cos(startRad)
    const y1 = 50 + r * Math.sin(startRad)
    const x2 = 50 + r * Math.cos(endRad)
    const y2 = 50 + r * Math.sin(endRad)
    const largeArcFlag = sliceAngle > 180 ? 1 : 0
    currentAngle = endAngle
    return {
      path: `M 50 50 L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
      color: d.color,
      label: d.label,
      value: d.value,
      percent: d.percent,
    }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={90} height={90} viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
        {paths.map((slice, i) => (
          <path key={i} d={slice.path} fill={slice.color} stroke="white" strokeWidth="2" />
        ))}
        <circle cx="50" cy="50" r="25" fill="white" />
        <text x="50" y="48" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b">
          {total}
        </text>
        <text x="50" y="60" textAnchor="middle" fontSize="7" fill="#64748b">
          {totalLabel}
        </text>
      </svg>
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        {paths.map((d, i) => (
          <div key={i} className="text-xs flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: d.color }} />
            <span className="text-slate-600 font-medium flex-1 truncate">{d.label}</span>
            <span className="text-slate-500 font-semibold shrink-0">
              {d.value} ({d.percent}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const StatCard = ({ label, value, accent }) => (
  <div
    className={`rounded-lg border px-2.5 py-1.5 shadow-sm ${
      accent ? 'border-[#cce5f0]/80 bg-[#e8f4fa]' : 'border-slate-200/90 bg-white'
    }`}
  >
    <p className="text-xs font-medium text-slate-500 sm:text-sm">{label}</p>
    <p className="text-xl font-bold tabular-nums leading-tight text-slate-800 sm:text-2xl">{value ?? 0}</p>
  </div>
)

function ApplicationMobileCard({ app, isSelected, onOpen, tableLabels, language, unreadLabel }) {
  const stageStyle = getStatusCategoryStyle(app.statusCategory)
  const showChatBadge = !isApplicationProfileOnly(app)
  return (
    <button
      type="button"
      onClick={() => onOpen(app)}
      className={`w-full border-b border-dashed border-slate-200 px-3 py-3 text-left transition-colors last:border-b-0 ${
        isSelected ? 'bg-[#e8f4fa]/90' : 'bg-white hover:bg-slate-50/80'
      }`}
    >
      <div className="space-y-2">
        {[
          { label: tableLabels.candidate, value: app.candidateName, sub: app.candidateEmail || '—' },
          { label: tableLabels.job, value: app.jobTitle, sub: app.jobCode || '—' },
          { label: tableLabels.source, value: app.sourceLabel, color: app.sourceColor, sub: CTV_SOURCE_TYPES.has(app.sourceType) && app.ctvName ? `CTV: ${app.ctvName}` : null },
        ].map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3">
            <span className="shrink-0 text-xs text-slate-400 sm:text-sm">{row.label}</span>
            <div className="min-w-0 text-right">
              <div
                className="text-xs font-semibold text-slate-800 sm:text-sm"
                style={row.color ? { color: row.color } : undefined}
              >
                {row.value || '—'}
              </div>
              {row.sub ? <div className="text-xs text-slate-400">{row.sub}</div> : null}
            </div>
          </div>
        ))}

        <div className="flex items-start justify-between gap-3">
          <span className="shrink-0 text-xs text-slate-400 sm:text-sm">{tableLabels.status}</span>
          <span
            className="rounded-md px-2 py-0.5 text-xs font-semibold"
            style={{ color: stageStyle.color, background: stageStyle.bg }}
          >
            {app.statusLabel}
          </span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <span className="shrink-0 text-xs text-slate-400 sm:text-sm">{tableLabels.appliedAt}</span>
          <div className="text-right">
            <div className="text-xs font-medium text-slate-700 sm:text-sm">{formatApplicationDateLocalized(app.appliedAt, language)}</div>
            <div className="text-xs text-slate-400">{formatApplicationRelativeTimeLocalized(app.appliedAt, language)}</div>
          </div>
        </div>

        <div className="flex items-start justify-between gap-3">
          <span className="shrink-0 text-xs text-slate-400 sm:text-sm">{tableLabels.interviewDate}</span>
          <div className="text-right">
            <div className="text-xs font-medium text-slate-700 sm:text-sm">{formatApplicationDateTimeLocalized(app.interviewDate, language)}</div>
            {app.interviewDate ? (
              <div className="text-xs text-slate-400">{formatApplicationRelativeTimeLocalized(app.interviewDate, language)}</div>
            ) : null}
          </div>
        </div>

        {showChatBadge && (app.unreadCount > 0) && (
          <div className="flex items-center justify-end gap-1 pt-1">
            <span className="rounded-full bg-rose-500 px-1.5 py-px text-[11px] font-bold text-white sm:text-xs">
              {unreadLabel(app.unreadCount)}
            </span>
            <MessageSquare className="h-3.5 w-3.5 text-[#0077B6]/70" />
          </div>
        )}
      </div>
    </button>
  )
}

function ApplicationsSidebarCharts({ localizedStats, stageData, appCopy }) {
  return (
    <>
      <div className="shrink-0 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-3.5">
        <h2 className="mb-2 text-sm font-bold text-[#0077B6]">{appCopy.sidebar.sourceRatio}</h2>
        <PieChart stats={localizedStats} emptyLabel={appCopy.sidebar.noData} totalLabel={appCopy.sidebar.total} />
      </div>

      <div className="shrink-0 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-3.5">
        <h2 className="mb-2 text-sm font-bold text-[#0077B6]">{appCopy.sidebar.statusBreakdown}</h2>
        <div className="flex flex-col gap-2">
          {stageData.length === 0 ? (
            <div className="text-xs text-slate-400">{appCopy.sidebar.noData}</div>
          ) : stageData.map((stage, i) => (
            <div key={i}>
              <div className="mb-0.5 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500 sm:text-sm">{stage.label}</span>
                <span className="text-xs font-bold tabular-nums text-slate-800 sm:text-sm">{stage.value}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-all" style={{ width: `${stage.width * 100}%`, background: stage.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

const JobApplication = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlNominationId = searchParams.get('nominationId')
  const { language } = useLanguage()
  const copy = useBusinessAppCopy()
  const appCopy = copy.applications

  const sourceOptions = useMemo(() => getApplicationSourceOptions(language), [language])
  const kanbanColumns = useMemo(() => getKanbanColumns(language), [language])
  const stageLabels = useMemo(() => getApplicationStageLabels(language), [language])

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [applications, setApplications] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 })
  const [jobs, setJobs] = useState([])

  const [searchInput, setSearchInput] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [jobFilter, setJobFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [appliedFrom, setAppliedFrom] = useState('')
  const [appliedTo, setAppliedTo] = useState('')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState('table')
  const [statusUpdatingId, setStatusUpdatingId] = useState(null)

  const [selectedApp, setSelectedApp] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const statusOptions = useMemo(() => getJobApplicationStatusOptionsByLanguage(language), [language])
  const portalStatusOptionsFor = useCallback(
    (currentStatus) => getBusinessApplicationPortalStatusOptions(language, currentStatus),
    [language],
  )

  const jobById = useMemo(() => buildJobByIdMap(jobs), [jobs])

  const localizedApplications = useMemo(
    () => localizeApplications(applications, language, jobById),
    [applications, language, jobById],
  )

  const localizedStats = useMemo(
    () => localizeApplicationStats(stats, language),
    [stats, language],
  )

  const localizedSelectedApp = useMemo(
    () => (selectedApp ? localizeApplication(selectedApp, language, jobById) : null),
    [selectedApp, language, jobById],
  )

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(searchInput.trim()), 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [searchDebounced, jobFilter, sourceFilter, statusFilter, appliedFrom, appliedTo])

  const loadJobs = useCallback(async () => {
    try {
      const res = await apiService.getBusinessJobs({ page: 1, limit: 200, status: 1 })
      if (res?.success) {
        setJobs(res.data?.jobs || res.data?.items || [])
      }
    } catch {
      setJobs([])
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const res = await apiService.getBusinessApplicationStats()
      if (res?.success) setStats(res.data?.stats || null)
    } catch {
      setStats(null)
    }
  }, [])

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true)
      const params = {
        page: viewMode === 'kanban' ? 1 : page,
        limit: viewMode === 'kanban' ? 100 : 20,
        tab: LIST_TAB,
        sortBy: 'appliedAt',
        sortOrder: 'DESC',
      }
      if (searchDebounced) params.search = searchDebounced
      if (jobFilter) params.jobId = jobFilter
      if (sourceFilter) params.sourceType = sourceFilter
      if (statusFilter) params.status = statusFilter
      if (appliedFrom) params.appliedFrom = appliedFrom
      if (appliedTo) params.appliedTo = appliedTo

      const res = await apiService.getBusinessApplications(params)
      if (res?.success) {
        setApplications(res.data?.applications || [])
        setPagination(res.data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 })
      } else {
        setApplications([])
      }
    } catch {
      setApplications([])
    } finally {
      setLoading(false)
    }
  }, [page, searchDebounced, jobFilter, sourceFilter, statusFilter, appliedFrom, appliedTo, viewMode])

  const handleApplicationStatusChange = useCallback(async (app, newStatus) => {
    setStatusUpdatingId(app.id)
    try {
      const result = await changeBusinessApplicationStatus(
        apiService,
        app.id,
        newStatus,
        app.status,
        portalStatusOptionsFor(app.status),
      )
      if (result.skipped) return
      if (!result.success) {
        window.alert(result.message || 'Không thể cập nhật trạng thái')
        return
      }
      const patch = result.patch || buildApplicationStatusPatch(
        newStatus,
        portalStatusOptionsFor(app.status),
      )
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, ...patch } : a)))
      setSelectedApp((prev) => (prev?.id === app.id ? { ...prev, ...patch } : prev))
      loadStats()
    } catch (e) {
      window.alert(e?.message || 'Không thể cập nhật trạng thái')
    } finally {
      setStatusUpdatingId(null)
    }
  }, [portalStatusOptionsFor, loadStats])

  useEffect(() => {
    loadJobs()
    loadStats()
  }, [loadJobs, loadStats])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  useEffect(() => {
    if (!urlNominationId) return
    let mounted = true
    const openFromUrl = async () => {
      setDrawerOpen(true)
      try {
        const res = await apiService.getBusinessApplicationById(urlNominationId)
        if (mounted && res?.success && res.data?.application) {
          setSelectedApp(res.data.application)
        }
      } catch {
        // ignore
      }
    }
    openFromUrl()
    return () => { mounted = false }
  }, [urlNominationId])

  const openDrawer = (app) => {
    setSelectedApp(app)
    setDrawerOpen(true)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('nominationId', String(app.id))
      return next
    }, { replace: true })
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelectedApp(null)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('nominationId')
      return next
    }, { replace: true })
  }

  const handleStatusUpdated = useCallback(() => {
    loadApplications()
    loadStats()
  }, [loadApplications, loadStats])

  const statCards = useMemo(() => {
    const processing = sumStatusCategories(stats, ['processing', 'waiting'])
    const interview = sumStatusCategories(stats, ['interview'])
    const success = sumStatusCategories(stats, ['success'])
    return [
      { label: appCopy.stats.total, value: stats?.total ?? 0, accent: true },
      { label: appCopy.stats.processing, value: processing },
      { label: appCopy.stats.interview, value: interview },
      { label: appCopy.stats.success, value: success },
    ]
  }, [stats, appCopy.stats])

  const stageData = useMemo(() => {
    const cats = stats?.byStatusCategory || []
    const max = Math.max(...cats.map((c) => c.value), 1)
    const labels = stageLabels
    const colors = {
      processing: '#ea580c',
      interview: '#4338ca',
      waiting: '#0891b2',
      success: '#10b981',
      rejected: '#b45309',
      cancelled: '#64748b',
    }
    return cats.map((c) => ({
      label: labels[c.category] || c.category,
      value: c.value,
      color: colors[c.category] || '#94a3b8',
      width: c.value / max,
    }))
  }, [stats, stageLabels])

  const pageStart = pagination.total ? (pagination.page - 1) * pagination.limit + 1 : 0
  const pageEnd = Math.min(pagination.page * pagination.limit, pagination.total)

  const sidebarCharts = useMemo(() => (
    <ApplicationsSidebarCharts
      localizedStats={localizedStats}
      stageData={stageData}
      appCopy={appCopy}
    />
  ), [localizedStats, stageData, appCopy])

  return (
    <>
      <style>{scrollbarHideStyle}</style>
      <div
        className="business-homepage-shell flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f6f8]"
        style={{ fontFamily: PAGE_FONT }}
      >
        <div className="business-homepage-ui flex h-full min-h-0 flex-1 flex-col p-2.5 sm:p-3">
          <div className="mb-2 shrink-0 sm:mb-2.5">
            <nav aria-label="Breadcrumb" className="text-xs text-slate-500 sm:text-sm">
              <button
                type="button"
                onClick={() => navigate('/business')}
                className="transition hover:text-[#0077B6]"
              >
                {appCopy.breadcrumb.home}
              </button>
              <span className="mx-1.5 text-slate-400">&gt;</span>
              <span className="font-medium text-slate-700">{appCopy.breadcrumb.current}</span>
            </nav>
          </div>

          <BusinessQuickActionsPageLayout
            onNavigate={navigate}
            showSidebar={!drawerOpen}
            sidebarExtraTop={sidebarCharts}
            sidebarSize="wide"
            showMobileFab={!drawerOpen}
            className="min-h-0 flex-1"
          >
              <div className="flex min-h-0 flex-1 flex-col gap-2.5 sm:gap-3">
              <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
                {statCards.map((s, i) => (
                  <StatCard key={i} {...s} />
                ))}
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2.5 sm:px-3.5">
                  <div className="flex min-w-[140px] flex-1 items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 ring-1 ring-slate-100 sm:py-2">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder={appCopy.filters.searchPlaceholder}
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="bg-transparent outline-none w-full text-xs text-slate-700 placeholder:text-slate-400 sm:text-sm"
                    />
                  </div>
                  <select
                    value={jobFilter}
                    onChange={(e) => setJobFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-600 outline-none focus:border-[#0077B6]/50 focus:ring-1 focus:ring-[#0077B6]/30 sm:w-auto sm:max-w-[180px] sm:text-sm"
                  >
                    <option value="">{appCopy.filters.allJobs}</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>{j.jobCode || getLocalizedJobTitle(j, language)}</option>
                    ))}
                  </select>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="w-[calc(50%-4px)] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-600 outline-none focus:ring-1 focus:ring-[#0077B6]/30 sm:w-auto sm:text-sm"
                  >
                    {sourceOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-[calc(50%-4px)] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-600 outline-none focus:ring-1 focus:ring-[#0077B6]/30 sm:w-auto sm:text-sm"
                  >
                    <option value="">{appCopy.filters.allStatus}</option>
                    {statusOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={appliedFrom}
                    onChange={(e) => setAppliedFrom(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-600 sm:text-sm"
                    title={appCopy.filters.appliedFrom}
                    aria-label={appCopy.filters.appliedFrom}
                  />
                  <input
                    type="date"
                    value={appliedTo}
                    onChange={(e) => setAppliedTo(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-600 sm:text-sm"
                    title={appCopy.filters.appliedTo}
                    aria-label={appCopy.filters.appliedTo}
                  />
                  <div className="flex rounded-lg border border-slate-200 p-0.5">
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`rounded-md p-1.5 ${viewMode === 'table' ? 'bg-[#e8f4fa] text-[#0077B6]' : 'text-slate-400'}`}
                      title={appCopy.view.list}
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('kanban')}
                      className={`rounded-md p-1.5 ${viewMode === 'kanban' ? 'bg-[#e8f4fa] text-[#0077B6]' : 'text-slate-400'}`}
                      title={appCopy.view.kanban}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0077B6]" />
                    <span className="text-xs sm:text-sm">{appCopy.loading}</span>
                  </div>
                ) : viewMode === 'kanban' ? (
                  localizedApplications.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">{appCopy.empty}</div>
                  ) : (
                    <ApplicationsKanban
                      applications={localizedApplications}
                      onOpen={openDrawer}
                      onStatusChange={handleApplicationStatusChange}
                      updatingId={statusUpdatingId}
                      kanbanColumns={kanbanColumns}
                      updatingLabel={appCopy.kanbanUpdating}
                    />
                  )
                ) : (
                  <>
                    <div className="min-h-0 flex-1 overflow-auto scrollbar-hide lg:hidden">
                      {localizedApplications.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400">{appCopy.empty}</div>
                      ) : localizedApplications.map((app) => (
                        <ApplicationMobileCard
                          key={app.id}
                          app={app}
                          isSelected={selectedApp?.id === app.id}
                          onOpen={openDrawer}
                          tableLabels={appCopy.table}
                          language={language}
                          unreadLabel={appCopy.unreadMessages}
                        />
                      ))}
                    </div>

                    <div className="hidden min-h-0 flex-1 overflow-auto scrollbar-hide lg:block">
                    <table className="w-full min-w-[720px] text-left text-xs border-collapse table-fixed sm:text-sm">
                      <colgroup>
                        <col style={{ width: '26%' }} />
                        <col style={{ width: '24%' }} />
                        <col style={{ width: '11%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '11%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '4%' }} />
                      </colgroup>
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100 bg-slate-50/80 sm:text-xs">
                          {[appCopy.table.candidate, appCopy.table.job, appCopy.table.source, appCopy.table.status, appCopy.table.appliedAt, appCopy.table.interviewDate, ''].map((h, i) => (
                            <th
                              key={i}
                              className={`font-semibold py-2.5 ${i === 0 ? 'pl-3 pr-4' : i === 1 ? 'pl-2 pr-3' : i === 6 ? 'px-2 text-right' : 'px-3'} ${i === 6 ? 'text-right' : 'text-left'}`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {localizedApplications.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                              {appCopy.empty}
                            </td>
                          </tr>
                        ) : localizedApplications.map((app) => {
                          const isSelected = selectedApp?.id === app.id
                          const showChatBadge = !isApplicationProfileOnly(app)
                          return (
                            <tr
                              key={app.id}
                              className={`border-t border-slate-100 cursor-pointer transition-colors hover:bg-slate-50/80 ${
                                isSelected ? 'bg-[#e8f4fa]/90' : ''
                              }`}
                              onClick={() => openDrawer(app)}
                            >
                              <td className="max-w-0 py-2.5 pl-3 pr-4">
                                <div className="truncate font-semibold text-slate-800" title={app.candidateName}>
                                  {app.candidateName}
                                </div>
                                <div className="truncate text-xs text-slate-400" title={app.candidateEmail || undefined}>
                                  {app.candidateEmail || '—'}
                                </div>
                              </td>
                              <td className="max-w-0 py-2.5 pl-2 pr-3">
                                <div className="truncate font-semibold text-slate-800" title={app.jobTitle}>
                                  {app.jobTitle}
                                </div>
                                <div className="truncate text-xs text-slate-400" title={app.jobCode || undefined}>
                                  {app.jobCode || '—'}
                                </div>
                              </td>
                              <td className="px-3 py-2.5">
                                <ApplicationSourceCell app={app} />
                              </td>
                              <td className="max-w-0 px-3 py-2.5">
                                <BusinessApplicationStatusSelect
                                  status={app.status}
                                  statusCategory={app.statusCategory}
                                  statusLabel={app.statusLabel}
                                  statusOptions={portalStatusOptionsFor(app.status)}
                                  onChange={(newStatus) => handleApplicationStatusChange(app, newStatus)}
                                  updating={statusUpdatingId === app.id}
                                />
                              </td>
                              <td className="px-3 py-2.5 text-slate-500">
                                {formatApplicationDateLocalized(app.appliedAt, language)}
                                <div className="text-xs text-slate-400">{formatApplicationRelativeTimeLocalized(app.appliedAt, language)}</div>
                              </td>
                              <td className="px-3 py-2.5 text-slate-500">
                                {formatApplicationDateTimeLocalized(app.interviewDate, language)}
                                {app.interviewDate ? (
                                  <div className="text-xs text-slate-400">{formatApplicationRelativeTimeLocalized(app.interviewDate, language)}</div>
                                ) : null}
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {showChatBadge && app.unreadCount > 0 && (
                                    <span className="text-[11px] font-bold text-white bg-rose-500 rounded-full px-1.5 py-px min-w-[18px] text-center sm:text-xs">
                                      {app.unreadCount}
                                    </span>
                                  )}
                                  {showChatBadge ? (
                                    <MessageSquare className="w-3.5 h-3.5 text-[#0077B6]/70" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    </div>
                  </>
                )}

                {!loading && viewMode === 'table' && pagination.totalPages > 0 && (
                  <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-slate-500 sm:text-sm">
                      {appCopy.pagination.showing(pageStart, pageEnd, pagination.total)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="rounded-lg border border-slate-200 w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-white hover:border-[#0077B6]/30 disabled:opacity-40 transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-semibold text-slate-600 px-1 tabular-nums sm:text-sm">
                        {pagination.page}/{pagination.totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={page >= pagination.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="rounded-lg border border-slate-200 w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-white hover:border-[#0077B6]/30 disabled:opacity-40 transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </div>
          </BusinessQuickActionsPageLayout>
        </div>
      </div>

      <BusinessApplicationDetailDrawer
        open={drawerOpen}
        application={localizedSelectedApp}
        onClose={closeDrawer}
        onStatusUpdated={handleStatusUpdated}
      />
    </>
  )
}

export default JobApplication
