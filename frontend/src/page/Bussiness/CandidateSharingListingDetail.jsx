import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ChevronRight, Loader2, Pause, CalendarPlus, XCircle, ExternalLink,
  Users, FileText, Wallet, LayoutGrid, UserCheck,
} from 'lucide-react'
import apiService from '../../services/api'
import NominationChat from '../../component/Chat/NominationChat'
import {
  buildBusinessJobDetailTabs,
  BusinessJobDetailSectionList,
} from '../../utils/businessJobDetailView'

const BRAND = '#0077B6'
const PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif"

const LISTING_STATUS = {
  DRAFT: 0,
  PENDING_APPROVAL: 1,
  APPROVED: 2,
  PUBLISHED: 3,
  PAUSED: 4,
  CLOSED: 5,
  REJECTED: 6,
}

const TABS = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutGrid },
  { id: 'nominations', label: 'Đơn tiến cử', icon: FileText },
  { id: 'interests', label: 'CTV quan tâm', icon: Users },
  { id: 'payments', label: 'Phí & thanh toán', icon: Wallet },
  { id: 'jd', label: 'Thông tin JD', icon: UserCheck },
]

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('vi-VN')
}

function headerBadgeLabel(status) {
  const code = Number(status)
  if (code === LISTING_STATUS.PUBLISHED) return 'Đang đăng'
  if (code === LISTING_STATUS.PAUSED) return 'Tạm dừng đăng'
  if (code === LISTING_STATUS.PENDING_APPROVAL) return 'Chờ WS duyệt'
  if (code === LISTING_STATUS.DRAFT) return 'Nháp'
  if (code === LISTING_STATUS.CLOSED) return 'Đã đóng'
  if (code === LISTING_STATUS.REJECTED) return 'Từ chối'
  if (code === LISTING_STATUS.APPROVED) return 'Đã duyệt'
  return '—'
}

function badgeStyle(status) {
  const code = Number(status)
  if (code === LISTING_STATUS.PUBLISHED) return { bg: '#d1fae5', color: '#059669' }
  if (code === LISTING_STATUS.PENDING_APPROVAL) return { bg: '#fef9c3', color: '#d97706' }
  if (code === LISTING_STATUS.PAUSED) return { bg: '#e2e8f0', color: '#475569' }
  if (code === LISTING_STATUS.CLOSED) return { bg: '#fee2e2', color: '#dc2626' }
  return { bg: '#f1f5f9', color: '#64748b' }
}

function NominationChatPanel({ nomination }) {
  return (
    <div className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm lg:min-h-0">
      <div className="shrink-0 border-b border-slate-100 px-3 py-2.5">
        <h3 className="text-xs font-bold text-slate-900 sm:text-sm">Trao đổi 3 bên</h3>
        <p className="text-[10px] text-slate-500">Doanh nghiệp · JobShare WS · CTV</p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {nomination ? (
          <NominationChat
            jobApplicationId={nomination.id}
            userType="business"
            currentStatus={nomination.status}
            introCandidateName={nomination.candidateName || '—'}
            introJobTitle={nomination.jobTitle || '—'}
            mobileHeaderName={nomination.candidateName || 'Chat 3 bên'}
            mobileHeaderAvatar={(nomination.candidateName || '?').charAt(0).toUpperCase()}
            embeddedPanel
          />
        ) : (
          <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-xs text-slate-400">
            Chọn một đơn tiến cử để trao đổi với CTV và WS
          </div>
        )}
      </div>
    </div>
  )
}

