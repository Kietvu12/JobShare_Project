import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, FileWarning, UserX, TrendingDown, Sparkles, Search,
  UserPlus, BarChart3, FilePlus2, Briefcase, BookOpen,
  Bell, AlertTriangle, CheckCircle2, Clock3, Lock, Unlock,
  Loader2, Check, Scale,
} from 'lucide-react'
import apiService from '../../services/api'

const actionCards = [
  {
    icon: Users,
    iconColor: 'text-rose-500',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    title: 'Thiếu ứng viên',
    tag: '(LOW SUPPLY)',
    tagColor: 'text-rose-500',
    desc: 'Nguồn ứng viên hiện tại đang thấp so với nhu cầu.',
    button: 'Tăng nguồn Scout Credit',
    buttonColor: 'bg-rose-500 hover:bg-rose-600',
  },
  {
    icon: FileWarning,
    iconColor: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    title: 'CV không phù hợp',
    tag: '(LOW QUALITY)',
    tagColor: 'text-amber-500',
    desc: 'Chất lượng ứng viên chưa đáp ứng yêu cầu vị trí.',
    button: 'Scout Performance / Sàn CTV',
    buttonColor: 'bg-amber-500 hover:bg-amber-600',
  },
  {
    icon: UserX,
    iconColor: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    title: 'Thiếu resource tuyển dụng',
    tag: '(LOW CAPACITY)',
    tagColor: 'text-blue-500',
    desc: 'Đội ngũ tuyển dụng đang quá tải hoặc thiếu nguồn lực.',
    button: 'Tăng hiệu quả Branding',
    buttonColor: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    icon: TrendingDown,
    iconColor: 'text-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    title: 'Hiệu quả thấp',
    tag: '(LOW PERFORMANCE)',
    tagColor: 'text-emerald-500',
    desc: 'Tỷ lệ chuyển đổi và hiệu quả tuyển dụng chưa tối ưu.',
    button: 'Tối ưu Scout Performance',
    buttonColor: 'bg-emerald-500 hover:bg-emerald-600',
  },
]

const healthMetrics = [
  {
    icon: Users,
    iconColor: 'text-blue-500',
    bg: 'bg-blue-50',
    label: 'Nguồn ứng viên (Supply)',
    score: 65,
    status: 'Trung bình',
    statusColor: 'bg-amber-100 text-amber-700',
    change: '+15% so với tuần trước',
    lineColor: '#3b82f6',
    points: '0,30 15,28 30,22 45,25 60,18 75,15 90,10 105,8',
  },
  {
    icon: BarChart3,
    iconColor: 'text-amber-500',
    bg: 'bg-amber-50',
    label: 'Hiệu suất (Performance)',
    score: 58,
    status: 'Cần cải thiện',
    statusColor: 'bg-rose-100 text-rose-700',
    change: '+8% so với tuần trước',
    lineColor: '#f59e0b',
    points: '0,25 15,28 30,20 45,22 60,15 75,18 90,12 105,14',
  },
  {
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
    bg: 'bg-emerald-50',
    label: 'Chất lượng (Quality)',
    score: 78,
    status: 'Tốt',
    statusColor: 'bg-emerald-100 text-emerald-700',
    change: '+12% so với tuần trước',
    lineColor: '#10b981',
    points: '0,25 15,22 30,28 45,20 60,15 75,18 90,10 105,5',
  },
  {
    icon: Clock3,
    iconColor: 'text-violet-500',
    bg: 'bg-violet-50',
    label: 'Tốc độ (Speed)',
    score: 70,
    status: 'Trung bình',
    statusColor: 'bg-amber-100 text-amber-700',
    change: '+10% so với tuần trước',
    lineColor: '#8b5cf6',
    points: '0,15 15,25 30,18 45,28 60,12 75,22 90,15 105,10',
  },
]

const quickStats = [
  { icon: Briefcase, label: 'JD đang hoạt động', value: 12, color: 'text-blue-500' },
  { icon: UserPlus, label: 'Ứng viên mới (7 ngày)', value: 128, color: 'text-violet-500' },
  { icon: CheckCircle2, label: 'Ứng viên phù hợp (7 ngày)', value: 32, color: 'text-amber-500' },
  { icon: Unlock, label: 'Lượt unlock (7 ngày)', value: 45, color: 'text-blue-500' },
  { icon: Lock, label: 'Yêu cầu đang xử lý', value: 18, color: 'text-rose-500' },
]

