import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronRight, MapPin, Clock,
  Award, Hash, Calendar, Users, Sparkles, BarChart3, TrendingUp,
  Info, DollarSign, ArrowRight, User, Search, Star, Building2, FileText,
  UserPlus, Loader2, Pencil,
} from 'lucide-react'
import apiService from '../../services/api'
import {
  fetchAllBusinessScoutCandidates,
  fetchJobScoutAiMatches,
  mergeScoutCandidateWithMatch,
  summarizeAiMatches,
} from '../../utils/businessJobAiMatching'
import {
  fetchJobRecruitmentMetrics,
} from '../../utils/businessJobRecruitmentMetrics'
import {
  BusinessJobDetailLongView,
} from '../../utils/businessJobDetailView'
import BusinessApplicationDetailDrawer from '../../component/Bussiness/BusinessApplicationDetailDrawer'
import JobDetailNominationsPanel from '../../component/Bussiness/JobDetailNominationsPanel'
import {
  AiMatchOverviewCard,
  HealthOverviewGrid,
  pickShortSkillLabels,
  SERVICE_ICON_MAP,
  ServicesActivityOverview,
  TopCandidatesOverview,
} from '../../component/Bussiness/BusinessJobDetailOverview'
import { useLanguage } from '../../context/LanguageContext'
import { localizeApplications } from '../../utils/businessApplicationDisplay'
import { getRecruitmentRating } from '../../utils/businessJobRecruitmentMetrics'
import {
  BUSINESS_HOMEPAGE_PAGE_BASE_STYLES,
  BUSINESS_HP_TEXT,
  BUSINESS_UI_FONT,
} from '../../utils/businessHomepageTypography.js'

const BASE_TABS = ['Tổng quan', 'Mô tả công việc']
const AI_TAB = 'AI gợi ý'

const JOB_DETAIL_OUTLINE_BTN_CLASS =
  `inline-flex w-full items-center justify-center rounded-lg border border-[#0077B6] bg-white px-3 py-2 text-center leading-snug text-[#0077B6] transition duration-200 hover:-translate-y-px hover:bg-[#0077B6] hover:text-white hover:shadow-md hover:shadow-[#0077B6]/25 ${BUSINESS_HP_TEXT.button}`

const JOB_DETAIL_ACTION_BTN_GROUP_CLASS =
  'grid w-full min-w-0 grid-cols-2 gap-1.5 sm:w-auto sm:min-w-[26rem]'

const RECRUITMENT_TYPE_LABELS = {
  1: 'Full-time',
  2: 'Hợp đồng có thời hạn',
  3: 'Phái cử',
  4: 'Bán thời gian',
  5: 'Uỷ thác',
}

/** Trạng thái WS trước khi vào pipeline tuyển chọn chung (Scout Ủy Thác) */
const PRE_NOMINATION_PIPELINE_STATUSES = new Set([2, 3, 4])

function MetaItem({ icon: Icon, children }) {
  const text = String(children ?? '').trim()
  if (!text || text === '—') return null
  return (
    <span className={`inline-flex items-center gap-1 text-slate-600 ${BUSINESS_HP_TEXT.body}`}>
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      {text}
    </span>
  )
}

function jobDetailTabButtonClass(active) {
  return [
    `relative flex-shrink-0 px-4 py-3 transition-colors sm:px-5 sm:py-3.5 ${BUSINESS_HP_TEXT.button}`,
    active ? 'text-[#0077B6]' : 'text-slate-500 hover:text-slate-700',
  ].join(' ')
}

function JobDetailPageTabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <nav
      className={`flex overflow-x-auto scrollbar-hide border-b border-slate-200/90 ${className}`}
      aria-label="Phân vùng chi tiết JD"
    >
      {tabs.map((tab) => {
        const active = activeTab === tab
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            aria-current={active ? 'page' : undefined}
            className={jobDetailTabButtonClass(active)}
          >
            {tab}
            {active ? (
              <span
                className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#0077B6] sm:inset-x-4"
                aria-hidden
              />
            ) : null}
          </button>
        )
      })}
    </nav>
  )
}

