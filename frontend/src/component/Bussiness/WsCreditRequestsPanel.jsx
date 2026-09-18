import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CreditCard, ChevronDown, Loader2, Plus, Search } from 'lucide-react'
import apiService from '../../services/api'
import CreditTopUpModal from './CreditTopUpModal'
import { BUSINESS_HP_TEXT } from '../../utils/businessHomepageTypography'
import { useLanguage } from '../../context/LanguageContext'
import {
  getMessagesCopy,
  getCreditRequestStatusStyle,
  formatCreditPanelDateTime,
  formatCreditPanelNumber,
} from '../../i18n/businessApp/messages.js'

const MSG_SUBTOOLBAR =
  'flex min-h-[3.25rem] shrink-0 items-center border-b border-slate-100 bg-white px-3 py-2.5 sm:px-4'
const MSG_FILTER_ROW =
  'flex min-h-[3.25rem] shrink-0 flex-wrap items-center gap-2.5 border-b border-slate-100 bg-white px-3 py-2.5 sm:px-4'
const MSG_SEARCH_WRAP =
  'flex min-w-[10rem] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 focus-within:border-[#0077B6]/35'

const ICON_SM = { width: 10, height: 10 }
const ICON_MD = { width: 12, height: 12 }
const bd = '1px solid #e2e8f0'
const FS = {
  section: 'var(--biz-fs-section)',
  body: 'var(--biz-fs-body)',
  caption: 'var(--biz-fs-caption)',
  micro: 'var(--biz-fs-micro)',
}

