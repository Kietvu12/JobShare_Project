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
import BusinessFloatingQuickActions from '../../component/Bussiness/BusinessFloatingQuickActions.jsx';
import { getBusinessServiceTag } from '../../component/Bussiness/BusinessServiceCardTag.jsx';

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

  .biz-hp-cards-grid {
    align-items: stretch;
  }
  @supports (grid-template-rows: subgrid) {
    .biz-hp-cards-grid {
      grid-template-rows: repeat(7, auto);
    }
    .biz-hp-card-subgrid {
      grid-row: span 7;
      grid-template-rows: subgrid;
      row-gap: 0.625rem;
    }
  }
  @supports not (grid-template-rows: subgrid) {
    .biz-hp-card-subgrid {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      min-height: 100%;
    }
    .biz-hp-slot-title { min-height: 2.875rem; }
    .biz-hp-slot-subtitle { min-height: 1.375rem; }
    .biz-hp-slot-desc { min-height: 4.5rem; }
    .biz-hp-slot-features { min-height: 7rem; flex: 1; }
    .biz-hp-slot-suitable { min-height: 2.75rem; }
    .biz-hp-slot-cta { margin-top: auto; }
  }
  .biz-hp-slot-title,
  .biz-hp-slot-subtitle,
  .biz-hp-slot-desc,
  .biz-hp-slot-features,
  .biz-hp-slot-suitable {
    align-self: start;
  }
  .biz-hp-slot-features ul {
    height: 100%;
  }

