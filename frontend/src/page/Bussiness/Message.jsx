import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  ChevronDown,
  Star,
  MoreHorizontal,
  Filter,
  Briefcase,
  Coins,
  ExternalLink,
  Loader2,
  CreditCard,
  History,
  MessageSquare,
} from 'lucide-react'
import { useWsScoutChat, WsSessionListItem, WsChatThread } from '../../component/Shared/WsScoutPerformanceChat'
import NominationChat from '../../component/Chat/NominationChat'
import WsCreditRequestsPanel from '../../component/Bussiness/WsCreditRequestsPanel'
import apiService from '../../services/api'

const ICON_SM = { width: 10, height: 10 }
const ICON_MD = { width: 12, height: 12 }
const CTV_TAB_INDEX = 0
const WS_TAB_INDEX = 1
const bd = '1px solid #e2e8f0'

const TABS = [
  { label: 'CTV', key: 'ctv' },
  { label: 'WS', key: 'ws' },
]

const WS_VIEWS = [
  { key: 'chat', label: 'Trò chuyện', icon: MessageSquare },
  { key: 'credit', label: 'Yêu cầu credit', icon: CreditCard },
  { key: 'credit-history', label: 'Lịch sử yêu cầu', icon: History },
]

const SCROLL_HIDE = `
  .msg-scroll-hide::-webkit-scrollbar { display: none; }
  .msg-scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
`

const AVATAR_COLORS = [
  { bg: '#dbeafe', color: '#1d4ed8' },
  { bg: '#fce7f3', color: '#9d174d' },
  { bg: '#d1fae5', color: '#065f46' },
  { bg: '#fef9c3', color: '#854d0e' },
  { bg: '#ede9fe', color: '#5b21b6' },
]

function formatDateShort(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('vi-VN')
  } catch {
    return '—'
  }
}

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

function avatarColorForId(id) {
  const n = Number(id) || 0
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}

const Avatar = ({ initials, bg, color, size = 28 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', background: bg, color,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.32, fontWeight: 600, flexShrink: 0,
  }}>{initials}</div>
)

const WsLogo = ({ size = 28 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.32, fontWeight: 700, flexShrink: 0,
  }}>WS</div>
)

const CompanyLogo = ({ size = 28 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', background: '#1e293b',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.28, fontWeight: 700, flexShrink: 0,
  }}>DN</div>
)

const InfoCard = ({ title, children }) => (
  <div style={{ padding: '9px 9px', borderBottom: bd }}>
    <div style={{ fontSize: 8, fontWeight: 600, color: '#64748b', marginBottom: 7, lineHeight: 1.4 }}>{title}</div>
    {children}
  </div>
)

const Tag = ({ children, type = 'discuss' }) => {
  const styles = {
    discuss: { background: '#ede9fe', color: '#5b21b6' },
    active: { background: '#dcfce7', color: '#16a34a' },
    ready: { background: '#dcfce7', color: '#16a34a' },
    pending: { background: '#fef9c3', color: '#854d0e' },
  }
  return (
    <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 99, fontWeight: 500, whiteSpace: 'nowrap', ...styles[type] }}>
      {children}
    </span>
  )
}

const CtvConvItem = ({ conv, active, onClick }) => (
  <div onClick={onClick} style={{
    display: 'flex', alignItems: 'flex-start', gap: 7, padding: '9px 9px',
    cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
    background: active ? '#eff2ff' : 'transparent',
    borderLeft: active ? '3px solid #4f6ef7' : '3px solid transparent',
  }}>
    <Avatar initials={conv.initials} bg={conv.bg} color={conv.color} size={28} />
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>{conv.ctvName} (CTV)</div>
      <div style={{ fontSize: 8, color: '#64748b', lineHeight: 1.45 }}>Ứng viên: {conv.candidate}</div>
      <div style={{ fontSize: 8, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.45 }}>JD: {conv.job}</div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
      <span style={{ fontSize: 8, color: '#94a3b8', whiteSpace: 'nowrap' }}>{conv.time}</span>
      {conv.statusLabel && (
        <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 99, background: '#ede9fe', color: '#5b21b6', fontWeight: 600 }}>
          {conv.statusLabel}
        </span>
      )}
    </div>
  </div>
)

