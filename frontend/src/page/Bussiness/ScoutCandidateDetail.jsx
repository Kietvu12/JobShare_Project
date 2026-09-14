import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom'
import {
  Check, Unlock, Users, Loader2, ArrowLeft, ExternalLink, Download,
} from 'lucide-react'
import ScoutCandidateProfilePanel from '../../component/Bussiness/ScoutCandidateProfilePanel'
import CreditTopUpModal from '../../component/Bussiness/CreditTopUpModal'
import apiService from '../../services/api'
import useBusinessUser from '../../hooks/useBusinessUser'
import {
  buildJobScoreMapFromMatches,
  fetchScoutCvBusinessJobMatches,
} from '../../utils/businessJobAiMatching'
import { highlightSearchText } from '../../utils/searchTextHighlight'
import { getScoutCandidateDetailUrl, getScoutListUrl, resolveScoutEntryMode } from '../../utils/scoutCandidateDetailUrl'
import { setScoutPerformanceHearingPending } from '../../utils/scoutPerformanceHearingPending'
import { downloadScoutOriginalCvFiles } from '../../utils/scoutCvDownload'
import { BUSINESS_UI_FONT, BUSINESS_UI_FONT_IMPORT } from '../../utils/businessUiFont'
import { useLanguage } from '../../context/LanguageContext'
import { getScoutWorkspaceCopy } from '../../i18n/businessApp/scoutWorkspace'
import {
  ScoutUnlockOptionCard,
  ScoutUnlockCompareTable,
  ScoutCreditConfirmModal,
  ScoutPerformanceConfirmModal,
  ScoutPerformanceSuccessModal,
  ScoutAttachJobModal,
  ScoutActionModal,
  ScoutAlternatePromoLine,
  getScoutDisplayName,
  SCOUT_DETAIL_ICON_SM,
  SCOUT_DETAIL_ICON_MD,
} from './Scout'
import ScoutPerformancePipelineBar from '../../component/Bussiness/ScoutPerformancePipelineBar'

const PAGE_FONT = BUSINESS_UI_FONT

const detailPageStyles = `
  ${BUSINESS_UI_FONT_IMPORT}
  .scout-detail-ui {
    --scout-detail-fs-title: 14px;
    --scout-detail-fs-body: 13px;
    --scout-detail-fs-caption: 12px;
    font-size: var(--scout-detail-fs-body);
    line-height: 1.45;
    color: #334155;
  }
  .scout-detail-ui .scout-detail-title {
    font-size: var(--scout-detail-fs-title);
    font-weight: 700;
    line-height: 1.35;
  }
  .scout-detail-ui .scout-detail-body {
    font-size: var(--scout-detail-fs-body);
    line-height: 1.45;
  }
  .scout-detail-ui .scout-detail-caption {
    font-size: var(--scout-detail-fs-caption);
    line-height: 1.4;
  }
  .scout-search-highlight {
    background-color: #fef08a !important;
    color: #92400e !important;
    padding: 0 2px;
    border-radius: 2px;
    font-weight: 600;
  }
`

