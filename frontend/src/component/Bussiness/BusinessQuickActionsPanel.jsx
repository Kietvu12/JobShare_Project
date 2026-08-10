import React from 'react';
import {
  Sparkles,
  Search,
  MessageSquare,
  BookOpen,
  ArrowUpRight,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../translations/translations';

/** Danh sách mặc định — dùng trên Homepage, Branding, Scout, Sàn CTV, … */
export const DEFAULT_BUSINESS_QUICK_ACTIONS = [
  {
    id: 'create-jd',
    icon: Sparkles,
    title: 'Tạo JD mới nhanh chóng',
    desc: 'Tạo job description bằng AI trên JobShare',
    path: '/business/jobs',
  },
  {
    id: 'scout-candidates',
    icon: Search,
    title: 'Tìm kiếm ứng viên phù hợp nhất với JD của bạn',
    desc: 'Scout trong kho ứng viên chất lượng',
    path: '/business/scout',
  },
  {
    id: 'ws-recruitment-support',
    icon: MessageSquare,
    title: 'Gửi yêu cầu hỗ trợ tuyển dụng cho Work Station',
    desc: 'Trao đổi & nhờ WS hỗ trợ tuyển dụng',
    path: '/business/messages?tab=ws',
  },
  {
    id: 'usage-guide',
    icon: BookOpen,
    title: 'Xem hướng dẫn sử dụng',
    desc: 'Tài liệu và best practice trên nền tảng',
    path: '/business/knowledge',
  },
];

/**
 * Panel「Thao tác nhanh」— style chuẩn business sidebar (Homepage).
 * @param {{ icon: import('react').ComponentType, title: string, desc: string, path?: string, action?: string, [key: string]: unknown }[]} actions
 * @param {(action: object) => void} onActionClick
 */
export default function BusinessQuickActionsPanel({ actions, onActionClick, title = null }) {
  const { language } = useLanguage();
  const t = translations[language] || translations.vi;
  const heading = title || t.quickActions || 'Thao tác nhanh';

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
      <h2 className="text-xs font-bold text-slate-900">{heading}</h2>
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
                <div className="line-clamp-2 text-[11px] font-semibold leading-snug text-slate-800">{a.title}</div>
                {a.desc ? (
                  <div className="truncate text-[10px] text-slate-500">{a.desc}</div>
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
