import React from 'react';
import {
  Sparkles,
  Search,
  MessageSquare,
  BookOpen,
  ArrowUpRight,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getBusinessAppCopy } from '../../i18n/businessAppI18n';

/** Danh sách mặc định — dùng trên Homepage, Branding, Scout, Sàn CTV, … */
export function getDefaultBusinessQuickActions(language = 'vi') {
  const copy = getBusinessAppCopy(language).quickActions;
  return [
    {
      id: 'create-jd',
      icon: Sparkles,
      title: copy.createJd.title,
      desc: copy.createJd.desc,
      path: '/business/jobs',
    },
    {
      id: 'scout-candidates',
      icon: Search,
      title: copy.scout.title,
      desc: copy.scout.desc,
      path: '/business/scout/direct',
    },
    {
      id: 'ws-recruitment-support',
      icon: MessageSquare,
      title: copy.wsSupport.title,
      desc: copy.wsSupport.desc,
      path: '/business/messages?tab=ws',
    },
    {
      id: 'usage-guide',
      icon: BookOpen,
      title: copy.guide.title,
      desc: copy.guide.desc,
      path: '/business/knowledge',
    },
  ];
}

/** @deprecated Dùng getDefaultBusinessQuickActions(language) */
export const DEFAULT_BUSINESS_QUICK_ACTIONS = getDefaultBusinessQuickActions('vi');

/**
 * Panel「Thao tác nhanh」— style chuẩn business sidebar (Homepage).
 * @param {{ icon: import('react').ComponentType, title: string, desc: string, path?: string, action?: string, [key: string]: unknown }[]} actions
 * @param {(action: object) => void} onActionClick
 */
export default function BusinessQuickActionsPanel({ actions, onActionClick, title = null }) {
  const { language } = useLanguage();
  const copy = getBusinessAppCopy(language);
  const heading = title || copy.homepage.quickActions;

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
      <h2 className="biz-ui-section text-slate-900">{heading}</h2>
      <div className="mt-2.5 flex flex-col gap-1">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id || a.title}
              type="button"
              onClick={() => onActionClick(a)}
              className="flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-[#e8f4fa]"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e8f4fa] text-[#0077B6]">
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="biz-ui-body line-clamp-2 font-semibold leading-snug text-slate-800">{a.title}</div>
                {a.desc ? (
                  <div className="biz-ui-caption truncate text-slate-500">{a.desc}</div>
                ) : null}
              </div>
              <ArrowUpRight className="h-3 w-3 shrink-0 text-slate-300" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
