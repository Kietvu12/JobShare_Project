import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Loader2, MessageSquare, User, X } from 'lucide-react'
import apiService from '../../services/api'
import NominationChat from '../Chat/NominationChat'
import ScoutCandidateProfilePanel from './ScoutCandidateProfilePanel'
import ApplicationInterviewScheduleModal from './ApplicationInterviewScheduleModal'
import { isApplicationProfileOnly } from '../../utils/businessApplicationSource'
import { downloadApplicationOriginalCvFiles } from '../../utils/scoutCvDownload'
import {
  PROFILE_EVALUATION,
  buildInterviewReminderMemo,
  formatInterviewReminderLabel,
  resolveProfileEvaluation,
} from '../../utils/businessApplicationEvaluation'
import { useLanguage } from '../../context/LanguageContext'
import { getJobApplicationStatusLabelByLanguage } from '../../utils/jobApplicationStatus'
import { getApplicationProfileReviewCopy } from '../../i18n/businessApp/applications'

import { BUSINESS_UI_FONT } from '../../utils/businessUiFont'

const BRAND = '#0077B6'
const STATUS_SCREENING = 5
const STATUS_WAITING_INTERVIEW = 8
const STATUS_REJECTED_CLIENT = 6
const WS_PRE_NOMINATION_STATUSES = new Set([2, 3, 4])

function resolveInitialDrawerTab(app) {
  if (!app) return 'chat'
  if (isApplicationProfileOnly(app)) return 'profile'
  if (app.canViewFullProfile) return 'profile'
  return 'chat'
}

