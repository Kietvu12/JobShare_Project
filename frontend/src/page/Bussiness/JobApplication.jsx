import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Users, TrendingUp, Award, CheckCircle2, GitBranch,
  Search, ChevronRight, ChevronLeft,
  MessageSquare, Loader2, Bell, LayoutGrid, List,
} from 'lucide-react'
import apiService from '../../services/api'
import BusinessApplicationDetailDrawer from '../../component/Bussiness/BusinessApplicationDetailDrawer'
import {
  getStatusCategoryStyle,
} from '../../utils/businessApplicationSource'
import { getJobApplicationStatusOptionsByLanguage } from '../../utils/jobApplicationStatus'
import {
  buildJobByIdMap,
  formatApplicationDateLocalized,
  formatApplicationRelativeTimeLocalized,
  localizeApplication,
  localizeApplications,
  localizeApplicationStats,
} from '../../utils/businessApplicationDisplay'
import { localizeNotification } from '../../utils/notificationI18n'
import useBusinessAppCopy from '../../hooks/useBusinessAppCopy'
import { useLanguage } from '../../context/LanguageContext'
import {
  getApplicationSourceOptions,
  getApplicationStageLabels,
  getApplicationTabs,
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
  .app-scrollbar-hide::-webkit-scrollbar { display: none; }
  .app-scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
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

const TAB_API_MAP = {
  all: 'all',
  ws_ctv: 'ws_ctv',
  scout_credit: 'scout_credit',
  hired: 'hired',
  rejected: 'rejected',
  other: 'other',
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
      <div className="text-[11px] font-semibold text-slate-800 truncate">{app.candidateName}</div>
      <div className="mt-0.5 text-[10px] text-slate-500 truncate">{app.jobTitle}</div>
      <div className="mt-2 flex items-center justify-between gap-1">
        <span className="text-[9px] font-semibold truncate" style={{ color: app.sourceColor }}>
          {app.sourceLabel}
        </span>
        <span
          className="shrink-0 rounded px-1 py-0.5 text-[8px] font-semibold"
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
            <span className="text-[10px] font-bold text-slate-700">{col.label}</span>
            <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-500 tabular-nums">
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
              <div className="text-center text-[9px] text-slate-400 py-1">{updatingLabel}</div>
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
      <div className="text-[10px] text-slate-400 text-center py-3">
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
          <div key={i} className="text-[10px] flex items-center gap-1.5">
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

const StatCard = ({ icon: Icon, label, value, color, bg, accent }) => (
  <div
    className={`rounded-xl border p-2.5 flex flex-col gap-2 min-w-[132px] shrink-0 shadow-sm sm:min-w-0 ${
      accent ? 'border-[#cce5f0]/80 bg-[#e8f4fa]' : 'bg-white border-slate-200/90'
    }`}
  >
    <div className="flex items-center gap-2">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: accent ? 'rgba(0,119,182,0.12)' : bg }}
      >
        <Icon className="w-3 h-3" style={{ color: accent ? BRAND : color }} />
      </div>
      <span className="text-[10px] font-medium text-slate-500 flex-1 leading-snug">{label}</span>
    </div>
    <span className="text-lg font-bold text-slate-800 tabular-nums">{value ?? 0}</span>
  </div>
)

function ApplicationMobileCard({ app, isSelected, onOpen, tableLabels, language, unreadLabel }) {
  const stageStyle = getStatusCategoryStyle(app.statusCategory)
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
          { label: tableLabels.source, value: app.sourceLabel, color: app.sourceColor },
          { label: tableLabels.nominatedBy, value: app.nominatedBy || '—' },
        ].map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3">
            <span className="shrink-0 text-[11px] text-slate-400">{row.label}</span>
            <div className="min-w-0 text-right">
              <div
                className="text-[11px] font-semibold text-slate-800"
                style={row.color ? { color: row.color } : undefined}
              >
                {row.value || '—'}
              </div>
              {row.sub ? <div className="text-[10px] text-slate-400">{row.sub}</div> : null}
            </div>
          </div>
        ))}

        <div className="flex items-start justify-between gap-3">
          <span className="shrink-0 text-[11px] text-slate-400">{tableLabels.status}</span>
          <span
            className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
            style={{ color: stageStyle.color, background: stageStyle.bg }}
          >
            {app.statusLabel}
          </span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <span className="shrink-0 text-[11px] text-slate-400">{tableLabels.appliedAt}</span>
          <div className="text-right">
            <div className="text-[11px] font-medium text-slate-700">{formatApplicationDateLocalized(app.appliedAt, language)}</div>
            <div className="text-[10px] text-slate-400">{formatApplicationRelativeTimeLocalized(app.appliedAt, language)}</div>
          </div>
        </div>

        {(app.unreadCount > 0) && (
          <div className="flex items-center justify-end gap-1 pt-1">
            <span className="rounded-full bg-rose-500 px-1.5 py-px text-[9px] font-bold text-white">
              {unreadLabel(app.unreadCount)}
            </span>
            <MessageSquare className="h-3.5 w-3.5 text-[#0077B6]/70" />
          </div>
        )}
      </div>
    </button>
  )
}

