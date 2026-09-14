import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import useBusinessAppCopy from '../../hooks/useBusinessAppCopy';
import { formatBusinessRelativeTime } from '../../i18n/businessAppI18n';
import { localizeNotification } from '../../utils/notificationI18n';
import apiService from '../../services/api';

function getNotificationTimestamp(notification) {
  return notification?.createdAt || notification?.created_at || null;
}

function formatNotificationRelativeTime(ts, language = 'vi') {
  return formatBusinessRelativeTime(ts, language);
}

function getNotificationVisual(notification, localized) {
  const text = `${localized?.title || ''} ${localized?.content || ''}`.toLowerCase();
  const isWarn = /cảnh báo|chưa có|từ chối|reject|warning|lỗi|hết credit|sắp hết/.test(text);
  const unread = !notification?.isRead;
  return {
    warn: isWarn,
    dot: unread ? 'bg-[#0077B6]' : 'bg-slate-400',
  };
}

const NOTIF_SCROLL_HIDE = `
  .biz-notif-panel-scroll::-webkit-scrollbar { display: none; }
  .biz-notif-panel-scroll { -ms-overflow-style: none; scrollbar-width: none; }
`;

/**
 * Khối thông báo cột phải — dùng Homepage, Scout, Ứng viên, Sàn CTV, …
 */
export default function BusinessNotificationsPanel({ onNavigate, className = '' }) {
  const { language } = useLanguage();
  const copy = useBusinessAppCopy();
  const [notifList, setNotifList] = useState([]);
  const [notifUnread, setNotifUnread] = useState(0);
  const [notifLoading, setNotifLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const [res, count] = await Promise.all([
        apiService.getBusinessNotifications({ page: 1, limit: 4 }),
        apiService.getBusinessNotificationUnreadCount(),
      ]);
      const rows = res?.data?.notifications ?? res?.notifications ?? [];
      setNotifList(Array.isArray(rows) ? rows.slice(0, 4) : []);
      setNotifUnread(typeof count === 'number' ? count : 0);
    } catch {
      setNotifList([]);
      setNotifUnread(0);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const onUpdate = () => loadNotifications();
    window.addEventListener('notifications:updated', onUpdate);
    window.addEventListener('focus', onUpdate);
    return () => {
      window.removeEventListener('notifications:updated', onUpdate);
      window.removeEventListener('focus', onUpdate);
    };
  }, [loadNotifications]);

  const handleNotificationClick = async (notification) => {
    const id = notification?.id;
    const url = notification?.url || '';
    const unread = !notification?.isRead;
    try {
      if (unread && id) {
        await apiService.markBusinessNotificationRead(id);
        setNotifList((prev) =>
          (Array.isArray(prev) ? prev : []).map((n) => (
            String(n.id) === String(id) ? { ...n, isRead: true } : n
          )),
        );
        setNotifUnread((prev) => Math.max(0, prev - 1));
        window.dispatchEvent(new Event('notifications:updated'));
      }
    } catch {
      // ignore
    }
    if (url && typeof url === 'string' && url.startsWith('/') && onNavigate) {
      onNavigate(url);
    }
  };

  return (
    <>
      <style>{NOTIF_SCROLL_HIDE}</style>
    <div
      className={`flex min-h-[12rem] flex-1 flex-col rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:min-h-[14rem] sm:p-3.5 ${className}`}
    >
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          {copy.homepage.notifications}
          {notifUnread > 0 ? (
            <span className="rounded-full bg-[#0077B6] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {notifUnread > 99 ? '99+' : notifUnread}
            </span>
          ) : null}
        </h2>
        <button
          type="button"
          className="shrink-0 text-xs font-semibold text-[#0077B6]"
          onClick={() => window.dispatchEvent(new CustomEvent('business-notifications:open'))}
        >
          {copy.homepage.viewAll}
        </button>
      </div>
      <div className="biz-notif-panel-scroll flex min-h-0 flex-1 flex-col divide-y divide-slate-100 overflow-y-auto">
        {notifLoading ? (
          <div className="flex items-center justify-center py-6 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : notifList.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">{copy.homepage.noNotifications}</p>
        ) : notifList.map((n) => {
          const localized = localizeNotification(n, language);
          const visual = getNotificationVisual(n, localized);
          const displayText = localized.title || localized.content || '—';
          const timeLabel = formatNotificationRelativeTime(getNotificationTimestamp(n), language);
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => handleNotificationClick(n)}
              className={`flex w-full items-start gap-2.5 py-3 text-left first:pt-0 last:pb-0 transition-colors hover:bg-slate-50/80 ${!n.isRead ? 'bg-[#f8fbfd]/60' : ''}`}
            >
              {visual.warn ? (
                <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-rose-500" />
              ) : (
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${visual.dot}`} />
              )}
              <div className="min-h-0 flex-1">
                <p className="line-clamp-2 text-xs leading-relaxed text-slate-700 sm:text-sm">{displayText}</p>
                {timeLabel ? (
                  <p className="mt-1.5 text-[11px] leading-none text-slate-400 sm:text-xs">{timeLabel}</p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
    </>
  );
}
