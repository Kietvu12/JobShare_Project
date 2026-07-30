import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Search,
  UserPlus,
  FilePlus2,
  Briefcase,
  BookOpen,
  AlertTriangle,
  ArrowUpRight,
  Users2,
  Coins,
  Check,
} from 'lucide-react';
import useBusinessUser from '../../hooks/useBusinessUser';

const PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif";

const quickActions = [
  { icon: Sparkles, title: 'Tạo JD mới (AI)', desc: 'Tạo JD miễn phí bằng AI', path: '/business/jobs' },
  { icon: Search, title: 'Tìm ứng viên (Scout)', desc: 'Tìm kiếm trong kho ứng viên', path: '/business/scout' },
  { icon: UserPlus, title: 'Dùng Scout Performance', desc: 'Yêu cầu WS hỗ trợ giới thiệu', path: '/business/scout' },
  { icon: FilePlus2, title: 'Tạo Landing Page', desc: 'Tạo trang tuyển dụng miễn phí', path: '/business/saiyo' },
  { icon: Briefcase, title: 'Đăng job lên Sàn CTV', desc: 'Kết nối CTV HR Partner', path: '/business/candidate-sharing' },
  { icon: BookOpen, title: 'Xem hướng dẫn', desc: 'Hướng dẫn sử dụng platform', path: '/business/knowledge' },
];

const notifications = [
  { dot: 'bg-[#0077B6]', text: 'Có 3 ứng viên mới phù hợp với Mechanical Engineer', time: '10 phút trước' },
  { dot: 'bg-[#0077B6]', text: 'Ứng viên T.N.H đã trả lời tin nhắn', time: '1 giờ trước' },
  { dot: 'bg-slate-400', text: 'Yêu cầu Scout Performance mới', time: '2 giờ trước' },
  { dot: 'bg-rose-500', text: 'JD "QA Engineer" chưa có ứng viên sau 7 ngày', time: '3 giờ trước', warn: true },
];

const news = [
  {
    title: 'Báo cáo thị trường lao động IT Nhật Bản Q2/2024',
    date: '20/05/2024',
    img: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=200&h=150&fit=crop',
  },
  {
    title: '5 cách thu hút ứng viên kỹ thuật hiệu quả',
    date: '18/05/2024',
    img: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=200&h=150&fit=crop',
  },
];

const solutionCards = [
  {
    num: '01',
    title: 'Scout Credit',
    subtitle: 'Tự chủ tìm kiếm ứng viên',
    variant: 'brandLight',
    icon: Coins,
    features: [
      'Tìm kiếm ứng viên từ hàng triệu hồ sơ chất lượng',
      'Xem thông tin chi tiết hồ sơ ứng viên',
      'Liên hệ trực tiếp với ứng viên quan tâm',
      'Lưu trữ và quản lý ứng viên yêu thích',
      'Thanh toán linh hoạt theo nhu cầu',
    ],
    suitableFor:
      'Doanh nghiệp chủ động tìm ứng viên, cần linh hoạt và kiểm soát chi phí tuyển dụng.',
    path: '/business/scout',
  },
  {
    num: '02',
    title: 'Scout Performance',
    subtitle: 'WS hỗ trợ tìm & tiếp cận',
    variant: 'neutral',
    icon: UserPlus,
    features: [
      'Gửi yêu cầu tìm ứng viên theo JD hoặc tiêu chí',
      'WS chủ động tiếp cận & đánh giá ứng viên',
      'Đề xuất danh sách ứng viên phù hợp',
      'Thay bạn trao đổi và sắp xếp lịch phỏng vấn',
      'Báo cáo tiến độ minh bạch thường xuyên',
    ],
    suitableFor: 'Doanh nghiệp bận rộn, thiếu thời gian tìm kiếm ứng viên chất lượng.',
    path: '/business/scout',
  },
  {
    num: '03',
    title: 'Saiyo Branding',
    subtitle: 'Thương hiệu tuyển dụng',
    variant: 'primary',
    icon: Sparkles,
    features: [
      'Thiết kế trang tuyển dụng chuyên nghiệp',
      'Quản lý và đăng tin tuyển dụng đa kênh',
      'Xây dựng nội dung thương hiệu nhà tuyển dụng',
      'Quảng bá thương hiệu trên các nền tảng số',
      'Báo cáo phân tích hiệu quả thương hiệu',
    ],
    suitableFor:
      'Doanh nghiệp muốn nâng cao thương hiệu tuyển dụng và thu hút nhân tài chất lượng cao.',
    path: '/business/saiyo',
  },
  {
    num: '04',
    title: 'Sàn CTV (HR Partner)',
    subtitle: 'Mạng lưới mở rộng',
    variant: 'neutral',
    icon: Users2,
    features: [
      'Tiếp cận mạng lưới CTV HR Partner rộng khắp',
      'Đăng job và nhận ứng viên đề cử chất lượng',
      'Hệ thống chấm điểm và đánh giá CTV minh bạch',
      'Thanh toán theo kết quả ứng viên đạt yêu cầu',
      'Quản lý toàn bộ quy trình dễ dàng trên nền tảng',
    ],
    suitableFor:
      'Doanh nghiệp cần tuyển dụng số lượng lớn hoặc mở rộng kênh tuyển dụng nhanh chóng.',
    path: '/business/candidate-sharing',
  },
];

