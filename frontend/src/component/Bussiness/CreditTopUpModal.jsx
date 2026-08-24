import React, { useEffect, useState } from 'react'
import { Loader2, X, QrCode, MessageSquare } from 'lucide-react'
import apiService from '../../services/api'

const bd = '1px solid #e2e8f0'
const cardStyle = { background: '#fff', border: bd, borderRadius: 8, padding: '8px 10px' }
const FS = {
  section: 'var(--biz-fs-section)',
  body: 'var(--biz-fs-body)',
  caption: 'var(--biz-fs-caption)',
  micro: 'var(--biz-fs-micro)',
}

const BANK_INFO = {
  bank: 'Vietcombank',
  account: '0123456789',
  holder: 'WORKSTATION JSC',
  branch: 'Chi nhánh Hà Nội',
}

export default function CreditTopUpModal({
  open,
  onClose,
  onSuccess,
  currentCredit,
  mode = 'create',
  requestId,
  initialValues,
  defaultTab = 'quick',
}) {
  const isEdit = mode === 'edit'
  const [tab, setTab] = useState(defaultTab)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [transferRef, setTransferRef] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [quickSubmitted, setQuickSubmitted] = useState(false)

  useEffect(() => {
    if (!open) {
      setAmount('')
      setNote('')
      setTransferRef('')
      setFormError('')
      setQuickSubmitted(false)
      setTab(isEdit ? 'ws' : defaultTab)
      return
    }
    if (isEdit && initialValues) {
      setAmount(String(initialValues.amount || ''))
      setNote(initialValues.note || '')
      setTab('ws')
      setFormError('')
    } else if (!isEdit) {
      setAmount('')
      setNote('')
      setTab(defaultTab)
      setFormError('')
      setQuickSubmitted(false)
    }
  }, [open, isEdit, initialValues, defaultTab])

  if (!open) return null

  const creditAmount = Math.trunc(Number(amount))

  const handleWsSubmit = async (e) => {
    e.preventDefault()
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
      }
      const res = isEdit
        ? await apiService.updateBusinessCreditRequest(requestId, payload)
        : await apiService.createBusinessCreditRequest(payload)
      if (res?.success) {
        onSuccess?.(res.data)
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

  const handleQuickSubmit = async (e) => {
    e.preventDefault()
    if (!creditAmount || creditAmount <= 0) {
      setFormError('Vui lòng nhập số credit cần nạp.')
      return
    }
    if (!transferRef.trim()) {
      setFormError('Vui lòng nhập mã tham chiếu chuyển khoản.')
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      const res = await apiService.createBusinessCreditRequest({
        amount: creditAmount,
        note: `[Nạp nhanh QR] Mã CK: ${transferRef.trim()}${note.trim() ? ` · ${note.trim()}` : ''}`,
      })
      if (res?.success) {
        setQuickSubmitted(true)
        onSuccess?.(res.data)
      } else {
        setFormError(res?.message || 'Không thể ghi nhận yêu cầu nạp credit')
      }
    } catch (err) {
      setFormError(err?.message || 'Không thể ghi nhận yêu cầu nạp credit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(15,23,42,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{ ...cardStyle, width: '100%', maxWidth: 400, padding: '14px 16px', boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: FS.section, fontWeight: 700, color: '#1e293b' }}>
              {isEdit ? 'Sửa yêu cầu nạp credit' : 'Nạp Scout Credit'}
            </div>
            <div style={{ fontSize: FS.caption, color: '#64748b', marginTop: 2 }}>
              Credit hiện tại: <strong>{Number(currentCredit || 0).toLocaleString('vi-VN')}</strong>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}>
            <X style={{ width: 14, height: 14, color: '#64748b' }} />
          </button>
        </div>

        {!isEdit && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => setTab('quick')}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                padding: '8px 10px', borderRadius: 8, fontSize: FS.body, fontWeight: 600, cursor: 'pointer',
                border: tab === 'quick' ? '1px solid #0077B6' : bd,
                background: tab === 'quick' ? '#e8f4fa' : '#fff',
                color: tab === 'quick' ? '#0077B6' : '#64748b',
              }}
            >
              <QrCode style={{ width: 12, height: 12 }} /> Nạp nhanh (QR)
            </button>
            <button
              type="button"
              onClick={() => setTab('ws')}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                padding: '8px 10px', borderRadius: 8, fontSize: FS.body, fontWeight: 600, cursor: 'pointer',
                border: tab === 'ws' ? '1px solid #64748b' : bd,
                background: tab === 'ws' ? '#f1f5f9' : '#fff',
                color: tab === 'ws' ? '#334155' : '#64748b',
              }}
            >
              <MessageSquare style={{ width: 12, height: 12 }} /> Yêu cầu WS
            </button>
          </div>
        )}

        {quickSubmitted ? (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div style={{ fontSize: FS.section, fontWeight: 700, color: '#059669', marginBottom: 6 }}>Đã ghi nhận chuyển khoản</div>
            <p style={{ fontSize: FS.body, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Credit sẽ được cộng trong vòng <strong>15–30 phút</strong> sau khi xác nhận giao dịch.
              Bạn có thể tiếp tục unlock ứng viên ngay khi credit được cộng.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{ marginTop: 14, border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: FS.body, fontWeight: 700, background: '#0077B6', color: '#fff', cursor: 'pointer' }}
            >
              Đóng
            </button>
          </div>
        ) : tab === 'quick' && !isEdit ? (
          <form onSubmit={handleQuickSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ borderRadius: 8, border: bd, padding: 10, background: '#f8fafc', textAlign: 'center' }}>
              <div style={{ width: 120, height: 120, margin: '0 auto', background: '#fff', border: bd, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrCode style={{ width: 48, height: 48, color: '#94a3b8' }} />
              </div>
              <div style={{ marginTop: 8, fontSize: FS.caption, color: '#475569', lineHeight: 1.5 }}>
                <div><strong>{BANK_INFO.bank}</strong> · {BANK_INFO.branch}</div>
                <div>STK: <strong>{BANK_INFO.account}</strong></div>
                <div>{BANK_INFO.holder}</div>
                <div style={{ marginTop: 4, color: '#0077B6' }}>Nội dung: SCOUT [Mã DN] [Số credit]</div>
              </div>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: FS.caption, fontWeight: 600, color: '#475569' }}>Số credit cần nạp *</span>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="VD: 500, 1000"
                style={{ border: bd, borderRadius: 6, padding: '8px 10px', fontSize: FS.body, outline: 'none' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: FS.caption, fontWeight: 600, color: '#475569' }}>Mã tham chiếu chuyển khoản *</span>
              <input
                value={transferRef}
                onChange={(e) => setTransferRef(e.target.value)}
                placeholder="Nội dung CK hoặc mã giao dịch"
                style={{ border: bd, borderRadius: 6, padding: '8px 10px', fontSize: FS.body, outline: 'none' }}
              />
            </label>
            <p style={{ fontSize: FS.micro, color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
              Nạp nhanh — không cần chờ WS duyệt thủ công. Hệ thống tự đối soát và cộng credit.
            </p>
            {formError && (
              <div style={{ fontSize: FS.caption, color: '#dc2626', background: '#fef2f2', borderRadius: 6, padding: '6px 8px' }}>{formError}</div>
            )}
            <button
              type="submit"
              disabled={submitting}
              style={{
                border: 'none', borderRadius: 6, padding: '10px 14px', fontSize: FS.body, fontWeight: 700,
                background: submitting ? '#94a3b8' : '#0077B6', color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {submitting && <Loader2 className="animate-spin" style={{ width: 12, height: 12 }} />}
              Xác nhận đã chuyển khoản
            </button>
          </form>
        ) : (
          <form onSubmit={handleWsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: FS.caption, fontWeight: 600, color: '#475569' }}>Số credit cần nạp *</span>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="VD: 500, 1000, 2000"
                style={{ border: bd, borderRadius: 6, padding: '8px 10px', fontSize: FS.body, outline: 'none' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: FS.caption, fontWeight: 600, color: '#475569' }}>Ghi chú (tuỳ chọn)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="VD: Cần nạp gấp để unlock ứng viên Scout tuần này"
                style={{ border: bd, borderRadius: 6, padding: '8px 10px', fontSize: FS.body, outline: 'none', resize: 'vertical' }}
              />
            </label>
            <p style={{ fontSize: FS.micro, color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
              {isEdit
                ? 'Chỉ có thể sửa yêu cầu đang chờ WS duyệt.'
                : 'Dành cho giao dịch lớn hoặc hợp đồng B2B. WS xác nhận và cộng credit qua chat.'}
            </p>
            {formError && (
              <div style={{ fontSize: FS.caption, color: '#dc2626', background: '#fef2f2', borderRadius: 6, padding: '6px 8px' }}>{formError}</div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button type="button" onClick={onClose} style={{ border: bd, borderRadius: 6, padding: '8px 12px', fontSize: FS.body, background: '#fff', cursor: 'pointer' }}>
                Huỷ
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: FS.body, fontWeight: 700,
                  background: submitting ? '#94a3b8' : '#64748b', color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
              >
                {submitting && <Loader2 className="animate-spin" style={{ width: 12, height: 12 }} />}
                {isEdit ? 'Lưu thay đổi' : 'Gửi yêu cầu WS'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
