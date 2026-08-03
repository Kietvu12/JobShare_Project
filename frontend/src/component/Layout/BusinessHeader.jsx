import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Bell, Mail, HelpCircle, MoreVertical, LogOut, Settings, Coins, Menu, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { localizeNotification } from '../../utils/notificationI18n';
import { getBusinessPageMeta } from '../../utils/businessPageMeta';
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
    credit: 'Credit',
    creditTitle: 'Credit hiện tại — xem thanh toán',
    openMenu: 'Mở menu',
    closeMenu: 'Đóng menu',
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
    credit: 'Credit',
    creditTitle: 'Current credit — view billing',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
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
    credit: 'クレジット',
    creditTitle: '現在のクレジット — 請求を見る',
    openMenu: 'メニューを開く',
    closeMenu: 'メニューを閉じる',
  },
};

const BusinessHeader = ({ businessUser, onMenuToggle, mobileNavOpen = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const t = I18N[language] || I18N.vi;
  const pageMeta = useMemo(
    () => getBusinessPageMeta(location.pathname, language),
    [location.pathname, language],
  );
  const PageIcon = pageMeta.icon;
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifUnread, setNotifUnread] = useState(0);
  const [notifList, setNotifList] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [credit, setCredit] = useState(() => Number(businessUser?.credit) || 0);
  const companyDropdownRef = useRef(null);
  const mobileUserMenuRef = useRef(null);
  const desktopUserMenuRef = useRef(null);
  const notifPanelRef = useRef(null);
  const mobileNotifPanelRef = useRef(null);
  const notifStreamAbortRef = useRef(null);

  const {
    companyName = '',
    contactName = '',
    contactTitle = '',
    initials = 'B',
    companyInitial = 'B',
  } = businessUser || {};

  const refreshCredit = useCallback(async () => {
    try {
      const res = await apiService.getBusinessCredit();
      const next = Number(res?.data?.credit ?? res?.credit);
      if (Number.isFinite(next)) setCredit(next);
    } catch {
      // giữ số đang có / từ profile
    }
  }, []);

  useEffect(() => {
    const fromProfile = Number(businessUser?.credit);
    if (Number.isFinite(fromProfile)) setCredit(fromProfile);
  }, [businessUser?.credit]);

  useEffect(() => {
    refreshCredit();
    const timer = setInterval(refreshCredit, 60000);
    const onFocus = () => refreshCredit();
    const onCreditUpdate = () => refreshCredit();
    window.addEventListener('focus', onFocus);
    window.addEventListener('business-credit:updated', onCreditUpdate);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('business-credit:updated', onCreditUpdate);
    };
  }, [refreshCredit]);

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
    const onOpenPanel = () => setNotifOpen(true);
    window.addEventListener('focus', onFocus);
    window.addEventListener('notifications:updated', onExternalUpdate);
    window.addEventListener('business-notifications:open', onOpenPanel);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('notifications:updated', onExternalUpdate);
      window.removeEventListener('business-notifications:open', onOpenPanel);
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
      const inDesktopNotif = notifPanelRef.current?.contains(e.target);
      const inMobileNotif = mobileNotifPanelRef.current?.contains(e.target);
      if (!inDesktopNotif && !inMobileNotif) setNotifOpen(false);
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
      const inMobileUserMenu = mobileUserMenuRef.current?.contains(event.target);
      const inDesktopUserMenu = desktopUserMenuRef.current?.contains(event.target);
      if (!inMobileUserMenu && !inDesktopUserMenu) {
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

  const userMenuPanel = userMenuOpen && (
    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[180px] lg:min-w-[160px] z-50">
      <div className="p-1 space-y-0.5">
        <div className="px-2 py-1.5 border-b border-gray-200">
          <p className="text-[11px] lg:text-[10px] font-semibold text-gray-900 truncate">{contactName || '—'}</p>
          <p className="text-[10px] lg:text-[8px] text-gray-600 truncate">{contactTitle || '—'}</p>
        </div>

        <button
          type="button"
          onClick={() => { setUserMenuOpen(false); navigate('/business/billing'); }}
          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-amber-50 text-[11px] lg:text-[10px] text-amber-700 flex items-center gap-2 lg:hidden"
        >
          <Coins className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{t.credit}: {Number(credit || 0).toLocaleString()}</span>
        </button>

        <button
          type="button"
          onClick={() => { setUserMenuOpen(false); setNotifOpen(true); }}
          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-gray-50 text-[11px] lg:text-[10px] text-gray-700 flex items-center gap-2 lg:hidden"
        >
          <Bell className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{t.notifications}{notifUnread > 0 ? ` (${notifUnread})` : ''}</span>
        </button>

        <button
          type="button"
          onClick={() => { setUserMenuOpen(false); navigate('/business/messages'); }}
          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-gray-50 text-[11px] lg:text-[10px] text-gray-700 flex items-center gap-2 lg:hidden"
        >
          <Mail className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{t.messages}</span>
        </button>

        <button
          type="button"
          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-gray-50 text-[11px] lg:text-[10px] text-gray-700 flex items-center gap-2"
        >
          <Settings className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{t.settings}</span>
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-gray-50 text-[11px] lg:text-[10px] text-red-600 flex items-center gap-2"
        >
          <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{t.logout}</span>
        </button>
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b-0 bg-transparent lg:border-b lg:border-gray-200 lg:bg-white">
      {/* Mobile header — menu | title | avatar */}
      <div className="flex h-12 items-center justify-between gap-2 px-3 lg:hidden">
        <button
          type="button"
          onClick={onMenuToggle}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#0077B6] transition-colors hover:bg-[#e8f4fa]"
          aria-label={mobileNavOpen ? t.closeMenu : t.openMenu}
          aria-expanded={mobileNavOpen}
        >
          {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 px-1">
          <PageIcon className="h-4 w-4 shrink-0 text-[#0077B6]" strokeWidth={2.25} />
          <span className="truncate text-sm font-semibold text-[#0077B6]">{pageMeta.title}</span>
        </div>

        <div className="relative shrink-0" ref={mobileUserMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
            aria-label={contactName || 'User menu'}
          >
            {contactName ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-[10px] font-bold text-white">
                {initials}
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-slate-200" />
            )}
          </button>
          {userMenuPanel}
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden h-10 items-center justify-between gap-2 px-3 lg:flex">
        <div className="relative min-w-0" ref={companyDropdownRef}>
          <button
            type="button"
            onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
            className="flex max-w-full items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-gray-900 transition-colors hover:bg-gray-100"
          >
            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-blue-600">
              <span className="text-[8px] font-bold text-white">{companyInitial}</span>
            </div>
            <span className="max-w-none truncate">{companyName || '—'}</span>
            <ChevronDown className="h-3 w-3 shrink-0 text-gray-500" />
          </button>

          {companyDropdownOpen && companyName && (
            <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-gray-200 bg-white shadow-lg">
              <div className="space-y-0.5 p-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-[10px] font-medium text-gray-900 hover:bg-blue-50"
                >
                  <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm bg-blue-600">
                    <span className="text-[7px] font-bold text-white">{companyInitial}</span>
                  </div>
                  <span className="truncate">{companyName}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => navigate('/business/billing')}
          className="flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-amber-50 transition-colors border border-transparent hover:border-amber-200 sm:px-2 lg:py-1"
          title={t.creditTitle}
          aria-label={`${t.credit}: ${credit}`}
        >
          <Coins className="h-3 w-3 lg:h-3.5 lg:w-3.5 text-amber-500 flex-shrink-0" />
          <span className="text-[10px] sm:text-[10px] lg:text-[10px] font-bold text-amber-700 tabular-nums">
            {Number(credit || 0).toLocaleString()}
          </span>
          <span className="hidden sm:inline text-[8px] lg:text-[9px] font-medium text-amber-600/80">
            {t.credit}
          </span>
        </button>

        <div className="h-4 lg:h-5 border-l border-gray-300 mx-0.5 lg:mx-1" />

        <div className="relative" ref={notifPanelRef}>
          <button
            type="button"
            className="relative p-1.5 rounded-md hover:bg-gray-100 transition-colors sm:p-1 lg:p-1.5"
            title={t.notifications}
            aria-label={t.notifications}
            aria-expanded={notifOpen}
            onClick={() => setNotifOpen((open) => !open)}
          >
            <Bell className="h-3 w-3 lg:h-3.5 lg:w-3.5 text-gray-600" />
            {notifUnread > 0 && (
              <span className="absolute top-0 right-0 min-w-[12px] h-3 px-[2px] rounded-full text-[7px] lg:text-[8px] font-bold flex items-center justify-center bg-red-500 text-white">
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
              <div className="px-2.5 py-1.5 border-b flex items-center justify-between gap-2" style={{ borderColor: '#f3f4f6' }}>
                <span className="text-[10px] font-bold text-gray-900">{t.notifications}</span>
                {notifUnread > 0 && (
                  <button
                    type="button"
                    className="text-[9px] font-semibold text-blue-600"
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
                <div className="px-2.5 py-5 text-center text-[9px] text-gray-500">{t.loading}</div>
              )}

              {!notifLoading && (!notifList || notifList.length === 0) && (
                <div className="px-2.5 py-5 text-center text-[9px] text-gray-500">{t.noNotifications}</div>
              )}

              {!notifLoading && (notifList || []).map((n) => {
                const localized = localizeNotification(n, language);
                const unread = !n.isRead;
                return (
                  <button
                    key={n.id}
                    type="button"
                    className="w-full text-left px-2.5 py-2 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#f3f4f6', backgroundColor: unread ? '#f8fafc' : 'white' }}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="text-[10px] font-semibold line-clamp-2 text-gray-900">
                      {localized.title || '—'}
                    </div>
                    <div className="text-[9px] mt-0.5 line-clamp-3 text-gray-500">
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
          className="relative p-1.5 rounded-md hover:bg-gray-100 transition-colors sm:p-1 lg:p-1.5"
          title={t.messages}
          onClick={() => navigate('/business/messages')}
        >
          <Mail className="h-4 w-4 lg:h-3.5 lg:w-3.5 text-gray-600" />
        </button>

        <button
          type="button"
          className="hidden p-1.5 rounded-md hover:bg-gray-100 transition-colors sm:inline-flex lg:p-1.5"
          title={t.help}
        >
          <HelpCircle className="h-3 w-3 lg:h-3.5 lg:w-3.5 text-gray-600" />
        </button>

        <div className="h-4 lg:h-5 border-l border-gray-300 mx-0.5 lg:mx-1" />

        <div className="relative" ref={desktopUserMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-1 rounded-md px-1 py-1 transition-colors hover:bg-gray-100"
          >
            {contactName ? (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-[9px] font-bold text-white">
                {initials}
              </div>
            ) : (
              <div className="h-6 w-6 shrink-0 rounded-full bg-slate-200" />
            )}
            <div className="min-w-0 text-left">
              <p className="truncate text-[10px] font-semibold text-gray-900">{contactName || '—'}</p>
              <p className="truncate text-[8px] text-gray-600">{contactTitle || '—'}</p>
            </div>
            <MoreVertical className="h-3 w-3 shrink-0 text-gray-500" />
          </button>

          {userMenuPanel}
        </div>
        </div>
      </div>

      {/* Mobile notification panel — anchored below header */}
      {notifOpen && (
        <div className="relative lg:hidden" ref={mobileNotifPanelRef}>
          <div
            className="absolute right-3 top-0 z-[60] w-[min(calc(100vw-24px),360px)] max-h-[min(70vh,420px)] overflow-y-auto rounded-xl border bg-white shadow-lg"
            style={{ borderColor: '#e5e7eb' }}
            role="menu"
          >
            <div className="flex items-center justify-between gap-2 border-b px-3 py-2" style={{ borderColor: '#f3f4f6' }}>
              <span className="text-xs font-bold text-gray-900">{t.notifications}</span>
              <button type="button" onClick={() => setNotifOpen(false)} className="text-[10px] font-semibold text-slate-500">
                {t.closeMenu}
              </button>
            </div>
            {notifLoading && (
              <div className="px-3 py-5 text-center text-[10px] text-gray-500">{t.loading}</div>
            )}
            {!notifLoading && (!notifList || notifList.length === 0) && (
              <div className="px-3 py-5 text-center text-[10px] text-gray-500">{t.noNotifications}</div>
            )}
            {!notifLoading && (notifList || []).map((n) => {
              const localized = localizeNotification(n, language);
              const unread = !n.isRead;
              return (
                <button
                  key={n.id}
                  type="button"
                  className="w-full border-b px-3 py-2.5 text-left last:border-b-0 hover:bg-gray-50"
                  style={{ borderColor: '#f3f4f6', backgroundColor: unread ? '#f8fafc' : 'white' }}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="line-clamp-2 text-[11px] font-semibold text-gray-900">{localized.title || '—'}</div>
                  <div className="mt-0.5 line-clamp-3 text-[10px] text-gray-500">{localized.content || ''}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

export default BusinessHeader;