export default function WsCreditRequestsPanel({ mode = 'create', onSuccessMessage, onViewInChat }) {
  const { language } = useLanguage()
  const msgCopy = useMemo(() => getMessagesCopy(language), [language])
  const cp = msgCopy.creditPanel
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
    const code = request?.requestCode || ''
    onSuccessMessage?.(
      creditModalMode === 'edit'
        ? cp.successUpdated(code)
        : cp.successCreated(code),
      wsChat,
    )
    await loadData()
  }

  const handleCancel = async (req) => {
    if (!window.confirm(cp.confirmCancel(req.requestCode || req.id))) return
    setActionRequestId(req.id)
    try {
      const res = await apiService.deleteBusinessCreditRequest(req.id)
      if (res?.success) {
        onSuccessMessage?.(res.message || cp.cancelSuccess)
        await loadData()
      } else {
        alert(res?.message || cp.cancelFailed)
      }
    } catch (e) {
      alert(e?.message || cp.cancelFailed)
    } finally {
      setActionRequestId(null)
    }
  }

  const statusStyle = (status) => getCreditRequestStatusStyle(status, language)

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

        <div className={`business-app-ui ${MSG_SUBTOOLBAR} flex-col !min-h-0 items-start gap-1 border-slate-200 py-3 sm:px-5`}>
          <h2 className={`font-bold text-slate-900 ${BUSINESS_HP_TEXT.section}`}>{cp.titleCreate}</h2>
          <p className={`text-slate-600 ${BUSINESS_HP_TEXT.caption}`}>
            {cp.currentCredit(formatCreditPanelNumber(currentCredit, language))}
          </p>
        </div>

        <div className="msg-scroll-hide" style={{ flex: 1, overflowY: 'auto', padding: 12, minHeight: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, color: '#94a3b8', gap: 6 }}>
              <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} /> {msgCopy.loading}
            </div>
          ) : (
            <>
              <div style={{ background: '#fff', border: bd, borderRadius: 8, padding: 14, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CreditCard style={{ width: 18, height: 18, color: '#854d0e' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: FS.section, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{cp.createCardTitle}</div>
                    <div style={{ fontSize: FS.caption, color: '#64748b', lineHeight: 1.55, marginBottom: 10 }}>
                      {cp.createCardHint}
                    </div>
                    <button
                      type="button"
                      onClick={openCreateModal}
                      disabled={!!pendingRequest}
                      style={{
                        border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: FS.body, fontWeight: 700,
                        background: pendingRequest ? '#cbd5e1' : '#4f46e5', color: '#fff',
                        cursor: pendingRequest ? 'not-allowed' : 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <Plus {...ICON_SM} /> {cp.createBtn}
                    </button>
                  </div>
                </div>
              </div>

              {pendingRequest && (
                <div style={{ background: '#fff', border: '1.5px solid #93c5fd', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: FS.body, fontWeight: 700, color: '#1e293b' }}>{cp.pendingTitle}</div>
                    <span style={{ fontSize: FS.micro, padding: '2px 6px', borderRadius: 99, background: '#dbeafe', color: '#2563eb', fontWeight: 600 }}>
                      {cp.status.pending}
                    </span>
                  </div>
                  <div style={{ fontSize: FS.caption, color: '#475569', lineHeight: 1.6, marginBottom: 8 }}>
                    <div><strong>{cp.labelCode}</strong> {pendingRequest.requestCode || pendingRequest.id}</div>
                    <div><strong>{cp.labelCredits}</strong> {formatCreditPanelNumber(pendingRequest.amount, language)}</div>
                    <div><strong>{cp.labelSentAt}</strong> {formatCreditPanelDateTime(pendingRequest.requestedAt || pendingRequest.createdAt, language)}</div>
                    {pendingRequest.note && <div><strong>{cp.labelNote}</strong> {pendingRequest.note}</div>}
                  </div>
                  <div style={{ fontSize: FS.caption, color: '#64748b', background: '#f8fafc', borderRadius: 6, padding: '8px', marginBottom: 10, lineHeight: 1.55 }}>
                    {cp.pendingChatHint}
                  </div>
                  {onViewInChat && (
                    <button
                      type="button"
                      onClick={onViewInChat}
                      style={{
                        width: '100%', border: 'none', borderRadius: 6, padding: '8px', fontSize: FS.body, fontWeight: 700,
                        background: '#4f46e5', color: '#fff', cursor: 'pointer', marginBottom: 8,
                      }}
                    >
                      {cp.viewInChat}
                    </button>
                  )}
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <button type="button" onClick={() => openEditModal(pendingRequest)} style={{ border: bd, borderRadius: 5, padding: '5px 10px', fontSize: FS.caption, background: '#fff', cursor: 'pointer' }}>
                      {cp.editRequest}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancel(pendingRequest)}
                      disabled={actionRequestId === pendingRequest.id}
                      style={{ border: bd, borderRadius: 5, padding: '5px 10px', fontSize: FS.caption, background: '#fff', color: '#dc2626', cursor: 'pointer' }}
                    >
                      {actionRequestId === pendingRequest.id ? cp.cancelling : cp.cancelRequest}
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

      <div className="business-app-ui shrink-0 bg-white">
        <div className={`${MSG_SUBTOOLBAR} sm:px-5`}>
          <h2 className={`font-bold text-slate-900 ${BUSINESS_HP_TEXT.section}`}>{cp.titleHistory}</h2>
        </div>
        <div className={`${MSG_FILTER_ROW} sm:px-5`}>
          <div className={MSG_SEARCH_WRAP}>
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={cp.searchPlaceholder}
              className={`min-w-0 flex-1 border-none bg-transparent text-slate-800 outline-none placeholder:text-slate-400 ${BUSINESS_HP_TEXT.body}`}
            />
          </div>
          <div className="relative shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 font-medium text-slate-700 ${BUSINESS_HP_TEXT.body}`}
            >
              <option value="">{msgCopy.allStatuses}</option>
              <option value="pending">{cp.status.pending}</option>
              <option value="approved">{cp.status.approved}</option>
              <option value="rejected">{cp.status.rejected}</option>
              <option value="cancelled">{cp.status.cancelled}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0077B6] px-3 py-2 font-semibold text-white hover:bg-[#006399] ${BUSINESS_HP_TEXT.button}`}
          >
            <Plus className="h-3.5 w-3.5" /> {cp.createNew}
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
          <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: FS.body }}>{cp.emptyHistory}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredRequests.map((req) => {
              const st = statusStyle(req.status)
              const isPending = req.status === 'pending'
              return (
                <div key={req.id} style={{ background: '#fff', border: bd, borderRadius: 8, padding: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: FS.body, fontWeight: 700, color: '#4f46e5' }}>{req.requestCode || `#${req.id}`}</div>
                      <div style={{ fontSize: FS.caption, color: '#64748b', marginTop: 2 }}>{formatCreditPanelDateTime(req.requestedAt || req.createdAt, language)}</div>
                    </div>
                    <span style={{ fontSize: FS.micro, padding: '2px 6px', borderRadius: 99, background: st.bg, color: st.color, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {st.label}
                    </span>
                  </div>
                  <div style={{ fontSize: FS.caption, color: '#475569', lineHeight: 1.6 }}>
                    <div><strong>{cp.labelAmount}</strong> {formatCreditPanelNumber(req.amount, language)}</div>
                    {req.note && <div><strong>{cp.labelNote}</strong> {req.note}</div>}
                    {req.handledByAdmin?.name && (
                      <div><strong>{cp.labelHandledBy}</strong> {req.handledByAdmin.name}</div>
                    )}
                    {req.handledAt && <div><strong>{cp.labelHandledAt}</strong> {formatCreditPanelDateTime(req.handledAt, language)}</div>}
                    {req.adminNote && <div><strong>{cp.labelAdminNote}</strong> {req.adminNote}</div>}
                  </div>
                  {isPending && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button type="button" onClick={() => openEditModal(req)} style={{ border: bd, borderRadius: 5, padding: '4px 8px', fontSize: FS.caption, background: '#fff', cursor: 'pointer' }}>
                        {cp.editShort}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancel(req)}
                        disabled={actionRequestId === req.id}
                        style={{ border: bd, borderRadius: 5, padding: '4px 8px', fontSize: FS.caption, background: '#fff', color: '#dc2626', cursor: 'pointer' }}
                      >
                        {cp.cancelShort}
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
