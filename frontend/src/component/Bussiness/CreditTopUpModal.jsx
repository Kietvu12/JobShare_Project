import React, { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import apiService from '../../services/api'

const bd = '1px solid #e2e8f0'
const cardStyle = { background: '#fff', border: bd, borderRadius: 8, padding: '8px 10px' }

export default function CreditTopUpModal({
  open,
  onClose,
  onSuccess,
  currentCredit,
  mode = 'create',
  requestId,
  initialValues,
}) {
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

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(15,23,42,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{ ...cardStyle, width: '100%', maxWidth: 360, padding: '14px 16px', boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>
              {isEdit ? 'Sửa yêu cầu nạp credit' : 'Yêu cầu nạp credit'}
            </div>
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
