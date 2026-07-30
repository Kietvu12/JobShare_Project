import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Search, ExternalLink, Users, Loader2, X } from 'lucide-react'
import apiService from '../../services/api'
import {
  SCOUT_APPROACH_STATUS_OPTIONS,
  getScoutDisplayName,
  getScoutPipelineMeta,
} from '../../utils/scoutCandidateDisplay'

const ICON_SM = { width: 10, height: 10 }
const bd = '1px solid #e2e8f0'

function formatTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function formatListTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return formatTime(value)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

const WsLogo = ({ size = 28 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #38bdf8, #0077B6)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.32, fontWeight: 700, flexShrink: 0,
  }}>WS</div>
)

function CvAttachmentCard({ cv, mode, onOpen, kind = 'recommendation' }) {
  const label = cv.code || cv.name || `CV #${cv.cvId}`
  const sub = [cv.desiredPosition, cv.jobCategory?.name].filter(Boolean).join(' · ')
  const footer = kind === 'request'
    ? (mode === 'admin' ? 'Hồ sơ doanh nghiệp yêu cầu mở' : 'Hồ sơ yêu cầu mở qua Scout Performance')
    : (mode === 'admin' ? 'Đã gửi vào danh sách Scout DN' : 'Xem hồ sơ trên Scout →')
  const canOpen = kind === 'recommendation' || (kind === 'request' && mode === 'business' && onOpen)
  return (
    <button
      type="button"
      onClick={() => (canOpen ? onOpen?.(cv.cvId) : undefined)}
      style={{
        width: '100%', textAlign: 'left', background: '#f8fafc', border: bd, borderRadius: 8,
        padding: '8px 10px', cursor: canOpen ? 'pointer' : 'default',
      }}
    >
      <div style={{ fontSize: 9, fontWeight: 700, color: '#1e293b' }}>{label}</div>
      {sub && <div style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>{sub}</div>}
      <div style={{ fontSize: 7, color: '#0077B6', marginTop: 4 }}>{footer}</div>
    </button>
  )
}

function getRequestedCvFromMessage(message) {
  const attachment = (message.cvAttachments || [])[0]
  if (attachment?.cvId) return attachment
  const payload = message.requestPayload || {}
  if (!payload.cvId) return null
  return {
    cvId: payload.cvId,
    code: payload.cvCode || null,
    desiredPosition: payload.desiredPosition || null,
    jobCategory: payload.jobCategory || null,
  }
}

const PAYMENT_METHOD_LABELS = {
  bank_transfer: 'Chuyển khoản ngân hàng',
  other: 'Khác / Liên hệ WS',
}

const CREDIT_STATUS_STYLES = {
  pending: { label: 'Chờ WS duyệt', color: '#2563eb', bg: '#dbeafe' },
  approved: { label: 'Đã duyệt', color: '#16a34a', bg: '#dcfce7' },
  rejected: { label: 'Từ chối', color: '#dc2626', bg: '#fee2e2' },
  cancelled: { label: 'Đã hủy', color: '#64748b', bg: '#f1f5f9' },
}

function SaiyoBrandingRequestEventCard({ message }) {
  const payload = message.requestPayload || {}
  const title = payload.serviceTitle || 'Dịch vụ Saiyo Branding'

  return (
    <div style={{
      width: '100%', maxWidth: 320, background: '#fff', border: '1.5px solid #ddd6fe',
      borderRadius: 10, padding: '10px 12px', boxShadow: '0 2px 8px rgba(139,92,246,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#5b21b6' }}>Yêu cầu Saiyo Branding</div>
        <span style={{ fontSize: 7, fontWeight: 600, padding: '2px 6px', borderRadius: 99, color: '#7c3aed', background: '#ede9fe' }}>
          Chờ WS
        </span>
      </div>
      <div style={{ fontSize: 8, color: '#475569', lineHeight: 1.65 }}>
        <div><strong>Dịch vụ:</strong> {title}</div>
        {payload.note && <div><strong>Ghi chú DN:</strong> {payload.note}</div>}
      </div>
    </div>
  )
}

