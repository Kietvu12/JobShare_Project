import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  UserPlus,
  AlertTriangle,
  ArrowUpRight,
  Users2,
  Coins,
  Check,
  Loader2,
} from 'lucide-react';
import useBusinessUser from '../../hooks/useBusinessUser';
import { useLanguage } from '../../context/LanguageContext';
import useBusinessAppCopy from '../../hooks/useBusinessAppCopy';
import {
  formatBusinessRelativeTime,
  getHomepageNews,
  getHomepageSolutionCards,
} from '../../i18n/businessAppI18n';
import { localizeNotification } from '../../utils/notificationI18n';
import apiService from '../../services/api';
import BusinessQuickActionsPanel, { getDefaultBusinessQuickActions } from '../../component/Bussiness/BusinessQuickActionsPanel.jsx';
import BusinessServiceCardTag, { getBusinessServiceTag } from '../../component/Bussiness/BusinessServiceCardTag.jsx';

const PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif";

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

const SOLUTION_CARD_ICONS = {
  'direct-scout': Coins,
  'managed-scout': UserPlus,
  'employer-branding': Sparkles,
  'hr-partner-network': Users2,
};

const CARD_SURFACE = {
  brandLight: 'bg-[#e8f4fa] text-slate-900',
  neutral: 'bg-white text-slate-900',
  primary: 'bg-[#0077B6] text-white shadow-sm shadow-[#0077B6]/15',
};

const homepageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  .business-homepage-scroll::-webkit-scrollbar { width: 4px; }
  .business-homepage-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

  .business-homepage-shell { --hp-zoom: 1; }
  @media (min-width: 1024px) and (max-width: 1279px) {
    .business-homepage-shell { --hp-zoom: 0.9; }
  }
  @media (min-width: 1280px) and (max-width: 1535px) {
    .business-homepage-shell { --hp-zoom: 0.86; }
  }
  @media (min-width: 1024px) and (max-height: 760px) {
    .business-homepage-shell { --hp-zoom: 0.78; }
  }
  @media (min-width: 1024px) and (min-height: 761px) and (max-height: 860px) {
    .business-homepage-shell { --hp-zoom: 0.84; }
  }
  @media (min-width: 1536px) and (min-height: 861px) {
    .business-homepage-shell { --hp-zoom: 0.94; }
  }
  @media (min-width: 1920px) and (min-height: 900px) {
    .business-homepage-shell { --hp-zoom: 1; }
  }
  .business-homepage-ui { zoom: var(--hp-zoom); }
  @supports not (zoom: 1) {
    .business-homepage-ui {
      transform: scale(var(--hp-zoom));
      transform-origin: top left;
      width: calc(100% / var(--hp-zoom));
    }
  }

  @keyframes biz-hp-card-slide-in {
    from {
      opacity: 0;
      transform: translateY(28px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .biz-hp-solution-card-wrap {
    height: 100%;
    animation: biz-hp-card-slide-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  }
  .biz-hp-solution-card {
    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.28s ease;
    will-change: transform;
  }
  .biz-hp-solution-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 32px -12px rgba(0, 119, 182, 0.35);
  }
  .biz-hp-solution-card.biz-hp-solution-card--dark:hover {
    box-shadow: 0 16px 32px -12px rgba(0, 60, 100, 0.45);
  }
  @media (prefers-reduced-motion: reduce) {
    .biz-hp-solution-card-wrap {
      animation: none;
    }
    .biz-hp-solution-card {
      transition: none;
    }
    .biz-hp-solution-card:hover {
      transform: none;
    }
  }
`;

function SolutionCard({ card, onUse, labels }) {
  const isOnDark = card.variant === 'primary';
  const surface = CARD_SURFACE[card.variant] || CARD_SURFACE.neutral;
  const DecoIcon = card.icon;
  const serviceTag = getBusinessServiceTag(card.tagId);
  const frameColor = serviceTag?.frameColor || '#cbd5e1';

  const bodyClass = isOnDark ? 'text-white/95' : 'text-slate-600';
  const mutedClass = isOnDark ? 'text-white/85' : 'text-slate-500';

  return (
    <article
      className={`biz-hp-solution-card ${isOnDark ? 'biz-hp-solution-card--dark' : ''} relative grid h-full min-h-[320px] grid-rows-[2rem_auto_minmax(0,1fr)_auto] overflow-hidden rounded-[1.25rem] border-2 p-3.5 sm:p-4 ${surface}`}
      style={{ borderColor: frameColor }}
    >
      <div className="relative z-20 flex items-start justify-between gap-2">
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${
            isOnDark ? 'bg-white/20 text-white' : 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-100'
          }`}
        >
          {card.num}
        </span>
        <button
          type="button"
          onClick={() => onUse(card.path)}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
            isOnDark
              ? 'bg-white/15 text-white hover:bg-white/25'
              : 'bg-white text-slate-600 shadow-sm ring-1 ring-slate-100 hover:text-[#0077B6]'
          }`}
          aria-label={labels.openCard(card.title)}
        >
          <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <div className="relative z-10 mt-4 pr-14 sm:mt-5">
        <h3 className="line-clamp-2 text-base font-bold leading-tight sm:text-lg">{card.title}</h3>
        <p className={`mt-2 text-xs font-bold leading-snug sm:text-[13px] ${isOnDark ? 'text-white' : 'text-slate-800'}`}>
          {card.painPoint}
        </p>
        <p className={`mt-1.5 text-[11px] leading-snug sm:text-xs ${mutedClass}`}>
          {card.solution}
        </p>
      </div>

      <div
        className="pointer-events-none absolute right-0 top-[4.5rem] z-0 translate-x-[18%] sm:top-[5rem]"
        aria-hidden
      >
        <DecoIcon
          className={`h-[6.5rem] w-[6.5rem] sm:h-28 sm:w-28 ${
            isOnDark ? 'text-white/30' : 'text-[#0077B6]/22'
          }`}
          strokeWidth={1.1}
        />
      </div>

      <div className="relative z-10 mt-5 flex min-h-0 flex-col sm:mt-6">
        <ul className={`flex min-h-0 flex-1 flex-col gap-2 text-[11px] leading-snug sm:text-xs ${bodyClass}`}>
          {card.features.map((line) => (
            <li key={line} className="flex gap-2">
              <Check
                className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isOnDark ? 'text-white' : 'text-[#0077B6]'}`}
                strokeWidth={2.5}
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="relative z-10 mt-3 shrink-0 border-t pt-3"
        style={{ borderColor: `${frameColor}66` }}
      >
        <p className={`text-[10px] leading-snug sm:text-[11px] ${isOnDark ? 'text-white/90' : 'text-slate-600'}`}>
          <span className={`font-semibold ${isOnDark ? 'text-white' : 'text-slate-700'}`}>{labels.suitableFor}</span>
          {' '}
          {card.suitableFor}
        </p>
        <BusinessServiceCardTag tag={serviceTag} isOnDark={isOnDark} className="mt-2.5" />
      </div>
    </article>
  );
}

