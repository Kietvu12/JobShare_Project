import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Briefcase, Loader2, Trash2, MoreHorizontal,
  CheckCircle2, AlertCircle, Shield, MessageSquare,
} from 'lucide-react'
import apiService from '../../services/api'
import JobAiBuilderPanel from '../../component/Bussiness/JobAiBuilderPanel'
import {
  deleteJobBuilderThread,
  listJobBuilderThreads,
} from '../../utils/jobBuilderThreadStorage'

const THREAD_ICON_COLORS = [
  'bg-blue-100 text-blue-600',
  'bg-violet-100 text-violet-600',
  'bg-emerald-100 text-emerald-600',
  'bg-amber-100 text-amber-600',
  'bg-rose-100 text-rose-600',
]

function formatThreadDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const diffDays = Math.max(0, Math.floor((now - d) / (1000 * 60 * 60 * 24)))
  if (diffDays === 0) return 'Hôm nay'
  if (diffDays === 1) return 'Hôm qua'
  if (diffDays < 7) return `${diffDays} ngày trước`
  return d.toLocaleDateString('vi-VN')
}

function getThreadTitle(thread) {
  return thread?.title || 'JD mới'
}

function countJobsByStatus(jobs) {
  const counts = { total: 0, active: 0, paused: 0, closed: 0 }
  ;(jobs || []).forEach((job) => {
    counts.total += 1
    const s = Number(job?.status)
    if (s === 1) counts.active += 1
    else if (s === 0) counts.paused += 1
    else if (s === 2 || s === 3) counts.closed += 1
  })
  return counts
}