const Message = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const wsSessionId = searchParams.get('sessionId') || null
  const urlNominationId = searchParams.get('nominationId')
  const urlWsView = searchParams.get('wsView')

  const initialTab = searchParams.get('tab') === 'ws' ? WS_TAB_INDEX : CTV_TAB_INDEX
  const initialWsView = ['chat', 'credit', 'credit-history'].includes(urlWsView) ? urlWsView : 'chat'

  const [activeTab, setActiveTab] = useState(initialTab)
  const [wsViewMode, setWsViewMode] = useState(initialWsView)
  const [nominations, setNominations] = useState([])
  const [selectedNominationId, setSelectedNominationId] = useState(null)
  const [nominationsLoading, setNominationsLoading] = useState(false)
  const [ctvSearch, setCtvSearch] = useState('')
  const [tabBadges, setTabBadges] = useState({ ctv: 0, ws: 0 })
  const [successMsg, setSuccessMsg] = useState('')

  const isWsTab = activeTab === WS_TAB_INDEX
  const isCtvTab = activeTab === CTV_TAB_INDEX

  const wsChat = useWsScoutChat({
    mode: 'business',
    initialSessionId: wsSessionId,
    enabled: isWsTab,
  })

  const loadNominations = useCallback(async () => {
    setNominationsLoading(true)
    try {
      const res = await apiService.getBusinessCandidateSharingNominations({
        page: 1,
        limit: 50,
      })
      if (res?.success) {
        const list = res.data?.nominations || []
        setNominations(list)
        setTabBadges((prev) => ({ ...prev, ctv: list.length }))
      }
    } catch {
      setNominations([])
    } finally {
      setNominationsLoading(false)
    }
  }, [])

  const loadWsBadge = useCallback(async () => {
    try {
      const res = await apiService.getBusinessCreditRequests({ page: 1, limit: 10, status: 'pending' })
      if (res?.success) {
        const pending = res.data?.requests?.length || 0
        setTabBadges((prev) => ({ ...prev, ws: pending }))
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (isCtvTab) loadNominations()
  }, [isCtvTab, loadNominations])

  useEffect(() => {
    if (isWsTab) loadWsBadge()
  }, [isWsTab, loadWsBadge])

  useEffect(() => {
    if (!isWsTab || wsViewMode !== 'chat') return
    wsChat.syncCreditRequestsToChat?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWsTab, wsViewMode])

  useEffect(() => {
    if (!nominations.length) return
    if (urlNominationId) {
      const match = nominations.find((n) => String(n.id) === String(urlNominationId))
      if (match) {
        setSelectedNominationId(match.id)
        return
      }
    }
    if (!selectedNominationId) setSelectedNominationId(nominations[0].id)
  }, [nominations, selectedNominationId, urlNominationId])

  useEffect(() => {
    if (searchParams.get('tab') === 'ws') {
      setActiveTab(WS_TAB_INDEX)
      if (urlWsView && ['chat', 'credit', 'credit-history'].includes(urlWsView)) {
        setWsViewMode(urlWsView)
      }
    }
  }, [searchParams, urlWsView])

  const ctvConversations = useMemo(() => {
    const q = ctvSearch.trim().toLowerCase()
    return nominations
      .filter((n) => {
        if (!q) return true
        const hay = [
          n.candidateName,
          n.ctvName,
          n.jobTitle,
          n.jobCode,
          n.statusLabel,
        ].filter(Boolean).join(' ').toLowerCase()
        return hay.includes(q)
      })
      .map((n) => {
        const colors = avatarColorForId(n.ctvId || n.id)
        return {
          id: n.id,
          ctvName: n.ctvName || '—',
          initials: getInitials(n.ctvName),
          bg: colors.bg,
          color: colors.color,
          candidate: n.candidateName || '—',
          job: n.jobCode ? `${n.jobTitle} (${n.jobCode})` : (n.jobTitle || '—'),
          time: formatDateShort(n.appliedAt),
          statusLabel: n.statusLabel,
          raw: n,
        }
      })
  }, [nominations, ctvSearch])

  const selectedNomination = useMemo(
    () => nominations.find((n) => n.id === selectedNominationId) || null,
    [nominations, selectedNominationId],
  )

  const handleTabChange = (i) => {
    setActiveTab(i)
    setSuccessMsg('')
    const next = new URLSearchParams(searchParams)
    next.set('tab', i === WS_TAB_INDEX ? 'ws' : 'ctv')
    setSearchParams(next, { replace: true })
  }

  const handleWsViewChange = (view) => {
    setWsViewMode(view)
    if (view !== 'chat') setSuccessMsg('')
    const next = new URLSearchParams(searchParams)
    next.set('tab', 'ws')
    next.set('wsView', view)
    setSearchParams(next, { replace: true })
    if (view === 'chat') {
      wsChat.syncCreditRequestsToChat?.()
    }
  }

  const handleViewCreditInChat = () => {
    handleWsViewChange('chat')
  }

  const refreshWsChatAfterCredit = async (wsChatInfo) => {
    if (wsChatInfo?.message) {
      wsChat.appendMessage?.(wsChatInfo.message)
    }
    const syncResult = await wsChat.syncCreditRequestsToChat?.()
    const sessionId = wsChatInfo?.sessionId || syncResult?.sessionId
    if (sessionId) {
      wsChat.setActiveSessionId(Number(sessionId))
      await wsChat.reloadMessages(Number(sessionId))
    } else {
      await wsChat.reloadMessages?.()
    }
  }

  const handleCreditRequestSuccess = async (msg, wsChatInfo) => {
    loadWsBadge()
    setWsViewMode('chat')
    const next = new URLSearchParams(searchParams)
    next.set('tab', 'ws')
    next.set('wsView', 'chat')
    setSearchParams(next, { replace: true })
    setSuccessMsg(msg)
    await refreshWsChatAfterCredit(wsChatInfo)
  }

  const handleSelectNomination = (id) => {
    setSelectedNominationId(id)
    const next = new URLSearchParams(searchParams)
    next.set('nominationId', String(id))
    next.set('tab', 'ctv')
    setSearchParams(next, { replace: true })
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden', padding: '3px 5px', minHeight: 0, fontSize: 9 }}>
      <style>{SCROLL_HIDE}</style>

      {successMsg && (
        <div style={{ marginBottom: 4, padding: '6px 10px', background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 8, color: '#166534' }}>
          {successMsg}
        </div>
      )}

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '210px 1fr 210px', overflow: 'hidden', border: bd, borderRadius: 8, background: '#fff', minHeight: 0 }}>

        {/* LEFT SIDEBAR */}
        <div style={{ borderRight: bd, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ display: 'flex', borderBottom: bd, flexShrink: 0 }}>
            {TABS.map((tab, i) => (
              <div key={tab.key} onClick={() => handleTabChange(i)} style={{
                flex: 1, padding: '4px 2px 3px', textAlign: 'center', fontSize: 8,
                color: activeTab === i ? '#4f6ef7' : '#64748b',
                borderBottom: activeTab === i ? '2px solid #4f6ef7' : '2px solid transparent',
                cursor: 'pointer', position: 'relative',
              }}>
                {tab.label}
                {tabBadges[tab.key] > 0 && (
                  <span style={{ position: 'absolute', top: 2, right: 3, background: '#ef4444', color: '#fff', borderRadius: 99, fontSize: 6, fontWeight: 700, padding: '0 3px', minWidth: 12, textAlign: 'center' }}>
                    {tabBadges[tab.key]}
                  </span>
                )}
              </div>
            ))}
          </div>

          {isWsTab ? (
            wsViewMode === 'chat' ? (
              <>
                <div style={{ padding: '4px 6px', borderBottom: bd, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, border: bd, borderRadius: 6, padding: '3px 6px', background: '#f8fafc' }}>
                    <Search {...ICON_MD} color="#94a3b8" style={{ flexShrink: 0 }} />
                    <input
                      value={wsChat.search}
                      onChange={(e) => wsChat.setSearch(e.target.value)}
                      placeholder="Tìm kiếm cuộc trò chuyện WS..."
                      style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 8, outline: 'none', minWidth: 0 }}
                    />
                  </div>
                </div>
                <div className="msg-scroll-hide" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
                  {wsChat.loadingSessions && (
                    <div style={{ padding: 12, fontSize: 8, color: '#94a3b8' }}>Đang tải...</div>
                  )}
                  {!wsChat.loadingSessions && wsChat.sessions.length === 0 && (
                    <div style={{ padding: 12, fontSize: 8, color: '#94a3b8', lineHeight: 1.5 }}>
                      Chưa có cuộc trò chuyện với WS.
                    </div>
                  )}
                  {wsChat.sessions.map((session) => (
                    <WsSessionListItem
                      key={session.id}
                      session={session}
                      mode="business"
                      active={session.id === wsChat.activeSessionId}
                      onClick={() => wsChat.setActiveSessionId(session.id)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="msg-scroll-hide" style={{ overflowY: 'auto', flex: 1, minHeight: 0, padding: 8 }}>
                <div style={{ fontSize: 8, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Điều hướng WS</div>
                {WS_VIEWS.map((view) => {
                  const Icon = view.icon
                  const active = wsViewMode === view.key
                  return (
                    <button
                      key={view.key}
                      type="button"
                      onClick={() => handleWsViewChange(view.key)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 6,
                        border: active ? '1.5px solid #4f46e5' : bd, borderRadius: 6,
                        padding: '8px', marginBottom: 6, background: active ? '#eef2ff' : '#fff',
                        cursor: 'pointer', fontSize: 8, color: active ? '#4f46e5' : '#475569', fontWeight: active ? 600 : 400,
                      }}
                    >
                      <Icon {...ICON_MD} />
                      {view.label}
                    </button>
                  )
                })}
              </div>
            )
          ) : (
            <>
              <div style={{ padding: '4px 6px', borderBottom: bd, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, border: bd, borderRadius: 6, padding: '3px 6px', background: '#f8fafc', marginBottom: 4 }}>
                  <Search {...ICON_MD} color="#94a3b8" style={{ flexShrink: 0 }} />
                  <input
                    value={ctvSearch}
                    onChange={(e) => setCtvSearch(e.target.value)}
                    placeholder="Tìm kiếm CTV, ứng viên, tên JD..."
                    style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 8, outline: 'none', minWidth: 0 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="button" style={{ flex: 1, border: bd, borderRadius: 6, padding: '3px 6px', background: '#fff', cursor: 'pointer', fontSize: 8, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    Tất cả trạng thái <ChevronDown {...ICON_SM} />
                  </button>
                  <button type="button" style={{ border: bd, borderRadius: 6, padding: '3px 6px', background: '#fff', cursor: 'pointer', display: 'flex' }}>
                    <Filter {...ICON_MD} color="#64748b" />
                  </button>
                </div>
              </div>
              <div className="msg-scroll-hide" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
                {nominationsLoading && (
                  <div style={{ padding: 12, fontSize: 8, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Loader2 className="animate-spin" style={{ width: 12, height: 12 }} /> Đang tải...
                  </div>
                )}
                {!nominationsLoading && ctvConversations.length === 0 && (
                  <div style={{ padding: 12, fontSize: 8, color: '#94a3b8', lineHeight: 1.5 }}>
                    Chưa có đơn tiến cử từ CTV.
                  </div>
                )}
                {ctvConversations.map((conv) => (
                  <CtvConvItem
                    key={conv.id}
                    conv={conv}
                    active={selectedNominationId === conv.id}
                    onClick={() => handleSelectNomination(conv.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* CENTER */}
        {isWsTab ? (
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            <div style={{ background: '#fff', borderBottom: bd, padding: '0 8px', display: 'flex', flexShrink: 0 }}>
              {WS_VIEWS.map((view) => {
                const Icon = view.icon
                const active = wsViewMode === view.key
                return (
                  <button
                    key={view.key}
                    type="button"
                    onClick={() => handleWsViewChange(view.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', fontSize: 8,
                      cursor: 'pointer', border: 'none', background: 'transparent',
                      color: active ? '#4f46e5' : '#64748b',
                      borderBottom: active ? '2px solid #4f46e5' : '2px solid transparent',
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <Icon {...ICON_SM} />
                    {view.label}
                  </button>
                )
              })}
            </div>
            {wsViewMode === 'chat' ? (
              <WsChatThread mode="business" chat={wsChat} showHeader />
            ) : wsViewMode === 'credit' ? (
              <WsCreditRequestsPanel
                mode="create"
                onSuccessMessage={handleCreditRequestSuccess}
                onViewInChat={handleViewCreditInChat}
              />
            ) : (
              <WsCreditRequestsPanel
                mode="history"
                onSuccessMessage={(msg) => {
                  setSuccessMsg(msg)
                  loadWsBadge()
                }}
              />
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc', minHeight: 0 }}>
            {selectedNomination ? (
              <>
                <div style={{ background: '#fff', borderBottom: bd, padding: '4px 8px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', lineHeight: 1.3 }}>
                        <span style={{ fontSize: 9, fontWeight: 600, color: '#1e293b' }}>
                          Cuộc trò chuyện: Đơn tiến cử <strong>#{selectedNomination.id}</strong>
                        </span>
                        <Tag>{selectedNomination.statusLabel || 'Đang trao đổi'}</Tag>
                      </div>
                    </div>
                    <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 2, border: bd, borderRadius: 5, padding: '3px 6px', fontSize: 8, color: '#475569', background: '#fff', cursor: 'pointer' }}>
                      <ExternalLink {...ICON_SM} /> Xem chi tiết đơn
                    </button>
                    <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
                      <MoreHorizontal {...ICON_MD} color="#64748b" />
                    </button>
                  </div>
                </div>

                <div style={{ background: '#fff', borderBottom: bd, padding: '6px 8px', flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  {[
                    { logo: <CompanyLogo size={22} />, label: 'Doanh nghiệp (Bạn)', name: 'Bạn', sub: 'HR / Recruiter' },
                    { logo: <WsLogo size={22} />, label: 'WS (JobShare)', name: 'WS Team', sub: 'Talent Consultant' },
                    { logo: <Avatar initials={getInitials(selectedNomination.ctvName)} bg={avatarColorForId(selectedNomination.ctvId).bg} color={avatarColorForId(selectedNomination.ctvId).color} size={22} />, label: 'CTV', name: selectedNomination.ctvName || '—', sub: 'CTV tuyển dụng' },
                  ].map((p, i) => (
                    <div key={i} style={{ border: bd, borderRadius: 6, padding: '5px 6px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                        {p.logo}
                        <div style={{ fontSize: 7, fontWeight: 600, color: '#64748b', lineHeight: 1.3 }}>{p.label}</div>
                      </div>
                      <div style={{ fontSize: 8, fontWeight: 600, color: '#1e293b', lineHeight: 1.35 }}>{p.name}</div>
                      <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.35 }}>{p.sub}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#f1f5f9', borderBottom: bd, padding: '5px 8px', flexShrink: 0, fontSize: 7, color: '#475569', lineHeight: 1.55 }}>
                  <strong>Ứng viên:</strong> {selectedNomination.candidateName || '—'} &nbsp;|&nbsp;
                  <strong>Vị trí:</strong> {selectedNomination.jobTitle || '—'} {selectedNomination.jobCode ? `(${selectedNomination.jobCode})` : ''} &nbsp;|&nbsp;
                  <strong>Ngày:</strong> {formatDateShort(selectedNomination.appliedAt)} &nbsp;|&nbsp;
                  <strong>Trạng thái:</strong> {selectedNomination.statusLabel || '—'}
                </div>

                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  <NominationChat
                    key={selectedNomination.id}
                    jobApplicationId={selectedNomination.id}
                    userType="business"
                    currentStatus={selectedNomination.status}
                    introCandidateName={selectedNomination.candidateName || '—'}
                    introJobTitle={selectedNomination.jobTitle || '—'}
                    cvStorageId={selectedNomination.cvStorageId}
                    mobileHeaderName={selectedNomination.candidateName || 'Chat 3 bên'}
                    mobileHeaderAvatar={getInitials(selectedNomination.candidateName)}
                  />
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 9, padding: 24, textAlign: 'center' }}>
                {nominationsLoading ? 'Đang tải đơn tiến cử...' : 'Chọn đơn tiến cử để trao đổi với CTV và WS'}
              </div>
            )}
          </div>
        )}

        {/* RIGHT */}
        {isWsTab ? (
          <div style={{ borderLeft: bd, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            <div style={{ padding: '4px 8px 3px', borderBottom: bd, flexShrink: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b' }}>Thông tin WS</div>
            </div>
            <div className="msg-scroll-hide" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
              <InfoCard title="Hỗ trợ WS">
                <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                  <WsLogo size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>WS Team – JobShare</div>
                    <Tag type="active">Đang hoạt động</Tag>
                    <div style={{ fontSize: 8, color: '#64748b', lineHeight: 1.45, marginTop: 4 }}>
                      Trao đổi Scout Performance, yêu cầu nạp credit và theo dõi lịch sử yêu cầu.
                    </div>
                  </div>
                </div>
              </InfoCard>

              <InfoCard title="Yêu cầu nạp credit">
                <div style={{ fontSize: 8, color: '#64748b', lineHeight: 1.55, marginBottom: 8 }}>
                  Tạo yêu cầu cấp thêm credit — WS sẽ phê duyệt và cộng vào tài khoản sau khi xác nhận thanh toán.
                </div>
                <button
                  type="button"
                  onClick={() => handleWsViewChange('credit')}
                  style={{ width: '100%', border: 'none', borderRadius: 5, padding: '6px', fontSize: 8, fontWeight: 600, background: '#4f46e5', color: '#fff', cursor: 'pointer', marginBottom: 6 }}
                >
                  Tạo yêu cầu nạp credit
                </button>
                <button
                  type="button"
                  onClick={() => handleWsViewChange('credit-history')}
                  style={{ width: '100%', border: bd, borderRadius: 5, padding: '6px', fontSize: 8, color: '#475569', background: '#fff', cursor: 'pointer' }}
                >
                  Xem lịch sử yêu cầu
                </button>
              </InfoCard>

              {wsViewMode === 'chat' && wsChat.activeSession && (
                <InfoCard title="Cuộc trò chuyện hiện tại">
                  <div style={{ fontSize: 8, fontWeight: 600, color: '#1e293b', lineHeight: 1.45 }}>
                    {wsChat.activeSession.title || wsChat.activeSession.subject || 'WS Chat'}
                  </div>
                  <div style={{ fontSize: 7, color: '#94a3b8', marginTop: 4 }}>
                    {wsChat.activeSession.lastMessagePreview || '—'}
                  </div>
                </InfoCard>
              )}
            </div>
          </div>
        ) : (
          <div style={{ borderLeft: bd, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            {selectedNomination ? (
              <div className="msg-scroll-hide" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
                <InfoCard title="Thông tin đơn tiến cử">
                  <div style={{ fontSize: 8, fontWeight: 600, color: '#1e293b', lineHeight: 1.45, marginBottom: 3 }}>#{selectedNomination.id}</div>
                  <Tag>{selectedNomination.statusLabel || '—'}</Tag>
                </InfoCard>

                <InfoCard title="Thông tin ứng viên">
                  <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                    <Avatar initials={getInitials(selectedNomination.candidateName)} bg="#d1fae5" color="#065f46" size={28} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>{selectedNomination.candidateName || '—'}</div>
                      {selectedNomination.candidateSub && (
                        <div style={{ fontSize: 8, color: '#475569', lineHeight: 1.45 }}>{selectedNomination.candidateSub}</div>
                      )}
                    </div>
                  </div>
                  {selectedNomination.cvStorageId && (
                    <button type="button" style={{ width: '100%', marginTop: 8, border: bd, borderRadius: 5, padding: '5px', fontSize: 8, color: '#475569', background: '#fff', cursor: 'pointer' }}>
                      Xem hồ sơ ứng viên
                    </button>
                  )}
                </InfoCard>

                <InfoCard title="Thông tin JD">
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 5, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Briefcase {...ICON_MD} color="#1d4ed8" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 8, fontWeight: 600, color: '#1e293b', lineHeight: 1.45, marginBottom: 3 }}>{selectedNomination.jobTitle || '—'}</div>
                      {selectedNomination.jobCode && (
                        <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45 }}>Mã: {selectedNomination.jobCode}</div>
                      )}
                    </div>
                  </div>
                </InfoCard>

                <InfoCard title="Thông tin CTV">
                  <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                    <Avatar
                      initials={getInitials(selectedNomination.ctvName)}
                      bg={avatarColorForId(selectedNomination.ctvId).bg}
                      color={avatarColorForId(selectedNomination.ctvId).color}
                      size={28}
                    />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>{selectedNomination.ctvName || '—'}</div>
                      <div style={{ fontSize: 8, color: '#475569', lineHeight: 1.45 }}>CTV tuyển dụng</div>
                      {selectedNomination.matchScore != null && (
                        <div style={{ fontSize: 7, color: '#64748b', lineHeight: 1.45, display: 'flex', alignItems: 'center', gap: 2 }}>
                          {selectedNomination.matchScore} <Star {...ICON_SM} color="#f59e0b" fill="#f59e0b" />
                        </div>
                      )}
                    </div>
                  </div>
                </InfoCard>

                <InfoCard title="Thông tin thưởng">
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 5, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Coins {...ICON_MD} color="#16a34a" />
                    </div>
                    <div style={{ fontSize: 8, color: '#64748b', lineHeight: 1.45 }}>
                      Xem chi tiết phí thưởng tại trang Sàn CTV.
                    </div>
                  </div>
                </InfoCard>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, fontSize: 8, color: '#94a3b8', textAlign: 'center' }}>
                Chọn đơn tiến cử để xem thông tin chi tiết
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Message
