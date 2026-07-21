import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, ChevronLeft } from 'lucide-react';
import apiService from '../../services/api';
import { getRealtimeClient } from '../../services/realtimeClient';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../translations/translations';
import { createReconnectingEventSource, parsePublicChatSseEvent } from '../../utils/publicChatSse';
import { fetchAdminSupportUnread } from '../../utils/publicCtvChatUnread';

function normalizeSearch(s) {
  return String(s || '')
    .trim()
    .toLowerCase();
}

function ctvSessionMatches(s, q) {
  if (!q) return true;
  const parts = [
    s.visitorLabel,
    s.collaboratorName,
    s.collaboratorCode,
    s.collaboratorEmail,
    s.id != null ? String(s.id) : '',
  ]
    .filter(Boolean)
    .map((x) => String(x).toLowerCase());
  return parts.some((p) => p.includes(q));
}

function candidateSessionMatches(s, q) {
  if (!q) return true;
  const parts = [
    s.visitorLabel,
    s.applicantName,
    s.applicantEmail,
    s.id != null ? String(s.id) : '',
  ]
    .filter(Boolean)
    .map((x) => String(x).toLowerCase());
  return parts.some((p) => p.includes(q));
}

function hasUnread(session) {
  return !!session?.hasUnread;
}

function getSessionLastMessageAt(session) {
  const value =
    session?.lastMessageAt ||
    session?.last_message_at ||
    session?.updatedAt ||
    session?.updated_at ||
    session?.createdAt ||
    session?.created_at ||
    null;
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(time) ? time : 0;
}

function getChatPreviewUnreadCount(session, localCount = 0) {
  const serverCount = Number(session?.unreadCount || 0);
  const local = Number(localCount || 0);
  if (local > 0) return local;
  if (hasUnread(session)) return Math.max(serverCount, 1);
  return serverCount;
}

function formatMessageTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatUnreadSenderSummary(senders = [], max = 5) {
  const items = (senders || []).filter((s) => Number(s.unreadCount || 0) > 0);
  if (!items.length) return '';
  const shown = items.slice(0, max).map((s) => `${s.label} (${s.unreadCount})`);
  const rest = items.length - shown.length;
  if (rest > 0) shown.push(`+${rest} người khác`);
  return shown.join(', ');
}

function isSameSessionId(a, b) {
  const na = Number(a);
  const nb = Number(b);
  return Number.isFinite(na) && Number.isFinite(nb) && na === nb;
}


