import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardCheck,
  GitBranch,
  User,
  Search,
  Users,
  Users2,
  MessageSquare,
  Receipt,
  ShieldCheck,
  BookOpen,
  PieChart,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const I18N = {
  vi: {
    dashboard: 'Dashboard',
    jobManagement: 'Quản lý JD',
    applications: 'Quản lý tiến cử',
    candidates: 'Hồ sơ ứng viên',
    scout: 'Scout',
    saiyo: 'Saiyo Branding',
    partnerCTV: 'Sàn CTV (HR Partner)',
    messages: 'Tin nhắn',
    requestBilling: 'Request & Billing',
    serviceBilling: 'Yêu cầu dịch vụ & Billing',
    knowledgeHub: 'Knowledge Hub',
    insights: 'Báo cáo & Insights',
    settings: 'Cài đặt',
    currentCredit: 'Credit hiện tại',
    creditHint: 'Có thể mở ~24 hồ sơ ứng viên',
    topUpCredit: 'Nạp thêm credit',
    viewCreditHistory: 'Xem lịch sử credit',
  },
  en: {
    dashboard: 'Dashboard',
    jobManagement: 'Job Management',
    applications: 'Applications',
    candidates: 'Candidates',
    scout: 'Scout',
    saiyo: 'Saiyo Branding',
    partnerCTV: 'CTV Marketplace (HR Partner)',
    messages: 'Messages',
    requestBilling: 'Request & Billing',
    serviceBilling: 'Service Requests & Billing',
    knowledgeHub: 'Knowledge Hub',
    insights: 'Reports & Insights',
    settings: 'Settings',
    currentCredit: 'Current credit',
    creditHint: 'Can unlock ~24 candidate profiles',
    topUpCredit: 'Top up credit',
    viewCreditHistory: 'View credit history',
  },
  ja: {
    dashboard: 'ダッシュボード',
    jobManagement: 'JD管理',
    applications: 'エントリー管理',
    candidates: '候補者',
    scout: 'スカウト',
    saiyo: 'Saiyo ブランディング',
    partnerCTV: 'CTVマーケット (HR Partner)',
    messages: 'メッセージ',
    requestBilling: 'Request & Billing',
    serviceBilling: 'サービス依頼 & Billing',
    knowledgeHub: 'ナレッジハブ',
    insights: 'レポートと分析',
    settings: '設定',
    currentCredit: '現在のクレジット',
    creditHint: '約24件の候補者プロフィールを開けます',
    topUpCredit: 'クレジットを追加',
    viewCreditHistory: 'クレジット履歴を見る',
  },
};

const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, path: '/business', label: 'dashboard', end: true },
  { id: 'jobs', icon: ClipboardCheck, path: '/business/jobs', label: 'jobManagement' },
  { id: 'applications', icon: GitBranch, path: '/business/applications', label: 'applications' },
  { id: 'candidates', icon: User, path: '/business/candidates', label: 'candidates' },
  { id: 'scout', icon: Search, path: '/business/scout', label: 'scout' },
  { id: 'saiyo', icon: Users, path: '/business/saiyo', label: 'saiyo' },
  { id: 'candidate-sharing', icon: Users2, path: '/business/candidate-sharing', label: 'partnerCTV' },
  { id: 'messages', icon: MessageSquare, path: '/business/messages', label: 'messages' },
  { id: 'billing', icon: Receipt, path: '/business/billing', label: 'requestBilling' },
  { id: 'service-billing', icon: ShieldCheck, path: '/business/service-billing', label: 'serviceBilling' },
  { id: 'knowledge', icon: BookOpen, path: '/business/knowledge', label: 'knowledgeHub' },
  { id: 'insights', icon: PieChart, path: '/business/insights', label: 'insights' },
  { id: 'settings', icon: Settings, path: '/business/settings', label: 'settings' },
];

const BusinessSidebar = ({ businessUser }) => {
  const { pathname } = useLocation();
  const { language } = useLanguage();
  const t = I18N[language] || I18N.vi;

  const {
    contactName = '',
    contactTitle = '',
    companyName = '',
    initials = 'B',
    credit = 0,
  } = businessUser || {};

  const creditDisplay = useMemo(
    () => `${Number(credit || 0).toLocaleString(language === 'en' ? 'en-US' : language === 'ja' ? 'ja-JP' : 'vi-VN')} credit`,
    [credit, language]
  );

  const isActive = (item) => {
    if (item.end) return pathname === item.path;
    return pathname === item.path || pathname.startsWith(`${item.path}/`);
  };

  const navItems = useMemo(() => NAV_ITEMS, []);

  const menuItemClass = (active) =>
    `flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors text-[9px] lg:text-[10px] leading-snug ${
      active
        ? 'bg-violet-100 text-violet-700 font-semibold'
        : 'text-slate-600 hover:bg-slate-50 font-medium'
    }`;

  return (
    <aside className="w-44 lg:w-52 h-screen bg-white border-r border-slate-200 flex flex-col">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Logo */}
      <div className="px-3 py-3 flex-shrink-0 sticky top-0 bg-white z-10 border-b border-slate-100">
        <Link to="/business" className="flex items-center justify-center">
          <img src="/logo.png" alt="JobShare" className="h-8 lg:h-10 w-auto" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto scrollbar-hide min-h-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link key={item.id} to={item.path} className={menuItemClass(active)}>
              <Icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={active ? 2.25 : 2} />
              <span className="truncate">{t[item.label]}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logged-in user */}
      {contactName && (
        <div className="mx-2 mb-2 flex items-center gap-2 rounded-lg border border-slate-100 bg-white p-2 flex-shrink-0">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[9px] font-semibold text-slate-800">{contactName}</div>
            {contactTitle && (
              <div className="truncate text-[8px] text-slate-500">{contactTitle}</div>
            )}
            {companyName && (
              <div className="truncate text-[8px] text-violet-600">{companyName}</div>
            )}
          </div>
        </div>
      )}

      {/* Credit card */}
      <div className="mx-2 mb-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0 space-y-1">
        <div className="text-[8px] text-slate-500 font-medium">{t.currentCredit}</div>
        <div className="text-sm font-bold text-slate-900 leading-none">{creditDisplay}</div>
        <div className="text-[8px] text-slate-400 leading-snug">{t.creditHint}</div>
        <Link
          to="/business/billing?topup=1"
          className="block w-full py-1.5 text-center text-[9px] font-semibold text-white bg-violet-600 rounded-md hover:bg-violet-700 transition-colors"
        >
          {t.topUpCredit}
        </Link>
        <Link
          to="/business/billing"
          className="flex items-center justify-center gap-0.5 text-[8px] font-semibold text-violet-600 hover:text-violet-700 transition-colors"
        >
          {t.viewCreditHistory}
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </aside>
  );
};

export default BusinessSidebar;