const CARD_SURFACE = {
  brandLight: 'bg-[#e8f4fa] border border-[#cce5f0]/80 text-slate-900',
  neutral: 'bg-white border border-slate-200/90 text-slate-900',
  primary: 'bg-[#0077B6] border border-[#0077B6] text-white shadow-sm shadow-[#0077B6]/15',
};

const homepageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  .business-homepage-scroll::-webkit-scrollbar { width: 4px; }
  .business-homepage-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

  .business-homepage-shell { --hp-zoom: 1; }
  @media (min-width: 1024px) and (max-width: 1279px) {
    .business-homepage-shell { --hp-zoom: 0.9; }
  }
  @media (min-width: 1280px) and (max-width: 1535px) {
    .business-homepage-shell { --hp-zoom: 0.86; }
  }
  @media (min-width: 1024px) and (max-height: 760px) {
    .business-homepage-shell { --hp-zoom: 0.78; }
  }
  @media (min-width: 1024px) and (min-height: 761px) and (max-height: 860px) {
    .business-homepage-shell { --hp-zoom: 0.84; }
  }
  @media (min-width: 1536px) and (min-height: 861px) {
    .business-homepage-shell { --hp-zoom: 0.94; }
  }
  @media (min-width: 1920px) and (min-height: 900px) {
    .business-homepage-shell { --hp-zoom: 1; }
  }
  .business-homepage-ui { zoom: var(--hp-zoom); }
  @supports not (zoom: 1) {
    .business-homepage-ui {
      transform: scale(var(--hp-zoom));
      transform-origin: top left;
      width: calc(100% / var(--hp-zoom));
    }
  }

  @keyframes biz-hp-card-slide-in {
    from {
      opacity: 0;
      transform: translateY(28px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .biz-hp-solution-card-wrap {
    height: 100%;
    animation: biz-hp-card-slide-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  }
  .biz-hp-solution-card {
    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.28s ease;
    will-change: transform;
  }
  .biz-hp-solution-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 32px -12px rgba(0, 119, 182, 0.35);
  }
  .biz-hp-solution-card.biz-hp-solution-card--dark:hover {
    box-shadow: 0 16px 32px -12px rgba(0, 60, 100, 0.45);
  }
  @media (prefers-reduced-motion: reduce) {
    .biz-hp-solution-card-wrap {
      animation: none;
    }
    .biz-hp-solution-card {
      transition: none;
    }
    .biz-hp-solution-card:hover {
      transform: none;
    }
  }
`;

function SolutionCard({ card, onUse }) {
  const isOnDark = card.variant === 'primary';
  const surface = CARD_SURFACE[card.variant] || CARD_SURFACE.neutral;
  const DecoIcon = card.icon;

  const bodyClass = isOnDark ? 'text-white/95' : 'text-slate-600';
  const mutedClass = isOnDark ? 'text-white/85' : 'text-slate-500';

  return (
    <article
      className={`biz-hp-solution-card ${isOnDark ? 'biz-hp-solution-card--dark' : ''} relative grid h-full min-h-[300px] grid-rows-[2rem_4.75rem_minmax(0,1fr)_auto] overflow-hidden rounded-[1.25rem] p-3.5 sm:p-4 ${surface}`}
    >
      <div className="relative z-20 flex items-start justify-between gap-2">
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${
            isOnDark ? 'bg-white/20 text-white' : 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-100'
          }`}
        >
          {card.num}
        </span>
        <button
          type="button"
          onClick={() => onUse(card.path)}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
            isOnDark
              ? 'bg-white/15 text-white hover:bg-white/25'
              : 'bg-white text-slate-600 shadow-sm ring-1 ring-slate-100 hover:text-[#0077B6]'
          }`}
          aria-label={`Mở ${card.title}`}
        >
          <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <div className="relative z-10 mt-2 pr-14">
        <h3 className="line-clamp-2 text-base font-bold leading-tight sm:text-lg">{card.title}</h3>
        <p className={`mt-1 line-clamp-2 text-xs leading-snug sm:text-[13px] ${mutedClass}`}>{card.subtitle}</p>
      </div>

      <div
        className="pointer-events-none absolute right-0 top-[3.25rem] z-0 translate-x-[18%]"
        aria-hidden
      >
        <DecoIcon
          className={`h-[6.5rem] w-[6.5rem] sm:h-28 sm:w-28 ${
            isOnDark ? 'text-white/30' : 'text-[#0077B6]/22'
          }`}
          strokeWidth={1.1}
        />
      </div>

      <div className="relative z-10 mt-3 flex min-h-0 flex-col">
        <h4
          className={`shrink-0 text-xs font-bold sm:text-[13px] ${isOnDark ? 'text-white' : 'text-[#0077B6]'}`}
        >
          Tính năng nổi bật
        </h4>
        <ul className={`mt-2 flex min-h-0 flex-1 flex-col gap-2 text-[11px] leading-snug sm:text-xs ${bodyClass}`}>
          {card.features.map((line) => (
            <li key={line} className="flex gap-2">
              <Check
                className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isOnDark ? 'text-white' : 'text-[#0077B6]'}`}
                strokeWidth={2.5}
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div
        className={`relative z-10 mt-3 shrink-0 border-t pt-3 ${
          isOnDark ? 'border-white/20' : 'border-slate-200/80'
        }`}
      >
        <h4
          className={`text-xs font-bold sm:text-[13px] ${isOnDark ? 'text-white' : 'text-[#0077B6]'}`}
        >
          Phù hợp với
        </h4>
        <p className={`mt-1.5 min-h-[2.75rem] text-[11px] leading-snug sm:text-xs ${bodyClass}`}>
          {card.suitableFor}
        </p>
      </div>
    </article>
  );
}

