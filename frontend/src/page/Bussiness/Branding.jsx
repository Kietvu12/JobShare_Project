import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Plus,
  Bookmark,
  BarChart3,
  Users,
  TrendingUp,
  Loader2,
  Check,
  ArrowUpRight,
  Sparkles,
  Megaphone,
  CalendarDays,
  Building2,
} from 'lucide-react'
import apiService from '../../services/api'
import TemplateSlidePanel from '../../component/BusinessBranding/TemplateSlidePanel'
import { isCompanyBuilderContent } from '../../utils/companyLandingPageSchema'
import { HomepageSidebar } from './Homepage'

const PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif"
const BRAND = '#0077B6'

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
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
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
    .biz-hp-solution-card-wrap { animation: none; }
    .biz-hp-solution-card { transition: none; }
    .biz-hp-solution-card:hover { transform: none; }
  }
`

const CARD_SURFACE = {
  brandLight: 'bg-[#e8f4fa] border border-[#cce5f0]/80 text-slate-900',
  neutral: 'bg-white border border-slate-200/90 text-slate-900',
  primary: 'bg-[#0077B6] border border-[#0077B6] text-white shadow-sm shadow-[#0077B6]/15',
}

const STATUS_STYLE = {
  'Nháp': { color: '#64748b', bg: '#f1f5f9' },
  'Đang hoạt động': { color: '#10b981', bg: '#d1fae5' },
  'Tạm dừng': { color: '#f59e0b', bg: '#fef3c7' },
  'Đã đóng': { color: '#dc2626', bg: '#fee2e2' },
}

const SERVICE_PACKAGES = [
  {
    id: 'landing',
    num: '01',
    title: 'Landing page chuyên nghiệp',
    subtitle: 'Trang tuyển dụng theo thương hiệu',
    variant: 'primary',
    icon: Sparkles,
    features: [
      'Thiết kế theo thương hiệu doanh nghiệp',
      'Tối ưu hiển thị mobile',
      'Form ứng tuyển thông minh',
      'Tích hợp JobShare',
      'Báo cáo lượt xem & ứng tuyển',
    ],
    suitableFor: 'Doanh nghiệp cần trang tuyển dụng chuẩn employer branding, tối ưu chuyển đổi ứng viên.',
    action: 'landing',
  },
  {
    id: 'recruitment_ads',
    num: '02',
    title: 'Quảng cáo tuyển dụng',
    subtitle: 'Tiếp cận ứng viên đa kênh',
    variant: 'brandLight',
    icon: Megaphone,
    features: [
      'Quảng cáo FB, IG, LinkedIn, Google',
      'Targeting chính xác theo JD',
      'Tối ưu ngân sách & hiệu quả',
      'Báo cáo realtime',
      'Hỗ trợ triển khai A-Z',
    ],
    suitableFor: 'Doanh nghiệp muốn mở rộng reach và thu hút ứng viên tiềm năng nhanh.',
    action: 'admin_request',
    serviceKey: 'recruitment_ads',
  },
  {
    id: 'recruitment_event',
    num: '03',
    title: 'Seminar & event tuyển dụng',
    subtitle: 'Sự kiện online / offline',
    variant: 'neutral',
    icon: CalendarDays,
    features: [
      'Lên kế hoạch & kịch bản sự kiện',
      'Thiết kế banner, tài liệu',
      'Quản lý đăng ký & check-in',
      'Livestream & ghi hình',
      'Báo cáo hiệu quả sau sự kiện',
    ],
    suitableFor: 'Doanh nghiệp tổ chức hội thảo, job fair hoặc buổi giới thiệu công ty.',
    action: 'admin_request',
    serviceKey: 'recruitment_event',
  },
  {
    id: 'company_profile',
    num: '04',
    title: 'Company profile',
    subtitle: 'Hồ sơ năng lực chuẩn thương hiệu',
    variant: 'neutral',
    icon: Building2,
    features: [
      'Thiết kế hiện đại, bắt mắt',
      'Nội dung chuẩn SEO',
      'Đa định dạng (PDF, Online)',
      'Hỗ trợ chỉnh sửa & cập nhật',
      'Bàn giao file & hướng dẫn sử dụng',
    ],
    suitableFor: 'Doanh nghiệp cần bộ tài liệu giới thiệu công ty thống nhất trên mọi kênh.',
    action: 'admin_request',
    serviceKey: 'company_profile',
  },
]

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('vi-VN')
  } catch {
    return '—'
  }
}

function BrandingServiceCard({ card, onUse, loadingKey }) {
  const isOnDark = card.variant === 'primary'
  const surface = CARD_SURFACE[card.variant] || CARD_SURFACE.neutral
  const DecoIcon = card.icon
  const busy = Boolean(loadingKey && (loadingKey === card.serviceKey || loadingKey === card.id))

  const bodyClass = isOnDark ? 'text-white/95' : 'text-slate-600'
  const mutedClass = isOnDark ? 'text-white/85' : 'text-slate-500'

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
          disabled={busy}
          onClick={() => onUse(card)}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-60 ${
            isOnDark
              ? 'bg-white/15 text-white hover:bg-white/25'
              : 'bg-white text-slate-600 shadow-sm ring-1 ring-slate-100 hover:text-[#0077B6]'
          }`}
          aria-label={`Sử dụng ${card.title}`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" strokeWidth={2} />}
        </button>
      </div>

      <div className="relative z-10 mt-2 pr-14">
        <h3 className="line-clamp-2 text-base font-bold leading-tight sm:text-lg">{card.title}</h3>
        <p className={`mt-1 line-clamp-2 text-xs leading-snug sm:text-[13px] ${mutedClass}`}>{card.subtitle}</p>
      </div>

      <div className="pointer-events-none absolute right-0 top-[3.25rem] z-0 translate-x-[18%]" aria-hidden>
        <DecoIcon
          className={`h-[6.5rem] w-[6.5rem] sm:h-28 sm:w-28 ${isOnDark ? 'text-white/30' : 'text-[#0077B6]/22'}`}
          strokeWidth={1.1}
        />
      </div>

      <div className="relative z-10 mt-3 flex min-h-0 flex-col">
        <h4 className={`shrink-0 text-xs font-bold sm:text-[13px] ${isOnDark ? 'text-white' : 'text-[#0077B6]'}`}>
          Tính năng nổi bật
        </h4>
        <ul className={`mt-2 flex min-h-0 flex-1 flex-col gap-2 text-[11px] leading-snug sm:text-xs ${bodyClass}`}>
          {card.features.map((line) => (
            <li key={line} className="flex gap-2">
              <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isOnDark ? 'text-white' : 'text-[#0077B6]'}`} strokeWidth={2.5} />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={`relative z-10 mt-3 shrink-0 border-t pt-3 ${isOnDark ? 'border-white/20' : 'border-slate-200/80'}`}>
        <h4 className={`text-xs font-bold sm:text-[13px] ${isOnDark ? 'text-white' : 'text-[#0077B6]'}`}>Phù hợp với</h4>
        <p className={`mt-1.5 min-h-[2.75rem] text-[11px] leading-snug sm:text-xs ${bodyClass}`}>{card.suitableFor}</p>
        <button
          type="button"
          disabled={busy}
          onClick={() => onUse(card)}
          className={`mt-2.5 w-full rounded-lg py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
            isOnDark
              ? 'bg-white/20 text-white hover:bg-white/30'
              : 'bg-[#0077B6] text-white hover:bg-[#006399] shadow-sm shadow-[#0077B6]/15'
          }`}
        >
          {busy ? 'Đang gửi...' : 'Sử dụng ngay'}
        </button>
      </div>
    </article>
  )
}

function BrandingOverviewMain({ onPackageUse, onConsultation, requestLoadingKey }) {
  return (
    <div className="flex flex-col gap-2">
      <header className="shrink-0">
        <h1 className="text-lg font-bold leading-tight text-slate-900 sm:text-xl">Saiyo Branding</h1>
        <p className="mt-1 text-xs leading-snug text-slate-600 sm:text-sm">
          Xây dựng thương hiệu tuyển dụng — gói dịch vụ, landing page, thống kê hiệu quả và form ứng tuyển.
        </p>
      </header>

      <div className="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {SERVICE_PACKAGES.map((card, index) => (
          <div
            key={card.num}
            className="biz-hp-solution-card-wrap"
            style={{ animationDelay: `${0.06 + index * 0.1}s` }}
          >
            <BrandingServiceCard card={card} onUse={onPackageUse} loadingKey={requestLoadingKey} />
          </div>
        ))}
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 flex-1 text-xs leading-snug text-slate-700">
          <span className="font-semibold text-slate-900">Không chắc gói nào phù hợp?</span>
          {' '}
          JobShare tư vấn miễn phí cho doanh nghiệp của bạn.
        </p>
        <button
          type="button"
          disabled={requestLoadingKey === 'consultation'}
          onClick={onConsultation}
          className="shrink-0 rounded-lg bg-[#0077B6] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#006399] disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {requestLoadingKey === 'consultation' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Nhận tư vấn ngay
        </button>
      </div>
    </div>
  )
}

function BrandingStatsSection({
  statCards,
  displayPages,
  activities,
  setShowCreate,
  openEditor,
  copyPublicLink,
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-bold text-slate-900 sm:text-base">Thống kê &amp; landing page</h2>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {statCards.map((s, i) => {
          const Icon = s.icon
          const accent = i === 0
          return (
            <div
              key={i}
              className={`rounded-xl border p-3 shadow-sm ${accent ? 'border-[#cce5f0]/80 bg-[#e8f4fa]' : 'border-slate-200/90 bg-white'}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: accent ? 'rgba(0,119,182,0.12)' : `${s.color}20` }}>
                  <Icon className="h-4 w-4" style={{ color: accent ? BRAND : s.color }} />
                </div>
                <span className="text-[10px] font-medium leading-snug text-slate-500 sm:text-xs">{s.label}</span>
              </div>
              <div className="text-xl font-bold tabular-nums text-slate-800">{s.value}</div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-2 lg:grid-cols-[220px_1fr]">
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm h-fit">
          <div className="flex flex-col items-center text-center">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-[#e8f4fa] text-xl">📄</div>
            <h2 className="mb-1.5 text-xs font-bold text-slate-800">Trang giới thiệu DN</h2>
            <p className="mb-3 text-[10px] leading-snug text-slate-500">Template, đa trang, motion, SEO</p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex w-full items-center justify-center gap-1 rounded-lg bg-[#0077B6] py-2 px-3 text-xs font-semibold text-white transition-colors hover:bg-[#006399]"
            >
              <Plus className="h-3.5 w-3.5" />
              Tạo
            </button>
          </div>
        </div>

        <div className="min-w-0 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 sm:text-sm">Tất cả landing pages</h2>
            <button type="button" onClick={() => setShowCreate(true)} className="text-[10px] font-semibold text-[#0077B6] hover:text-[#006399] sm:text-xs">
              + Tạo mới
            </button>
          </div>

          {displayPages.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">Chưa có landing page. Bấm Tạo để bắt đầu.</div>
          ) : (
            <div className="overflow-x-auto business-homepage-scroll">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-400">
                    <th className="px-2 py-2 text-left font-semibold">Tên</th>
                    <th className="px-2 py-2 text-left font-semibold">Loại</th>
                    <th className="px-2 py-2 text-center font-semibold">Lượt xem</th>
                    <th className="px-2 py-2 text-center font-semibold">Form</th>
                    <th className="px-2 py-2 font-semibold">Trạng thái</th>
                    <th className="px-2 py-2 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {displayPages.map((p) => {
                    const st = STATUS_STYLE[p.statusLabel] || STATUS_STYLE['Nháp']
                    return (
                      <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="px-2 py-2 font-semibold text-slate-800">{p.title}</td>
                        <td className="px-2 py-2 text-slate-500">
                          {p.builderType === 'company' || isCompanyBuilderContent(p.content) ? 'Giới thiệu DN' : (p.job?.title || p.job?.jobCode || 'Tuyển dụng')}
                        </td>
                        <td className="px-2 py-2 text-center tabular-nums text-slate-600">{p.viewsCount}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-slate-600">{p.formSubmissionsCount}</td>
                        <td className="px-2 py-2">
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ color: st.color, background: st.bg }}>
                            {p.statusLabel}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-right">
                          <div className="flex flex-wrap justify-end gap-1">
                            <button type="button" onClick={() => openEditor(p)} className="rounded-md bg-[#e8f4fa] px-2 py-1 text-[10px] font-semibold text-[#0077B6] hover:bg-[#cce5f0]">Sửa</button>
                            {p.status === 1 && (
                              <>
                                <button type="button" onClick={() => copyPublicLink(p)} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-200">Copy link</button>
                                <a href={p.publicPath} target="_blank" rel="noreferrer" className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 no-underline hover:bg-slate-200">Xem</a>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
        <h2 className="mb-3 text-xs font-bold text-[#0077B6]">Hoạt động gần đây</h2>
        {activities.length === 0 ? (
          <div className="text-xs text-slate-400">Chưa có hoạt động</div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {activities.map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="flex-1 text-xs text-slate-700">{a.message}</div>
                <div className="shrink-0 whitespace-nowrap text-[10px] text-slate-400">{formatDate(a.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BrandingUnifiedMain({
  onPackageUse,
  onConsultation,
  requestLoadingKey,
  statCards,
  displayPages,
  activities,
  setShowCreate,
  openEditor,
  copyPublicLink,
}) {
  return (
    <div className="flex min-h-0 flex-col gap-4 pb-2">
      <BrandingOverviewMain
        onPackageUse={onPackageUse}
        onConsultation={onConsultation}
        requestLoadingKey={requestLoadingKey}
      />
      <BrandingStatsSection
        statCards={statCards}
        displayPages={displayPages}
        activities={activities}
        setShowCreate={setShowCreate}
        openEditor={openEditor}
        copyPublicLink={copyPublicLink}
      />
    </div>
  )
}

const Branding = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState(null)
  const [landingPages, setLandingPages] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [requestLoadingKey, setRequestLoadingKey] = useState(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [dashRes, listRes] = await Promise.all([
        apiService.getBusinessLandingPageDashboard(),
        apiService.getBusinessLandingPages({ page: 1, limit: 20 }),
      ])
      if (dashRes?.success) setDashboard(dashRes.data)
      if (listRes?.success) setLandingPages(listRes.data?.landingPages || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (location.search.includes('view=')) {
      navigate(location.pathname, { replace: true, state: location.state })
    }
  }, [location.pathname, location.search, location.state, navigate])

  useEffect(() => {
    if (location.state?.openLandingCreate) {
      setShowCreate(true)
      navigate(location.pathname + location.search, { replace: true, state: {} })
    }
  }, [location.pathname, location.search, location.state, navigate])

  const stats = dashboard?.stats || {}
  const activities = dashboard?.activities || []

  const statCards = [
    { icon: Bookmark, value: stats.views || 0, label: 'Lượt xem', color: BRAND },
    { icon: BarChart3, value: stats.formSubmissions || 0, label: 'Lượt đăng ký form', color: '#d97706' },
    { icon: Users, value: stats.candidates || 0, label: 'Hồ sơ ứng viên', color: '#0d9488' },
    { icon: TrendingUp, value: `${stats.conversionRate || 0}%`, label: 'Tỷ lệ chuyển đổi', color: '#059669' },
  ]

  const handleCreated = () => {
    loadData()
  }

  const openEditor = (p) => {
    const path = isCompanyBuilderContent(p.content) || p.builderType === 'company'
      ? `/business/saiyo/pages/${p.id}/build`
      : `/business/saiyo/pages/${p.id}/edit`
    window.open(`${window.location.origin}${path}`, '_blank', 'noopener,noreferrer')
  }

  const copyPublicLink = (lp) => {
    const url = `${window.location.origin}${lp.publicPath || `/lp/${lp.slug}`}`
    navigator.clipboard.writeText(url)
    alert('Đã copy link public')
  }

  const handleNavigate = useMemo(() => (path) => navigate(path), [navigate])

  const sendServiceRequest = async (serviceKey) => {
    setRequestLoadingKey(serviceKey)
    try {
      const res = await apiService.createBusinessSaiyoBrandingServiceRequest({ serviceKey })
      if (res?.success) {
        const go = window.confirm(
          `${res.message || 'Đã gửi yêu cầu tới JobShare WS.'}\n\nMở mục Tin nhắn để theo dõi?`
        )
        if (go) navigate('/business/messages?tab=ws')
      } else {
        alert(res?.message || 'Không gửi được yêu cầu. Vui lòng thử lại.')
      }
    } catch (e) {
      alert(e?.message || 'Không gửi được yêu cầu. Vui lòng thử lại.')
    } finally {
      setRequestLoadingKey(null)
    }
  }

  const handlePackageUse = (pkg) => {
    if (pkg.action === 'landing') {
      setShowCreate(true)
      return
    }
    if (pkg.action === 'admin_request' && pkg.serviceKey) {
      sendServiceRequest(pkg.serviceKey)
    }
  }

  const handleConsultation = () => {
    sendServiceRequest('consultation')
  }

  return (
    <>
      <style>{homepageStyles}</style>
      <TemplateSlidePanel open={showCreate} onClose={() => setShowCreate(false)} onCreated={handleCreated} />

      <div
        className="business-homepage-shell min-h-0 overflow-x-hidden bg-[#f4f6f8] xl:h-full xl:overflow-hidden"
        style={{ fontFamily: PAGE_FONT }}
      >
        <div className="business-homepage-ui w-full min-h-0 p-2.5 sm:p-3 xl:h-full xl:flex xl:flex-col">
          {loading ? (
            <div className="flex flex-1 items-center justify-center gap-2 py-20 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#0077B6]" />
              <span className="text-sm">Đang tải...</span>
            </div>
          ) : (
            <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-2.5 xl:h-full xl:grid-cols-[minmax(0,1fr)_minmax(196px,228px)] xl:gap-3 xl:overflow-hidden">
              <div className="business-homepage-scroll scrollbar-hide flex min-h-0 flex-col xl:h-full xl:overflow-y-auto xl:pr-0.5">
                <BrandingUnifiedMain
                  onPackageUse={handlePackageUse}
                  onConsultation={handleConsultation}
                  requestLoadingKey={requestLoadingKey}
                  statCards={statCards}
                  displayPages={landingPages}
                  activities={activities}
                  setShowCreate={setShowCreate}
                  openEditor={openEditor}
                  copyPublicLink={copyPublicLink}
                />
              </div>

              <div className="business-homepage-scroll scrollbar-hide min-h-0 xl:h-full xl:overflow-y-auto xl:pr-0.5">
                <HomepageSidebar onNavigate={handleNavigate} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Branding