const quickActions = [
  { icon: Sparkles, title: 'Tạo JD mới (AI)', desc: 'Tạo JD miễn phí bằng AI', color: 'text-violet-500', bg: 'bg-violet-50', path: '/business/jobs/ai-builder' },
  { icon: Search, title: 'Tìm ứng viên (Scout)', desc: 'Tìm kiếm trong kho ứng viên', color: 'text-blue-500', bg: 'bg-blue-50', path: '/business/scout' },
  { icon: UserPlus, title: 'Dùng Scout Performance', desc: 'Yêu cầu WS hỗ trợ giới thiệu', color: 'text-emerald-500', bg: 'bg-emerald-50', path: '/business/scout' },
  { icon: FilePlus2, title: 'Tạo Landing Page', desc: 'Tạo trang tuyển dụng miễn phí', color: 'text-amber-500', bg: 'bg-amber-50', path: '/business/saiyo' },
  { icon: Briefcase, title: 'Đăng job lên Sàn CTV', desc: 'Kết nối với CTV HR Partner', color: 'text-rose-500', bg: 'bg-rose-50', path: '/business/candidate-sharing' },
  { icon: BookOpen, title: 'Xem hướng dẫn', desc: 'Hướng dẫn sử dụng platform', color: 'text-slate-500', bg: 'bg-slate-100', path: '/business/knowledge' },
]

const notifications = [
  { dot: 'bg-emerald-500', text: 'Có 3 ứng viên mới phù hợp với Mechanical Engineer', time: '10 phút trước' },
  { dot: 'bg-emerald-500', text: 'Ứng viên T.N.H đã trả lời tin nhắn', time: '1 giờ trước' },
  { dot: 'bg-blue-500', text: 'Yêu cầu Scout Performance mới', time: '2 giờ trước' },
  { dot: 'bg-rose-500', text: 'JD "QA Engineer" chưa có ứng viên sau 7 ngày', time: '3 giờ trước', warn: true },
]