function CreditRequestEventCard({
  message,
  mode,
  onApprove,
  onReject,
  actionRequestId,
}) {
  const payload = message.requestPayload || {}
  const status = payload.status || 'pending'
  const statusStyle = CREDIT_STATUS_STYLES[status] || CREDIT_STATUS_STYLES.pending
  const isPending = status === 'pending'
  const [rejectNote, setRejectNote] = useState('')
  const [showReject, setShowReject] = useState(false)

  return (
    <div style={{
      width: '100%', maxWidth: 320, background: '#fff', border: '1.5px solid #fde68a',
      borderRadius: 10, padding: '10px 12px', boxShadow: '0 2px 8px rgba(234,179,8,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e' }}>Yêu cầu nạp credit</div>
        <span style={{ fontSize: 7, fontWeight: 600, padding: '2px 6px', borderRadius: 99, color: statusStyle.color, background: statusStyle.bg }}>
          {statusStyle.label}
        </span>
      </div>

      <div style={{ fontSize: 8, color: '#475569', lineHeight: 1.65, marginBottom: 8 }}>
        <div><strong>Mã:</strong> {payload.requestCode || `#${payload.requestId}`}</div>
        <div><strong>Số credit:</strong> {Number(payload.amount || 0).toLocaleString('vi-VN')}</div>
        <div><strong>Thanh toán:</strong> {PAYMENT_METHOD_LABELS[payload.paymentMethod] || payload.paymentMethod || '—'}</div>
        {payload.note && <div><strong>Ghi chú DN:</strong> {payload.note}</div>}
        {payload.adminNote && <div><strong>Phản hồi WS:</strong> {payload.adminNote}</div>}
      </div>

      {mode === 'admin' && isPending && onApprove && onReject && (
        <div style={{ borderTop: '1px solid #fef3c7', paddingTop: 8 }}>
          {!showReject ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                disabled={actionRequestId === payload.requestId}
                onClick={() => onApprove(payload.requestId)}
                style={{
                  flex: 1, border: 'none', borderRadius: 6, padding: '6px 8px', fontSize: 8, fontWeight: 700,
                  background: actionRequestId === payload.requestId ? '#bbf7d0' : '#16a34a', color: '#fff', cursor: 'pointer',
                }}
              >
                {actionRequestId === payload.requestId ? 'Đang duyệt...' : 'Duyệt'}
              </button>
              <button
                type="button"
                disabled={actionRequestId === payload.requestId}
                onClick={() => setShowReject(true)}
                style={{
                  flex: 1, border: bd, borderRadius: 6, padding: '6px 8px', fontSize: 8, fontWeight: 600,
                  background: '#fff', color: '#dc2626', cursor: 'pointer',
                }}
              >
                Từ chối
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={2}
                placeholder="Lý do từ chối (tuỳ chọn)..."
                style={{ border: bd, borderRadius: 6, padding: '6px 8px', fontSize: 8, resize: 'none', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => { setShowReject(false); setRejectNote('') }}
                  style={{ flex: 1, border: bd, borderRadius: 6, padding: '6px 8px', fontSize: 8, background: '#fff', cursor: 'pointer' }}
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  disabled={actionRequestId === payload.requestId}
                  onClick={() => onReject(payload.requestId, rejectNote)}
                  style={{
                    flex: 1, border: 'none', borderRadius: 6, padding: '6px 8px', fontSize: 8, fontWeight: 700,
                    background: '#dc2626', color: '#fff', cursor: 'pointer',
                  }}
                >
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'business' && isPending && (
        <div style={{ fontSize: 7, color: '#92400e', background: '#fffbeb', borderRadius: 6, padding: '6px 8px' }}>
          WS sẽ xem xét và phản hồi trong cuộc trò chuyện này.
        </div>
      )}
    </div>
  )
}

function CreditDecisionEventCard({ message }) {
  const payload = message.requestPayload || {}
  const accepted = payload.decision === 'accepted' || payload.status === 'approved'
  return (
    <div style={{
      width: '100%', maxWidth: 320, background: accepted ? '#ecfdf5' : '#fef2f2',
      border: `1.5px solid ${accepted ? '#bbf7d0' : '#fecaca'}`,
      borderRadius: 10, padding: '10px 12px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: accepted ? '#166534' : '#991b1b', marginBottom: 4 }}>
        {accepted ? 'WS đã duyệt yêu cầu nạp credit' : 'WS đã từ chối yêu cầu nạp credit'}
      </div>
      {message.content && (
        <div style={{ fontSize: 8, color: '#475569', lineHeight: 1.55 }}>{message.content}</div>
      )}
    </div>
  )
}

function formatListingReferralFee(payload) {
  if (!payload) return '—'
  const type = payload.referralFeeType
  const value = Number(payload.referralFeeValue || 0)
  if (type === 'percent') return `${value}% thu nhập năm đầu`
  if (type === 'fixed') return `${value.toLocaleString('vi-VN')} (cố định)`
  if (type === 'monthly') return `${value} tháng lương`
  return value ? String(value) : '—'
}

function ListingRequestEventCard({
  message,
  mode,
  onApprove,
  onReject,
  actionListingId,
}) {
  const payload = message.requestPayload || {}
  const status = payload.status || 'pending'
  const statusStyle = CREDIT_STATUS_STYLES[status] || CREDIT_STATUS_STYLES.pending
  const isPending = status === 'pending'
  const listingId = payload.listingId
  const [platformFeePercent, setPlatformFeePercent] = useState(
    () => String(payload.platformFeePercent ?? 20),
  )
  const [adminNote, setAdminNote] = useState('')
  const [rejectNote, setRejectNote] = useState('')
  const [showReject, setShowReject] = useState(false)

  return (
    <div style={{
      width: '100%', maxWidth: 320, background: '#fff', border: '1.5px solid #bae6fd',
      borderRadius: 10, padding: '10px 12px', boxShadow: '0 2px 8px rgba(0,119,182,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#0077B6' }}>Đăng job lên Sàn CTV</div>
        <span style={{ fontSize: 7, fontWeight: 600, padding: '2px 6px', borderRadius: 99, color: statusStyle.color, background: statusStyle.bg }}>
          {statusStyle.label}
        </span>
      </div>

      <div style={{ fontSize: 8, color: '#475569', lineHeight: 1.65, marginBottom: 8 }}>
        <div><strong>Job:</strong> {payload.jobTitle || '—'}{payload.jobCode ? ` (${payload.jobCode})` : ''}</div>
        <div><strong>Phí CTV:</strong> {formatListingReferralFee(payload)}</div>
        {payload.platformFeePercent != null && status !== 'pending' && (
          <div><strong>Phí dịch vụ WS:</strong> {Number(payload.platformFeePercent)}%</div>
        )}
        {payload.adminNote && <div><strong>Phản hồi WS:</strong> {payload.adminNote}</div>}
      </div>

      {mode === 'admin' && isPending && onApprove && onReject && (
        <div style={{ borderTop: '1px solid #e0f2fe', paddingTop: 8 }}>
          {!showReject ? (
            <>
              <label style={{ display: 'block', fontSize: 8, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Phí sử dụng dịch vụ (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={platformFeePercent}
                onChange={(e) => setPlatformFeePercent(e.target.value)}
                style={{ width: '100%', border: bd, borderRadius: 6, padding: '6px 8px', fontSize: 8, marginBottom: 6, outline: 'none' }}
              />
              <input
                type="text"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Ghi chú cho DN (tuỳ chọn)..."
                style={{ width: '100%', border: bd, borderRadius: 6, padding: '6px 8px', fontSize: 8, marginBottom: 8, outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  disabled={actionListingId === listingId}
                  onClick={() => onApprove(listingId, platformFeePercent, adminNote)}
                  style={{
                    flex: 1, border: 'none', borderRadius: 6, padding: '6px 8px', fontSize: 8, fontWeight: 700,
                    background: actionListingId === listingId ? '#7dd3fc' : '#0077B6', color: '#fff', cursor: 'pointer',
                  }}
                >
                  {actionListingId === listingId ? 'Đang duyệt...' : 'Duyệt & publish'}
                </button>
                <button
                  type="button"
                  disabled={actionListingId === listingId}
                  onClick={() => setShowReject(true)}
                  style={{
                    flex: 1, border: bd, borderRadius: 6, padding: '6px 8px', fontSize: 8, fontWeight: 600,
                    background: '#fff', color: '#dc2626', cursor: 'pointer',
                  }}
                >
                  Từ chối
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={2}
                placeholder="Lý do từ chối (tuỳ chọn)..."
                style={{ border: bd, borderRadius: 6, padding: '6px 8px', fontSize: 8, resize: 'none', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => { setShowReject(false); setRejectNote('') }}
                  style={{ flex: 1, border: bd, borderRadius: 6, padding: '6px 8px', fontSize: 8, background: '#fff', cursor: 'pointer' }}
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  disabled={actionListingId === listingId}
                  onClick={() => onReject(listingId, rejectNote)}
                  style={{
                    flex: 1, border: 'none', borderRadius: 6, padding: '6px 8px', fontSize: 8, fontWeight: 700,
                    background: '#dc2626', color: '#fff', cursor: 'pointer',
                  }}
                >
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'business' && isPending && (
        <div style={{ fontSize: 7, color: '#0369a1', background: '#f0f9ff', borderRadius: 6, padding: '6px 8px' }}>
          WS sẽ xem xét, thiết lập phí dịch vụ và phản hồi trong cuộc trò chuyện này.
        </div>
      )}
    </div>
  )
}

function ListingDecisionEventCard({ message }) {
  const payload = message.requestPayload || {}
  const accepted = payload.decision === 'accepted' || payload.status === 'approved'
  return (
    <div style={{
      width: '100%', maxWidth: 320, background: accepted ? '#ecfdf5' : '#fef2f2',
      border: `1.5px solid ${accepted ? '#bbf7d0' : '#fecaca'}`,
      borderRadius: 10, padding: '10px 12px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: accepted ? '#166534' : '#991b1b', marginBottom: 4 }}>
        {accepted ? 'WS đã duyệt đăng Sàn CTV' : 'WS đã từ chối đăng Sàn CTV'}
      </div>
      {message.content && (
        <div style={{ fontSize: 8, color: '#475569', lineHeight: 1.55 }}>{message.content}</div>
      )}
    </div>
  )
}

function ApproachStatusUpdateEventCard({ message, mode, onOpenCv }) {
  const payload = message.requestPayload || {}
  const statusLabel = payload.pipelineStatusLabel || payload.pipelineStatus || '—'
  const cvFromAttachment = (message.cvAttachments || [])[0]
  const cv = cvFromAttachment?.cvId
    ? cvFromAttachment
    : (payload.cvId ? { cvId: payload.cvId, code: payload.cvCode } : null)

  return (
    <div style={{
      width: '100%', maxWidth: 320, background: '#f0fdf4', border: '1.5px solid #bbf7d0',
      borderRadius: 10, padding: '10px 12px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#166534', marginBottom: 6 }}>
        Cập nhật trạng thái tiếp cận
      </div>
      {message.content && (
        <div style={{ fontSize: 8, color: '#475569', lineHeight: 1.55, marginBottom: 8 }}>
          {message.content}
        </div>
      )}
      <div style={{
        fontSize: 9, fontWeight: 700, color: '#15803d', background: '#dcfce7',
        borderRadius: 6, padding: '5px 8px', marginBottom: cv ? 8 : 0,
      }}
      >
        {statusLabel}
      </div>
      {cv && (
        <CvAttachmentCard
          cv={cv}
          mode={mode}
          kind="recommendation"
          onOpen={mode === 'business' ? onOpenCv : undefined}
        />
      )}
    </div>
  )
}

function WsAdminScoutPerformanceCandidatesPanel({
  open,
  sessionId,
  onClose,
  onStatusUpdated,
}) {
  const [loading, setLoading] = useState(false)
  const [candidates, setCandidates] = useState([])
  const [error, setError] = useState('')
  const [updatingCvId, setUpdatingCvId] = useState(null)

  const load = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    setError('')
    try {
      const res = await apiService.getAdminWsChatScoutPerformanceCandidates(sessionId)
      if (res?.success) {
        setCandidates(res.data?.candidates || [])
      } else {
        setCandidates([])
        setError(res?.message || 'Không tải được danh sách')
      }
    } catch (e) {
      console.error(e)
      setCandidates([])
      setError('Không tải được danh sách Scout Performance')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (open && sessionId) load()
  }, [open, sessionId, load])

  const handleChangeStatus = async (cvId, pipelineStatus) => {
    if (!sessionId || !cvId) return
    setUpdatingCvId(cvId)
    try {
      const res = await apiService.updateAdminWsChatScoutPerformanceApproachStatus(
        sessionId,
        cvId,
        pipelineStatus,
      )
      if (res?.success) {
        setCandidates((prev) => prev.map((c) => (
          c.id === cvId
            ? { ...c, pipelineStatus, pipelineStatusLabel: res.data?.candidate?.pipelineStatusLabel }
            : c
        )))
        onStatusUpdated?.(res.data?.message)
      } else {
        alert(res?.message || 'Cập nhật thất bại')
      }
    } catch (e) {
      console.error(e)
      alert('Cập nhật thất bại')
    } finally {
      setUpdatingCvId(null)
    }
  }

  if (!open) return null

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 30, background: 'rgba(15,23,42,0.35)',
      display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end',
    }}
    >
      <div style={{
        width: 'min(100%, 320px)', background: '#fff', borderLeft: bd,
        display: 'flex', flexDirection: 'column', minHeight: 0, boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
      }}
      >
        <div style={{
          padding: '10px 12px', borderBottom: bd, display: 'flex', alignItems: 'center', gap: 8,
        }}
        >
          <Users style={{ width: 14, height: 14, color: '#0077B6' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>Ứng viên Scout Performance</div>
            <div style={{ fontSize: 8, color: '#64748b' }}>Cập nhật trạng thái tiếp cận — DN nhận tin nhắn tự động</div>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}>
            <X style={{ width: 14, height: 14, color: '#64748b' }} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, color: '#64748b', padding: 12 }}>
              <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
              Đang tải...
            </div>
          )}
          {error && !loading && (
            <div style={{ fontSize: 9, color: '#b91c1c', padding: 8 }}>{error}</div>
          )}
          {!loading && !error && candidates.length === 0 && (
            <div style={{ fontSize: 9, color: '#94a3b8', padding: 12, lineHeight: 1.5 }}>
              Doanh nghiệp chưa có ứng viên Scout Performance nào.
            </div>
          )}
          {!loading && candidates.map((c) => {
            const approach = getScoutPipelineMeta(c.pipelineStatus)
            return (
              <div
                key={c.id}
                style={{
                  border: bd, borderRadius: 8, padding: '8px 10px', marginBottom: 8, background: '#f8fafc',
                }}
              >
                <div style={{ fontSize: 9, fontWeight: 700, color: '#1e293b' }}>
                  {getScoutDisplayName(c)}
                </div>
                <div style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>
                  {c.code || `CV #${c.id}`}
                  {c.desiredPosition ? ` · ${c.desiredPosition}` : ''}
                </div>
                <div style={{ marginTop: 6 }}>
                  <label style={{ fontSize: 7, color: '#94a3b8', display: 'block', marginBottom: 3 }}>
                    Trạng thái tiếp cận
                  </label>
                  <select
                    value={c.pipelineStatus || 'new'}
                    disabled={updatingCvId === c.id}
                    onChange={(e) => handleChangeStatus(c.id, e.target.value)}
                    style={{
                      width: '100%', fontSize: 9, fontWeight: 600, color: approach.color,
                      background: approach.bg, border: '1px solid #e2e8f0', borderRadius: 6,
                      padding: '5px 6px',
                    }}
                  >
                    {SCOUT_APPROACH_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ScoutPerformanceEventCard({ message, mode, onOpenCv }) {
  const payload = message.requestPayload || {}
  const requestedCv = getRequestedCvFromMessage(message)
  const type = message.messageType

  const meta = type === 'similar_candidates_request'
    ? { label: 'Tìm tương tự', color: '#4338ca', bg: '#e8f4fa', title: 'Yêu cầu tìm thêm ứng viên tương tự' }
    : type === 'performance_opened'
      ? { label: 'Đã mở', color: '#059669', bg: '#d1fae5', title: 'Đã mở hồ sơ Scout Performance' }
      : { label: 'Scout Performance', color: '#64748b', bg: '#f1f5f9', title: message.content || 'Scout Performance' }

  return (
    <div style={{
      width: '100%', maxWidth: 320, background: '#fff', border: '1.5px solid #c7d2fe',
      borderRadius: 10, padding: '10px 12px', boxShadow: '0 2px 8px rgba(79,70,229,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#312e81' }}>{meta.title}</div>
        <span style={{ fontSize: 7, fontWeight: 600, padding: '2px 6px', borderRadius: 99, color: meta.color, background: meta.bg }}>
          {meta.label}
        </span>
      </div>

      {requestedCv && (
        <div style={{ marginBottom: 8 }}>
          <CvAttachmentCard
            cv={requestedCv}
            mode={mode}
            kind="request"
            onOpen={mode === 'business' ? onOpenCv : undefined}
          />
        </div>
      )}

      {payload.businessNote && (
        <div style={{ fontSize: 8, color: '#475569', padding: '6px 8px', background: '#f8fafc', borderRadius: 6 }}>
          <strong>Ghi chú DN:</strong> {payload.businessNote}
        </div>
      )}
    </div>
  )
}

function ChatBubble({ message, mode, onOpenCv, onApproveCredit, onRejectCredit, creditActionId, onApproveListing, onRejectListing, listingActionId }) {
  const isPerformanceEvent = [
    'performance_opened',
    'similar_candidates_request',
    'performance_request',
  ].includes(message.messageType)
  const isCreditRequest = message.messageType === 'credit_request'
  const isListingRequest = message.messageType === 'listing_request'
  const isSaiyoBrandingRequest = message.messageType === 'saiyo_branding_request'
  const isCreditDecision = message.messageType === 'credit_decision'
  const isListingDecision = message.messageType === 'listing_decision'
  const isApproachUpdate = message.messageType === 'approach_status_update'
  const isOutgoing = mode === 'admin'
    ? message.senderType === 'admin'
    : message.senderType === 'business'
  const isSystem = message.senderType === 'system'

  if (isCreditRequest) {
    return (
      <div style={{
        maxWidth: '85%', display: 'flex', gap: 6, alignSelf: mode === 'business' ? 'flex-end' : 'flex-start',
        flexDirection: mode === 'business' ? 'row-reverse' : 'row', alignItems: 'flex-end',
      }}>
        {mode !== 'business' && <WsLogo size={24} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
          <CreditRequestEventCard
            message={message}
            mode={mode}
            onApprove={onApproveCredit}
            onReject={onRejectCredit}
            actionRequestId={creditActionId}
          />
          <div style={{ fontSize: 7, color: '#94a3b8', textAlign: mode === 'business' ? 'right' : 'left' }}>
            {formatTime(message.createdAt)}
          </div>
        </div>
      </div>
    )
  }

  if (isListingRequest) {
    return (
      <div style={{
        maxWidth: '85%', display: 'flex', gap: 6, alignSelf: mode === 'business' ? 'flex-end' : 'flex-start',
        flexDirection: mode === 'business' ? 'row-reverse' : 'row', alignItems: 'flex-end',
      }}>
        {mode !== 'business' && <WsLogo size={24} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
          <ListingRequestEventCard
            message={message}
            mode={mode}
            onApprove={onApproveListing}
            onReject={onRejectListing}
            actionListingId={listingActionId}
          />
          <div style={{ fontSize: 7, color: '#94a3b8', textAlign: mode === 'business' ? 'right' : 'left' }}>
            {formatTime(message.createdAt)}
          </div>
        </div>
      </div>
    )
  }

  if (isSaiyoBrandingRequest) {
    return (
      <div style={{
        maxWidth: '85%', display: 'flex', gap: 6, alignSelf: mode === 'business' ? 'flex-end' : 'flex-start',
        flexDirection: mode === 'business' ? 'row-reverse' : 'row', alignItems: 'flex-end',
      }}>
        {mode !== 'business' && <WsLogo size={24} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
          <SaiyoBrandingRequestEventCard message={message} />
          <div style={{ fontSize: 7, color: '#94a3b8', textAlign: mode === 'business' ? 'right' : 'left' }}>
            {formatTime(message.createdAt)}
          </div>
        </div>
      </div>
    )
  }

  if (isCreditDecision) {
    return (
      <div style={{
        maxWidth: '85%', display: 'flex', gap: 6, alignSelf: mode === 'business' ? 'flex-start' : 'flex-end',
        flexDirection: mode === 'business' ? 'row' : 'row-reverse', alignItems: 'flex-end',
      }}>
        {mode === 'business' && <WsLogo size={24} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
          <CreditDecisionEventCard message={message} />
          <div style={{ fontSize: 7, color: '#94a3b8', textAlign: mode === 'business' ? 'left' : 'right' }}>
            {formatTime(message.createdAt)}
          </div>
        </div>
      </div>
    )
  }

  if (isListingDecision) {
    return (
      <div style={{
        maxWidth: '85%', display: 'flex', gap: 6, alignSelf: mode === 'business' ? 'flex-start' : 'flex-end',
        flexDirection: mode === 'business' ? 'row' : 'row-reverse', alignItems: 'flex-end',
      }}>
        {mode === 'business' && <WsLogo size={24} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
          <ListingDecisionEventCard message={message} />
          <div style={{ fontSize: 7, color: '#94a3b8', textAlign: mode === 'business' ? 'left' : 'right' }}>
            {formatTime(message.createdAt)}
          </div>
        </div>
      </div>
    )
  }

  if (isApproachUpdate) {
    return (
      <div style={{
        maxWidth: '85%', display: 'flex', gap: 6, alignSelf: mode === 'business' ? 'flex-start' : 'flex-end',
        flexDirection: mode === 'business' ? 'row' : 'row-reverse', alignItems: 'flex-end',
      }}>
        {mode === 'business' && <WsLogo size={24} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
          <ApproachStatusUpdateEventCard message={message} mode={mode} onOpenCv={onOpenCv} />
          <div style={{ fontSize: 7, color: '#94a3b8', textAlign: mode === 'business' ? 'left' : 'right' }}>
            {formatTime(message.createdAt)}
          </div>
        </div>
      </div>
    )
  }

  if (isPerformanceEvent) {
    return (
      <div style={{
        maxWidth: '85%', display: 'flex', gap: 6, alignSelf: mode === 'business' ? 'flex-end' : 'flex-start',
        flexDirection: mode === 'business' ? 'row-reverse' : 'row', alignItems: 'flex-end',
      }}>
        {mode !== 'business' && <WsLogo size={24} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
          <ScoutPerformanceEventCard message={message} mode={mode} onOpenCv={onOpenCv} />
          <div style={{ fontSize: 7, color: '#94a3b8', textAlign: mode === 'business' ? 'right' : 'left' }}>
            {formatTime(message.createdAt)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      maxWidth: '78%', display: 'flex', gap: 6, alignSelf: isOutgoing ? 'flex-end' : 'flex-start',
      flexDirection: isOutgoing ? 'row-reverse' : 'row', alignItems: 'flex-end',
    }}>
      {!isOutgoing && <WsLogo size={24} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
        {message.content && (
          <div style={{
            padding: '6px 10px', borderRadius: 8, fontSize: 9, lineHeight: 1.45, whiteSpace: 'pre-line',
            background: isOutgoing ? '#0077B6' : isSystem ? '#e8f4fa' : '#fff',
            color: isOutgoing ? '#fff' : '#1e293b',
            border: isOutgoing ? 'none' : bd,
          }}>
            {message.content}
          </div>
        )}
        {(message.cvAttachments || []).map((cv) => (
          <CvAttachmentCard key={cv.cvId} cv={cv} mode={mode} onOpen={onOpenCv} />
        ))}
        <div style={{ fontSize: 7, color: '#94a3b8', textAlign: isOutgoing ? 'right' : 'left' }}>
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  )
}

export function WsSessionListItem({ session, active, onClick, mode = 'business' }) {
  const title = mode === 'admin'
    ? (session.business?.companyName || session.title || 'Doanh nghiệp')
    : 'WS Team – Tuyển dụng'
  const subtitle = mode === 'admin'
    ? 'Scout Performance'
    : (session.lastMessagePreview || 'Scout Performance')
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'flex-start', gap: 7, padding: '9px 9px',
      cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
      background: active ? '#e8f4fa' : 'transparent',
      borderLeft: active ? '3px solid #0077B6' : '3px solid transparent',
    }}>
      <WsLogo size={28} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>{title}</div>
        <div style={{ fontSize: 8, color: '#64748b', lineHeight: 1.45 }}>{subtitle}</div>
        <div style={{ fontSize: 8, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {session.lastMessagePreview || 'Chưa có tin nhắn'}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
        <span style={{ fontSize: 8, color: '#94a3b8' }}>{formatListTime(session.lastMessageAt)}</span>
        {session.unreadCount > 0 && (
          <span style={{ background: '#0077B6', color: '#fff', borderRadius: 99, fontSize: 7, fontWeight: 600, padding: '0 4px', minWidth: 14, textAlign: 'center' }}>
            {session.unreadCount}
          </span>
        )}
        {mode === 'admin' && session.performanceRequest?.wantsSimilarCandidates && (
          <span style={{ background: '#e8f4fa', color: '#4338ca', borderRadius: 99, fontSize: 7, fontWeight: 700, padding: '2px 6px', whiteSpace: 'nowrap' }}>
            Tìm tương tự
          </span>
        )}
      </div>
    </div>
  )
}

export function WsMentionInput({
  value,
  onChange,
  onSubmit,
  sending,
  placeholder = 'Nhập tin nhắn... Gõ @ để gắn hồ sơ ứng viên',
  searchCandidates,
}) {
  const [mentions, setMentions] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStart, setMentionStart] = useState(-1)
  const inputRef = useRef(null)

  const runSearch = useCallback(async (q) => {
    if (!searchCandidates) return
    try {
      const res = await searchCandidates(q)
      setSuggestions(res?.data?.candidates || [])
    } catch {
      setSuggestions([])
    }
  }, [searchCandidates])

  const handleChange = (e) => {
    const next = e.target.value
    onChange(next)
    const cursor = e.target.selectionStart || next.length
    const before = next.slice(0, cursor)
    const atIndex = before.lastIndexOf('@')
    if (atIndex >= 0) {
      const fragment = before.slice(atIndex + 1)
      if (!fragment.includes(' ') && !fragment.includes('\n')) {
        setMentionStart(atIndex)
        setMentionQuery(fragment)
        setShowSuggestions(true)
        runSearch(fragment)
        return
      }
    }
    setShowSuggestions(false)
    setMentionQuery('')
    setMentionStart(-1)
  }

  const pickSuggestion = (item) => {
    if (mentionStart < 0) return
    const before = value.slice(0, mentionStart)
    const after = value.slice(inputRef.current?.selectionStart || value.length)
    const token = `@${item.code || item.name || item.label}`
    const spacer = after.startsWith(' ') || !after ? '' : ' '
    const nextValue = `${before}${token}${spacer}${after}`
    onChange(nextValue)
    setMentions((prev) => (prev.some((m) => m.id === item.id) ? prev : [...prev, item]))
    setShowSuggestions(false)
    setMentionQuery('')
    setMentionStart(-1)
    inputRef.current?.focus()
  }

  const handleSubmit = () => {
    const cvIds = mentions.map((m) => m.id)
    onSubmit({ content: value, cvIds })
    onChange('')
    setMentions([])
    setShowSuggestions(false)
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', flex: 1 }}>
        {mentions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
            {mentions.map((m) => (
              <span key={m.id} style={{ fontSize: 7, background: '#e8f4fa', color: '#4338ca', borderRadius: 99, padding: '2px 6px' }}>
                @{m.code || m.name || m.label}
              </span>
            ))}
          </div>
        )}
        <input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder={placeholder}
          style={{ width: '100%', border: bd, borderRadius: 99, padding: '6px 12px', fontSize: 9, background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 'calc(100% + 4px)', background: '#fff',
            border: bd, borderRadius: 8, boxShadow: '0 8px 24px rgba(15,23,42,0.12)', maxHeight: 180, overflowY: 'auto', zIndex: 20,
          }}>
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => pickSuggestion(item)}
                style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
              >
                <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b' }}>{item.label}</div>
                {item.desiredPosition && <div style={{ fontSize: 8, color: '#64748b' }}>{item.desiredPosition}</div>}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        disabled={sending || (!value.trim() && mentions.length === 0)}
        onClick={handleSubmit}
        style={{ width: 28, height: 28, borderRadius: '50%', background: '#0077B6', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      >
        <Send {...ICON_SM} color="#fff" />
      </button>
    </div>
  )
}

export function useWsScoutChat({ mode = 'business', initialSessionId = null, enabled = true }) {
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(initialSessionId ? Number(initialSessionId) : null)
  const [messages, setMessages] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')

  const api = useMemo(() => ({
    listSessions: mode === 'admin' ? apiService.getAdminWsChatSessions : apiService.getBusinessWsChatSessions,
    listMessages: mode === 'admin' ? apiService.getAdminWsChatMessages : apiService.getBusinessWsChatMessages,
    sendMessage: mode === 'admin' ? apiService.sendAdminWsChatMessage : apiService.sendBusinessWsChatMessage,
    searchCandidates: mode === 'admin' ? apiService.searchAdminWsChatCandidates : null,
  }), [mode])

  const loadSessions = useCallback(async () => {
    if (!enabled) return
    setLoadingSessions(true)
    try {
      const res = await api.listSessions({ search: search || undefined, limit: 50 })
      const list = res?.data?.sessions || []
      setSessions(list)
      setActiveSessionId((current) => {
        if (initialSessionId) return Number(initialSessionId)
        if (current && list.some((s) => s.id === current)) return current
        return list[0]?.id || null
      })
    } catch (e) {
      console.error(e)
      setSessions([])
    } finally {
      setLoadingSessions(false)
    }
  }, [api, search, enabled, initialSessionId])

  const loadMessages = useCallback(async (sessionId) => {
    if (!sessionId) {
      setMessages([])
      return
    }
    setLoadingMessages(true)
    try {
      const res = await api.listMessages(sessionId)
      setMessages(res?.data?.messages || [])
    } catch (e) {
      console.error(e)
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }, [api])

  useEffect(() => {
    if (!enabled) return
    loadSessions()
  }, [loadSessions, enabled])

  useEffect(() => {
    if (!enabled) return
    if (initialSessionId) {
      setActiveSessionId(Number(initialSessionId))
    }
  }, [initialSessionId, enabled])

  useEffect(() => {
    if (!enabled) return
    if (activeSessionId) loadMessages(activeSessionId)
  }, [activeSessionId, loadMessages, enabled])

  const sendMessage = async ({ content, cvIds = [] }) => {
    if (!activeSessionId) return
    setSending(true)
    try {
      const res = await api.sendMessage(activeSessionId, { content, cvIds })
      if (res?.data?.message) {
        setMessages((prev) => [...prev, res.data.message])
        await loadSessions()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  const reloadMessages = useCallback(async (sessionIdOverride) => {
    const sid = sessionIdOverride ?? activeSessionId
    if (!sid) return
    await loadMessages(sid)
    await loadSessions()
  }, [activeSessionId, loadMessages, loadSessions])

  const syncCreditRequestsToChat = useCallback(async () => {
    if (mode !== 'business') return null
    try {
      const res = await apiService.syncBusinessWsChatCreditRequests()
      const sessionId = res?.data?.sessionId
      if (sessionId) {
        setActiveSessionId(Number(sessionId))
        await loadMessages(Number(sessionId))
        await loadSessions()
      } else if (activeSessionId) {
        await loadMessages(activeSessionId)
      }
      return res?.data || null
    } catch (e) {
      console.error(e)
      return null
    }
  }, [mode, activeSessionId, loadMessages, loadSessions])

  const appendMessage = useCallback((message) => {
    if (!message?.id) return
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev
      return [...prev, message]
    })
  }, [])

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    activeSession,
    messages,
    loadingSessions,
    loadingMessages,
    sending,
    search,
    setSearch,
    sendMessage,
    reloadMessages,
    syncCreditRequestsToChat,
    appendMessage,
    searchCandidates: api.searchCandidates,
  }
}

export function WsChatThread({
  mode = 'business',
  chat,
  showHeader = true,
}) {
  const navigate = useNavigate()
  const {
    activeSessionId,
    activeSession,
    messages,
    loadingMessages,
    sending,
    sendMessage,
    searchCandidates,
  } = chat

  const [input, setInput] = useState('')
  const [creditActionId, setCreditActionId] = useState(null)
  const [listingActionId, setListingActionId] = useState(null)
  const [perfListOpen, setPerfListOpen] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const openCv = (cvId) => {
    if (!cvId) return
    navigate(`/business/scout?cvId=${cvId}`)
  }

  const handleApproveCredit = async (requestId) => {
    if (!activeSessionId || !requestId) return
    if (!window.confirm('Duyệt yêu cầu nạp credit này? Credit sẽ được cộng vào tài khoản doanh nghiệp.')) return
    setCreditActionId(requestId)
    try {
      const res = await apiService.acceptAdminWsChatCreditRequest(activeSessionId, { requestId })
      if (res?.success) {
        await chat.reloadMessages?.()
      } else {
        alert(res?.message || 'Không thể duyệt yêu cầu')
      }
    } catch (e) {
      alert(e?.message || 'Không thể duyệt yêu cầu')
    } finally {
      setCreditActionId(null)
    }
  }

  const handleRejectCredit = async (requestId, note) => {
    if (!activeSessionId || !requestId) return
    setCreditActionId(requestId)
    try {
      const res = await apiService.rejectAdminWsChatCreditRequest(activeSessionId, {
        requestId,
        note: note?.trim() || undefined,
      })
      if (res?.success) {
        await chat.reloadMessages?.()
      } else {
        alert(res?.message || 'Không thể từ chối yêu cầu')
      }
    } catch (e) {
      alert(e?.message || 'Không thể từ chối yêu cầu')
    } finally {
      setCreditActionId(null)
    }
  }

  const handleApproveListing = async (listingId, platformFeePercent, note) => {
    if (!activeSessionId || !listingId) return
    const fee = parseFloat(String(platformFeePercent).replace(',', '.'))
    if (!Number.isFinite(fee) || fee < 0 || fee > 100) {
      alert('Phí dịch vụ phải từ 0 đến 100%')
      return
    }
    if (!window.confirm(`Duyệt và publish job lên Sàn CTV với phí dịch vụ ${fee}%?`)) return
    setListingActionId(listingId)
    try {
      const res = await apiService.acceptAdminWsChatListingRequest(activeSessionId, {
        listingId,
        platformFeePercent: fee,
        note: note?.trim() || undefined,
      })
      if (res?.success) {
        await chat.reloadMessages?.()
      } else {
        alert(res?.message || 'Không thể duyệt listing')
      }
    } catch (e) {
      alert(e?.message || 'Không thể duyệt listing')
    } finally {
      setListingActionId(null)
    }
  }

  const handleRejectListing = async (listingId, note) => {
    if (!activeSessionId || !listingId) return
    setListingActionId(listingId)
    try {
      const res = await apiService.rejectAdminWsChatListingRequest(activeSessionId, {
        listingId,
        note: note?.trim() || undefined,
        rejectionReason: note?.trim() || undefined,
      })
      if (res?.success) {
        await chat.reloadMessages?.()
      } else {
        alert(res?.message || 'Không thể từ chối yêu cầu')
      }
    } catch (e) {
      alert(e?.message || 'Không thể từ chối yêu cầu')
    } finally {
      setListingActionId(null)
    }
  }

  const headerTitle = mode === 'admin'
    ? (activeSession?.business?.companyName || 'Doanh nghiệp')
    : 'WS Team – Tuyển dụng'

  const requestStatusLabel = activeSession?.performanceRequest?.wantsSimilarCandidates
    ? 'Đang tìm ứng viên tương tự'
    : 'Scout Performance'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', background: '#f8fafc', position: 'relative' }}>
      <WsAdminScoutPerformanceCandidatesPanel
        open={mode === 'admin' && perfListOpen}
        sessionId={activeSessionId}
        onClose={() => setPerfListOpen(false)}
        onStatusUpdated={() => chat.reloadMessages?.()}
      />
      {showHeader && (
        <div style={{ background: '#fff', borderBottom: bd, padding: '8px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <WsLogo size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>{headerTitle}</div>
              <div style={{ fontSize: 8, color: '#64748b' }}>
                Scout Performance · {requestStatusLabel}
              </div>
            </div>
            {mode === 'admin' && activeSessionId && (
              <button
                type="button"
                onClick={() => setPerfListOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, border: bd, borderRadius: 6,
                  padding: '4px 8px', fontSize: 8, fontWeight: 600, background: '#e8f4fa',
                  color: '#4338ca', cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                <Users style={{ width: 10, height: 10 }} />
                UV Scout Performance
              </button>
            )}
            {mode === 'business' && (
              <button
                type="button"
                onClick={() => navigate('/business/candidates?list=scout_performance')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, border: bd, borderRadius: 6,
                  padding: '4px 8px', fontSize: 8, fontWeight: 600, background: '#fff',
                  color: '#0077B6', cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                <Users style={{ width: 10, height: 10 }} />
                Danh sách UV
              </button>
            )}
            {mode === 'business' && activeSession?.triggerCv?.id && (
              <button type="button" onClick={() => openCv(activeSession.triggerCv.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, border: bd, borderRadius: 6, padding: '4px 8px', fontSize: 8, background: '#fff', cursor: 'pointer' }}>
                <ExternalLink width={10} height={10} /> Hồ sơ tham chiếu
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!activeSessionId && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#94a3b8' }}>
            Chọn một cuộc trò chuyện để bắt đầu
          </div>
        )}
        {loadingMessages && <div style={{ fontSize: 8, color: '#94a3b8' }}>Đang tải tin nhắn...</div>}
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            mode={mode}
            onOpenCv={mode === 'business' ? openCv : undefined}
            onApproveCredit={mode === 'admin' ? handleApproveCredit : undefined}
            onRejectCredit={mode === 'admin' ? handleRejectCredit : undefined}
            creditActionId={creditActionId}
            onApproveListing={mode === 'admin' ? handleApproveListing : undefined}
            onRejectListing={mode === 'admin' ? handleRejectListing : undefined}
            listingActionId={listingActionId}
          />
        ))}
        <div ref={endRef} />
      </div>

      {activeSessionId && (
        <div style={{ background: '#fff', borderTop: bd, padding: '8px 10px' }}>
          {mode === 'admin' && (
            <div style={{ fontSize: 8, color: '#64748b', marginBottom: 6 }}>
              Gõ @ + tên/mã/kỹ năng để gợi ý hồ sơ phù hợp cho doanh nghiệp.
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {mode === 'admin' ? (
              <WsMentionInput
                value={input}
                onChange={setInput}
                sending={sending}
                searchCandidates={searchCandidates}
                placeholder="Nhập tin nhắn... Gõ @ để gợi ý thêm ứng viên phù hợp"
                onSubmit={sendMessage}
              />
            ) : (
              <>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !sending && input.trim() && sendMessage({ content: input }).then(() => setInput(''))}
                  placeholder="Nhập tin nhắn..."
                  style={{ flex: 1, border: bd, borderRadius: 99, padding: '6px 12px', fontSize: 9, background: '#f8fafc', outline: 'none' }}
                />
                <button
                  type="button"
                  disabled={sending || !input.trim()}
                  onClick={() => sendMessage({ content: input }).then(() => setInput(''))}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: '#0077B6', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Send {...ICON_SM} color="#fff" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function WsChatPanel({
  mode = 'business',
  initialSessionId = null,
  compact = false,
  hideSidebar = false,
  showHeader = true,
  enabled = true,
}) {
  const chat = useWsScoutChat({ mode, initialSessionId, enabled })

  if (hideSidebar) {
    return (
      <WsChatThread mode={mode} chat={chat} showHeader={showHeader} />
    )
  }

  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    loadingSessions,
    search,
    setSearch,
  } = chat

  return (
    <div style={{ display: 'grid', gridTemplateColumns: compact ? '210px 1fr' : '240px 1fr', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <div style={{ borderRight: bd, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: '6px 8px', borderBottom: bd }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, border: bd, borderRadius: 6, padding: '4px 8px', background: '#f8fafc' }}>
            <Search width={12} height={12} color="#94a3b8" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, nội dung..."
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 8, outline: 'none' }}
            />
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loadingSessions && <div style={{ padding: 12, fontSize: 8, color: '#94a3b8' }}>Đang tải...</div>}
          {!loadingSessions && sessions.length === 0 && (
            <div style={{ padding: 12, fontSize: 8, color: '#94a3b8', lineHeight: 1.5 }}>
              {mode === 'admin' ? 'Chưa có cuộc trò chuyện với doanh nghiệp.' : 'Chưa có cuộc trò chuyện Scout Performance.'}
            </div>
          )}
          {sessions.map((session) => (
            <WsSessionListItem
              key={session.id}
              session={session}
              mode={mode}
              active={session.id === activeSessionId}
              onClick={() => setActiveSessionId(session.id)}
            />
          ))}
        </div>
      </div>

      <WsChatThread mode={mode} chat={chat} showHeader={showHeader} />
    </div>
  )
}

export default WsChatPanel
