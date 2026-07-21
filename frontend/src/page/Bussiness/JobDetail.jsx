import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronRight, ChevronDown, Edit2, Globe, MoreHorizontal, MapPin, Clock,
  Award, Hash, Calendar, Users, Target, Sparkles, BarChart3, TrendingUp,
  Info, DollarSign, ArrowRight, User, Search, Star, Building2, FileText,
  Unlock, UserPlus, Loader2, Trash2,
} from 'lucide-react'
import apiService from '../../services/api'
import JobDetailPage from '../../component/Shared/JobDetailPage'
import {
  fetchAllBusinessScoutCandidates,
  fetchJobScoutAiMatches,
  getMatchQualityLabel,
  mergeScoutCandidateWithMatch,
  summarizeAiMatches,
} from '../../utils/businessJobAiMatching'
import { fetchJobRecruitmentMetrics } from '../../utils/businessJobRecruitmentMetrics'

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

const JobDetail = () => {
  const navigate = useNavigate()
  const { jobId } = useParams()
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
      (c.skills || []).forEach((sk) => topSkills.set(sk, (topSkills.get(sk) || 0) + 1))
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
      <div className="h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Đang tải chi tiết JD...
      </div>
    )
  }

  if (!job) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500 text-sm gap-3">
        <p>Không tìm thấy JD.</p>
        <button type="button" onClick={() => navigate('/business/jobs')} className="text-blue-600 font-semibold text-xs">
          Quay lại danh sách
        </button>
      </div>
    )
  }

  return (
    <>
      <style>{s}</style>
      <div className="h-screen bg-slate-50 overflow-hidden" style={{ padding: '8px' }}>
        <div className="h-full mx-auto flex flex-col gap-2 overflow-y-auto hide-sb" style={{ maxWidth: 1140, paddingRight: 2 }}>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1" style={{ fontSize: 10, color: '#94a3b8' }}>
            <button onClick={() => navigate('/business/jobs')} className="hover:text-blue-600 transition-colors">Quản lý JD</button>
            <ChevronRight style={{ width: 10, height: 10 }} />
            <span style={{ fontWeight: 600, color: '#475569' }}>Chi tiết JD</span>
          </div>

          {/* Header */}
          <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '12px 14px' }}>
            <div className="flex items-start justify-between gap-3" style={{ marginBottom: 8 }}>
              <span className={`inline-flex items-center gap-1 rounded-full ${statusMeta.color}`} style={{ fontSize: 9, fontWeight: 500, padding: '2px 8px' }}>
                <span className={`rounded-full ${statusMeta.dot}`} style={{ width: 5, height: 5 }} />
                {statusMeta.label}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => navigate(`/business/jobs/${job.id}/edit`)}
                  className="flex items-center gap-1 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700 transition-colors"
                  style={{ fontSize: 10, padding: '6px 10px' }}
                >
                  <Edit2 style={{ width: 11, height: 11 }} />
                  Chỉnh sửa JD
                </button>
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
                  className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  style={{ fontSize: 10, padding: '6px 10px' }}
                >
                  <Target style={{ width: 12, height: 12 }} />
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

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-slate-100 flex items-center gap-4 overflow-x-auto hide-sb" style={{ padding: '0 14px' }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="font-medium transition-colors flex-shrink-0"
                style={{
                  fontSize: 11,
                  padding: '10px 2px',
                  borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
                  color: activeTab === tab ? '#6366f1' : '#64748b',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Tổng quan' ? (
            <>
              {/* Recruitment Health */}
              <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px 12px' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                  <div className="flex items-center gap-1.5">
                    <h2 style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>Recruitment Health của JD</h2>
                    <Info style={{ width: 12, height: 12, color: '#cbd5e1' }} />
                  </div>
                  <button className="flex items-center gap-1 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors" style={{ fontSize: 10, padding: '4px 8px' }}>
                    {metricsPeriodDays} ngày qua
                    <ChevronDown style={{ width: 11, height: 11 }} />
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-4" style={{ gap: 12 }}>
                  {healthCards.map((c, i) => {
                    const Icon = c.icon
                    return (
                      <div key={i} className={i % 4 !== 0 ? 'lg:border-l border-slate-100' : ''} style={{ paddingLeft: i % 4 !== 0 ? 14 : 0 }}>
                        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                          <div className="rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0" style={{ width: 28, height: 28 }}>
                            <Icon className="text-violet-500" style={{ width: 14, height: 14 }} />
                          </div>
                          <span style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>{c.label}</span>
                        </div>
                        <div className="flex items-baseline gap-1" style={{ marginBottom: 2 }}>
                          <span style={{ fontSize: 20, fontWeight: 700, color: '#4f46e5' }}>{c.score}</span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>/100</span>
                        </div>
                        <p style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', marginBottom: 8 }}>{c.rating}</p>
                        {c.lines.map((line, k) => (
                          <p key={k} style={{ fontSize: 9, color: '#94a3b8', lineHeight: 1.6 }}>{line}</p>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* AI Suggestion */}
              <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-blue-50" style={{ padding: '14px 16px' }}>
                <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
                  <div className="flex gap-3">
                    <div className="rounded-2xl bg-white flex items-center justify-center flex-shrink-0 relative" style={{ width: 56, height: 56 }}>
                      <Target className="text-violet-500" style={{ width: 26, height: 26 }} />
                      <Sparkles className="text-violet-300" style={{ width: 12, height: 12, position: 'absolute', top: -4, right: -4 }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <span className="inline-block rounded-full bg-violet-100 text-violet-600" style={{ fontSize: 9, fontWeight: 600, padding: '2px 8px', marginBottom: 6 }}>AI gợi ý</span>
                      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>
                        {matchLoading ? 'Đang phân tích ứng viên Scout...' : `Có ${matchedTotal.toLocaleString('vi-VN')} hồ sơ phù hợp với JD này`}
                      </h2>
                      {matchError && (
                        <p style={{ fontSize: 10, color: '#b45309', marginBottom: 8 }}>{matchError}</p>
                      )}
                      <div className="grid grid-cols-3" style={{ gap: 12 }}>
                        {matchStats.map((m, i) => (
                          <div key={i}>
                            <p style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{matchLoading ? '…' : m.value}</p>
                            <p style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{m.label}</p>
                            <p style={{ fontSize: 9, color: '#94a3b8' }}>{m.sub}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center lg:border-l border-violet-100" style={{ gap: 10, paddingLeft: 16 }}>
                    {aiInsights.map((item, i) => {
                      const Icon = item.icon
                      return (
                        <div key={i} className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5" style={{ fontSize: 10, color: '#64748b', flexShrink: 0 }}>
                            <Icon style={{ width: 12, height: 12, color: '#a5b4fc' }} />
                            {item.label}
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: item.valueColor || '#1e293b', textAlign: 'right' }}>{item.value}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Top candidates */}
              <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px 12px' }}>
                <div className="flex items-center gap-1.5" style={{ marginBottom: 10 }}>
                  <h2 style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>Top ứng viên phù hợp nhất (Ẩn danh)</h2>
                  <Info style={{ width: 12, height: 12, color: '#cbd5e1' }} />
                </div>
                {matchLoading ? (
                  <div className="flex items-center justify-center gap-2 text-slate-500" style={{ padding: 24, fontSize: 10 }}>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tải gợi ý AI...
                  </div>
                ) : topCandidates.length === 0 ? (
                  <div className="text-center text-slate-400" style={{ padding: 24, fontSize: 10 }}>
                    Chưa có ứng viên Scout phù hợp hoặc JD chưa được đồng bộ vector.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {topCandidates.map((c, i) => (
                      <div key={c.id || i} className="border border-slate-100 rounded-lg" style={{ padding: 10 }}>
                        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                          <div className="rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0" style={{ width: 28, height: 28 }}>
                            <User className="text-violet-400" style={{ width: 14, height: 14 }} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>{c.name}</p>
                            <p style={{ fontSize: 9, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.role}</p>
                          </div>
                        </div>
                        <span className="inline-block rounded-full bg-emerald-100 text-emerald-700" style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', marginBottom: 8 }}>{c.match}% match</span>
                        <div className="flex items-center gap-1" style={{ marginBottom: 4 }}>
                          <Calendar style={{ width: 10, height: 10, color: '#94a3b8' }} />
                          <span style={{ fontSize: 9, color: '#64748b' }}>{c.exp}</span>
                        </div>
                        <div className="flex items-center gap-1" style={{ marginBottom: 8 }}>
                          <MapPin style={{ width: 10, height: 10, color: '#94a3b8' }} />
                          <span style={{ fontSize: 9, color: '#64748b' }}>{c.location}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {c.skills.map((sk, k) => (
                            <span key={k} className="bg-slate-100 text-slate-600 rounded" style={{ fontSize: 9, padding: '2px 6px' }}>{sk}</span>
                          ))}
                          {c.extra > 0 && (
                            <span className="bg-slate-100 text-slate-600 rounded" style={{ fontSize: 9, padding: '2px 6px' }}>+{c.extra}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-center" style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/business/scout?jobId=${job.id}`)}
                    className="flex items-center gap-1.5 border border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg font-semibold transition-colors"
                    style={{ fontSize: 10, padding: '8px 16px' }}
                  >
                    Xem danh sách tất cả ứng viên match
                    <ArrowRight style={{ width: 11, height: 11 }} />
                  </button>
                </div>
              </div>

              {/* Bottom: services + activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2" style={{ paddingBottom: 8 }}>
                {/* Services */}
                <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px 12px' }}>
                  <h2 style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>Dịch vụ đang sử dụng cho JD này</h2>
                  <div className="flex flex-col" style={{ gap: 10 }}>
                    {services.map((sv, i) => {
                      const Icon = sv.icon
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`rounded-lg ${sv.iconBg} flex items-center justify-center flex-shrink-0`} style={{ width: 28, height: 28 }}>
                            <Icon className={sv.iconColor} style={{ width: 13, height: 13 }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="flex items-center gap-2" style={{ marginBottom: 1 }}>
                              <span style={{ fontSize: 10, fontWeight: 600, color: '#1e293b' }}>{sv.name}</span>
                              <span className={`inline-flex items-center rounded-full flex-shrink-0 ${sv.statusColor}`} style={{ fontSize: 9, fontWeight: 500, padding: '1px 6px' }}>{sv.status}</span>
                            </div>
                            <p style={{ fontSize: 9, color: '#94a3b8' }}>{sv.detail}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => sv.name === 'Scout Credit' && navigate(`/business/scout?jobId=${job.id}`)}
                            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0"
                            style={{ fontSize: 10 }}
                          >
                            {sv.action}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Activity */}
                <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px 12px' }}>
                  <h2 style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>Lịch sử hoạt động gần đây</h2>
                  <div className="flex flex-col" style={{ gap: 9 }}>
                    {activities.length === 0 ? (
                      <p style={{ fontSize: 10, color: '#94a3b8' }}>Chưa có hoạt động.</p>
                    ) : activities.map((a, i) => {
                      const Icon = a.icon
                      return (
                        <div key={i} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                            <div className={`rounded-lg ${a.iconBg} flex items-center justify-center flex-shrink-0`} style={{ width: 22, height: 22 }}>
                              <Icon className={a.iconColor} style={{ width: 11, height: 11 }} />
                            </div>
                            <span style={{ fontSize: 10, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.text}</span>
                          </div>
                          <span style={{ fontSize: 9, color: '#94a3b8', flexShrink: 0 }}>{a.time}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'Mô tả công việc' ? (
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden" style={{ padding: '8px 10px', marginBottom: 8 }}>
              <JobDetailPage
                embeddedGeneralOnly
                getJobApi={apiService.getBusinessJobById}
                backPath="/business/jobs"
                hideSaveToList
                publicLanding
              />
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

export default JobDetail