`;

function SolutionCard({ card, onUse, labels, animationDelay }) {
  const isOnDark = card.variant === 'primary';
  const surface = CARD_SURFACE[card.variant] || CARD_SURFACE.neutral;
  const DecoIcon = card.icon;
  const serviceTag = getBusinessServiceTag(card.tagId);
  const frameColor = serviceTag?.frameColor || '#cbd5e1';

  const bodyClass = isOnDark ? 'text-white/95' : 'text-slate-600';
  const mutedClass = isOnDark ? 'text-white/85' : 'text-slate-500';
  const ctaLabel = card.ctaLabel || labels.accessService;

  return (
    <article
      className={`biz-hp-solution-card-wrap biz-hp-solution-card biz-hp-card-subgrid ${isOnDark ? 'biz-hp-solution-card--dark' : ''} relative grid h-full w-full overflow-hidden rounded-[1.15rem] border-2 p-3 sm:p-3.5 ${surface}`}
      style={{ borderColor: frameColor, animationDelay }}
    >
      <div className="biz-hp-slot-header relative z-20 flex items-start justify-between gap-2">
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold sm:h-8 sm:w-8 sm:text-[11px] ${
            isOnDark ? 'bg-white/20 text-white' : 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-100'
          }`}
        >
          {card.num}
        </span>
        <button
          type="button"
          onClick={() => onUse(card.path)}
          className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors sm:px-2.5 sm:py-1.5 sm:text-xs ${
            isOnDark
              ? 'bg-white/15 text-white hover:bg-white/25'
              : 'bg-white text-[#0077B6] shadow-sm ring-1 ring-slate-100 hover:bg-[#e8f4fa]'
          }`}
          aria-label={labels.openCard(card.title)}
        >
          <span className="hidden min-[380px]:inline">{labels.accessService}</span>
          <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.25} />
        </button>
      </div>

      <div className="biz-hp-slot-title relative z-10 pr-12 sm:pr-14">
        <h3 className="line-clamp-2 text-base font-bold leading-tight sm:text-lg">{card.title}</h3>
      </div>

      <p
        className={`biz-hp-slot-subtitle relative z-10 line-clamp-1 text-xs font-semibold leading-snug sm:text-sm ${
          isOnDark ? 'text-white/90' : 'text-[#0077B6]'
        }`}
      >
        {card.subtitle}
      </p>

      <div className={`biz-hp-slot-desc relative z-10 space-y-1.5 text-sm leading-snug sm:text-[0.9375rem] ${mutedClass}`}>
        <p className={`font-bold leading-snug ${isOnDark ? 'text-white' : 'text-slate-800'}`}>
          {card.painPoint}
        </p>
        <p>{card.solution}</p>
      </div>

      <div
        className="pointer-events-none absolute right-0 top-8 z-0 translate-x-[16%] sm:top-9"
        aria-hidden
      >
        <DecoIcon
          className={`h-[5rem] w-[5rem] sm:h-[5.5rem] sm:w-[5.5rem] ${
            isOnDark ? 'text-white/30' : 'text-[#0077B6]/20'
          }`}
          strokeWidth={1.1}
        />
      </div>

      <div className="biz-hp-slot-features relative z-10 min-h-0">
        <ul className={`flex flex-col gap-1.5 text-sm leading-snug sm:gap-2 sm:text-[0.9375rem] ${bodyClass}`}>
          {card.features.map((line) => (
            <li key={line} className="flex gap-2">
              <Check
                className={`mt-0.5 h-4 w-4 shrink-0 ${isOnDark ? 'text-white' : 'text-[#0077B6]'}`}
                strokeWidth={2.5}
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className={`biz-hp-slot-suitable relative z-10 text-xs leading-snug sm:text-sm ${isOnDark ? 'text-white/90' : 'text-slate-600'}`}>
        <span className={`font-semibold ${isOnDark ? 'text-white' : 'text-slate-700'}`}>{labels.suitableFor}</span>
        {' '}
        {card.suitableFor}
      </p>

      <div className="biz-hp-slot-cta relative z-10">
        <button
          type="button"
          onClick={() => onUse(card.path)}
          className={`w-full rounded-lg px-3 py-2 text-xs font-bold transition-colors sm:text-sm ${
            isOnDark
              ? 'bg-white text-[#0077B6] hover:bg-white/90'
              : 'bg-[#0077B6] text-white hover:bg-[#006399]'
          }`}
        >
          {ctaLabel}
        </button>
      </div>
    </article>
  );
}

function HomepageNewsSection() {
  const { language } = useLanguage();
  const copy = useBusinessAppCopy();
  const news = useMemo(() => getHomepageNews(language), [language]);

  return (
    <section className="shrink-0 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-900 sm:text-base">{copy.homepage.newsInsights}</h2>
        <button type="button" className="shrink-0 text-xs font-semibold text-[#0077B6] sm:text-sm">
          {copy.homepage.viewAll}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-2">
        {news.map((n) => (
          <div key={n.title} className="flex gap-2.5">
            <img src={n.img} alt="" className="h-11 w-16 shrink-0 rounded-md object-cover sm:h-12 sm:w-[4.5rem]" />
            <div className="min-w-0">
              <p className="line-clamp-2 text-xs font-medium leading-relaxed text-slate-800 sm:text-sm">{n.title}</p>
              <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">{n.date}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HomepageSidebar({
  onNavigate,
  showQuickActions = true,
  showNews = true,
}) {
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
    <div className="flex h-full min-h-0 flex-col gap-3">
      {showQuickActions ? (
        <div className="shrink-0">
          <BusinessQuickActionsPanel
            actions={quickActions}
            onActionClick={(a) => {
              if (a.path) onNavigate(a.path);
            }}
          />
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-3.5">
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
        <div className="flex min-h-0 flex-1 flex-col divide-y divide-slate-100 overflow-y-auto">
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
                <div className="min-w-0 flex-1">
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

      {showNews ? (
        <div className="shrink-0 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900">{copy.homepage.newsInsights}</h2>
            <button type="button" className="shrink-0 text-xs font-semibold text-[#0077B6]">
              {copy.homepage.viewAll}
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {news.map((n) => (
              <div key={n.title} className="flex gap-2.5">
                <img src={n.img} alt="" className="h-10 w-14 shrink-0 rounded-md object-cover" />
                <div className="min-w-0">
                  <p className="line-clamp-2 text-xs font-medium leading-relaxed text-slate-800">{n.title}</p>
                  <p className="mt-1.5 text-[11px] text-slate-400">{n.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HomepageMain({ displayName, onNavigate, copy, cardLabels, solutionCards }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 sm:gap-3.5">
      <header className="shrink-0">
        <h1 className="text-xl font-bold leading-tight text-slate-900 sm:text-2xl">{copy.homepage.greeting(displayName)}</h1>
        <p className="mt-1 text-sm leading-snug text-slate-600 sm:text-base">
          {copy.homepage.subtitle}
        </p>
      </header>

      <div className="shrink-0">
        <h2 className="text-base font-bold text-slate-900 sm:text-lg">{copy.homepage.solutionsHeading}</h2>
      </div>

      <div className="biz-hp-cards-grid grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4 xl:gap-2.5">
        {solutionCards.map((card, index) => (
          <SolutionCard
            key={card.num}
            card={card}
            onUse={onNavigate}
            labels={cardLabels}
            animationDelay={`${0.06 + index * 0.1}s`}
          />
        ))}
      </div>

      <div className="flex shrink-0 flex-col gap-3 rounded-xl border border-[#0077B6]/15 bg-white px-3 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3.5">
        <p className="min-w-0 flex-1 text-sm leading-snug text-slate-700">
          <span className="font-semibold text-slate-900">{copy.homepage.consultTitle}</span>
          {' '}
          {copy.homepage.consultBody}
        </p>
        <button
          type="button"
          onClick={() => onNavigate('/business/messages?tab=ws')}
          className="shrink-0 rounded-lg bg-[#0077B6] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#0077B6]/25 transition-colors hover:bg-[#006399] sm:px-6"
        >
          {copy.homepage.consultCta}
        </button>
      </div>

      <div className="shrink-0 pb-1">
        <HomepageNewsSection />
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
      accessService: copy.homepage.accessService,
    }),
    [copy],
  );
  const displayName = contactName || companyName || 'bạn';
  const handleNavigate = useMemo(() => (path) => navigate(path), [navigate]);

  return (
    <>
      <style>{homepageStyles}</style>
      <div
        className="business-homepage-shell flex h-full min-h-0 flex-col overflow-x-hidden overflow-y-auto bg-[#f4f6f8] xl:overflow-hidden"
        style={{ fontFamily: PAGE_FONT }}
      >
        <div className="business-homepage-ui flex h-full min-h-0 w-full flex-1 flex-col p-2.5 sm:p-3">
          <div className="grid h-full min-h-0 flex-1 grid-cols-1 items-stretch gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(220px,252px)] xl:gap-3.5 xl:overflow-hidden">
            <div className="business-homepage-scroll scrollbar-hide flex min-h-0 flex-col overflow-y-auto xl:h-full xl:pr-0.5">
              <HomepageMain
                displayName={displayName}
                onNavigate={handleNavigate}
                copy={copy}
                cardLabels={cardLabels}
                solutionCards={solutionCards}
              />
            </div>

            <div className="flex h-full min-h-0 flex-col gap-2.5 xl:gap-3">
              <div className="business-homepage-scroll scrollbar-hide min-h-0 flex-1 overflow-y-auto xl:pr-0.5">
                <HomepageSidebar
                  onNavigate={handleNavigate}
                  showQuickActions={false}
                  showNews={false}
                />
              </div>
              <div className="hidden shrink-0 xl:block">
                <BusinessFloatingQuickActions onNavigate={handleNavigate} placement="sidebar" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="xl:hidden">
        <BusinessFloatingQuickActions onNavigate={handleNavigate} placement="fixed" />
      </div>
    </>
  );
};

export { HomepageSidebar };
export default Homepage;
