import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Users, TrendingUp, Award, CheckCircle2, GitBranch,
  Search, ChevronRight, ChevronLeft, MoreHorizontal,
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

const scrollbarHideStyle = `
  .app-scrollbar-hide::-webkit-scrollbar { display: none; }
  .app-scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
`

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
      <div style={{ fontSize: 8, color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {paths.map((d, i) => (
          <div key={i} style={{ fontSize: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
            <span style={{ color: '#475569', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.label}
            </span>
            <span style={{ color: '#64748b', fontWeight: 600, flexShrink: 0 }}>
              {d.value} ({d.percent}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="bg-white rounded-xl border border-slate-100 p-2 flex flex-col gap-1.5 min-w-0">
    <div className="flex items-center gap-1.5">
      <div style={{ width: 22, height: 22, borderRadius: 6, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 11, height: 11, color }} />
      </div>
      <span style={{ fontSize: 8, fontWeight: 500, color: '#64748b', flex: 1, lineHeight: 1.3 }}>{label}</span>
    </div>
    <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{value ?? 0}</span>
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
    { icon: Users, label: 'Tổng ứng viên vào JD', value: stats?.total, color: '#3b82f6', bg: '#eff6ff' },
    { icon: TrendingUp, label: 'Tiến cử (WS/CTV, Sàn CTV)', value: stats?.wsCtv, color: '#f59e0b', bg: '#fef3c7' },
    { icon: Award, label: 'Scout Credit', value: stats?.scoutCredit, color: '#f97316', bg: '#fed7aa' },
    { icon: CheckCircle2, label: 'Đã tuyển dụng', value: stats?.hired, color: '#10b981', bg: '#d1fae5' },
    { icon: GitBranch, label: 'Đang xử lý', value: stats?.pipeline, color: '#059669', bg: '#a7f3d0' },
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
      <div className="app-scrollbar-hide" style={{ height: '100%', overflowY: 'auto', background: '#f8fafc', padding: 8 }}>
        <div style={{ maxWidth: 1440, margin: '0 auto' }}>

          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>Quản lý tiến cử</h1>
              <p style={{ fontSize: 9, color: '#64748b', lineHeight: 1.35 }}>
                Theo dõi đơn tiến cử vào JD của doanh nghiệp từ Scout Credit, Sàn CTV và các nguồn khác
              </p>
            </div>
          </div>

          <div className="grid gap-2" style={{ gridTemplateColumns: drawerOpen ? '1fr' : '1fr 250px' }}>
            <div className="flex flex-col gap-2">
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
                {statCards.map((s, i) => (
                  <StatCard key={i} {...s} />
                ))}
              </div>

              <div className="bg-white rounded-xl border border-slate-100 flex flex-col" style={{ minHeight: 480 }}>
                <div className="flex items-center gap-0 border-b border-slate-100 overflow-x-auto" style={{ padding: '0 8px' }}>
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTabLabel(tab)}
                      style={{
                        fontSize: 9,
                        fontWeight: activeTabLabel === tab ? 700 : 500,
                        color: activeTabLabel === tab ? '#3b82f6' : '#64748b',
                        padding: '7px 10px',
                        borderBottom: activeTabLabel === tab ? '2px solid #3b82f6' : '2px solid transparent',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 border-b border-slate-100" style={{ padding: '6px 8px', flexWrap: 'wrap' }}>
                  <div className="flex items-center gap-1 bg-slate-50 rounded-lg flex-1" style={{ padding: '4px 6px', minWidth: 120 }}>
                    <Search style={{ width: 9, height: 9, color: '#94a3b8', flexShrink: 0 }} />
                    <input
                      type="text"
                      placeholder="Tìm ứng viên, JD..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="bg-transparent outline-none w-full"
                      style={{ fontSize: 8, color: '#475569' }}
                    />
                  </div>
                  <select
                    value={jobFilter}
                    onChange={(e) => setJobFilter(e.target.value)}
                    className="border border-slate-200 rounded-lg text-slate-600 bg-white"
                    style={{ fontSize: 8, padding: '4px 6px', maxWidth: 140 }}
                  >
                    <option value="">JD: Tất cả</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>{j.jobCode || j.title}</option>
                    ))}
                  </select>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="border border-slate-200 rounded-lg text-slate-600 bg-white"
                    style={{ fontSize: 8, padding: '4px 6px' }}
                  >
                    {SOURCE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-slate-200 rounded-lg text-slate-600 bg-white"
                    style={{ fontSize: 8, padding: '4px 6px' }}
                  >
                    <option value="">Trạng thái: Tất cả</option>
                    {statusOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span style={{ fontSize: 10 }}>Đang tải đơn tiến cử...</span>
                  </div>
                ) : (
                  <div style={{ flex: 1, overflowX: 'auto' }}>
                    <table style={{ width: '100%', textAlign: 'left', fontSize: 8, tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ fontSize: 7, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                          {['Ứng viên', 'JD / Vị trí', 'Nguồn', 'Tiến cử bởi', 'Trạng thái', 'Ngày tiến cử', ''].map((h, i) => (
                            <th key={i} style={{ fontWeight: 500, padding: '6px 8px', textAlign: i === 6 ? 'right' : 'left' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {applications.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                              Chưa có đơn tiến cử phù hợp
                            </td>
                          </tr>
                        ) : applications.map((app) => {
                          const stageStyle = getStatusCategoryStyle(app.statusCategory)
                          const isSelected = selectedApp?.id === app.id
                          return (
                            <tr
                              key={app.id}
                              style={{
                                borderTop: '1px solid #e2e8f0',
                                cursor: 'pointer',
                                background: isSelected ? '#f0f7ff' : 'transparent',
                              }}
                              onClick={() => openDrawer(app)}
                            >
                              <td style={{ padding: '6px 8px' }}>
                                <div style={{ fontSize: 8, fontWeight: 600, color: '#1e293b' }}>{app.candidateName}</div>
                                <div style={{ fontSize: 7, color: '#94a3b8' }}>{app.candidateEmail || '—'}</div>
                              </td>
                              <td style={{ padding: '6px 6px' }}>
                                <div style={{ fontSize: 8, fontWeight: 600, color: '#1e293b' }}>{app.jobTitle}</div>
                                <div style={{ fontSize: 7, color: '#94a3b8' }}>{app.jobCode || '—'}</div>
                              </td>
                              <td style={{ padding: '6px 6px' }}>
                                <span style={{ fontSize: 7, fontWeight: 600, color: app.sourceColor }}>
                                  ● {app.sourceLabel}
                                </span>
                              </td>
                              <td style={{ padding: '6px 6px', fontSize: 7, color: '#475569' }}>{app.nominatedBy}</td>
                              <td style={{ padding: '6px 6px' }}>
                                <span style={{ fontSize: 7, fontWeight: 600, color: stageStyle.color, background: stageStyle.bg, borderRadius: 4, padding: '2px 6px' }}>
                                  {app.statusLabel}
                                </span>
                              </td>
                              <td style={{ padding: '6px 6px', fontSize: 7, color: '#64748b' }}>
                                {formatApplicationDate(app.appliedAt)}
                                <div style={{ color: '#94a3b8' }}>{formatRelativeTime(app.appliedAt)}</div>
                              </td>
                              <td style={{ padding: '6px 6px', textAlign: 'right' }}>
                                <div className="flex items-center justify-end gap-1">
                                  {app.unreadCount > 0 && (
                                    <span style={{ fontSize: 7, fontWeight: 700, color: '#fff', background: '#ef4444', borderRadius: 10, padding: '1px 5px' }}>
                                      {app.unreadCount}
                                    </span>
                                  )}
                                  <MessageSquare style={{ width: 10, height: 10, color: '#94a3b8' }} />
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
                  <div className="flex items-center justify-between border-t border-slate-100" style={{ padding: '6px 8px', background: '#f8fafc' }}>
                    <span style={{ fontSize: 8, color: '#94a3b8' }}>
                      Hiển thị {pageStart} - {pageEnd} trong {pagination.total} tiến cử
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40"
                        style={{ width: 20, height: 20 }}
                      >
                        <ChevronLeft style={{ width: 9, height: 9 }} />
                      </button>
                      <span style={{ fontSize: 8, fontWeight: 600, color: '#475569', padding: '0 4px' }}>
                        {pagination.page}/{pagination.totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={page >= pagination.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40"
                        style={{ width: 20, height: 20 }}
                      >
                        <ChevronRight style={{ width: 9, height: 9 }} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!drawerOpen && (
              <div className="flex max-h-auto flex-col gap-2 app-scrollbar-hide" style={{ overflowY: 'auto' }}>
                <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '8px 10px' }}>
                  <h2 style={{ fontSize: 9, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Tỷ lệ nguồn ứng viên</h2>
                  <PieChart stats={stats} />
                </div>

                <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '8px 10px' }}>
                  <h2 style={{ fontSize: 9, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Trạng thái tiến cử</h2>
                  <div className="flex flex-col" style={{ gap: 6 }}>
                    {stageData.length === 0 ? (
                      <div style={{ fontSize: 8, color: '#94a3b8' }}>Chưa có dữ liệu</div>
                    ) : stageData.map((stage, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between gap-2" style={{ marginBottom: 3 }}>
                          <span style={{ fontSize: 8, fontWeight: 500, color: '#64748b' }}>{stage.label}</span>
                          <span style={{ fontSize: 8, fontWeight: 700, color: '#1e293b' }}>{stage.value}</span>
                        </div>
                        <div style={{ width: '100%', height: 5, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' }}>
                          <div style={{ width: `${stage.width * 100}%`, height: '100%', background: stage.color, borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '8px 10px' }}>
                  <h2 style={{ fontSize: 9, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Hoạt động gần đây</h2>
                  <div className="flex flex-col" style={{ gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                    {recentNotifications.length === 0 ? (
                      <div style={{ fontSize: 8, color: '#94a3b8' }}>Chưa có hoạt động</div>
                    ) : recentNotifications.map((n) => (
                      <div key={n.id} className="flex items-start gap-1.5">
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Bell style={{ width: 9, height: 9, color: '#3b82f6' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 8, fontWeight: 600, color: '#334155', lineHeight: 1.35 }}>{n.title}</div>
                          <div style={{ fontSize: 7, color: '#64748b', marginTop: 1, lineClamp: 2 }}>{n.content}</div>
                          <div style={{ fontSize: 7, color: '#94a3b8', marginTop: 1 }}>{formatApplicationDate(n.createdAt)}</div>
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

      {drawerOpen && selectedApp && (
        <div
          className="fixed inset-0 z-50 flex"
          style={{ background: 'rgba(15,23,42,0.35)' }}
          onClick={closeDrawer}
        >
          <div
            className="ml-auto h-full bg-white shadow-2xl flex flex-col"
            style={{ width: 'min(100vw, 560px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 flex-shrink-0">
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{selectedApp.candidateName}</div>
                <div style={{ fontSize: 9, color: '#64748b' }}>
                  {selectedApp.jobTitle} ({selectedApp.jobCode || '—'}) · {selectedApp.sourceLabel}
                </div>
              </div>
              <button type="button" onClick={closeDrawer} className="p-1 rounded hover:bg-slate-100">
                <X style={{ width: 16, height: 16, color: '#64748b' }} />
              </button>
            </div>

            {selectedApp.canViewFullProfile && (
              <div className="flex border-b border-slate-200 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setDrawerTab('profile')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold"
                  style={{
                    color: drawerTab === 'profile' ? '#5b21b6' : '#64748b',
                    borderBottom: drawerTab === 'profile' ? '2px solid #7c3aed' : '2px solid transparent',
                  }}
                >
                  <User style={{ width: 12, height: 12 }} /> Hồ sơ ứng viên
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab('chat')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold"
                  style={{
                    color: drawerTab === 'chat' ? '#5b21b6' : '#64748b',
                    borderBottom: drawerTab === 'chat' ? '2px solid #7c3aed' : '2px solid transparent',
                  }}
                >
                  <MessageSquare style={{ width: 12, height: 12 }} /> Chat 3 bên
                </button>
              </div>
            )}

            {drawerLoading && (
              <div className="flex items-center gap-2 px-4 py-2 text-[10px] text-slate-500 border-b border-slate-100">
                <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> Đang tải hồ sơ...
              </div>
            )}

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {drawerTab === 'profile' && selectedApp.canViewFullProfile ? (
                <div className="flex-1 overflow-y-auto p-3">
                  {drawerLoading && !selectedApp.candidateProfile ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-[10px] text-slate-500">
                      <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> Đang tải hồ sơ...
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
                      accessLabelColor="#5b21b6"
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
