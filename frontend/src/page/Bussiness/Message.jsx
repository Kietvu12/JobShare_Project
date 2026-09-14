import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  ChevronDown,
  Star,
  Filter,
  Briefcase,
  Coins,
  ExternalLink,
  Loader2,
  CreditCard,
  History,
  MessageSquare,
  X,
  User,
} from 'lucide-react'
import { useWsScoutChat, WsSessionListItem, WsChatThread } from '../../component/Shared/WsScoutPerformanceChat'
import NominationChat from '../../component/Chat/NominationChat'
import WsCreditRequestsPanel from '../../component/Bussiness/WsCreditRequestsPanel'
import ScoutCandidateProfilePanel from '../../component/Bussiness/ScoutCandidateProfilePanel'
import JobDetail from './JobDetail'
import apiService from '../../services/api'
import useBusinessAppCopy from '../../hooks/useBusinessAppCopy'
import { useLanguage } from '../../context/LanguageContext'
import { getMessageWsViews } from '../../i18n/businessAppI18n'
import {
  getJobApplicationStatusLabelByLanguage,
  getJobApplicationStatusOptionsByLanguage,
} from '../../utils/jobApplicationStatus'

const PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif"
const BRAND = '#0077B6'

const CTV_TAB_INDEX = 0
const WS_TAB_INDEX = 1

const TABS = [
  { label: 'Đối tác tuyển dụng', shortLabel: 'Đối tác', key: 'ctv' },
  { label: 'WS', shortLabel: 'WS', key: 'ws' },
]

const messageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  .msg-scroll-hide::-webkit-scrollbar { display: none; }
  .msg-scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
  .msg-scrollbar::-webkit-scrollbar { width: 5px; }
  .msg-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .msg-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
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

const AVATAR_COLORS = [
  { bg: '#e8f4fa', color: '#0077B6' },
  { bg: '#e0f2fe', color: '#0369a1' },
  { bg: '#d1fae5', color: '#065f46' },
  { bg: '#fef9c3', color: '#854d0e' },
  { bg: '#f0f9ff', color: '#0284c7' },
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
  <div
    className="flex shrink-0 items-center justify-center rounded-full font-semibold"
    style={{
      width: size,
      height: size,
      background: bg,
      color,
      fontSize: size * 0.32,
    }}
  >
    {initials}
  </div>
)

const WsLogo = ({ size = 28 }) => (
  <div
    className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
    style={{
      width: size,
      height: size,
      fontSize: size * 0.32,
      background: 'linear-gradient(135deg, #38bdf8, #0077B6)',
    }}
  >
    WS
  </div>
)

const InfoCard = ({ title, children }) => (
  <div className="border-b border-slate-100 px-3 py-2.5">
    <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{title}</div>
    {children}
  </div>
)

const Tag = ({ children, type = 'discuss' }) => {
  const cls = {
    discuss: 'bg-[#e8f4fa] text-[#0077B6]',
    active: 'bg-emerald-100 text-emerald-700',
    ready: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-800',
  }[type] || 'bg-slate-100 text-slate-600'
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold whitespace-nowrap ${cls}`}>
      {children}
    </span>
  )
}

const CtvConvItem = ({ conv, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-start gap-2.5 border-b border-slate-100 px-3 py-3 text-left transition-colors ${
      active
        ? 'border-l-[3px] border-l-[#0077B6] bg-[#e8f4fa]/70'
        : 'border-l-[3px] border-l-transparent hover:bg-slate-50/80'
    }`}
  >
    <Avatar initials={conv.initials} bg={conv.bg} color={conv.color} size={36} />
    <div className="min-w-0 flex-1">
      <div className="truncate text-xs font-semibold text-slate-900">{conv.ctvName}</div>
      <div className="mt-0.5 truncate text-[11px] text-slate-600">
        {conv.candidate}
        <span className="text-slate-300"> · </span>
        <span className="text-slate-500">{conv.jobShort}</span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {conv.statusLabel ? <Tag>{conv.statusLabel}</Tag> : null}
        <span className="text-[10px] text-slate-400">{conv.time}</span>
      </div>
    </div>
    {conv.unread > 0 ? (
      <span className="mt-0.5 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
        {conv.unread > 99 ? '99+' : conv.unread}
      </span>
    ) : null}
  </button>
)