function HomepageSidebar({ onNavigate }) {
  const { language } = useLanguage();
  const copy = useBusinessAppCopy();
  const news = useMemo(() => getHomepageNews(language), [language]);
  const quickActions = useMemo(() => getDefaultBusinessQuickActions(language), [language]);
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
    if (url && typeof url === 'string' && url.startsWith('/')) {
      onNavigate(url);
    }
  };

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <BusinessQuickActionsPanel
        actions={quickActions}
        onActionClick={(a) => {
          if (a.path) onNavigate(a.path);
        }}
      />

      <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xs font-bold text-slate-900">
            {copy.homepage.notifications}
            {notifUnread > 0 ? (
              <span className="rounded-full bg-[#0077B6] px-1.5 py-0.5 text-[9px] font-bold text-white">
                {notifUnread > 99 ? '99+' : notifUnread}
              </span>
            ) : null}
          </h2>
          <button
            type="button"
            className="shrink-0 text-[10px] font-semibold text-[#0077B6]"
            onClick={() => window.dispatchEvent(new CustomEvent('business-notifications:open'))}
          >
            {copy.homepage.viewAll}
          </button>
        </div>
        <div className="flex flex-col divide-y divide-slate-100">
          {notifLoading ? (
            <div className="flex items-center justify-center py-6 text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : notifList.length === 0 ? (
            <p className="py-6 text-center text-[10px] text-slate-400">{copy.homepage.noNotifications}</p>
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
                  <AlertTriangle className="mt-1 h-3.5 w-3.5 shrink-0 text-rose-500" />
                ) : (
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${visual.dot}`} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-700">{displayText}</p>
                  {timeLabel ? (
                    <p className="mt-1.5 text-[10px] leading-none text-slate-400">{timeLabel}</p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-xs font-bold text-slate-900">{copy.homepage.newsInsights}</h2>
          <button type="button" className="shrink-0 text-[10px] font-semibold text-[#0077B6]">
            {copy.homepage.viewAll}
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {news.map((n) => (
            <div key={n.title} className="flex gap-2.5">
              <img src={n.img} alt="" className="h-10 w-14 shrink-0 rounded-md object-cover" />
              <div className="min-w-0">
                <p className="line-clamp-2 text-[11px] font-medium leading-relaxed text-slate-800">{n.title}</p>
                <p className="mt-1.5 text-[10px] text-slate-400">{n.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomepageMain({ displayName, onNavigate, copy, cardLabels, solutionCards }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <header className="shrink-0">
        <h1 className="text-lg font-bold leading-tight text-slate-900 sm:text-xl">{copy.homepage.greeting(displayName)}</h1>
        <p className="mt-1 text-xs leading-snug text-slate-600 sm:text-sm">
          {copy.homepage.subtitle}
        </p>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-2 sm:grid-cols-2 xl:grid-cols-4 xl:items-stretch">
        {solutionCards.map((card, index) => (
          <div
            key={card.num}
            className="biz-hp-solution-card-wrap"
            style={{ animationDelay: `${0.06 + index * 0.1}s` }}
          >
            <SolutionCard card={card} onUse={onNavigate} labels={cardLabels} />
          </div>
        ))}
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 flex-1 text-xs leading-snug text-slate-700">
          <span className="font-semibold text-slate-900">{copy.homepage.consultTitle}</span>
          {' '}
          {copy.homepage.consultBody}
        </p>
        <button
          type="button"
          onClick={() => onNavigate('/business/messages?tab=ws')}
          className="shrink-0 rounded-lg bg-[#0077B6] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#006399]"
        >
          {copy.homepage.consultCta}
        </button>
      </div>
    </div>
  );
}

const Homepage = () => {
  const navigate = useNavigate();
  const { contactName, companyName } = useBusinessUser();
  const { language } = useLanguage();
  const copy = useBusinessAppCopy();
  const solutionCards = useMemo(
    () => getHomepageSolutionCards(language).map((card) => ({
      ...card,
      icon: SOLUTION_CARD_ICONS[card.tagId] || Coins,
    })),
    [language],
  );
  const cardLabels = useMemo(
    () => ({
      suitableFor: copy.homepage.suitableFor,
      openCard: copy.homepage.openCard,
    }),
    [copy],
  );
  const displayName = contactName || companyName || 'bạn';
  const handleNavigate = useMemo(() => (path) => navigate(path), [navigate]);

  return (
    <>
      <style>{homepageStyles}</style>
      <div
        className="business-homepage-shell min-h-0 overflow-x-hidden bg-[#f4f6f8] xl:h-full xl:overflow-hidden"
        style={{ fontFamily: PAGE_FONT }}
      >
        <div className="business-homepage-ui w-full min-h-0 p-2.5 sm:p-3 xl:h-full xl:flex xl:flex-col">
          <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-2.5 xl:h-full xl:grid-cols-[minmax(0,1fr)_minmax(196px,228px)] xl:gap-3 xl:overflow-hidden">
            <div className="business-homepage-scroll scrollbar-hide flex min-h-0 flex-col xl:h-full xl:overflow-y-auto xl:pr-0.5">
              <HomepageMain
                displayName={displayName}
                onNavigate={handleNavigate}
                copy={copy}
                cardLabels={cardLabels}
                solutionCards={solutionCards}
              />
            </div>

            <div className="business-homepage-scroll scrollbar-hide min-h-0 xl:h-full xl:overflow-y-auto xl:pr-0.5">
              <HomepageSidebar onNavigate={handleNavigate} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export { HomepageSidebar };
export default Homepage;
