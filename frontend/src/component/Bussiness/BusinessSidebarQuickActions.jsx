import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Zap } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getBusinessAppCopy } from '../../i18n/businessAppI18n';
import { getDefaultBusinessQuickActions } from './BusinessQuickActionsPanel.jsx';

const MENU_WIDTH_PX = 272;
const VIEWPORT_PAD = 10;
const MENU_HEADER_PX = 40;
const MENU_LIST_PAD_PX = 16;
/** ~1 dòng title + 2 dòng mô tả */
const MENU_ROW_PX = 72;

function computeMenuLayout(triggerRect, actionCount) {
  const naturalListHeight = actionCount * MENU_ROW_PX;
  const naturalTotal = MENU_HEADER_PX + MENU_LIST_PAD_PX + naturalListHeight;

  const maxTotalHeight = Math.max(160, triggerRect.bottom - VIEWPORT_PAD);
  const totalHeight = Math.min(naturalTotal, maxTotalHeight);
  const listHeight = Math.max(80, totalHeight - MENU_HEADER_PX - MENU_LIST_PAD_PX);

  let top = triggerRect.bottom - totalHeight;
  if (top < VIEWPORT_PAD) top = VIEWPORT_PAD;

  let left = triggerRect.right + 8;
  if (left + MENU_WIDTH_PX > window.innerWidth - VIEWPORT_PAD) {
    left = Math.max(VIEWPORT_PAD, triggerRect.left - MENU_WIDTH_PX - 8);
  }

  return { top, left, listHeight, needsScroll: naturalListHeight > listHeight + 1 };
}

/**
 * Menu dọc portal — căn đáy theo nút, không lắng nghe scroll (tránh co menu khi cuộn danh sách).
 */
export default function BusinessSidebarQuickActions({ collapsed = false, onNavigate: onNavigateProp }) {
  const navigate = useNavigate();
  const onNavigate = onNavigateProp || ((path) => navigate(path));
  const { language } = useLanguage();
  const copy = getBusinessAppCopy(language);
  const actions = useMemo(() => getDefaultBusinessQuickActions(language), [language]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const hideTimerRef = useRef(null);
  const [menuLayout, setMenuLayout] = useState(null);

  const canHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

  const cancelHide = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const showMenu = () => {
    cancelHide();
    const trigger = rootRef.current;
    if (trigger) {
      setMenuLayout(computeMenuLayout(trigger.getBoundingClientRect(), actions.length));
    }
    setOpen(true);
  };

  const scheduleHide = () => {
    if (!canHover) return;
    cancelHide();
    hideTimerRef.current = setTimeout(() => {
      setOpen(false);
      setMenuLayout(null);
    }, 160);
  };

  useEffect(() => () => cancelHide(), []);

  useEffect(() => {
    const onDocClick = (ev) => {
      const menuEl = document.getElementById('biz-sidebar-quick-actions-menu');
      if (rootRef.current?.contains(ev.target)) return;
      if (menuEl?.contains(ev.target)) return;
      setOpen(false);
      setMenuLayout(null);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onResize = () => {
      const trigger = rootRef.current;
      if (trigger) {
        setMenuLayout(computeMenuLayout(trigger.getBoundingClientRect(), actions.length));
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, actions.length]);

  const menuPanel = open && menuLayout ? (
    <div
      id="biz-sidebar-quick-actions-menu"
      role="menu"
      className="fixed z-[10000] w-[17rem] rounded-xl border border-slate-200/90 bg-white shadow-xl shadow-slate-300/40"
      style={{ top: menuLayout.top, left: menuLayout.left }}
      onMouseEnter={showMenu}
      onMouseLeave={scheduleHide}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="border-b border-slate-100 px-2.5 py-2 text-xs font-bold text-slate-900">
        {copy.homepage.quickActions}
      </div>
      <div
        className={`flex flex-col gap-0.5 p-1.5 pb-2 ${menuLayout.needsScroll ? 'overflow-y-auto overscroll-contain' : 'overflow-visible'}`}
        style={{ maxHeight: menuLayout.listHeight }}
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setMenuLayout(null);
                if (action.path) onNavigate(action.path);
              }}
              className="flex w-full items-start gap-2 rounded-lg px-1.5 py-2 text-left transition-colors hover:bg-[#e8f4fa]"
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#e8f4fa] text-[#0077B6]">
                <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold leading-snug text-slate-800">{action.title}</div>
                {action.desc ? (
                  <div className="mt-0.5 text-[11px] leading-snug text-slate-500">{action.desc}</div>
                ) : null}
              </div>
              <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0 text-slate-300" />
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div
        ref={rootRef}
        className={`relative ${collapsed ? 'flex justify-center' : 'mt-1.5'}`}
        onMouseEnter={showMenu}
        onMouseLeave={scheduleHide}
      >
        <button
          type="button"
          onClick={() => {
            if (open) {
              setOpen(false);
              setMenuLayout(null);
            } else {
              showMenu();
            }
          }}
          className={`flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white text-left shadow-sm transition-colors hover:border-[#0077B6]/30 hover:bg-[#f8fbfd] ${
            collapsed ? 'h-8 w-8 justify-center p-0' : 'w-full px-2 py-1.5'
          } ${open ? 'border-[#0077B6]/35 bg-[#e8f4fa]' : ''}`}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={copy.homepage.quickActions}
          title={copy.homepage.quickActions}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#e8f4fa] text-[#0077B6]">
            <Zap className="h-3 w-3" strokeWidth={2.25} />
          </span>
          {!collapsed ? (
            <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-800">
              {copy.homepage.quickActions}
            </span>
          ) : null}
        </button>
      </div>
      {typeof document !== 'undefined' && menuPanel ? createPortal(menuPanel, document.body) : null}
    </>
  );
};
