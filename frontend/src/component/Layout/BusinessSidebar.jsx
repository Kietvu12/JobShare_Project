import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
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
  BookOpen,
  PieChart,
  Settings,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const I18N = {
  vi: {
    dashboard: 'Dashboard',
    jobManagement: 'Quản lý JD',
    applications: 'Quản lý tiến cử',
    candidates: 'Hồ sơ ứng viên',
    candidatesScoutCredit: 'Ứng viên Scout Credit',
    candidatesScoutPerformance: 'Ứng viên Scout Performance',
    scout: 'Scout',
    saiyo: 'Saiyo Branding',
    partnerCTV: 'Sàn CTV (HR Partner)',
    messages: 'Tin nhắn',
    requestBilling: 'Request & Billing',
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
    candidatesScoutCredit: 'Scout Credit candidates',
    candidatesScoutPerformance: 'Scout Performance candidates',
    scout: 'Scout',
    saiyo: 'Saiyo Branding',
    partnerCTV: 'CTV Marketplace (HR Partner)',
    messages: 'Messages',
    requestBilling: 'Request & Billing',
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
    candidatesScoutCredit: 'Scout Credit 候補者',
    candidatesScoutPerformance: 'Scout Performance 候補者',
    scout: 'スカウト',
    saiyo: 'Saiyo ブランディング',
    partnerCTV: 'CTVマーケット (HR Partner)',
    messages: 'メッセージ',
    requestBilling: 'Request & Billing',
    knowledgeHub: 'ナレッジハブ',
    insights: 'レポートと分析',
    settings: '設定',
    currentCredit: '現在のクレジット',
    creditHint: '約24件の候補者プロフィールを開けます',
    topUpCredit: 'クレジットを追加',
    viewCreditHistory: 'クレジット履歴を見る',
  },
};

const CANDIDATE_LIST_KEYS = ['scout_credit', 'scout_performance'];

const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, path: '/business', label: 'dashboard', end: true },
  { id: 'jobs', icon: ClipboardCheck, path: '/business/jobs', label: 'jobManagement' },
  { id: 'applications', icon: GitBranch, path: '/business/applications', label: 'applications' },
  {
    id: 'candidates',
    icon: User,
    path: '/business/candidates',
    label: 'candidates',
    children: [
      { id: 'scout_credit', list: 'scout_credit', label: 'candidatesScoutCredit' },
      { id: 'scout_performance', list: 'scout_performance', label: 'candidatesScoutPerformance' },
    ],
  },
  { id: 'scout', icon: Search, path: '/business/scout', label: 'scout' },
  { id: 'saiyo', icon: Users, path: '/business/saiyo', label: 'saiyo' },
  { id: 'candidate-sharing', icon: Users2, path: '/business/candidate-sharing', label: 'partnerCTV' },
  { id: 'messages', icon: MessageSquare, path: '/business/messages', label: 'messages' },
  { id: 'billing', icon: Receipt, path: '/business/billing', label: 'requestBilling' },
  { id: 'knowledge', icon: BookOpen, path: '/business/knowledge', label: 'knowledgeHub' },
  { id: 'insights', icon: PieChart, path: '/business/insights', label: 'insights' },
  { id: 'settings', icon: Settings, path: '/business/settings', label: 'settings' },
];

const BusinessSidebar = ({ businessUser }) => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const t = I18N[language] || I18N.vi;

  const onCandidatesSection = pathname === '/business/candidates' || pathname.startsWith('/business/candidates/');
  const candidateListParam = searchParams.get('list');
  const activeCandidateList = CANDIDATE_LIST_KEYS.includes(candidateListParam)
    ? candidateListParam
    : 'scout_credit';

  const [candidatesOpen, setCandidatesOpen] = useState(onCandidatesSection);

  useEffect(() => {
    if (onCandidatesSection) setCandidatesOpen(true);
  }, [onCandidatesSection]);

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

  const subMenuItemClass = (active) =>
    `flex items-center gap-1.5 pl-7 pr-2 py-1 rounded-md transition-colors text-[8px] lg:text-[9px] leading-snug ${
      active
        ? 'bg-violet-50 text-violet-700 font-semibold'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium'
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

          if (item.children?.length) {
            const sectionActive = onCandidatesSection;
            return (
              <div key={item.id} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => setCandidatesOpen((v) => !v)}
                  className={`w-full ${menuItemClass(sectionActive)}`}
                  aria-expanded={candidatesOpen}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={sectionActive ? 2.25 : 2} />
                  <span className="truncate flex-1 text-left">{t[item.label]}</span>
                  {candidatesOpen ? (
                    <ChevronDown className="h-3 w-3 flex-shrink-0 opacity-70" />
                  ) : (
                    <ChevronRight className="h-3 w-3 flex-shrink-0 opacity-70" />
                  )}
                </button>
                {candidatesOpen && (
                  <div className="space-y-0.5">
                    {item.children.map((child) => {
                      const childActive = onCandidatesSection && activeCandidateList === child.list;
                      return (
                        <Link
                          key={child.id}
                          to={{ pathname: item.path, search: `?list=${child.list}` }}
                          className={subMenuItemClass(childActive)}
                        >
                          <span className="truncate">{t[child.label]}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

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