const JobApplication = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlNominationId = searchParams.get('nominationId')
  const { language } = useLanguage()
  const copy = useBusinessAppCopy()
  const appCopy = copy.applications

  const applicationTabs = useMemo(() => getApplicationTabs(language), [language])
  const sourceOptions = useMemo(() => getApplicationSourceOptions(language), [language])
  const kanbanColumns = useMemo(() => getKanbanColumns(language), [language])
  const stageLabels = useMemo(() => getApplicationStageLabels(language), [language])

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [applications, setApplications] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 })
  const [jobs, setJobs] = useState([])
  const [recentNotifications, setRecentNotifications] = useState([])

  const [activeTabKey, setActiveTabKey] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [jobFilter, setJobFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState('table')
  const [kanbanUpdatingId, setKanbanUpdatingId] = useState(null)

  const [selectedApp, setSelectedApp] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const statusOptions = useMemo(() => getJobApplicationStatusOptionsByLanguage(language), [language])

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
  }, [activeTabKey, searchDebounced, jobFilter, sourceFilter, statusFilter])

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

  const loadNotifications = useCallback(async () => {
    try {
      const res = await apiService.getBusinessNotifications({ page: 1, limit: 8 })
      const rows = res?.data?.notifications ?? res?.notifications ?? []
      setRecentNotifications(Array.isArray(rows) ? rows : [])
    } catch {
      setRecentNotifications([])
    }
  }, [])

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true)
      const tab = TAB_API_MAP[activeTabKey] || 'all'
      const params = {
        page: viewMode === 'kanban' ? 1 : page,
        limit: viewMode === 'kanban' ? 100 : 20,
        tab,
        sortBy: 'appliedAt',
        sortOrder: 'DESC',
      }
      if (searchDebounced) params.search = searchDebounced
      if (jobFilter) params.jobId = jobFilter
      if (sourceFilter) params.sourceType = sourceFilter
      if (statusFilter) params.status = statusFilter

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
  }, [activeTabKey, page, searchDebounced, jobFilter, sourceFilter, statusFilter, viewMode])

  const handleKanbanStatusChange = useCallback(async (app, newStatus) => {
    setKanbanUpdatingId(app.id)
    try {
      const res = await apiService.updateBusinessApplicationStatus(app.id, { status: newStatus })
      if (res?.success) {
        setApplications((prev) => prev.map((a) => (
          a.id === app.id
            ? { ...a, status: newStatus, statusLabel: statusOptions.find((o) => Number(o.value) === newStatus)?.label || a.statusLabel }
            : a
        )))
        loadStats()
      }
    } catch {
      // ignore
    } finally {
      setKanbanUpdatingId(null)
    }
  }, [statusOptions, loadStats])

  useEffect(() => {
    loadJobs()
    loadStats()
    loadNotifications()
  }, [loadJobs, loadStats, loadNotifications])

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

  const statCards = useMemo(() => [
    { icon: Users, label: appCopy.stats.total, value: stats?.total, color: BRAND, bg: BRAND_LIGHT, accent: true },
    { icon: TrendingUp, label: appCopy.stats.wsCtv, value: stats?.wsCtv, color: '#d97706', bg: '#fef3c7' },
    { icon: Award, label: appCopy.stats.scoutCredit, value: stats?.scoutCredit, color: '#ea580c', bg: '#ffedd5' },
    { icon: CheckCircle2, label: appCopy.stats.hired, value: stats?.hired, color: '#059669', bg: '#d1fae5' },
    { icon: GitBranch, label: appCopy.stats.pipeline, value: stats?.pipeline, color: '#0d9488', bg: '#ccfbf1' },
  ], [stats, appCopy.stats])

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

  return (
    <>
      <style>{scrollbarHideStyle}</style>
      <div
        className="business-homepage-shell flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f6f8]"
        style={{ fontFamily: PAGE_FONT }}
      >
        <div className="business-homepage-ui flex min-h-0 flex-1 flex-col p-0 lg:p-3">
          <div className="mb-0 hidden shrink-0 items-start justify-between gap-3 px-3 pt-3 lg:mb-3 lg:flex lg:px-0 lg:pt-0">
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-800 mb-0.5">{appCopy.title}</h1>
              <p className="text-[10px] sm:text-xs text-slate-500 leading-snug max-w-xl">
                {appCopy.subtitle}
              </p>
            </div>
          </div>

          <div
            className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:gap-2.5"
            style={{ gridTemplateColumns: drawerOpen ? '1fr' : undefined }}
          >
            <div
              className={`flex min-h-0 flex-col gap-0 overflow-hidden lg:gap-2.5 ${
                drawerOpen ? '' : 'lg:grid lg:grid-cols-[1fr_260px]'
              }`}
            >
              <div className="flex min-h-0 flex-col gap-0 overflow-hidden lg:gap-2.5">
              <div className="grid shrink-0 gap-2 grid-cols-2 overflow-x-auto px-3 py-2 app-scrollbar-hide sm:grid-cols-3 lg:grid-cols-5 lg:overflow-visible lg:px-0 lg:py-0">
                {statCards.map((s, i) => (
                  <StatCard key={i} {...s} />
                ))}
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border-y border-slate-200/90 bg-white shadow-sm lg:rounded-xl lg:border">
                <div className="flex items-center gap-0 overflow-x-auto border-b border-slate-100 px-2 scrollbar-hide">
                  {applicationTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTabKey(tab.key)}
                      className={`text-[10px] sm:text-xs font-semibold px-3 py-2.5 whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                        activeTabKey === tab.key
                          ? 'border-[#0077B6] text-[#0077B6]'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2 lg:px-2">
                  <div className="flex min-w-[140px] flex-1 items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 ring-1 ring-slate-100 lg:py-1.5">
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder={appCopy.filters.searchPlaceholder}
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="bg-transparent outline-none w-full text-[10px] sm:text-xs text-slate-700 placeholder:text-slate-400"
                    />
                  </div>
                  <select
                    value={jobFilter}
                    onChange={(e) => setJobFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11px] text-slate-600 outline-none focus:border-[#0077B6]/50 focus:ring-1 focus:ring-[#0077B6]/30 sm:w-auto sm:max-w-[160px] sm:py-1.5 sm:text-[10px] lg:text-xs"
                  >
                    <option value="">{appCopy.filters.allJobs}</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>{j.jobCode || getLocalizedJobTitle(j, language)}</option>
                    ))}
                  </select>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="w-[calc(50%-4px)] rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11px] text-slate-600 outline-none focus:ring-1 focus:ring-[#0077B6]/30 sm:w-auto sm:py-1.5 sm:text-[10px] lg:text-xs"
                  >
                    {sourceOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-[calc(50%-4px)] rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11px] text-slate-600 outline-none focus:ring-1 focus:ring-[#0077B6]/30 sm:w-auto sm:py-1.5 sm:text-[10px] lg:text-xs"
                  >
                    <option value="">{appCopy.filters.allStatus}</option>
                    {statusOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
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
                    <span className="text-xs">{appCopy.loading}</span>
                  </div>
                ) : viewMode === 'kanban' ? (
                  localizedApplications.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">{appCopy.empty}</div>
                  ) : (
                    <ApplicationsKanban
                      applications={localizedApplications}
                      onOpen={openDrawer}
                      onStatusChange={handleKanbanStatusChange}
                      updatingId={kanbanUpdatingId}
                      kanbanColumns={kanbanColumns}
                      updatingLabel={appCopy.kanbanUpdating}
                    />
                  )
                ) : (
                  <>
                    <div className="min-h-0 flex-1 overflow-auto business-homepage-scroll lg:hidden">
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

                    <div className="hidden min-h-0 flex-1 overflow-auto business-homepage-scroll lg:block">
                    <table className="w-full text-left text-[10px] sm:text-xs border-collapse table-fixed">
                      <thead>
                        <tr className="text-[9px] sm:text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-100 bg-slate-50/80">
                          {[appCopy.table.candidate, appCopy.table.job, appCopy.table.source, appCopy.table.nominatedBy, appCopy.table.status, appCopy.table.appliedAt, ''].map((h, i) => (
                            <th key={i} className={`font-semibold px-2.5 py-2 ${i === 6 ? 'text-right' : 'text-left'}`}>{h}</th>
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
                          const stageStyle = getStatusCategoryStyle(app.statusCategory)
                          const isSelected = selectedApp?.id === app.id
                          return (
                            <tr
                              key={app.id}
                              className={`border-t border-slate-100 cursor-pointer transition-colors hover:bg-slate-50/80 ${
                                isSelected ? 'bg-[#e8f4fa]/90' : ''
                              }`}
                              onClick={() => openDrawer(app)}
                            >
                              <td className="px-2.5 py-2">
                                <div className="font-semibold text-slate-800">{app.candidateName}</div>
                                <div className="text-[10px] text-slate-400">{app.candidateEmail || '—'}</div>
                              </td>
                              <td className="px-2 py-2">
                                <div className="font-semibold text-slate-800 truncate">{app.jobTitle}</div>
                                <div className="text-[10px] text-slate-400">{app.jobCode || '—'}</div>
                              </td>
                              <td className="px-2 py-2">
                                <span className="text-[10px] font-semibold" style={{ color: app.sourceColor }}>
                                  ● {app.sourceLabel}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-slate-600">{app.nominatedBy}</td>
                              <td className="px-2 py-2">
                                <span
                                  className="text-[10px] font-semibold rounded-md px-1.5 py-0.5 inline-block"
                                  style={{ color: stageStyle.color, background: stageStyle.bg }}
                                >
                                  {app.statusLabel}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-slate-500">
                                {formatApplicationDateLocalized(app.appliedAt, language)}
                                <div className="text-[10px] text-slate-400">{formatApplicationRelativeTimeLocalized(app.appliedAt, language)}</div>
                              </td>
                              <td className="px-2 py-2 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {app.unreadCount > 0 && (
                                    <span className="text-[9px] font-bold text-white bg-rose-500 rounded-full px-1.5 py-px min-w-[18px] text-center">
                                      {app.unreadCount}
                                    </span>
                                  )}
                                  <MessageSquare className="w-3.5 h-3.5 text-[#0077B6]/70" />
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
                    <span className="text-[10px] text-slate-500">
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
                      <span className="text-[10px] font-semibold text-slate-600 px-1 tabular-nums">
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

            {!drawerOpen && (
              <div className="hidden min-h-0 flex-col gap-2.5 overflow-hidden lg:flex">
                <div className="shrink-0 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
                  <h2 className="text-xs font-bold text-[#0077B6] mb-2">{appCopy.sidebar.sourceRatio}</h2>
                  <PieChart stats={localizedStats} emptyLabel={appCopy.sidebar.noData} totalLabel={appCopy.sidebar.total} />
                </div>

                <div className="shrink-0 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
                  <h2 className="text-xs font-bold text-[#0077B6] mb-2">{appCopy.sidebar.statusBreakdown}</h2>
                  <div className="flex flex-col gap-2">
                    {stageData.length === 0 ? (
                      <div className="text-[10px] text-slate-400">{appCopy.sidebar.noData}</div>
                    ) : stageData.map((stage, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-medium text-slate-500">{stage.label}</span>
                          <span className="text-[10px] font-bold text-slate-800 tabular-nums">{stage.value}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${stage.width * 100}%`, background: stage.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
                  <h2 className="mb-2 shrink-0 text-xs font-bold text-[#0077B6]">{appCopy.sidebar.recentActivity}</h2>
                  <div className="min-h-0 flex-1 overflow-y-auto business-homepage-scroll">
                    {recentNotifications.length === 0 ? (
                      <div className="text-[10px] text-slate-400">{appCopy.sidebar.noActivity}</div>
                    ) : recentNotifications.map((n) => {
                      const localized = localizeNotification(n, language)
                      return (
                      <div key={n.id} className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#e8f4fa] flex items-center justify-center shrink-0">
                          <Bell className="w-3.5 h-3.5 text-[#0077B6]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-semibold text-slate-700 leading-snug">{localized.title}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{localized.content}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">{formatApplicationDateLocalized(n.createdAt, language)}</div>
                        </div>
                      </div>
                    )})}
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
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