export default function ScoutCandidateDetail() {
  const { cvId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const selectedJobId = searchParams.get('jobId') || ''
  const performanceRequestId = searchParams.get('performanceRequestId') || ''
  const searchQuery = searchParams.get('search') || ''
  const scoutMode = resolveScoutEntryMode({
    mode: searchParams.get('mode') || '',
    performanceRequestId,
  })
  const { language } = useLanguage()
  const scoutWorkspaceCopy = useMemo(() => getScoutWorkspaceCopy(language), [language])
  const { credit: userCredit, user } = useBusinessUser()

  const [candidate, setCandidate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [credit, setCredit] = useState(userCredit || 0)
  const [scoutCreditCost, setScoutCreditCost] = useState(5)
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [jobScoreById, setJobScoreById] = useState({})
  const [jobScoresLoading, setJobScoresLoading] = useState(false)
  const [performanceDetail, setPerformanceDetail] = useState(null)
  const [performanceDetailLoading, setPerformanceDetailLoading] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [performanceRequesting, setPerformanceRequesting] = useState(false)
  const [attachJobOpen, setAttachJobOpen] = useState(false)
  const [attachJobLoading, setAttachJobLoading] = useState(false)
  const [creditTopUpOpen, setCreditTopUpOpen] = useState(false)
  const [creditTermsAgreed, setCreditTermsAgreed] = useState(false)
  const [performanceTermsAgreed, setPerformanceTermsAgreed] = useState(false)
  const [performanceWantsSimilar, setPerformanceWantsSimilar] = useState(false)
  const [performanceRequirementNote, setPerformanceRequirementNote] = useState('')
  const [performanceSuccess, setPerformanceSuccess] = useState(null)
  const [downloadingCv, setDownloadingCv] = useState(false)
  const [actionModal, setActionModal] = useState({
    open: false,
    kind: null,
    title: '',
    message: '',
    noticeVariant: 'info',
    requestId: null,
    sessionId: null,
  })

  const numericCvId = parseInt(cvId, 10)
  const candidateLoadSeqRef = useRef(0)

  useEffect(() => {
    setCredit(userCredit || 0)
  }, [userCredit])

  useEffect(() => {
    const st = location.state
    if (!st?.performanceSuccess && !st?.performanceError) return

    const clearNavState = () => {
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
    }

    if (st.performanceSuccess) {
      const ps = st.performanceSuccess
      if (ps.candidate) {
        setCandidate({
          ...ps.candidate,
          isUnlocked: true,
          unlockType: 'scout_performance',
          performanceRequest: {
            id: ps.requestId,
            status: ps.candidate?.performanceRequest?.status || 'approved',
            wantsSimilarCandidates: !!ps.wantsSimilarCandidates,
          },
        })
      }
      setPerformanceSuccess({
        requestCode: ps.requestCode,
        sessionId: ps.sessionId,
        requestId: ps.requestId,
        wantsSimilarCandidates: !!ps.wantsSimilarCandidates,
      })
      clearNavState()
      return
    }

    if (st.performanceError) {
      setActionModal({
        open: true,
        kind: 'notice',
        title: 'Gửi yêu cầu thất bại',
        message: st.performanceError,
        noticeVariant: 'error',
      })
      clearNavState()
    }
  }, [location.pathname, location.search, location.state, navigate])

  const loadJobs = useCallback(async () => {
    if (jobs.length > 0) return jobs
    setJobsLoading(true)
    try {
      let currentPage = 1
      let totalPages = 1
      const all = []
      do {
        const res = await apiService.getBusinessJobs({ page: currentPage, limit: 50 })
        if (!res?.success) break
        all.push(...(res.data?.jobs || []))
        totalPages = res.data?.pagination?.totalPages || 0
        currentPage += 1
      } while (currentPage <= totalPages)
      setJobs(all)
      return all
    } catch {
      setJobs([])
      return []
    } finally {
      setJobsLoading(false)
    }
  }, [jobs.length])

  const loadJobScores = useCallback(async () => {
    if (!numericCvId || Number.isNaN(numericCvId) || !user?.id) return
    setJobScoresLoading(true)
    try {
      const matches = await fetchScoutCvBusinessJobMatches(apiService, numericCvId, user.id, { top_k: 50 })
      setJobScoreById(buildJobScoreMapFromMatches(matches))
    } catch (e) {
      console.error(e)
      setJobScoreById({})
    } finally {
      setJobScoresLoading(false)
    }
  }, [numericCvId, user?.id])

  useEffect(() => {
    if (!selectedJobId) return undefined
    let cancelled = false
    ;(async () => {
      await loadJobs()
      if (cancelled) return
    })()
    return () => { cancelled = true }
  }, [selectedJobId, loadJobs])

  useEffect(() => {
    if (!selectedJobId || !numericCvId || Number.isNaN(numericCvId) || !user?.id) return undefined
    let cancelled = false
    setJobScoresLoading(true)
    fetchScoutCvBusinessJobMatches(apiService, numericCvId, user.id, { top_k: 50 })
      .then((matches) => {
        if (!cancelled) setJobScoreById(buildJobScoreMapFromMatches(matches))
      })
      .catch((e) => {
        console.error(e)
        if (!cancelled) setJobScoreById({})
      })
      .finally(() => {
        if (!cancelled) setJobScoresLoading(false)
      })
    return () => { cancelled = true }
  }, [selectedJobId, numericCvId, user?.id])

  const selectedJobMatchScore = useMemo(() => {
    if (!selectedJobId) return null
    const s = jobScoreById[String(selectedJobId)]
    if (s == null || Number(s) <= 0) return null
    return s
  }, [selectedJobId, jobScoreById])

  const needsJobList = attachJobOpen
    || (actionModal.open && actionModal.kind === 'performance-confirm')

  useEffect(() => {
    if (!needsJobList) return undefined
    let cancelled = false
    ;(async () => {
      await loadJobs()
      if (cancelled) return
    })()
    return () => { cancelled = true }
  }, [needsJobList, loadJobs])

  useEffect(() => {
    if (!attachJobOpen) return undefined
    let cancelled = false
    ;(async () => {
      await loadJobScores()
    })()
    return () => { cancelled = true }
  }, [attachJobOpen, loadJobScores])

  const loadCandidate = useCallback(async () => {
    if (!numericCvId || Number.isNaN(numericCvId)) {
      setError('ID hồ sơ không hợp lệ')
      setLoading(false)
      return
    }
    const loadSeq = ++candidateLoadSeqRef.current
    setLoading(true)
    setError('')
    try {
      const res = await apiService.getBusinessScoutCandidateById(numericCvId, {
        search: searchQuery || undefined,
      })
      if (loadSeq !== candidateLoadSeqRef.current) return
      if (res?.success && res.data?.candidate) {
        setCandidate(res.data.candidate)
        if (typeof res.data.scoutCreditCost === 'number') {
          setScoutCreditCost(res.data.scoutCreditCost)
        }
        if (typeof res.data.credit === 'number') {
          setCredit(res.data.credit)
        }
      } else {
        setCandidate(null)
        setError(res?.message || 'Không tải được hồ sơ ứng viên')
      }
    } catch (e) {
      if (loadSeq !== candidateLoadSeqRef.current) return
      console.error(e)
      setCandidate(null)
      setError('Không tải được hồ sơ ứng viên')
    } finally {
      if (loadSeq === candidateLoadSeqRef.current) setLoading(false)
    }
  }, [numericCvId, searchQuery])

  useEffect(() => {
    loadCandidate()
  }, [loadCandidate])

  useEffect(() => {
    if (!performanceRequestId) {
      setPerformanceDetail(null)
      return
    }
    let cancelled = false
    setPerformanceDetailLoading(true)
    apiService.getBusinessScoutPerformanceRequestById(performanceRequestId)
      .then((res) => {
        if (!cancelled && res?.success && res.data?.request) {
          setPerformanceDetail(res.data.request)
          apiService.markBusinessScoutPerformanceRequestViewed(performanceRequestId).catch(() => {})
        }
      })
      .catch(() => {
        if (!cancelled) setPerformanceDetail(null)
      })
      .finally(() => {
        if (!cancelled) setPerformanceDetailLoading(false)
      })
    return () => { cancelled = true }
  }, [performanceRequestId])

  const selectedJob = useMemo(
    () => jobs.find((j) => String(j.id) === String(selectedJobId)) || null,
    [jobs, selectedJobId],
  )

  const isPerformanceUnlock = candidate?.isUnlocked && candidate?.unlockType === 'scout_performance'

  const highlightQuery = searchQuery
  const hl = (text) => highlightSearchText(text, highlightQuery)

  const closeActionModal = () => {
    setPerformanceTermsAgreed(false)
    setPerformanceWantsSimilar(false)
    setPerformanceRequirementNote('')
    setCreditTermsAgreed(false)
    setActionModal({
      open: false, kind: null, title: '', message: '', noticeVariant: 'info', requestId: null, sessionId: null,
    })
  }

  const openNoticeModal = (title, message, noticeVariant = 'info') => {
    setActionModal({ open: true, kind: 'notice', title, message, noticeVariant, requestId: null, sessionId: null })
  }

  const goToWsChat = (sessionId) => {
    if (sessionId) navigate(`/business/messages?tab=ws&sessionId=${sessionId}`)
  }

  const handleUnlockClick = () => {
    if (!candidate?.id || candidate.isUnlocked) return
    if (credit < scoutCreditCost) {
      setCreditTopUpOpen(true)
      return
    }
    setCreditTermsAgreed(false)
    setActionModal({
      open: true,
      kind: 'credit-confirm',
      title: 'Mở hồ sơ bằng Scout Credit',
      message: '',
      noticeVariant: 'info',
    })
  }

  const submitUnlock = async () => {
    if (!candidate?.id || candidate.isUnlocked) return
    setUnlocking(true)
    try {
      const res = await apiService.unlockBusinessScoutCandidate(candidate.id)
      if (res?.success && res.data?.candidate) {
        setCandidate(res.data.candidate)
        if (typeof res.data.credit === 'number') {
          setCredit(res.data.credit)
          if (user) {
            localStorage.setItem('user', JSON.stringify({ ...user, credit: res.data.credit }))
          }
        }
        closeActionModal()
        openNoticeModal('Đã mở hồ sơ', res.message || 'Bạn có thể xem email, SĐT và thông tin liên hệ đầy đủ.', 'success')
      } else {
        openNoticeModal('Mở hồ sơ thất bại', res?.message || 'Không thể mở liên hệ ứng viên.', 'error')
      }
    } catch (e) {
      console.error(e)
      openNoticeModal('Mở hồ sơ thất bại', 'Không thể mở liên hệ ứng viên. Vui lòng thử lại.', 'error')
    } finally {
      setUnlocking(false)
    }
  }

  const handlePerformanceRequestClick = () => {
    if (!candidate?.id) return
    if (candidate.isUnlocked && candidate.unlockType !== 'scout_performance') return
    if (candidate.unlockType === 'scout_performance') return
    setPerformanceTermsAgreed(false)
    setPerformanceWantsSimilar(false)
    setPerformanceRequirementNote('')
    setActionModal({
      open: true,
      kind: 'performance-confirm',
      title: 'Mở hồ sơ bằng Scout Performance',
      message: '',
      noticeVariant: 'info',
    })
  }

  const updateScoutModeInUrl = useCallback((targetMode) => {
    if (!candidate?.id) return
    const url = getScoutCandidateDetailUrl(candidate.id, {
      jobId: selectedJobId || undefined,
      search: searchQuery || undefined,
      performanceRequestId: targetMode === 'performance' ? performanceRequestId : undefined,
      mode: targetMode,
    })
    navigate(url, { replace: true })
  }, [candidate?.id, selectedJobId, searchQuery, performanceRequestId, navigate])

  const switchToManagedScoutOnDetail = () => {
    updateScoutModeInUrl('performance')
    handlePerformanceRequestClick()
  }

  const switchToCreditScoutOnDetail = () => {
    updateScoutModeInUrl('credit')
    handleUnlockClick()
  }

  const switchToManagedScoutFromCreditModal = () => {
    closeActionModal()
    switchToManagedScoutOnDetail()
  }

  const switchToCreditScoutFromPerformanceModal = () => {
    closeActionModal()
    switchToCreditScoutOnDetail()
  }

  const handleQuickCreateJdForHearing = useCallback(({ requirementNote, wantsSimilar }) => {
    if (!candidate?.id) return
    setScoutPerformanceHearingPending({
      cvId: candidate.id,
      returnPath: getScoutCandidateDetailUrl(candidate.id, {
        jobId: selectedJobId || undefined,
        search: searchQuery || undefined,
        mode: scoutMode || 'performance',
      }),
      wantsSimilarCandidates: !!wantsSimilar,
      message: requirementNote?.trim() || undefined,
    })
    closeActionModal()
    navigate('/business/jobs/create?from=scout-performance-hearing')
  }, [candidate?.id, selectedJobId, searchQuery, scoutMode, navigate])

  const submitPerformanceUnlock = async (payload = {}) => {
    if (!candidate?.id) return
    if (candidate.isUnlocked && candidate.unlockType !== 'scout_performance') return
    if (candidate.unlockType === 'scout_performance') return

    setPerformanceRequesting(true)
    try {
      const res = await apiService.createBusinessScoutPerformanceRequest(candidate.id, {
        jobId: payload.jobId || selectedJobId || undefined,
        jobTitle: payload.jobTitle || selectedJob?.title || undefined,
        wantsSimilarCandidates: payload.wantsSimilarCandidates ?? performanceWantsSimilar,
        message: payload.message || performanceRequirementNote || undefined,
      })
      if (res?.success) {
        const req = res.data?.request
        const updated = req?.candidate
        const nomination = req?.nomination
        if (updated) {
          setCandidate({
            ...updated,
            isUnlocked: true,
            unlockType: 'scout_performance',
            performanceRequest: {
              id: req?.id,
              status: req?.status || 'approved',
              wantsSimilarCandidates: !!req?.wantsSimilarCandidates,
            },
          })
        }
        closeActionModal()
        setPerformanceSuccess({
          requestCode: req?.requestCode,
          sessionId: req?.sessionId,
          requestId: req?.id,
          wantsSimilarCandidates: !!req?.wantsSimilarCandidates,
          nominationCreated: !!nomination,
          nominationAlreadyExists: !!nomination?.alreadyExists,
          nominationJobTitle: nomination?.job?.title || selectedJob?.title || '',
        })
        loadCandidate()
      } else {
        openNoticeModal('Gửi yêu cầu thất bại', res?.message || 'Không thể gửi yêu cầu Scout Performance.', 'error')
      }
    } catch (e) {
      console.error(e)
      openNoticeModal('Gửi yêu cầu thất bại', 'Không thể gửi yêu cầu Scout Performance. Vui lòng thử lại.', 'error')
    } finally {
      setPerformanceRequesting(false)
    }
  }

  const handleAttachToJob = async ({ jobId, note }) => {
    if (!candidate?.id || !jobId) return
    setAttachJobLoading(true)
    try {
      const res = await apiService.attachScoutCandidateToJob(candidate.id, { jobId, note })
      if (res?.success) {
        setAttachJobOpen(false)
        openNoticeModal(
          res.data?.alreadyExists ? 'Đã có đơn tiến cử' : 'Đã tạo đơn tiến cử',
          res.message || (res.data?.alreadyExists
            ? `Ứng viên đã có đơn tiến cử cho JD "${res.data?.job?.title || ''}".`
            : `Đã tạo đơn tiến cử cho hồ sơ này vào JD "${res.data?.job?.title || ''}".`),
          'success',
        )
      } else {
        openNoticeModal('Tạo đơn tiến cử thất bại', res?.message || 'Không thể tạo đơn tiến cử.', 'error')
      }
    } catch (e) {
      console.error(e)
      openNoticeModal('Tạo đơn tiến cử thất bại', 'Không thể tạo đơn tiến cử.', 'error')
    } finally {
      setAttachJobLoading(false)
    }
  }

  const skipSimilarCandidates = () => {
    const sessionId = actionModal.sessionId
    closeActionModal()
    goToWsChat(sessionId)
  }

  const confirmSimilarCandidates = async () => {
    const { requestId, sessionId } = actionModal
    if (!requestId) {
      closeActionModal()
      return
    }
    setPerformanceRequesting(true)
    try {
      const res = await apiService.requestSimilarScoutPerformanceCandidates(requestId, {})
      closeActionModal()
      if (res?.success) {
        setCandidate((prev) => (prev ? {
          ...prev,
          performanceRequest: {
            ...(prev.performanceRequest || {}),
            id: requestId,
            status: 'approved',
            wantsSimilarCandidates: true,
          },
        } : prev))
        goToWsChat(sessionId || res.data?.request?.sessionId)
      } else {
        openNoticeModal('Gửi yêu cầu thất bại', res?.message || 'Không thể gửi yêu cầu tìm ứng viên tương tự.', 'error')
      }
    } catch (e) {
      console.error(e)
      openNoticeModal('Gửi yêu cầu thất bại', 'Không thể gửi yêu cầu tìm ứng viên tương tự.', 'error')
    } finally {
      setPerformanceRequesting(false)
    }
  }

  const isScoutCreditUnlock = candidate?.isUnlocked
    && !isPerformanceUnlock
    && (candidate?.unlockType === 'scout_credit' || !candidate?.unlockType)

  const canShowUnlockOptions = Boolean(candidate?.id) && !candidate.isUnlocked
  const showUnlockCompareTable = canShowUnlockOptions && !scoutMode
  const showDualServiceCards = canShowUnlockOptions && !scoutMode && !performanceDetail
  const showCreditUnlockCard = canShowUnlockOptions && !performanceDetail
    && (showDualServiceCards || scoutMode === 'credit')
  const showManagedUnlockCard = canShowUnlockOptions && !performanceDetail
    && (showDualServiceCards || scoutMode === 'performance')
  const showCreditStickyUnlock = canShowUnlockOptions && scoutMode === 'credit' && !showCreditUnlockCard
  const showManagedSoftPromo = canShowUnlockOptions && scoutMode === 'credit'
    && !showCreditUnlockCard
  const hasPerformanceRequest = candidate?.unlockType === 'scout_performance'
    || Boolean(candidate?.performanceRequest?.id)
  const showManagedStickyCta = canShowUnlockOptions && scoutMode === 'performance'
    && !hasPerformanceRequest && !showManagedUnlockCard
  const showPerformancePipeline = (scoutMode === 'performance' || isPerformanceUnlock)
    && candidate?.performancePipeline

  const handleDownloadOriginalCv = async () => {
    if (!candidate?.id || downloadingCv) return
    setDownloadingCv(true)
    try {
      const count = await downloadScoutOriginalCvFiles(apiService, candidate.id)
      openNoticeModal(
        'Đã bắt đầu tải CV',
        count > 1 ? `Đang tải ${count} file CV gốc.` : 'Đang tải file CV gốc.',
        'success',
      )
    } catch (e) {
      if (e?.code === 'NO_ORIGINAL_CV' || e?.message === 'NO_ORIGINAL_CV') {
        openNoticeModal('Không có CV gốc', 'Hồ sơ này chưa có file CV gốc để tải.', 'error')
      } else {
        openNoticeModal('Tải CV thất bại', e?.message || 'Không thể tải CV gốc. Vui lòng thử lại.', 'error')
      }
    } finally {
      setDownloadingCv(false)
    }
  }

  const backToScoutUrl = useMemo(() => getScoutListUrl({
    jobId: selectedJobId,
    performanceRequestId,
    mode: scoutMode || undefined,
  }), [selectedJobId, performanceRequestId, scoutMode])

  return (
    <>
      <style>{detailPageStyles}</style>
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#f4f6f8]" style={{ fontFamily: PAGE_FONT }}>
        <div className="w-full shrink-0 border-b border-slate-200/80 bg-white px-3 py-2.5 sm:px-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => navigate(backToScoutUrl)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Quay lại Scout
            </button>
            <a
              href={backToScoutUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#0077B6] hover:underline"
            >
              Mở danh sách Scout
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3 lg:p-4">
          {loading && !candidate ? (
            <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-20 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#0077B6]" />
              <span className="text-sm">Đang tải hồ sơ...</span>
            </div>
          ) : error || !candidate ? (
            <div className="w-full rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
              <p className="text-sm font-semibold text-slate-800">{error || 'Không tìm thấy hồ sơ'}</p>
              <button
                type="button"
                onClick={() => navigate(backToScoutUrl)}
                className="mt-4 rounded-lg bg-[#0077B6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#006399]"
              >
                Về danh sách Scout
              </button>
            </div>
          ) : (
            <div className="scout-detail-ui flex w-full flex-col gap-3 lg:gap-4">
              {(performanceDetailLoading) && (
                <div className="scout-detail-caption text-slate-500">Đang tải gợi ý WS...</div>
              )}

              {performanceDetail?.recommendations?.length > 0 && (
                <div className="w-full rounded-xl border border-blue-100 bg-[#e8f4fa] p-3 sm:p-4">
                  <div className="scout-detail-title mb-2 text-[#006399]">
                    Gợi ý từ JobShare WS ({performanceDetail.recommendations.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {performanceDetail.recommendations.map((rec) => {
                      const c = rec.candidate
                      if (!c) return null
                      const active = Number(c.id) === Number(candidate.id)
                      return (
                        <a
                          key={rec.id}
                          href={`/business/scout/candidates/${c.id}?performanceRequestId=${performanceRequestId}&mode=performance`}
                          target="_blank"
                          rel="noreferrer"
                          className={`scout-detail-body rounded-md px-2.5 py-2 no-underline ${
                            active
                              ? 'border border-[#0077B6] bg-white text-slate-800'
                              : 'border border-[#e8f4fa] bg-[#f8fafc] text-slate-700 hover:bg-white'
                          }`}
                        >
                          <div className="font-bold">{c.name || c.code || `CV #${c.id}`}</div>
                          <div className="text-slate-500">{c.desiredPosition || '—'}</div>
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              {showPerformancePipeline ? (
                <ScoutPerformancePipelineBar
                  pipeline={candidate.performancePipeline}
                  language={language}
                  onViewApplications={() => navigate('/business/applications')}
                />
              ) : null}

              <ScoutCandidateProfilePanel
                candidate={candidate}
                highlightQuery={highlightQuery}
                className="scout-detail-ui w-full"
                showLockedHint={!candidate.isUnlocked}
                hideContact={
                  !candidate.isUnlocked
                  || (candidate.unlockType === 'scout_performance' && !candidate.performanceContactReleased)
                }
                matchScore={selectedJobMatchScore}
                matchJobTitle={selectedJob?.title || null}
                accessLabel={candidate.isUnlocked
                  ? (isPerformanceUnlock ? 'Hồ sơ đã mở — Scout Ủy Thác' : 'Hồ sơ đã mở — thông tin đầy đủ')
                  : undefined}
                accessLabelColor={isPerformanceUnlock ? '#0077B6' : '#047857'}
              />

              {showUnlockCompareTable ? (
                <ScoutUnlockCompareTable />
              ) : null}

              {showCreditUnlockCard || showManagedUnlockCard ? (
                <div
                  className={`grid w-full grid-cols-1 items-stretch gap-3 ${
                    showCreditUnlockCard && showManagedUnlockCard ? 'md:grid-cols-2' : ''
                  }`.trim()}
                >
                  {showCreditUnlockCard ? (
                    <div className="flex h-full flex-col">
                      <ScoutUnlockOptionCard
                        icon={Unlock}
                        iconWrapClass="bg-[#f3e8ff]"
                        title="Scout Trực Tiếp"
                        subtitle={`Credit hiện có: ${credit}`}
                        description="Dùng credit để mở ngay email, SĐT và thông tin liên hệ."
                        footer={(
                          <div className="flex items-baseline gap-1">
                            <div className="scout-detail-title text-lg text-slate-800">{scoutCreditCost}</div>
                            <div className="scout-detail-body font-semibold text-slate-500">credit</div>
                          </div>
                        )}
                        buttonLabel="Mở liên hệ ứng viên"
                        loadingLabel="Đang mở..."
                        onClick={handleUnlockClick}
                        disabled={credit < scoutCreditCost}
                        loading={unlocking}
                      />
                      <ScoutAlternatePromoLine
                        promo={scoutWorkspaceCopy.modals.credit.alternateScoutPromo}
                        onSwitch={switchToManagedScoutOnDetail}
                        className="mt-2 px-0.5"
                      />
                    </div>
                  ) : null}

                  {showManagedUnlockCard ? (
                    <div className="flex h-full flex-col">
                      <ScoutUnlockOptionCard
                        icon={Users}
                        title="Scout Ủy Thác"
                        subtitle="Nhờ WS tiếp cận thay bạn"
                        description="WS chủ động tiếp cận ứng viên, xác nhận mức độ quan tâm và hỗ trợ kết nối phù hợp."
                        footer={(
                          <p className="scout-detail-caption font-semibold text-slate-500">
                            Không tốn credit. Phí tuyển dụng tương ứng với kinh nghiệm và năng lực của ứng viên
                          </p>
                        )}
                        buttonLabel={
                          candidate?.unlockType === 'scout_performance'
                            ? 'Đã gửi yêu cầu WS'
                            : 'Uỷ thác WS tiếp cận ứng viên (Recommend)'
                        }
                        loadingLabel="Đang gửi yêu cầu..."
                        onClick={handlePerformanceRequestClick}
                        disabled={
                          (candidate?.isUnlocked && candidate?.unlockType !== 'scout_performance')
                          || candidate?.unlockType === 'scout_performance'
                        }
                        loading={performanceRequesting}
                      />
                      <ScoutAlternatePromoLine
                        promo={scoutWorkspaceCopy.modals.performance.alternateScoutPromo}
                        onSwitch={switchToCreditScoutOnDetail}
                        className="mt-2 px-0.5"
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              {showManagedSoftPromo ? (
                <div className="w-full rounded-lg border border-slate-100 bg-slate-50/90 px-3 py-2.5 text-xs text-slate-600">
                  Chưa tự tin tự liên hệ ứng viên?{' '}
                  <button
                    type="button"
                    onClick={handlePerformanceRequestClick}
                    className="font-semibold text-[#0077B6] underline decoration-[#0077B6]/30 underline-offset-2 hover:text-[#006399]"
                  >
                    Nhờ WS hỗ trợ tiếp cận →
                  </button>
                </div>
              ) : null}

              {showManagedStickyCta ? (
                <div className="sticky bottom-0 z-20 -mx-2.5 border-t border-slate-200 bg-white/95 px-2.5 py-2.5 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:-mx-3 sm:px-3 lg:static lg:mx-0 lg:border lg:rounded-xl lg:shadow-sm">
                  <button
                    type="button"
                    onClick={handlePerformanceRequestClick}
                    disabled={
                      performanceRequesting
                      || (candidate?.isUnlocked && candidate?.unlockType !== 'scout_performance')
                      || candidate?.unlockType === 'scout_performance'
                    }
                    className="scout-detail-body w-full rounded-xl bg-[#0077B6] py-3 font-bold text-white hover:bg-[#006399] disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {performanceRequesting
                      ? 'Đang gửi yêu cầu...'
                      : candidate?.unlockType === 'scout_performance'
                        ? 'Đã gửi yêu cầu WS'
                        : 'Ủy thác WS'}
                  </button>
                  <p className="scout-detail-caption mt-1.5 text-center text-slate-500">
                    Không tốn Credit · Phí giới thiệu khi tuyển thành công
                  </p>
                </div>
              ) : null}

              {showCreditStickyUnlock ? (
                <div className="sticky bottom-0 z-20 -mx-2.5 border-t border-slate-200 bg-white/95 px-2.5 py-2.5 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:-mx-3 sm:px-3 lg:static lg:mx-0 lg:border lg:rounded-xl lg:shadow-sm">
                  <button
                    type="button"
                    onClick={handleUnlockClick}
                    disabled={credit < scoutCreditCost || unlocking}
                    className="scout-detail-body w-full rounded-xl bg-[#0077B6] py-3 font-bold text-white hover:bg-[#006399] disabled:cursor-not-allowed disabled:bg-[#94c5e0]"
                  >
                    {unlocking ? 'Đang mở...' : `Mở thông tin liên hệ – ${scoutCreditCost} Credit`}
                  </button>
                  <p className="scout-detail-caption mt-1.5 text-center text-slate-500">
                    Số dư: {credit} credit
                    {credit >= scoutCreditCost ? ` · Còn lại sau mở: ${credit - scoutCreditCost}` : ' · Chưa đủ credit'}
                  </p>
                </div>
              ) : null}

              {isScoutCreditUnlock && (
                <div className="w-full rounded-xl border border-emerald-100 bg-[#ecfdf5] p-3 sm:p-4">
                  <div className="scout-detail-title mb-2 flex items-center gap-1.5 text-[#047857]">
                    <Check {...SCOUT_DETAIL_ICON_MD} color="#047857" aria-hidden />
                    Đã mở hồ sơ bằng Scout Trực Tiếp
                  </div>
                  <div className="flex flex-col gap-1.5 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setAttachJobOpen(true)}
                      className="scout-detail-body flex-1 rounded-lg bg-[#0077B6] py-2 font-semibold text-white hover:bg-[#006399]"
                    >
                      Tạo đơn tiến cử cho hồ sơ này
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadOriginalCv}
                      disabled={downloadingCv}
                      className="scout-detail-body inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#0077B6]/35 bg-white py-2 font-semibold text-[#0077B6] hover:bg-[#e8f4fa]/60 disabled:opacity-60"
                    >
                      {downloadingCv ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      {downloadingCv ? 'Đang tải...' : 'Tải CV gốc'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/business/applications')}
                      className="scout-detail-body flex-1 rounded-lg border border-slate-200 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Xem Quản lý tiến cử
                    </button>
                  </div>
                </div>
              )}

              {isPerformanceUnlock && (
                <div className="w-full rounded-xl border border-blue-100 bg-[#e8f4fa] p-3 sm:p-4">
                  <div className="scout-detail-title mb-2 flex items-center gap-1.5 text-[#006399]">
                    <Check {...SCOUT_DETAIL_ICON_MD} color="#006399" aria-hidden />
                    Scout Ủy Thác — đang theo dõi tiến độ
                  </div>
                  <div className="flex flex-col gap-1.5 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => navigate('/business/applications')}
                      className="scout-detail-body flex-1 rounded-lg bg-[#0077B6] py-2 font-semibold text-white hover:bg-[#006399]"
                    >
                      Quản lý ứng viên
                    </button>
                    {candidate.performanceContactReleased ? (
                      <button
                        type="button"
                        onClick={handleDownloadOriginalCv}
                        disabled={downloadingCv}
                        className="scout-detail-body inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#0077B6]/35 bg-white py-2 font-semibold text-[#0077B6] hover:bg-[#e8f4fa]/60 disabled:opacity-60"
                      >
                        {downloadingCv ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        {downloadingCv ? 'Đang tải...' : 'Tải CV gốc'}
                      </button>
                    ) : (
                      <p className="scout-detail-caption flex flex-1 items-center text-slate-600">
                        Liên hệ & CV sẽ mở sau khi WS tiến cử vào JD.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ScoutPerformanceConfirmModal
        open={actionModal.open && actionModal.kind === 'performance-confirm'}
        onClose={closeActionModal}
        onConfirm={submitPerformanceUnlock}
        onQuickCreateJd={handleQuickCreateJdForHearing}
        onAlternateScoutSwitch={switchToCreditScoutFromPerformanceModal}
        hideAlternatePromo={scoutMode === 'performance'}
        loading={performanceRequesting}
        agreed={performanceTermsAgreed}
        onAgreedChange={setPerformanceTermsAgreed}
        jobs={jobs}
        initialJobId={selectedJobId}
        wantsSimilar={performanceWantsSimilar}
        onWantsSimilarChange={setPerformanceWantsSimilar}
        requirementNote={performanceRequirementNote}
        onRequirementNoteChange={setPerformanceRequirementNote}
      />

      <ScoutPerformanceSuccessModal
        open={!!performanceSuccess}
        requestCode={performanceSuccess?.requestCode}
        sessionId={performanceSuccess?.sessionId}
        requestId={performanceSuccess?.requestId}
        wantsSimilarCandidates={performanceSuccess?.wantsSimilarCandidates}
        nominationCreated={performanceSuccess?.nominationCreated}
        nominationAlreadyExists={performanceSuccess?.nominationAlreadyExists}
        nominationJobTitle={performanceSuccess?.nominationJobTitle}
        onClose={() => setPerformanceSuccess(null)}
        onGoApplications={() => {
          setPerformanceSuccess(null)
          navigate('/business/applications')
        }}
        onGoChat={() => {
          const sid = performanceSuccess?.sessionId
          setPerformanceSuccess(null)
          goToWsChat(sid)
        }}
      />

      <ScoutAttachJobModal
        open={attachJobOpen}
        onClose={() => setAttachJobOpen(false)}
        jobs={jobs}
        jobScoreById={jobScoreById}
        loading={attachJobLoading || jobsLoading || jobScoresLoading}
        onSubmit={handleAttachToJob}
        candidateName={candidate?.name || getScoutDisplayName(candidate)}
      />

      <CreditTopUpModal
        open={creditTopUpOpen}
        onClose={() => setCreditTopUpOpen(false)}
        currentCredit={credit}
        onSuccess={() => {
          setCreditTopUpOpen(false)
          apiService.getBusinessCredit().then((res) => {
            if (res?.success && typeof res.data?.credit === 'number') {
              setCredit(res.data.credit)
              if (user) {
                localStorage.setItem('user', JSON.stringify({ ...user, credit: res.data.credit }))
              }
            }
          }).catch(() => {})
        }}
      />

      <ScoutCreditConfirmModal
        open={actionModal.open && actionModal.kind === 'credit-confirm'}
        onClose={closeActionModal}
        onConfirm={submitUnlock}
        onAlternateScoutSwitch={switchToManagedScoutFromCreditModal}
        loading={unlocking}
        agreed={creditTermsAgreed}
        onAgreedChange={setCreditTermsAgreed}
        creditCost={scoutCreditCost}
      />

      <ScoutActionModal
        open={
          actionModal.open
          && actionModal.kind !== 'performance-confirm'
          && actionModal.kind !== 'credit-confirm'
        }
        kind={actionModal.kind}
        title={actionModal.title}
        message={actionModal.message}
        noticeVariant={actionModal.noticeVariant}
        onClose={
          actionModal.kind === 'similar-candidates-prompt' ? skipSimilarCandidates : closeActionModal
        }
        onConfirm={
          actionModal.kind === 'similar-candidates-prompt'
            ? confirmSimilarCandidates
            : closeActionModal
        }
        loading={
          actionModal.kind === 'similar-candidates-prompt' ? performanceRequesting : unlocking
        }
        confirmLabel={
          actionModal.kind === 'similar-candidates-prompt'
            ? 'Có'
            : 'Xác nhận'
        }
        cancelLabel={actionModal.kind === 'similar-candidates-prompt' ? 'Không' : 'Hủy'}
      />
    </>
  )
}
