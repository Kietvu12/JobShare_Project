import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, Search, UserPlus, FilePlus2, Briefcase, BookOpen,
  AlertTriangle, Check, Scale,
} from 'lucide-react'
import useBusinessUser from '../../hooks/useBusinessUser'

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

const homepageStyles = `
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

  .business-homepage-shell {
    --hp-zoom: 1;
  }
  @media (min-width: 1024px) and (max-width: 1279px) {
    .business-homepage-shell { --hp-zoom: 0.88; }
  }
  @media (min-width: 1280px) and (max-width: 1535px) {
    .business-homepage-shell { --hp-zoom: 0.8; }
  }
  @media (min-width: 1536px) and (max-width: 1919px) {
    .business-homepage-shell { --hp-zoom: 0.94; }
  }
  @media (min-width: 1920px) {
    .business-homepage-shell { --hp-zoom: 1; }
  }
  .business-homepage-ui {
    zoom: var(--hp-zoom);
  }
  @supports not (zoom: 1) {
    .business-homepage-ui {
      transform: scale(var(--hp-zoom));
      transform-origin: top left;
      width: calc(100% / var(--hp-zoom));
    }
  }
`

function SolutionCard({ card, onUse }) {
  return (
    <div className={`rounded-xl sm:rounded-2xl border ${card.theme.border} ${card.theme.bg} p-2.5 sm:p-3.5 2xl:p-5 flex flex-col h-full shadow-sm min-w-0 min-h-0`}>
      <div className="mb-1.5 sm:mb-2 2xl:mb-3 shrink-0">
        <span className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 rounded-md sm:rounded-lg text-white text-[9px] sm:text-[10px] 2xl:text-xs font-bold ${card.theme.badge}`}>
          {card.num}
        </span>
        <h3 className="text-sm sm:text-base 2xl:text-lg font-bold text-slate-800 mt-1.5 sm:mt-2 leading-tight">{card.title}</h3>
        <p className="text-[11px] sm:text-xs 2xl:text-sm text-slate-500 mt-0.5">{card.subtitle}</p>
      </div>

      <div className="rounded-lg sm:rounded-xl overflow-hidden bg-white/60 border border-white/80 mb-2 sm:mb-3 2xl:mb-4 flex-1 min-h-[5.5rem] sm:min-h-[6.5rem] 2xl:min-h-[9rem] max-h-32 sm:max-h-40 2xl:max-h-56">
        <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
      </div>

      <ul className="flex flex-col gap-1 sm:gap-1.5 2xl:gap-2 mb-2 sm:mb-3 shrink-0">
        {card.features.map((f) => (
          <li key={f} className="flex items-start gap-1 sm:gap-1.5 text-[11px] sm:text-xs 2xl:text-sm text-slate-600 leading-snug">
            <Check className={`w-3 h-3 sm:w-3.5 sm:h-3.5 2xl:w-4 2xl:h-4 flex-shrink-0 mt-0.5 ${card.theme.accent}`} />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <p className="text-[11px] sm:text-xs 2xl:text-sm text-slate-500 mb-1.5 sm:mb-2 2xl:mb-3 leading-snug shrink-0">
        <span className="font-semibold text-slate-600">Phù hợp:</span> {card.suitableFor}
      </p>

      <button
        type="button"
        onClick={() => onUse(card.path)}
        className={`w-full shrink-0 ${card.theme.btn} text-white text-xs sm:text-sm 2xl:text-base font-semibold rounded-lg sm:rounded-xl py-2 sm:py-2.5 2xl:py-3 transition-colors`}
      >
        Sử dụng ngay
      </button>

      <p className={`text-[11px] sm:text-xs 2xl:text-sm font-medium text-center mt-1.5 sm:mt-2 shrink-0 ${card.theme.accent}`}>{card.footer}</p>
    </div>
  )
}

function HomepageSidebar({ onNavigate }) {
  return (
    <div className="flex flex-col gap-2 sm:gap-3 2xl:gap-4 min-w-0 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:pr-1 scrollbar-hide">
      <div className="bg-white rounded-lg sm:rounded-xl border border-slate-100 p-2 sm:p-3">
        <h2 className="text-xs sm:text-sm font-bold text-slate-800 mb-1.5 sm:mb-2">Thao tác nhanh</h2>
        <div className="flex flex-col gap-0.5">
          {quickActions.map((a) => {
            const Icon = a.icon
            return (
              <button
                key={a.title}
                type="button"
                onClick={() => onNavigate(a.path)}
                className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-slate-50 transition-colors text-left w-full"
              >
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${a.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${a.color}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] sm:text-xs font-semibold text-slate-800 leading-snug">{a.title}</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">{a.desc}</div>
                </div>
                <span className="ml-auto text-slate-300 flex-shrink-0 text-xs sm:text-sm">›</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg sm:rounded-xl border border-slate-100 p-2 sm:p-3">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1 sm:gap-1.5">
            Thông báo
            <span className="bg-rose-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full px-1 sm:px-1.5 py-0.5">4</span>
          </h2>
          <button type="button" className="text-[10px] sm:text-xs font-semibold text-blue-600">Xem tất cả</button>
        </div>
        <div className="flex flex-col gap-2 sm:gap-2.5">
          {notifications.map((n) => (
            <div key={n.text} className="flex items-start gap-1.5 sm:gap-2">
              {n.warn
                ? <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                : <span className={`w-2 h-2 rounded-full ${n.dot} mt-1 flex-shrink-0`} />}
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-slate-700 leading-snug">{n.text}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg sm:rounded-xl border border-slate-100 p-2 sm:p-3">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <h2 className="text-xs sm:text-sm font-bold text-slate-800">Tin tức &amp; Insights</h2>
          <button type="button" className="text-[10px] sm:text-xs font-semibold text-blue-600">Xem tất cả</button>
        </div>
        <div className="flex flex-col gap-2 sm:gap-3">
          {news.map((n) => (
            <div key={n.title} className="flex gap-2 sm:gap-3">
              <img src={n.img} alt={n.title} className="w-12 h-9 sm:w-14 sm:h-10 rounded-md sm:rounded-lg object-cover flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-medium text-slate-700 leading-snug line-clamp-2">{n.title}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">{n.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HomepageMain({ displayName, onNavigate }) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 2xl:gap-5 min-w-0 xl:flex-1 xl:min-h-0 xl:h-full">
      <div className="shrink-0">
        <h1 className="text-lg sm:text-xl 2xl:text-2xl font-bold text-slate-800 flex items-center gap-1.5 sm:gap-2">
          Xin chào, {displayName} <span className="inline-block text-lg sm:text-xl 2xl:text-2xl">👋</span>
        </h1>
        <p className="text-xs sm:text-sm 2xl:text-base text-slate-500 mt-0.5 sm:mt-1 max-w-4xl">
          JobShare là nền tảng tuyển dụng thông minh giúp doanh nghiệp tìm kiếm, tiếp cận và quản lý ứng viên hiệu quả.
        </p>
      </div>

      <div className="flex flex-col flex-1 min-h-0 gap-2 sm:gap-3 2xl:gap-4">
        <h2 className="text-base sm:text-lg 2xl:text-xl font-bold text-slate-800 shrink-0 leading-snug">
          Khám phá 4 giải pháp tuyển dụng tối ưu cùng JobShare
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3 2xl:gap-4 items-stretch flex-1 min-h-0 auto-rows-fr">
          {solutionCards.map((card) => (
            <SolutionCard key={card.num} card={card} onUse={onNavigate} />
          ))}
        </div>
      </div>

      <div className="rounded-lg sm:rounded-xl border border-sky-100 bg-sky-50/80 px-3 py-2.5 sm:px-4 sm:py-3 2xl:px-5 2xl:py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 shrink-0 xl:mt-auto">
        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white border border-sky-100 flex items-center justify-center flex-shrink-0">
            <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600" />
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">Không chắc giải pháp nào phù hợp?</span>
            {' '}Đội ngũ chuyên gia của JobShare sẵn sàng tư vấn miễn phí cho doanh nghiệp của bạn.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('/business/messages?tab=ws')}
          className="flex-shrink-0 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-lg px-4 py-2 sm:px-5 sm:py-2.5 transition-colors"
        >
          Nhận tư vấn ngay
        </button>
      </div>
    </div>
  )
}

const Homepage = () => {
  const navigate = useNavigate()
  const { contactName, companyName } = useBusinessUser()
  const displayName = contactName || companyName || 'bạn'
  const handleNavigate = useMemo(() => (path) => navigate(path), [navigate])

  return (
    <>
      <style>{homepageStyles}</style>
      <div className="business-homepage-shell min-h-0 bg-slate-50 overflow-x-hidden xl:h-full xl:overflow-hidden">
        <div className="business-homepage-ui w-full min-h-0 p-3 sm:p-4 2xl:p-5 xl:h-full xl:flex xl:flex-col">
          <div className="w-full xl:flex-1 xl:min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] gap-3 sm:gap-4 2xl:gap-5 items-stretch">
            <div className="flex flex-col min-w-0 xl:overflow-y-auto xl:min-h-0 xl:h-full xl:pr-1 scrollbar-hide">
              <HomepageMain displayName={displayName} onNavigate={handleNavigate} />
            </div>

            <HomepageSidebar onNavigate={handleNavigate} />
          </div>
        </div>
      </div>
    </>
  )
}

export { HomepageSidebar }
export default Homepage
