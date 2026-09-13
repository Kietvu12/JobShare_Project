import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronRight, ChevronDown, Globe, MoreHorizontal, MapPin, Clock,
  Award, Hash, Calendar, Users, Target, Sparkles, BarChart3, TrendingUp,
  Info, DollarSign, ArrowRight, User, Search, Star, Building2, FileText,
  Unlock, UserPlus, Loader2, Trash2, Pencil,
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
  buildBusinessJobDetailTabs,
  BusinessJobDetailSectionList,
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

const BASE_TABS = ['Tổng quan', 'Mô tả công việc']
const AI_TAB = 'AI gợi ý'

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
    <span className="inline-flex items-center gap-1 text-[10px] text-slate-600">
      <Icon className="h-3 w-3 shrink-0 text-slate-400" />
      {text}
    </span>
  )
}

const s = `
  .hide-sb::-webkit-scrollbar { display: none; }
  .hide-sb { -ms-overflow-style: none; scrollbar-width: none; }
`

const JOB_DETAIL_SHELL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  .business-jobs-shell {
    font-family: 'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif;
    --jd-fs-title: 11px;
    --jd-fs-body: 10px;
    --jd-icon: 14px;
    --jd-icon-hit: 24px;
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [jdContentTab, setJdContentTab] = useState('description')
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

  const handleDeleteJob = async () => {
    if (!job?.id || deleting) return
    setMenuOpen(false)
    const title = job?.title || job?.titleEn || job?.titleJp || `JD #${job.id}`
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa JD "${title}"?\n\nLưu ý: Không thể xóa JD đã có đơn ứng tuyển/tiến cử. Hãy đóng JD trước nếu cần.`,
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      const res = await apiService.deleteBusinessJob(job.id)
      if (res?.success) {
        navigate('/business/jobs')
      } else {
        alert(res?.message || 'Không thể xóa JD')
      }
    } catch (err) {
      alert(err?.message || 'Không thể xóa JD')
    } finally {
      setDeleting(false)
    }
  }

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
  const jobDetailTabs = useMemo(() => buildBusinessJobDetailTabs(job), [job])
  const jdContentTabs = useMemo(() => ([
    { id: 'description', label: 'Mô tả', sections: jobDetailTabs.description?.sections || [] },
    { id: 'requirements', label: 'Yêu cầu', sections: jobDetailTabs.requirements?.sections || [] },
    { id: 'benefits', label: 'Phúc lợi', sections: jobDetailTabs.benefits?.sections || [] },
  ]), [jobDetailTabs])

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

  const activeJdSections = jdContentTabs.find((t) => t.id === jdContentTab)?.sections || []
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
      <div className="business-jobs-shell h-full min-h-0 flex flex-col overflow-hidden">
        <style>{JOB_DETAIL_SHELL_STYLE}</style>
        <div className="business-jobs-ui h-full min-h-0 flex flex-col bg-[#f9f9f9] overflow-hidden">
          <div className="shrink-0 space-y-1.5 border-b border-slate-200 bg-white px-2 py-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusMeta.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                {statusMeta.label}
              </span>
              {isOnCtvMarketplace ? (
                <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-800">
                  Tiến cử trực tiếp với DN
                </span>
              ) : null}
            </div>
            <h1 className="biz-jd-title truncate">{jobTitle}</h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
              <MetaItem icon={MapPin}>{location}</MetaItem>
              <MetaItem icon={Clock}>{recruitmentLabel}</MetaItem>
              <MetaItem icon={Hash}>{jobCodeDisplay ? `Mã: ${jobCodeDisplay}` : `ID: ${job.id}`}</MetaItem>
            </div>
            <div className="flex flex-wrap gap-1">
              <button type="button" onClick={() => navigate(scoutHref)} className="rounded-md bg-[#0077B6] px-2 py-1 text-[10px] font-bold text-white hover:bg-[#006699]">
                Scout
              </button>
              <button
                type="button"
                onClick={() => navigate(`/business/candidate-sharing?create=1&jobId=${job.id}`)}
                className="rounded-md bg-violet-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-violet-700"
              >
                Sàn CTV
              </button>
              <button type="button" onClick={() => navigate(`/business/jobs/${job.id}/edit`)} className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50">
                Sửa
              </button>
            </div>
            <div className="flex gap-1 overflow-x-auto hide-sb">
              {pageTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${
                    activeTab === tab
                      ? 'bg-[#0077B6]/10 text-[#0077B6] ring-1 ring-[#0077B6]/20'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-2 hide-sb">
            {activeTab === 'Tổng quan' ? (
              <div className="space-y-2">
                {overviewBlocks}
                <ServicesActivityOverview serviceButtons={serviceButtons} activities={activities} />
              </div>
            ) : activeTab === AI_TAB ? (
              <div className="space-y-2">{aiTabBlocks}</div>
            ) : (
              <>
                <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 gap-0.5">
                  {jdContentTabs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setJdContentTab(t.id)}
                      className={`flex-1 rounded-md px-1 py-1 biz-jd-body font-semibold ${
                        jdContentTab === t.id ? 'bg-slate-100 text-slate-900' : 'text-slate-500'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <BusinessJobDetailSectionList sections={activeJdSections} />
              </>
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
      <style>{s}{JOB_DETAIL_SHELL_STYLE}</style>
      <div className="business-jobs-shell h-full min-h-0 overflow-hidden">
        <div className="business-jobs-ui h-full min-h-0 overflow-y-auto hide-sb bg-[#f9f9f9]">
          <div className="w-full p-2 lg:p-3 space-y-2">
          <div className="flex items-center gap-1 biz-jd-muted">
            <button type="button" onClick={() => navigate('/business/jobs')} className="hover:text-[#0077B6]">Quản lý JD</button>
            <ChevronRight className="biz-jd-icon" />
            <span className="biz-jd-body font-semibold text-slate-600">Chi tiết JD</span>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusMeta.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                {statusMeta.label}
              </span>
              {isOnCtvMarketplace ? (
                <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-800">
                  Tiến cử trực tiếp với DN
                </span>
              ) : null}
            </div>

            <h1 className="text-base font-bold leading-tight text-slate-900 sm:text-lg">{jobTitle}</h1>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <MetaItem icon={MapPin}>{location}</MetaItem>
              <MetaItem icon={Clock}>{recruitmentLabel}</MetaItem>
              <MetaItem icon={Award}>{categoryLevel ? `Cấp bậc: ${categoryLevel}` : ''}</MetaItem>
              <MetaItem icon={Hash}>{jobCodeDisplay ? `Mã JD: ${jobCodeDisplay}` : `ID: ${job.id}`}</MetaItem>
            </div>

            <p className="mt-1.5 text-[10px] text-slate-500">
              Ngày đăng: {formatDate(job.createdAt || job.created_at)}
              {job.updatedAt || job.updated_at ? (
                <> · Cập nhật: {formatDate(job.updatedAt || job.updated_at)}</>
              ) : null}
              {job.expiredAt || job.expired_at ? (
                <> · Hết hạn: {formatDate(job.expiredAt || job.expired_at)}</>
              ) : null}
            </p>

            <div className="mt-2.5 flex flex-col gap-2 border-t border-slate-100 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => navigate(`/business/scout/direct?jobId=${job.id}`)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0077B6] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-[#006699]"
                >
                  <Target className="h-3.5 w-3.5" />
                  Tìm ứng viên với Scout
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/business/candidate-sharing?create=1&jobId=${job.id}`)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-violet-700"
                >
                  <Users className="h-3.5 w-3.5" />
                  Đưa lên Sàn CTV
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => navigate(`/business/jobs/${job.id}/edit`)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Pencil className="h-3 w-3" />
                  Sửa JD
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Globe className="h-3 w-3" />
                  Landing Page
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                    aria-label="Thêm thao tác"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                  {menuOpen ? (
                    <>
                      <button type="button" className="fixed inset-0 z-10 cursor-default" aria-label="Đóng menu" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 top-8 z-20 min-w-[140px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={handleDeleteJob}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        >
                          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          Xóa JD
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white px-1 hide-sb">
            {pageTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 rounded-md px-3 py-2 text-[11px] font-semibold transition-colors ${
                  activeTab === tab
                    ? 'bg-[#0077B6]/10 text-[#0077B6] ring-1 ring-[#0077B6]/20'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Tổng quan' ? (
            <div className="space-y-2 pb-2">
              {overviewBlocks}
              <ServicesActivityOverview serviceButtons={serviceButtons} activities={activities} />
            </div>
          ) : activeTab === AI_TAB ? (
            <div className="space-y-2 pb-2">{aiTabBlocks}</div>
          ) : activeTab === 'Mô tả công việc' ? (
            <div className="space-y-2 pb-2">
              <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 gap-0.5">
                {jdContentTabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setJdContentTab(t.id)}
                    className={`flex-1 rounded-md px-2 py-1.5 biz-jd-body font-semibold transition-colors ${
                      jdContentTab === t.id ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <BusinessJobDetailSectionList sections={activeJdSections} />
            </div>
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
