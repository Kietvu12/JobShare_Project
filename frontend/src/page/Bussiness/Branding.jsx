import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, Bookmark, BarChart3, Users, TrendingUp, Loader2, X } from 'lucide-react'
import apiService from '../../services/api'

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

const recommendations = [
  { img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=200', title: 'Tạo landing page chuyên nghiệp', desc: 'Thiết kế riêng theo thương hiệu, tối ưu chuyển đổi' },
  { img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=200', title: 'Chạy quảng cáo tuyển dụng', desc: 'Tiếp cận ứng viên qua Google, Facebook, LinkedIn' },
  { img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=200', title: 'Tổ chức seminar / webinar', desc: 'Sự kiện online/offline thu hút ứng viên' },
  { img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=200', title: 'Làm Company Profile / Brochure', desc: 'Hồ sơ năng lực công ty chuyên nghiệp' },
  { img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=200', title: 'Thiết kế website công ty', desc: 'Website chuẩn SEO, thể hiện uy tín DN' },
]

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('vi-VN')
  } catch {
    return '—'
  }
}

function CreateLandingModal({ open, onClose, onCreated }) {
  const [jobs, setJobs] = useState([])
  const [templates, setTemplates] = useState([])
  const [jobId, setJobId] = useState('')
  const [templateKey, setTemplateKey] = useState('tp_lp3_biz_movie1')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!open) return
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const [jobsRes, tplRes] = await Promise.all([
          apiService.getBusinessJobs({ page: 1, limit: 50, status: 1 }),
          apiService.getBusinessLandingPageTemplates(),
        ])
        if (!mounted) return
        if (jobsRes?.success) setJobs(jobsRes.data?.jobs || jobsRes.data?.items || [])
        if (tplRes?.success) setTemplates(tplRes.data?.templates || [])
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [open])

  const handleCreate = async () => {
    if (!jobId) {
      alert('Vui lòng chọn JD')
      return
    }
    setCreating(true)
    try {
      const res = await apiService.createBusinessLandingPage({
        jobId: Number(jobId),
        templateKey,
      })
      if (res?.success && res.data?.landingPage) {
        onCreated(res.data.landingPage)
        onClose()
      } else {
        alert(res?.message || 'Tạo thất bại')
      }
    } catch (e) {
      console.error(e)
      alert('Tạo thất bại')
    } finally {
      setCreating(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-sm font-bold text-slate-800">Tạo landing page</h3>
          <button type="button" onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-600">1. Chọn JD</label>
                <select
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">-- Chọn việc làm --</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>{j.title || j.jobCode} ({j.jobCode})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">2. Chọn template ({templates.length} mẫu)</label>
                <div className="mt-2 grid grid-cols-1 gap-2 max-h-64 overflow-y-auto branding-scrollbar">
                  {templates.map((t) => (
                    <label
                      key={t.key}
                      className={`flex items-start gap-2 p-2 border rounded-lg cursor-pointer ${templateKey === t.key ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
                    >
                      <input
                        type="radio"
                        name="template"
                        checked={templateKey === t.key}
                        onChange={() => setTemplateKey(t.key)}
                        className="mt-1 shrink-0"
                      />
                      <div
                        className="w-14 h-10 rounded shrink-0 bg-slate-100 border border-slate-200 overflow-hidden"
                        style={{ backgroundColor: t.previewColor + '22' }}
                      >
                        <img
                          src={`/template/${t.folder || t.key}/images/mainimg1.jpg`}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-800">{t.name}</div>
                        <div className="text-[10px] text-slate-500">{t.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-slate-500">Nội dung sẽ được tự động điền từ JD. Bạn có thể chỉnh sửa và publish sau.</p>
            </>
          )}
        </div>
        <div className="flex justify-end gap-2 p-4 border-t">
          <button type="button" onClick={onClose} className="text-xs px-3 py-2 border rounded-lg">Hủy</button>
          <button
            type="button"
            disabled={creating || loading}
            onClick={handleCreate}
            className="text-xs px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
          >
            {creating ? 'Đang tạo...' : 'Tạo & chỉnh sửa'}
          </button>
        </div>
      </div>
    </div>
  )
}

const Branding = () => {
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState(null)
  const [landingPages, setLandingPages] = useState([])
  const [showCreate, setShowCreate] = useState(false)

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

  const stats = dashboard?.stats || {}
  const activities = dashboard?.activities || []
  const displayPages = tab === 'pages' ? landingPages : (dashboard?.recentLandingPages || landingPages.slice(0, 5))

  const statCards = [
    { icon: Bookmark, value: stats.views || 0, label: 'Lượt xem', change: '—', color: '#3b82f6' },
    { icon: BarChart3, value: stats.formSubmissions || 0, label: 'Lượt đăng ký form', change: '—', color: '#f59e0b' },
    { icon: Users, value: stats.candidates || 0, label: 'Hồ sơ ứng viên', change: '—', color: '#8b5cf6' },
    { icon: TrendingUp, value: `${stats.conversionRate || 0}%`, label: 'Tỷ lệ chuyển đổi', change: '—', color: '#10b981' },
  ]

  const handleCreated = (lp) => {
    loadData()
    navigate(`/business/saiyo/pages/${lp.id}/edit`)
  }

  const copyPublicLink = (lp) => {
    const url = `${window.location.origin}${lp.publicPath || `/lp/${lp.slug}`}`
    navigator.clipboard.writeText(url)
    alert('Đã copy link public')
  }

  return (
    <>
      <style>{scrollbarStyle}</style>
      <CreateLandingModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={handleCreated} />

      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', padding: '0 12px' }}>
            {['overview', 'pages'].map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                fontSize: 11, fontWeight: tab === t ? 700 : 500, color: tab === t ? '#3b82f6' : '#64748b',
                padding: '10px 14px', borderBottom: tab === t ? '2px solid #3b82f6' : '2px solid transparent',
                background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                {t === 'overview' ? 'Tổng quan' : 'Landing pages'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang tải...
            </div>
          ) : (
            <div className="branding-scrollbar" style={{ height: '100%', overflowY: 'auto', padding: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: tab === 'overview' ? '1fr 280px' : '1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: tab === 'overview' ? '200px 1fr' : '1fr', gap: 12 }}>
                    {tab === 'overview' && (
                      <div className="bg-white rounded-xl border border-slate-100" style={{ padding: 12, height: 'fit-content' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 8 }}>📄</div>
                          <h2 style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Tạo landing page miễn phí</h2>
                          <p style={{ fontSize: 8, color: '#64748b', marginBottom: 8 }}>Template + form ứng tuyển + SEO</p>
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
                    )}

                    <div className="bg-white rounded-xl border border-slate-100" style={{ padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <h2 style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>
                          {tab === 'overview' ? 'Landing page gần đây' : 'Tất cả landing pages'}
                        </h2>
                        {tab === 'overview' ? (
                          <button type="button" onClick={() => setTab('pages')} style={{ fontSize: 9, fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                            Xem tất cả <ChevronRight style={{ width: 9, height: 9 }} />
                          </button>
                        ) : (
                          <button type="button" onClick={() => setShowCreate(true)} style={{ fontSize: 9, fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>
                            + Tạo mới
                          </button>
                        )}
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
                                <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Job</th>
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
                                    <td style={{ padding: '8px', color: '#64748b' }}>{p.job?.title || p.job?.jobCode || '—'}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', color: '#475569' }}>{p.viewsCount}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', color: '#475569' }}>{p.formSubmissionsCount}</td>
                                    <td style={{ padding: '8px' }}>
                                      <span style={{ fontSize: 8, fontWeight: 600, color: st.color, background: st.bg, borderRadius: 20, padding: '2px 6px' }}>
                                        {p.statusLabel}
                                      </span>
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>
                                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                        <button type="button" onClick={() => navigate(`/business/saiyo/pages/${p.id}/edit`)} style={{ fontSize: 7, fontWeight: 600, color: '#3b82f6', background: '#eff6ff', border: 'none', borderRadius: 4, padding: '3px 5px', cursor: 'pointer' }}>Sửa</button>
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

                  {tab === 'overview' && (
                    <>
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
                    </>
                  )}
                </div>

                {tab === 'overview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="bg-white rounded-xl border border-slate-100" style={{ padding: 12, textAlign: 'center' }}>
                      <h3 style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Muốn tuyển dụng hiệu quả hơn?</h3>
                      <p style={{ fontSize: 9, color: '#64748b', marginBottom: 10 }}>Dịch vụ Saiyo Branding chuyên nghiệp</p>
                      <button type="button" disabled style={{ width: '100%', fontSize: 9, fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '7px', cursor: 'not-allowed' }}>
                        Gửi yêu cầu (sắp ra mắt)
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {recommendations.map((r, i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-100" style={{ padding: 10, display: 'flex', gap: 8 }}>
                          <img src={r.img} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b' }}>{r.title}</div>
                            <div style={{ fontSize: 8, color: '#64748b', marginTop: 1 }}>{r.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Branding
