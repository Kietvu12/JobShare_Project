import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Loader2, MessageSquare, Sparkles, User, X } from 'lucide-react'
import apiService from '../../services/api'
import NominationChat from '../Chat/NominationChat'
import ScoutCandidateProfilePanel from './ScoutCandidateProfilePanel'
import ApplicationInterviewScheduleModal from './ApplicationInterviewScheduleModal'
import BusinessApplicationStatusSelect from './BusinessApplicationStatusSelect.jsx'
import { isApplicationProfileOnly } from '../../utils/businessApplicationSource'
import {
  changeBusinessApplicationStatus,
  getBusinessApplicationPortalStatusOptions,
} from '../../utils/businessApplicationStatusChange'
import { downloadApplicationOriginalCvFiles } from '../../utils/scoutCvDownload'
import {
  PROFILE_EVALUATION,
  buildInterviewReminderMemo,
  formatInterviewReminderLabel,
  resolveProfileEvaluation,
} from '../../utils/businessApplicationEvaluation'
import { useLanguage } from '../../context/LanguageContext'
import { getJobApplicationStatus } from '../../utils/jobApplicationStatus'
import {
  buildBusinessStatusPatch,
  isWsManagedPreNomination,
} from '../../utils/businessApplicationStatusFlow'
import {
  getApplicationDrawerCopy,
  getApplicationProfileReviewCopy,
  getApplicationSimilarCandidatesCopy,
  getApplicationSourceLabel,
} from '../../i18n/businessApp/applications'
import useBusinessAppCopy from '../../hooks/useBusinessAppCopy'

import {
  BUSINESS_HOMEPAGE_TYPOGRAPHY_STYLES,
  BUSINESS_HP_TEXT,
  BUSINESS_UI_FONT,
} from '../../utils/businessHomepageTypography.js'

const BRAND = '#0077B6'
const STATUS_SCREENING = 5
const STATUS_WAITING_INTERVIEW = 8
const STATUS_REJECTED_CLIENT = 6
const STATUS_HEARING_DECLINED = 4

function isClosedStatus(status) {
  if (Number(status) === 1) return false
  const category = getJobApplicationStatus(status).category
  return category === 'rejected' || category === 'cancelled'
}

function resolveInitialDrawerTab(app) {
  if (!app) return 'chat'
  if (isApplicationProfileOnly(app)) return 'profile'
  if (app.canViewFullProfile) return 'profile'
  return 'chat'
}

function getProfilePanelMeta(app, drawerCopy) {
  const access = drawerCopy?.profileAccess || {}
  if (app?.sourceType === 'scout_credit') {
    return {
      accessLabel: access.scoutCredit,
      accessLabelColor: BRAND,
      footerNote: null,
    }
  }
  if (app?.sourceType === 'scout_performance') {
    return {
      accessLabel: access.scoutPerformance,
      accessLabelColor: '#f59e0b',
      footerNote: null,
    }
  }
  return {
    accessLabel: access.ctvMarketplace,
    accessLabelColor: BRAND,
    footerNote: app?.candidateProfile?.scoutStillLocked ? access.ctvScoutLockedNote : null,
  }
}

function buildProfileCandidate(app, profile) {
  if (!profile) return null
  return {
    ...profile,
    name: profile.name || app?.candidateName,
    isUnlocked: true,
  }
}

async function hydrateApplicationProfile(app) {
  if (!app?.id) return app
  const needsProfile = isApplicationProfileOnly(app) || app.canViewFullProfile
  if (!needsProfile || app.candidateProfile) {
    return {
      ...app,
      canViewFullProfile: Boolean(app.canViewFullProfile || isApplicationProfileOnly(app)),
    }
  }

  try {
    const cvRes = await apiService.getBusinessApplicationCv(app.id)
    const cv = cvRes?.data?.cv
    if (cvRes?.success && cv) {
      return {
        ...app,
        canViewFullProfile: true,
        candidateProfile: {
          ...cv,
          isUnlocked: true,
        },
      }
    }
  } catch {
    // keep application row data
  }

  return {
    ...app,
    canViewFullProfile: Boolean(app.canViewFullProfile || isApplicationProfileOnly(app)),
  }
}

