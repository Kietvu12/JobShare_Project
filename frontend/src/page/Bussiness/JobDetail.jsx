import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronRight, ChevronDown, Globe, MoreHorizontal, MapPin, Clock,
  Award, Hash, Calendar, Users, Target, Sparkles, BarChart3, TrendingUp,
  Info, DollarSign, ArrowRight, User, Search, Star, Building2, FileText,
  Unlock, UserPlus, Loader2, Trash2,
} from 'lucide-react'
import apiService from '../../services/api'
import {
  fetchAllBusinessScoutCandidates,
  fetchJobScoutAiMatches,
  getMatchQualityLabel,
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
import {
  AiMatchOverviewCard,
  HealthOverviewGrid,
  pickShortSkillLabels,
  ServicesActivityOverview,
  TopCandidatesOverview,
} from '../../component/Bussiness/BusinessJobDetailOverview'

const tabs = ['Tổng quan', 'Mô tả công việc']

const RECRUITMENT_TYPE_LABELS = {
  1: 'Full-time',
  2: 'Hợp đồng có thời hạn',
  3: 'Phái cử',
  4: 'Bán thời gian',
  5: 'Uỷ thác',
}

const services = [
  {
    icon: Search, iconColor: 'text-blue-500', iconBg: 'bg-blue-50',
    name: 'Scout Credit', status: 'Đang sử dụng', statusColor: 'bg-emerald-100 text-emerald-700',
    detail: 'Tìm & unlock ứng viên trên Scout', action: 'Xem Scout',
  },
  {
    icon: Star, iconColor: 'text-amber-500', iconBg: 'bg-amber-50',
    name: 'Saiyo Branding', status: 'Chưa sử dụng', statusColor: 'bg-slate-100 text-slate-500',
    detail: 'Chưa kích hoạt', action: 'Đăng ký',
  },
  {
    icon: Building2, iconColor: 'text-violet-500', iconBg: 'bg-violet-50',
    name: 'Sàn CTV (HR Partner)', status: 'Chưa sử dụng', statusColor: 'bg-slate-100 text-slate-500',
    detail: 'Chưa đăng job', action: 'Đăng ngay',
  },
]

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
  if (n === 1) return { label: 'Đang hoạt động', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' }
  if (n === 0) return { label: 'Tạm dừng', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' }
  if (n === 2 || n === 3) return { label: 'Đã đóng', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' }
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
      if (!cvIds.length) {
        setMatchSummary(summarizeAiMatches([]))
        setTopCandidates([])
        return
      }
      const matches = await fetchJobScoutAiMatches(apiService, jobId, cvIds)
      const summary = summarizeAiMatches(matches)
      setMatchSummary(summary)

      const candidateById = Object.fromEntries(candidates.map((c) => [String(c.id), c]))
      const top = summary.sorted.slice(0, 4).map((row, index) => {
        const cand = candidateById[String(row.id)]
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
  const recruitmentLabel = RECRUITMENT_TYPE_LABELS[Number(job?.recruitmentType ?? job?.recruitment_type)] || 'Full-time'
  const location = job?.interviewLocation || job?.interview_location || '—'
  const jobTitle = job?.title || job?.titleEn || job?.titleJp || 'Chi tiết JD'
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

  const healthCards = useMemo(() => [
    {
      icon: Users, score: scoutTotal > 0 ? Math.min(100, Math.round((matchedTotal / scoutTotal) * 100) + 40) : 0,
      label: 'Nguồn ứng viên', rating: scoutTotal > 0 ? 'Khá' : '—',
      lines: [`${scoutTotal.toLocaleString('vi-VN')} ứng viên Scout`, `${matchedTotal.toLocaleString('vi-VN')} gợi ý từ AI`],
    },
    {
      icon: Sparkles, score: avgScore || 0,
      label: 'Chất lượng ứng viên', rating: getMatchQualityLabel(avgScore),
      lines: [`${matchedTotal.toLocaleString('vi-VN')} ứng viên phù hợp`, `Match trung bình: ${avgScore || 0}%`],
    },
    {
      icon: BarChart3,
      score: metricsLoading ? 0 : (recruitmentMetrics?.performanceScore ?? 0),
      label: 'Hiệu suất tuyển dụng',
      rating: metricsLoading ? '—' : (recruitmentMetrics?.performanceRating ?? '—'),
      lines: metricsLoading
        ? ['Đang tính toán...', '']
        : (recruitmentMetrics?.performanceLines || ['Tỷ lệ phản hồi: —', 'Tỷ lệ chuyển tiếp: —']),
    },
    {
      icon: Clock,
      score: metricsLoading ? 0 : (recruitmentMetrics?.speedScore ?? 0),
      label: 'Tốc độ tuyển dụng',
      rating: metricsLoading ? '—' : (recruitmentMetrics?.speedRating ?? '—'),
      lines: metricsLoading
        ? ['Đang tính toán...', '']
        : (recruitmentMetrics?.speedLines || ['Thời gian có ứng viên đầu tiên: —', 'Thời gian phản hồi TB: —']),
    },
  ], [scoutTotal, matchedTotal, avgScore, recruitmentMetrics, metricsLoading])

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
    if (matchedTotal > 0) {
      list.push({
        icon: Sparkles, iconColor: 'text-violet-500', iconBg: 'bg-violet-50',
        text: `Tự động gợi ý ${matchedTotal.toLocaleString('vi-VN')} ứng viên phù hợp`,
        time: formatDate(job?.updatedAt || job?.updated_at || job?.createdAt || job?.created_at),
      })
    }
    return list
  }, [job, matchedTotal])

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
  const scoutHref = `/business/scout?jobId=${job.id}`
  const overviewBlocks = (
    <>
      <HealthOverviewGrid cards={healthCards} title="Recruitment Health của JD" />
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

  if (embedded) {
    return (
      <div className="business-jobs-shell h-full min-h-0 flex flex-col overflow-hidden">
        <style>{JOB_DETAIL_SHELL_STYLE}</style>
        <div className="business-jobs-ui h-full min-h-0 flex flex-col bg-[#f9f9f9] overflow-hidden">
          <div className="shrink-0 border-b border-slate-200 bg-white px-2 py-2 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className={`inline-flex items-center gap-1 rounded-full ${statusMeta.color} biz-jd-body font-medium px-2 py-0.5`}>
                  <span className={`rounded-full ${statusMeta.dot} w-1.5 h-1.5`} />
                  {statusMeta.label}
                </span>
                {isOnCtvMarketplace ? (
                  <span className="inline-flex items-center rounded-full bg-violet-100 text-violet-800 border border-violet-200 biz-jd-body font-medium px-2 py-0.5 ml-1">
                    Tiến cử trực tiếp với doanh nghiệp
                  </span>
                ) : null}
                <h1 className="biz-jd-title mt-1 truncate">{jobTitle}</h1>
                <p className="biz-jd-muted truncate mt-0.5">
                  {location} · {recruitmentLabel} · Mã: {job.jobCode || job.job_code || job.id}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => navigate(scoutHref)} className="biz-jd-body font-semibold rounded-md px-2 py-1 bg-[#0077B6] text-white">Scout</button>
              </div>
            </div>
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`biz-jd-body font-semibold px-2 py-1 border-b-2 transition-colors ${
                    activeTab === tab ? 'border-[#0077B6] text-[#0077B6]' : 'border-transparent text-slate-500'
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
                <ServicesActivityOverview services={services} activities={activities} jobId={job.id} navigate={navigate} />
              </div>
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
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{s}{JOB_DETAIL_SHELL_STYLE}</style>
      <div className="business-jobs-shell h-full min-h-0 overflow-hidden">
        <div className="business-jobs-ui h-full min-h-0 overflow-y-auto hide-sb bg-[#f9f9f9]">
          <div className="max-w-5xl mx-auto p-2 lg:p-3 space-y-2">
          <div className="flex items-center gap-1 biz-jd-muted">
            <button type="button" onClick={() => navigate('/business/jobs')} className="hover:text-[#0077B6]">Quản lý JD</button>
            <ChevronRight className="biz-jd-icon" />
            <span className="biz-jd-body font-semibold text-slate-600">Chi tiết JD</span>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
            <div className="flex items-start justify-between gap-3" style={{ marginBottom: 8 }}>
              <span className={`inline-flex items-center gap-1 rounded-full ${statusMeta.color}`} style={{ fontSize: 9, fontWeight: 500, padding: '2px 8px' }}>
                <span className={`rounded-full ${statusMeta.dot}`} style={{ width: 5, height: 5 }} />
                {statusMeta.label}
              </span>
              {isOnCtvMarketplace ? (
                <span
                  className="inline-flex items-center rounded-full bg-violet-100 text-violet-800 border border-violet-200 font-medium"
                  style={{ fontSize: 9, padding: '2px 8px', marginLeft: 4 }}
                >
                  Tiến cử trực tiếp với doanh nghiệp
                </span>
              ) : null}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button className="flex items-center gap-1 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700 transition-colors" style={{ fontSize: 10, padding: '6px 10px' }}>
                  <Globe style={{ width: 11, height: 11 }} />
                  Tạo Landing Page
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors"
                    style={{ width: 26, height: 26 }}
                    aria-label="Thêm thao tác"
                  >
                    <MoreHorizontal style={{ width: 13, height: 13 }} />
                  </button>
                  {menuOpen && (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-10 cursor-default"
                        aria-label="Đóng menu"
                        onClick={() => setMenuOpen(false)}
                      />
                      <div
                        className="absolute right-0 z-20 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
                        style={{ top: 30, minWidth: 140 }}
                      >
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={handleDeleteJob}
                          className="w-full flex items-center gap-2 text-left text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors"
                          style={{ fontSize: 10, padding: '8px 12px' }}
                        >
                          {deleting ? (
                            <Loader2 className="animate-spin" style={{ width: 12, height: 12 }} />
                          ) : (
                            <Trash2 style={{ width: 12, height: 12 }} />
                          )}
                          Xóa JD
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>{jobTitle}</h1>

            <div className="flex flex-wrap items-center justify-between gap-3" style={{ marginBottom: 6 }}>
              <div className="flex items-center flex-wrap gap-3" style={{ fontSize: 10, color: '#64748b' }}>
                <span className="flex items-center gap-1"><MapPin style={{ width: 11, height: 11, color: '#94a3b8' }} />{location}</span>
                <span className="flex items-center gap-1"><Clock style={{ width: 11, height: 11, color: '#94a3b8' }} />{recruitmentLabel}</span>
                <span className="flex items-center gap-1"><Award style={{ width: 11, height: 11, color: '#94a3b8' }} />Cấp bậc: {job.categoryExperience || job.category_experience || '—'}</span>
                <span className="flex items-center gap-1"><Hash style={{ width: 11, height: 11, color: '#94a3b8' }} />Mã JD: {job.jobNumber || job.job_number || job.id}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => navigate(`/business/candidate-sharing?create=1&jobId=${job.id}`)}
                  className="flex items-center gap-1.5 border border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg font-semibold transition-colors"
                  style={{ fontSize: 10, padding: '6px 10px' }}
                >
                  <Users style={{ width: 12, height: 12 }} />
                  Đưa lên Sàn CTV
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/business/scout?jobId=${job.id}`)}
                  className="flex items-center gap-1.5 bg-[#0077B6] text-white rounded-lg font-semibold hover:bg-[#006699] transition-colors biz-jd-body"
                  style={{ padding: '6px 10px' }}
                >
                  <Target className="biz-jd-icon" />
                  Tìm ứng viên với Scout
                </button>
              </div>
            </div>

            <p style={{ fontSize: 10, color: '#94a3b8' }}>
              Ngày đăng: {formatDate(job.createdAt || job.created_at)}
              {job.expiredAt || job.expired_at ? (
                <> &nbsp;•&nbsp; Hết hạn: {formatDate(job.expiredAt || job.expired_at)}</>
              ) : null}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white flex items-center gap-3 overflow-x-auto hide-sb px-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`biz-jd-body font-semibold flex-shrink-0 py-2 border-b-2 transition-colors ${
                  activeTab === tab ? 'border-[#0077B6] text-[#0077B6]' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Tổng quan' ? (
            <div className="space-y-2 pb-2">
              {overviewBlocks}
              <ServicesActivityOverview services={services} activities={activities} jobId={job.id} navigate={navigate} />
            </div>
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
    </>
  )
}

export default JobDetail
