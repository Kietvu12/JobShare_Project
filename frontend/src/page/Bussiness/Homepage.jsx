import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  UserPlus,
  ArrowUpRight,
  Users2,
  Coins,
  Check,
  Loader2,
} from 'lucide-react';
import useBusinessUser from '../../hooks/useBusinessUser';
import { useLanguage } from '../../context/LanguageContext';
import useBusinessAppCopy from '../../hooks/useBusinessAppCopy';
import useBusinessKnowledgePostList from '../../hooks/useBusinessKnowledgePostList';
import { getHomepageSolutionCards } from '../../i18n/businessAppI18n';
import { getKnowledgeHubCopy } from '../../i18n/businessApp/knowledgeHub.js';
import { knowledgePostDisplay } from '../../utils/businessKnowledgePostUi';
import BusinessQuickActionsPanel, { getDefaultBusinessQuickActions } from '../../component/Bussiness/BusinessQuickActionsPanel.jsx';
import BusinessQuickActionsPageLayout from '../../component/Bussiness/BusinessQuickActionsPageLayout.jsx';
import BusinessNotificationsPanel from '../../component/Bussiness/BusinessNotificationsPanel.jsx';
import { getBusinessServiceTag } from '../../component/Bussiness/BusinessServiceCardTag.jsx';

const PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif";

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

  const openService = () => onUse(card.path);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openService}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openService();
        }
      }}
      className={`biz-hp-solution-card-wrap biz-hp-solution-card biz-hp-card-subgrid ${isOnDark ? 'biz-hp-solution-card--dark' : ''} relative grid h-full w-full cursor-pointer overflow-hidden rounded-[1.15rem] border-2 p-3 text-left sm:p-3.5 ${surface}`}
      style={{ borderColor: frameColor, animationDelay }}
      aria-label={labels.openCard(card.title)}
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
          onClick={(e) => {
            e.stopPropagation();
            openService();
          }}
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
          onClick={(e) => {
            e.stopPropagation();
            openService();
          }}
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

function HomepageNewsItem({ post, language, onOpen, compact = false }) {
  const { title, category, date, image } = knowledgePostDisplay(post, language);
  const thumbBoxClass = compact
    ? 'h-10 w-14 shrink-0'
    : 'h-11 w-16 shrink-0 sm:h-12 sm:w-[4.5rem]';

  return (
    <button
      type="button"
      onClick={() => onOpen(post)}
      className="flex w-full gap-2.5 rounded-lg text-left transition-colors hover:bg-slate-50/80"
    >
      <div className={`overflow-hidden rounded-md bg-slate-100 ${thumbBoxClass}`}>
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px] text-slate-400">
            KB
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {category && !compact ? (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#0077B6]">{category}</span>
        ) : null}
        <p className={`line-clamp-2 font-medium leading-relaxed text-slate-800 ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
          {title}
        </p>
        {date ? (
          <p className={`mt-1 text-slate-400 ${compact ? 'mt-1.5 text-[11px]' : 'text-[11px] sm:text-xs'}`}>{date}</p>
        ) : null}
      </div>
    </button>
  );
}

function HomepageNewsPanel({ layout = 'grid', limit = 4, headingClassName = '' }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const copy = useBusinessAppCopy();
  const hubCopy = useMemo(() => getKnowledgeHubCopy(language), [language]);
  const { posts, loading } = useBusinessKnowledgePostList(limit);

  const openPost = useCallback((post) => {
    const path = knowledgePostDisplay(post, language).path;
    if (path) navigate(path);
  }, [navigate, language]);

  const goHub = () => navigate('/business/knowledge');

  const body = loading ? (
    <div className="flex items-center justify-center gap-2 py-6 text-[11px] text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin text-[#0077B6]" aria-hidden />
      {copy.common.loading}
    </div>
  ) : posts.length === 0 ? (
    <p className="py-4 text-center text-[11px] text-slate-400 sm:text-xs">{hubCopy.noPosts}</p>
  ) : (
    <div
      className={
        layout === 'grid'
          ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-2'
          : 'flex flex-col gap-3'
      }
    >
      {posts.map((post) => (
        <HomepageNewsItem
          key={post.id || post.slug}
          post={post}
          language={language}
          onOpen={openPost}
          compact={layout === 'stack'}
        />
      ))}
    </div>
  );

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className={`font-bold text-slate-900 ${headingClassName || 'text-sm sm:text-base'}`}>
          {copy.homepage.newsInsights}
        </h2>
        <button
          type="button"
          onClick={goHub}
          className="shrink-0 text-xs font-semibold text-[#0077B6] hover:underline sm:text-sm"
        >
          {copy.homepage.viewAll}
        </button>
      </div>
      {body}
    </>
  );
}

function HomepageNewsSection() {
  return (
    <section className="shrink-0 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4">
      <HomepageNewsPanel layout="grid" limit={4} />
    </section>
  );
}

function HomepageSidebar({
  onNavigate,
  showQuickActions = true,
  showNews = true,
  showNotifications = true,
}) {
  const { language } = useLanguage();
  const quickActions = useMemo(() => getDefaultBusinessQuickActions(language), [language]);

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

      {showNotifications ? (
        <BusinessNotificationsPanel onNavigate={onNavigate} className="min-h-0 flex-1" />
      ) : null}

      {showNews ? (
        <div className="shrink-0 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
          <HomepageNewsPanel layout="stack" limit={3} headingClassName="text-sm" />
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
          <BusinessQuickActionsPageLayout onNavigate={handleNavigate}>
            <HomepageMain
              displayName={displayName}
              onNavigate={handleNavigate}
              copy={copy}
              cardLabels={cardLabels}
              solutionCards={solutionCards}
            />
          </BusinessQuickActionsPageLayout>
        </div>
      </div>
    </>
  );
};

export { HomepageSidebar };
export default Homepage;
