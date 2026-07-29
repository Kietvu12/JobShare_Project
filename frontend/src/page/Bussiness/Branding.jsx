import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Plus, Bookmark, BarChart3, Users, TrendingUp, Loader2, Check, Headphones,
} from 'lucide-react'
import apiService from '../../services/api'
import TemplateSlidePanel from '../../component/BusinessBranding/TemplateSlidePanel'
import { isCompanyBuilderContent } from '../../utils/companyLandingPageSchema'
import { HomepageSidebar } from './Homepage'

const scrollbarStyle = `
  .branding-scrollbar::-webkit-scrollbar { width: 6px; }
  .branding-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .branding-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .branding-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  .branding-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
`

const STATUS_STYLE = {
  'Nháp': { color: '#64748b', bg: '#f1f5f9' },
  'Đang hoạt động': { color: '#10b981', bg: '#d1fae5' },
  'Tạm dừng': { color: '#f59e0b', bg: '#fef3c7' },
  'Đã đóng': { color: '#dc2626', bg: '#fee2e2' },
}

const SERVICE_PACKAGES = [
  {
    id: 'landing',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=320&fit=crop',
    title: 'Tạo landing page chuyên nghiệp',
    description: 'Trang tuyển dụng theo thương hiệu, tối ưu chuyển đổi ứng viên.',
    features: [
      'Thiết kế theo thương hiệu doanh nghiệp',
      'Tối ưu hiển thị mobile',
      'Form ứng tuyển thông minh',
      'Tích hợp JobShare',
      'Báo cáo lượt xem & ứng tuyển',
    ],
    action: 'landing',
  },
  {
    id: 'recruitment_ads',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=320&fit=crop',
    title: 'Chạy quảng cáo tuyển dụng',
    description: 'Tiếp cận ứng viên tiềm năng trên các nền tảng quảng cáo.',
    features: [
      'Quảng cáo FB, IG, LinkedIn, Google',
      'Targeting chính xác theo JD',
      'Tối ưu ngân sách & hiệu quả',
      'Báo cáo realtime',
      'Hỗ trợ triển khai A-Z',
    ],
    action: 'admin_request',
    serviceKey: 'recruitment_ads',
  },
  {
    id: 'recruitment_event',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=320&fit=crop',
    title: 'Tổ chức seminar, event tuyển dụng',
    description: 'Sự kiện online/offline thu hút và kết nối ứng viên.',
    features: [
      'Lên kế hoạch & kịch bản sự kiện',
      'Thiết kế banner, tài liệu',
      'Quản lý đăng ký & check-in',
      'Livestream & ghi hình',
      'Báo cáo hiệu quả sau sự kiện',
    ],
    action: 'admin_request',
    serviceKey: 'recruitment_event',
  },
  {
    id: 'company_profile',
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&h=320&fit=crop',
    title: 'Làm company profile (chuẩn thương hiệu)',
    description: 'Hồ sơ năng lực công ty chuyên nghiệp, chuẩn employer branding.',
    features: [
      'Thiết kế hiện đại, bắt mắt',
      'Nội dung chuẩn SEO',
      'Đa định dạng (PDF, Online)',
      'Hỗ trợ chỉnh sửa & cập nhật',
      'Bàn giao file & hướng dẫn sử dụng',
    ],
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

function ServicePackageCard({ pkg, onUse, loadingKey }) {
  const busy = Boolean(loadingKey && (loadingKey === pkg.serviceKey || loadingKey === pkg.id))
  return (
    <div className="bg-white rounded-xl border border-slate-100 flex flex-col h-full overflow-hidden shadow-sm">
      <div className="h-28 sm:h-32 overflow-hidden bg-slate-100 shrink-0">
        <img src={pkg.image} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2">
        <h3 className="text-sm font-bold text-slate-800 leading-snug">{pkg.title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{pkg.description}</p>
        <ul className="flex flex-col gap-1.5 flex-1 mt-1">
          {pkg.features.map((f) => (
            <li key={f} className="flex items-start gap-1.5 text-xs text-slate-600">
              <Check className="w-3.5 h-3.5 text-violet-600 flex-shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={busy}
          onClick={() => onUse(pkg)}
          className="mt-2 w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Sử dụng ngay
        </button>
      </div>
    </div>
  )
}

function BrandingStatsView({
  statCards,
  displayPages,
  activities,
  setShowCreate,
  openEditor,
  copyPublicLink,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 12 }}>
        <div className="bg-white rounded-xl border border-slate-100" style={{ padding: 12, height: 'fit-content' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 8 }}>📄</div>
            <h2 style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Trang giới thiệu DN</h2>
            <p style={{ fontSize: 8, color: '#64748b', marginBottom: 8 }}>Template, đa trang, motion, SEO</p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              style={{ width: '100%', fontSize: 8, fontWeight: 600, color: 'white', background: '#3b82f6', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}
            >
              <Plus style={{ width: 9, height: 9 }} />
              Tạo
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100" style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>Tất cả landing pages</h2>
            <button type="button" onClick={() => setShowCreate(true)} style={{ fontSize: 9, fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>
              + Tạo mới
            </button>
          </div>

          {displayPages.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 9, color: '#94a3b8' }}>
              Chưa có landing page. Bấm Tạo để bắt đầu.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 9, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Tên</th>
                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Loại</th>
                    <th style={{ padding: '8px', textAlign: 'center', fontWeight: 600, color: '#64748b' }}>Lượt xem</th>
                    <th style={{ padding: '8px', textAlign: 'center', fontWeight: 600, color: '#64748b' }}>Form</th>
                    <th style={{ padding: '8px', fontWeight: 600, color: '#64748b' }}>Trạng thái</th>
                    <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: '#64748b' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {displayPages.map((p) => {
                    const st = STATUS_STYLE[p.statusLabel] || STATUS_STYLE['Nháp']
                    return (
                      <tr key={p.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px', fontWeight: 600, color: '#1e293b' }}>{p.title}</td>
                        <td style={{ padding: '8px', color: '#64748b' }}>
                          {p.builderType === 'company' || isCompanyBuilderContent(p.content) ? 'Giới thiệu DN' : (p.job?.title || p.job?.jobCode || 'Tuyển dụng')}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center', color: '#475569' }}>{p.viewsCount}</td>
                        <td style={{ padding: '8px', textAlign: 'center', color: '#475569' }}>{p.formSubmissionsCount}</td>
                        <td style={{ padding: '8px' }}>
                          <span style={{ fontSize: 8, fontWeight: 600, color: st.color, background: st.bg, borderRadius: 20, padding: '2px 6px' }}>
                            {p.statusLabel}
                          </span>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => openEditor(p)} style={{ fontSize: 7, fontWeight: 600, color: '#3b82f6', background: '#eff6ff', border: 'none', borderRadius: 4, padding: '3px 5px', cursor: 'pointer' }}>Sửa</button>
                            {p.status === 1 && (
                              <>
                                <button type="button" onClick={() => copyPublicLink(p)} style={{ fontSize: 7, fontWeight: 600, color: '#64748b', background: '#f1f5f9', border: 'none', borderRadius: 4, padding: '3px 5px', cursor: 'pointer' }}>Copy link</button>
                                <a href={p.publicPath} target="_blank" rel="noreferrer" style={{ fontSize: 7, fontWeight: 600, color: '#64748b', background: '#f1f5f9', borderRadius: 4, padding: '3px 5px', textDecoration: 'none' }}>Xem</a>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {statCards.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="bg-white rounded-xl border border-slate-100" style={{ padding: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: s.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon style={{ width: 11, height: 11, color: s.color }} />
                </div>
                <span style={{ fontSize: 9, color: '#64748b', fontWeight: 500 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 2 }}>{s.value}</div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-100" style={{ padding: 12 }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>Hoạt động gần đây</h2>
        {activities.length === 0 ? (
          <div style={{ fontSize: 9, color: '#94a3b8' }}>Chưa có hoạt động</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activities.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ flex: 1, fontSize: 9, color: '#334155' }}>{a.message}</div>
                <div style={{ fontSize: 8, color: '#94a3b8', whiteSpace: 'nowrap' }}>{formatDate(a.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const Branding = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState('overview')
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
    if (location.state?.openLandingCreate) {
      setTab('overview')
      setShowCreate(true)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.pathname, location.state, navigate])

  const stats = dashboard?.stats || {}
  const activities = dashboard?.activities || []

  const statCards = [
    { icon: Bookmark, value: stats.views || 0, label: 'Lượt xem', color: '#3b82f6' },
    { icon: BarChart3, value: stats.formSubmissions || 0, label: 'Lượt đăng ký form', color: '#f59e0b' },
    { icon: Users, value: stats.candidates || 0, label: 'Hồ sơ ứng viên', color: '#8b5cf6' },
    { icon: TrendingUp, value: `${stats.conversionRate || 0}%`, label: 'Tỷ lệ chuyển đổi', color: '#10b981' },
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

  const tabs = [
    { key: 'overview', label: 'Tổng quan' },
    { key: 'stats', label: 'Thống kê hiệu quả' },
  ]

  return (
    <>
      <style>{scrollbarStyle}</style>
      <TemplateSlidePanel open={showCreate} onClose={() => setShowCreate(false)} onCreated={handleCreated} />

      <div className="min-h-0 bg-slate-50 h-full flex flex-col overflow-hidden">
        <div className="bg-white border-b border-slate-200 shrink-0 px-4 pt-4 pb-0">
          <h1 className="text-xl font-bold text-slate-800">Saiyo Branding</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Xây dựng thương hiệu tuyển dụng mạnh mẽ, chuyên nghiệp để thu hút và giữ chân nhân tài phù hợp.
          </p>
          <div className="flex gap-1 mt-4">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`text-sm font-semibold px-4 py-2.5 border-b-2 transition-colors ${
                  tab === t.key
                    ? 'border-violet-600 text-violet-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang tải...
            </div>
          ) : tab === 'overview' ? (
            <div className="branding-scrollbar h-full overflow-y-auto p-4">
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(240px,280px)] gap-4 items-start">
                <div className="min-w-0 flex flex-col gap-4">
                  <h2 className="text-base font-bold text-slate-800">Các gói dịch vụ Saiyo Branding</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                    {SERVICE_PACKAGES.map((pkg) => (
                      <ServicePackageCard
                        key={pkg.id}
                        pkg={pkg}
                        onUse={handlePackageUse}
                        loadingKey={requestLoadingKey}
                      />
                    ))}
                  </div>

                  <div className="rounded-xl border border-violet-100 bg-violet-50/80 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                    <p className="text-sm text-slate-600 flex-1">
                      <span className="font-semibold text-slate-800">Chưa biết gói nào phù hợp với doanh nghiệp của bạn?</span>
                    </p>
                    <button
                      type="button"
                      disabled={requestLoadingKey === 'consultation'}
                      onClick={handleConsultation}
                      className="flex-shrink-0 inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg px-5 py-2.5"
                    >
                      {requestLoadingKey === 'consultation' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Headphones className="w-4 h-4" />
                      )}
                      Nhận tư vấn miễn phí
                    </button>
                  </div>
                </div>

                <HomepageSidebar onNavigate={handleNavigate} />
              </div>
            </div>
          ) : (
            <div className="branding-scrollbar h-full overflow-y-auto p-3">
              <BrandingStatsView
                statCards={statCards}
                displayPages={landingPages}
                activities={activities}
                setShowCreate={setShowCreate}
                openEditor={openEditor}
                copyPublicLink={copyPublicLink}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Branding