function JobDetailTitleRow({ title, onEdit, variant = 'page' }) {
  const headingClass =
    variant === 'embedded'
      ? 'biz-jd-title inline-flex max-w-full min-w-0 items-center gap-1 sm:gap-1.5'
      : `inline-flex max-w-full min-w-0 items-center gap-1 leading-tight sm:gap-1.5 ${BUSINESS_HP_TEXT.title}`
  return (
    <h1 className={headingClass}>
      <span className="min-w-0 truncate">{title}</span>
      <button
        type="button"
        onClick={onEdit}
        className="-mt-px inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-[#0077B6]/10 hover:text-[#0077B6]"
        aria-label="Sửa JD"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </h1>
  )
}

const jobDetailPageStyles = `
  ${BUSINESS_HOMEPAGE_PAGE_BASE_STYLES}
  .business-jobs-shell {
    height: 100%;
    min-height: 0;
    font-family: ${BUSINESS_UI_FONT};
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
  .biz-jd-page-column {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }
  .biz-jd-scroll-main {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
`

function getJobStatusMeta(status) {
  const n = Number(status)
  if (n === 1) return { label: 'Đang tuyển', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' }
  if (n === 0) return { label: 'Nháp', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' }
  if (n === 4) return { label: 'Tạm dừng', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' }
  if (n === 2 || n === 3) return { label: 'Đã đóng', color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' }
  return { label: 'Không xác định', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' }
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('vi-VN')
}

const JobDetail = ({ embedded = false, jobId: jobIdProp }) => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { jobId: jobIdParam } = useParams()
  const jobId = jobIdProp ?? jobIdParam
  const [activeTab, setActiveTab] = useState('Tổng quan')
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [matchLoading, setMatchLoading] = useState(false)
  const [matchError, setMatchError] = useState('')
  const [scoutTotal, setScoutTotal] = useState(0)
  const [matchSummary, setMatchSummary] = useState(null)
  const [topCandidates, setTopCandidates] = useState([])
  const [recruitmentMetrics, setRecruitmentMetrics] = useState(null)
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [jobNominations, setJobNominations] = useState([])
  const [nominationsLoading, setNominationsLoading] = useState(false)
  const [selectedNomination, setSelectedNomination] = useState(null)
  const [nominationDrawerOpen, setNominationDrawerOpen] = useState(false)
  const metricsPeriodDays = 7

  const loadJob = useCallback(async () => {
    if (!jobId) return
    setLoading(true)
    try {
      const res = await apiService.getBusinessJobById(jobId)
      if (res?.success && res.data?.job) {
        setJob(res.data.job)
      } else {
        setJob(null)
      }
    } catch {
      setJob(null)
    } finally {
      setLoading(false)
    }
  }, [jobId])

  const loadAiMatches = useCallback(async () => {
    if (!jobId) return
    setMatchLoading(true)
    setMatchError('')
    try {
      const { candidates, cvIds, total } = await fetchAllBusinessScoutCandidates(apiService)
      setScoutTotal(total)
      const matches = await fetchJobScoutAiMatches(apiService, jobId, cvIds, { top_k: 200 })
      const summary = summarizeAiMatches(matches)
      setMatchSummary(summary)

      const candidateById = Object.fromEntries(candidates.map((c) => [String(c.id), c]))
      const top = summary.sorted.slice(0, 4).map((row, index) => {
        const cand = candidateById[String(row.id ?? row.cv_id)]
        return mergeScoutCandidateWithMatch(cand, row, index)
      })
      setTopCandidates(top)
    } catch (e) {
      const is404 = e?.status === 404 || String(e?.message || '').includes('404')
      setMatchError(is404 ? 'AI đang tính toán điểm phù hợp. Vui lòng thử lại sau vài phút.' : (e?.message || 'Không tải được gợi ý AI'))
      setMatchSummary(null)
      setTopCandidates([])
    } finally {
      setMatchLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    loadJob()
  }, [loadJob])

  const loadRecruitmentMetrics = useCallback(async () => {
    if (!jobId || !job) return
    setMetricsLoading(true)
    try {
      const metrics = await fetchJobRecruitmentMetrics(apiService, jobId, job, metricsPeriodDays)
      setRecruitmentMetrics(metrics)
    } catch {
      setRecruitmentMetrics(null)
    } finally {
      setMetricsLoading(false)
    }
  }, [jobId, job, metricsPeriodDays])

  useEffect(() => {
    if (job?.id) loadAiMatches()
  }, [job?.id, loadAiMatches])

  useEffect(() => {
    if (job?.id) loadRecruitmentMetrics()
  }, [job?.id, loadRecruitmentMetrics])

  const loadJobNominations = useCallback(async () => {
    if (!jobId) return
    setNominationsLoading(true)
    try {
      const res = await apiService.getBusinessApplications({
        page: 1,
        limit: 50,
        tab: 'all',
        jobId,
        sortBy: 'appliedAt',
        sortOrder: 'DESC',
      })
      if (res?.success) {
        const rows = (res.data?.applications || []).filter(
          (a) => !PRE_NOMINATION_PIPELINE_STATUSES.has(Number(a.status)),
        )
        setJobNominations(localizeApplications(rows, language))
      } else {
        setJobNominations([])
      }
    } catch {
      setJobNominations([])
    } finally {
      setNominationsLoading(false)
    }
  }, [jobId, language])

  useEffect(() => {
    if (job?.id && (job.isMarketplace || job.isDirectRecruitment)) {
      loadJobNominations()
    } else {
      setJobNominations([])
    }
  }, [job?.id, job?.isMarketplace, job?.isDirectRecruitment, loadJobNominations])

  const openNominationDrawer = (app) => {
    setSelectedNomination(app)
    setNominationDrawerOpen(true)
  }

  const closeNominationDrawer = () => {
    setNominationDrawerOpen(false)
    setSelectedNomination(null)
  }

  const handleNominationUpdated = useCallback(() => {
    loadJobNominations()
  }, [loadJobNominations])

  const statusMeta = useMemo(() => getJobStatusMeta(job?.status), [job?.status])
  const isOnCtvMarketplace = !!(job?.isMarketplace || job?.isDirectRecruitment)
  const pageTabs = useMemo(
    () => (isOnCtvMarketplace ? [...BASE_TABS, AI_TAB] : BASE_TABS),
    [isOnCtvMarketplace],
  )

  useEffect(() => {
    if (!isOnCtvMarketplace && activeTab === AI_TAB) {
      setActiveTab('Tổng quan')
    }
  }, [isOnCtvMarketplace, activeTab])
  const recruitmentLabel = RECRUITMENT_TYPE_LABELS[Number(job?.recruitmentType ?? job?.recruitment_type)] || 'Full-time'
  const location = job?.interviewLocation || job?.interview_location || ''
  const jobTitle = job?.title || job?.titleEn || job?.titleJp || 'Chi tiết JD'
  const categoryLevel = job?.categoryExperience || job?.category_experience || ''
  const jobCodeDisplay = job?.jobCode || job?.job_code || job?.jobNumber || job?.job_number || ''
  const noRecruitmentMetrics = !metricsLoading && (recruitmentMetrics?.totalNominations ?? 0) === 0
  const matchStats = matchSummary?.matchStats || [
    { value: 0, label: 'Hồ sơ rất phù hợp', sub: '(Match ≥ 85%)' },
    { value: 0, label: 'Hồ sơ phù hợp', sub: '(Match 60% - 84%)' },
    { value: 0, label: 'Hồ sơ tiềm năng', sub: '(Match 40% - 59%)' },
  ]
  const matchedTotal = matchSummary?.total ?? 0
  const avgScore = matchSummary?.avgScore ?? 0
  const healthCards = useMemo(() => {
    const poolScore = scoutTotal > 0 ? Math.min(100, Math.round((matchedTotal / scoutTotal) * 100) + 40) : 0
    const poolRating = scoutTotal > 0 ? getRecruitmentRating(poolScore) : 'Chưa đủ dữ liệu'
    const qualityRating = matchedTotal > 0 ? getRecruitmentRating(avgScore) : 'Chưa đủ dữ liệu'
    return [
      {
        icon: Users,
        score: scoutTotal > 0 ? poolScore : 0,
        showScore: scoutTotal > 0,
        scoreDisplay: 'Chưa đủ dữ liệu',
        label: 'Nguồn ứng viên',
        rating: poolRating,
        tooltip: 'Dựa trên quy mô kho Scout và số gợi ý AI khớp JD.',
        lines: scoutTotal > 0
          ? [`${scoutTotal.toLocaleString('vi-VN')} ứng viên Scout`, `${matchedTotal.toLocaleString('vi-VN')} gợi ý AI`]
          : ['Chưa có dữ liệu Scout cho JD'],
      },
      {
        icon: Sparkles,
        score: matchedTotal > 0 ? (avgScore || 0) : 0,
        showScore: matchedTotal > 0,
        scoreDisplay: 'Chưa đủ dữ liệu',
        label: 'Chất lượng ứng viên',
        rating: qualityRating,
        tooltip: 'Điểm match trung bình của các hồ sơ AI gợi ý cho JD.',
        lines: matchedTotal > 0
          ? [`${matchedTotal.toLocaleString('vi-VN')} hồ sơ phù hợp`, `Match TB: ${avgScore || 0}%`]
          : ['Chưa có hồ sơ match'],
      },
      {
        icon: BarChart3,
        score: noRecruitmentMetrics ? 0 : (recruitmentMetrics?.performanceScore ?? 0),
        showScore: !noRecruitmentMetrics && !metricsLoading,
        scoreDisplay: metricsLoading ? '…' : 'Chưa đủ dữ liệu',
        label: 'Hiệu suất tuyển dụng',
        rating: metricsLoading ? '…' : (noRecruitmentMetrics ? 'Chưa đủ dữ liệu' : (recruitmentMetrics?.performanceRating ?? '—')),
        tooltip: 'Tỷ lệ phản hồi và chuyển tiếp tích cực trên đơn tiến cử (7 ngày gần nhất).',
        lines: metricsLoading
          ? ['Đang tính toán...']
          : (noRecruitmentMetrics
            ? ['Cần thêm đơn ứng tuyển để tính điểm']
            : (recruitmentMetrics?.performanceLines || [])),
      },
      {
        icon: Clock,
        score: noRecruitmentMetrics ? 0 : (recruitmentMetrics?.speedScore ?? 0),
        showScore: !noRecruitmentMetrics && !metricsLoading,
        scoreDisplay: metricsLoading ? '…' : 'Chưa đủ dữ liệu',
        label: 'Tốc độ tuyển dụng',
        rating: metricsLoading ? '…' : (noRecruitmentMetrics ? 'Chưa đủ dữ liệu' : (recruitmentMetrics?.speedRating ?? '—')),
        tooltip: 'Thời gian có ứng viên đầu tiên, tần suất đơn mới và thời gian phản hồi.',
        lines: metricsLoading
          ? ['Đang tính toán...']
          : (noRecruitmentMetrics
            ? ['Cần thêm đơn ứng tuyển để tính điểm']
            : (recruitmentMetrics?.speedLines || [])),
      },
    ]
  }, [scoutTotal, matchedTotal, avgScore, recruitmentMetrics, metricsLoading, noRecruitmentMetrics])

  const aiInsights = useMemo(() => {
    const topSkills = new Map()
    const topLocations = new Map()
    topCandidates.forEach((c) => {
      pickShortSkillLabels(c.skills, 8).forEach((sk) => {
        topSkills.set(sk, (topSkills.get(sk) || 0) + 1)
      })
      if (c.location && c.location !== '—') {
        topLocations.set(c.location, (topLocations.get(c.location) || 0) + 1)
      }
    })
    const skillsText = [...topSkills.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k).join(', ') || '—'
    const locText = [...topLocations.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k).join(', ') || '—'
    return [
      { icon: TrendingUp, label: 'Match trung bình', value: `${avgScore || 0}%`, valueColor: '#10b981' },
      { icon: Sparkles, label: 'Kỹ năng match mạnh', value: skillsText },
      { icon: MapPin, label: 'Khu vực có nhiều ứng viên', value: locText },
      { icon: DollarSign, label: 'Mức lương phổ biến', value: '—' },
    ]
  }, [topCandidates, avgScore])

  const activities = useMemo(() => {
    const list = []
    if (job?.createdAt || job?.created_at) {
      list.push({
        icon: FileText, iconColor: 'text-blue-500', iconBg: 'bg-blue-50',
        text: 'JD được đăng lên hệ thống',
        time: formatDate(job.createdAt || job.created_at),
      })
    }
    const updated = job?.updatedAt || job?.updated_at
    const created = job?.createdAt || job?.created_at
    if (updated && updated !== created) {
      list.push({
        icon: Pencil, iconColor: 'text-slate-600', iconBg: 'bg-slate-100',
        text: 'JD được cập nhật',
        time: formatDate(updated),
      })
    }
    jobNominations.slice(0, 5).forEach((app) => {
      list.push({
        icon: User, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50',
        text: `${app.candidateName || 'Ứng viên'} đã ứng tuyển vào JD này`,
        time: formatDate(app.appliedAt),
      })
    })
    if (matchedTotal > 0) {
      list.push({
        icon: Sparkles, iconColor: 'text-violet-500', iconBg: 'bg-violet-50',
        text: `AI gợi ý ${matchedTotal.toLocaleString('vi-VN')} ứng viên phù hợp`,
        time: formatDate(job?.updatedAt || job?.updated_at || job?.createdAt || job?.created_at),
      })
    }
    return list.slice(0, 8)
  }, [job, matchedTotal, jobNominations])

  const serviceButtons = useMemo(() => {
    if (!job?.id) return []
    const scout = SERVICE_ICON_MAP.scout
    const branding = SERVICE_ICON_MAP.branding
    const marketplace = SERVICE_ICON_MAP.marketplace
    return [
      {
        id: 'scout',
        label: 'Scout Trực Tiếp',
        hint: 'Tìm & unlock ứng viên',
        active: matchedTotal > 0 || scoutTotal > 0,
        icon: scout.icon,
        iconColor: scout.iconColor,
        iconBg: scout.iconBg,
        onClick: () => navigate(`/business/scout/direct?jobId=${job.id}`),
      },
      {
        id: 'marketplace',
        label: 'Sàn CTV',
        hint: isOnCtvMarketplace ? 'Đã đưa lên sàn' : 'Mở rộng kênh tiến cử',
        active: isOnCtvMarketplace,
        icon: marketplace.icon,
        iconColor: marketplace.iconColor,
        iconBg: marketplace.iconBg,
        onClick: () => navigate(`/business/candidate-sharing?create=1&jobId=${job.id}`),
      },
      {
        id: 'branding',
        label: 'Thương hiệu TD',
        hint: 'Landing & branding',
        active: false,
        icon: branding.icon,
        iconColor: branding.iconColor,
        iconBg: branding.iconBg,
        onClick: () => navigate('/business/saiyo'),
      },
    ]
  }, [job?.id, isOnCtvMarketplace, matchedTotal, scoutTotal, navigate])

  if (loading) {
    return (
      <div className={`${embedded ? 'h-full' : 'h-screen'} bg-slate-50 flex items-center justify-center text-slate-500 text-sm gap-2`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        Đang tải chi tiết JD...
      </div>
    )
  }

  if (!job) {
    return (
      <div className={`${embedded ? 'h-full' : 'h-screen'} bg-slate-50 flex flex-col items-center justify-center text-slate-500 text-sm gap-3`}>
        <p>Không tìm thấy JD.</p>
        {!embedded && (
          <button type="button" onClick={() => navigate('/business/jobs')} className="text-blue-600 font-semibold text-xs">
            Quay lại danh sách
          </button>
        )}
      </div>
    )
  }

  const scoutHref = `/business/scout/direct?jobId=${job.id}`

  const aiTabBlocks = (
    <>
      <AiMatchOverviewCard
        matchLoading={matchLoading}
        matchedTotal={matchedTotal}
        matchError={matchError}
        matchStats={matchStats}
        aiInsights={aiInsights}
      />
      <TopCandidatesOverview
        matchLoading={matchLoading}
        topCandidates={topCandidates}
        onViewAll={() => navigate(scoutHref)}
      />
    </>
  )

  const overviewBlocks = (
    <>
      <HealthOverviewGrid cards={healthCards} title="Recruitment Health của JD" />
      {isOnCtvMarketplace ? (
        <JobDetailNominationsPanel
          loading={nominationsLoading}
          applications={jobNominations}
          selectedId={selectedNomination?.id}
          onOpen={openNominationDrawer}
        />
      ) : (
        aiTabBlocks
      )}
    </>
  )

  if (embedded) {
    return (
      <div className="business-homepage-shell business-jobs-shell h-full min-h-0 flex flex-col overflow-hidden">
        <style>{jobDetailPageStyles}</style>
        <div className="business-homepage-ui business-jobs-ui business-app-ui biz-jd-page-column bg-[#f9f9f9]">
          <div className="shrink-0 border-b border-slate-200/90 bg-white">
            <div className="space-y-3 px-4 py-3.5 sm:px-5 sm:py-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold sm:text-sm ${statusMeta.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                {statusMeta.label}
              </span>
              {isOnCtvMarketplace ? (
                <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-800 sm:text-sm">
                  Tiến cử trực tiếp với DN
                </span>
              ) : null}
            </div>
            <JobDetailTitleRow
              title={jobTitle}
              variant="embedded"
              onEdit={() => navigate(`/business/jobs/${job.id}/edit`)}
            />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 biz-jd-muted">
              <MetaItem icon={MapPin}>{location}</MetaItem>
              <MetaItem icon={Clock}>{recruitmentLabel}</MetaItem>
              <MetaItem icon={Hash}>{jobCodeDisplay ? `Mã: ${jobCodeDisplay}` : `ID: ${job.id}`}</MetaItem>
            </div>
            <div className={JOB_DETAIL_ACTION_BTN_GROUP_CLASS}>
              <button type="button" onClick={() => navigate(scoutHref)} className={JOB_DETAIL_OUTLINE_BTN_CLASS}>
                Scout
              </button>
              <button
                type="button"
                onClick={() => navigate(`/business/candidate-sharing?create=1&jobId=${job.id}`)}
                className={JOB_DETAIL_OUTLINE_BTN_CLASS}
              >
                Sàn CTV
              </button>
            </div>
            </div>
            <JobDetailPageTabs
              tabs={pageTabs}
              activeTab={activeTab}
              onChange={setActiveTab}
              className="bg-[#f9f9f9] px-2 sm:px-3"
            />
          </div>
          <div className="biz-jd-scroll-main scrollbar-hide px-4 py-4 sm:px-5 sm:py-5">
            {activeTab === 'Tổng quan' ? (
              <div className="space-y-3">
                {overviewBlocks}
                <ServicesActivityOverview serviceButtons={serviceButtons} activities={activities} />
              </div>
            ) : activeTab === AI_TAB ? (
              <div className="space-y-3">{aiTabBlocks}</div>
            ) : (
              <BusinessJobDetailLongView job={job} />
            )}
          </div>
          <BusinessApplicationDetailDrawer
            open={nominationDrawerOpen}
            application={selectedNomination}
            onClose={closeNominationDrawer}
            onStatusUpdated={handleNominationUpdated}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{jobDetailPageStyles}</style>
      <div className="business-homepage-shell business-jobs-shell h-full min-h-0 overflow-hidden">
        <div className="business-homepage-ui business-jobs-ui business-app-ui biz-jd-page-column bg-[#f9f9f9]">
          <div className="shrink-0 space-y-3 px-4 pt-3 pb-0 sm:px-5 sm:pt-4 lg:px-6 lg:pt-5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 sm:text-sm">
            <button type="button" onClick={() => navigate('/business/jobs')} className="hover:text-[#0077B6]">Quản lý JD</button>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="font-semibold text-slate-600">Chi tiết JD</span>
          </div>
          <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold sm:text-sm ${statusMeta.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                {statusMeta.label}
              </span>
              {isOnCtvMarketplace ? (
                <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-800 sm:text-sm">
                  Tiến cử trực tiếp với DN
                </span>
              ) : null}
            </div>

            <JobDetailTitleRow
              title={jobTitle}
              onEdit={() => navigate(`/business/jobs/${job.id}/edit`)}
            />

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <MetaItem icon={MapPin}>{location}</MetaItem>
              <MetaItem icon={Clock}>{recruitmentLabel}</MetaItem>
              <MetaItem icon={Award}>{categoryLevel ? `Cấp bậc: ${categoryLevel}` : ''}</MetaItem>
              <MetaItem icon={Hash}>{jobCodeDisplay ? `Mã JD: ${jobCodeDisplay}` : `ID: ${job.id}`}</MetaItem>
            </div>

            <div className="mt-3 flex flex-col gap-2.5 sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <p className="min-w-0 text-xs text-slate-500 sm:text-sm">
                Ngày đăng: {formatDate(job.createdAt || job.created_at)}
                {job.updatedAt || job.updated_at ? (
                  <> · Cập nhật: {formatDate(job.updatedAt || job.updated_at)}</>
                ) : null}
                {job.expiredAt || job.expired_at ? (
                  <> · Hết hạn: {formatDate(job.expiredAt || job.expired_at)}</>
                ) : null}
              </p>
              <div className={`${JOB_DETAIL_ACTION_BTN_GROUP_CLASS} shrink-0 sm:justify-items-stretch`}>
                <button
                  type="button"
                  onClick={() => navigate(`/business/scout/direct?jobId=${job.id}`)}
                  className={JOB_DETAIL_OUTLINE_BTN_CLASS}
                >
                  Tìm ứng viên với Scout
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/business/candidate-sharing?create=1&jobId=${job.id}`)}
                  className={JOB_DETAIL_OUTLINE_BTN_CLASS}
                >
                  Đưa lên Sàn CTV
                </button>
              </div>
            </div>
          </div>

          <JobDetailPageTabs
            tabs={pageTabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            className="mt-3 px-1 sm:mt-4"
          />
          </div>

          <div className="biz-jd-scroll-main scrollbar-hide px-4 pb-5 pt-3 sm:px-5 sm:pb-6 sm:pt-4 lg:px-6 lg:pb-7">
          {activeTab === 'Tổng quan' ? (
            <div className="space-y-3 sm:space-y-4">
              {overviewBlocks}
              <ServicesActivityOverview serviceButtons={serviceButtons} activities={activities} />
            </div>
          ) : activeTab === AI_TAB ? (
            <div className="space-y-3 sm:space-y-4">{aiTabBlocks}</div>
          ) : activeTab === 'Mô tả công việc' ? (
            <BusinessJobDetailLongView job={job} />
          ) : null}
          </div>
        </div>
      </div>
      <BusinessApplicationDetailDrawer
        open={nominationDrawerOpen}
        application={selectedNomination}
        onClose={closeNominationDrawer}
        onStatusUpdated={handleNominationUpdated}
      />
    </>
  )
}

export default JobDetail