const news = [
  { title: 'Báo cáo thị trường lao động IT Nhật Bản Q2/2024', date: '20/05/2024', img: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=200&h=150&fit=crop' },
  { title: '5 cách thu hút ứng viên kỹ thuật hiệu quả', date: '18/05/2024', img: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=200&h=150&fit=crop' },
]

const jobs = [
  {
    name: 'Mechanical Engineer',
    jp: '(設計エンジニア)',
    status: 'Tốt',
    statusColor: 'bg-emerald-100 text-emerald-700',
    statusDot: 'bg-emerald-500',
    services: [{ label: 'Scout Credit', color: 'text-blue-500' }, { label: 'Branding LP', color: 'text-rose-500' }],
    total: 45,
    matched: 18,
    rate: 40,
    rateColor: 'bg-emerald-500',
    time: '3 ngày',
  },
  {
    name: 'IT Developer',
    jp: '(システムエンジニア)',
    status: 'Cần cải thiện',
    statusColor: 'bg-amber-100 text-amber-700',
    statusDot: 'bg-amber-500',
    services: [{ label: 'Scout Performance', color: 'text-blue-500' }, { label: 'Sàn CTV', color: 'text-violet-500' }],
    total: 28,
    matched: 7,
    rate: 25,
    rateColor: 'bg-amber-500',
    time: '5 ngày',
  },
  {
    name: 'Production Staff',
    jp: '(生産スタッフ)',
    status: 'Tốt',
    statusColor: 'bg-emerald-100 text-emerald-700',
    statusDot: 'bg-emerald-500',
    services: [{ label: 'Sàn CTV', color: 'text-violet-500' }],
    total: 63,
    matched: 20,
    rate: 32,
    rateColor: 'bg-amber-500',
    time: '2 ngày',
  },
  {
    name: 'Sales Executive',
    jp: '(営業担当)',
    status: 'Cảnh báo',
    statusColor: 'bg-orange-100 text-orange-700',
    statusDot: 'bg-orange-500',
    services: [{ label: 'Scout Credit', color: 'text-blue-500' }],
    total: 12,
    matched: 2,
    rate: 16,
    rateColor: 'bg-rose-500',
    time: '6 ngày',
  },
  {
    name: 'QA Engineer',
    jp: '(QAエンジニア)',
    status: 'Nguy hiểm',
    statusColor: 'bg-rose-100 text-rose-700',
    statusDot: 'bg-rose-500',
    services: [{ label: 'Scout Credit', color: 'text-blue-500' }],
    total: 0,
    matched: 0,
    rate: 0,
    rateColor: 'bg-rose-500',
    time: '8 ngày',
  },
]

const solutionCards = [
  {
    num: '01',
    title: 'Scout Credit',
    subtitle: 'Tự chủ tìm kiếm ứng viên',
    theme: {
      badge: 'bg-blue-600',
      border: 'border-blue-100',
      bg: 'bg-gradient-to-b from-blue-50 to-white',
      btn: 'bg-blue-600 hover:bg-blue-700',
      accent: 'text-blue-600',
    },
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=280&fit=crop',
    features: ['Tìm kiếm & unlock hồ sơ', 'Chủ động tiếp cận ứng viên', 'Quản lý credit linh hoạt'],
    suitableFor: 'Doanh nghiệp muốn chủ động sourcing',
    footer: 'Chỉ từ 1,000 credit',
    path: '/business/scout',
  },
  {
    num: '02',
    title: 'Scout Performance',
    subtitle: 'WS hỗ trợ tìm & tiếp cận ứng viên',
    theme: {
      badge: 'bg-emerald-600',
      border: 'border-emerald-100',
      bg: 'bg-gradient-to-b from-emerald-50 to-white',
      btn: 'bg-emerald-600 hover:bg-emerald-700',
      accent: 'text-emerald-600',
    },
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=280&fit=crop',
    features: ['WS tìm & gợi ý ứng viên', 'Chat trực tiếp với đội ngũ', 'Tiết kiệm thời gian HR'],
    suitableFor: 'Vị trí khó tuyển, cần hỗ trợ chuyên sâu',
    footer: 'Hiệu quả – Tiết kiệm thời gian',
    path: '/business/scout',
  },
  {
    num: '03',
    title: 'Saiyo Branding',
    subtitle: 'Xây dựng thương hiệu tuyển dụng',
    theme: {
      badge: 'bg-violet-600',
      border: 'border-violet-100',
      bg: 'bg-gradient-to-b from-violet-50 to-white',
      btn: 'bg-violet-600 hover:bg-violet-700',
      accent: 'text-violet-600',
    },
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=280&fit=crop',
    features: ['Landing page tuyển dụng', 'JD chuẩn đa ngôn ngữ', 'Thu hút ứng viên chủ động'],
    suitableFor: 'Tăng nhận diện thương hiệu employer',
    footer: 'Tăng nhận diện – Thu hút nhân tài',
    path: '/business/saiyo',
  },
  {
    num: '04',
    title: 'Sàn CTV (HR Partner)',
    subtitle: 'Mạng lưới tuyển dụng mở rộng',
    theme: {
      badge: 'bg-orange-500',
      border: 'border-orange-100',
      bg: 'bg-gradient-to-b from-orange-50 to-white',
      btn: 'bg-orange-500 hover:bg-orange-600',
      accent: 'text-orange-600',
    },
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=280&fit=crop',
    features: ['Kết nối CTV HR Partner', 'Tiến cử ứng viên chất lượng', 'Mở rộng nguồn nhanh'],
    suitableFor: 'Tuyển số lượng lớn, đa vị trí',
    footer: 'Mở rộng nhanh – Chi phí tối ưu',
    path: '/business/candidate-sharing',
  },
]

const scrollbarHideStyle = `
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
`

const Sparkline = ({ points, color }) => (
  <svg viewBox="0 0 105 32" className="w-full h-9" preserveAspectRatio="none">
    <polyline
      points={points}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ScoreCard = ({ m }) => {
  const Icon = m.icon
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-2 flex flex-col gap-1.5 min-w-0">
      <div className="flex items-center gap-1.5">
        <div className={`w-5 h-5 rounded-lg ${m.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-3 h-3 ${m.iconColor}`} />
        </div>
        <span className="text-[9px] font-medium text-slate-500 truncate">{m.label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-base font-bold text-slate-800">{m.score}<span className="text-[10px] text-slate-400 font-medium">/100</span></span>
        <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full ${m.statusColor}`}>{m.status}</span>
      </div>
      <Sparkline points={m.points} color={m.lineColor} />
      <div className="text-[8px] text-emerald-600 font-medium">↑ {m.change}</div>
    </div>
  )
}

const ActionCard = ({ c }) => {
  const Icon = c.icon
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-2 flex flex-col gap-1 h-full`}>
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <Icon className={`w-2.5 h-2.5 ${c.iconColor}`} />
        </div>
        <div className="leading-tight min-w-0">
          <div className="text-[9px] font-semibold text-slate-800 truncate">{c.title}</div>
          <div className={`text-[8px] font-semibold ${c.tagColor} whitespace-nowrap`}>{c.tag}</div>
        </div>
      </div>
      <p className="text-[8px] text-slate-500 leading-snug flex-1">{c.desc}</p>
      <button type="button" className={`${c.buttonColor} text-white text-[8px] font-semibold rounded-lg py-1 px-2 transition-colors w-full leading-tight mt-auto min-h-[28px] flex items-center justify-center text-center`}>
        {c.button}
      </button>
    </div>
  )
}

function SolutionCard({ card, onUse }) {
  return (
    <div className={`rounded-2xl border ${card.theme.border} ${card.theme.bg} p-3 flex flex-col h-full shadow-sm`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-white text-[10px] font-bold ${card.theme.badge}`}>
            {card.num}
          </span>
          <h3 className="text-sm font-bold text-slate-800 mt-2">{card.title}</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">{card.subtitle}</p>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden bg-white/60 border border-white/80 mb-3 aspect-[4/3]">
        <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
      </div>

      <ul className="flex flex-col gap-1.5 mb-3 flex-1">
        {card.features.map((f) => (
          <li key={f} className="flex items-start gap-1.5 text-[10px] text-slate-600">
            <Check className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${card.theme.accent}`} />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <p className="text-[9px] text-slate-500 mb-2">
        <span className="font-semibold text-slate-600">Phù hợp:</span> {card.suitableFor}
      </p>

      <button
        type="button"
        onClick={() => onUse(card.path)}
        className={`w-full ${card.theme.btn} text-white text-[11px] font-semibold rounded-xl py-2.5 transition-colors`}
      >
        Sử dụng ngay
      </button>

      <p className={`text-[9px] font-medium text-center mt-2 ${card.theme.accent}`}>{card.footer}</p>
    </div>
  )
}

function HomepageSidebar({ onNavigate }) {
  return (
    <div className="flex flex-col gap-2 lg:gap-3 min-w-0 overflow-y-auto pr-1 scrollbar-hide">
      <div className="bg-white rounded-xl border border-slate-100 p-2 lg:p-2.5">
        <h2 className="text-xs font-bold text-slate-800 mb-1.5">Thao tác nhanh</h2>
        <div className="flex flex-col gap-0.5">
          {quickActions.map((a) => {
            const Icon = a.icon
            return (
              <button
                key={a.title}
                type="button"
                onClick={() => onNavigate(a.path)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 transition-colors text-left w-full"
              >
                <div className={`w-6 h-6 rounded-lg ${a.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-3 h-3 ${a.color}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] font-semibold text-slate-800">{a.title}</div>
                  <div className="text-[8px] text-slate-400 truncate">{a.desc}</div>
                </div>
                <span className="ml-auto text-slate-300 flex-shrink-0 text-[10px]">›</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-2 lg:p-2.5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            Thông báo
            <span className="bg-rose-500 text-white text-[8px] font-bold rounded-full px-1.5 py-0.5">4</span>
          </h2>
          <button type="button" className="text-[9px] font-semibold text-blue-600">Xem tất cả</button>
        </div>
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <div key={n.text} className="flex items-start gap-1.5">
              {n.warn
                ? <AlertTriangle className="w-3 h-3 text-rose-500 mt-0.5 flex-shrink-0" />
                : <span className={`w-1.5 h-1.5 rounded-full ${n.dot} mt-1 flex-shrink-0`} />}
              <div className="min-w-0">
                <p className="text-[9px] text-slate-700 leading-snug">{n.text}</p>
                <p className="text-[8px] text-slate-400 mt-0.5">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-2 lg:p-2.5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-slate-800">Tin tức &amp; Insights</h2>
          <button type="button" className="text-[9px] font-semibold text-blue-600">Xem tất cả</button>
        </div>
        <div className="flex flex-col gap-2">
          {news.map((n) => (
            <div key={n.title} className="flex gap-2">
              <img src={n.img} alt={n.title} className="w-12 h-9 rounded-lg object-cover flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-medium text-slate-700 leading-snug line-clamp-2">{n.title}</p>
                <p className="text-[8px] text-slate-400 mt-0.5">{n.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function OnboardingView({ displayName, onNavigate }) {
  return (
    <>
      <div>
        <h1 className="text-sm lg:text-base font-bold text-slate-800 flex items-center gap-1.5">
          Xin chào, {displayName} <span className="inline-block text-sm">👋</span>
        </h1>
        <p className="text-[10px] lg:text-xs text-slate-500 mt-0.5 max-w-2xl">
          JobShare là nền tảng tuyển dụng thông minh giúp doanh nghiệp tìm kiếm, tiếp cận và quản lý ứng viên hiệu quả.
        </p>
      </div>

      <div>
        <h2 className="text-xs lg:text-sm font-bold text-slate-800 mb-2">
          Khám phá 4 giải pháp tuyển dụng tối ưu cùng JobShare
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-stretch">
          {solutionCards.map((card) => (
            <SolutionCard key={card.num} card={card} onUse={onNavigate} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-sky-100 bg-sky-50/80 px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white border border-sky-100 flex items-center justify-center flex-shrink-0">
            <Scale className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-[10px] text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">Không chắc giải pháp nào phù hợp?</span>
            {' '}Đội ngũ chuyên gia của JobShare sẵn sàng tư vấn miễn phí cho doanh nghiệp của bạn.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('/business/messages?tab=ws')}
          className="flex-shrink-0 bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-semibold rounded-lg px-4 py-2 transition-colors"
        >
          Nhận tư vấn ngay
        </button>
      </div>
    </>
  )
}

function DashboardView({ displayName }) {
  return (
    <>
      <div>
        <h1 className="text-sm lg:text-base font-bold text-slate-800 flex items-center gap-1.5">
          Xin chào, {displayName} <span className="inline-block text-sm">👋</span>
        </h1>
        <p className="text-[10px] lg:text-xs text-slate-500 mt-0.5">Bạn đang cần gì hôm nay?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-stretch">
        {actionCards.map((c) => <ActionCard key={c.title} c={c} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3 items-stretch">
        <div className="bg-white rounded-xl border border-slate-100 p-2 lg:p-2.5 flex flex-col">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-1.5">
            <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1">
              Recruitment Health
              <span className="text-slate-300 text-[10px]">ⓘ</span>
            </h2>
            <select className="text-[9px] border border-slate-200 rounded-lg px-2 py-0.5 text-slate-600 bg-white">
              <option>7 ngày qua</option>
              <option>30 ngày qua</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2 flex-1">
            {healthMetrics.map((m) => <ScoreCard key={m.label} m={m} />)}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-2 lg:p-2.5 flex flex-col">
          <h2 className="text-xs font-bold text-slate-800 mb-2">Tổng quan nhanh</h2>
          <div className="flex flex-col gap-2.5 flex-1">
            {quickStats.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 min-w-0">
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${s.color}`} />
                    <span className="truncate">{s.label}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 flex-shrink-0">{s.value}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-2 lg:p-2.5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-slate-800">Danh sách JD (Anken)</h2>
          <button type="button" className="text-[9px] font-semibold text-blue-600 hover:text-blue-700">Xem tất cả JD</button>
        </div>
        <div className="overflow-x-auto -mx-2 lg:-mx-2.5">
          <table className="w-full text-left text-[9px] table-fixed">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[11%]" />
              <col className="w-[14%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
              <col className="w-[15%]" />
              <col className="w-[8%]" />
              <col className="w-[17%]" />
            </colgroup>
            <thead>
              <tr className="text-[8px] text-slate-400 uppercase">
                <th className="font-medium px-2 lg:px-2.5 py-1.5">JD / Vị trí</th>
                <th className="font-medium px-1 py-1.5">Trạng thái</th>
                <th className="font-medium px-1 py-1.5">Dịch vụ</th>
                <th className="font-medium px-1 py-1.5 text-right">Tổng</th>
                <th className="font-medium px-1 py-1.5 text-right">Phù hợp</th>
                <th className="font-medium px-1 py-1.5">Hiệu quả</th>
                <th className="font-medium px-1 py-1.5">Đăng</th>
                <th className="font-medium px-1 lg:px-2.5 py-1.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.name} className="border-t border-slate-100">
                  <td className="px-2 lg:px-2.5 py-2">
                    <div className="font-semibold text-slate-800 text-[10px] truncate">{j.name}</div>
                    <div className="text-[8px] text-slate-400 truncate">{j.jp}</div>
                  </td>
                  <td className="px-1 py-2">
                    <span className={`inline-flex items-center gap-1 text-[8px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${j.statusColor}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${j.statusDot}`} />
                      {j.status}
                    </span>
                  </td>
                  <td className="px-1 py-2">
                    <div className="flex flex-col gap-0.5">
                      {j.services.map((s) => (
                        <span key={s.label} className={`text-[8px] font-medium truncate ${s.color}`}>● {s.label}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-1 py-2 text-right text-slate-700">{j.total}</td>
                  <td className="px-1 py-2 text-right text-slate-700">{j.matched}</td>
                  <td className="px-1 py-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] font-semibold text-slate-700 w-5 flex-shrink-0">{j.rate}%</span>
                      <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${j.rateColor} rounded-full`} style={{ width: `${j.rate}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-1 py-2 text-slate-500 whitespace-nowrap">{j.time}</td>
                  <td className="px-1 lg:px-2.5 py-2 text-right whitespace-nowrap">
                    <button type="button" className="text-[8px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg px-1.5 py-0.5">Chi tiết</button>
                    <button type="button" className="ml-1 text-slate-400 hover:text-slate-600 text-[10px]">⋮</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

const Homepage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [hasData, setHasData] = useState(false)
  const [displayName, setDisplayName] = useState('bạn')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [profileRes, jobsRes, statsRes] = await Promise.all([
          apiService.getBusinessProfile().catch(() => null),
          apiService.getBusinessJobs({ page: 1, limit: 1 }).catch(() => null),
          apiService.getBusinessApplicationStats().catch(() => null),
        ])

        if (cancelled) return

        const business = profileRes?.data?.business || profileRes?.data || null
        const name = business?.contactName || business?.companyName
        if (name) setDisplayName(name)

        const jobTotal = Number(jobsRes?.data?.pagination?.total ?? jobsRes?.data?.total ?? 0)
        const appTotal = Number(statsRes?.data?.stats?.total ?? statsRes?.data?.total ?? 0)
        setHasData(jobTotal > 0 || appTotal > 0)
      } catch (e) {
        console.error(e)
        setHasData(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const handleNavigate = useMemo(() => (path) => navigate(path), [navigate])

  if (loading) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <>
      <style>{scrollbarHideStyle}</style>
      <div className="h-screen bg-slate-50 p-2 lg:p-3 overflow-hidden">
        <div className="max-w-[1440px] mx-auto h-full grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-2 lg:gap-3">
          <div className="flex flex-col gap-2 lg:gap-3 min-w-0 overflow-y-auto pr-1 scrollbar-hide">
            {hasData
              ? <DashboardView displayName={displayName} />
              : <OnboardingView displayName={displayName} onNavigate={handleNavigate} />}
          </div>

          <HomepageSidebar onNavigate={handleNavigate} />
        </div>
      </div>
    </>
  )
}

export default Homepage
