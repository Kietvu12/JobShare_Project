import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, ChevronDown, FileSearch, MessageSquare, LayoutTemplate,
  CheckCircle2, AlertCircle, ArrowRight, Search, SlidersHorizontal,
  Wrench, Code2, Users, TrendingUp, Shield, BarChart3,
  MapPin, Briefcase, ChevronLeft, ChevronRight, Sparkles, Loader2, Trash2,
} from 'lucide-react'
import apiService from '../../services/api'
import {
  fetchAllBusinessScoutCandidates,
  fetchJobScoutAiMatches,
  getMatchQualityLabel,
  summarizeAiMatches,
} from '../../utils/businessJobAiMatching'

const aiCreateOptions = [
  { icon: FileSearch, title: 'Tạo từ JD gốc', desc: 'Dán JD hiện có, AI sẽ tối ưu và chuẩn hóa', path: '/business/jobs/create' },
  { icon: MessageSquare, title: 'Tạo từ thông tin cơ bản', desc: 'Trả lời vài câu hỏi, AI tạo JD cho bạn', path: '/business/jobs/ai-builder' },
  { icon: LayoutTemplate, title: 'Chọn từ template', desc: 'Chọn template có sẵn theo ngành nghề', path: null },
]

const aiTips = [
  { ok: true, text: 'Tiêu đề rõ ràng, hấp dẫn' },
  { ok: true, text: 'Mô tả công việc chi tiết' },
  { ok: true, text: 'Yêu cầu & kỹ năng cụ thể' },
  { ok: true, text: 'Lợi ích & đãi ngộ cạnh tranh' },
  { ok: false, text: 'Ngôn ngữ thân thiện' },
]

