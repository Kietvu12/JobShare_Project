import React, { useEffect, useState, useCallback } from 'react';
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
  ClipboardList,
  BookOpen,
  PieChart,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { BUSINESS_UI_FONT, BUSINESS_UI_FONT_IMPORT } from '../../utils/businessUiFont';
import apiService from '../../services/api';
import BusinessAppLanguageSwitcher from './BusinessAppLanguageSwitcher';
import useBusinessAppCopy from '../../hooks/useBusinessAppCopy';

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
    candidateScoutCredit: 'Scout',
    candidateScoutPerformance: 'Scout Ủy Thác',
    applications: 'Quản lý tiến cử',
    services: 'Dịch vụ',
    scout: 'Scout',
    saiyo: 'Thương hiệu Tuyển dụng',
    partnerCTV: 'Mạng lưới Đối tác Tuyển dụng',
    messages: 'Tin nhắn',
    requestBilling: 'Yêu cầu & Thanh toán',
    serviceRequests: 'Yêu cầu dịch vụ',
    paymentManagement: 'Thanh toán & Hóa đơn',
    knowledgeHub: 'Knowledge Hub',
    insights: 'Report & insight',
    settings: 'Cài đặt',
    recruitmentHealth: 'Recruitment Health',
    healthScoreHint: 'Chỉ số tổng hợp tuyển dụng',
    healthExcellent: 'Tốt',
    healthGood: 'Khá tốt',
    healthAverage: 'Trung bình',
    healthNeedsImprovement: 'Cần cải thiện',
    healthNoData: 'Chưa có dữ liệu',
    healthLoading: 'Đang tính...',
    healthDays: (n) => `${n} ngày`,
    collapseSidebar: 'Thu gọn sidebar',
    expandSidebar: 'Mở rộng sidebar',
    closeMenu: 'Đóng menu',
    language: 'Ngôn ngữ',
  },
  en: {
    dashboard: 'Dashboard',
    jobManagement: 'Job Management',
    candidateManagement: 'Candidate profiles',
    candidateScoutCredit: 'Direct Scout',
    candidateScoutPerformance: 'Managed Scout',
    applications: 'Applications',
    services: 'Services',
    scout: 'Direct Scout',
    saiyo: 'Employer Branding',
    partnerCTV: 'HR Partner Network',
    messages: 'Messages',
    requestBilling: 'Requests & Billing',
    serviceRequests: 'Service requests',
    paymentManagement: 'Payment management',
    knowledgeHub: 'Knowledge Hub',
    insights: 'Report & insight',
    settings: 'Settings',
    recruitmentHealth: 'Recruitment Health',
    healthScoreHint: 'Overall hiring health score',
    healthExcellent: 'Excellent',
    healthGood: 'Good',
    healthAverage: 'Average',
    healthNeedsImprovement: 'Needs improvement',
    healthNoData: 'No data yet',
    healthLoading: 'Calculating...',
    healthDays: (n) => `${n} days`,
    collapseSidebar: 'Collapse sidebar',
    expandSidebar: 'Expand sidebar',
    closeMenu: 'Close menu',
    language: 'Language',
  },
  ja: {
    dashboard: 'ダッシュボード',
    jobManagement: 'JD管理',
    candidateManagement: '候補者プロフィール',
    candidateScoutCredit: 'ダイレクトスカウト',
    candidateScoutPerformance: 'おまかせスカウト',
    applications: 'エントリー管理',
    services: 'サービス',
    scout: 'ダイレクトスカウト',
    saiyo: '採用ブランディング',
    partnerCTV: 'HRパートナーネットワーク',
    messages: 'メッセージ',
    requestBilling: 'リクエスト・請求',
    serviceRequests: 'サービス依頼',
    paymentManagement: '支払い管理',
    knowledgeHub: 'ナレッジハブ',
    insights: 'Report & insight',
    settings: '設定',
    recruitmentHealth: 'Recruitment Health',
    healthScoreHint: '採用健全性スコア',
    healthExcellent: '良好',
    healthGood: 'やや良好',
    healthAverage: '普通',
    healthNeedsImprovement: '要改善',
    healthNoData: 'データなし',
    healthLoading: '計算中...',
    healthDays: (n) => `${n}日`,
    collapseSidebar: 'サイドバーを折りたたむ',
    expandSidebar: 'サイドバーを展開',
    closeMenu: 'メニューを閉じる',
    language: '言語',
  },
};