const searchInputClass =
  'min-w-0 flex-1 border-none bg-transparent text-[11px] text-slate-800 outline-none placeholder:text-slate-400'
const searchWrapClass =
  'flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2 focus-within:border-[#0077B6]/35 focus-within:ring-2 focus-within:ring-[#0077B6]/10'

const Message = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { language } = useLanguage()
  const copy = useBusinessAppCopy()
  const msgCopy = copy.messages
  const wsViewDefs = useMemo(() => {
    const labels = getMessageWsViews(language)
    const icons = { chat: MessageSquare, credit: CreditCard, 'credit-history': History }
    return labels.map((v) => ({ ...v, icon: icons[v.key] || MessageSquare }))
  }, [language])
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
  const [ctvStatusFilter, setCtvStatusFilter] = useState('')
  const [unreadByApp, setUnreadByApp] = useState({})
  const [listingFeeLabel, setListingFeeLabel] = useState('')
  const [tabBadges, setTabBadges] = useState({ ctv: 0, ws: 0 })
  const [successMsg, setSuccessMsg] = useState('')

  const [candidateDrawerOpen, setCandidateDrawerOpen] = useState(false)
  const [candidateDrawerApp, setCandidateDrawerApp] = useState(null)
  const [candidateDrawerLoading, setCandidateDrawerLoading] = useState(false)
  const [candidateDrawerTab, setCandidateDrawerTab] = useState('profile')

  const [jobDrawerOpen, setJobDrawerOpen] = useState(false)
  const [jobDrawerJobId, setJobDrawerJobId] = useState(null)

  const nominationToAppFallback = useCallback((n) => ({
    id: n.id,
    candidateName: n.candidateName,
    candidateSub: n.candidateSub,
    jobTitle: n.jobTitle,
    jobCode: n.jobCode,
    status: n.status,
    statusLabel: n.statusLabel,
    cvStorageId: n.cvStorageId,
    canViewFullProfile: Boolean(n.cvStorageId),
    sourceLabel: msgCopy.marketplaceSource,
    sourceType: 'ctv_marketplace',
  }), [msgCopy.marketplaceSource])

  const loadApplicationDetail = useCallback(async (appId, fallbackNomination) => {
    setCandidateDrawerLoading(true)
    try {
      const res = await apiService.getBusinessApplicationById(appId)
      if (res?.success && res.data?.application) {
        setCandidateDrawerApp(res.data.application)
        return res.data.application
      }
      if (fallbackNomination) {
        setCandidateDrawerApp(nominationToAppFallback(fallbackNomination))
      }
      return null
    } catch {
      if (fallbackNomination) {
        setCandidateDrawerApp(nominationToAppFallback(fallbackNomination))
      }
      return null
    } finally {
      setCandidateDrawerLoading(false)
    }
  }, [nominationToAppFallback])

  const isWsTab = activeTab === WS_TAB_INDEX
  const isCtvTab = activeTab === CTV_TAB_INDEX

  const wsChat = useWsScoutChat({
    mode: 'business',
    initialSessionId: wsSessionId,
    enabled: isWsTab,
  })

  const loadUnreadCounts = useCallback(async () => {
    try {
      const map = await apiService.getBusinessUnreadMessagesByApplication()
      setUnreadByApp(map || {})
      const total = Object.values(map || {}).reduce((sum, n) => sum + (Number(n) || 0), 0)
      setTabBadges((prev) => ({ ...prev, ctv: total }))
    } catch {
      setUnreadByApp({})
    }
  }, [])

  const loadNominations = useCallback(async () => {
    setNominationsLoading(true)
    try {
      const res = await apiService.getBusinessCandidateSharingNominations({ page: 1, limit: 80 })
      await loadUnreadCounts()
      if (res?.success) {
        setNominations(res.data?.nominations || [])
      }
    } catch {
      setNominations([])
    } finally {
      setNominationsLoading(false)
    }
  }, [loadUnreadCounts])

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

  const statusFilterOptions = useMemo(
    () => getJobApplicationStatusOptionsByLanguage(language),
    [language],
  )

  const ctvConversations = useMemo(() => {
    const q = ctvSearch.trim().toLowerCase()
    return nominations
      .filter((n) => {
        if (ctvStatusFilter && String(n.status) !== String(ctvStatusFilter)) return false
        if (!q) return true
        const statusText = getJobApplicationStatusLabelByLanguage(n.status, language)
        const hay = [
          n.candidateName,
          n.ctvName,
          n.jobTitle,
          n.jobCode,
          statusText,
          n.statusLabel,
        ].filter(Boolean).join(' ').toLowerCase()
        return hay.includes(q)
      })
      .map((n) => {
        const colors = avatarColorForId(n.ctvId || n.id)
        const unread = Number(unreadByApp[n.id] || unreadByApp[String(n.id)] || 0)
        const jobShort = n.jobCode || (n.jobTitle ? String(n.jobTitle).slice(0, 28) : '—')
        return {
          id: n.id,
          ctvName: n.ctvName || '—',
          initials: getInitials(n.ctvName),
          bg: colors.bg,
          color: colors.color,
          candidate: n.candidateName || '—',
          jobShort,
          time: formatDateShort(n.appliedAt),
          statusLabel: getJobApplicationStatusLabelByLanguage(n.status, language) || n.statusLabel,
          unread,
          raw: n,
        }
      })
      .sort((a, b) => {
        if (b.unread !== a.unread) return b.unread - a.unread
        const ta = new Date(a.raw.appliedAt || 0).getTime()
        const tb = new Date(b.raw.appliedAt || 0).getTime()
        return tb - ta
      })
  }, [nominations, ctvSearch, ctvStatusFilter, unreadByApp, language])

  const selectedNomination = useMemo(
    () => nominations.find((n) => n.id === selectedNominationId) || null,
    [nominations, selectedNominationId],
  )

  const closeCandidateDrawer = useCallback(() => {
    setCandidateDrawerOpen(false)
    setCandidateDrawerApp(null)
    setCandidateDrawerTab('profile')
  }, [])

  const openCandidateDrawer = useCallback(async (initialTab = 'profile') => {
    if (!selectedNomination?.id) return
    setCandidateDrawerOpen(true)
    setCandidateDrawerTab(initialTab)
    const app = await loadApplicationDetail(selectedNomination.id, selectedNomination)
    const canProfile = app?.canViewFullProfile ?? Boolean(selectedNomination.cvStorageId)
    if (initialTab === 'profile' && !canProfile) {
      setCandidateDrawerTab('chat')
    }
  }, [loadApplicationDetail, selectedNomination])

  const openJobDrawer = useCallback(() => {
    if (!selectedNomination?.jobId) return
    setJobDrawerJobId(selectedNomination.jobId)
    setJobDrawerOpen(true)
  }, [selectedNomination])

  const closeJobDrawer = useCallback(() => {
    setJobDrawerOpen(false)
    setJobDrawerJobId(null)
  }, [])

  const handleCandidateStatusUpdated = useCallback(() => {
    if (selectedNomination?.id) {
      loadApplicationDetail(selectedNomination.id, selectedNomination)
    }
    loadNominations()
    loadUnreadCounts()
  }, [loadApplicationDetail, loadNominations, loadUnreadCounts, selectedNomination])

  useEffect(() => {
    let cancelled = false
    const listingId = selectedNomination?.listingId
    if (!listingId) {
      setListingFeeLabel('')
      return undefined
    }
    ;(async () => {
      try {
        const res = await apiService.getBusinessCandidateSharingListing(listingId)
        if (!cancelled && res?.success) {
          setListingFeeLabel(res.data?.listing?.feeLabel || '')
        }
      } catch {
        if (!cancelled) setListingFeeLabel('')
      }
    })()
    return () => { cancelled = true }
  }, [selectedNomination?.listingId])

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
    setUnreadByApp((prev) => {
      const next = { ...prev }
      delete next[id]
      delete next[String(id)]
      return next
    })
    loadUnreadCounts()
    const next = new URLSearchParams(searchParams)
    next.set('nominationId', String(id))
    next.set('tab', 'ctv')
    setSearchParams(next, { replace: true })
  }

  return (
    <>
      <style>{messageStyles}</style>
      <div
        className="business-homepage-shell flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f6f8]"
        style={{ fontFamily: PAGE_FONT }}
      >
        <div className="business-homepage-ui flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-2.5">
          {successMsg && (
            <div className="mb-2 shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-800">
              {successMsg}
            </div>
          )}

          <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(200px,34vh)_minmax(0,1fr)] overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm md:grid-cols-[minmax(240px,290px)_minmax(0,1fr)] md:grid-rows-1 lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)_minmax(240px,280px)]">
            {/* LEFT */}
            <div className="flex min-h-0 flex-col overflow-hidden border-slate-200 lg:border-r">
              <div className="flex shrink-0 border-b border-slate-200">
                {TABS.map((tab, i) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleTabChange(i)}
                    className={`relative flex-1 py-3 text-center text-xs font-semibold transition-colors sm:text-[13px] ${
                      activeTab === i
                        ? 'border-b-[3px] border-[#0077B6] bg-[#e8f4fa]/40 text-[#0077B6]'
                        : 'border-b-[3px] border-transparent text-slate-500 hover:bg-slate-50/80 hover:text-slate-800'
                    }`}
                  >
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel || tab.label}</span>
                    {tabBadges[tab.key] > 0 && (
                      <span className="absolute right-2 top-1.5 min-w-[18px] rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                        {tabBadges[tab.key] > 99 ? '99+' : tabBadges[tab.key]}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {isWsTab ? (
                wsViewMode === 'chat' ? (
                  <>
                    <div className="shrink-0 border-b border-slate-100 p-2">
                      <div className={searchWrapClass}>
                        <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <input
                          value={wsChat.search}
                          onChange={(e) => wsChat.setSearch(e.target.value)}
                          placeholder={msgCopy.search.ws}
                          className={searchInputClass}
                        />
                      </div>
                    </div>
                    <div className="msg-scrollbar min-h-0 flex-1 overflow-y-auto">
                      {wsChat.loadingSessions && (
                        <p className="p-3 text-[11px] text-slate-400">Đang tải...</p>
                      )}
                      {!wsChat.loadingSessions && wsChat.sessions.length === 0 && (
                        <p className="p-3 text-[11px] leading-relaxed text-slate-400">Chưa có cuộc trò chuyện với WS.</p>
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
                  <div className="msg-scrollbar min-h-0 flex-1 overflow-y-auto p-2.5">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Điều hướng WS</p>
                    {wsViewDefs.map((view) => {
                      const Icon = view.icon
                      const active = wsViewMode === view.key
                      return (
                        <button
                          key={view.key}
                          type="button"
                          onClick={() => handleWsViewChange(view.key)}
                          className={`mb-2 flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] font-medium transition-colors ${
                            active
                              ? 'border-[#0077B6] bg-[#e8f4fa] text-[#0077B6]'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-[#cce5f0] hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          {view.label}
                        </button>
                      )
                    })}
                  </div>
                )
              ) : (
                <>
                  <div className="shrink-0 space-y-2 border-b border-slate-100 p-2">
                    <div className={searchWrapClass}>
                      <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <input
                        value={ctvSearch}
                        onChange={(e) => setCtvSearch(e.target.value)}
                        placeholder={msgCopy.search.ctv}
                        className={searchInputClass}
                      />
                    </div>
                    <div className="relative">
                      <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
                      <select
                        value={ctvStatusFilter}
                        onChange={(e) => setCtvStatusFilter(e.target.value)}
                        className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-8 text-[11px] font-medium text-slate-700"
                      >
                        <option value="">Tất cả trạng thái</option>
                        {statusFilterOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                  <div className="msg-scrollbar min-h-0 flex-1 overflow-y-auto">
                    {nominationsLoading && (
                      <div className="flex items-center gap-2 p-3 text-[11px] text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải...
                      </div>
                    )}
                    {!nominationsLoading && ctvConversations.length === 0 && (
                      <p className="p-3 text-[11px] leading-relaxed text-slate-400">Chưa có đơn tiến cử từ CTV.</p>
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
              <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-slate-200 lg:border-r">
                <div className="flex shrink-0 border-b border-slate-100 bg-white px-1">
                  {wsViewDefs.map((view) => {
                    const Icon = view.icon
                    const active = wsViewMode === view.key
                    return (
                      <button
                        key={view.key}
                        type="button"
                        onClick={() => handleWsViewChange(view.key)}
                        className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-[10px] font-semibold transition-colors sm:text-[11px] ${
                          active
                            ? 'border-[#0077B6] text-[#0077B6]'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <Icon className="h-3 w-3" />
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
              <div className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#f8fafc] lg:border-r lg:border-slate-200">
                {selectedNomination ? (
                  <>
                    <div className="shrink-0 border-b border-slate-100 bg-white px-3 py-2.5 sm:px-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <Avatar
                          initials={getInitials(selectedNomination.ctvName)}
                          bg={avatarColorForId(selectedNomination.ctvId).bg}
                          color={avatarColorForId(selectedNomination.ctvId).color}
                          size={40}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">{selectedNomination.ctvName || '—'}</span>
                            <span className="text-[11px] text-slate-500">Cộng tác viên · Sàn CTV</span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-600">
                            <span>
                              Đơn tiến cử <strong className="font-semibold text-slate-800">#{selectedNomination.id}</strong>
                            </span>
                            <Tag>
                              {getJobApplicationStatusLabelByLanguage(selectedNomination.status, language)
                                || selectedNomination.statusLabel}
                            </Tag>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500">
                            <button type="button" onClick={() => openCandidateDrawer('profile')} className="font-medium text-[#0077B6] hover:underline">
                              {selectedNomination.candidateName || '—'}
                            </button>
                            <span className="text-slate-300"> · </span>
                            <button
                              type="button"
                              onClick={openJobDrawer}
                              disabled={!selectedNomination.jobId}
                              className="font-medium text-[#0077B6] hover:underline disabled:text-slate-400"
                            >
                              {selectedNomination.jobTitle || '—'}
                              {selectedNomination.jobCode ? ` (${selectedNomination.jobCode})` : ''}
                            </button>
                            <span className="text-slate-300"> · </span>
                            {formatDateShort(selectedNomination.appliedAt)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openCandidateDrawer('profile')}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Chi tiết đơn
                        </button>
                      </div>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col">
                      <NominationChat
                        key={selectedNomination.id}
                        embeddedPanel
                        disableBusinessFreeStatusChange
                        contactBarVariant="subtle"
                        jobApplicationId={selectedNomination.id}
                        userType="business"
                        currentStatus={selectedNomination.status}
                        introCandidateName={selectedNomination.candidateName || '—'}
                        introJobTitle={selectedNomination.jobTitle || '—'}
                        cvStorageId={selectedNomination.cvStorageId}
                        mobileHeaderName={selectedNomination.candidateName || msgCopy.chatThreeWay}
                        mobileHeaderAvatar={getInitials(selectedNomination.candidateName)}
                        onStatusUpdated={handleCandidateStatusUpdated}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center p-6 text-center text-[11px] text-slate-400">
                    {nominationsLoading ? msgCopy.loadingNominations : msgCopy.selectNomination}
                  </div>
                )}
              </div>
            )}

            {/* RIGHT — desktop only sidebar */}
            <div className="hidden min-h-0 flex-col overflow-hidden lg:flex">
              {isWsTab ? (
                <>
                  <div className="shrink-0 border-b border-slate-100 px-3 py-2">
                    <div className="text-xs font-bold text-slate-900">Thông tin WS</div>
                  </div>
                  <div className="msg-scrollbar min-h-0 flex-1 overflow-y-auto">
                    <InfoCard title={msgCopy.infoCards.wsSupport}>
                      <div className="flex gap-2">
                        <WsLogo size={32} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-semibold text-slate-900">WS Team – JobShare</div>
                          <Tag type="active">Đang hoạt động</Tag>
                          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                            Scout Performance, yêu cầu nạp credit và lịch sử yêu cầu.
                          </p>
                        </div>
                      </div>
                    </InfoCard>
                    <InfoCard title={msgCopy.infoCards.creditRequest}>
                      <p className="mb-2 text-[10px] leading-relaxed text-slate-500">
                        Tạo yêu cầu cấp credit — WS phê duyệt sau khi xác nhận thanh toán.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleWsViewChange('credit')}
                        className="mb-2 w-full rounded-lg py-2 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-[#006399]"
                        style={{ background: BRAND }}
                      >
                        Tạo yêu cầu nạp credit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleWsViewChange('credit-history')}
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Xem lịch sử yêu cầu
                      </button>
                    </InfoCard>
                    {wsViewMode === 'chat' && wsChat.activeSession && (
                      <InfoCard title={msgCopy.infoCards.currentChat}>
                        <div className="text-[11px] font-semibold text-slate-900">
                          {wsChat.activeSession.title || wsChat.activeSession.subject || 'WS Chat'}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">
                          {wsChat.activeSession.lastMessagePreview || '—'}
                        </div>
                      </InfoCard>
                    )}
                  </div>
                </>
              ) : selectedNomination ? (
                <div className="msg-scrollbar min-h-0 flex-1 overflow-y-auto">
                  <InfoCard title={msgCopy.infoCards.nominationInfo}>
                    <div className="text-[11px] font-semibold text-slate-900">#{selectedNomination.id}</div>
                    <Tag>
                      {getJobApplicationStatusLabelByLanguage(selectedNomination.status, language)
                        || selectedNomination.statusLabel || '—'}
                    </Tag>
                  </InfoCard>
                  <InfoCard title={msgCopy.infoCards.candidateInfo}>
                    <div className="flex gap-2">
                      <Avatar initials={getInitials(selectedNomination.candidateName)} bg="#d1fae5" color="#065f46" size={32} />
                      <div>
                        <div className="text-[11px] font-semibold text-slate-900">{selectedNomination.candidateName || '—'}</div>
                        {selectedNomination.candidateSub && (
                          <div className="text-[10px] text-slate-600">{selectedNomination.candidateSub}</div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCandidateDrawer('profile')}
                      className="mt-2 w-full rounded-lg border border-slate-200 py-1.5 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Xem hồ sơ ứng viên
                    </button>
                  </InfoCard>
                  <InfoCard title={msgCopy.infoCards.jdInfo}>
                    <button
                      type="button"
                      onClick={openJobDrawer}
                      disabled={!selectedNomination.jobId}
                      className="flex w-full gap-2 rounded-lg text-left transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 -m-1 p-1"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f4fa]">
                        <Briefcase className="h-4 w-4 text-[#0077B6]" />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-900">{selectedNomination.jobTitle || '—'}</div>
                        {selectedNomination.jobCode && (
                          <div className="text-[10px] text-slate-400">Mã: {selectedNomination.jobCode}</div>
                        )}
                      </div>
                    </button>
                  </InfoCard>
                  <InfoCard title={msgCopy.infoCards.ctvInfo}>
                    <div className="flex gap-2">
                      <Avatar
                        initials={getInitials(selectedNomination.ctvName)}
                        bg={avatarColorForId(selectedNomination.ctvId).bg}
                        color={avatarColorForId(selectedNomination.ctvId).color}
                        size={32}
                      />
                      <div>
                        <div className="text-[11px] font-semibold text-slate-900">{selectedNomination.ctvName || '—'}</div>
                        <div className="text-[10px] text-slate-600">CTV tuyển dụng</div>
                        {selectedNomination.matchScore != null && (
                          <div className="mt-0.5 flex items-center gap-0.5 text-[10px] text-slate-500">
                            {selectedNomination.matchScore}
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </InfoCard>
                  <InfoCard title="Phí giới thiệu">
                    <div className="flex items-start gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                        <Coins className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          {listingFeeLabel || '—'}
                        </p>
                        <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                          Phí áp dụng cho JD đăng trên Sàn CTV (đơn tiến cử này).
                        </p>
                      </div>
                    </div>
                  </InfoCard>
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center p-4 text-center text-[11px] text-slate-400">
                  Chọn đơn tiến cử để xem chi tiết
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {candidateDrawerOpen && selectedNomination && createPortal(
        (() => {
          const drawerApp = candidateDrawerApp || nominationToAppFallback(selectedNomination)
          const showProfileTab = drawerApp.canViewFullProfile
          return (
            <div
              className="fixed inset-0 z-[100] flex bg-slate-900/40 backdrop-blur-[1px]"
              onClick={closeCandidateDrawer}
            >
              <div
                className="ml-auto flex h-full flex-col border-l border-slate-200 bg-white shadow-2xl"
                style={{ width: 'min(100vw, 560px)', fontFamily: PAGE_FONT }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-[#f4f6f8]/50 px-4 py-3">
                  <div>
                    <div className="text-sm font-bold text-slate-800">{drawerApp.candidateName}</div>
                    <div className="mt-0.5 text-[10px] text-slate-500">
                      {drawerApp.jobTitle} ({drawerApp.jobCode || '—'}) · {drawerApp.sourceLabel || msgCopy.marketplaceSource}
                    </div>
                  </div>
                  <button type="button" onClick={closeCandidateDrawer} className="rounded-lg p-1.5 transition-colors hover:bg-slate-100">
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                </div>

                {showProfileTab && (
                  <div className="flex flex-shrink-0 border-b border-slate-200 bg-white">
                    <button
                      type="button"
                      onClick={() => setCandidateDrawerTab('profile')}
                      className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-colors ${
                        candidateDrawerTab === 'profile' ? 'border-b-2 border-[#0077B6] text-[#0077B6]' : 'border-b-2 border-transparent text-slate-500'
                      }`}
                    >
                      <User className="h-3.5 w-3.5" /> Hồ sơ ứng viên
                    </button>
                    <button
                      type="button"
                      onClick={() => setCandidateDrawerTab('chat')}
                      className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-colors ${
                        candidateDrawerTab === 'chat' ? 'border-b-2 border-[#0077B6] text-[#0077B6]' : 'border-b-2 border-transparent text-slate-500'
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Chat 3 bên
                    </button>
                  </div>
                )}

                {candidateDrawerLoading && (
                  <div className="flex items-center gap-2 border-b border-slate-100 bg-[#e8f4fa]/40 px-4 py-2 text-[10px] text-slate-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0077B6]" /> Đang tải hồ sơ...
                  </div>
                )}

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  {candidateDrawerTab === 'profile' && showProfileTab ? (
                    <div className="business-homepage-scroll min-h-0 flex-1 overflow-y-auto p-3">
                      {candidateDrawerLoading && !drawerApp.candidateProfile ? (
                        <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin text-[#0077B6]" /> Đang tải hồ sơ...
                        </div>
                      ) : (
                        <ScoutCandidateProfilePanel
                          candidate={drawerApp.candidateProfile ? {
                            ...drawerApp.candidateProfile,
                            name: drawerApp.candidateProfile.name || drawerApp.candidateName,
                            isUnlocked: true,
                          } : null}
                          treatAsUnlocked
                          accessLabel={msgCopy.fullProfileAccess}
                          accessLabelColor={BRAND}
                          footerNote={drawerApp.candidateProfile?.scoutStillLocked
                            ? msgCopy.fullProfileHint
                            : null}
                        />
                      )}
                    </div>
                  ) : (
                    <NominationChat
                      jobApplicationId={drawerApp.id}
                      userType="business"
                      disableBusinessFreeStatusChange
                      contactBarVariant="subtle"
                      embeddedPanel
                      currentStatus={drawerApp.status}
                      cvStorageId={drawerApp.cvStorageId || drawerApp.cvId || null}
                      introCandidateName={drawerApp.candidateName || '—'}
                      introJobTitle={drawerApp.jobTitle || '—'}
                      mobileHeaderName={drawerApp.candidateName || msgCopy.chatThreeWay}
                      mobileHeaderAvatar={(drawerApp.candidateName || '?').charAt(0).toUpperCase()}
                      onStatusUpdated={handleCandidateStatusUpdated}
                    />
                  )}
                </div>
              </div>
            </div>
          )
        })(),
        document.body,
      )}

      {jobDrawerOpen && jobDrawerJobId && createPortal(
        <div
          className="fixed inset-0 z-[100] flex bg-slate-900/40 backdrop-blur-[1px]"
          onClick={closeJobDrawer}
        >
          <div
            className="ml-auto flex h-full flex-col border-l border-slate-200 bg-white shadow-2xl"
            style={{ width: 'min(100vw, 680px)', fontFamily: PAGE_FONT }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-[#f4f6f8]/50 px-4 py-3">
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-800">Thông tin JD</div>
                <div className="mt-0.5 truncate text-[10px] text-slate-500">
                  {selectedNomination?.jobTitle || '—'}
                  {selectedNomination?.jobCode ? ` · Mã: ${selectedNomination.jobCode}` : ''}
                </div>
              </div>
              <button type="button" onClick={closeJobDrawer} className="rounded-lg p-1.5 transition-colors hover:bg-slate-100">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <JobDetail embedded jobId={jobDrawerJobId} />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

export default Message