export default function CandidateSharingListingDetail() {
  const { listingId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlTab = searchParams.get('tab')
  const activeTab = TABS.some((t) => t.id === urlTab) ? urlTab : 'overview'

  const [loading, setLoading] = useState(true)
  const [actionBusy, setActionBusy] = useState(false)
  const [listing, setListing] = useState(null)
  const [stats, setStats] = useState(null)
  const [nominations, setNominations] = useState([])
  const [interests, setInterests] = useState([])
  const [settlements, setSettlements] = useState([])
  const [selectedNomination, setSelectedNomination] = useState(null)
  const [jobDetail, setJobDetail] = useState(null)
  const [jobLoading, setJobLoading] = useState(false)

  const setTab = (id) => {
    const next = new URLSearchParams(searchParams)
    if (id === 'overview') next.delete('tab')
    else next.set('tab', id)
    setSearchParams(next, { replace: true })
  }

  const loadCore = useCallback(async () => {
    if (!listingId) return
    setLoading(true)
    try {
      const res = await apiService.getBusinessCandidateSharingListing(listingId)
      if (res?.success && res.data) {
        setListing(res.data.listing)
        setStats(res.data.stats)
      } else {
        setListing(null)
      }
    } catch {
      setListing(null)
    } finally {
      setLoading(false)
    }
  }, [listingId])

  useEffect(() => {
    loadCore()
  }, [loadCore])

  useEffect(() => {
    if (!listingId) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiService.getBusinessCandidateSharingNominations({
          listingId,
          page: 1,
          limit: 50,
        })
        if (!cancelled && res?.success) {
          const rows = res.data?.nominations || []
          setNominations(rows)
          const urlNom = searchParams.get('nominationId')
          if (urlNom) {
            const pick = rows.find((n) => String(n.id) === String(urlNom))
            if (pick) setSelectedNomination(pick)
          }
        }
      } catch {
        if (!cancelled) setNominations([])
      }
    })()
    return () => { cancelled = true }
  }, [listingId, searchParams])

  useEffect(() => {
    if (!listingId || activeTab !== 'interests') return
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiService.getBusinessCandidateSharingListingInterests(listingId, { limit: 100 })
        if (!cancelled && res?.success) setInterests(res.data?.interests || [])
      } catch {
        if (!cancelled) setInterests([])
      }
    })()
    return () => { cancelled = true }
  }, [listingId, activeTab])

  useEffect(() => {
    if (!listingId || activeTab !== 'payments') return
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiService.getBusinessCandidateSharingSettlements({ listingId, limit: 50 })
        if (!cancelled && res?.success) setSettlements(res.data?.settlements || [])
      } catch {
        if (!cancelled) setSettlements([])
      }
    })()
    return () => { cancelled = true }
  }, [listingId, activeTab])

  useEffect(() => {
    const jobId = listing?.jobId
    if (!jobId || activeTab !== 'jd') return
    let cancelled = false
    setJobLoading(true)
    ;(async () => {
      try {
        const res = await apiService.getBusinessJobById(jobId)
        if (!cancelled && res?.success) setJobDetail(res.data?.job || res.data || null)
        else if (!cancelled) setJobDetail(null)
      } catch {
        if (!cancelled) setJobDetail(null)
      } finally {
        if (!cancelled) setJobLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [listing?.jobId, activeTab])

  const jobTabs = useMemo(() => buildBusinessJobDetailTabs(jobDetail), [jobDetail])

  const handlePause = async () => {
    if (!listing?.id || !window.confirm('Tạm dừng đăng JD trên Sàn CTV? CTV sẽ không thấy tin đăng mới cho đến khi bạn mở lại.')) return
    setActionBusy(true)
    try {
      const res = await apiService.pauseBusinessCandidateSharingListing(listing.id)
      if (res?.success) await loadCore()
      else alert(res?.message || 'Không thể tạm dừng')
    } catch (e) {
      alert(e?.message || 'Không thể tạm dừng')
    } finally {
      setActionBusy(false)
    }
  }

  const handleClose = async () => {
    if (!listing?.id || !window.confirm('Đóng đăng tuyển trên Sàn CTV? Hành động này kết thúc tin đăng trên sàn.')) return
    setActionBusy(true)
    try {
      const res = await apiService.closeBusinessCandidateSharingListing(listing.id)
      if (res?.success) await loadCore()
      else alert(res?.message || 'Không thể đóng đăng')
    } catch (e) {
      alert(e?.message || 'Không thể đóng đăng')
    } finally {
      setActionBusy(false)
    }
  }

  const handleExtend = async () => {
    if (!listing?.id) return
    const current = listing.recruitmentDeadline || listing.job?.deadline
    const next = window.prompt('Gia hạn hạn tuyển trên Sàn (YYYY-MM-DD):', current?.slice?.(0, 10) || '')
    if (!next) return
    setActionBusy(true)
    try {
      const res = await apiService.updateBusinessCandidateSharingListing(listing.id, { recruitmentDeadline: next })
      if (res?.success) await loadCore()
      else alert(res?.message || 'Không thể gia hạn')
    } catch (e) {
      alert(e?.message || 'Không thể gia hạn')
    } finally {
      setActionBusy(false)
    }
  }

  const statusCode = Number(listing?.status)
  const canPause = [LISTING_STATUS.PUBLISHED, LISTING_STATUS.APPROVED].includes(statusCode)
  const canClose = statusCode !== LISTING_STATUS.CLOSED
  const canExtend = ![
    LISTING_STATUS.DRAFT,
    LISTING_STATUS.REJECTED,
    LISTING_STATUS.CLOSED,
  ].includes(statusCode)

  const badge = badgeStyle(statusCode)

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" style={{ fontFamily: PAGE_FONT }}>
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="p-6 text-center text-sm text-slate-600" style={{ fontFamily: PAGE_FONT }}>
        <p>Không tìm thấy JD trên Sàn CTV.</p>
        <Link to="/business/candidate-sharing" className="mt-3 inline-block text-sm font-semibold" style={{ color: BRAND }}>
          Quay lại Sàn CTV
        </Link>
      </div>
    )
  }

  const title = listing.job?.title || 'JD trên Sàn CTV'
  const jobCode = listing.job?.jobCode || '—'

  return (
    <div className="business-homepage-shell flex h-full min-h-0 flex-col bg-slate-50/80" style={{ fontFamily: PAGE_FONT }}>
      <div className="business-homepage-ui flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-3 sm:px-4 lg:px-5">
        <nav className="mb-2 flex flex-wrap items-center gap-1 text-[10px] text-slate-500 sm:text-[11px]">
          <Link to="/business" className="hover:text-slate-800">Trang chủ</Link>
          <ChevronRight className="h-3 w-3 shrink-0" aria-hidden />
          <Link to="/business/candidate-sharing" className="hover:text-slate-800">Sàn CTV</Link>
          <ChevronRight className="h-3 w-3 shrink-0" aria-hidden />
          <span className="font-medium text-slate-800">Chi tiết đăng Sàn</span>
        </nav>

        <header className="mb-3 rounded-xl border border-slate-200/90 bg-white px-3 py-3 shadow-sm sm:px-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                  style={{ background: badge.bg, color: badge.color }}
                >
                  {headerBadgeLabel(listing.status)}
                </span>
                <span className="text-[10px] text-slate-400">Sàn cộng tác viên tuyển dụng WS</span>
              </div>
              <h1 className="text-base font-bold text-slate-900 sm:text-lg">{title}</h1>
              <p className="text-[11px] text-slate-500">{jobCode}</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] sm:grid-cols-4 sm:text-[11px]">
                <div>
                  <dt className="text-slate-400">Phí giới thiệu</dt>
                  <dd className="font-semibold text-slate-800">{listing.feeLabel || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Ngày đăng</dt>
                  <dd className="font-medium text-slate-700">{formatDate(listing.publishedAt || listing.approvedAt || listing.submittedAt)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Hết hạn</dt>
                  <dd className="font-medium text-slate-700">{formatDate(listing.recruitmentDeadline || listing.job?.deadline)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Trạng thái Sàn</dt>
                  <dd className="font-medium text-slate-700">{listing.statusLabel || '—'}</dd>
                </div>
              </dl>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {canPause ? (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={handlePause}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {actionBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pause className="h-3.5 w-3.5" />}
                  Tạm dừng đăng
                </button>
              ) : null}
              {canExtend ? (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={handleExtend}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  Gia hạn
                </button>
              ) : null}
              {canClose ? (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={handleClose}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Đóng đăng tuyển
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex gap-1 overflow-x-auto border-t border-slate-100 pt-2 scrollbar-hide">
            {TABS.map(({ id, label, icon: Icon }) => {
              const on = activeTab === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                    on ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  style={on ? { background: BRAND } : undefined}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                </button>
              )
            })}
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto ctv-scrollbar pb-4">
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: 'CTV quan tâm', value: stats?.interestCount ?? listing.interestCount ?? 0 },
                  { label: 'Đơn tiến cử', value: stats?.nominationsCount ?? listing.nominationsCount ?? 0 },
                  { label: 'Ứng viên đang xử lý', value: stats?.pipelineCount ?? 0 },
                  { label: 'Tuyển thành công', value: stats?.hiredCount ?? listing.hiredCount ?? 0 },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
                    <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{kpi.label}</div>
                    <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{kpi.value}</div>
                  </div>
                ))}
              </div>
              {listing.requirements ? (
                <div className="rounded-xl border border-slate-200/90 bg-white p-3 text-[11px] text-slate-700 shadow-sm">
                  <h2 className="mb-1 text-xs font-bold text-slate-900">Ghi chú đăng Sàn</h2>
                  <p className="whitespace-pre-wrap">{listing.requirements}</p>
                </div>
              ) : null}
              <p className="text-[11px] text-slate-500">
                Xử lý đơn tiến cử và chat 3 bên tại tab{' '}
                <button type="button" className="font-semibold" style={{ color: BRAND }} onClick={() => setTab('nominations')}>
                  Đơn tiến cử
                </button>
                .
              </p>
            </div>
          )}

          {activeTab === 'nominations' && (
            <div className="grid min-h-[420px] gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:min-h-[calc(100vh-280px)]">
              <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-400">
                        {['Ứng viên', 'Cộng tác viên', 'Ngày', 'Trạng thái'].map((h) => (
                          <th key={h} className={`px-3 py-2 font-semibold ${h === 'Ngày' || h === 'Trạng thái' ? 'text-center' : 'text-left'}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {nominations.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-12 text-center text-slate-400">Chưa có đơn tiến cử qua Sàn CTV.</td>
                        </tr>
                      ) : nominations.map((n) => {
                        const sel = String(selectedNomination?.id) === String(n.id)
                        return (
                          <tr
                            key={n.id}
                            className={`cursor-pointer border-t border-slate-100 ${sel ? 'bg-[#e8f4fa]/80' : 'hover:bg-slate-50/80'}`}
                            onClick={() => setSelectedNomination(n)}
                          >
                            <td className="px-3 py-2 font-semibold text-slate-800">{n.candidateName}</td>
                            <td className="px-3 py-2 text-slate-700">{n.ctvName}</td>
                            <td className="px-3 py-2 text-center text-slate-500">{formatDate(n.appliedAt)}</td>
                            <td className="px-3 py-2 text-center">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                {n.statusLabel}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <NominationChatPanel nomination={selectedNomination} />
            </div>
          )}

          {activeTab === 'interests' && (
            <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-400">
                    {['Cộng tác viên', 'Mã CTV', 'Email', 'Ngày quan tâm'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {interests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-12 text-center text-slate-400">Chưa có CTV quan tâm JD này.</td>
                    </tr>
                  ) : interests.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-slate-800">{row.ctvName}</td>
                      <td className="px-3 py-2 text-slate-600">{row.ctvCode || '—'}</td>
                      <td className="px-3 py-2 text-slate-600">{row.ctvEmail || '—'}</td>
                      <td className="px-3 py-2 text-slate-500">{formatDate(row.interestedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
                <h2 className="text-xs font-bold text-slate-900">Phí giới thiệu đã cài</h2>
                <p className="mt-1 text-sm font-semibold text-slate-800">{listing.feeLabel || '—'}</p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Phí nền tảng JobShare: {listing.platformFeePercent ?? 20}%
                </p>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
                <h2 className="border-b border-slate-100 px-3 py-2 text-xs font-bold text-slate-900">Thanh toán khi tuyển thành công</h2>
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-400">
                      {['Ứng viên', 'Số tiền DN', 'Trạng thái', 'Ngày'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-12 text-center text-slate-400">Chưa có bản ghi thanh toán cho JD này.</td>
                      </tr>
                    ) : settlements.map((s) => (
                      <tr key={s.id} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium text-slate-800">{s.candidateName}</td>
                        <td className="px-3 py-2 tabular-nums text-slate-700">
                          {Number(s.totalAmountBusiness || 0).toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-3 py-2 text-slate-600">{s.statusLabel}</td>
                        <td className="px-3 py-2 text-slate-500">{formatDate(s.paidAt || s.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'jd' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-2 shadow-sm">
                <p className="text-[11px] text-slate-600">Nội dung JD gốc — chỉnh sửa tại Quản lý JD.</p>
                {listing.jobId ? (
                  <Link
                    to={`/business/jobs/${listing.jobId}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold hover:underline"
                    style={{ color: BRAND }}
                  >
                    Xem / Sửa JD gốc
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                ) : null}
              </div>
              {jobLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : jobDetail ? (
                <div className="space-y-4 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm text-[11px]">
                  <section>
                    <h3 className="mb-2 text-xs font-bold text-slate-900">Mô tả & yêu cầu</h3>
                    <BusinessJobDetailSectionList sections={jobTabs.description.sections} />
                    <BusinessJobDetailSectionList sections={jobTabs.requirements.sections} />
                  </section>
                  <section>
                    <h3 className="mb-2 text-xs font-bold text-slate-900">Phúc lợi & lương</h3>
                    <BusinessJobDetailSectionList sections={jobTabs.benefits.sections} />
                  </section>
                </div>
              ) : (
                <p className="text-center text-sm text-slate-500">Không tải được nội dung JD.</p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
