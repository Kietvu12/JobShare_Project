import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import JobAiBuilderPanel from '../../component/Bussiness/JobAiBuilderPanel'
import {
  ensureJobBuilderThreadForJob,
  getJobBuilderThread,
  getJobBuilderThreadByJobId,
  importLegacyJobBuilderThreadsFromLocalStorage,
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

const builderPageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  .business-jobs-shell {
    height: 100%;
    min-height: 0;
    font-family: ${BUSINESS_JOBS_FONT};
  }
  .business-jobs-ui {
    height: 100%;
    min-height: 0;
  }
`

const JobAiBuilderPage = ({ mode = 'create' }) => {
  const navigate = useNavigate()
  const { jobId: jobIdParam } = useParams()
  const [searchParams] = useSearchParams()
  const threadIdParam = searchParams.get('threadId')
  const quickMarketplaceParam = searchParams.get('quickMarketplace') === '1'
  const { user: businessUser } = useBusinessUser()

  const builderRef = useRef(null)
  const [activeThreadId, setActiveThreadId] = useState(null)
  const [savedJobId, setSavedJobId] = useState(mode === 'edit' ? jobIdParam : null)
  const [loading, setLoading] = useState(true)
  const [pageTitle, setPageTitle] = useState(mode === 'edit' ? 'Chỉnh sửa JD với AI' : 'Tạo JD mới với AI')
  const [marketplaceQuickCreateActive, setMarketplaceQuickCreateActive] = useState(
    () => mode === 'create' && Boolean(peekPendingMarketplaceListingDraft()),
  )
  const [marketplaceSubmitting, setMarketplaceSubmitting] = useState(false)

  const goBack = useCallback(() => {
    if (savedJobId) {
      navigate(`/business/jobs/${savedJobId}`)
      return
    }
    navigate('/business/jobs')
  }, [navigate, savedJobId])

  useEffect(() => {
    if (!businessUser?.id) return undefined
    let cancelled = false
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        await importLegacyJobBuilderThreadsFromLocalStorage()

        if (mode === 'edit' && jobIdParam) {
          let thread = await getJobBuilderThreadByJobId(jobIdParam)
          if (!thread) {
            let title = ''
            try {
              const res = await apiService.getBusinessJobById(jobIdParam)
              const job = res?.data?.job || res?.data
              title = job?.title || job?.titleEn || job?.titleJp || ''
              if (title) setPageTitle(`Chỉnh sửa: ${title}`)
            } catch {
              /* ignore */
            }
            thread = await ensureJobBuilderThreadForJob(jobIdParam, { title: title || undefined })
          } else if (thread.title) {
            setPageTitle(`Chỉnh sửa: ${thread.title}`)
          }
          if (thread) {
            setActiveThreadId(thread.id)
            setSavedJobId(thread.jobId || jobIdParam)
            const full = await getJobBuilderThread(thread.id)
            await builderRef.current?.loadThread?.(full || thread)
          }
          return
        }

        if (quickMarketplaceParam && peekPendingMarketplaceListingDraft()) {
          setMarketplaceQuickCreateActive(true)
          await builderRef.current?.startNewSession?.()
          return
        }

        if (threadIdParam) {
          const full = await getJobBuilderThread(threadIdParam)
          if (full) {
            setActiveThreadId(full.id)
            setSavedJobId(full.jobId || null)
            if (full.title) setPageTitle(full.jobId ? `Chỉnh sửa: ${full.title}` : 'Tạo JD mới với AI')
            await builderRef.current?.loadThread?.(full)
            return
          }
        }

        await builderRef.current?.startNewSession?.()
      } catch (err) {
        console.error(err)
        await builderRef.current?.startNewSession?.()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [businessUser?.id, jobIdParam, mode, quickMarketplaceParam, threadIdParam])

  const handleThreadPersist = useCallback((thread) => {
    if (thread?.id) setActiveThreadId(String(thread.id))
    if (thread?.title && !thread.jobId) setPageTitle(thread.title === 'JD mới' ? 'Tạo JD mới với AI' : thread.title)
  }, [])

  const handleJobSaved = useCallback(async ({ jobId, thread, isCreate }) => {
    setSavedJobId(jobId)
    setActiveThreadId(thread?.id || null)
    if (thread?.title) setPageTitle(`Chỉnh sửa: ${thread.title}`)

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
  }, [navigate])

  return (
    <>
      <style>{builderPageStyles}</style>
      <div className="business-jobs-shell flex h-full min-h-0 flex-col overflow-hidden bg-white">
        <div className="business-jobs-ui flex min-h-0 flex-1 flex-col overflow-hidden">
          <header className="shrink-0 flex items-center gap-3 border-b border-slate-200 px-3 py-2.5 lg:px-4">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Quay lại"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Quản lý JD</p>
              <h1 className="truncate text-sm font-bold text-slate-900 lg:text-base">{pageTitle}</h1>
              <p className="text-[11px] text-slate-500">
                Chat với AI để tạo JD hoặc chỉnh sửa nội dung theo nhu cầu của bạn.
              </p>
            </div>
          </header>

          {marketplaceQuickCreateActive ? (
            <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              {marketplaceSubmitting
                ? 'Đang gửi WS duyệt đưa job lên sàn CTV...'
                : 'Tạo & lưu JD bằng chat — sau khi lưu, hệ thống tự gửi WS duyệt đưa job lên sàn.'}
            </div>
          ) : null}

          <div className="relative min-h-0 flex-1">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                <Loader2 className="h-6 w-6 animate-spin text-[#0077B6]" />
              </div>
            ) : null}
            <JobAiBuilderPanel
              ref={builderRef}
              hideToolbarTitle
              skipAutoBoot
              activeThreadId={activeThreadId}
              savedJobId={savedJobId}
              onThreadPersist={handleThreadPersist}
              onJobSaved={handleJobSaved}
              showNextStepsOnCreate={!marketplaceQuickCreateActive}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default JobAiBuilderPage
