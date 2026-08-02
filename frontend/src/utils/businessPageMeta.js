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
} from 'lucide-react';

const PAGE_META = [
  { path: '/business/applications', end: false, icon: GitBranch, title: { vi: 'Quản lý tiến cử', en: 'Applications', ja: 'エントリー管理' } },
  { path: '/business/jobs', end: false, icon: ClipboardCheck, title: { vi: 'Quản lý JD', en: 'Job Management', ja: 'JD管理' } },
  { path: '/business/candidates', end: false, icon: User, title: { vi: 'Hồ sơ ứng viên', en: 'Candidates', ja: '候補者' } },
  { path: '/business/scout', end: false, icon: Search, title: { vi: 'Scout', en: 'Scout', ja: 'スカウト' } },
  { path: '/business/saiyo', end: false, icon: Users, title: { vi: 'Saiyo Branding', en: 'Saiyo Branding', ja: 'Saiyo ブランディング' } },
  { path: '/business/candidate-sharing', end: false, icon: Users2, title: { vi: 'Sàn CTV', en: 'CTV Marketplace', ja: 'CTVマーケット' } },
  { path: '/business/knowledge', end: false, icon: BookOpen, title: { vi: 'Knowledge Hub', en: 'Knowledge Hub', ja: 'ナレッジハブ' } },
  { path: '/business/insights', end: false, icon: PieChart, title: { vi: 'Report & insight', en: 'Report & insight', ja: 'Report & insight' } },
  { path: '/business/messages', end: false, icon: MessageSquare, title: { vi: 'Tin nhắn', en: 'Messages', ja: 'メッセージ' } },
  { path: '/business/billing', end: false, icon: Receipt, title: { vi: 'Request & Billing', en: 'Request & Billing', ja: 'Request & Billing' } },
  { path: '/business', end: true, icon: LayoutDashboard, title: { vi: 'Dashboard', en: 'Dashboard', ja: 'ダッシュボード' } },
];

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