const popularTemplates = [
  { icon: Code2, color: 'text-blue-500', bg: 'bg-blue-50', title: 'IT / Phần mềm', usage: '32 sử dụng' },
  { icon: Wrench, color: 'text-rose-500', bg: 'bg-rose-50', title: 'Kỹ sư cơ khí', usage: '28 sử dụng' },
  { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50', title: 'Sales / Kinh doanh', usage: '25 sử dụng' },
  { icon: Users, color: 'text-violet-500', bg: 'bg-violet-50', title: 'Nhân sự / Hành chính', usage: '18 sử dụng' },
  { icon: MessageSquare, color: 'text-amber-500', bg: 'bg-amber-50', title: 'Marketing', usage: '15 sử dụng' },
]

const JOB_ICON_POOL = [
  { icon: Wrench, iconColor: 'text-blue-500', iconBg: 'bg-blue-50' },
  { icon: Code2, iconColor: 'text-violet-500', iconBg: 'bg-violet-50' },
  { icon: Users, iconColor: 'text-amber-500', iconBg: 'bg-amber-50' },
  { icon: TrendingUp, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-50' },
  { icon: Shield, iconColor: 'text-rose-500', iconBg: 'bg-rose-50' },
  { icon: BarChart3, iconColor: 'text-sky-500', iconBg: 'bg-sky-50' },
]

const RECRUITMENT_TYPE_LABELS = {
  1: 'Full-time',
  2: 'Hợp đồng có thời hạn',
  3: 'Phái cử',
  4: 'Bán thời gian',
  5: 'Uỷ thác',
}

const s = `
  .hide-sb::-webkit-scrollbar { display: none; }
  .hide-sb { -ms-overflow-style: none; scrollbar-width: none; }
`

function pickJobIcon(index) {
  return JOB_ICON_POOL[Math.abs(Number(index) || 0) % JOB_ICON_POOL.length]
}

function getJobStatusMeta(status) {
  const n = Number(status)
  if (n === 1) {
    return {
      label: 'Đang hoạt động',
      statusColor: 'bg-emerald-100 text-emerald-700',
      statusDot: 'bg-emerald-500',
    }
  }
  if (n === 0) {
    return {
      label: 'Tạm dừng',
      statusColor: 'bg-amber-100 text-amber-700',
      statusDot: 'bg-amber-500',
    }
  }
  if (n === 2) {
    return {
      label: 'Đã đóng',
      statusColor: 'bg-slate-100 text-slate-600',
      statusDot: 'bg-slate-400',
    }
  }
  if (n === 3) {
    return {
      label: 'Hết hạn',
      statusColor: 'bg-slate-100 text-slate-600',
      statusDot: 'bg-slate-400',
    }
  }
  return {
    label: 'Không xác định',
    statusColor: 'bg-slate-100 text-slate-600',
    statusDot: 'bg-slate-400',
  }
}

function formatPostedDate(value) {
  if (!value) return { time: '—', posted: '—' }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return { time: '—', posted: '—' }
  const now = new Date()
  const diffMs = now - d
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
  const time = diffDays === 0 ? 'Hôm nay' : `${diffDays} ngày`
  const posted = `Đăng: ${d.toLocaleDateString('vi-VN')}`
  return { time, posted }
}

function mapApiJobToRow(job, index, matchMeta = {}) {
  const iconMeta = pickJobIcon(job?.id ?? index)
  const statusMeta = getJobStatusMeta(job?.status)
  const { time, posted } = formatPostedDate(job?.createdAt ?? job?.created_at)
  const titleJp = job?.titleJp || job?.title_jp || ''
  const location = job?.interviewLocation || job?.interview_location || '—'
  const recruitmentType = job?.recruitmentType ?? job?.recruitment_type
  const typeLabel = RECRUITMENT_TYPE_LABELS[Number(recruitmentType)] || 'Full-time'
  const total = Number(job?.applicationCount ?? job?.application_count ?? 0)
  const matched = matchMeta.matched ?? '—'
  const rate = matchMeta.rate ?? 0

  return {
    id: job?.id,
    ...iconMeta,
    name: job?.title || job?.titleEn || job?.titleJp || '—',
    jp: titleJp ? `(${titleJp})` : '',
    location,
    type: typeLabel,
    ...statusMeta,
    status: statusMeta.label,
    services: [{ label: 'Scout Credit', color: 'text-blue-500' }],
    total,
    matched,
    rate,
    rateColor: rate >= 50 ? 'bg-emerald-500' : rate >= 25 ? 'bg-amber-400' : 'bg-slate-300',
    time,
    posted,
  }
}

function countJobsByStatus(jobs) {
  const counts = { total: 0, active: 0, paused: 0, closed: 0 }
  ;(jobs || []).forEach((job) => {
    counts.total += 1
    const s = Number(job?.status)
    if (s === 1) counts.active += 1
    else if (s === 0) counts.paused += 1
    else if (s === 2 || s === 3) counts.closed += 1
  })
  return counts
}

const JobManagement = () => {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 })
  const [statusCounts, setStatusCounts] = useState({ total: 0, active: 0, paused: 0, closed: 0 })
  const [scoutTotal, setScoutTotal] = useState(0)
  const [scoutCvIds, setScoutCvIds] = useState([])
  const [matchByJobId, setMatchByJobId] = useState({})
  const [matchLoading, setMatchLoading] = useState(false)
  const [aiSummary, setAiSummary] = useState({ matched: 0, avgScore: 0, quality: '—' })
  const [deletingId, setDeletingId] = useState(null)

  const limit = 20

  const loadStatusCounts = useCallback(async () => {
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
      setStatusCounts(countJobsByStatus(all))
    } catch {
      /* giữ số 0 nếu lỗi */
    }
  }, [])

  const loadScoutPool = useCallback(async () => {
    try {
      const { cvIds, total } = await fetchAllBusinessScoutCandidates(apiService)
      setScoutCvIds(cvIds)
      setScoutTotal(total)
      return { cvIds, total }
    } catch {
      setScoutCvIds([])
      setScoutTotal(0)
      return { cvIds: [], total: 0 }
    }
  }, [])

  const loadJobMatches = useCallback(async (jobList, cvIds, scoutCount) => {
    if (!jobList?.length || !cvIds?.length) {
      setMatchByJobId({})
      setAiSummary({ matched: 0, avgScore: 0, quality: '—' })
      return
    }
    setMatchLoading(true)
    try {
      const entries = await Promise.all(
        jobList.map(async (job) => {
          try {
            const matches = await fetchJobScoutAiMatches(apiService, job.id, cvIds)
            const summary = summarizeAiMatches(matches)
            const rate = scoutCount > 0 ? Math.round((summary.total / scoutCount) * 100) : 0
            return [String(job.id), { matched: summary.total, rate, avgScore: summary.avgScore }]
          } catch {
            return [String(job.id), { matched: 0, rate: 0, avgScore: 0 }]
          }
        }),
      )
      const next = Object.fromEntries(entries)
      setMatchByJobId(next)

      const activeJobs = jobList.filter((j) => Number(j?.status) === 1)
      const primaryJob = activeJobs[0] || jobList[0]
      const primaryMeta = next[String(primaryJob?.id)] || { matched: 0, avgScore: 0 }
      setAiSummary({
        matched: primaryMeta.matched ?? 0,
        avgScore: primaryMeta.avgScore ?? 0,
        quality: getMatchQualityLabel(primaryMeta.avgScore ?? 0),
      })
    } finally {
      setMatchLoading(false)
    }
  }, [])

  const loadJobs = useCallback(async (targetPage = 1) => {
    setLoading(true)
    setListError('')
    try {
      const res = await apiService.getBusinessJobs({ page: targetPage, limit })
      if (!res?.success) {
        throw new Error(res?.message || 'Không thể tải danh sách JD')
      }
      setJobs(res.data?.jobs || [])
      setPagination(res.data?.pagination || { total: 0, page: targetPage, limit, totalPages: 0 })
      setPage(targetPage)
    } catch (err) {
      setListError(err?.message || 'Không thể tải danh sách JD')
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleDeleteJob = useCallback(async (job, e) => {
    e?.stopPropagation?.()
    if (!job?.id || deletingId) return
    const name = job?.title || job?.titleEn || job?.titleJp || `JD #${job.id}`
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa JD "${name}"?\n\nLưu ý: Không thể xóa JD đã có đơn ứng tuyển/tiến cử. Hãy đóng JD trước nếu cần.`,
    )
    if (!confirmed) return

    setDeletingId(job.id)
    setListError('')
    try {
      const res = await apiService.deleteBusinessJob(job.id)
      if (res?.success) {
        await loadStatusCounts()
        if (jobs.length <= 1 && page > 1) {
          await loadJobs(page - 1)
        } else {
          await loadJobs(page)
        }
      } else {
        setListError(res?.message || 'Không thể xóa JD')
      }
    } catch (err) {
      setListError(err?.message || 'Không thể xóa JD')
    } finally {
      setDeletingId(null)
    }
  }, [deletingId, jobs.length, page, loadJobs, loadStatusCounts])

  useEffect(() => {
    loadJobs(1)
    loadStatusCounts()
    loadScoutPool()
  }, [loadJobs, loadStatusCounts, loadScoutPool])

  useEffect(() => {
    if (!jobs.length) return
    const ids = scoutCvIds.length ? scoutCvIds : null
    if (!ids) {
      loadScoutPool().then(({ cvIds, total }) => {
        if (cvIds.length) loadJobMatches(jobs, cvIds, total)
      })
      return
    }
    loadJobMatches(jobs, ids, scoutTotal)
  }, [jobs, scoutCvIds, scoutTotal, loadJobMatches, loadScoutPool])

  const tableRows = useMemo(
    () => jobs.map((job, i) => {
      const meta = matchByJobId[String(job.id)] || {}
      return mapApiJobToRow(job, i, {
        matched: matchLoading ? '…' : (meta.matched ?? '—'),
        rate: meta.rate ?? 0,
      })
    }),
    [jobs, matchByJobId, matchLoading],
  )

  const jdStats = useMemo(() => [
    { icon: Briefcase, label: 'Tổng JD', value: statusCounts.total, color: 'text-blue-500' },
    { icon: CheckCircle2, label: 'Đang hoạt động', value: statusCounts.active, color: 'text-emerald-500' },
    { icon: AlertCircle, label: 'Tạm dừng', value: statusCounts.paused, color: 'text-amber-500' },
    { icon: Shield, label: 'Đã đóng', value: statusCounts.closed, color: 'text-slate-400' },
  ], [statusCounts])

  const total = pagination.total || 0
  const totalPages = pagination.totalPages || 0
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = total === 0 ? 0 : Math.min(page * limit, total)

  return (
    <>
      <style>{s}</style>
      <div className="h-screen bg-slate-50 overflow-hidden" style={{ padding: '8px' }}>
      <div className="h-full mx-auto grid gap-2" style={{ maxWidth: 1440, gridTemplateColumns: '1fr 220px' }}>

        {/* ── Main ── */}
        <div className="flex flex-col gap-2 min-w-0 min-h-0 overflow-y-auto hide-sb" style={{ paddingRight: 2 }}>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>Quản lý JD</h1>
              <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Tạo và quản lý các JD tuyển dụng của bạn</p>
            </div>
            <div className="flex items-center bg-blue-600 rounded-lg overflow-hidden text-white font-semibold shadow-sm" style={{ fontSize: 11 }}>
              <button
                type="button"
                className="flex items-center gap-1 hover:bg-blue-700 transition-colors"
                style={{ padding: '6px 12px' }}
                onClick={() => navigate('/business/jobs/create')}
              >
                <Plus style={{ width: 12, height: 12 }} />
                Tạo JD mới
              </button>
              <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.3)' }} />
              <button className="flex items-center hover:bg-blue-700 transition-colors" style={{ padding: '6px 8px' }}>
                <ChevronDown style={{ width: 12, height: 12 }} />
              </button>
            </div>
          </div>

          {/* AI Create + Suggestions */}
          <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 210px' }}>
            {/* AI Create card */}
            <div className="bg-white rounded-xl border border-slate-100 flex flex-col" style={{ padding: '10px 12px' }}>
              <div className="flex items-start gap-2" style={{ marginBottom: 8 }}>
                <div className="rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0" style={{ width: 30, height: 30 }}>
                  <Sparkles style={{ width: 14, height: 14, color: 'white' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
                    Tạo JD nhanh với AI <span style={{ color: '#10b981' }}>(Miễn phí)</span>
                  </h2>
                  <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, lineHeight: 1.4 }}>
                    Nhập thông tin cơ bản hoặc JD gốc, AI sẽ giúp bạn tạo JD chuẩn hóa và hấp dẫn hơn.
                  </p>
                </div>
              </div>
              <div className="grid flex-1" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {aiCreateOptions.map((o, i) => {
                  const Icon = o.icon
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={!o.path}
                      onClick={() => o.path && navigate(o.path)}
                      className="border border-slate-200 rounded-lg text-left hover:border-blue-300 hover:bg-blue-50 transition-colors flex flex-col disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:bg-transparent"
                      style={{ padding: 8, gap: 6 }}
                    >
                      <div className="rounded-lg bg-blue-50 flex items-center justify-center" style={{ width: 24, height: 24 }}>
                        <Icon style={{ width: 12, height: 12, color: '#3b82f6' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#1e293b' }}>{o.title}</div>
                        <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2, lineHeight: 1.3 }}>{o.desc}</div>
                      </div>
                      <ArrowRight style={{ width: 10, height: 10, color: '#cbd5e1' }} />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* AI Suggestions */}
            <div className="bg-white rounded-xl border border-slate-100 flex flex-col justify-between" style={{ padding: '10px 12px' }}>
              <div>
                <h2 style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', marginBottom: 3 }}>Gợi ý từ AI</h2>
                <p style={{ fontSize: 9, color: '#94a3b8', marginBottom: 8, lineHeight: 1.4 }}>Dựa trên JD và thị trường hiện tại, chúng tôi gợi ý:</p>
                <p style={{ fontSize: 10, color: '#475569', marginBottom: 3 }}>
                  Ước tính có <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{matchLoading ? '…' : aiSummary.matched}</span>{' '}
                  <span style={{ fontWeight: 600 }}>ứng viên</span> phù hợp
                </p>
                <p style={{ fontSize: 10, color: '#475569', marginTop: 6 }}>
                  Chất lượng ứng viên:{' '}
                  <span style={{ fontWeight: 600, color: '#f59e0b' }}>{aiSummary.quality}</span>
                  <span style={{ color: '#cbd5e1', marginLeft: 3 }}>ⓘ</span>
                </p>
              </div>
              <button
                type="button"
                className="flex items-center justify-center gap-1 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition-colors"
                style={{ marginTop: 10, width: '100%', padding: '6px 8px', fontSize: 10 }}
                onClick={() => navigate('/business/scout')}
              >
                Xem ứng viên phù hợp ngay
                <ArrowRight style={{ width: 10, height: 10 }} />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-100 flex flex-wrap items-center gap-1.5" style={{ padding: '7px 10px' }}>
            <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg flex-1" style={{ padding: '5px 8px', minWidth: 140 }}>
              <Search style={{ width: 11, height: 11, color: '#94a3b8', flexShrink: 0 }} />
              <input type="text" placeholder="Tìm kiếm theo tên JD, vị trí..." className="bg-transparent outline-none w-full" style={{ fontSize: 10, color: '#475569' }} />
            </div>
            {['Trạng thái: Tất cả', 'Dịch vụ: Tất cả', 'Thời gian: Tất cả'].map((label, i) => (
              <select key={i} className="border border-slate-200 rounded-lg text-slate-600 bg-white" style={{ fontSize: 10, padding: '5px 6px' }}>
                <option>{label}</option>
              </select>
            ))}
            <button className="flex items-center gap-1 font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex-shrink-0" style={{ fontSize: 10, padding: '5px 8px' }}>
              <SlidersHorizontal style={{ width: 10, height: 10 }} />
              Bộ lọc
            </button>
          </div>

          {listError && (
            <div className="rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-[11px] px-3 py-2">
              {listError}
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '8px 10px' }}>
            <div style={{ overflowX: 'auto', margin: '0 -10px' }}>
              <table style={{ width: '100%', textAlign: 'left', fontSize: 10, tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                <colgroup>
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '14%' }} />
                </colgroup>
                <thead>
                  <tr style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase' }}>
                    <th style={{ fontWeight: 500, padding: '5px 10px' }}>JD / Vị trí</th>
                    <th style={{ fontWeight: 500, padding: '5px 4px' }}>Trạng thái</th>
                    <th style={{ fontWeight: 500, padding: '5px 4px 5px 14px' }}>Dịch vụ đang sử dụng</th>
                    <th style={{ fontWeight: 500, padding: '5px 4px', textAlign: 'right' }}>Ứng viên (Tổng)</th>
                    <th style={{ fontWeight: 500, padding: '5px 4px', textAlign: 'right' }}>Ứng viên phù hợp</th>
                    <th style={{ fontWeight: 500, padding: '5px 4px' }}>Hiệu quả tuyển dụng</th>
                    <th style={{ fontWeight: 500, padding: '5px 4px' }}>Thời gian đăng</th>
                    <th style={{ fontWeight: 500, padding: '5px 10px', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '24px 10px', textAlign: 'center', color: '#94a3b8' }}>
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang tải danh sách JD...
                        </span>
                      </td>
                    </tr>
                  ) : tableRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '24px 10px', textAlign: 'center', color: '#94a3b8', fontSize: 11 }}>
                        Chưa có JD nào. Bấm &quot;Tạo JD mới&quot; để bắt đầu.
                      </td>
                    </tr>
                  ) : (
                    tableRows.map((j) => {
                      const Icon = j.icon
                      return (
                        <tr
                          key={j.id}
                          style={{ borderTop: '1px solid #f1f5f9', cursor: 'pointer' }}
                          onClick={() => navigate(`/business/jobs/${j.id}`)}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td style={{ padding: '7px 10px' }}>
                            <div className="flex items-start gap-1.5">
                              <div className={`rounded-lg ${j.iconBg} flex items-center justify-center flex-shrink-0`} style={{ width: 24, height: 24 }}>
                                <Icon className={j.iconColor} style={{ width: 11, height: 11 }} />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.name}</div>
                                {j.jp ? (
                                  <div style={{ fontSize: 9, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.jp}</div>
                                ) : null}
                                <div className="flex items-center gap-0.5" style={{ marginTop: 1 }}>
                                  <MapPin style={{ width: 8, height: 8, color: '#94a3b8', flexShrink: 0 }} />
                                  <span style={{ fontSize: 9, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.location} · {j.type}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '7px 4px' }}>
                            <span className={`inline-flex items-center gap-1 rounded-full ${j.statusColor}`} style={{ fontSize: 9, fontWeight: 500, padding: '2px 6px', whiteSpace: 'nowrap' }}>
                              <span className={`rounded-full flex-shrink-0 ${j.statusDot}`} style={{ width: 5, height: 5 }} />
                              {j.status}
                            </span>
                          </td>
                          <td style={{ padding: '7px 4px 7px 14px' }}>
                            <div className="flex flex-col" style={{ gap: 2 }}>
                              {j.services.map((sv, k) => (
                                <span key={k} className={sv.color} style={{ fontSize: 9, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>● {sv.label}</span>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '7px 4px', textAlign: 'right', color: '#334155', fontWeight: 500 }}>{j.total}</td>
                          <td style={{ padding: '7px 4px', textAlign: 'right', color: '#334155', fontWeight: 500 }}>{j.matched}</td>
                          <td style={{ padding: '7px 4px' }}>
                            <div className="flex items-center gap-1">
                              <span style={{ fontSize: 9, fontWeight: 600, color: '#334155', width: 22, flexShrink: 0 }}>{j.rate}%</span>
                              <div className="flex-1 rounded-full overflow-hidden bg-slate-100" style={{ height: 4 }}>
                                <div className={`h-full rounded-full ${j.rateColor}`} style={{ width: `${j.rate}%` }} />
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '7px 4px', color: '#64748b' }}>
                            <div style={{ fontSize: 10, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.time}</div>
                            <div style={{ fontSize: 9, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.posted}</div>
                          </td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button
                              type="button"
                              className="font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
                              style={{ fontSize: 9, padding: '3px 7px' }}
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/business/jobs/${j.id}`)
                              }}
                            >
                              Xem chi tiết
                            </button>
                            <button
                              type="button"
                              title="Xóa JD"
                              disabled={deletingId === j.id}
                              className="text-rose-400 hover:text-rose-600 disabled:opacity-50"
                              style={{ marginLeft: 4, fontSize: 13, display: 'inline-flex', alignItems: 'center' }}
                              onClick={(e) => handleDeleteJob(jobs.find((row) => row.id === j.id) || { id: j.id, title: j.name }, e)}
                            >
                              {deletingId === j.id ? (
                                <Loader2 className="animate-spin" style={{ width: 12, height: 12 }} />
                              ) : (
                                <Trash2 style={{ width: 12, height: 12 }} />
                              )}
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td colSpan={8} style={{ padding: '8px 10px 2px' }}>
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 9, color: '#94a3b8' }}>
                          {total === 0 ? 'Không có JD' : `Hiển thị ${from} - ${to} trong ${total} JD`}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={page <= 1 || loading}
                            onClick={() => loadJobs(page - 1)}
                            className="rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40"
                            style={{ width: 24, height: 24 }}
                          >
                            <ChevronLeft style={{ width: 11, height: 11 }} />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg bg-blue-600 text-white font-semibold flex items-center justify-center"
                            style={{ width: 24, height: 24, fontSize: 10 }}
                          >
                            {page}
                          </button>
                          <button
                            type="button"
                            disabled={page >= totalPages || loading || totalPages === 0}
                            onClick={() => loadJobs(page + 1)}
                            className="rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40"
                            style={{ width: 24, height: 24 }}
                          >
                            <ChevronRight style={{ width: 11, height: 11 }} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="flex flex-col gap-2 min-w-0 min-h-0 overflow-y-auto hide-sb" style={{ paddingRight: 2 }}>

          {/* Tips */}
          <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px 12px' }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Mẹo để JD hiệu quả hơn</h2>
            <div className="flex flex-col" style={{ gap: 6 }}>
              {aiTips.map((t, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  {t.ok
                    ? <CheckCircle2 style={{ width: 12, height: 12, color: '#10b981', flexShrink: 0 }} />
                    : <AlertCircle style={{ width: 12, height: 12, color: '#f59e0b', flexShrink: 0 }} />}
                  <span style={{ fontSize: 10, color: '#475569' }}>{t.text}</span>
                </div>
              ))}
            </div>
            <button className="flex items-center gap-1 font-semibold text-blue-600" style={{ marginTop: 8, fontSize: 10 }}>
              Xem hướng dẫn chi tiết
              <ArrowRight style={{ width: 10, height: 10 }} />
            </button>
          </div>

          {/* Popular templates */}
          <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px 12px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>Template JD phổ biến</h2>
              <button style={{ fontSize: 10, fontWeight: 600, color: '#3b82f6' }}>Xem tất cả</button>
            </div>
            <div className="flex flex-col" style={{ gap: 1 }}>
              {popularTemplates.map((t, i) => {
                const Icon = t.icon
                return (
                  <button key={i} className="flex items-center rounded-lg hover:bg-slate-50 transition-colors text-left w-full" style={{ gap: 8, padding: '5px 4px' }}>
                    <div className={`rounded-lg ${t.bg} flex items-center justify-center flex-shrink-0`} style={{ width: 24, height: 24 }}>
                      <Icon className={t.color} style={{ width: 11, height: 11 }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#1e293b' }}>{t.title}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>{t.usage}</div>
                    </div>
                    <ChevronRight style={{ width: 11, height: 11, color: '#cbd5e1', flexShrink: 0 }} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* JD Stats */}
          <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px 12px' }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Thống kê JD</h2>
            <div className="flex flex-col" style={{ gap: 7 }}>
              {jdStats.map((st, i) => {
                const Icon = st.icon
                return (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5" style={{ minWidth: 0 }}>
                      <Icon className={st.color} style={{ width: 13, height: 13, flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', flexShrink: 0 }}>{st.value}</span>
                  </div>
                )
              })}
            </div>
            <button className="w-full font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors" style={{ marginTop: 10, padding: '6px 0', fontSize: 10 }}>
              Xem báo cáo JD
            </button>
          </div>
        </div>

      </div>
      </div>
    </>
  )
}

export default JobManagement
