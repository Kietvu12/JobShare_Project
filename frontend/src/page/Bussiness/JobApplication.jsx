import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Users, TrendingUp, Award, CheckCircle2, GitBranch,
  Search, ChevronRight, ChevronLeft,
  MessageSquare, Loader2, X, Bell, User,
} from 'lucide-react'
import apiService from '../../services/api'
import NominationChat from '../../component/Chat/NominationChat'
import ScoutCandidateProfilePanel from '../../component/Bussiness/ScoutCandidateProfilePanel'
import {
  BUSINESS_APPLICATION_TABS,
  formatApplicationDate,
  formatRelativeTime,
  getStatusCategoryStyle,
} from '../../utils/businessApplicationSource'
import { getJobApplicationStatusOptionsByLanguage } from '../../utils/jobApplicationStatus'

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
  'Tất cả': 'all',
  'Tiến cử (WS/CTV)': 'ws_ctv',
  'Scout Credit': 'scout_credit',
  'Đã tuyển dụng': 'hired',
  'Không phù hợp': 'rejected',
  'Khác': 'other',
}

const SOURCE_OPTIONS = [
  { value: '', label: 'Nguồn: Tất cả' },
  { value: 'ctv_marketplace', label: 'Sàn CTV' },
  { value: 'ctv_nomination', label: 'Tiến cử CTV' },
  { value: 'scout_performance', label: 'Scout Performance' },
  { value: 'scout_credit', label: 'Scout Credit' },
  { value: 'landing', label: 'Branding LP' },
  { value: 'other', label: 'Khác' },
]

