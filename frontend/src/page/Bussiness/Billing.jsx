import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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

const cardStyle = { background: '#fff', border: bd, borderRadius: 8, padding: '8px 10px' }
const linkStyle = { fontSize: 8, color: '#4f46e5', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 2, padding: 0 }

const SectionHeader = ({ title, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
    <div style={{ fontSize: 9, fontWeight: 700, color: '#1e293b' }}>{title}</div>
    {action && (
      <button type="button" style={linkStyle}>{action} <ChevronRight {...ICON_SM} /></button>
    )}
  </div>
)

function CreditTopUpModal({ open, onClose, onSuccess, currentCredit, mode = 'create', requestId, initialValues }) {
  const isEdit = mode === 'edit'
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!open) {
      setAmount('')
      setNote('')
      setPaymentMethod('bank_transfer')
      setFormError('')
      return
    }
    if (isEdit && initialValues) {
      setAmount(String(initialValues.amount || ''))
      setNote(initialValues.note || '')
      setPaymentMethod(initialValues.paymentMethod || 'bank_transfer')
      setFormError('')
    } else if (!isEdit) {
      setAmount('')
      setNote('')
      setPaymentMethod('bank_transfer')
      setFormError('')
    }
  }, [open, isEdit, initialValues])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const creditAmount = Math.trunc(Number(amount))
    if (!creditAmount || creditAmount <= 0) {
      setFormError('Vui lòng nhập số credit cần nạp (lớn hơn 0).')
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      const payload = {
        amount: creditAmount,
        note: note.trim() || undefined,
        paymentMethod,
      }
      const res = isEdit
        ? await apiService.updateBusinessCreditRequest(requestId, payload)
        : await apiService.createBusinessCreditRequest(payload)
      if (res?.success) {
        onSuccess?.(res.data?.request)
        onClose()
      } else {
        setFormError(res?.message || (isEdit ? 'Không thể cập nhật yêu cầu' : 'Không thể gửi yêu cầu'))
      }
    } catch (err) {
      setFormError(err?.message || (isEdit ? 'Không thể cập nhật yêu cầu' : 'Không thể gửi yêu cầu nạp credit'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ ...cardStyle, width: '100%', maxWidth: 360, padding: '14px 16px', boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>{isEdit ? 'Sửa yêu cầu nạp credit' : 'Yêu cầu nạp credit'}</div>
            <div style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>
              Credit hiện tại: <strong>{Number(currentCredit || 0).toLocaleString('vi-VN')}</strong>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}>
            <X style={{ width: 14, height: 14, color: '#64748b' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 8, fontWeight: 600, color: '#475569' }}>Số credit cần nạp *</span>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="VD: 500, 1000, 2000"
              style={{ border: bd, borderRadius: 6, padding: '8px 10px', fontSize: 10, outline: 'none' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 8, fontWeight: 600, color: '#475569' }}>Phương thức thanh toán</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ border: bd, borderRadius: 6, padding: '8px 10px', fontSize: 10, outline: 'none', background: '#fff' }}
            >
              <option value="bank_transfer">Chuyển khoản ngân hàng</option>
              <option value="other">Khác / Liên hệ WS</option>
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 8, fontWeight: 600, color: '#475569' }}>Ghi chú (tuỳ chọn)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="VD: Cần nạp gấp để unlock ứng viên Scout tuần này"
              style={{ border: bd, borderRadius: 6, padding: '8px 10px', fontSize: 10, outline: 'none', resize: 'vertical' }}
            />
          </label>

          <p style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
            {isEdit
              ? 'Chỉ có thể sửa yêu cầu đang chờ WS duyệt.'
              : 'WS sẽ xác nhận thanh toán và cộng credit vào tài khoản. Mỗi lần chỉ có 1 yêu cầu đang chờ duyệt.'}
          </p>

          {formError && (
            <div style={{ fontSize: 8, color: '#dc2626', background: '#fef2f2', borderRadius: 6, padding: '6px 8px' }}>{formError}</div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ border: bd, borderRadius: 6, padding: '8px 12px', fontSize: 9, background: '#fff', cursor: 'pointer' }}>
              Huỷ
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 9, fontWeight: 700,
                background: submitting ? '#a5b4fc' : '#4f46e5', color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              {submitting && <Loader2 className="animate-spin" style={{ width: 12, height: 12 }} />}
              {isEdit ? 'Lưu thay đổi' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const Billing = ({ focusSection }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const isRequestsView = focusSection === 'requests'
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [error, setError] = useState('')
  const [dashboard, setDashboard] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [requests, setRequests] = useState([])
  const [requestPagination, setRequestPagination] = useState(null)
  const [tabCounts, setTabCounts] = useState({})
  const [creditModalOpen, setCreditModalOpen] = useState(false)
  const [creditModalMode, setCreditModalMode] = useState('create')
  const [editCreditRequest, setEditCreditRequest] = useState(null)
  const [actionRequestId, setActionRequestId] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [dashRes, txRes] = await Promise.all([
        apiService.getBusinessBillingDashboard(),
        !isRequestsView ? apiService.getBusinessBillingTransactions({ page: 1, limit: 10 }) : Promise.resolve(null),
      ])
      if (dashRes?.success) setDashboard(dashRes.data)
      else setError(dashRes?.message || 'Không tải được dữ liệu billing')
      if (txRes?.success) setTransactions(txRes.data?.transactions || [])
    } catch (e) {
      setError(e?.message || 'Không tải được dữ liệu billing')
    } finally {
      setLoading(false)
    }
  }, [isRequestsView])

  const loadRequests = useCallback(async () => {
    setRequestsLoading(true)
    try {
      const res = await apiService.getBusinessBillingRequests({
        page,
        limit: 8,
        tab: activeTab === 'all' ? undefined : activeTab,
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
  }, [page, activeTab, search])

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

  const handleCreditRequestSuccess = async (request) => {
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
        <div style={{ ...cardStyle, color: '#15803d', background: '#f0fdf4', fontSize: 9, flexShrink: 0 }}>{successMsg}</div>
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
                onClick={() => { if (i === 0) openCreateCreditModal() }}
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
          <div style={{ ...cardStyle, flex: '0 0 auto', maxHeight: '38%', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <SectionHeader title="Lịch sử giao dịch credit" action="Xem tất cả" />
            <div className="billing-scroll-hide" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
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
          </div>
          )}

          <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <SectionHeader title="Danh sách yêu cầu" />

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
              <button type="button" style={{ border: bd, borderRadius: 6, padding: '4px 8px', background: '#fff', fontSize: 8, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Tất cả loại yêu cầu <ChevronDown {...ICON_SM} />
              </button>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, border: bd, borderRadius: 6, padding: '3px 8px', background: '#f8fafc', minWidth: 0 }}>
                <Search {...ICON_MD} color="#94a3b8" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm theo mã yêu cầu, JD, ứng viên..."
                  style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 8, outline: 'none', minWidth: 0 }}
                />
              </div>
              <button type="button" style={{ border: bd, borderRadius: 6, padding: '4px 6px', background: '#fff', cursor: 'pointer', display: 'flex' }}>
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
                      <td style={{ fontSize: 8, fontWeight: 600, color: '#4f46e5', padding: '7px 4px', lineHeight: 1.45 }}>{row.id}</td>
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
                          <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
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

          <div style={cardStyle}>
            <SectionHeader title="Dịch vụ đang sử dụng" action="Xem tất cả" />
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
                    <button type="button" style={{ fontSize: 8, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, fontWeight: 600 }}>Chi tiết</button>
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
            <SectionHeader title="Yêu cầu gần đây" action="Xem tất cả" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentRequests.length === 0 ? (
                <p style={{ fontSize: 8, color: '#94a3b8' }}>Chưa có yêu cầu.</p>
              ) : recentRequests.map((req) => (
                <div key={req.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
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
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <SectionHeader title="Invoice chưa thanh toán" action="Xem tất cả" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {unpaidInvoices.length === 0 ? (
                <p style={{ fontSize: 8, color: '#94a3b8' }}>Không có hóa đơn chưa thanh toán.</p>
              ) : unpaidInvoices.map((inv) => (
                <div key={inv.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileWarning {...ICON_SM} color="#dc2626" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 8, fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>{inv.id}</div>
                    <div style={{ fontSize: 8, fontWeight: 600, color: '#1e293b', lineHeight: 1.45 }}>{inv.amount}</div>
                    <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45 }}>{inv.due}</div>
                  </div>
                  <span style={{ fontSize: 7, padding: '2px 5px', borderRadius: 99, background: '#fee2e2', color: '#dc2626', fontWeight: 600, whiteSpace: 'nowrap' }}>Chưa thanh toán</span>
                </div>
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
    </div>
  )
}

export default Billing