function getProfilePanelMeta(app) {
  if (app?.sourceType === 'scout_credit') {
    return {
      accessLabel: 'Hồ sơ đầy đủ (Scout Credit)',
      accessLabelColor: BRAND,
      footerNote: null,
    }
  }
  if (app?.sourceType === 'scout_performance') {
    return {
      accessLabel: 'Hồ sơ Scout Performance',
      accessLabelColor: '#f59e0b',
      footerNote: null,
    }
  }
  return {
    accessLabel: 'Hồ sơ đầy đủ (tiến cử Sàn CTV)',
    accessLabelColor: BRAND,
    footerNote: app?.candidateProfile?.scoutStillLocked
      ? 'Doanh nghiệp xem được hồ sơ nhờ tiến cử Sàn CTV. Trên Scout vẫn hiển thị khóa cho đến khi mở bằng credit.'
      : null,
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
  const [selectedApp, setSelectedApp] = useState(applicationProp || null)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [drawerTab, setDrawerTab] = useState('chat')
  const [downloadingCv, setDownloadingCv] = useState(false)
  const [cvDownloadNotice, setCvDownloadNotice] = useState('')
  const [evaluationUpdating, setEvaluationUpdating] = useState(false)
  const [interviewModalOpen, setInterviewModalOpen] = useState(false)
  const [interviewSaving, setInterviewSaving] = useState(false)
  const [evaluationNotice, setEvaluationNotice] = useState('')
  const [failModalOpen, setFailModalOpen] = useState(false)
  const [failReason, setFailReason] = useState('')

  const reviewCopy = useMemo(
    () => getApplicationProfileReviewCopy(language),
    [language],
  )

  const applicationStatus = Number(selectedApp?.status)
  const isWsPreNomination = selectedApp?.sourceType === 'scout_performance'
    && WS_PRE_NOMINATION_STATUSES.has(applicationStatus)
  const canShowProfileReview = applicationStatus === STATUS_SCREENING && !isWsPreNomination

  const profileOnly = useMemo(
    () => isApplicationProfileOnly(selectedApp),
    [selectedApp],
  )

  const showProfileView = profileOnly || Boolean(selectedApp?.canViewFullProfile)
  const showChatTab = !profileOnly && selectedApp?.hasNominationChat !== false

  const profileMeta = useMemo(() => getProfilePanelMeta(selectedApp), [selectedApp])
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
  }, [selectedApp?.id])

  const applyApplicationPatch = useCallback((patch) => {
    setSelectedApp((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  const handleStatusUpdated = useCallback(() => {
    if (selectedApp?.id) loadApplicationDetail(selectedApp.id)
    onStatusUpdated?.()
  }, [selectedApp?.id, loadApplicationDetail, onStatusUpdated])

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
      if (!res?.success) throw new Error(res?.message || 'Không thể cập nhật đánh giá')
      applyApplicationPatch({
        status: STATUS_REJECTED_CLIENT,
        statusLabel: getJobApplicationStatusLabelByLanguage(STATUS_REJECTED_CLIENT, language),
        statusCategory: 'rejected',
        rejectNote: note || null,
      })
      setFailModalOpen(false)
      setEvaluationNotice(reviewCopy.fail)
      handleStatusUpdated()
    } catch (e) {
      setEvaluationNotice(e?.message || 'Không thể cập nhật đánh giá.')
    } finally {
      setEvaluationUpdating(false)
    }
  }, [
    selectedApp?.id,
    evaluationUpdating,
    failReason,
    applyApplicationPatch,
    language,
    handleStatusUpdated,
    reviewCopy.fail,
  ])

  const handleInterviewScheduleSubmit = useCallback(async ({ date, time }) => {
    if (!selectedApp?.id || interviewSaving) return
    const wasAlreadyPass = profileEvaluation === PROFILE_EVALUATION.PASS
    setInterviewSaving(true)
    setEvaluationNotice('')
    try {
      const dateTime = new Date(`${date}T${time}`)
      if (Number.isNaN(dateTime.getTime())) {
        throw new Error('Ngày giờ phỏng vấn không hợp lệ')
      }
      const memo = buildInterviewReminderMemo({ date, time, language })
      const res = await apiService.updateBusinessApplicationStatus(selectedApp.id, {
        status: STATUS_WAITING_INTERVIEW,
        interviewDate: dateTime.toISOString(),
        memo,
      })
      if (!res?.success) throw new Error(res?.message || 'Không thể lưu lịch phỏng vấn')

      applyApplicationPatch({
        status: STATUS_WAITING_INTERVIEW,
        statusLabel: getJobApplicationStatusLabelByLanguage(STATUS_WAITING_INTERVIEW, language),
        statusCategory: 'interview',
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
        wasAlreadyPass
          ? 'Đã cập nhật lịch phỏng vấn.'
          : 'Đã đánh giá: Đạt — đã tạo lịch phỏng vấn.',
      )
      handleStatusUpdated()
    } catch (e) {
      setEvaluationNotice(e?.message || 'Không thể lưu lịch phỏng vấn.')
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
  ])

  const handleDownloadOriginalCv = useCallback(async () => {
    if (!selectedApp?.id || downloadingCv) return
    setCvDownloadNotice('')
    setDownloadingCv(true)
    try {
      const count = await downloadApplicationOriginalCvFiles(apiService, selectedApp.id)
      setCvDownloadNotice(count > 1 ? `Đang tải ${count} file CV gốc.` : 'Đang tải file CV gốc.')
    } catch (e) {
      if (e?.code === 'NO_ORIGINAL_CV' || e?.message === 'NO_ORIGINAL_CV') {
        setCvDownloadNotice('Hồ sơ này chưa có file CV gốc để tải.')
      } else {
        setCvDownloadNotice(e?.message || 'Không thể tải CV gốc. Vui lòng thử lại.')
      }
    } finally {
      setDownloadingCv(false)
    }
  }, [selectedApp?.id, downloadingCv])

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
        {downloadingCv ? 'Đang tải...' : 'Tải CV gốc'}
      </button>
      {cvDownloadNotice ? (
        <p className={`biz-ui-caption max-w-[10rem] text-right ${cvDownloadNotice.includes('Không') || cvDownloadNotice.includes('chưa') ? 'text-amber-700' : 'text-emerald-700'}`}>
          {cvDownloadNotice}
        </p>
      ) : null}
    </div>
  ) : null

  const profileReviewBar = canShowProfileReview ? (
    <div className="sticky top-0 z-10 shrink-0 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="biz-ui-body font-bold text-slate-900">{reviewCopy.title}</p>
      <p className="biz-ui-caption mt-0.5 text-slate-500">
        {selectedApp.statusLabel || getJobApplicationStatusLabelByLanguage(STATUS_SCREENING, language)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={evaluationUpdating || drawerLoading}
          onClick={() => handleEvaluationChange(PROFILE_EVALUATION.PASS)}
          className="biz-ui-caption rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {reviewCopy.pass}
        </button>
        <button
          type="button"
          disabled={evaluationUpdating || drawerLoading}
          onClick={() => handleEvaluationChange(PROFILE_EVALUATION.FAIL)}
          className="biz-ui-caption rounded-lg border border-rose-200 bg-white px-3 py-1.5 font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {reviewCopy.fail}
        </button>
        {evaluationUpdating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0077B6]" aria-hidden />
        ) : null}
      </div>
      {evaluationNotice ? (
        <p className="biz-ui-caption mt-2 text-[#006399]">{evaluationNotice}</p>
      ) : null}
    </div>
  ) : null

  if (!open || !selectedApp) return null

  const activeTab = profileOnly ? 'profile' : drawerTab

  return (
    <div
      className="fixed inset-0 z-50 flex bg-slate-900/40 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="business-app-ui ml-auto flex h-full flex-col border-l border-slate-200 bg-white shadow-2xl"
        style={{ width: 'min(100vw, 560px)', fontFamily: BUSINESS_UI_FONT }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 justify-end border-b border-slate-200 bg-white px-3 py-2">
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-slate-100">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {showProfileView && showChatTab && (
          <div className="flex shrink-0 border-b border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setDrawerTab('profile')}
              className={`biz-ui-body flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 font-semibold transition-colors ${
                activeTab === 'profile' ? 'border-[#0077B6] text-[#0077B6]' : 'border-transparent text-slate-500'
              }`}
            >
              <User className="h-3.5 w-3.5" /> Hồ sơ ứng viên
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab('chat')}
              className={`biz-ui-body flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 font-semibold transition-colors ${
                activeTab === 'chat' ? 'border-[#0077B6] text-[#0077B6]' : 'border-transparent text-slate-500'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" /> Chat 3 bên
            </button>
          </div>
        )}

        {isWsPreNomination ? (
          <div className="biz-ui-caption shrink-0 border-b border-amber-100 bg-amber-50 px-4 py-2 text-amber-900">
            {reviewCopy.wsTrackingOnly}
          </div>
        ) : null}

        {profileReviewBar}

        {drawerLoading && (
          <div className="biz-ui-caption flex items-center gap-2 border-b border-slate-100 bg-[#e8f4fa]/40 px-4 py-2 text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0077B6]" /> Đang tải hồ sơ...
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {activeTab === 'profile' && showProfileView ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-3 business-homepage-scroll">
                {selectedApp.interviewDate ? (
                  <div className="mb-3 rounded-xl border border-amber-100 bg-amber-50/80 p-3">
                    <div className="biz-ui-caption font-bold text-amber-900">Nhắc lịch phỏng vấn</div>
                    <p className="biz-ui-body mt-1 text-amber-950">
                      {formatInterviewReminderLabel(selectedApp.interviewDate, language)}
                    </p>
                    {profileEvaluation === PROFILE_EVALUATION.PASS ? (
                      <button
                        type="button"
                        onClick={() => setInterviewModalOpen(true)}
                        className="biz-ui-caption mt-2 font-semibold text-[#0077B6] hover:underline"
                      >
                        Sửa lịch phỏng vấn
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {drawerLoading && !profileCandidate ? (
                  <div className="biz-ui-body flex items-center justify-center gap-2 py-12 text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin text-[#0077B6]" /> Đang tải hồ sơ...
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
              mobileHeaderName={selectedApp.candidateName || 'Chat 3 bên'}
              mobileHeaderAvatar={(selectedApp.candidateName || '?').charAt(0).toUpperCase()}
              onStatusUpdated={handleStatusUpdated}
              disableBusinessFreeStatusChange
            />
          ) : (
            <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-xs text-slate-400">
              Không có nội dung hiển thị.
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
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
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
    </div>
  )
}