const PublicCtvChatInboxPage = () => {
  const { language } = useLanguage();
  const t = translations[language] || translations.vi;
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'candidate' ? 'candidate' : 'ctv';

  const [ctvSessions, setCtvSessions] = useState([]);
  const [candidateSessions, setCandidateSessions] = useState([]);
  const [loadingCtv, setLoadingCtv] = useState(true);
  const [loadingCandidate, setLoadingCandidate] = useState(true);

  const [sessionMeta, setSessionMeta] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionSearch, setSessionSearch] = useState('');
  const listRef = useRef(null);

  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [localUnreadBySession, setLocalUnreadBySession] = useState({});
  const [unreadSummary, setUnreadSummary] = useState(null);
  const socketRef = useRef(null);
  const inboxStreamRef = useRef(null);

  const tabRef = useRef(tab);
  tabRef.current = tab;

  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const selectedIdRef = useRef(null);

  const loadCtvSessions = useCallback(async () => {
    setLoadingCtv(true);
    try {
      const res = await apiService.getAdminPublicCtvChatSessions({ page: 1, limit: 100 });
      if (res.success && res.data?.sessions) setCtvSessions(res.data.sessions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCtv(false);
    }
  }, []);

  const loadCandidateSessions = useCallback(async () => {
    setLoadingCandidate(true);
    try {
      const res = await apiService.getAdminPublicCandidateChatSessions({ page: 1, limit: 100 });
      if (res.success && res.data?.sessions) setCandidateSessions(res.data.sessions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCandidate(false);
    }
  }, []);

  const bumpUnreadForSession = useCallback((sessionId) => {
    if (!sessionId) return;
    const key = String(sessionId);
    setLocalUnreadBySession((prev) => ({
      ...prev,
      [key]: Math.max(0, Number(prev[key] || 0) + 1),
    }));
  }, []);

  const refreshListForTab = useCallback(async () => {
    try {
      if (tabRef.current === 'ctv') {
        await loadCtvSessions();
      } else {
        await loadCandidateSessions();
      }
    } catch (e) {
      console.error(e);
    }
  }, [loadCandidateSessions, loadCtvSessions]);

  const refreshUnreadSummary = useCallback(async () => {
    try {
      const summary = await fetchAdminSupportUnread(apiService);
      setUnreadSummary(summary);
    } catch {
      setUnreadSummary(null);
    }
  }, []);

  useEffect(() => {
    loadCtvSessions();
    loadCandidateSessions();
    refreshUnreadSummary();
  }, [loadCtvSessions, loadCandidateSessions, refreshUnreadSummary]);

  useEffect(() => {
    const onRead = () => {
      refreshUnreadSummary();
    };
    window.addEventListener('admin-support-chat-read', onRead);
    return () => window.removeEventListener('admin-support-chat-read', onRead);
  }, [refreshUnreadSummary]);

  const markSessionSeen = useCallback((session) => {
    if (!session?.id) return;
    const key = String(session.id);
    setLocalUnreadBySession((prev) => ({ ...prev, [key]: 0 }));
    const patch = {
      hasUnread: false,
      unreadCount: 0,
      adminLastSeenAt: session.adminLastSeenAt || new Date().toISOString(),
    };
    setCtvSessions((prev) =>
      prev.map((s) => (Number(s.id) === Number(session.id) ? { ...s, ...patch } : s))
    );
    setCandidateSessions((prev) =>
      prev.map((s) => (Number(s.id) === Number(session.id) ? { ...s, ...patch } : s))
    );
    window.dispatchEvent(new CustomEvent('admin-support-chat-read'));
    refreshUnreadSummary();
  }, [refreshUnreadSummary]);

  const resolveActiveThread = useCallback((sessionKind, sessionId) => {
    if (sessionKind !== tabRef.current) return false;
    const sid = Number(sessionId);
    if (!Number.isFinite(sid)) return false;
    const urlRaw = searchParamsRef.current.get('sessionId');
    const urlId = urlRaw ? parseInt(urlRaw, 10) : NaN;
    if (Number.isFinite(urlId) && urlId === sid) return true;
    return isSameSessionId(selectedIdRef.current, sid);
  }, []);

  useEffect(() => {
    if (tab !== 'ctv') {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const q = sessionSearch.trim();
    if (!q || q.length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await apiService.searchCollaboratorsForChat(q);
        if (res.success && res.data?.collaborators) {
          setSearchResults(res.data.collaborators);
          setShowDropdown(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(searchTimerRef.current);
  }, [sessionSearch, tab]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const rawSessions = tab === 'ctv' ? ctvSessions : candidateSessions;
  const loadingList = tab === 'ctv' ? loadingCtv : loadingCandidate;

  const selectedId = useMemo(() => {
    const raw = searchParams.get('sessionId');
    const id = raw ? parseInt(raw, 10) : NaN;
    return Number.isNaN(id) ? null : id;
  }, [searchParams]);

  const sessionsWithUnread = useMemo(() => rawSessions, [rawSessions]);
  const previewUnreadCountBySessionId = useMemo(
    () =>
      sessionsWithUnread.reduce((acc, session) => {
        const key = String(session.id);
        acc[session.id] = getChatPreviewUnreadCount(session, localUnreadBySession[key]);
        return acc;
      }, {}),
    [sessionsWithUnread, localUnreadBySession]
  );

  const tabUnreadTotals = useMemo(
    () => ({
      ctv: ctvSessions.reduce(
        (sum, s) => sum + getChatPreviewUnreadCount(s, localUnreadBySession[String(s.id)]),
        0
      ),
      candidate: candidateSessions.reduce(
        (sum, s) => sum + getChatPreviewUnreadCount(s, localUnreadBySession[String(s.id)]),
        0
      ),
    }),
    [ctvSessions, candidateSessions, localUnreadBySession]
  );

  const tabUnreadSenders = useMemo(() => {
    const sessions = tab === 'ctv' ? ctvSessions : candidateSessions;
    return sessions
      .map((s) => ({
        sessionId: s.id,
        label: tab === 'ctv' ? (s.collaboratorName || s.visitorLabel || `Khách #${s.id}`) : (s.applicantName || s.visitorLabel || `Khách #${s.id}`),
        unreadCount: getChatPreviewUnreadCount(s, localUnreadBySession[String(s.id)]),
      }))
      .filter((item) => item.unreadCount > 0)
      .sort((a, b) => b.unreadCount - a.unreadCount);
  }, [tab, ctvSessions, candidateSessions, localUnreadBySession]);

  const otherTabUnreadTotal = tab === 'ctv' ? tabUnreadTotals.candidate : tabUnreadTotals.ctv;
  const otherTabLabel = tab === 'ctv' ? t.adminMessagesTabCandidate : t.adminMessagesTabCtv;

  const searchQ = useMemo(() => normalizeSearch(sessionSearch), [sessionSearch]);

  const filteredSessions = useMemo(() => {
    const sorted = [...sessionsWithUnread].sort((a, b) => {
      const aUnread = previewUnreadCountBySessionId[a.id] || 0;
      const bUnread = previewUnreadCountBySessionId[b.id] || 0;
      const unreadDiff = Number(bUnread > 0) - Number(aUnread > 0);
      if (unreadDiff !== 0) return unreadDiff;
      if (bUnread !== aUnread) return bUnread - aUnread;
      return getSessionLastMessageAt(b) - getSessionLastMessageAt(a);
    });
    if (!searchQ) return sorted;
    return sorted.filter((s) =>
      tab === 'ctv' ? ctvSessionMatches(s, searchQ) : candidateSessionMatches(s, searchQ)
    );
  }, [sessionsWithUnread, searchQ, tab, previewUnreadCountBySessionId]);

  selectedIdRef.current = selectedId;

  useEffect(() => {
    const adminToken = localStorage.getItem('token');
    if (!adminToken) return undefined;

    const socket = getRealtimeClient();
    socketRef.current = socket;
    let refreshTimer = null;

    const handleIncoming = (data, sessionKind) => {
      if (!data || data.type !== 'message' || data.sessionId == null) return;
      const sid = Number(data.sessionId);
      if (!Number.isFinite(sid)) return;
      const isActiveThread = resolveActiveThread(sessionKind, sid);

      if (isActiveThread) {
        markSessionSeen({ id: sid, lastMessageAt: data.message?.createdAt || Date.now() });
        setMessages((prev) => {
          const mid = data.message?.id;
          if (mid == null) return prev;
          if (prev.some((m) => Number(m.id) === Number(mid))) return prev;
          return [...prev, data.message];
        });
      } else {
        bumpUnreadForSession(sid);
      }

      const updater = sessionKind === 'ctv' ? setCtvSessions : setCandidateSessions;
      updater((prev) => {
        const exists = prev.some((s) => isSameSessionId(s.id, sid));
        if (!exists && sessionKind === 'ctv' && data.sessionToken) {
          return [
            {
              id: sid,
              sessionToken: data.sessionToken,
              visitorLabel: data.visitorLabel,
              collaboratorId: data.collaboratorId || null,
              isRegistered: !!data.isRegistered,
              hasUnread: !isActiveThread,
              unreadCount: !isActiveThread ? 1 : 0,
              lastMessageAt: data.message?.createdAt || Date.now(),
              updatedAt: data.message?.createdAt || Date.now(),
            },
            ...prev,
          ];
        }
        return prev.map((s) =>
          isSameSessionId(s.id, sid)
            ? {
                ...s,
                hasUnread: !isActiveThread,
                unreadCount: !isActiveThread ? Number(s.unreadCount || 0) + 1 : 0,
                lastMessageAt: data.message?.createdAt || s.lastMessageAt || Date.now(),
                updatedAt: data.message?.createdAt || s.updatedAt,
              }
            : s
        );
      });
    };

    const onCtv = (data) => handleIncoming(data, 'ctv');
    const onCandidate = (data) => handleIncoming(data, 'candidate');

    const onSocketConnect = () => {
      socket.emit('join-admin-inbox');
      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        refreshListForTab();
      }, 1200);
    };

    socket.on('connect', onSocketConnect);
    socket.on('admin-public-ctv-chat', onCtv);
    socket.on('admin-public-candidate-chat', onCandidate);
    if (socket.connected) onSocketConnect();

    const inboxStreams = [
      { url: apiService.getAdminPublicCtvChatInboxStreamUrl(), kind: 'ctv' },
      { url: apiService.getAdminPublicCandidateChatInboxStreamUrl(), kind: 'candidate' },
    ].filter((item) => !!item.url);

    inboxStreamRef.current = [];
    inboxStreams.forEach(({ url, kind }) => {
      const stream = createReconnectingEventSource(url, {
        onEvent: (ev) => {
          const data = parsePublicChatSseEvent(ev);
          if (data) handleIncoming(data, kind);
        },
      });
      inboxStreamRef.current.push(stream);
    });

    return () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      socket.off('connect', onSocketConnect);
      socket.off('admin-public-ctv-chat', onCtv);
      socket.off('admin-public-candidate-chat', onCandidate);
      const streams = inboxStreamRef.current;
      if (Array.isArray(streams)) {
        streams.forEach((s) => {
          try {
            s?.close?.();
          } catch (e) {
            console.error(e);
          }
        });
      }
      inboxStreamRef.current = null;
    };
  }, [bumpUnreadForSession, markSessionSeen, refreshListForTab, resolveActiveThread, searchParams]);

  const loadThread = useCallback(async () => {
    if (!selectedId) {
      setSessionMeta(null);
      setMessages([]);
      return;
    }
    try {
      if (tab === 'ctv') {
        const res = await apiService.getAdminPublicCtvChatMessages(selectedId);
        if (res.success && res.data) {
          setSessionMeta(res.data.session);
          setMessages(res.data.messages || []);
          markSessionSeen(res.data.session);
          await loadCtvSessions();
        }
      } else {
        const res = await apiService.getAdminPublicCandidateChatMessages(selectedId);
        if (res.success && res.data) {
          setSessionMeta(res.data.session);
          setMessages(res.data.messages || []);
          markSessionSeen(res.data.session);
          await loadCandidateSessions();
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [loadCandidateSessions, loadCtvSessions, markSessionSeen, selectedId, tab]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);



  const setTab = (next) => {
    setSessionSearch('');
    setSearchResults([]);
    setShowDropdown(false);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('tab', next);
      p.delete('sessionId');
      return p;
    });
    setSessionMeta(null);
    setMessages([]);
    setInput('');
  };

  const selectSession = (id) => {
    setShowDropdown(false);
    const key = String(id);
    setLocalUnreadBySession((prev) => ({ ...prev, [key]: 0 }));
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('tab', tab);
      p.set('sessionId', String(id));
      return p;
    });
  };

  const backToSessionList = () => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('tab', tab);
      p.delete('sessionId');
      return p;
    });
  };

  const handleSelectCollaborator = async (collaborator) => {
    setShowDropdown(false);
    setSessionSearch('');
    try {
      const existing = ctvSessions.find(
        (s) => s.collaboratorId && Number(s.collaboratorId) === Number(collaborator.id)
      );
      if (existing) {
        selectSession(existing.id);
        return;
      }
      const res = await apiService.createCtvChatSession(collaborator.id);
      if (res.success && res.data?.session) {
        await loadCtvSessions();
        selectSession(res.data.session.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || !selectedId || sending) return;
    setSending(true);
    try {
      const res =
        tab === 'ctv'
          ? await apiService.sendAdminPublicCtvChatMessage(selectedId, text)
          : await apiService.sendAdminPublicCandidateChatMessage(selectedId, text);
      if (res.success && res.data?.message) {
        const msg = res.data.message;
        setMessages((prev) => {
          if (msg?.id != null && prev.some((m) => Number(m.id) === Number(msg.id))) return prev;
          return [...prev, msg];
        });
        setInput('');
        if (tab === 'ctv') await loadCtvSessions();
        else await loadCandidateSessions();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const displayCtvTitle = (s) => {
    if (s.collaboratorName) return s.collaboratorName;
    if (s.visitorLabel) return s.visitorLabel;
    return `Khách #${s.id}`;
  };

  const displayCtvSubtitle = (s) => {
    const bits = [];
    if (s.collaboratorCode) bits.push(s.collaboratorCode);
    if (s.collaboratorEmail) bits.push(s.collaboratorEmail);
    if (!s.isRegistered && s.visitorLabel && s.visitorLabel !== displayCtvTitle(s)) bits.push(s.visitorLabel);
    return bits.length ? bits.join(' · ') : null;
  };

  const displayCandidateTitle = (s) => {
    if (s.applicantName) return s.applicantName;
    if (s.visitorLabel) return s.visitorLabel;
    return `Khách #${s.id}`;
  };

  const displayCandidateSubtitle = (s) => {
    const bits = [];
    if (s.applicantEmail) bits.push(s.applicantEmail);
    if (s.applicantPhone) bits.push(s.applicantPhone);
    if (!s.isRegistered && s.visitorLabel && s.visitorLabel !== displayCandidateTitle(s)) bits.push(s.visitorLabel);
    return bits.length ? bits.join(' · ') : null;
  };

  const existingCtvIds = useMemo(() => {
    return new Set(ctvSessions.filter((s) => s.collaboratorId).map((s) => Number(s.collaboratorId)));
  }, [ctvSessions]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4 md:p-6">
      <div className="flex shrink-0 gap-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab('ctv')}
          className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === 'ctv' ? 'border-red-600 text-red-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            {t.adminMessagesTabCtv}
            {tabUnreadTotals.ctv > 0 && (
              <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {tabUnreadTotals.ctv > 99 ? '99+' : tabUnreadTotals.ctv}
              </span>
            )}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab('candidate')}
          className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === 'candidate' ? 'border-red-600 text-red-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            {t.adminMessagesTabCandidate}
            {tabUnreadTotals.candidate > 0 && (
              <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {tabUnreadTotals.candidate > 99 ? '99+' : tabUnreadTotals.candidate}
              </span>
            )}
          </span>
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:items-stretch">
        <div className={`${selectedId ? 'hidden lg:flex' : 'flex'} min-h-[240px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm`}>
          <div className="border-b border-slate-100 px-3 py-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.adminMessagesSessionsList}</div>
            <div className="relative mt-2" ref={dropdownRef}>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                onFocus={() => {
                  if (tab === 'ctv' && searchResults.length > 0) setShowDropdown(true);
                }}
                placeholder={
                  tab === 'ctv'
                    ? 'Tìm CTV (tên, mã, email, SĐT) hoặc tạo chat mới…'
                    : t.adminMessagesSearchSessionsCandidate
                }
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-8 text-sm outline-none focus:border-red-400"
                autoComplete="off"
              />
              {sessionSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setSessionSearch('');
                    setSearchResults([]);
                    setShowDropdown(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {tab === 'ctv' && showDropdown && sessionSearch.trim() && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                  {searchLoading ? (
                    <div className="px-3 py-2 text-sm text-slate-500">Đang tìm…</div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-500">Không tìm thấy CTV nào</div>
                  ) : (
                    searchResults.map((c) => {
                      const hasExisting = existingCtvIds.has(Number(c.id));
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCollaborator(c)}
                          className="w-full border-b border-slate-50 px-3 py-2.5 text-left text-sm transition-colors hover:bg-red-50"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800">{c.name}</span>
                            {c.code && <span className="text-xs text-slate-500">{c.code}</span>}
                            {hasExisting && (
                              <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                                Đã có chat
                              </span>
                            )}
                          </div>
                          <div className="truncate text-xs text-slate-400">
                            {[c.email, c.phone].filter(Boolean).join(' · ')}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
          {(tabUnreadSenders.length > 0 || otherTabUnreadTotal > 0) && (
            <div className="border-b border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-950">
              {tabUnreadSenders.length > 0 && (
                <p>
                  <span className="font-bold">{tabUnreadTotals[tab]} tin chưa đọc</span>
                  {' '}từ {tabUnreadSenders.length} phiên:
                  {' '}
                  <span className="font-semibold">{formatUnreadSenderSummary(tabUnreadSenders)}</span>
                </p>
              )}
              {otherTabUnreadTotal > 0 && (
                <button
                  type="button"
                  onClick={() => setTab(tab === 'ctv' ? 'candidate' : 'ctv')}
                  className="mt-1 font-semibold text-red-700 underline underline-offset-2"
                >
                  Tab {otherTabLabel} còn {otherTabUnreadTotal} tin chưa đọc — bấm để xem
                </button>
              )}
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingList ? (
              <p className="p-3 text-sm text-slate-500">{t.chatLoading || 'Đang tải…'}</p>
            ) : rawSessions.length === 0 ? (
              <p className="p-3 text-sm text-slate-500">Chưa có phiên nào.</p>
            ) : filteredSessions.length === 0 ? (
              <p className="p-3 text-sm text-slate-500">{t.adminMessagesNoMatch}</p>
            ) : (
              filteredSessions.map((s) => {
                const unreadCount = previewUnreadCountBySessionId[s.id] || 0;
                const isUnread = unreadCount > 0;
                const previewText = isUnread
                  ? (s.unreadPreview || s.lastMessagePreview || '')
                  : (s.lastMessagePreview || '');
                return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectSession(s.id)}
                  className={`w-full border-b border-slate-50 px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 ${
                    selectedId === s.id ? 'bg-red-50 text-red-900' : 'text-slate-800'
                  } ${isUnread ? 'border-l-4 border-l-red-600 bg-red-50/70' : 'border-l-4 border-l-transparent'}`}
                >
                  {tab === 'ctv' ? (
                    <>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`${isUnread ? 'font-bold text-red-900' : 'font-medium'}`}>
                          {displayCtvTitle(s)}
                        </span>
                        {isUnread && (
                          <>
                            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              Chưa đọc
                            </span>
                            <span
                              className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white"
                              title={`${unreadCount} tin chưa đọc`}
                            >
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          </>
                        )}
                        {s.isRegistered && (
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                            Đã đăng ký
                          </span>
                        )}
                      </div>
                      {displayCtvSubtitle(s) && (
                        <div className={`truncate text-xs ${isUnread ? 'font-medium text-slate-700' : 'text-slate-500'}`}>
                          {displayCtvSubtitle(s)}
                        </div>
                      )}
                      {previewText && (
                        <div className={`mt-1 truncate text-xs ${isUnread ? 'font-semibold text-red-800' : 'text-slate-500'}`}>
                          {previewText}
                        </div>
                      )}
                      <div className="truncate text-[11px] text-slate-400">
                        {getSessionLastMessageAt(s) ? new Date(getSessionLastMessageAt(s)).toLocaleString('vi-VN') : '—'}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`${isUnread ? 'font-bold text-red-900' : 'font-medium'}`}>
                          {displayCandidateTitle(s)}
                        </span>
                        {isUnread && (
                          <>
                            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              Chưa đọc
                            </span>
                            <span
                              className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white"
                              title={`${unreadCount} tin chưa đọc`}
                            >
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          </>
                        )}
                        {s.isRegistered && (
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                            Đã đăng ký
                          </span>
                        )}
                      </div>
                      {displayCandidateSubtitle(s) && (
                        <div className={`truncate text-xs ${isUnread ? 'font-medium text-slate-700' : 'text-slate-500'}`}>
                          {displayCandidateSubtitle(s)}
                        </div>
                      )}
                      {previewText && (
                        <div className={`mt-1 truncate text-xs ${isUnread ? 'font-semibold text-red-800' : 'text-slate-500'}`}>
                          {previewText}
                        </div>
                      )}
                      <div className="truncate text-[11px] text-slate-400">
                        {getSessionLastMessageAt(s) ? new Date(getSessionLastMessageAt(s)).toLocaleString('vi-VN') : '—'}
                      </div>
                    </>
                  )}
                </button>
              );
              })
            )}
          </div>
        </div>

        <div className={`${selectedId ? 'flex' : 'hidden lg:flex'} min-h-[360px] min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm`}>
          {!selectedId ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-slate-500">
              {t.adminMessagesSelectSession}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 sm:px-4">
                <button
                  type="button"
                  onClick={backToSessionList}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 lg:hidden"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  {t.backButton || 'Quay lại'}
                </button>
                {tab === 'ctv' ? (
                  <>
                    <span>{sessionMeta?.collaboratorName || sessionMeta?.visitorLabel || `Phiên #${selectedId}`}</span>
                    {sessionMeta?.isRegistered && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                        Đã đăng ký CTV
                      </span>
                    )}
                    {sessionMeta?.collaboratorCode && (
                      <span className="text-xs font-normal text-slate-500">Mã: {sessionMeta.collaboratorCode}</span>
                    )}
                  </>
                ) : (
                  <>
                    <span>{sessionMeta?.applicantName || sessionMeta?.visitorLabel || `Phiên #${selectedId}`}</span>
                    {sessionMeta?.isRegistered && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                        Đã đăng ký
                      </span>
                    )}
                    {sessionMeta?.applicantEmail && (
                      <span className="text-xs font-normal text-slate-500">{sessionMeta.applicantEmail}</span>
                    )}
                  </>
                )}
              </div>
              <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/80 p-4">
                {messages.map((m) => {
                  const isAdmin = m.senderType === 'admin';
                  const sentAtLabel = formatMessageTime(m.createdAt);
                  const visitorLabel = tab === 'ctv' ? 'CTV/Khách' : 'Ứng viên/Khách';
                  let statusLabel = '';
                  if (isAdmin) {
                    statusLabel = m.isReadByVisitor ? `${visitorLabel} đã xem` : `${visitorLabel} chưa xem`;
                  } else if (m.isReadByAdmin) {
                    statusLabel = 'Admin đã nhận';
                  } else {
                    statusLabel = 'Chưa đọc';
                  }
                  return (
                    <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] ${isAdmin ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        {!isAdmin && (
                          <span className="px-1 text-[10px] font-semibold text-slate-500">{visitorLabel}</span>
                        )}
                        <div
                          className={`rounded-2xl px-3 py-2 text-sm ${
                            isAdmin ? 'bg-red-600 text-white' : 'border border-slate-200 bg-white text-slate-800'
                          }`}
                        >
                          {m.body}
                        </div>
                        <div className={`flex flex-wrap gap-x-2 text-[10px] ${isAdmin ? 'justify-end text-slate-500' : 'text-slate-500'}`}>
                          {sentAtLabel && <span>{sentAtLabel}</span>}
                          {statusLabel && (
                            <>
                              <span>·</span>
                              <span className={!isAdmin && !m.isReadByAdmin ? 'font-bold text-red-600' : ''}>{statusLabel}</span>
                            </>
                          )}
                          {isAdmin && m.admin?.name && (
                            <>
                              <span>·</span>
                              <span>{m.admin.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-100 p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                    placeholder="Nhập tin nhắn…"
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-400"
                  />
                  <button
                    type="button"
                    disabled={sending || !input.trim()}
                    onClick={send}
                    className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Gửi
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicCtvChatInboxPage;
