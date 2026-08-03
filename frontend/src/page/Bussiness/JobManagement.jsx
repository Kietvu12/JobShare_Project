import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus, Search, Trash2, MoreHorizontal,
  MessageSquare, PanelLeft, X,
} from 'lucide-react'
import JobAiBuilderPanel from '../../component/Bussiness/JobAiBuilderPanel'
import DeleteJobBuilderThreadModal from '../../component/Bussiness/DeleteJobBuilderThreadModal'
import {
  deleteJobBuilderThread,
  ensureJobBuilderThreadForJob,
  getJobBuilderThread,
  getJobBuilderThreadByJobId,
  importLegacyJobBuilderThreadsFromLocalStorage,
  listJobBuilderThreads,
} from '../../utils/jobBuilderThreadStorage'
import {
  clearPendingMarketplaceListingDraft,
  createAndSubmitMarketplaceListing,
  peekPendingMarketplaceListingDraft,
} from '../../utils/marketplaceListingFlow'
import apiService from '../../services/api'
import useBusinessUser from '../../hooks/useBusinessUser'

const BUSINESS_JOBS_FONT =
  "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif"

const THREAD_ICON_CLASS = 'border border-slate-200 bg-white text-[#1e3a5f]'

const JD_NAVY = '#0f2744'
const JD_NAVY_MID = '#1e3a5f'

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

const jobManagementStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  .business-jobs-shell {
    --jobs-zoom: clamp(0.42, 0.40 + 0.009vw, 0.70);
    --jobs-jd-zoom: clamp(0.50, 0.48 + 0.005vw, 0.64);
    height: 100%;
    min-height: 0;
    font-family: ${BUSINESS_JOBS_FONT};
  }
  @media (min-width: 1024px) and (max-width: 1535px) {
    .business-jobs-shell {
      --jobs-zoom: clamp(0.38, 0.36 + 0.007vw, 0.54);
      --jobs-jd-zoom: clamp(0.46, 0.44 + 0.004vw, 0.56);
    }
  }
  @media (min-width: 1536px) {
    .business-jobs-shell {
      --jobs-zoom: clamp(0.52, 0.48 + 0.01vw, 0.78);
      --jobs-jd-zoom: clamp(0.58, 0.54 + 0.006vw, 0.72);
    }
  }
  @media (max-width: 1023px) {
    .business-jobs-shell {
      --jobs-zoom: clamp(0.40, 0.38 + 0.018vw, 0.58);
    }
  }
  @media (max-height: 900px) and (min-width: 1024px) {
    .business-jobs-shell {
      --jobs-zoom: clamp(0.36, 0.34 + 0.006vw, 0.50);
      --jobs-jd-zoom: clamp(0.44, 0.42 + 0.003vw, 0.52);
    }
  }
  @media (max-height: 820px) and (min-width: 1024px) {
    .business-jobs-shell {
      --jobs-zoom: clamp(0.32, 0.30 + 0.005vw, 0.44);
      --jobs-jd-zoom: clamp(0.40, 0.38 + 0.002vw, 0.48);
    }
  }
  .business-jobs-ui .business-jd-preview-root {
    --jobs-jd-extra: 0.62;
    zoom: calc(var(--jobs-jd-zoom) * var(--jobs-jd-extra));
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
  }
  .business-jobs-ui .business-jd-preview-root::-webkit-scrollbar {
    width: 3px;
    height: 3px;
  }
  .business-jobs-ui .business-jd-preview-root::-webkit-scrollbar-track {
    background: transparent;
  }
  .business-jobs-ui .business-jd-preview-root::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 999px;
  }
  .business-jobs-ui .business-jd-preview-root::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  .business-jobs-ui .business-jd-preview-root::-webkit-scrollbar-button,
  .business-jobs-ui .business-jd-preview-root::-webkit-scrollbar-corner {
    display: none;
    width: 0;
    height: 0;
  }
  .business-jobs-ui .business-jd-preview-root .jd-template-compact {
    font-size: var(--jd-fs-body);
    line-height: 1.35;
  }
  .business-jobs-ui .business-jd-preview-root .jd-template-compact .jd-template-option-control,
  .business-jobs-ui .business-jd-preview-root .jd-template-compact .jd-template-option-control option {
    font-size: var(--jd-fs-body);
    line-height: 1.35;
  }
  .business-jobs-ui .business-jd-preview-root .jd-template-compact.text-xs,
  .business-jobs-ui .business-jd-preview-root .jd-template-compact .text-xs {
    font-size: var(--jd-fs-body);
    line-height: 1.35;
  }
  .business-jobs-ui .business-jd-preview-root .jd-template-compact .text-sm,
  .business-jobs-ui .business-jd-preview-root .jd-template-compact .text-\\[10px\\] {
    font-size: var(--jd-fs-title);
    line-height: 1.35;
  }
  .business-jobs-ui .business-jd-preview-root .jd-template-compact .px-3 {
    padding-left: 6px;
    padding-right: 6px;
  }
  .business-jobs-ui .business-jd-preview-root .jd-template-compact .py-2 {
    padding-top: 4px;
    padding-bottom: 4px;
  }
  .business-jobs-ui .business-jd-preview-root .jd-template-compact .py-2\\.5 {
    padding-top: 5px;
    padding-bottom: 5px;
  }
  .business-jobs-ui .business-jd-preview-root .jd-template-compact .w-36 {
    width: 6.25rem;
  }
  .business-jobs-ui .business-jd-preview-root .jd-template-compact .w-28 {
    width: 5rem;
  }
  .business-jobs-ui .business-jd-preview-root .jd-template-compact .w-24 {
    width: 4.25rem;
  }
  .business-jobs-ui .business-jd-preview-root .jd-template-compact .min-h-\\[60px\\] {
    min-height: 2.25rem;
  }
  @supports not (zoom: 1) {
    .business-jobs-ui .business-jd-preview-root {
      transform: scale(calc(var(--jobs-jd-zoom) * var(--jobs-jd-extra, 0.62)));
      transform-origin: top left;
    }
  }
  .business-jobs-ui {
    zoom: var(--jobs-zoom);
    height: 100%;
    min-height: 0;
    --jd-fs-title: 10px;
    --jd-fs-body: 9px;
    --jd-icon: 14px;
    --jd-icon-hit: 24px;
  }
  @media (min-width: 1280px) {
    .business-jobs-ui {
      --jd-fs-title: 11px;
      --jd-fs-body: 10px;
    }
  }
  .business-jobs-ui .biz-jd-title {
    font-size: var(--jd-fs-title);
    line-height: 1.35;
    font-weight: 600;
    color: ${JD_NAVY};
  }
  .business-jobs-ui .biz-jd-body {
    font-size: var(--jd-fs-body);
    line-height: 1.45;
    color: #334155;
  }
  .business-jobs-ui .biz-jd-muted {
    font-size: var(--jd-fs-body);
    line-height: 1.45;
    color: #64748b;
  }
  .business-jobs-ui .biz-jd-label {
    font-size: var(--jd-fs-body);
    line-height: 1.35;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #94a3b8;
  }
  .business-jobs-ui .biz-jd-icon {
    width: var(--jd-icon);
    height: var(--jd-icon);
    flex-shrink: 0;
  }
  .business-jobs-ui .biz-jd-icon-hit {
    width: var(--jd-icon-hit);
    height: var(--jd-icon-hit);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .business-jobs-ui .biz-jd-icon-hit > svg {
    width: var(--jd-icon);
    height: var(--jd-icon);
  }
  @supports not (zoom: 1) {
    .business-jobs-ui {
      transform: scale(var(--jobs-zoom));
      transform-origin: top left;
      width: calc(100% / var(--jobs-zoom));
      height: calc(100% / var(--jobs-zoom));
    }
  }
`

const JobManagement = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user: businessUser } = useBusinessUser()
  const urlJobId = searchParams.get('jobId')
  const quickMarketplaceParam = searchParams.get('quickMarketplace') === '1'
  const builderRef = useRef(null)
  const initializedRef = useRef(false)
  const lastOpenedJobIdRef = useRef(null)
  const lastBusinessUserIdRef = useRef(businessUser?.id)

  const [searchQuery, setSearchQuery] = useState('')
  const [threads, setThreads] = useState([])
  const [threadsLoading, setThreadsLoading] = useState(true)
  const [activeThreadId, setActiveThreadId] = useState(null)
  const [savedJobId, setSavedJobId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [deleteThreadModal, setDeleteThreadModal] = useState({ open: false, thread: null })
  const [deletingThread, setDeletingThread] = useState(false)
  const [marketplaceQuickCreateActive, setMarketplaceQuickCreateActive] = useState(
    () => Boolean(peekPendingMarketplaceListingDraft()),
  )
  const [marketplaceSubmitting, setMarketplaceSubmitting] = useState(false)

  const refreshThreads = useCallback(async () => {
    try {
      const list = await listJobBuilderThreads()
      setThreads(list)
      return list
    } catch (err) {
      console.error('Không tải được danh sách phiên JD:', err)
      return []
    }
  }, [])

  useEffect(() => {
    if (!businessUser?.id) return undefined
    let cancelled = false
    ;(async () => {
      setThreadsLoading(true)
      try {
        await importLegacyJobBuilderThreadsFromLocalStorage()
        if (!cancelled) await refreshThreads()
      } catch {
        if (!cancelled) await refreshThreads()
      } finally {
        if (!cancelled) setThreadsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [businessUser?.id, refreshThreads])

  useEffect(() => {
    const id = businessUser?.id
    if (!id) return
    if (lastBusinessUserIdRef.current === id) return
    const prev = lastBusinessUserIdRef.current
    lastBusinessUserIdRef.current = id
    // Lần đầu login: init effect lo loadThread / startNewSession
    if (prev == null) return
    // Đổi tài khoản: reset workspace + tạo box mới (lưu DB ngay)
    refreshThreads()
    setActiveThreadId(null)
    setSavedJobId(null)
    lastOpenedJobIdRef.current = null
    builderRef.current?.startNewSession?.()
  }, [businessUser?.id, refreshThreads])

  const openJobById = useCallback(async (jobId) => {
    const id = jobId != null && jobId !== '' ? String(jobId) : ''
    if (!id) return
    if (lastOpenedJobIdRef.current === id && activeThreadId) {
      const existing = await getJobBuilderThreadByJobId(id)
      if (existing?.id === activeThreadId) return
    }
    lastOpenedJobIdRef.current = id

    let thread = await getJobBuilderThreadByJobId(id)
    if (!thread) {
      let title = ''
      try {
        const res = await apiService.getBusinessJobById(id)
        const job = res?.data?.job || res?.data
        title = job?.title || job?.titleEn || job?.titleJp || ''
      } catch {
        /* title mặc định trong ensure */
      }
      thread = await ensureJobBuilderThreadForJob(id, { title: title || undefined })
    }
    if (!thread) return

    setActiveThreadId(thread.id)
    setSavedJobId(thread.jobId || null)
    await refreshThreads()
    builderRef.current?.loadThread?.(thread)
    setSidebarOpen(false)
  }, [activeThreadId, refreshThreads])

  useEffect(() => {
    if (initializedRef.current || threadsLoading) return undefined
    const timer = setTimeout(() => {
      if (initializedRef.current) return
      initializedRef.current = true

      if (quickMarketplaceParam && peekPendingMarketplaceListingDraft()) {
        const next = new URLSearchParams(searchParams)
        next.delete('quickMarketplace')
        setSearchParams(next, { replace: true })
        lastOpenedJobIdRef.current = null
        setActiveThreadId(null)
        setSavedJobId(null)
        setMarketplaceQuickCreateActive(true)
        builderRef.current?.startNewSession?.()
        return
      }

      if (urlJobId) {
        openJobById(urlJobId)
        return
      }
      listJobBuilderThreads().then(async (list) => {
        if (list.length > 0) {
          setActiveThreadId(list[0].id)
          setSavedJobId(list[0].jobId || null)
          const full = await getJobBuilderThread(list[0].id)
          builderRef.current?.loadThread?.(full || list[0])
        } else {
          builderRef.current?.startNewSession?.()
        }
      })
    }, 0)
    return () => clearTimeout(timer)
  }, [urlJobId, openJobById, quickMarketplaceParam, searchParams, setSearchParams, threadsLoading])

  useEffect(() => {
    if (!initializedRef.current || !urlJobId) return
    openJobById(urlJobId)
  }, [urlJobId, openJobById])

  const filteredThreads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return threads
    return threads.filter((thread) => getThreadTitle(thread).toLowerCase().includes(q))
  }, [threads, searchQuery])

  const handleNewJob = () => {
    lastOpenedJobIdRef.current = null
    if (searchParams.get('jobId')) {
      const next = new URLSearchParams(searchParams)
      next.delete('jobId')
      setSearchParams(next, { replace: true })
    }
    setActiveThreadId(null)
    setSavedJobId(null)
    builderRef.current?.startNewSession?.()
  }

  const handleSelectThread = async (thread) => {
    setActiveThreadId(thread.id)
    setSavedJobId(thread.jobId || null)
    setSidebarOpen(false)
    const full = await getJobBuilderThread(thread.id)
    builderRef.current?.loadThread?.(full || thread)
  }

  const handleThreadPersist = useCallback((thread) => {
    if (!thread?.id) {
      refreshThreads().catch(() => {})
      return
    }
    const nextId = String(thread.id)
    setActiveThreadId(nextId)
    setThreads((prev) => {
      const replaceId = thread.replaceClientId ? String(thread.replaceClientId) : null
      const rest = prev.filter((t) => {
        const tid = String(t.id)
        if (tid === nextId) return false
        if (replaceId && tid === replaceId) return false
        return true
      })
      const { replaceClientId: _rc, ...clean } = thread
      return [{ ...clean, id: nextId }, ...rest]
    })
    refreshThreads().catch(() => {})
  }, [refreshThreads])

  const handleJobSaved = useCallback(async ({ jobId, thread, isCreate }) => {
    setSavedJobId(jobId)
    setActiveThreadId(thread?.id || null)
    refreshThreads()

    const pending = peekPendingMarketplaceListingDraft()
    if (!pending || !isCreate) return

    setMarketplaceSubmitting(true)
    try {
      const { wsSessionId } = await createAndSubmitMarketplaceListing(jobId, pending)
      clearPendingMarketplaceListingDraft()
      setMarketplaceQuickCreateActive(false)
      if (wsSessionId) {
        navigate(`/business/messages?tab=ws&wsView=chat&sessionId=${wsSessionId}`)
      } else {
        navigate('/business/candidate-sharing?tab=jobs')
      }
    } catch (err) {
      window.alert(
        err?.message
          || 'JD đã lưu nhưng không gửi được yêu cầu lên sàn. Bạn có thể thử lại tại Sàn CTV.',
      )
      navigate(`/business/candidate-sharing?create=1&jobId=${encodeURIComponent(jobId)}`)
    } finally {
      setMarketplaceSubmitting(false)
    }
  }, [navigate, refreshThreads])

  const closeDeleteThreadModal = useCallback(() => {
    setDeleteThreadModal({ open: false, thread: null })
  }, [])

  const handleDeleteThreadClick = useCallback((thread, e) => {
    e?.stopPropagation?.()
    setDeleteThreadModal({ open: true, thread })
  }, [])

  const confirmDeleteThread = useCallback(async () => {
    const thread = deleteThreadModal.thread
    if (!thread || deletingThread) return

    setDeletingThread(true)
    try {
      if (thread.jobId) {
        const res = await apiService.deleteBusinessJob(thread.jobId)
        if (!res?.success) {
          window.alert(res?.message || 'Không thể xóa JD. Phiên chat chưa bị xóa.')
          return
        }
      }
      await deleteJobBuilderThread(thread.id)
      await refreshThreads()
      closeDeleteThreadModal()

      if (activeThreadId === thread.id) {
        const remaining = await listJobBuilderThreads()
        if (remaining.length > 0) {
          setActiveThreadId(remaining[0].id)
          setSavedJobId(remaining[0].jobId || null)
          const full = await getJobBuilderThread(remaining[0].id)
          builderRef.current?.loadThread?.(full || remaining[0])
        } else {
          setActiveThreadId(null)
          setSavedJobId(null)
          builderRef.current?.startNewSession?.()
        }
      }
    } catch (err) {
      window.alert(err?.message || 'Không thể xóa JD. Phiên chat chưa bị xóa.')
    } finally {
      setDeletingThread(false)
    }
  }, [activeThreadId, closeDeleteThreadModal, deleteThreadModal.thread, deletingThread, refreshThreads])

  const activeThreadTitle = useMemo(() => {
    const t = threads.find((th) => th.id === activeThreadId)
    return t ? getThreadTitle(t) : 'JD mới'
  }, [threads, activeThreadId])

  const sidebarInner = (
    <>
      <div className="p-1.5 lg:p-2 shrink-0 flex items-center gap-1.5 lg:gap-2">
        <button
          type="button"
          onClick={handleNewJob}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 biz-jd-body font-medium px-2 py-1 transition-colors shadow-sm min-w-0"
        >
          <Plus className="biz-jd-icon shrink-0" />
          Tạo JD mới
        </button>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden shrink-0 biz-jd-icon-hit rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          aria-label="Đóng danh sách phiên"
        >
          <X className="biz-jd-icon" />
        </button>
      </div>

      <div className="px-1.5 lg:px-2 pb-1.5 lg:pb-2 shrink-0">
        <div className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2 py-1.5">
          <Search className="biz-jd-icon text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm phiên chat..."
            className="flex-1 min-w-0 bg-transparent outline-none biz-jd-body text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-1.5 lg:px-2 pb-1.5 lg:pb-2">
        <p className="biz-jd-label px-1.5 lg:px-2 py-1 lg:py-1.5">
          Phiên chat ({filteredThreads.length})
        </p>

        {filteredThreads.length === 0 ? (
          <div className="text-center py-8 px-3">
            <MessageSquare className="biz-jd-icon mx-auto mb-2 text-slate-300" />
            <p className="biz-jd-muted leading-relaxed whitespace-pre-line">
              {searchQuery
                ? 'Không tìm thấy phiên chat phù hợp'
                : 'Chưa có phiên chat nào.\nBấm "Tạo JD mới" để bắt đầu.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {filteredThreads.map((thread, index) => {
              const isActive = activeThreadId === thread.id
              const colorClass = THREAD_ICON_CLASS
              const isSaved = Boolean(thread.jobId)
              return (
                <div
                  key={thread.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectThread(thread)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectThread(thread)}
                  className={`group relative flex items-start gap-1.5 lg:gap-2 rounded-lg lg:rounded-xl px-2 py-2 lg:px-2.5 lg:py-2.5 text-left transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-white shadow-sm border border-slate-200'
                      : 'hover:bg-white/80 border border-transparent'
                  }`}
                >
                  <div className={`biz-jd-icon-hit rounded-lg shrink-0 ${colorClass}`}>
                    <MessageSquare className="biz-jd-icon" />
                  </div>
                  <div className="flex-1 min-w-0 pr-7 lg:pr-8">
                    <p className="biz-jd-body font-medium text-slate-800 truncate leading-snug">
                      {getThreadTitle(thread)}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap biz-jd-muted">
                      <span className={isSaved ? 'text-emerald-600' : 'text-amber-600'}>
                        {isSaved ? 'Đã lưu' : 'Nháp'}
                      </span>
                      {formatThreadDate(thread.updatedAt) ? (
                        <span>
                          · {formatThreadDate(thread.updatedAt)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex lg:hidden items-center">
                    <button
                      type="button"
                      title="Xóa phiên"
                      onClick={(e) => handleDeleteThreadClick(thread, e)}
                      className="biz-jd-icon-hit rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="biz-jd-icon" />
                    </button>
                  </div>
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden lg:group-hover:flex items-center gap-0.5">
                    <button
                      type="button"
                      title="Xóa phiên"
                      onClick={(e) => handleDeleteThreadClick(thread, e)}
                      className="biz-jd-icon-hit rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="biz-jd-icon" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-200 p-1.5 lg:p-2 bg-white/80">
        <button
          type="button"
          onClick={() => {
            navigate('/business/jobs/create')
            setSidebarOpen(false)
          }}
          className="w-full flex items-center justify-center gap-1 biz-jd-body font-semibold text-slate-500 hover:text-slate-700 py-1.5 lg:py-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <MoreHorizontal className="biz-jd-icon" />
          Tạo JD thủ công
        </button>
      </div>
    </>
  )

  return (
    <>
      <style>{jobManagementStyles}</style>
      <DeleteJobBuilderThreadModal
        open={deleteThreadModal.open}
        threadTitle={deleteThreadModal.thread ? getThreadTitle(deleteThreadModal.thread) : ''}
        linkedJobId={deleteThreadModal.thread?.jobId}
        onClose={closeDeleteThreadModal}
        onConfirm={confirmDeleteThread}
        confirming={deletingThread}
      />
      <div className="business-jobs-shell h-full min-h-0 overflow-hidden">
        <div className="business-jobs-ui h-full min-h-0 flex overflow-hidden bg-white relative">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Đóng overlay"
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          z-50 flex flex-col border-r border-slate-200 bg-[#f9f9f9] min-h-0
          w-[min(100%,20rem)] max-w-[85vw] sm:max-w-[20rem]
          fixed inset-y-0 left-0 shadow-xl
          transition-transform duration-200 ease-out
          lg:static lg:z-auto lg:w-[168px] xl:w-[180px] 2xl:w-[192px] lg:shrink-0 lg:shadow-none lg:max-w-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {sidebarInner}
      </aside>

      <main className="flex-1 min-w-0 min-h-0 flex flex-col bg-white w-full">
        <div className="lg:hidden shrink-0 flex items-center gap-1.5 border-b border-slate-200 px-2 py-1.5 bg-white">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="shrink-0 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 biz-jd-body font-medium text-slate-700"
          >
            <PanelLeft className="biz-jd-icon" />
            Phiên
          </button>
          <p className="flex-1 min-w-0 biz-jd-title truncate">
            {activeThreadTitle}
          </p>
          <button
            type="button"
            onClick={handleNewJob}
            className="shrink-0 inline-flex items-center gap-0.5 rounded-md text-white biz-jd-body font-medium px-2 py-1.5"
            style={{ backgroundColor: JD_NAVY_MID }}
          >
            <Plus className="biz-jd-icon" />
            <span className="sr-only sm:not-sr-only sm:inline">Mới</span>
          </button>
        </div>

        <div className="flex-1 min-h-0 min-w-0 flex flex-col">
          {marketplaceQuickCreateActive ? (
            <div className="shrink-0 border-b px-3 py-2 biz-jd-body text-slate-700" style={{ borderColor: `${JD_NAVY_MID}33`, backgroundColor: '#f1f5f9' }}>
              {marketplaceSubmitting
                ? 'Đang gửi WS duyệt đưa job lên sàn CTV...'
                : 'Tạo & lưu JD bằng chat — sau khi lưu, hệ thống tự gửi WS duyệt đưa job lên sàn (phí thưởng đã cài từ Sàn CTV).'}
            </div>
          ) : null}
          <JobAiBuilderPanel
            ref={builderRef}
            embedded
            activeThreadId={activeThreadId}
            savedJobId={savedJobId}
            onThreadPersist={handleThreadPersist}
            onJobSaved={handleJobSaved}
            showNextStepsOnCreate={!marketplaceQuickCreateActive}
          />
        </div>
      </main>
        </div>
      </div>
    </>
  )
}

export default JobManagement
