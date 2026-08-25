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
    --jobs-zoom: 1;
  }
  @media (min-width: 1024px) and (max-width: 1279px) {
    .business-jobs-shell { --jobs-zoom: 0.9; }
  }
  @media (min-width: 1280px) and (max-width: 1535px) {
    .business-jobs-shell { --jobs-zoom: 0.86; }
  }
  @media (min-width: 1024px) and (max-height: 760px) {
    .business-jobs-shell { --jobs-zoom: 0.78; }
  }
  @media (min-width: 1024px) and (min-height: 761px) and (max-height: 860px) {
    .business-jobs-shell { --jobs-zoom: 0.84; }
  }
  .business-jobs-ui {
    zoom: var(--jobs-zoom);
    height: 100%;
    min-height: 0;
    --jd-fs-title: 11px;
    --jd-fs-body: 10px;
    --jd-icon: 14px;
    --jd-icon-hit: 28px;
  }
  @supports not (zoom: 1) {
    .business-jobs-ui {
      transform: scale(var(--jobs-zoom));
      transform-origin: top left;
      width: calc(100% / var(--jobs-zoom));
      height: calc(100% / var(--jobs-zoom));
    }
  }
  @media (min-width: 1536px) {
    .business-jobs-ui {
      --jd-fs-title: 12px;
      --jd-fs-body: 11px;
      --jd-icon: 15px;
      --jd-icon-hit: 30px;
    }
  }
  .business-jobs-ui .biz-jd-title { font-size: var(--jd-fs-title); line-height: 1.35; font-weight: 600; color: #1e293b; }
  .business-jobs-ui .biz-jd-body { font-size: var(--jd-fs-body); line-height: 1.45; color: #334155; }
  .business-jobs-ui .biz-jd-muted { font-size: var(--jd-fs-body); line-height: 1.45; color: #64748b; }
  .business-jobs-ui .biz-jd-icon { width: var(--jd-icon); height: var(--jd-icon); flex-shrink: 0; }
  .business-jobs-ui .biz-jd-icon-hit {
    width: var(--jd-icon-hit); height: var(--jd-icon-hit);
    display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .business-jobs-ui .biz-jd-icon-hit > svg { width: var(--jd-icon); height: var(--jd-icon); }
  .business-jobs-ui .business-jd-preview-root {
    --jobs-jd-extra: 0.62;
    zoom: calc(var(--jobs-jd-zoom, 1) * var(--jobs-jd-extra));
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
  }
  .business-jobs-ui .business-jd-preview-root::-webkit-scrollbar { width: 3px; height: 3px; }
  .business-jobs-ui .business-jd-preview-root::-webkit-scrollbar-track { background: transparent; }
  .business-jobs-ui .business-jd-preview-root::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
  .business-jobs-ui .business-jd-preview-root::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  .business-jobs-ui .business-jd-preview-root::-webkit-scrollbar-button,
  .business-jobs-ui .business-jd-preview-root::-webkit-scrollbar-corner { display: none; width: 0; height: 0; }
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
  .business-jobs-ui .business-jd-preview-root .jd-template-compact .w-36 { width: 6.25rem; }
  .business-jobs-ui .business-jd-preview-root .jd-template-compact .w-28 { width: 5rem; }
  .business-jobs-ui .business-jd-preview-root .jd-template-compact .w-24 { width: 4.25rem; }
  .business-jobs-ui .business-jd-preview-root .jd-template-compact .min-h-\\[60px\\] { min-height: 2.25rem; }
  @supports not (zoom: 1) {
    .business-jobs-ui .business-jd-preview-root {
      transform: scale(calc(var(--jobs-jd-zoom, 1) * var(--jobs-jd-extra, 0.62)));
      transform-origin: top left;
    }
  }
  @media (min-width: 1024px) and (max-width: 1535px) {
    .biz-jd-builder-page-header {
      padding: 0.375rem 0.625rem;
      gap: 0.5rem;
    }
    .biz-jd-builder-page-header h1 {
      font-size: 0.8125rem;
    }
    .biz-jd-builder-page-header .biz-jd-page-subtitle {
      font-size: 10px;
    }
    .biz-jd-builder-page-header .biz-jd-page-crumb {
      font-size: 9px;
    }
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
          <header className="biz-jd-builder-page-header shrink-0 flex items-center gap-2 border-b border-slate-200 px-2.5 py-2 lg:gap-3 lg:px-4 lg:py-2.5">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:h-8 lg:w-8"
              aria-label={jdCopy.back}
            >
              <ArrowLeft className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="biz-jd-page-crumb text-[10px] font-semibold uppercase tracking-wide text-slate-400 lg:text-[11px]">{jdCopy.breadcrumb}</p>
              <h1 className="truncate text-sm font-bold text-slate-900 lg:text-base">{pageTitle}</h1>
              <p className="biz-jd-page-subtitle text-[11px] text-slate-500 lg:text-xs">{jdCopy.pageSubtitle}</p>
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