function HomepageSidebar({ onNavigate }) {
  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
        <h2 className="text-xs font-bold text-slate-900">Thao tác nhanh</h2>
        <div className="mt-2.5 flex flex-col gap-1">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.title}
                type="button"
                onClick={() => onNavigate(a.path)}
                className="flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-[#e8f4fa]"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e8f4fa] text-[#0077B6]">
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold leading-snug text-slate-800">{a.title}</div>
                  <div className="truncate text-[10px] text-slate-500">{a.desc}</div>
                </div>
                <ArrowUpRight className="h-3 w-3 shrink-0 text-slate-300" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xs font-bold text-slate-900">
            Thông báo
            <span className="rounded-full bg-[#0077B6] px-1.5 py-0.5 text-[9px] font-bold text-white">4</span>
          </h2>
          <button type="button" className="shrink-0 text-[10px] font-semibold text-[#0077B6]">
            Xem tất cả
          </button>
        </div>
        <div className="flex flex-col divide-y divide-slate-100">
          {notifications.map((n) => (
            <div key={n.text} className="flex items-start gap-2.5 py-3 first:pt-0 last:pb-0">
              {n.warn ? (
                <AlertTriangle className="mt-1 h-3.5 w-3.5 shrink-0 text-rose-500" />
              ) : (
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.dot}`} />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] leading-relaxed text-slate-700">{n.text}</p>
                <p className="mt-1.5 text-[10px] leading-none text-slate-400">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-xs font-bold text-slate-900">Tin tức &amp; Insights</h2>
          <button type="button" className="shrink-0 text-[10px] font-semibold text-[#0077B6]">
            Xem tất cả
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {news.map((n) => (
            <div key={n.title} className="flex gap-2.5">
              <img src={n.img} alt="" className="h-10 w-14 shrink-0 rounded-md object-cover" />
              <div className="min-w-0">
                <p className="line-clamp-2 text-[11px] font-medium leading-relaxed text-slate-800">{n.title}</p>
                <p className="mt-1.5 text-[10px] text-slate-400">{n.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomepageMain({ displayName, onNavigate }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <header className="shrink-0">
        <h1 className="text-lg font-bold leading-tight text-slate-900 sm:text-xl">Xin chào, {displayName}</h1>
        <p className="mt-1 text-xs leading-snug text-slate-600 sm:text-sm">
          JobShare giúp doanh nghiệp tìm kiếm, tiếp cận và quản lý ứng viên hiệu quả.
        </p>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-2 sm:grid-cols-2 xl:grid-cols-4 xl:items-stretch">
        {solutionCards.map((card, index) => (
          <div
            key={card.num}
            className="biz-hp-solution-card-wrap"
            style={{ animationDelay: `${0.06 + index * 0.1}s` }}
          >
            <SolutionCard card={card} onUse={onNavigate} />
          </div>
        ))}
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 flex-1 text-xs leading-snug text-slate-700">
          <span className="font-semibold text-slate-900">Không chắc giải pháp nào phù hợp?</span>
          {' '}
          JobShare tư vấn miễn phí cho doanh nghiệp của bạn.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('/business/messages?tab=ws')}
          className="shrink-0 rounded-lg bg-[#0077B6] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#006399]"
        >
          Nhận tư vấn ngay
        </button>
      </div>
    </div>
  );
}

const Homepage = () => {
  const navigate = useNavigate();
  const { contactName, companyName } = useBusinessUser();
  const displayName = contactName || companyName || 'bạn';
  const handleNavigate = useMemo(() => (path) => navigate(path), [navigate]);

  return (
    <>
      <style>{homepageStyles}</style>
      <div
        className="business-homepage-shell min-h-0 overflow-x-hidden bg-[#f4f6f8] xl:h-full xl:overflow-hidden"
        style={{ fontFamily: PAGE_FONT }}
      >
        <div className="business-homepage-ui w-full min-h-0 p-2.5 sm:p-3 xl:h-full xl:flex xl:flex-col">
          <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-2.5 xl:h-full xl:grid-cols-[minmax(0,1fr)_minmax(196px,228px)] xl:gap-3 xl:overflow-hidden">
            <div className="business-homepage-scroll scrollbar-hide flex min-h-0 flex-col xl:h-full xl:overflow-y-auto xl:pr-0.5">
              <HomepageMain displayName={displayName} onNavigate={handleNavigate} />
            </div>

            <div className="business-homepage-scroll scrollbar-hide min-h-0 xl:h-full xl:overflow-y-auto xl:pr-0.5">
              <HomepageSidebar onNavigate={handleNavigate} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export { HomepageSidebar };
export default Homepage;