const HEALTH_RATING_KEYS = {
  excellent: 'healthExcellent',
  good: 'healthGood',
  average: 'healthAverage',
  needsImprovement: 'healthNeedsImprovement',
  noData: 'healthNoData',
};

const DEFAULT_RECRUITMENT_HEALTH = {
  score: 0,
  avgDays: 0,
  rating: 'noData',
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
    ],
  },
  {
    label: 'requestBilling',
    nested: true,
    items: [
      { id: 'service-requests', icon: ClipboardList, path: '/business/service-requests', label: 'serviceRequests' },
      { id: 'billing', icon: Receipt, path: '/business/billing', label: 'paymentManagement' },
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

const BusinessSidebar = ({ businessUser, mobileOpen = false, onMobileClose }) => {
  const { pathname } = useLocation();
  const { language } = useLanguage();
  const appCopy = useBusinessAppCopy();
  const t = I18N[language] || I18N.vi;

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [health, setHealth] = useState(DEFAULT_RECRUITMENT_HEALTH);
  const [healthLoading, setHealthLoading] = useState(true);

  const loadRecruitmentHealth = useCallback(async () => {
    try {
      const res = await apiService.getBusinessRecruitmentHealth();
      const data = res?.data || {};
      setHealth({
        score: Number(data.score) || 0,
        avgDays: Number(data.avgDays) || 0,
        rating: data.rating || 'noData',
      });
    } catch {
      setHealth(DEFAULT_RECRUITMENT_HEALTH);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecruitmentHealth();
    const onFocus = () => loadRecruitmentHealth();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadRecruitmentHealth, pathname]);

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

  const healthRatingLabel = t[HEALTH_RATING_KEYS[health.rating] || 'healthNoData'] || t.healthNoData;
  const healthSummaryDays = health.avgDays > 0 ? t.healthDays(health.avgDays) : '—';
  const healthScore = healthLoading ? 0 : health.score;

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

  const renderNavItem = (item, { nested = false, forceExpanded = false, onNavigate } = {}) => {
    const Icon = item.icon;
    const active = isActive(item);
    const isCompact = collapsed && !forceExpanded;

    if (isCompact) {
      return (
        <Link
          key={item.id}
          to={item.path}
          className={`mx-auto ${navLinkClass(active, true)}`}
          title={t[item.label]}
          onClick={() => onNavigate?.()}
        >
          <Icon className={iconClass(active)} strokeWidth={active ? 2.25 : 2} />
        </Link>
      );
    }

    return (
      <Link
        key={item.id}
        to={item.path}
        className={navLinkClass(active, false, nested)}
        onClick={() => onNavigate?.()}
      >
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

  const renderSidebarSections = ({ forceExpanded = false, onNavigate } = {}) => (
    NAV_SECTIONS.map((section, sectionIndex) => {
      const showExpanded = forceExpanded || !collapsed;
      return (
        <div key={section.label || `section-${sectionIndex}`}>
          {sectionIndex > 0 && <NavSpacer collapsed={!showExpanded} />}
          {showExpanded && section.label && (
            <div className="px-2.5 pb-1 pt-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
              {t[section.label]}
            </div>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => renderNavItem(item, {
              nested: Boolean(section.nested),
              forceExpanded,
              onNavigate,
            }))}
          </div>
        </div>
      );
    })
  );

  const renderLanguageBlock = ({ forceExpanded = false } = {}) => {
    const showExpanded = forceExpanded || !collapsed;
    return (
      <div
        className={`shrink-0 border-t border-slate-100 bg-white p-2 ${
          showExpanded ? '' : 'flex flex-col items-center'
        }`}
      >
        <BusinessAppLanguageSwitcher
          compact={showExpanded}
          collapsed={!showExpanded}
          showLabel={showExpanded}
          label={appCopy.layout.language}
          className={showExpanded ? 'w-full' : ''}
        />
      </div>
    );
  };

  const renderHealthBlock = ({ forceExpanded = false } = {}) => {
    const showExpanded = forceExpanded || !collapsed;
    return (
      <div
        className={`shrink-0 border-t border-slate-100 bg-white p-2 ${
          showExpanded ? '' : 'flex flex-col items-center'
        }`}
      >
        {showExpanded ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="relative flex shrink-0 items-center justify-center">
                <RecruitmentDonut percent={healthScore} size={44} strokeWidth={5} />
                <span className="absolute text-[10px] font-bold leading-none text-slate-800">
                  {healthLoading ? '…' : healthScore}
                </span>
              </div>
              <div className="min-w-0 flex-1 leading-snug">
                <div className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">
                  {t.recruitmentHealth}
                </div>
                <div className="text-[11px] font-bold text-slate-800">
                  {healthLoading ? t.healthLoading : `${healthScore}% · ${healthSummaryDays}`}
                </div>
                <div className="text-[9px] text-[#0077B6]">
                  {healthLoading ? '…' : healthRatingLabel}
                </div>
              </div>
            </div>

            <p className="biz-sidebar-health-footnote mt-1.5 text-[8px] leading-snug text-slate-400 [overflow-wrap:anywhere]">
              {t.healthScoreHint}
            </p>
          </div>
        ) : (
          <div className="relative flex items-center justify-center py-0.5">
            <RecruitmentDonut percent={healthScore} size={36} strokeWidth={4} />
            <span className="absolute text-[8px] font-bold text-[#0077B6]">
              {healthLoading ? '…' : healthScore}
            </span>
          </div>
        )}
      </div>
    );
  };

  const handleMobileNavigate = () => {
    onMobileClose?.();
  };

  return (
    <>
      <style>{`
        ${BUSINESS_UI_FONT_IMPORT}
        .business-sidebar-scroll::-webkit-scrollbar { display: none; }
        .business-sidebar-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-height: 840px) {
          .biz-sidebar-health-footnote { display: none; }
        }
      `}</style>

      {/* Desktop sidebar */}
      <aside
        className={`relative hidden h-screen shrink-0 flex-col border-r border-slate-100 bg-white transition-[width] duration-300 ease-out lg:flex ${
          collapsed ? 'w-[56px]' : 'w-[210px]'
        }`}
        style={{ fontFamily: BUSINESS_UI_FONT }}
      >
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

        <nav className="business-sidebar-scroll min-h-0 flex-1 space-y-0 overflow-y-auto px-1.5 py-1.5">
          {renderSidebarSections()}
        </nav>

        {renderLanguageBlock()}
        {renderHealthBlock()}
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-[100] lg:hidden ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          onClick={onMobileClose}
          className={`absolute inset-0 bg-slate-900/45 transition-opacity duration-300 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label={t.closeMenu}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-[min(86vw,280px)] flex-col border-r border-slate-100 bg-white shadow-2xl transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ fontFamily: BUSINESS_UI_FONT }}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3 py-3">
            <Link
              to="/business"
              className="flex items-center"
              onClick={handleMobileNavigate}
            >
              <img src="/logo.png" alt="JobShare" className="h-7 w-auto max-w-[118px] object-contain" />
            </Link>
            <button
              type="button"
              onClick={onMobileClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
              aria-label={t.closeMenu}
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <nav className="business-sidebar-scroll min-h-0 flex-1 space-y-0 overflow-y-auto px-2 py-2">
            {renderSidebarSections({ forceExpanded: true, onNavigate: handleMobileNavigate })}
          </nav>

          {renderLanguageBlock({ forceExpanded: true })}
          {renderHealthBlock({ forceExpanded: true })}
        </aside>
      </div>
    </>
  );
};

export default BusinessSidebar;
