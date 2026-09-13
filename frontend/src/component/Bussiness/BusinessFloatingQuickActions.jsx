import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, MessageSquare, Plus, Zap } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getBusinessAppCopy } from '../../i18n/businessAppI18n';

function getHomepageFloatingActions(language) {
  const qa = getBusinessAppCopy(language).quickActions;
  return [
    {
      id: 'create-jd',
      icon: Plus,
      title: qa.createJd.title,
      path: '/business/jobs/create',
    },
    {
      id: 'ws-support',
      icon: MessageSquare,
      title: qa.wsSupport.title,
      path: '/business/messages?tab=ws',
    },
  ];
}

/**
 * @param {'sidebar' | 'fixed'} placement — sidebar: neo dưới cột phải dashboard; fixed: góc màn hình (mobile)
 */
export default function BusinessFloatingQuickActions({ onNavigate, placement = 'fixed' }) {
  const { language } = useLanguage();
  const copy = getBusinessAppCopy(language);
  const actions = getHomepageFloatingActions(language);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const isSidebar = placement === 'sidebar';

  useEffect(() => {
    const onDocClick = (ev) => {
      if (!rootRef.current?.contains(ev.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const toggle = () => setOpen((v) => !v);

  const rootClass = isSidebar
    ? 'relative z-10 w-full shrink-0'
    : 'fixed bottom-4 right-3 z-40 sm:bottom-5 sm:right-4';

  const panelClass = isSidebar
    ? 'mb-2 w-full overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-lg shadow-slate-300/30'
    : 'mb-2 w-[min(calc(100vw-1.5rem),17.5rem)] overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-lg shadow-slate-300/40';

  const triggerClass = isSidebar
    ? `flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left shadow-sm transition-colors sm:py-3 ${
        open
          ? 'border-[#0077B6]/35 bg-[#e8f4fa]'
          : 'border-slate-200/90 bg-white hover:border-[#0077B6]/25 hover:bg-slate-50/80'
      }`
    : `flex max-w-[min(calc(100vw-1.5rem),14rem)] items-center justify-between gap-2 rounded-full border px-3 py-2 shadow-md transition-all sm:max-w-none sm:rounded-xl sm:px-3.5 sm:py-2.5 ${
        open
          ? 'border-[#0077B6]/30 bg-[#0077B6] text-white shadow-[#0077B6]/25'
          : 'border-slate-200/90 bg-white text-slate-800 shadow-slate-300/35 hover:bg-[#e8f4fa]'
      }`;

  return (
    <div
      ref={rootRef}
      className={`${rootClass} flex flex-col ${isSidebar ? '' : 'items-end'}`}
      onMouseEnter={() => {
        if (isSidebar && window.matchMedia('(hover: hover)').matches) setOpen(true);
      }}
      onMouseLeave={() => {
        if (isSidebar && window.matchMedia('(hover: hover)').matches) setOpen(false);
      }}
    >
      {open ? (
        <div className={panelClass} role="menu">
          <div className="border-b border-slate-100 px-3 py-2 text-xs font-bold text-slate-800 sm:text-sm">
            {copy.homepage.quickActions}
          </div>
          <div className="flex flex-col p-1.5">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    onNavigate(action.path);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-[#e8f4fa]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f4fa] text-[#0077B6]">
                    <Icon className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0 text-sm font-semibold leading-snug text-slate-800">{action.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={toggle}
        className={triggerClass}
        aria-expanded={open}
        aria-label={copy.homepage.quickActions}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              !isSidebar && open
                ? 'bg-white/20 text-white'
                : 'bg-[#e8f4fa] text-[#0077B6]'
            }`}
          >
            <Zap className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <span
            className={`truncate text-sm font-semibold leading-snug ${
              !isSidebar && open ? 'text-white' : 'text-slate-800'
            }`}
          >
            {copy.homepage.quickActions}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          } ${!isSidebar && open ? 'text-white/90' : 'text-slate-400'}`}
          strokeWidth={2.25}
        />
      </button>
    </div>
  );
}
