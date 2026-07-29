import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CreditCard, Loader2, Plus, Search } from 'lucide-react'
import apiService from '../../services/api'
import CreditTopUpModal from './CreditTopUpModal'

const ICON_SM = { width: 10, height: 10 }
const ICON_MD = { width: 12, height: 12 }
const bd = '1px solid #e2e8f0'

const STATUS_STYLES = {
  pending: { label: 'Chờ WS duyệt', bg: '#dbeafe', color: '#2563eb' },
  approved: { label: 'Đã duyệt', bg: '#dcfce7', color: '#16a34a' },
  rejected: { label: 'Từ chối', bg: '#fee2e2', color: '#dc2626' },
  cancelled: { label: 'Đã hủy', bg: '#f1f5f9', color: '#64748b' },
}

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

export default function WsCreditRequestsPanel({ mode = 'create', onSuccessMessage, onViewInChat }) {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [currentCredit, setCurrentCredit] = useState(0)
  const [creditModalOpen, setCreditModalOpen] = useState(false)
  const [creditModalMode, setCreditModalMode] = useState('create')
  const [editCreditRequest, setEditCreditRequest] = useState(null)
  const [actionRequestId, setActionRequestId] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [dashRes, reqRes] = await Promise.all([
        apiService.getBusinessBillingDashboard(),
        apiService.getBusinessCreditRequests({
          page: 1,
          limit: mode === 'history' ? 50 : 10,
          ...(statusFilter ? { status: statusFilter } : {}),
        }),
      ])
      if (dashRes?.success) {
        setCurrentCredit(dashRes.data?.summary?.credit ?? 0)
      }
      if (reqRes?.success) {
        setRequests(reqRes.data?.requests || [])
      } else {
        setRequests([])
      }
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [mode, statusFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const pendingRequest = useMemo(
    () => requests.find((r) => r.status === 'pending') || null,
    [requests],
  )

  const filteredRequests = useMemo(() => {
    const q = searchInput.trim().toLowerCase()
    if (!q) return requests
    return requests.filter((r) => {
      const code = String(r.requestCode || r.id || '').toLowerCase()
      const note = String(r.note || '').toLowerCase()
      return code.includes(q) || note.includes(q)
    })
  }, [requests, searchInput])

  const openCreateModal = () => {
    setCreditModalMode('create')
    setEditCreditRequest(null)
    setCreditModalOpen(true)
  }

  const openEditModal = async (req) => {
    setCreditModalMode('edit')
    setEditCreditRequest({
      id: req.id,
      requestCode: req.requestCode,
      amount: req.amount,
      note: req.note || '',
      paymentMethod: req.paymentMethod || 'bank_transfer',
    })
    setCreditModalOpen(true)
  }

  const handleSuccess = async (data) => {
    const request = data?.request || data
    const wsChat = data?.wsChat
    onSuccessMessage?.(
      creditModalMode === 'edit'
        ? `Đã cập nhật yêu cầu ${request?.requestCode || ''}.`
        : `Đã gửi yêu cầu ${request?.requestCode || ''}. WS sẽ duyệt sớm.`,
      wsChat,
    )
    await loadData()
  }

  const handleCancel = async (req) => {
    if (!window.confirm(`Hủy yêu cầu ${req.requestCode || req.id}?`)) return
    setActionRequestId(req.id)
    try {
      const res = await apiService.deleteBusinessCreditRequest(req.id)
      if (res?.success) {
        onSuccessMessage?.(res.message || 'Đã hủy yêu cầu nạp credit')
        await loadData()
      } else {
        alert(res?.message || 'Không thể hủy yêu cầu')
      }
    } catch (e) {
      alert(e?.message || 'Không thể hủy yêu cầu')
    } finally {
      setActionRequestId(null)
    }
  }

  const statusStyle = (status) => STATUS_STYLES[status] || STATUS_STYLES.pending

  if (mode === 'create') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc', minHeight: 0 }}>
        <CreditTopUpModal
          open={creditModalOpen}
          onClose={() => setCreditModalOpen(false)}
          onSuccess={handleSuccess}
          currentCredit={currentCredit}
          mode={creditModalMode}
          requestId={editCreditRequest?.id}
          initialValues={editCreditRequest}
        />

        <div style={{ background: '#fff', borderBottom: bd, padding: '8px 12px', flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>Yêu cầu nạp credit</div>
          <div style={{ fontSize: 8, color: '#64748b' }}>
            Credit hiện tại: <strong>{Number(currentCredit).toLocaleString('vi-VN')}</strong> — WS sẽ phê duyệt và cộng credit sau khi xác nhận thanh toán.
          </div>
        </div>

        <div className="msg-scroll-hide" style={{ flex: 1, overflowY: 'auto', padding: 12, minHeight: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, color: '#94a3b8', gap: 6 }}>
              <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} /> Đang tải...
            </div>
          ) : (
            <>
              <div style={{ background: '#fff', border: bd, borderRadius: 8, padding: 14, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CreditCard style={{ width: 18, height: 18, color: '#854d0e' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Tạo yêu cầu cấp thêm credit</div>
                    <div style={{ fontSize: 8, color: '#64748b', lineHeight: 1.55, marginBottom: 10 }}>
                      Gửi yêu cầu nạp credit cho WS phê duyệt. Mỗi lần chỉ có một yêu cầu đang chờ duyệt.
                    </div>
                    <button
                      type="button"
                      onClick={openCreateModal}
                      disabled={!!pendingRequest}
                      style={{
                        border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 9, fontWeight: 700,
                        background: pendingRequest ? '#cbd5e1' : '#4f46e5', color: '#fff',
                        cursor: pendingRequest ? 'not-allowed' : 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <Plus {...ICON_SM} /> Tạo yêu cầu nạp credit
                    </button>
                  </div>
                </div>
              </div>

              {pendingRequest && (
                <div style={{ background: '#fff', border: '1.5px solid #93c5fd', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#1e293b' }}>Yêu cầu đang chờ WS duyệt</div>
                    <span style={{ fontSize: 7, padding: '2px 6px', borderRadius: 99, background: '#dbeafe', color: '#2563eb', fontWeight: 600 }}>
                      Chờ WS duyệt
                    </span>
                  </div>
                  <div style={{ fontSize: 8, color: '#475569', lineHeight: 1.6, marginBottom: 8 }}>
                    <div><strong>Mã:</strong> {pendingRequest.requestCode || pendingRequest.id}</div>
                    <div><strong>Số credit:</strong> {Number(pendingRequest.amount || 0).toLocaleString('vi-VN')}</div>
                    <div><strong>Ngày gửi:</strong> {formatDate(pendingRequest.requestedAt || pendingRequest.createdAt)}</div>
                    {pendingRequest.note && <div><strong>Ghi chú:</strong> {pendingRequest.note}</div>}
                  </div>
                  <div style={{ fontSize: 8, color: '#64748b', background: '#f8fafc', borderRadius: 6, padding: '8px', marginBottom: 10, lineHeight: 1.55 }}>
                    Yêu cầu này cũng được gửi vào <strong>tab Trò chuyện WS</strong>. Admin sẽ duyệt hoặc từ chối trực tiếp trong cuộc chat.
                  </div>
                  {onViewInChat && (
                    <button
                      type="button"
                      onClick={onViewInChat}
                      style={{
                        width: '100%', border: 'none', borderRadius: 6, padding: '8px', fontSize: 9, fontWeight: 700,
                        background: '#4f46e5', color: '#fff', cursor: 'pointer', marginBottom: 8,
                      }}
                    >
                      Xem trong tab Trò chuyện
                    </button>
                  )}
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <button type="button" onClick={() => openEditModal(pendingRequest)} style={{ border: bd, borderRadius: 5, padding: '5px 10px', fontSize: 8, background: '#fff', cursor: 'pointer' }}>
                      Sửa yêu cầu
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancel(pendingRequest)}
                      disabled={actionRequestId === pendingRequest.id}
                      style={{ border: bd, borderRadius: 5, padding: '5px 10px', fontSize: 8, background: '#fff', color: '#dc2626', cursor: 'pointer' }}
                    >
                      {actionRequestId === pendingRequest.id ? 'Đang hủy...' : 'Hủy yêu cầu'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc', minHeight: 0 }}>
      <CreditTopUpModal
        open={creditModalOpen}
        onClose={() => setCreditModalOpen(false)}
        onSuccess={handleSuccess}
        currentCredit={currentCredit}
        mode={creditModalMode}
        requestId={editCreditRequest?.id}
        initialValues={editCreditRequest}
      />

      <div style={{ background: '#fff', borderBottom: bd, padding: '8px 12px', flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Lịch sử yêu cầu nạp credit</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 120, display: 'flex', alignItems: 'center', gap: 4, border: bd, borderRadius: 6, padding: '3px 8px', background: '#f8fafc' }}>
            <Search {...ICON_MD} color="#94a3b8" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo mã yêu cầu..."
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 8, outline: 'none', minWidth: 0 }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ border: bd, borderRadius: 6, padding: '4px 8px', fontSize: 8, background: '#fff' }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ WS duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
            <option value="cancelled">Đã hủy</option>
          </select>
          <button
            type="button"
            onClick={openCreateModal}
            style={{ border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 8, fontWeight: 600, background: '#4f46e5', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <Plus {...ICON_SM} /> Tạo mới
          </button>
        </div>
      </div>

      <div className="msg-scroll-hide" style={{ flex: 1, overflowY: 'auto', padding: 12, minHeight: 0, position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <Loader2 className="animate-spin" style={{ width: 14, height: 14, color: '#6366f1' }} />
          </div>
        )}
        {filteredRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 9 }}>Chưa có yêu cầu nạp credit.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredRequests.map((req) => {
              const st = statusStyle(req.status)
              const isPending = req.status === 'pending'
              return (
                <div key={req.id} style={{ background: '#fff', border: bd, borderRadius: 8, padding: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#4f46e5' }}>{req.requestCode || `#${req.id}`}</div>
                      <div style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>{formatDate(req.requestedAt || req.createdAt)}</div>
                    </div>
                    <span style={{ fontSize: 7, padding: '2px 6px', borderRadius: 99, background: st.bg, color: st.color, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {st.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 8, color: '#475569', lineHeight: 1.6 }}>
                    <div><strong>Credit yêu cầu:</strong> {Number(req.amount || 0).toLocaleString('vi-VN')}</div>
                    {req.note && <div><strong>Ghi chú:</strong> {req.note}</div>}
                    {req.handledByAdmin?.name && (
                      <div><strong>WS xử lý:</strong> {req.handledByAdmin.name}</div>
                    )}
                    {req.handledAt && <div><strong>Thời gian xử lý:</strong> {formatDate(req.handledAt)}</div>}
                    {req.adminNote && <div><strong>Phản hồi WS:</strong> {req.adminNote}</div>}
                  </div>
                  {isPending && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button type="button" onClick={() => openEditModal(req)} style={{ border: bd, borderRadius: 5, padding: '4px 8px', fontSize: 8, background: '#fff', cursor: 'pointer' }}>
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancel(req)}
                        disabled={actionRequestId === req.id}
                        style={{ border: bd, borderRadius: 5, padding: '4px 8px', fontSize: 8, background: '#fff', color: '#dc2626', cursor: 'pointer' }}
                      >
                        Hủy
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
