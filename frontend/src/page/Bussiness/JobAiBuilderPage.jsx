import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
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
import {
  consumeScoutPerformanceHearingPending,
  peekScoutPerformanceHearingPending,
  submitScoutPerformanceHearingForJob,
} from '../../utils/scoutPerformanceHearingPending'
import apiService from '../../services/api'
import useBusinessUser from '../../hooks/useBusinessUser'
import useBusinessAppCopy from '../../hooks/useBusinessAppCopy'
import { useLanguage } from '../../context/LanguageContext'
import { getLocalizedJobTitle } from '../../i18n/businessAppI18n'
import {
  BUSINESS_HOMEPAGE_PAGE_BASE_STYLES,
  BUSINESS_UI_FONT,
} from '../../utils/businessHomepageTypography.js'

const builderPageStyles = `
  ${BUSINESS_HOMEPAGE_PAGE_BASE_STYLES}
  .business-jobs-shell {
    height: 100%;
    min-height: 0;
    font-family: ${BUSINESS_UI_FONT};
    background: #f4f6f8;
  }
  .business-jobs-ui.business-homepage-ui {
    height: 100%;
    min-height: 0;
  }
  @supports not (zoom: 1) {
    .business-jobs-ui.business-homepage-ui {
      height: calc(100% / var(--hp-zoom));
    }
  }
  .business-jobs-ui .business-jd-preview-root .jd-template-compact,
  .business-jobs-ui .business-jd-preview-root .jd-template-compact .text-xs,
  .business-jobs-ui .business-jd-preview-root .jd-template-compact .jd-template-option-control,
  .business-jobs-ui .business-jd-preview-root .jd-template-compact .jd-template-option-control option {
    font-size: var(--biz-hp-jd-body);
    line-height: 1.5;
  }
  .business-jobs-ui .business-jd-preview-root .jd-template-compact .text-sm,
  .business-jobs-ui .business-jd-preview-root .jd-template-compact .text-\\[10px\\],
  .business-jobs-ui .business-jd-preview-root .jd-template-compact .text-\\[11px\\] {
    font-size: var(--biz-hp-jd-title);
    line-height: 1.45;
  }
`

const JobAiBuilderPage = ({ mode = 'create' }) => {
  const navigate = useNavigate()
  const { jobId: jobIdParam } = useParams()
  const [searchParams] = useSearchParams()
  const threadIdParam = searchParams.get('threadId')
  const quickMarketplaceParam = searchParams.get('quickMarketplace') === '1'
  const scoutHearingParam = searchParams.get('from') === 'scout-performance-hearing'
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
  const [scoutHearingActive, setScoutHearingActive] = useState(
    () => mode === 'create' && Boolean(peekScoutPerformanceHearingPending()),
  )
  const [marketplaceSubmitting, setMarketplaceSubmitting] = useState(false)
  const [hearingSubmitting, setHearingSubmitting] = useState(false)

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

        if (scoutHearingParam && peekScoutPerformanceHearingPending()) {
          setScoutHearingActive(true)
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
  }, [businessUser?.id, jobIdParam, language, mode, quickMarketplaceParam, scoutHearingParam, threadIdParam])

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

    const hearingPending = isCreate ? consumeScoutPerformanceHearingPending() : null
    if (hearingPending?.cvId) {
      setHearingSubmitting(true)
      try {
        const { hearingRes, returnPath } = await submitScoutPerformanceHearingForJob(
          apiService,
          jobId,
          hearingPending,
        )
        setScoutHearingActive(false)
        if (hearingRes?.success) {
          const req = hearingRes.data?.request
          navigate(returnPath, {
            replace: true,
            state: {
              performanceSuccess: {
                requestCode: req?.requestCode,
                sessionId: req?.sessionId,
                requestId: req?.id,
                wantsSimilarCandidates: !!req?.wantsSimilarCandidates,
                candidate: req?.candidate,
              },
            },
          })
        } else {
          navigate(returnPath, {
            replace: true,
            state: {
              performanceError: hearingRes?.message || jdCopy.scoutHearing.performanceError,
            },
          })
        }
      } catch (err) {
        console.error(err)
        const returnPath = hearingPending.returnPath
          || `/business/scout/candidates/${encodeURIComponent(String(hearingPending.cvId))}`
        navigate(returnPath, {
          replace: true,
          state: {
            performanceError: jdCopy.scoutHearing.performanceErrorRetry,
          },
        })
      } finally {
        setHearingSubmitting(false)
      }
      return
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
  }, [
    jdCopy.marketplaceSaveError,
    jdCopy.scoutHearing.performanceError,
    jdCopy.scoutHearing.performanceErrorRetry,
    navigate,
  ])

  return (
    <>
      <style>{builderPageStyles}</style>
      <div className="business-homepage-shell business-jobs-shell flex h-full min-h-0 flex-col overflow-hidden">
        <div className="business-homepage-ui business-jobs-ui business-app-ui flex min-h-0 flex-1 flex-col overflow-hidden">
          {marketplaceQuickCreateActive ? (
            <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-700 sm:px-5 sm:text-sm">
              {marketplaceSubmitting ? jdCopy.marketplaceSubmitting : jdCopy.marketplaceHint}
            </div>
          ) : null}
          {scoutHearingActive ? (
            <div className="shrink-0 border-b border-[#0077B6]/20 bg-[#e8f4fa] px-4 py-2.5 text-xs text-[#006399] sm:px-5 sm:text-sm">
              {hearingSubmitting ? jdCopy.scoutHearing.submitting : jdCopy.scoutHearing.hint}
            </div>
          ) : null}

          <div className="relative min-h-0 flex-1">
            {loading || hearingSubmitting ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
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
              showNextStepsOnCreate={!marketplaceQuickCreateActive && !scoutHearingActive}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default JobAiBuilderPage