function PieChart({ stats }) {
  const slices = stats?.bySource || []
  const total = stats?.total || 0
  if (!total) {
    return (
      <div className="text-[10px] text-slate-400 text-center py-3">
        Chưa có dữ liệu
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
          Tổng
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
    className={`rounded-xl border p-2.5 flex flex-col gap-2 min-w-0 shadow-sm ${
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

const JobApplication = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlNominationId = searchParams.get('nominationId')

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [applications, setApplications] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 })
  const [jobs, setJobs] = useState([])
  const [recentNotifications, setRecentNotifications] = useState([])

  const [activeTabLabel, setActiveTabLabel] = useState('Tất cả')
  const [searchInput, setSearchInput] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [jobFilter, setJobFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const [selectedApp, setSelectedApp] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [drawerTab, setDrawerTab] = useState('chat') // chat | profile

  const tabs = useMemo(() => BUSINESS_APPLICATION_TABS.map((t) => t.label), [])
  const statusOptions = useMemo(() => getJobApplicationStatusOptionsByLanguage('vi'), [])

  const loadApplicationDetail = useCallback(async (appId) => {
    setDrawerLoading(true)
    try {
      const res = await apiService.getBusinessApplicationById(appId)
      if (res?.success && res.data?.application) {
        setSelectedApp(res.data.application)
        if (res.data.application.canViewFullProfile) setDrawerTab('profile')
        else setDrawerTab('chat')
      }
    } catch {
      // keep list row data
    } finally {
      setDrawerLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(searchInput.trim()), 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [activeTabLabel, searchDebounced, jobFilter, sourceFilter, statusFilter])

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
      const tab = TAB_API_MAP[activeTabLabel] || 'all'
      const params = {
        page,
        limit: 20,
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
  }, [activeTabLabel, page, searchDebounced, jobFilter, sourceFilter, statusFilter])

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
      setDrawerLoading(true)
      try {
        const res = await apiService.getBusinessApplicationById(urlNominationId)
        if (mounted && res?.success && res.data?.application) {
          setSelectedApp(res.data.application)
          setDrawerTab(res.data.application.canViewFullProfile ? 'profile' : 'chat')
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setDrawerLoading(false)
      }
    }
    openFromUrl()
    return () => { mounted = false }
  }, [urlNominationId])

  const openDrawer = (app) => {
    setSelectedApp(app)
    setDrawerOpen(true)
    setDrawerTab(app.canViewFullProfile || app.sourceType === 'ctv_marketplace' ? 'profile' : 'chat')
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('nominationId', String(app.id))
      return next
    }, { replace: true })
    loadApplicationDetail(app.id)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelectedApp(null)
    setDrawerTab('chat')
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('nominationId')
      return next
    }, { replace: true })
  }

  const handleStatusUpdated = useCallback(() => {
    if (selectedApp?.id) loadApplicationDetail(selectedApp.id)
    loadApplications()
    loadStats()
  }, [selectedApp?.id, loadApplicationDetail, loadApplications, loadStats])

  const statCards = useMemo(() => [
    { icon: Users, label: 'Tổng ứng viên vào JD', value: stats?.total, color: BRAND, bg: BRAND_LIGHT, accent: true },
    { icon: TrendingUp, label: 'Tiến cử (WS/CTV, Sàn CTV)', value: stats?.wsCtv, color: '#d97706', bg: '#fef3c7' },
    { icon: Award, label: 'Scout Credit', value: stats?.scoutCredit, color: '#ea580c', bg: '#ffedd5' },
    { icon: CheckCircle2, label: 'Đã tuyển dụng', value: stats?.hired, color: '#059669', bg: '#d1fae5' },
    { icon: GitBranch, label: 'Đang xử lý', value: stats?.pipeline, color: '#0d9488', bg: '#ccfbf1' },
  ], [stats])

  const stageData = useMemo(() => {
    const cats = stats?.byStatusCategory || []
    const max = Math.max(...cats.map((c) => c.value), 1)
    const labels = {
      processing: 'Đang xử lý',
      interview: 'Phỏng vấn',
      waiting: 'Chờ kết quả',
      success: 'Thành công',
      rejected: 'Không phù hợp',
      cancelled: 'Đã hủy',
    }
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
  }, [stats])

  const pageStart = pagination.total ? (pagination.page - 1) * pagination.limit + 1 : 0
  const pageEnd = Math.min(pagination.page * pagination.limit, pagination.total)

  return (
    <>
      <style>{scrollbarHideStyle}</style>
      <div
        className="business-homepage-shell min-h-0 xl:h-full xl:overflow-hidden bg-[#f4f6f8]"
        style={{ fontFamily: PAGE_FONT }}
      >
        <div className="business-homepage-ui w-full min-h-0 p-2.5 sm:p-3 xl:h-full xl:flex xl:flex-col">
          <div className="business-homepage-scroll app-scrollbar-hide flex min-h-0 flex-col xl:h-full xl:overflow-y-auto xl:pr-0.5 max-w-[1440px] w-full mx-auto">

          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-800 mb-0.5">Quản lý tiến cử</h1>
              <p className="text-[10px] sm:text-xs text-slate-500 leading-snug max-w-xl">
                Theo dõi đơn tiến cử vào JD của doanh nghiệp từ Scout Credit, Sàn CTV và các nguồn khác
              </p>
            </div>
          </div>

          <div className="grid gap-2.5" style={{ gridTemplateColumns: drawerOpen ? '1fr' : '1fr 260px' }}>
            <div className="flex flex-col gap-2.5">
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {statCards.map((s, i) => (
                  <StatCard key={i} {...s} />
                ))}
              </div>

              <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm flex flex-col min-h-[480px]">
                <div className="flex items-center gap-0 border-b border-slate-100 overflow-x-auto px-2 scrollbar-hide">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTabLabel(tab)}
                      className={`text-[10px] sm:text-xs font-semibold px-3 py-2.5 whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                        activeTabLabel === tab
                          ? 'border-[#0077B6] text-[#0077B6]'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 border-b border-slate-100 px-2 py-2 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg flex-1 min-w-[140px] px-2.5 py-1.5 ring-1 ring-slate-100">
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Tìm ứng viên, JD..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="bg-transparent outline-none w-full text-[10px] sm:text-xs text-slate-700 placeholder:text-slate-400"
                    />
                  </div>
                  <select
                    value={jobFilter}
                    onChange={(e) => setJobFilter(e.target.value)}
                    className="border border-slate-200 rounded-lg text-slate-600 bg-white text-[10px] sm:text-xs px-2 py-1.5 max-w-[160px] focus:ring-1 focus:ring-[#0077B6]/30 focus:border-[#0077B6]/50 outline-none"
                  >
                    <option value="">JD: Tất cả</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>{j.jobCode || j.title}</option>
                    ))}
                  </select>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="border border-slate-200 rounded-lg text-slate-600 bg-white text-[10px] sm:text-xs px-2 py-1.5 focus:ring-1 focus:ring-[#0077B6]/30 outline-none"
                  >
                    {SOURCE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-slate-200 rounded-lg text-slate-600 bg-white text-[10px] sm:text-xs px-2 py-1.5 focus:ring-1 focus:ring-[#0077B6]/30 outline-none"
                  >
                    <option value="">Trạng thái: Tất cả</option>
                    {statusOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0077B6]" />
                    <span className="text-xs">Đang tải đơn tiến cử...</span>
                  </div>
                ) : (
                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left text-[10px] sm:text-xs border-collapse table-fixed">
                      <thead>
                        <tr className="text-[9px] sm:text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-100 bg-slate-50/80">
                          {['Ứng viên', 'JD / Vị trí', 'Nguồn', 'Tiến cử bởi', 'Trạng thái', 'Ngày tiến cử', ''].map((h, i) => (
                            <th key={i} className={`font-semibold px-2.5 py-2 ${i === 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {applications.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                              Chưa có đơn tiến cử phù hợp
                            </td>
                          </tr>
                        ) : applications.map((app) => {
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
                                {formatApplicationDate(app.appliedAt)}
                                <div className="text-[10px] text-slate-400">{formatRelativeTime(app.appliedAt)}</div>
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
                )}

                {!loading && pagination.totalPages > 0 && (
                  <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 bg-slate-50/60">
                    <span className="text-[10px] text-slate-500">
                      Hiển thị {pageStart} - {pageEnd} trong {pagination.total} tiến cử
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
              <div className="flex flex-col gap-2.5 app-scrollbar-hide overflow-y-auto">
                <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-3">
                  <h2 className="text-xs font-bold text-[#0077B6] mb-2">Tỷ lệ nguồn ứng viên</h2>
                  <PieChart stats={stats} />
                </div>

                <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-3">
                  <h2 className="text-xs font-bold text-[#0077B6] mb-2">Trạng thái tiến cử</h2>
                  <div className="flex flex-col gap-2">
                    {stageData.length === 0 ? (
                      <div className="text-[10px] text-slate-400">Chưa có dữ liệu</div>
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

                <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-3">
                  <h2 className="text-xs font-bold text-[#0077B6] mb-2">Hoạt động gần đây</h2>
                  <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto business-homepage-scroll">
                    {recentNotifications.length === 0 ? (
                      <div className="text-[10px] text-slate-400">Chưa có hoạt động</div>
                    ) : recentNotifications.map((n) => (
                      <div key={n.id} className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#e8f4fa] flex items-center justify-center shrink-0">
                          <Bell className="w-3.5 h-3.5 text-[#0077B6]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-semibold text-slate-700 leading-snug">{n.title}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{n.content}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">{formatApplicationDate(n.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {drawerOpen && selectedApp && (
        <div
          className="fixed inset-0 z-50 flex bg-slate-900/40 backdrop-blur-[1px]"
          onClick={closeDrawer}
        >
          <div
            className="ml-auto h-full bg-white shadow-2xl flex flex-col border-l border-slate-200"
            style={{ width: 'min(100vw, 560px)', fontFamily: PAGE_FONT }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 flex-shrink-0 bg-[#f4f6f8]/50">
              <div>
                <div className="text-sm font-bold text-slate-800">{selectedApp.candidateName}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {selectedApp.jobTitle} ({selectedApp.jobCode || '—'}) · {selectedApp.sourceLabel}
                </div>
              </div>
              <button type="button" onClick={closeDrawer} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {selectedApp.canViewFullProfile && (
              <div className="flex border-b border-slate-200 flex-shrink-0 bg-white">
                <button
                  type="button"
                  onClick={() => setDrawerTab('profile')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-colors ${
                    drawerTab === 'profile' ? 'text-[#0077B6] border-b-2 border-[#0077B6]' : 'text-slate-500 border-b-2 border-transparent'
                  }`}
                >
                  <User className="w-3.5 h-3.5" /> Hồ sơ ứng viên
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab('chat')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-colors ${
                    drawerTab === 'chat' ? 'text-[#0077B6] border-b-2 border-[#0077B6]' : 'text-slate-500 border-b-2 border-transparent'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Chat 3 bên
                </button>
              </div>
            )}

            {drawerLoading && (
              <div className="flex items-center gap-2 px-4 py-2 text-[10px] text-slate-500 border-b border-slate-100 bg-[#e8f4fa]/40">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0077B6]" /> Đang tải hồ sơ...
              </div>
            )}

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {drawerTab === 'profile' && selectedApp.canViewFullProfile ? (
                <div className="flex-1 overflow-y-auto p-3 business-homepage-scroll">
                  {drawerLoading && !selectedApp.candidateProfile ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin text-[#0077B6]" /> Đang tải hồ sơ...
                    </div>
                  ) : (
                    <ScoutCandidateProfilePanel
                      candidate={selectedApp.candidateProfile ? {
                        ...selectedApp.candidateProfile,
                        name: selectedApp.candidateProfile.name || selectedApp.candidateName,
                        isUnlocked: true,
                      } : null}
                      treatAsUnlocked
                      accessLabel="Hồ sơ đầy đủ (tiến cử Sàn CTV)"
                      accessLabelColor={BRAND}
                      footerNote={selectedApp.candidateProfile?.scoutStillLocked
                        ? 'Doanh nghiệp xem được hồ sơ nhờ tiến cử Sàn CTV. Trên Scout vẫn hiển thị khóa cho đến khi mở bằng credit.'
                        : null}
                    />
                  )}
                </div>
              ) : (
                <NominationChat
                  jobApplicationId={selectedApp.id}
                  userType="business"
                  currentStatus={selectedApp.status}
                  cvStorageId={selectedApp.cvStorageId || selectedApp.cvId || null}
                  introCandidateName={selectedApp.candidateName || '—'}
                  introJobTitle={selectedApp.jobTitle || '—'}
                  mobileHeaderName={selectedApp.candidateName || 'Chat 3 bên'}
                  mobileHeaderAvatar={(selectedApp.candidateName || '?').charAt(0).toUpperCase()}
                  onStatusUpdated={handleStatusUpdated}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default JobApplication
