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
} from 'lucide-react';

const PAGE_META = [
  { path: '/business/applications', end: false, icon: GitBranch, title: { vi: 'Quản lý tiến cử', en: 'Applications', ja: 'エントリー管理' } },
  { path: '/business/jobs', end: false, icon: ClipboardCheck, title: { vi: 'Quản lý JD', en: 'Job Management', ja: 'JD管理' } },
  { path: '/business/candidates', end: false, icon: User, title: { vi: 'Hồ sơ ứng viên', en: 'Candidates', ja: '候補者' } },
  { path: '/business/scout/direct', end: false, icon: Search, title: { vi: 'Scout Trực Tiếp', en: 'Direct Scout', ja: 'ダイレクトスカウト' } },
  { path: '/business/scout/managed', end: false, icon: Search, title: { vi: 'Scout Ủy Thác', en: 'Managed Scout', ja: '委託スカウト' } },
  { path: '/business/saiyo', end: false, icon: Users, title: { vi: 'Saiyo Branding', en: 'Saiyo Branding', ja: 'Saiyo ブランディング' } },
  { path: '/business/candidate-sharing', end: false, icon: Users2, title: { vi: 'Sàn CTV', en: 'CTV Marketplace', ja: 'CTVマーケット' } },
  { path: '/business/knowledge', end: false, icon: BookOpen, title: { vi: 'Knowledge Hub', en: 'Knowledge Hub', ja: 'ナレッジハブ' } },
  { path: '/business/insights', end: false, icon: PieChart, title: { vi: 'Report & insight', en: 'Report & insight', ja: 'Report & insight' } },
  { path: '/business/messages', end: false, icon: MessageSquare, title: { vi: 'Tin nhắn', en: 'Messages', ja: 'メッセージ' } },
  { path: '/business/service-requests/credit', end: false, icon: ClipboardList, title: { vi: 'Yêu cầu nạp credit', en: 'Credit top-up', ja: 'クレジットチャージ' } },
  { path: '/business/service-requests/landing-page', end: false, icon: ClipboardList, title: { vi: 'Landing Page premium', en: 'Landing Page premium', ja: 'Landing Page premium' } },
  { path: '/business/service-requests/recruitment-ads', end: false, icon: ClipboardList, title: { vi: 'Quảng cáo tuyển dụng', en: 'Recruitment ads', ja: '採用広告' } },
  { path: '/business/service-requests/seminar-campaign', end: false, icon: ClipboardList, title: { vi: 'Seminar & Campaign', en: 'Seminar & Campaign', ja: 'セミナー・キャンペーン' } },
  { path: '/business/service-requests/company-profile', end: false, icon: ClipboardList, title: { vi: 'Thiết kế profile company', en: 'Company profile', ja: '会社プロフィール' } },
  { path: '/business/service-requests', end: false, icon: ClipboardList, title: { vi: 'Yêu cầu dịch vụ', en: 'Service requests', ja: 'サービス依頼' } },
  { path: '/business/billing', end: false, icon: Receipt, title: { vi: 'Thanh toán & Hóa đơn', en: 'Payments & Invoices', ja: '支払い・請求書' } },
  { path: '/business', end: true, icon: LayoutDashboard, title: { vi: 'Dashboard', en: 'Dashboard', ja: 'ダッシュボード' } },
];

const VIEWPORT_LOCKED_PREFIXES = [
  '/business/service-requests',
  '/business/billing',
  '/business/messages',
  '/business/scout',
];

export function isBusinessViewportLockedPage(pathname) {
  return VIEWPORT_LOCKED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getBusinessPageMeta(pathname, language = 'vi') {
  const lang = ['vi', 'en', 'ja'].includes(language) ? language : 'vi';
  const match = PAGE_META.find((item) => (
    item.end ? pathname === item.path : pathname === item.path || pathname.startsWith(`${item.path}/`)
  ));
  const fallback = PAGE_META.find((item) => item.end);
  const meta = match || fallback;
  return {
    icon: meta.icon,
    title: meta.title[lang] || meta.title.vi,
  };
}
