import React, { useEffect, useState } from 'react';
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
  BookOpen,
  PieChart,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const SIDEBAR_FONT =
  "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif";

/** Màu chủ đạo — active state & biểu đồ */
const BRAND = {
  main: '#0077B6',
  light: '#e8f4fa',
};

const I18N = {
  vi: {
    dashboard: 'Dashboard',
    jobManagement: 'Quản lý JD',
    candidateManagement: 'Hồ sơ ứng viên',
    candidateScoutCredit: 'Scout Credit',
    candidateScoutPerformance: 'Scout Performance',
    applications: 'Quản lý tiến cử',
    services: 'Dịch vụ',
    scout: 'Scout',
    saiyo: 'Saiyo Branding',
    partnerCTV: 'Sàn CTV',
    messages: 'Tin nhắn',
    requestBilling: 'Request & Billing',
    knowledgeHub: 'Knowledge Hub',
    insights: 'Report & insight',
    settings: 'Cài đặt',
    recruitmentHealth: 'Recruitment Health',
    healthScoreHint: 'Chỉ số tổng hợp tuyển dụng',
    healthGood: 'Khá tốt',
    collapseSidebar: 'Thu gọn sidebar',
    expandSidebar: 'Mở rộng sidebar',
  },
  en: {
    dashboard: 'Dashboard',
    jobManagement: 'Job Management',
    candidateManagement: 'Candidate profiles',
    candidateScoutCredit: 'Scout Credit',
    candidateScoutPerformance: 'Scout Performance',
    applications: 'Applications',
    services: 'Services',
    scout: 'Scout',
    saiyo: 'Saiyo Branding',
    partnerCTV: 'CTV Marketplace',
    messages: 'Messages',
    requestBilling: 'Request & Billing',
    knowledgeHub: 'Knowledge Hub',
    insights: 'Report & insight',
    settings: 'Settings',
    recruitmentHealth: 'Recruitment Health',
    healthScoreHint: 'Overall hiring health score',
    healthGood: 'Good',
    collapseSidebar: 'Collapse sidebar',
    expandSidebar: 'Expand sidebar',
  },
  ja: {
    dashboard: 'ダッシュボード',
    jobManagement: 'JD管理',
    candidateManagement: '候補者プロフィール',
    candidateScoutCredit: 'Scout Credit',
    candidateScoutPerformance: 'Scout Performance',
    applications: 'エントリー管理',
    services: 'サービス',
    scout: 'スカウト',
    saiyo: 'Saiyo ブランディング',
    partnerCTV: 'CTVマーケット',
    messages: 'メッセージ',
    requestBilling: 'Request & Billing',
    knowledgeHub: 'ナレッジハブ',
    insights: 'Report & insight',
    settings: '設定',
    recruitmentHealth: 'Recruitment Health',
    healthScoreHint: '採用健全性スコア',
    healthGood: '良好',
    collapseSidebar: 'サイドバーを折りたたむ',
    expandSidebar: 'サイドバーを展開',
  },
};

/** Mock — thay bằng API sau */
const MOCK_RECRUITMENT_HEALTH = {
  score: 72,
  summaryValue: '18 ngày',
};

const NAV_SECTIONS = [
  {
    items: [
      { id: 'dashboard', icon: LayoutDashboard, path: '/business', label: 'dashboard', end: true },
      { id: 'jobs', icon: ClipboardCheck, path: '/business/jobs', label: 'jobManagement' },
      { id: 'candidates', icon: User, path: '/business/candidates', label: 'candidateManagement' },
      { id: 'applications', icon: GitBranch, path: '/business/applications', label: 'applications' },
    ],
  },
  {
    label: 'services',
    nested: true,
    items: [
      { id: 'scout', icon: Search, path: '/business/scout', label: 'scout' },
      { id: 'saiyo', icon: Users, path: '/business/saiyo', label: 'saiyo' },
      { id: 'candidate-sharing', icon: Users2, path: '/business/candidate-sharing', label: 'partnerCTV' },
      { id: 'knowledge', icon: BookOpen, path: '/business/knowledge', label: 'knowledgeHub' },
      { id: 'insights', icon: PieChart, path: '/business/insights', label: 'insights' },
    ],
  },
  {
    items: [
      { id: 'messages', icon: MessageSquare, path: '/business/messages', label: 'messages' },
      { id: 'billing', icon: Receipt, path: '/business/billing', label: 'requestBilling' },
    ],
  },
];

