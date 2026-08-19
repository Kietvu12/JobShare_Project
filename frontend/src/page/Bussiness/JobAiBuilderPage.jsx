import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import useBusinessAppCopy from '../../hooks/useBusinessAppCopy'
import { useLanguage } from '../../context/LanguageContext'
import { getLocalizedJobTitle } from '../../i18n/businessAppI18n'

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

const DEFAULT_NEW_TITLE_KEYS = new Set(['JD mới', 'New JD', '新規JD'])

function resolveBuilderPageTitle({ mode, jdCopy, displayName, isDraftThread }) {
  if (displayName) return jdCopy.editTitleWithName(displayName)
  if (mode === 'edit') return jdCopy.editTitle
  if (isDraftThread) return jdCopy.createTitle
  return jdCopy.createTitle
}

const JobAiBuilderPage = ({ mode = 'create' }) => {
  const navigate = useNavigate()
  const { jobId: jobIdParam } = useParams()
  const [searchParams] = useSearchParams()
  const threadIdParam = searchParams.get('threadId')
  const quickMarketplaceParam = searchParams.get('quickMarketplace') === '1'
  const { user: businessUser } = useBusinessUser()
  const { language } = useLanguage()
  const copy = useBusinessAppCopy()
  const jdCopy = copy.jdBuilder

  const builderRef = useRef(null)
  const [activeThreadId, setActiveThreadId] = useState(null)
  const [savedJobId, setSavedJobId] = useState(mode === 'edit' ? jobIdParam : null)
  const [loading, setLoading] = useState(true)
  const [loadedJob, setLoadedJob] = useState(null)
  const [threadTitle, setThreadTitle] = useState(null)
  const [isDraftThread, setIsDraftThread] = useState(false)
  const [marketplaceQuickCreateActive, setMarketplaceQuickCreateActive] = useState(
    () => mode === 'create' && Boolean(peekPendingMarketplaceListingDraft()),
  )
  const [marketplaceSubmitting, setMarketplaceSubmitting] = useState(false)

  const displayJobTitle = useMemo(() => {
    if (loadedJob) return getLocalizedJobTitle(loadedJob, language)
    if (threadTitle && !DEFAULT_NEW_TITLE_KEYS.has(threadTitle)) return threadTitle
    return null
  }, [loadedJob, threadTitle, language])

  const pageTitle = useMemo(
    () => resolveBuilderPageTitle({
      mode,
      jdCopy,
      displayName: displayJobTitle,
      isDraftThread,
    }),
    [mode, jdCopy, displayJobTitle, isDraftThread],
  )

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
            let job = null
            try {
              const res = await apiService.getBusinessJobById(jobIdParam)
              job = res?.data?.job || res?.data
              if (job) setLoadedJob(job)
            } catch {
              /* ignore */
            }
            thread = await ensureJobBuilderThreadForJob(jobIdParam, {
              title: getLocalizedJobTitle(job, language) || undefined,
            })
          } else if (thread.title) {
            setThreadTitle(thread.title)
            setIsDraftThread(!thread.jobId)
          }
          if (thread) {
            setActiveThreadId(thread.id)
            setSavedJobId(thread.jobId || jobIdParam)
            if (thread.jobId) {
              try {
                const res = await apiService.getBusinessJobById(thread.jobId)
                const job = res?.data?.job || res?.data
                if (job) setLoadedJob(job)
              } catch {
                /* ignore */
              }
            }
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
            if (full.title) {
              setThreadTitle(full.title)
              setIsDraftThread(!full.jobId)
            }
            if (full.jobId) {
              try {
                const res = await apiService.getBusinessJobById(full.jobId)
                const job = res?.data?.job || res?.data
                if (job) setLoadedJob(job)
              } catch {
                /* ignore */
              }
            }
            await builderRef.current?.loadThread?.(full)
            return
          }
        }

        setIsDraftThread(true)
        await builderRef.current?.startNewSession?.()
      } catch (err) {
        console.error(err)
        setIsDraftThread(true)
        await builderRef.current?.startNewSession?.()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [businessUser?.id, jobIdParam, language, mode, quickMarketplaceParam, threadIdParam])

  const handleThreadPersist = useCallback((thread) => {
    if (thread?.id) setActiveThreadId(String(thread.id))
    if (thread?.title) {
      setThreadTitle(thread.title)
      setIsDraftThread(!thread?.jobId)
    }
  }, [])

  const handleJobSaved = useCallback(async ({ jobId, thread, isCreate }) => {
    setSavedJobId(jobId)
    setActiveThreadId(thread?.id || null)
    setIsDraftThread(false)
    if (thread?.title) setThreadTitle(thread.title)
    try {
      const res = await apiService.getBusinessJobById(jobId)
      const job = res?.data?.job || res?.data
      if (job) setLoadedJob(job)
    } catch {
      /* ignore */
    }

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
      window.alert(err?.message || jdCopy.marketplaceSaveError)
      navigate(`/business/candidate-sharing?create=1&jobId=${encodeURIComponent(jobId)}`)
    } finally {
      setMarketplaceSubmitting(false)
    }
  }, [jdCopy.marketplaceSaveError, navigate])

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
              aria-label={jdCopy.back}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{jdCopy.breadcrumb}</p>
              <h1 className="truncate text-sm font-bold text-slate-900 lg:text-base">{pageTitle}</h1>
              <p className="text-[11px] text-slate-500">{jdCopy.pageSubtitle}</p>
            </div>
          </header>

          {marketplaceQuickCreateActive ? (
            <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              {marketplaceSubmitting ? jdCopy.marketplaceSubmitting : jdCopy.marketplaceHint}
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
