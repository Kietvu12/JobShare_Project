import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Search, ExternalLink } from 'lucide-react'
import apiService from '../../services/api'

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
    width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
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
      <div style={{ fontSize: 7, color: '#4f46e5', marginTop: 4 }}>{footer}</div>
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

function ScoutPerformanceEventCard({ message, mode, onOpenCv }) {
  const payload = message.requestPayload || {}
  const requestedCv = getRequestedCvFromMessage(message)
  const type = message.messageType

  const meta = type === 'similar_candidates_request'
    ? { label: 'Tìm tương tự', color: '#4338ca', bg: '#eef2ff', title: 'Yêu cầu tìm thêm ứng viên tương tự' }
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

function ChatBubble({ message, mode, onOpenCv }) {
  const isPerformanceEvent = [
    'performance_opened',
    'similar_candidates_request',
    'performance_request',
  ].includes(message.messageType)
  const isOutgoing = mode === 'admin'
    ? message.senderType === 'admin'
    : message.senderType === 'business'
  const isSystem = message.senderType === 'system'

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
            background: isOutgoing ? '#4f46e5' : isSystem ? '#eef2ff' : '#fff',
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
      background: active ? '#eef2ff' : 'transparent',
      borderLeft: active ? '3px solid #4f46e5' : '3px solid transparent',
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
          <span style={{ background: '#4f46e5', color: '#fff', borderRadius: 99, fontSize: 7, fontWeight: 600, padding: '0 4px', minWidth: 14, textAlign: 'center' }}>
            {session.unreadCount}
          </span>
        )}
        {mode === 'admin' && session.performanceRequest?.wantsSimilarCandidates && (
          <span style={{ background: '#eef2ff', color: '#4338ca', borderRadius: 99, fontSize: 7, fontWeight: 700, padding: '2px 6px', whiteSpace: 'nowrap' }}>
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
              <span key={m.id} style={{ fontSize: 7, background: '#eef2ff', color: '#4338ca', borderRadius: 99, padding: '2px 6px' }}>
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
        style={{ width: 28, height: 28, borderRadius: '50%', background: '#4f46e5', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
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

  const reloadMessages = useCallback(async () => {
    if (!activeSessionId) return
    await loadMessages(activeSessionId)
    await loadSessions()
  }, [activeSessionId, loadMessages, loadSessions])

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
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const openCv = (cvId) => {
    if (!cvId) return
    navigate(`/business/scout?cvId=${cvId}`)
  }

  const headerTitle = mode === 'admin'
    ? (activeSession?.business?.companyName || 'Doanh nghiệp')
    : 'WS Team – Tuyển dụng'

  const requestStatusLabel = activeSession?.performanceRequest?.wantsSimilarCandidates
    ? 'Đang tìm ứng viên tương tự'
    : 'Scout Performance'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', background: '#f8fafc' }}>
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
                  style={{ width: 28, height: 28, borderRadius: '50%', background: '#4f46e5', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