const COLLAPSE_STORAGE_KEY = 'business-sidebar-collapsed';

function RecruitmentDonut({ percent, size, strokeWidth = 7, strokeColor = BRAND.main }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percent / 100) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0" aria-hidden>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />
    </svg>
  );
}

function NavSpacer({ collapsed }) {
  if (collapsed) {
    return <div className="mx-auto my-1.5 h-px w-7 bg-slate-200" aria-hidden />;
  }
  return <div className="my-1.5 h-px bg-slate-200/90" aria-hidden />;
}

const BusinessSidebar = ({ businessUser }) => {
  const { pathname } = useLocation();
  const { language } = useLanguage();
  const t = I18N[language] || I18N.vi;

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const { companyName = '' } = businessUser || {};

  const isActive = (item) => {
    if (item.end) return pathname === item.path;
    return pathname === item.path || pathname.startsWith(`${item.path}/`);
  };

  const health = MOCK_RECRUITMENT_HEALTH;

  const toggleCollapse = () => setCollapsed((v) => !v);

  const navLinkClass = (active, compact = false, nested = false) => {
    if (compact) {
      return `flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
        active
          ? 'bg-[#0077B6] !text-white shadow-sm [&_svg]:!text-white'
          : 'text-slate-500 hover:bg-slate-50'
      }`;
    }
    const sizeClass = nested
      ? 'gap-1.5 rounded-lg py-1 pl-3.5 pr-2 text-[10px]'
      : 'gap-2 rounded-xl px-2.5 py-1.5 text-[10px]';
    return `flex items-center font-medium transition-all duration-200 ${sizeClass} ${
      active
        ? 'bg-[#0077B6] font-semibold !text-white shadow-sm [&_svg]:!text-white'
        : nested
          ? 'text-slate-600 hover:bg-slate-50'
          : 'text-slate-600 hover:bg-slate-50'
    }`;
  };

  const nestedDashClass = (active) =>
    `w-2.5 shrink-0 text-center text-[9px] ${active ? 'text-white/90' : 'text-slate-400'}`;

  const nestedBulletClass = (active) =>
    `mt-[0.35rem] h-1.5 w-1.5 shrink-0 rounded-full ${
      active ? 'bg-white/95' : 'bg-slate-400'
    }`;

  const navLabelClass = (active) =>
    `min-w-0 flex-1 leading-snug [overflow-wrap:anywhere] ${active ? '!text-white' : ''}`;

  const renderNestedNavLink = (key, to, labelKey, isLinkActive) => (
    <Link key={key} to={to} className={navLinkClass(isLinkActive, false, true)}>
      <span className={nestedDashClass(isLinkActive)}>–</span>
      <span className={navLabelClass(isLinkActive)}>{t[labelKey]}</span>
    </Link>
  );

  const renderNestedBulletNavLink = (key, to, labelKey, isLinkActive) => (
    <Link
      key={key}
      to={to}
      className={`flex items-start gap-2 rounded-lg py-1 pl-6 pr-2 text-[10px] font-medium transition-all duration-200 ${
        isLinkActive
          ? 'bg-[#0077B6] font-semibold !text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <span className={nestedBulletClass(isLinkActive)} aria-hidden />
      <span className={`min-w-0 flex-1 leading-snug [overflow-wrap:anywhere] ${isLinkActive ? '!text-white' : ''}`}>
        {t[labelKey]}
      </span>
    </Link>
  );

  const iconClass = (active) =>
    `h-4 w-4 shrink-0 ${active ? '!text-white' : 'text-current'}`;

  const renderNavItem = (item, { nested = false } = {}) => {
    const Icon = item.icon;
    const active = isActive(item);

    if (collapsed) {
      return (
        <Link
          key={item.id}
          to={item.path}
          className={`mx-auto ${navLinkClass(active, true)}`}
          title={t[item.label]}
        >
          <Icon className={iconClass(active)} strokeWidth={active ? 2.25 : 2} />
        </Link>
      );
    }

    return (
      <Link key={item.id} to={item.path} className={navLinkClass(active, false, nested)}>
        {!nested && (
          <Icon className={iconClass(active)} strokeWidth={active ? 2.25 : 2} />
        )}
        {nested && (
          <span className={nestedDashClass(active)}>–</span>
        )}
        <span className={navLabelClass(active)}>
          {t[item.label]}
        </span>
      </Link>
    );
  };

  return (
    <aside
      className={`relative flex h-screen shrink-0 flex-col border-r border-slate-100 bg-white transition-[width] duration-300 ease-out ${
        collapsed ? 'w-[56px]' : 'w-[184px]'
      }`}
      style={{ fontFamily: SIDEBAR_FONT }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
        .business-sidebar-scroll::-webkit-scrollbar { display: none; }
        .business-sidebar-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-height: 840px) {
          .biz-sidebar-health-footnote { display: none; }
        }
      `}</style>

      {/* Header — logo giữa */}
      <div
        className={`relative flex shrink-0 items-center justify-center bg-white px-2.5 py-2.5 ${
          collapsed ? '' : 'min-h-[52px]'
        }`}
      >
        <Link
          to="/business"
          className="flex items-center justify-center"
          title={companyName || 'JobShare'}
        >
          <img
            src="/logo.png"
            alt="JobShare"
            className={`object-contain ${collapsed ? 'h-6 w-6' : 'h-7 w-auto max-w-[118px]'}`}
          />
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={toggleCollapse}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
            aria-label={t.collapseSidebar}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>
        )}
        {collapsed && (
          <button
            type="button"
            onClick={toggleCollapse}
            className="absolute right-0 top-[3.35rem] z-20 flex h-6 w-6 translate-x-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:text-[#0077B6]"
            aria-label={t.expandSidebar}
          >
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="business-sidebar-scroll min-h-0 flex-1 space-y-0 overflow-y-auto px-1.5 py-1.5">
        {NAV_SECTIONS.map((section, sectionIndex) => (
          <div key={section.label || `section-${sectionIndex}`}>
            {sectionIndex > 0 && <NavSpacer collapsed={collapsed} />}
            {!collapsed && section.label && (
              <div className="px-2.5 pb-1 pt-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                {t[section.label]}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => renderNavItem(item, { nested: Boolean(section.nested) }))}
            </div>
          </div>
        ))}
      </nav>

      {/* Recruitment health — dạng mỏng, cố định chiều cao */}
      <div
        className={`shrink-0 border-t border-slate-100 bg-white p-2 ${
          collapsed ? 'flex flex-col items-center' : ''
        }`}
      >
        {collapsed ? (
          <div className="relative flex items-center justify-center py-0.5">
            <RecruitmentDonut percent={health.score} size={36} strokeWidth={4} />
            <span className="absolute text-[8px] font-bold text-[#0077B6]">{health.score}</span>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="relative flex shrink-0 items-center justify-center">
                <RecruitmentDonut percent={health.score} size={44} strokeWidth={5} />
                <span className="absolute text-[10px] font-bold leading-none text-slate-800">{health.score}</span>
              </div>
              <div className="min-w-0 flex-1 leading-snug">
                <div className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">
                  {t.recruitmentHealth}
                </div>
                <div className="text-[11px] font-bold text-slate-800">
                  {health.score}% · {health.summaryValue}
                </div>
                <div className="text-[9px] text-[#0077B6]">{t.healthGood}</div>
              </div>
            </div>

            <p className="biz-sidebar-health-footnote mt-1.5 text-[8px] leading-snug text-slate-400 [overflow-wrap:anywhere]">
              {t.healthScoreHint}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default BusinessSidebar;
