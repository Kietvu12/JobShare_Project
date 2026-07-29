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

const ICON_SM = { width: 10, height: 10 }
const ICON_MD = { width: 12, height: 12 }
const bd = '1px solid #e2e8f0'

const SCROLL_HIDE = `
  .billing-scroll-hide::-webkit-scrollbar { display: none; }
  .billing-scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
`

const SERVICE_ICON_MAP = {
  scout_credit: { icon: Briefcase, iconBg: '#dbeafe', iconColor: '#2563eb' },
  scout_performance: { icon: TrendingUp, iconBg: '#ede9fe', iconColor: '#7c3aed' },
  saiyo_branding: { icon: FileText, iconBg: '#fce7f3', iconColor: '#db2777' },
  partner_ctv: { icon: Layers, iconBg: '#ffedd5', iconColor: '#ea580c' },
}

const SUMMARY_ICON_MAP = [
  { icon: Coins, bg: '#ffedd5', color: '#ea580c', link: 'Nạp thêm credit' },
  { icon: ArrowDownToLine, bg: '#ede9fe', color: '#7c3aed', link: 'Chi tiết' },
  { icon: ClipboardList, bg: '#dcfce7', color: '#16a34a', link: 'Xem danh sách' },
  { icon: Layers, bg: '#dbeafe', color: '#2563eb', link: 'Xem chi tiết' },
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

const cardStyle = { background: '#fff', border: bd, borderRadius: 8, padding: '8px 10px' }
const linkStyle = { fontSize: 8, color: '#4f46e5', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 2, padding: 0 }

const SectionHeader = ({ title, action, onAction }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
    <div style={{ fontSize: 9, fontWeight: 700, color: '#1e293b' }}>{title}</div>
    {action && (
      <button type="button" onClick={onAction} style={linkStyle}>{action} <ChevronRight {...ICON_SM} /></button>
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
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', gap: 8, fontSize: 10, color: '#64748b' }}>
        <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
        Đang tải billing...
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden', padding: '6px 8px', gap: 8, fontSize: 9, minHeight: 0 }}>
      <style>{SCROLL_HIDE}</style>

      {error && (
        <div style={{ ...cardStyle, color: '#b45309', fontSize: 9, flexShrink: 0 }}>{error}</div>
      )}

      {successMsg && (
        <div style={{ ...cardStyle, color: '#15803d', background: '#f0fdf4', fontSize: 9, flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <span>{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg('')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
            <X {...ICON_MD} color="#15803d" />
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, flexShrink: 0 }}>
        {summaryCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 6, minHeight: 72 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon {...ICON_MD} color={card.color} />
              </div>
              <div style={{ fontSize: 8, color: '#64748b', lineHeight: 1.4 }}>{card.label}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>{card.value}</div>
              <button
                type="button"
                onClick={() => handleSummaryAction(i)}
                style={{ ...linkStyle, marginTop: 'auto' }}
              >
                {card.link} <ChevronRight {...ICON_SM} />
              </button>
            </div>
          )
        })}
      </div>
      )}

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 260px', gap: 8, minHeight: 0, overflow: 'hidden' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0, overflow: 'hidden' }}>

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
                  <Loader2 className="animate-spin" style={{ width: 14, height: 14, color: '#6366f1' }} />
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

            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8, flexShrink: 0 }}>
              {requestTabs.map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => { setActiveTab(tab.key); setPage(1) }}
                  style={{
                    fontSize: 8, padding: '3px 8px', borderRadius: 99, cursor: 'pointer', border: activeTab === tab.key ? 'none' : bd,
                    background: activeTab === tab.key ? '#4f46e5' : '#fff', color: activeTab === tab.key ? '#fff' : '#64748b', fontWeight: 600,
                  }}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexShrink: 0 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <select
                  value={requestTypeFilter}
                  onChange={(e) => { setRequestTypeFilter(e.target.value); setPage(1) }}
                  style={{ border: bd, borderRadius: 6, padding: '4px 24px 4px 8px', background: '#fff', fontSize: 8, color: '#64748b', cursor: 'pointer', appearance: 'none', maxWidth: 140 }}
                >
                  {REQUEST_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown {...ICON_SM} color="#94a3b8" style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, border: bd, borderRadius: 6, padding: '3px 8px', background: '#f8fafc', minWidth: 0 }}>
                <Search {...ICON_MD} color="#94a3b8" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm theo mã yêu cầu, JD, ứng viên..."
                  style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 8, outline: 'none', minWidth: 0 }}
                />
              </div>
              <button
                type="button"
                title="Xóa bộ lọc"
                onClick={resetRequestFilters}
                style={{ border: bd, borderRadius: 6, padding: '4px 6px', background: '#fff', cursor: 'pointer', display: 'flex' }}
              >
                <Filter {...ICON_MD} color="#64748b" />
              </button>
            </div>

            <div className="billing-scroll-hide" style={{ overflowY: 'auto', flex: 1, minHeight: 0, position: 'relative' }}>
              {requestsLoading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                  <Loader2 className="animate-spin" style={{ width: 14, height: 14, color: '#6366f1' }} />
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
                      <td style={{ fontSize: 8, fontWeight: 600, color: '#4f46e5', padding: '7px 4px', lineHeight: 1.45 }}>
                        <button type="button" onClick={() => handleRequestRowAction(row)} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: '#4f46e5', fontWeight: 600, fontSize: 8 }}>
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
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#ede9fe', color: '#5b21b6', fontSize: 7, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{row.wsInitials}</div>
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
                              style={{ fontSize: 7, fontWeight: 600, color: '#4f46e5', background: '#eef2ff', border: 'none', borderRadius: 4, padding: '3px 6px', cursor: 'pointer' }}
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
                  <button key={p} type="button" onClick={() => setPage(p)} style={{
                    width: 22, height: 22, borderRadius: 5, border: bd, fontSize: 8, cursor: 'pointer',
                    background: page === p ? '#4f46e5' : '#fff', color: page === p ? '#fff' : '#64748b', fontWeight: 600,
                  }}>{p}</button>
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

        <div className="billing-scroll-hide" style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', minHeight: 0 }}>

          <div ref={servicesSectionRef} style={cardStyle}>
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
                    <button type="button" onClick={() => handleServiceDetail(svc)} style={{ fontSize: 8, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, fontWeight: 600 }}>Chi tiết</button>
                  </div>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateCreditModal}
            style={{
            width: '100%', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px', fontSize: 9, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
          >
            <Plus {...ICON_MD} color="#fff" /> Tạo yêu cầu mới
          </button>

          <div style={cardStyle}>
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
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ClipboardList {...ICON_SM} color="#5b21b6" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 8, fontWeight: 600, color: '#4f46e5', lineHeight: 1.4 }}>{req.id}</div>
                    <div style={{ fontSize: 8, color: '#1e293b', lineHeight: 1.45 }}>{req.title}</div>
                    <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45 }}>{req.sub}</div>
                    <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45 }}>{req.date}</div>
                  </div>
                  <span style={{ fontSize: 7, padding: '2px 5px', borderRadius: 99, background: req.statusBg, color: req.statusColor, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{req.status}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
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

          <div style={cardStyle}>
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
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setInvoicesModalOpen(false)}
        >
          <div
            style={{ ...cardStyle, width: '100%', maxWidth: 420, maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>Danh sách hóa đơn</div>
              <button type="button" onClick={() => setInvoicesModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                <X {...ICON_MD} color="#64748b" />
              </button>
            </div>
            <div className="billing-scroll-hide" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
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
            <p style={{ fontSize: 8, color: '#94a3b8', marginTop: 10, lineHeight: 1.45 }}>
              Liên hệ JobShare WS nếu cần hỗ trợ thanh toán hoặc xuất hóa đơn.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Billing
