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
import { BUSINESS_UI_TYPOGRAPHY_STYLES } from '../../utils/businessUiFont'

const BUSINESS_JOBS_FONT =
  "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif"

const builderPageStyles = `
  ${BUSINESS_UI_TYPOGRAPHY_STYLES}
  .business-jobs-shell {
    height: 100%;
    min-height: 0;
    font-family: ${BUSINESS_JOBS_FONT};
  }
  .business-jobs-ui {
    height: 100%;
    min-height: 0;
    --jd-fs-title: 14px;
    --jd-fs-body: 13px;
    --jd-icon: 16px;
    --jd-icon-hit: 32px;
  }
  @media (min-width: 640px) {
    .business-jobs-ui {
      --jd-fs-title: 15px;
      --jd-fs-body: 14px;
    }
  }
  @media (min-width: 1536px) {
    .business-jobs-ui {
      --jd-fs-title: 16px;
      --jd-fs-body: 14px;
      --jd-icon: 17px;
      --jd-icon-hit: 34px;
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
    --jobs-jd-extra: 0.92;
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
      transform: scale(calc(var(--jobs-jd-zoom, 1) * var(--jobs-jd-extra, 0.92)));
      transform-origin: top left;
    }
  }
  @media (min-width: 1024px) and (max-width: 1535px) {
    .business-jobs-ui .business-jd-preview-root {
      --jobs-jd-extra: 0.88;
    }
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
              performanceError: hearingRes?.message || 'Không thể gửi yêu cầu Scout Ủy Thác.',
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
            performanceError: 'Không thể gửi yêu cầu Scout Ủy Thác. Vui lòng thử lại.',
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
  }, [jdCopy.marketplaceSaveError, navigate])

  return (
    <>
      <style>{builderPageStyles}</style>
      <div className="business-jobs-shell flex h-full min-h-0 flex-col overflow-hidden bg-white">
        <div className="business-jobs-ui business-app-ui flex min-h-0 flex-1 flex-col overflow-hidden">
          {marketplaceQuickCreateActive ? (
            <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {marketplaceSubmitting ? jdCopy.marketplaceSubmitting : jdCopy.marketplaceHint}
            </div>
          ) : null}
          {scoutHearingActive ? (
            <div className="shrink-0 border-b border-[#0077B6]/20 bg-[#e8f4fa] px-3 py-2 text-sm text-[#006399]">
              {hearingSubmitting
                ? 'Đang gửi yêu cầu Scout Ủy Thác...'
                : 'Bạn đang tạo JD cho Scout Ủy Thác. Chat với AI để hoàn thiện JD — sau khi lưu, hệ thống sẽ tự gửi yêu cầu hearing.'}
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