const JobManagement = () => {
  const navigate = useNavigate()
  const builderRef = useRef(null)
  const initializedRef = useRef(false)

  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [threads, setThreads] = useState(() => listJobBuilderThreads())
  const [activeThreadId, setActiveThreadId] = useState(null)
  const [savedJobId, setSavedJobId] = useState(null)
  const [statusCounts, setStatusCounts] = useState({ total: 0, active: 0, paused: 0, closed: 0 })

  const refreshThreads = useCallback(() => {
    setThreads(listJobBuilderThreads())
  }, [])

  const loadAllJobs = useCallback(async () => {
    setLoading(true)
    setListError('')
    try {
      let currentPage = 1
      let totalPages = 1
      const all = []
      do {
        const res = await apiService.getBusinessJobs({ page: currentPage, limit: 50 })
        if (!res?.success) throw new Error(res?.message || 'Không thể tải danh sách JD')
        all.push(...(res.data?.jobs || []))
        totalPages = res.data?.pagination?.totalPages || 0
        currentPage += 1
      } while (currentPage <= totalPages)
      setStatusCounts(countJobsByStatus(all))
    } catch (err) {
      setListError(err?.message || 'Không thể tải danh sách JD')
      setStatusCounts({ total: 0, active: 0, paused: 0, closed: 0 })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAllJobs()
  }, [loadAllJobs])

  useEffect(() => {
    if (initializedRef.current) return undefined
    const timer = setTimeout(() => {
      if (initializedRef.current) return
      initializedRef.current = true
      const list = listJobBuilderThreads()
      if (list.length > 0) {
        setActiveThreadId(list[0].id)
        setSavedJobId(list[0].jobId || null)
        builderRef.current?.loadThread?.(list[0])
      } else {
        builderRef.current?.startNewSession?.()
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const filteredThreads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return threads
    return threads.filter((thread) => getThreadTitle(thread).toLowerCase().includes(q))
  }, [threads, searchQuery])

  const handleNewJob = () => {
    setActiveThreadId(null)
    setSavedJobId(null)
    builderRef.current?.startNewSession?.()
  }

  const handleSelectThread = (thread) => {
    setActiveThreadId(thread.id)
    setSavedJobId(thread.jobId || null)
    builderRef.current?.loadThread?.(thread)
  }

  const handleThreadPersist = useCallback((thread) => {
    refreshThreads()
    setActiveThreadId((prev) => prev || thread?.id || null)
  }, [refreshThreads])

  const handleJobSaved = useCallback(({ jobId, thread }) => {
    setSavedJobId(jobId)
    setActiveThreadId(thread?.id || null)
    refreshThreads()
    loadAllJobs()
  }, [refreshThreads, loadAllJobs])

  const handleDeleteThread = useCallback((thread, e) => {
    e?.stopPropagation?.()
    const name = getThreadTitle(thread)
    const confirmed = window.confirm(`Xóa phiên chat "${name}"?\n\nChat và bản nháp local sẽ bị xóa. JD đã lưu trên hệ thống vẫn giữ nguyên.`)
    if (!confirmed) return

    deleteJobBuilderThread(thread.id)
    refreshThreads()
    if (activeThreadId === thread.id) {
      const remaining = listJobBuilderThreads()
      if (remaining.length > 0) {
        handleSelectThread(remaining[0])
      } else {
        handleNewJob()
      }
    }
  }, [activeThreadId, refreshThreads])

  const jdStats = useMemo(() => [
    { icon: Briefcase, label: 'Tổng JD', value: statusCounts.total },
    { icon: CheckCircle2, label: 'Hoạt động', value: statusCounts.active },
    { icon: AlertCircle, label: 'Tạm dừng', value: statusCounts.paused },
    { icon: Shield, label: 'Đã đóng', value: statusCounts.closed },
  ], [statusCounts])

  return (
    <div className="h-full min-h-0 flex overflow-hidden bg-white">
      {/* ── Left sidebar: chat threads (ChatGPT-style) ── */}
      <aside className="w-[280px] shrink-0 flex flex-col border-r border-slate-200 bg-[#f9f9f9] min-h-0">
        <div className="p-2 shrink-0">
          <button
            type="button"
            onClick={handleNewJob}
            className="w-full flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-2.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 shrink-0" />
            Tạo JD mới
          </button>
        </div>

        <div className="px-2 pb-2 shrink-0">
          <div className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-2.5 py-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm phiên chat..."
              className="flex-1 bg-transparent outline-none text-xs text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        {listError && (
          <div className="mx-2 mb-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-[10px] px-2 py-1.5 shrink-0">
            {listError}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-2 py-1.5">
            Phiên chat ({filteredThreads.length})
          </p>

          {filteredThreads.length === 0 ? (
            <div className="text-center py-8 px-3">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400 leading-relaxed">
                {searchQuery
                  ? 'Không tìm thấy phiên chat phù hợp'
                  : 'Chưa có phiên chat nào.\nBấm "Tạo JD mới" để bắt đầu.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {filteredThreads.map((thread, index) => {
                const isActive = activeThreadId === thread.id
                const colorClass = THREAD_ICON_COLORS[index % THREAD_ICON_COLORS.length]
                const isSaved = Boolean(thread.jobId)
                return (
                  <div
                    key={thread.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectThread(thread)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectThread(thread)}
                    className={`group relative flex items-start gap-2 rounded-xl px-2.5 py-2 text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-white shadow-sm border border-slate-200'
                        : 'hover:bg-white/80 border border-transparent'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-xs font-medium text-slate-800 truncate leading-snug">
                        {getThreadTitle(thread)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] truncate ${isSaved ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {isSaved ? 'Đã lưu' : 'Nháp'}
                        </span>
                        {formatThreadDate(thread.updatedAt) ? (
                          <span className="text-[10px] text-slate-400 truncate">
                            · {formatThreadDate(thread.updatedAt)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
                      <button
                        type="button"
                        title="Xóa phiên"
                        onClick={(e) => handleDeleteThread(thread, e)}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 p-2 bg-white/60">
          <div className="grid grid-cols-2 gap-1">
            {jdStats.map((st) => {
              const Icon = st.icon
              return (
                <div key={st.label} className="flex items-center gap-1.5 px-2 py-1 rounded-lg">
                  <Icon className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-[10px] text-slate-500 truncate">{st.label}</span>
                  <span className="text-[10px] font-bold text-slate-700 ml-auto">
                    {loading ? '…' : st.value}
                  </span>
                </div>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => navigate('/business/jobs/create')}
            className="mt-2 w-full flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-500 hover:text-slate-700 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <MoreHorizontal className="w-3 h-3" />
            Tạo JD thủ công
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 min-h-0 flex flex-col bg-white">
        <div className="flex-1 min-h-0">
          <JobAiBuilderPanel
            ref={builderRef}
            embedded
            activeThreadId={activeThreadId}
            savedJobId={savedJobId}
            onThreadPersist={handleThreadPersist}
            onJobSaved={handleJobSaved}
          />
        </div>
      </main>
    </div>
  )
}

export default JobManagement
