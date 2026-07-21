import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Bell, Mail, HelpCircle, MoreVertical, LogOut, Settings } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { localizeNotification } from '../../utils/notificationI18n';
import apiService from '../../services/api';

const I18N = {
  vi: {
    notifications: 'Thông báo',
    messages: 'Tin nhắn',
    help: 'Trợ giúp',
    settings: 'Cài đặt',
    logout: 'Đăng xuất',
    markAllRead: 'Đọc hết',
    noNotifications: 'Không có thông báo.',
    loading: 'Đang tải...',
  },
  en: {
    notifications: 'Notifications',
    messages: 'Messages',
    help: 'Help',
    settings: 'Settings',
    logout: 'Log Out',
    markAllRead: 'Mark all read',
    noNotifications: 'No notifications.',
    loading: 'Loading...',
  },
  ja: {
    notifications: '通知',
    messages: 'メッセージ',
    help: 'ヘルプ',
    settings: '設定',
    logout: 'ログアウト',
    markAllRead: 'すべて既読',
    noNotifications: '通知はありません。',
    loading: '読み込み中...',
  },
};

const BusinessHeader = ({ businessUser }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = I18N[language] || I18N.vi;
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifUnread, setNotifUnread] = useState(0);
  const [notifList, setNotifList] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const companyDropdownRef = useRef(null);
  const userMenuRef = useRef(null);
  const notifPanelRef = useRef(null);
  const notifStreamAbortRef = useRef(null);

  const {
    companyName = '',
    contactName = '',
    contactTitle = '',
    initials = 'B',
    companyInitial = 'B',
  } = businessUser || {};

  const refreshNotifCount = async () => {
    try {
      const count = await apiService.getBusinessNotificationUnreadCount();
      setNotifUnread(typeof count === 'number' ? count : 0);
    } catch {
      setNotifUnread(0);
    }
  };

  useEffect(() => {
    refreshNotifCount();
    const timer = setInterval(refreshNotifCount, 45000);
    const onFocus = () => refreshNotifCount();
    const onExternalUpdate = () => refreshNotifCount();
    window.addEventListener('focus', onFocus);
    window.addEventListener('notifications:updated', onExternalUpdate);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('notifications:updated', onExternalUpdate);
    };
  }, []);

  useEffect(() => {
    if (!notifOpen) return undefined;
    const load = async () => {
      setNotifLoading(true);
      try {
        const [res, count] = await Promise.all([
          apiService.getBusinessNotifications({ page: 1, limit: 20 }),
          apiService.getBusinessNotificationUnreadCount(),
        ]);
        const rows = res?.data?.notifications ?? res?.notifications ?? [];
        setNotifList(Array.isArray(rows) ? rows : []);
        setNotifUnread(typeof count === 'number' ? count : 0);
      } catch {
        setNotifList([]);
        await refreshNotifCount();
      } finally {
        setNotifLoading(false);
      }
    };
    load();
    const onDoc = (e) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [notifOpen]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    if (!token || userType !== 'business') return undefined;

    let cancelled = false;
    const controller = new AbortController();
    notifStreamAbortRef.current = controller;

    const handleStreamPayload = (payload) => {
      if (!payload?.id) return;
      setNotifList((prev) => {
        const exists = prev.some((n) => String(n.id) === String(payload.id));
        if (exists) return prev;
        return [payload, ...prev].slice(0, 20);
      });
      refreshNotifCount();
    };

    const runStream = async () => {
      try {
        const response = await apiService.streamBusinessNotifications();
        if (!response.ok || !response.body) return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() || '';
          chunks.forEach((chunk) => {
            const lines = chunk.split('\n');
            let eventName = 'message';
            let dataStr = '';
            lines.forEach((line) => {
              if (line.startsWith('event:')) eventName = line.slice(6).trim();
              if (line.startsWith('data:')) dataStr += line.slice(5).trim();
            });
            if (eventName === 'notification' && dataStr) {
              try {
                handleStreamPayload(JSON.parse(dataStr));
              } catch {
                // ignore malformed chunk
              }
            }
          });
        }
      } catch {
        // stream reconnects on next mount / focus via polling
      }
    };

    runStream();
    return () => {
      cancelled = true;
      controller.abort();
      notifStreamAbortRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
        setCompanyDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await apiService.logoutBusiness();
    } catch {
      // ignore — still clear local session
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    setUserMenuOpen(false);
    navigate('/business/login', { replace: true });
  };

  const handleNotificationClick = async (notification) => {
    const id = notification?.id;
    const url = notification?.url || '';
    const unread = !notification?.isRead;
    try {
      if (unread && id) {
        await apiService.markBusinessNotificationRead(id);
        await refreshNotifCount();
        setNotifList((prev) =>
          (Array.isArray(prev) ? prev : []).map((n) => (
            String(n.id) === String(id) ? { ...n, isRead: true } : n
          )),
        );
      }
    } catch {
      // ignore
    }
    setNotifOpen(false);
    if (url && typeof url === 'string' && url.startsWith('/')) {
      navigate(url);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-2 lg:px-4 py-1.5 lg:py-2 flex items-center justify-between sticky top-0 z-40 h-10 lg:h-12">
      {/* Left Section - Company Selector */}
      <div className="relative" ref={companyDropdownRef}>
        <button
          type="button"
          onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
          className="flex items-center gap-1 px-1.5 lg:px-2 py-0.5 rounded-md hover:bg-gray-100 transition-colors text-gray-900 font-semibold text-[11px] lg:text-xs"
        >
          <div className="w-4 h-4 lg:w-5 lg:h-5 bg-blue-600 rounded-sm flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[8px] lg:text-[9px] font-bold">{companyInitial}</span>
          </div>
          <span className="hidden sm:inline max-w-[80px] lg:max-w-none truncate">{companyName || '—'}</span>
          <ChevronDown className="h-3 w-3 lg:h-3.5 lg:w-3.5 text-gray-500 flex-shrink-0" />
        </button>

        {companyDropdownOpen && companyName && (
          <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[160px] lg:min-w-[180px] z-50">
            <div className="p-1 space-y-0.5">
              <button
                type="button"
                className="w-full text-left px-1.5 lg:px-2 py-1 lg:py-1.5 rounded-md hover:bg-blue-50 text-[10px] lg:text-xs font-medium text-gray-900 flex items-center gap-1.5"
              >
                <div className="w-3.5 h-3.5 lg:w-4 lg:h-4 bg-blue-600 rounded-sm flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[7px] lg:text-[8px] font-bold">{companyInitial}</span>
                </div>
                <span className="truncate">{companyName}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Section - Actions & User */}
      <div className="flex items-center gap-0.5">
        <div className="relative" ref={notifPanelRef}>
          <button
            type="button"
            className="relative p-1 lg:p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            title={t.notifications}
            aria-label={t.notifications}
            aria-expanded={notifOpen}
            onClick={() => setNotifOpen((open) => !open)}
          >
            <Bell className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-gray-600" />
            {notifUnread > 0 && (
              <span className="absolute top-0 right-0 min-w-[14px] h-[14px] px-[3px] rounded-full text-[8px] lg:text-[9px] font-bold flex items-center justify-center bg-red-500 text-white">
                {notifUnread > 99 ? '99+' : notifUnread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 mt-1 w-[min(100vw-24px,360px)] max-h-[min(70vh,420px)] overflow-y-auto rounded-xl border bg-white shadow-lg z-[60]"
              style={{ borderColor: '#e5e7eb' }}
              role="menu"
            >
              <div className="px-3 py-2 border-b flex items-center justify-between gap-2" style={{ borderColor: '#f3f4f6' }}>
                <span className="text-[11px] font-bold text-gray-900">{t.notifications}</span>
                {notifUnread > 0 && (
                  <button
                    type="button"
                    className="text-[10px] font-semibold text-blue-600"
                    onClick={async () => {
                      try {
                        await apiService.markAllBusinessNotificationsRead();
                        setNotifList((prev) => (Array.isArray(prev) ? prev : []).map((n) => ({ ...n, isRead: true })));
                        await refreshNotifCount();
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    {t.markAllRead}
                  </button>
                )}
              </div>

              {notifLoading && (
                <div className="px-3 py-6 text-center text-[10px] text-gray-500">{t.loading}</div>
              )}

              {!notifLoading && (!notifList || notifList.length === 0) && (
                <div className="px-3 py-6 text-center text-[10px] text-gray-500">{t.noNotifications}</div>
              )}

              {!notifLoading && (notifList || []).map((n) => {
                const localized = localizeNotification(n, language);
                const unread = !n.isRead;
                return (
                  <button
                    key={n.id}
                    type="button"
                    className="w-full text-left px-3 py-2.5 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#f3f4f6', backgroundColor: unread ? '#f8fafc' : 'white' }}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="text-[11px] font-semibold line-clamp-2 text-gray-900">
                      {localized.title || '—'}
                    </div>
                    <div className="text-[10px] mt-0.5 line-clamp-3 text-gray-500">
                      {localized.content || ''}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          className="relative p-1 lg:p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          title={t.messages}
          onClick={() => navigate('/business/messages')}
        >
          <Mail className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-gray-600" />
        </button>

        <button
          type="button"
          className="p-1 lg:p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          title={t.help}
        >
          <HelpCircle className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-gray-600" />
        </button>

        <div className="h-5 lg:h-6 border-l border-gray-300 mx-0.5 lg:mx-1" />

        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-0.5 lg:gap-1 px-0.5 lg:px-1 py-0.5 lg:py-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            {contactName ? (
              <div className="h-6 w-6 lg:h-7 lg:w-7 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-[9px] lg:text-xs font-bold flex-shrink-0">
                {initials}
              </div>
            ) : (
              <div className="h-6 w-6 lg:h-7 lg:w-7 bg-slate-200 rounded-full flex-shrink-0" />
            )}
            <div className="text-left hidden sm:block min-w-0">
              <p className="text-[9px] lg:text-xs font-semibold text-gray-900 truncate">{contactName || '—'}</p>
              <p className="text-[8px] lg:text-[9px] text-gray-600 truncate">{contactTitle || '—'}</p>
            </div>
            <MoreVertical className="h-3 w-3 lg:h-3.5 lg:w-3.5 text-gray-500 flex-shrink-0" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[140px] lg:min-w-[160px] z-50">
              <div className="p-1 space-y-0.5">
                <div className="px-1.5 lg:px-2 py-1 lg:py-1.5 border-b border-gray-200">
                  <p className="text-[9px] lg:text-xs font-semibold text-gray-900 truncate">{contactName || '—'}</p>
                  <p className="text-[8px] lg:text-[9px] text-gray-600 truncate">{contactTitle || '—'}</p>
                </div>

                <button
                  type="button"
                  className="w-full text-left px-1.5 lg:px-2 py-1 lg:py-1.5 rounded-md hover:bg-gray-50 text-[9px] lg:text-xs text-gray-700 flex items-center gap-1"
                >
                  <Settings className="h-3 w-3 lg:h-3.5 lg:w-3.5 flex-shrink-0" />
                  <span className="truncate">{t.settings}</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-1.5 lg:px-2 py-1 lg:py-1.5 rounded-md hover:bg-gray-50 text-[9px] lg:text-xs text-red-600 flex items-center gap-1"
                >
                  <LogOut className="h-3 w-3 lg:h-3.5 lg:w-3.5 flex-shrink-0" />
                  <span className="truncate">{t.logout}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default BusinessHeader;