export default function BusinessApplicationDetailDrawer({
  open,
  application: applicationProp,
  onClose,
  onStatusUpdated,
}) {
  const { language } = useLanguage()
  const copy = useBusinessAppCopy()
  const navigate = useNavigate()
  const [selectedApp, setSelectedApp] = useState(applicationProp || null)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [drawerTab, setDrawerTab] = useState('chat')
  const [downloadingCv, setDownloadingCv] = useState(false)
  const [cvDownloadNotice, setCvDownloadNotice] = useState('')
  const [cvDownloadNoticeKind, setCvDownloadNoticeKind] = useState(null)
  const [evaluationUpdating, setEvaluationUpdating] = useState(false)
  const [interviewModalOpen, setInterviewModalOpen] = useState(false)
  const [interviewSaving, setInterviewSaving] = useState(false)
  const [evaluationNotice, setEvaluationNotice] = useState('')
  const [failModalOpen, setFailModalOpen] = useState(false)
  const [failReason, setFailReason] = useState('')
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [statusChangeError, setStatusChangeError] = useState('')
  const [similarModalOpen, setSimilarModalOpen] = useState(false)
  const [similarSubmitting, setSimilarSubmitting] = useState(false)
  const [similarNotice, setSimilarNotice] = useState(null)
  const similarPromptedRef = useRef(new Set())

  const drawerCopy = copy.applications.drawer || getApplicationDrawerCopy(language)

  const reviewCopy = useMemo(
    () => getApplicationProfileReviewCopy(language),
    [language],
  )

  const similarCopy = useMemo(
    () => getApplicationSimilarCandidatesCopy(language),
    [language],
  )

  const portalStatusOptions = useMemo(
    () => getBusinessApplicationPortalStatusOptions(language, selectedApp?.status, selectedApp?.sourceType),
    [language, selectedApp?.status, selectedApp?.sourceType],
  )

  const applicationStatus = Number(selectedApp?.status)
  const isWsPreNomination = isWsManagedPreNomination(selectedApp?.sourceType, applicationStatus)
  const canShowProfileReview = applicationStatus === STATUS_SCREENING && !isWsPreNomination

  const performanceRequest = selectedApp?.performanceRequest || null
  const canSuggestSimilar = selectedApp?.sourceType === 'scout_performance'
    && Boolean(performanceRequest?.id)
    && performanceRequest?.canRequestSimilar !== false
    && !performanceRequest?.wantsSimilarCandidates
  const showSimilarBanner = canSuggestSimilar && isClosedStatus(applicationStatus)

  const profileOnly = useMemo(
    () => isApplicationProfileOnly(selectedApp),
    [selectedApp],
  )

  const showProfileView = profileOnly || Boolean(selectedApp?.canViewFullProfile)
  const showChatTab = !profileOnly && selectedApp?.hasNominationChat !== false

  const profileMeta = useMemo(
    () => getProfilePanelMeta(selectedApp, drawerCopy),
    [selectedApp, drawerCopy],
  )
  const profileCandidate = useMemo(
    () => buildProfileCandidate(selectedApp, selectedApp?.candidateProfile),
    [selectedApp],
  )

  const profileEvaluation = useMemo(
    () => resolveProfileEvaluation(selectedApp),
    [selectedApp],
  )

  const loadApplicationDetail = useCallback(async (appId) => {
    if (!appId) return
    setDrawerLoading(true)
    try {
      const res = await apiService.getBusinessApplicationById(appId)
      if (res?.success && res.data?.application) {
        const hydrated = await hydrateApplicationProfile(res.data.application)
        setSelectedApp(hydrated)
        setDrawerTab(resolveInitialDrawerTab(hydrated))
      }
    } catch {
      // keep list row data
    } finally {
      setDrawerLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open || !applicationProp?.id) {
      if (!open) {
        setSelectedApp(null)
        setDrawerTab('chat')
      }
      return
    }

    let mounted = true
    const boot = async () => {
      setDrawerLoading(true)
      setSelectedApp(applicationProp)
      setDrawerTab(resolveInitialDrawerTab(applicationProp))

      try {
        const res = await apiService.getBusinessApplicationById(applicationProp.id)
        let nextApp = res?.success && res.data?.application
          ? res.data.application
          : applicationProp
        nextApp = await hydrateApplicationProfile(nextApp)
        if (mounted) {
          setSelectedApp(nextApp)
          setDrawerTab(resolveInitialDrawerTab(nextApp))
        }
      } catch {
        if (mounted) {
          const fallback = await hydrateApplicationProfile(applicationProp)
          setSelectedApp(fallback)
          setDrawerTab(resolveInitialDrawerTab(fallback))
        }
      } finally {
        if (mounted) setDrawerLoading(false)
      }
    }

    boot()
    return () => { mounted = false }
  }, [open, applicationProp])

  useEffect(() => {
    setCvDownloadNotice('')
    setEvaluationNotice('')
    setFailModalOpen(false)
    setFailReason('')
    setStatusChangeError('')
    setSimilarModalOpen(false)
    setSimilarNotice(null)
  }, [selectedApp?.id])

  const promptSimilarCandidates = useCallback(() => {
    if (!selectedApp?.id) return
    similarPromptedRef.current.add(selectedApp.id)
    setSimilarModalOpen(true)
  }, [selectedApp?.id])

  useEffect(() => {
    if (!open || drawerLoading || !selectedApp?.id) return
    if (applicationStatus !== STATUS_HEARING_DECLINED || !canSuggestSimilar) return
    if (similarPromptedRef.current.has(selectedApp.id)) return
    promptSimilarCandidates()
  }, [open, drawerLoading, selectedApp?.id, applicationStatus, canSuggestSimilar, promptSimilarCandidates])

  const confirmSimilarCandidates = useCallback(async () => {
    const requestId = performanceRequest?.id
    if (!requestId || similarSubmitting) return
    setSimilarSubmitting(true)
    try {
      const res = await apiService.requestSimilarScoutPerformanceCandidates(requestId, {})
      if (!res?.success) throw new Error(res?.message || similarCopy.error)
      setSelectedApp((prev) => (prev ? {
        ...prev,
        performanceRequest: {
          ...(prev.performanceRequest || {}),
          wantsSimilarCandidates: true,
          canRequestSimilar: false,
        },
      } : prev))
      setSimilarModalOpen(false)
      setSimilarNotice({
        kind: 'success',
        text: res.message || similarCopy.requested,
        sessionId: res.data?.request?.sessionId || null,
      })
    } catch (e) {
      setSimilarNotice({ kind: 'error', text: e?.message || similarCopy.error })
    } finally {
      setSimilarSubmitting(false)
    }
  }, [performanceRequest?.id, similarSubmitting, similarCopy])

  const applyApplicationPatch = useCallback((patch) => {
    setSelectedApp((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  const handleStatusUpdated = useCallback(() => {
    if (selectedApp?.id) loadApplicationDetail(selectedApp.id)
    onStatusUpdated?.()
  }, [selectedApp?.id, loadApplicationDetail, onStatusUpdated])

  const handleDrawerStatusChange = useCallback(async (newStatus) => {
    if (!selectedApp?.id || statusUpdating) return
    setStatusChangeError('')
    setStatusUpdating(true)
    try {
      const result = await changeBusinessApplicationStatus(
        apiService,
        selectedApp.id,
        newStatus,
        selectedApp.status,
        portalStatusOptions,
        language,
      )
      if (result.skipped) return
      if (!result.success) {
        setStatusChangeError(result.message || drawerCopy.statusUpdateError)
        return
      }
      if (result.patch) {
        applyApplicationPatch(result.patch)
      }
      if (canSuggestSimilar && isClosedStatus(newStatus)) promptSimilarCandidates()
      handleStatusUpdated()
    } catch (e) {
      setStatusChangeError(e?.message || drawerCopy.statusUpdateError)
    } finally {
      setStatusUpdating(false)
    }
  }, [
    selectedApp?.id,
    selectedApp?.status,
    statusUpdating,
    portalStatusOptions,
    applyApplicationPatch,
    canSuggestSimilar,
    promptSimilarCandidates,
    handleStatusUpdated,
    drawerCopy.statusUpdateError,
    language,
  ])

  const handleEvaluationChange = useCallback(async (nextEvaluation) => {
    if (!selectedApp?.id || evaluationUpdating) return

    if (nextEvaluation === PROFILE_EVALUATION.PASS) {
      setEvaluationNotice('')
      setInterviewModalOpen(true)
      return
    }

    if (nextEvaluation === PROFILE_EVALUATION.FAIL) {
      setFailModalOpen(true)
    }
  }, [
    selectedApp?.id,
    evaluationUpdating,
  ])

  const confirmProfileFail = useCallback(async () => {
    if (!selectedApp?.id || evaluationUpdating) return
    setEvaluationNotice('')
    setEvaluationUpdating(true)
    try {
      const note = failReason.trim()
      const res = await apiService.updateBusinessApplicationStatus(selectedApp.id, {
        status: STATUS_REJECTED_CLIENT,
        rejectNote: note || undefined,
      })
      if (!res?.success) throw new Error(res?.message || drawerCopy.evaluationUpdateErrorShort)
      applyApplicationPatch({
        ...buildBusinessStatusPatch(STATUS_REJECTED_CLIENT, selectedApp.sourceType, language),
        rejectNote: note || null,
      })
      setFailModalOpen(false)
      setEvaluationNotice(reviewCopy.fail)
      if (canSuggestSimilar) promptSimilarCandidates()
      handleStatusUpdated()
    } catch (e) {
      setEvaluationNotice(e?.message || drawerCopy.evaluationUpdateError)
    } finally {
      setEvaluationUpdating(false)
    }
  }, [
    selectedApp?.id,
    selectedApp?.sourceType,
    evaluationUpdating,
    failReason,
    applyApplicationPatch,
    language,
    canSuggestSimilar,
    promptSimilarCandidates,
    handleStatusUpdated,
    reviewCopy.fail,
    drawerCopy.evaluationUpdateError,
    drawerCopy.evaluationUpdateErrorShort,
  ])

  const handleInterviewScheduleSubmit = useCallback(async ({ date, time }) => {
    if (!selectedApp?.id || interviewSaving) return
    const wasAlreadyPass = profileEvaluation === PROFILE_EVALUATION.PASS
    setInterviewSaving(true)
    setEvaluationNotice('')
    try {
      const dateTime = new Date(`${date}T${time}`)
      if (Number.isNaN(dateTime.getTime())) {
        throw new Error(drawerCopy.invalidInterviewDateTime)
      }
      const memo = buildInterviewReminderMemo({ date, time, language })
      const res = await apiService.updateBusinessApplicationStatus(selectedApp.id, {
        status: STATUS_WAITING_INTERVIEW,
        interviewDate: dateTime.toISOString(),
        memo,
      })
      if (!res?.success) throw new Error(res?.message || drawerCopy.saveInterviewError)

      applyApplicationPatch({
        ...buildBusinessStatusPatch(STATUS_WAITING_INTERVIEW, selectedApp.sourceType, language),
        interviewDate: dateTime.toISOString(),
      })

      try {
        await apiService.createBusinessMessage({
          jobApplicationId: selectedApp.id,
          content: memo,
          type: 'system',
        })
      } catch {
        /* optional chat sync */
      }

      setInterviewModalOpen(false)
      setEvaluationNotice(
        wasAlreadyPass ? drawerCopy.interviewUpdated : drawerCopy.interviewPassScheduled,
      )
      handleStatusUpdated()
    } catch (e) {
      setEvaluationNotice(e?.message || drawerCopy.saveInterviewError)
    } finally {
      setInterviewSaving(false)
    }
  }, [
    selectedApp?.id,
    interviewSaving,
    profileEvaluation,
    applyApplicationPatch,
    language,
    handleStatusUpdated,
    drawerCopy,
  ])

  const handleDownloadOriginalCv = useCallback(async () => {
    if (!selectedApp?.id || downloadingCv) return
    setCvDownloadNotice('')
    setCvDownloadNoticeKind(null)
    setDownloadingCv(true)
    try {
      const count = await downloadApplicationOriginalCvFiles(apiService, selectedApp.id)
      setCvDownloadNotice(
        count > 1 ? drawerCopy.cvDownloadingMany(count) : drawerCopy.cvDownloadingOne,
      )
      setCvDownloadNoticeKind('success')
    } catch (e) {
      if (e?.code === 'NO_ORIGINAL_CV' || e?.message === 'NO_ORIGINAL_CV') {
        setCvDownloadNotice(drawerCopy.cvNoFile)
      } else {
        setCvDownloadNotice(e?.message || drawerCopy.cvDownloadError)
      }
      setCvDownloadNoticeKind('warning')
    } finally {
      setDownloadingCv(false)
    }
  }, [selectedApp?.id, downloadingCv, drawerCopy])

  const canDownloadCv = Boolean(selectedApp?.canViewFullProfile || profileOnly)

  const cvDownloadAction = canDownloadCv ? (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDownloadOriginalCv}
        disabled={downloadingCv || drawerLoading}
        className="biz-ui-caption inline-flex items-center gap-1 rounded-md border border-[#0077B6]/35 bg-[#e8f4fa]/50 px-2 py-1 font-semibold text-[#0077B6] transition hover:bg-[#e8f4fa] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {downloadingCv ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Download className="h-3 w-3" />
        )}
        {downloadingCv ? drawerCopy.downloading : drawerCopy.downloadOriginalCv}
      </button>
      {cvDownloadNotice ? (
        <p className={`biz-ui-caption max-w-[10rem] text-right ${cvDownloadNoticeKind === 'warning' ? 'text-amber-700' : 'text-emerald-700'}`}>
          {cvDownloadNotice}
        </p>
      ) : null}
    </div>
  ) : null

  const passEvaluationSelected = profileEvaluation === PROFILE_EVALUATION.PASS
  const failEvaluationSelected = profileEvaluation === PROFILE_EVALUATION.FAIL

  const profileReviewBar = canShowProfileReview ? (
    <div className="sticky top-0 z-10 shrink-0 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="biz-ui-body min-w-0 flex-1 font-bold text-slate-900">{reviewCopy.title}</p>
        <div className="flex shrink-0 items-center gap-2" role="group" aria-label={reviewCopy.title}>
            <button
              type="button"
              disabled={evaluationUpdating || drawerLoading}
              aria-pressed={passEvaluationSelected}
              onClick={() => handleEvaluationChange(PROFILE_EVALUATION.PASS)}
              className={`biz-ui-caption rounded-lg border px-2.5 py-1.5 font-semibold whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-60 sm:px-3 ${
                passEvaluationSelected
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                  : 'border-emerald-500 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              {reviewCopy.passSwitch || reviewCopy.pass}
            </button>
            <button
              type="button"
              disabled={evaluationUpdating || drawerLoading}
              aria-pressed={failEvaluationSelected}
              onClick={() => handleEvaluationChange(PROFILE_EVALUATION.FAIL)}
              className={`biz-ui-caption rounded-lg border px-2.5 py-1.5 font-semibold whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-60 sm:px-3 ${
                failEvaluationSelected
                  ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                  : 'border-rose-500 bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              {reviewCopy.failSwitch || reviewCopy.fail}
            </button>
          {evaluationUpdating ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#0077B6]" aria-hidden />
          ) : null}
        </div>
      </div>
      {evaluationNotice ? (
        <p className="biz-ui-caption mt-2 text-[#006399]">{evaluationNotice}</p>
      ) : null}
    </div>
  ) : null

  const drawerHeaderBar = (
    <div className="sticky top-0 z-20 shrink-0 border-b border-slate-200 bg-white shadow-sm">
      <div className="relative px-4 pb-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-2 z-10 rounded-lg p-1.5 transition-colors hover:bg-slate-100"
          aria-label={drawerCopy.close}
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>
        <div className="pr-10">
          <label
            htmlFor="business-application-drawer-status"
            className="biz-ui-caption mb-1.5 block font-semibold text-slate-600"
          >
            {copy.applications.table.status}
            {selectedApp?.sourceType ? (
              <span className="ml-1.5 font-normal text-slate-400">
                · {getApplicationSourceLabel(selectedApp.sourceType, language)}
              </span>
            ) : null}
          </label>
          <BusinessApplicationStatusSelect
            id="business-application-drawer-status"
            status={selectedApp?.status}
            statusCategory={selectedApp?.statusCategory}
            statusLabel={selectedApp?.statusLabel}
            statusOptions={portalStatusOptions}
            onChange={handleDrawerStatusChange}
            updating={statusUpdating}
            disabled={drawerLoading || isWsPreNomination}
          />
          {statusChangeError ? (
            <p className="biz-ui-caption mt-1.5 text-rose-600">{statusChangeError}</p>
          ) : null}
        </div>
      </div>
    </div>
  )

  if (!open || !selectedApp) return null

  const activeTab = profileOnly ? 'profile' : drawerTab

  return (
    <>
      <style>{BUSINESS_HOMEPAGE_TYPOGRAPHY_STYLES}</style>
      <div
        className="fixed inset-0 z-50 flex bg-slate-900/40 backdrop-blur-[1px]"
        onClick={onClose}
      >
      <div
        className="business-app-ui ml-auto flex h-full flex-col border-l border-slate-200 bg-white shadow-2xl"
        style={{ width: 'min(100vw, 560px)', fontFamily: BUSINESS_UI_FONT }}
        onClick={(e) => e.stopPropagation()}
      >
        {drawerHeaderBar}

        {showProfileView && showChatTab && (
          <div className="flex shrink-0 border-b border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setDrawerTab('profile')}
              className={`biz-ui-body flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 font-semibold transition-colors ${
                activeTab === 'profile' ? 'border-[#0077B6] text-[#0077B6]' : 'border-transparent text-slate-500'
              }`}
            >
              <User className="h-3.5 w-3.5" /> {drawerCopy.tabProfile}
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab('chat')}
              className={`biz-ui-body flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 font-semibold transition-colors ${
                activeTab === 'chat' ? 'border-[#0077B6] text-[#0077B6]' : 'border-transparent text-slate-500'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" /> {drawerCopy.tabChat}
            </button>
          </div>
        )}

        {isWsPreNomination ? (
          <div className="biz-ui-caption shrink-0 border-b border-amber-100 bg-amber-50 px-4 py-2 text-amber-900">
            {reviewCopy.wsTrackingOnly}
          </div>
        ) : null}

        {showSimilarBanner ? (
          <div className="shrink-0 border-b border-[#cce5f0] bg-[#e8f4fa]/70 px-4 py-2.5">
            <p className="biz-ui-caption font-bold text-[#006399]">{similarCopy.bannerTitle}</p>
            <p className="biz-ui-caption mt-0.5 text-slate-600">{similarCopy.bannerBody}</p>
            <button
              type="button"
              onClick={promptSimilarCandidates}
              className="biz-ui-caption mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#0077B6] px-3 py-1.5 font-semibold text-white hover:bg-[#006399]"
            >
              <Sparkles className="h-3.5 w-3.5" /> {similarCopy.confirm}
            </button>
          </div>
        ) : null}

        {similarNotice ? (
          <div
            className={`biz-ui-caption shrink-0 border-b px-4 py-2 ${
              similarNotice.kind === 'error'
                ? 'border-rose-100 bg-rose-50 text-rose-700'
                : 'border-emerald-100 bg-emerald-50 text-emerald-800'
            }`}
          >
            {similarNotice.text}
            {similarNotice.kind === 'success' ? (
              <button
                type="button"
                onClick={() => navigate(
                  similarNotice.sessionId
                    ? `/business/messages?tab=ws&wsView=chat&sessionId=${similarNotice.sessionId}`
                    : '/business/messages?tab=ws',
                )}
                className="ml-2 font-semibold text-[#0077B6] hover:underline"
              >
                {similarCopy.openChat}
              </button>
            ) : null}
          </div>
        ) : null}

        {profileReviewBar}

        {drawerLoading && (
          <div className="biz-ui-caption flex items-center gap-2 border-b border-slate-100 bg-[#e8f4fa]/40 px-4 py-2 text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0077B6]" /> {drawerCopy.loadingProfile}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {activeTab === 'profile' && showProfileView ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-3 business-homepage-scroll">
                {selectedApp.interviewDate ? (
                  <div className="mb-3 rounded-xl border border-amber-100 bg-amber-50/80 p-3">
                    <div className="biz-ui-caption font-bold text-amber-900">{drawerCopy.interviewReminderTitle}</div>
                    <p className="biz-ui-body mt-1 text-amber-950">
                      {formatInterviewReminderLabel(selectedApp.interviewDate, language)}
                    </p>
                    {profileEvaluation === PROFILE_EVALUATION.PASS ? (
                      <button
                        type="button"
                        onClick={() => setInterviewModalOpen(true)}
                        className="biz-ui-caption mt-2 font-semibold text-[#0077B6] hover:underline"
                      >
                        {drawerCopy.editInterviewSchedule}
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {drawerLoading && !profileCandidate ? (
                  <div className="biz-ui-body flex items-center justify-center gap-2 py-12 text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin text-[#0077B6]" /> {drawerCopy.loadingProfile}
                  </div>
                ) : (
                  <ScoutCandidateProfilePanel
                    candidate={profileCandidate}
                    treatAsUnlocked
                    hideContact={false}
                    accessLabel={profileMeta.accessLabel}
                    accessLabelColor={profileMeta.accessLabelColor}
                    footerNote={profileMeta.footerNote}
                    nameActions={cvDownloadAction}
                  />
                )}
              </div>
            </div>
          ) : showChatTab ? (
            <NominationChat
              jobApplicationId={selectedApp.id}
              userType="business"
              currentStatus={selectedApp.status}
              cvStorageId={selectedApp.cvStorageId || selectedApp.cvId || null}
              introCandidateName={selectedApp.candidateName || '—'}
              introJobTitle={selectedApp.jobTitle || '—'}
              mobileHeaderName={selectedApp.candidateName || drawerCopy.chatFallbackTitle}
              mobileHeaderAvatar={(selectedApp.candidateName || '?').charAt(0).toUpperCase()}
              onStatusUpdated={handleStatusUpdated}
              disableBusinessFreeStatusChange
            />
          ) : (
            <div className={`flex flex-1 items-center justify-center px-4 py-8 text-center text-slate-400 ${BUSINESS_HP_TEXT.caption}`}>
              {drawerCopy.emptyContent}
            </div>
          )}
        </div>
      </div>

      <ApplicationInterviewScheduleModal
        open={interviewModalOpen}
        onClose={() => setInterviewModalOpen(false)}
        onSubmit={handleInterviewScheduleSubmit}
        loading={interviewSaving}
        candidateName={selectedApp.candidateName}
      />

      {failModalOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => !evaluationUpdating && setFailModalOpen(false)}
        >
          <div
            className="business-app-ui w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-xl sm:p-5"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="profile-fail-title"
          >
            <h4 id="profile-fail-title" className="biz-ui-body font-bold text-slate-900">
              {reviewCopy.failConfirmTitle}
            </h4>
            <p className="biz-ui-caption mt-1 text-slate-600">{reviewCopy.failConfirmBody}</p>
            <textarea
              value={failReason}
              onChange={(e) => setFailReason(e.target.value)}
              placeholder={reviewCopy.failReasonPlaceholder}
              rows={3}
              className="biz-ui-body mt-3 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-[#0077B6] focus:ring-1 focus:ring-[#0077B6]"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={evaluationUpdating}
                onClick={() => setFailModalOpen(false)}
                className="biz-ui-caption rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {reviewCopy.cancel}
              </button>
              <button
                type="button"
                disabled={evaluationUpdating}
                onClick={confirmProfileFail}
                className="biz-ui-caption inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {evaluationUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {reviewCopy.confirmFail}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {similarModalOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => !similarSubmitting && setSimilarModalOpen(false)}
        >
          <div
            className="business-app-ui w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-xl sm:p-5"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="similar-candidates-title"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f4fa]">
                <Sparkles className="h-4 w-4 text-[#0077B6]" />
              </div>
              <div className="min-w-0">
                <h4 id="similar-candidates-title" className="biz-ui-body font-bold text-slate-900">
                  {similarCopy.modalTitle}
                </h4>
                <p className="biz-ui-caption mt-1 text-slate-600">
                  {applicationStatus === STATUS_HEARING_DECLINED ? similarCopy.modalBodyHearing : similarCopy.modalBodyFail}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={similarSubmitting}
                onClick={() => setSimilarModalOpen(false)}
                className="biz-ui-caption rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {similarCopy.later}
              </button>
              <button
                type="button"
                disabled={similarSubmitting}
                onClick={confirmSimilarCandidates}
                className="biz-ui-caption inline-flex items-center gap-1.5 rounded-lg bg-[#0077B6] px-3 py-1.5 font-semibold text-white hover:bg-[#006399] disabled:opacity-60"
              >
                {similarSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {similarCopy.confirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </>
  )
}
