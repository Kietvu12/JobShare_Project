import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Coins,
  ArrowDownToLine,
  ClipboardList,
  Layers,
  FileWarning,
  ChevronRight,
  Plus,
  Filter,
  Search,
  ChevronDown,
  MoreHorizontal,
  Briefcase,
  TrendingUp,
  FileText,
  Loader2,
  X,
} from 'lucide-react'
import apiService from '../../services/api'
import CreditTopUpModal from '../../component/Bussiness/CreditTopUpModal'

const PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif"
const BRAND = '#0077B6'

const billingStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  .billing-scroll-hide::-webkit-scrollbar { display: none; }
  .billing-scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
  .billing-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
  .billing-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .billing-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
  .business-homepage-shell { --hp-zoom: 1; }
  @media (min-width: 1280px) and (max-width: 1535px) {
    .business-homepage-shell { --hp-zoom: 0.92; }
  }
  .business-homepage-ui { zoom: var(--hp-zoom); }
  @supports not (zoom: 1) {
    .business-homepage-ui {
      transform: scale(var(--hp-zoom));
      transform-origin: top left;
      width: calc(100% / var(--hp-zoom));
      height: calc(100% / var(--hp-zoom));
    }
  }
`

const CARD = 'rounded-xl border border-slate-200 bg-white p-3 shadow-sm'
const linkActionCls =
  'inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#0077B6] transition-colors hover:text-[#006399] bg-transparent border-0 cursor-pointer p-0'

/** @deprecated inline sections — prefer CARD + Tailwind */
const bd = '1px solid #e2e8f0'
const cardStyle = {
  background: '#fff',
  border: bd,
  borderRadius: 12,
  padding: 12,
  boxShadow: '0 1px 2px rgb(15 23 42 / 0.04)',
}

const ICON_SM = { width: 10, height: 10 }
const ICON_MD = { width: 12, height: 12 }

const SERVICE_ICON_MAP = {
  scout_credit: { icon: Briefcase, iconBg: '#e8f4fa', iconColor: '#0077B6' },
  scout_performance: { icon: TrendingUp, iconBg: '#e0f2fe', iconColor: '#0369a1' },
  saiyo_branding: { icon: FileText, iconBg: '#fce7f3', iconColor: '#db2777' },
  partner_ctv: { icon: Layers, iconBg: '#ffedd5', iconColor: '#ea580c' },
}

const SUMMARY_ICON_MAP = [
  { icon: Coins, bg: '#e8f4fa', color: '#0077B6', link: 'Nạp thêm credit' },
  { icon: ArrowDownToLine, bg: '#e0f2fe', color: '#0369a1', link: 'Chi tiết' },
  { icon: ClipboardList, bg: '#dcfce7', color: '#16a34a', link: 'Xem danh sách' },
  { icon: Layers, bg: '#e8f4fa', color: '#0077B6', link: 'Xem chi tiết' },
  { icon: FileWarning, bg: '#fee2e2', color: '#dc2626', link: 'Xem chi tiết' },
]

const TAB_DEFS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'processing', label: 'Đang xử lý' },
  { key: 'waiting', label: 'Chờ phản hồi' },
  { key: 'done', label: 'Hoàn thành' },
  { key: 'closed', label: 'Đã đóng' },
]

const REQUEST_TYPE_OPTIONS = [
  { value: 'all', label: 'Tất cả loại yêu cầu' },
  { value: 'credit_topup', label: 'Nạp credit' },
  { value: 'scout_performance', label: 'Scout Performance' },
  { value: 'scout_credit', label: 'Scout Credit' },
  { value: 'saiyo_branding', label: 'Saiyo Branding' },
  { value: 'partner_ctv', label: 'Partner CTV' },
]

const SERVICE_NAV_PATHS = {
  scout_credit: '/business/scout',
  scout_performance: '/business/scout',
  saiyo_branding: '/business/saiyo',
  partner_ctv: '/business/candidate-sharing',
}

function getRequestNavigatePath(row) {
  switch (row?.sourceType) {
    case 'scout_performance':
      return '/business/messages?tab=ws'
    case 'scout_credit':
      return '/business/candidates?list=scout_credit'
    case 'saiyo_branding':
      return '/business/saiyo'
    case 'partner_ctv':
      return '/business/candidate-sharing'
    default:
      return null
  }
}

const SectionHeader = ({ title, action, onAction }) => (
  <div className="mb-2 flex items-center justify-between">
    <div className="text-xs font-bold text-slate-800">{title}</div>
    {action && (
      <button type="button" onClick={onAction} className={linkActionCls}>
        {action} <ChevronRight className="h-2.5 w-2.5 shrink-0" />
      </button>
    )}
  </div>
)

const Billing = ({ focusSection }) => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isRequestsView = focusSection === 'requests'
  const requestsSectionRef = useRef(null)
  const transactionsSectionRef = useRef(null)
  const servicesSectionRef = useRef(null)

  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [requestTypeFilter, setRequestTypeFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [txLoading, setTxLoading] = useState(false)
  const [error, setError] = useState('')
  const [dashboard, setDashboard] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [txPagination, setTxPagination] = useState(null)
  const [txExpanded, setTxExpanded] = useState(false)
  const [txPage, setTxPage] = useState(1)
  const [requests, setRequests] = useState([])
  const [requestPagination, setRequestPagination] = useState(null)
  const [tabCounts, setTabCounts] = useState({})
  const [creditModalOpen, setCreditModalOpen] = useState(false)
  const [creditModalMode, setCreditModalMode] = useState('create')
  const [editCreditRequest, setEditCreditRequest] = useState(null)
  const [actionRequestId, setActionRequestId] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [invoicesModalOpen, setInvoicesModalOpen] = useState(false)
  const [allInvoices, setAllInvoices] = useState([])
  const [invoicesLoading, setInvoicesLoading] = useState(false)

  const loadTransactions = useCallback(async (pageNum = 1, expanded = txExpanded) => {
    if (isRequestsView) return
    setTxLoading(true)
    try {
      const limit = expanded ? 20 : 10
      const res = await apiService.getBusinessBillingTransactions({ page: pageNum, limit })
      if (res?.success) {
        setTransactions(res.data?.transactions || [])
        setTxPagination(res.data?.pagination || null)
      }
    } catch {
      setTransactions([])
    } finally {
      setTxLoading(false)
    }
  }, [isRequestsView, txExpanded])

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const dashRes = await apiService.getBusinessBillingDashboard()
      if (dashRes?.success) setDashboard(dashRes.data)
      else setError(dashRes?.message || 'Không tải được dữ liệu billing')
    } catch (e) {
      setError(e?.message || 'Không tải được dữ liệu billing')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadRequests = useCallback(async () => {
    setRequestsLoading(true)
    try {
      const res = await apiService.getBusinessBillingRequests({
        page,
        limit: 8,
        tab: activeTab === 'all' ? undefined : activeTab,
        type: requestTypeFilter === 'all' ? undefined : requestTypeFilter,
        search: search || undefined,
      })
      if (res?.success) {
        setRequests(res.data?.requests || [])
        setRequestPagination(res.data?.pagination || null)
        setTabCounts(res.data?.tabCounts || {})
      }
    } catch {
      setRequests([])
    } finally {
      setRequestsLoading(false)
    }
  }, [page, activeTab, search, requestTypeFilter])

  useEffect(() => {
    if (!isRequestsView) loadTransactions(txPage, txExpanded)
  }, [isRequestsView, loadTransactions, txPage, txExpanded])

  useEffect(() => {
    if (searchParams.get('topup') === '1') {
      setCreditModalMode('create')
      setEditCreditRequest(null)
      setCreditModalOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const summaryCards = useMemo(() => {
    const s = dashboard?.summary
    if (!s) return []
    return [
      { label: 'Credit hiện tại', value: s.creditLabel || `${s.credit} credit` },
      { label: 'Đã dùng trong tháng', value: s.creditUsedThisMonthLabel || `${s.creditUsedThisMonth} credit` },
      { label: 'Request đang xử lý', value: String(s.processingRequestsCount ?? 0) },
      { label: 'Dịch vụ đang hoạt động', value: String(s.activeServicesCount ?? 0) },
      { label: 'Invoice chưa thanh toán', value: String(s.unpaidInvoicesCount ?? 0) },
    ].map((item, i) => ({ ...item, ...SUMMARY_ICON_MAP[i], link: SUMMARY_ICON_MAP[i].link }))
  }, [dashboard])

  const services = dashboard?.services || []
  const recentRequests = dashboard?.recentRequests || []
  const unpaidInvoices = dashboard?.unpaidInvoices || []
  const activities = dashboard?.activities || []

  const requestTabs = TAB_DEFS.map((tab) => ({
    ...tab,
    count: tabCounts[tab.key] ?? dashboard?.requestTabCounts?.[tab.key] ?? 0,
  }))

  const totalPages = requestPagination?.totalPages || 1
  const pageNumbers = useMemo(() => {
    const pages = []
    const max = Math.min(totalPages, 5)
    for (let i = 1; i <= max; i += 1) pages.push(i)
    return pages
  }, [totalPages])

  const txTotalPages = txPagination?.totalPages || 1

  const scrollToRef = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const openInvoicesModal = useCallback(async () => {
    setInvoicesModalOpen(true)
    setInvoicesLoading(true)
    try {
      const res = await apiService.getBusinessBillingInvoices({ page: 1, limit: 50 })
      if (res?.success) setAllInvoices(res.data?.invoices || [])
      else setAllInvoices([])
    } catch {
      setAllInvoices([])
    } finally {
      setInvoicesLoading(false)
    }
  }, [])

  const resetRequestFilters = () => {
    setSearchInput('')
    setSearch('')
    setRequestTypeFilter('all')
    setActiveTab('all')
    setPage(1)
  }

  const focusRequestByCode = (code) => {
    if (!code) return
    scrollToRef(requestsSectionRef)
    setSearchInput(String(code))
    setSearch(String(code).trim())
    setPage(1)
  }

  const handleSummaryAction = (index) => {
    switch (index) {
      case 0:
        openCreateCreditModal()
        break
      case 1:
        setTxExpanded(true)
        setTxPage(1)
        scrollToRef(transactionsSectionRef)
        break
      case 2:
        setActiveTab('processing')
        setPage(1)
        scrollToRef(requestsSectionRef)
        break
      case 3:
        scrollToRef(servicesSectionRef)
        break
      case 4:
        openInvoicesModal()
        break
      default:
        break
    }
  }

  const handleServiceDetail = (svc) => {
    const path = SERVICE_NAV_PATHS[svc.key]
    if (path) navigate(path)
  }

  const handleRequestRowAction = (row) => {
    if (row.sourceType === 'credit_topup' && row.rawStatus === 'pending') {
      openEditCreditModal(row)
      return
    }
    const path = getRequestNavigatePath(row)
    if (path) {
      navigate(path)
      return
    }
    window.alert(
      `${row.type}\nMã: ${row.requestCode || row.id}\nTrạng thái: ${row.status}\nJD: ${row.jd}\nỨng viên: ${row.candidate}`,
    )
  }

  const handleCreditRequestSuccess = async (data) => {
    const request = data?.request || data
    setSuccessMsg(
      creditModalMode === 'edit'
        ? `Đã cập nhật yêu cầu ${request?.requestCode || ''}.`
        : `Đã gửi yêu cầu ${request?.requestCode || ''}. WS sẽ xử lý sớm.`,
    )
    setActiveTab('waiting')
    setPage(1)
    await loadDashboard()
    await loadRequests()
  }

  const openCreateCreditModal = () => {
    setCreditModalMode('create')
    setEditCreditRequest(null)
    setCreditModalOpen(true)
  }

  const openEditCreditModal = async (row) => {
    setCreditModalMode('edit')
    setEditCreditRequest({
      id: row.rawId,
      requestCode: row.requestCode,
      amount: null,
      note: '',
      paymentMethod: 'bank_transfer',
    })
    setCreditModalOpen(true)
    try {
      const res = await apiService.getBusinessCreditRequestById(row.rawId)
      if (res?.success && res.data?.request) {
        const req = res.data.request
        setEditCreditRequest({
          id: req.id,
          requestCode: req.requestCode,
          amount: req.amount,
          note: req.note || '',
          paymentMethod: req.paymentMethod || 'bank_transfer',
        })
      }
    } catch {
      // form still opens with defaults
    }
  }

  const handleCancelCreditRequest = async (row) => {
    if (!window.confirm(`Hủy yêu cầu ${row.requestCode || row.id}?`)) return
    setActionRequestId(row.rawId)
    try {
      const res = await apiService.deleteBusinessCreditRequest(row.rawId)
      if (res?.success) {
        setSuccessMsg(res.message || 'Đã hủy yêu cầu nạp credit')
        await loadDashboard()
        await loadRequests()
      } else {
        alert(res?.message || 'Không thể hủy yêu cầu')
      }
    } catch (e) {
      alert(e?.message || 'Không thể hủy yêu cầu')
    } finally {
      setActionRequestId(null)
    }
  }

  if (loading && !dashboard) {
    return (
      <div
        className="flex h-full items-center justify-center gap-2 bg-[#f4f6f8] text-xs text-slate-500"
        style={{ fontFamily: PAGE_FONT }}
      >
        <Loader2 className="h-4 w-4 animate-spin text-[#0077B6]" />
        Đang tải billing...
      </div>
    )
  }

  const pageBtnCls =
    'flex h-[22px] w-[22px] items-center justify-center rounded-md border border-slate-200 bg-white text-[11px] text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <div
      className="business-homepage-shell flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f6f8]"
      style={{ fontFamily: PAGE_FONT }}
    >
      <style>{billingStyles}</style>
      <div className="business-homepage-ui flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 sm:p-4 text-[11px]">

      {error && (
        <div className={`${CARD} shrink-0 text-xs text-amber-800`}>{error}</div>
      )}

      {successMsg && (
        <div className={`${CARD} flex shrink-0 items-start justify-between gap-2 border-emerald-200 bg-emerald-50 text-xs text-emerald-800`}>
          <span>{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg('')} className="shrink-0 border-0 bg-transparent p-0 cursor-pointer">
            <X className="h-3 w-3 text-emerald-700" />
          </button>
        </div>
      )}

      <CreditTopUpModal
        open={creditModalOpen}
        onClose={() => { setCreditModalOpen(false); setEditCreditRequest(null) }}
        onSuccess={handleCreditRequestSuccess}
        currentCredit={dashboard?.summary?.credit}
        mode={creditModalMode}
        requestId={editCreditRequest?.id}
        initialValues={creditModalMode === 'edit' ? editCreditRequest : null}
      />

      {!isRequestsView && (
      <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5 xl:gap-0 xl:overflow-hidden xl:rounded-xl xl:border xl:border-slate-200 xl:bg-white xl:shadow-sm xl:divide-x xl:divide-slate-100">
        {summaryCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div
              key={i}
              className="flex min-w-0 items-start gap-2 rounded-lg border border-slate-200/90 bg-white p-2 shadow-sm xl:rounded-none xl:border-0 xl:shadow-none xl:p-2.5"
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                style={{ background: card.bg }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: card.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[10px] leading-tight text-slate-500">{card.label}</div>
                <div className="truncate text-sm font-bold leading-snug text-slate-900">{card.value}</div>
                <button
                  type="button"
                  onClick={() => handleSummaryAction(i)}
                  className={`${linkActionCls} mt-0.5 text-[10px]`}
                >
                  {card.link} <ChevronRight className="h-2 w-2 shrink-0" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[1fr_280px]">
        <div className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden">

          {!isRequestsView && (
          <div ref={transactionsSectionRef} style={{ ...cardStyle, flex: txExpanded ? '1 1 auto' : '0 0 auto', maxHeight: txExpanded ? 'none' : '38%', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <SectionHeader
              title="Lịch sử giao dịch credit"
              action={txExpanded ? 'Thu gọn' : 'Xem tất cả'}
              onAction={() => {
                if (txExpanded) {
                  setTxExpanded(false)
                  setTxPage(1)
                } else {
                  setTxExpanded(true)
                  setTxPage(1)
                }
              }}
            />
            <div className="billing-scroll-hide" style={{ overflowY: 'auto', flex: 1, minHeight: 0, position: 'relative' }}>
              {txLoading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0077B6]" />
                </div>
              )}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Ngày giao dịch', 'Loại giao dịch', 'Thay đổi', 'Số dư', 'Nội dung'].map(h => (
                      <th key={h} style={{ textAlign: 'left', fontSize: 7, color: '#94a3b8', fontWeight: 600, padding: '5px 4px', borderBottom: bd, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ fontSize: 8, color: '#94a3b8', padding: '16px 4px', textAlign: 'center' }}>Chưa có giao dịch credit.</td>
                    </tr>
                  ) : transactions.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ fontSize: 8, color: '#64748b', padding: '7px 4px', lineHeight: 1.45, whiteSpace: 'nowrap' }}>{row.date}</td>
                      <td style={{ fontSize: 8, color: '#1e293b', padding: '7px 4px', lineHeight: 1.45 }}>{row.type}</td>
                      <td style={{ fontSize: 8, fontWeight: 600, color: row.change > 0 ? '#16a34a' : '#dc2626', padding: '7px 4px', lineHeight: 1.45, whiteSpace: 'nowrap' }}>
                        {row.change > 0 ? `+${row.change}` : row.change}
                      </td>
                      <td style={{ fontSize: 8, color: '#1e293b', padding: '7px 4px', lineHeight: 1.45 }}>{row.balance.toLocaleString()}</td>
                      <td style={{ fontSize: 8, color: '#64748b', padding: '7px 4px', lineHeight: 1.45 }}>{row.content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {txExpanded && txTotalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, paddingTop: 8, borderTop: bd, flexShrink: 0, marginTop: 4 }}>
                <button
                  type="button"
                  disabled={txPage <= 1}
                  onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                  style={{ width: 22, height: 22, borderRadius: 5, border: bd, background: '#fff', cursor: txPage <= 1 ? 'not-allowed' : 'pointer', opacity: txPage <= 1 ? 0.5 : 1, fontSize: 8 }}
                >
                  ‹
                </button>
                <span style={{ fontSize: 8, color: '#64748b' }}>{txPage} / {txTotalPages}</span>
                <button
                  type="button"
                  disabled={txPage >= txTotalPages}
                  onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
                  style={{ width: 22, height: 22, borderRadius: 5, border: bd, background: '#fff', cursor: txPage >= txTotalPages ? 'not-allowed' : 'pointer', opacity: txPage >= txTotalPages ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ChevronRight {...ICON_SM} color="#64748b" />
                </button>
              </div>
            )}
          </div>
          )}

          <div ref={requestsSectionRef} style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <SectionHeader title="Danh sách yêu cầu" action="Xóa bộ lọc" onAction={resetRequestFilters} />

            <div className="mb-2 flex flex-wrap gap-1.5 shrink-0">
              {requestTabs.map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => { setActiveTab(tab.key); setPage(1) }}
                  className={`cursor-pointer rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                    activeTab === tab.key
                      ? 'border-0 bg-[#0077B6] text-white'
                      : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <div className="mb-2 flex shrink-0 gap-2">
              <div className="relative shrink-0">
                <select
                  value={requestTypeFilter}
                  onChange={(e) => { setRequestTypeFilter(e.target.value); setPage(1) }}
                  className="max-w-[160px] cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-2 pr-7 text-[10px] text-slate-600 outline-none"
                >
                  {REQUEST_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-slate-400" />
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2 py-1">
                <Search className="h-3 w-3 shrink-0 text-slate-400" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm theo mã yêu cầu, JD, ứng viên..."
                  className="min-w-0 flex-1 border-0 bg-transparent text-[11px] outline-none"
                />
              </div>
              <button
                type="button"
                title="Xóa bộ lọc"
                onClick={resetRequestFilters}
                className="flex cursor-pointer rounded-lg border border-slate-200 bg-white p-1.5 hover:bg-slate-50"
              >
                <Filter className="h-3 w-3 text-slate-500" />
              </button>
            </div>

            <div className="billing-scroll-hide" style={{ overflowY: 'auto', flex: 1, minHeight: 0, position: 'relative' }}>
              {requestsLoading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0077B6]" />
                </div>
              )}
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
                <thead>
                  <tr>
                    {['Mã yêu cầu', 'Loại yêu cầu', 'JD liên quan', 'Ứng viên liên quan', 'Trạng thái', 'WS phụ trách', 'Ngày tạo', 'Cập nhật gần nhất', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', fontSize: 7, color: '#94a3b8', fontWeight: 600, padding: '5px 4px', borderBottom: bd, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ fontSize: 8, color: '#94a3b8', padding: '20px 4px', textAlign: 'center' }}>Chưa có yêu cầu nào.</td>
                    </tr>
                  ) : requests.map((row) => (
                    <tr key={row.requestCode || row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ fontSize: 8, fontWeight: 600, color: '#0077B6', padding: '7px 4px', lineHeight: 1.45 }}>
                        <button type="button" onClick={() => handleRequestRowAction(row)} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: '#0077B6', fontWeight: 600, fontSize: 8 }}>
                          {row.id}
                        </button>
                      </td>
                      <td style={{ fontSize: 8, color: '#1e293b', padding: '7px 4px', lineHeight: 1.45 }}>{row.type}</td>
                      <td style={{ fontSize: 8, color: '#64748b', padding: '7px 4px', lineHeight: 1.45, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.jd}</td>
                      <td style={{ fontSize: 8, color: '#64748b', padding: '7px 4px', lineHeight: 1.45 }}>{row.candidate}</td>
                      <td style={{ padding: '7px 4px' }}>
                        <span style={{ fontSize: 7, padding: '2px 6px', borderRadius: 99, background: row.statusBg, color: row.statusColor, fontWeight: 600, whiteSpace: 'nowrap' }}>{row.status}</span>
                      </td>
                      <td style={{ padding: '7px 4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#e8f4fa] text-[7px] font-bold text-[#0077B6]">{row.wsInitials}</div>
                          <span style={{ fontSize: 8, color: '#1e293b', whiteSpace: 'nowrap' }}>{row.ws}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 8, color: '#64748b', padding: '7px 4px', lineHeight: 1.45, whiteSpace: 'nowrap' }}>{row.created}</td>
                      <td style={{ fontSize: 8, color: '#64748b', padding: '7px 4px', lineHeight: 1.45, whiteSpace: 'nowrap' }}>{row.updated}</td>
                      <td style={{ padding: '7px 4px' }}>
                        {row.sourceType === 'credit_topup' && row.rawStatus === 'pending' ? (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              disabled={actionRequestId === row.rawId}
                              onClick={() => openEditCreditModal(row)}
                              style={{ fontSize: 7, fontWeight: 600, color: '#0077B6', background: '#e8f4fa', border: 'none', borderRadius: 4, padding: '3px 6px', cursor: 'pointer' }}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              disabled={actionRequestId === row.rawId}
                              onClick={() => handleCancelCreditRequest(row)}
                              style={{ fontSize: 7, fontWeight: 600, color: '#64748b', background: '#f1f5f9', border: 'none', borderRadius: 4, padding: '3px 6px', cursor: 'pointer' }}
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => handleRequestRowAction(row)} title="Chi tiết / mở liên quan" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                            <MoreHorizontal {...ICON_MD} color="#94a3b8" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: bd, flexShrink: 0, marginTop: 4 }}>
              <div style={{ fontSize: 8, color: '#64748b' }}>
                {requestPagination
                  ? `Hiển thị ${requestPagination.from} – ${requestPagination.to} trong tổng số ${requestPagination.total} yêu cầu`
                  : '—'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {page > 1 && (
                  <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} style={{ width: 22, height: 22, borderRadius: 5, border: bd, background: '#fff', cursor: 'pointer', fontSize: 10, color: '#64748b' }}>‹</button>
                )}
                {pageNumbers.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`${pageBtnCls} font-semibold ${page === p ? 'border-[#0077B6] bg-[#0077B6] text-white' : ''}`}
                  >
                    {p}
                  </button>
                ))}
                {page < totalPages && (
                  <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} style={{ width: 22, height: 22, borderRadius: 5, border: bd, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight {...ICON_SM} color="#64748b" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="billing-scrollbar flex min-h-0 flex-col gap-3 overflow-y-auto">

          <div ref={servicesSectionRef} className={CARD}>
            <SectionHeader title="Dịch vụ đang sử dụng" action="Khám phá" onAction={() => navigate('/business')} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {services.length === 0 ? (
                <p style={{ fontSize: 8, color: '#94a3b8' }}>Chưa có dịch vụ.</p>
              ) : services.map((svc) => {
                const meta = SERVICE_ICON_MAP[svc.key] || SERVICE_ICON_MAP.scout_credit
                const Icon = meta.icon
                return (
                  <div key={svc.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: meta.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon {...ICON_MD} color={meta.iconColor} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginBottom: 2 }}>
                        <span style={{ fontSize: 8, fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>{svc.title}</span>
                        <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 99, background: svc.statusBg, color: svc.statusColor, fontWeight: 600 }}>{svc.status}</span>
                      </div>
                      <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45 }}>{svc.desc}</div>
                    </div>
                    <button type="button" onClick={() => handleServiceDetail(svc)} className="shrink-0 border-0 bg-transparent text-[11px] font-semibold text-[#0077B6] cursor-pointer hover:text-[#006399]">
                      Chi tiết
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateCreditModal}
            className="flex w-full items-center justify-center gap-1 rounded-xl border-0 bg-[#0077B6] py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#006399] cursor-pointer"
          >
            <Plus className="h-3 w-3" /> Tạo yêu cầu mới
          </button>

          <div className={CARD}>
            <SectionHeader title="Yêu cầu gần đây" action="Xem tất cả" onAction={() => { setActiveTab('all'); setPage(1); scrollToRef(requestsSectionRef) }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentRequests.length === 0 ? (
                <p style={{ fontSize: 8, color: '#94a3b8' }}>Chưa có yêu cầu.</p>
              ) : recentRequests.map((req) => (
                <button
                  key={req.id}
                  type="button"
                  onClick={() => focusRequestByCode(req.id)}
                  style={{ display: 'flex', gap: 8, alignItems: 'flex-start', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%', padding: 0 }}
                >
                  <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md bg-[#e8f4fa]">
                    <ClipboardList {...ICON_SM} color="#0077B6" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 8, fontWeight: 600, color: '#0077B6', lineHeight: 1.4 }}>{req.id}</div>
                    <div style={{ fontSize: 8, color: '#1e293b', lineHeight: 1.45 }}>{req.title}</div>
                    <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45 }}>{req.sub}</div>
                    <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45 }}>{req.date}</div>
                  </div>
                  <span style={{ fontSize: 7, padding: '2px 5px', borderRadius: 99, background: req.statusBg, color: req.statusColor, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{req.status}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={CARD}>
            <SectionHeader title="Invoice chưa thanh toán" action="Xem tất cả" onAction={openInvoicesModal} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {unpaidInvoices.length === 0 ? (
                <p style={{ fontSize: 8, color: '#94a3b8' }}>Không có hóa đơn chưa thanh toán.</p>
              ) : unpaidInvoices.map((inv) => (
                <button
                  key={inv.id}
                  type="button"
                  onClick={openInvoicesModal}
                  style={{ display: 'flex', gap: 8, alignItems: 'flex-start', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%', padding: 0 }}
                >
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileWarning {...ICON_SM} color="#dc2626" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 8, fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>{inv.id}</div>
                    <div style={{ fontSize: 8, fontWeight: 600, color: '#1e293b', lineHeight: 1.45 }}>{inv.amount}</div>
                    <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45 }}>{inv.due}</div>
                  </div>
                  <span style={{ fontSize: 7, padding: '2px 5px', borderRadius: 99, background: '#fee2e2', color: '#dc2626', fontWeight: 600, whiteSpace: 'nowrap' }}>Chưa thanh toán</span>
                </button>
              ))}
            </div>
          </div>

          <div className={CARD}>
            <SectionHeader title="Hoạt động gần đây" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activities.length === 0 ? (
                <p style={{ fontSize: 8, color: '#94a3b8' }}>Chưa có hoạt động.</p>
              ) : activities.map((act, i) => (
                <div key={i} style={{ fontSize: 8, color: '#475569', lineHeight: 1.55 }}>
                  <div style={{ fontSize: 7, color: '#94a3b8', marginBottom: 2 }}>{act.time}</div>
                  {act.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {invoicesModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          onClick={() => setInvoicesModalOpen(false)}
        >
          <div
            className={`${CARD} flex max-h-[80vh] w-full max-w-md flex-col p-4 shadow-xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-bold text-slate-800">Danh sách hóa đơn</div>
              <button type="button" onClick={() => setInvoicesModalOpen(false)} className="border-0 bg-transparent p-0 cursor-pointer">
                <X className="h-3.5 w-3.5 text-slate-500" />
              </button>
            </div>
            <div className="billing-scrollbar min-h-0 flex-1 overflow-y-auto">
              {invoicesLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 24, color: '#64748b', fontSize: 9 }}>
                  <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />
                  Đang tải...
                </div>
              ) : allInvoices.length === 0 ? (
                <p style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', padding: 16 }}>Không có hóa đơn.</p>
              ) : (
                allInvoices.map((inv) => (
                  <div key={inv.invoiceCode || inv.id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#1e293b' }}>{inv.id || inv.invoiceCode}</div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b', marginTop: 2 }}>{inv.amount}</div>
                    <div style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>{inv.due}</div>
                    {inv.description && <div style={{ fontSize: 8, color: '#94a3b8', marginTop: 4 }}>{inv.description}</div>}
                    <span style={{
                      display: 'inline-block', marginTop: 6, fontSize: 7, padding: '2px 6px', borderRadius: 99, fontWeight: 600,
                      background: inv.status === 'paid' ? '#dcfce7' : '#fee2e2',
                      color: inv.status === 'paid' ? '#16a34a' : '#dc2626',
                    }}
                    >
                      {inv.statusLabel || (inv.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán')}
                    </span>
                  </div>
                ))
              )}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-slate-400">
              Liên hệ JobShare WS nếu cần hỗ trợ thanh toán hoặc xuất hóa đơn.
            </p>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default Billing
