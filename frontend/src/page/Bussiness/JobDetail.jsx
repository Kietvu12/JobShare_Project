import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, ChevronDown, Edit2, Globe, MoreHorizontal, MapPin, Clock,
  Award, Hash, Calendar, Users, Target, Sparkles, BarChart3, TrendingUp,
  Info, DollarSign, ArrowRight, User, Search, Star, Building2, FileText,
  Unlock, UserPlus,
} from 'lucide-react'

const tabs = ['Tổng quan', 'Mô tả công việc', 'Yêu cầu ứng viên', 'Quyền lợi & phúc lợi', 'Lịch sử hoạt động']

const healthCards = [
  {
    icon: Users, score: 72, label: 'Nguồn ứng viên', rating: 'Khá',
    lines: ['128 ứng viên', '32 ứng viên mới (7 ngày)'],
  },
  {
    icon: Sparkles, score: 68, label: 'Chất lượng ứng viên', rating: 'Khá',
    lines: ['41 ứng viên phù hợp', 'Tỷ lệ phù hợp: 32%'],
  },
  {
    icon: BarChart3, score: 65, label: 'Hiệu suất tuyển dụng', rating: 'Trung bình',
    lines: ['Tỷ lệ phản hồi: 24%', 'Tỷ lệ chuyển tiếp: 18%'],
  },
  {
    icon: Clock, score: 60, label: 'Tốc độ tuyển dụng', rating: 'Trung bình',
    lines: ['Thời gian có ứng viên đầu tiên: 2 ngày', 'Thời gian phản hồi TB: 1.6 ngày'],
  },
]

const matchStats = [
  { value: 32, label: 'Hồ sơ rất phù hợp', sub: '(Match ≥ 85%)' },
  { value: 76, label: 'Hồ sơ phù hợp', sub: '(Match 60% - 84%)' },
  { value: 20, label: 'Hồ sơ tiềm năng', sub: '(Match 40% - 59%)' },
]

const aiInsights = [
  { icon: TrendingUp, label: 'Match trung bình', value: '84%', valueColor: '#10b981' },
  { icon: Sparkles, label: 'Kỹ năng match mạnh', value: 'React, TypeScript, Next.js, Redux' },
  { icon: MapPin, label: 'Khu vực có nhiều ứng viên', value: 'Hà Nội, TP.HCM, Đà Nẵng' },
  { icon: DollarSign, label: 'Mức lương phổ biến', value: '20 - 35 triệu VND' },
]

const candidates = [
  { name: 'Ẩn danh #1', role: 'Frontend Developer', match: 91, exp: '4 năm kinh nghiệm', location: 'Hà Nội', skills: ['React', 'TypeScript', 'Next.js'], extra: 3 },
  { name: 'Ẩn danh #2', role: 'Frontend Engineer', match: 88, exp: '3 năm kinh nghiệm', location: 'TP. Hồ Chí Minh', skills: ['React', 'JavaScript', 'Redux'], extra: 2 },
  { name: 'Ẩn danh #3', role: 'React Developer', match: 87, exp: '5 năm kinh nghiệm', location: 'Hà Nội', skills: ['React', 'TypeScript', 'AWS'], extra: 2 },
  { name: 'Ẩn danh #4', role: 'Frontend Developer', match: 85, exp: '3 năm kinh nghiệm', location: 'Đà Nẵng', skills: ['React', 'Next.js', 'Tailwind'], extra: 2 },
]

const services = [
  {
    icon: Search, iconColor: 'text-blue-500', iconBg: 'bg-blue-50',
    name: 'Ucout Credit', status: 'Đang sử dụng', statusColor: 'bg-emerald-100 text-emerald-700',
    detail: 'Đã unlock: 56 hồ sơ', action: 'Xem chi tiết',
  },
  {
    icon: Star, iconColor: 'text-amber-500', iconBg: 'bg-amber-50',
    name: 'Saiyo Branding', status: 'Đang sử dụng', statusColor: 'bg-emerald-100 text-emerald-700',
    detail: 'Hiển thị từ: 18/05/2024', action: 'Xem chi tiết',
  },
  {
    icon: Building2, iconColor: 'text-violet-500', iconBg: 'bg-violet-50',
    name: 'Sàn CTV (HR Partner)', status: 'Chưa sử dụng', statusColor: 'bg-slate-100 text-slate-500',
    detail: 'Chưa đăng job', action: 'Đăng ngay',
  },
]

const activities = [
  { icon: FileText, iconColor: 'text-blue-500', iconBg: 'bg-blue-50', text: 'JD được đăng lên hệ thống', time: '18/05/2024 10:30' },
  { icon: Sparkles, iconColor: 'text-violet-500', iconBg: 'bg-violet-50', text: 'Tự động gợi ý 128 ứng viên phù hợp', time: '18/05/2024 10:32' },
  { icon: Unlock, iconColor: 'text-blue-500', iconBg: 'bg-blue-50', text: 'Unlock 10 hồ sơ bằng Scout Credit', time: '18/05/2024 11:05' },
  { icon: UserPlus, iconColor: 'text-amber-500', iconBg: 'bg-amber-50', text: 'Có 5 ứng viên mới phù hợp', time: '19/05/2024 09:15' },
  { icon: Edit2, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-50', text: 'Cập nhật mô tả công việc', time: '20/05/2024 14:20' },
]

const s = `
  .hide-sb::-webkit-scrollbar { display: none; }
  .hide-sb { -ms-overflow-style: none; scrollbar-width: none; }
`

const JobDetail = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Tổng quan')

  return (
    <>
      <style>{s}</style>
      <div className="h-screen bg-slate-50 overflow-hidden" style={{ padding: '8px' }}>
        <div className="h-full mx-auto flex flex-col gap-2 overflow-y-auto hide-sb" style={{ maxWidth: 1140, paddingRight: 2 }}>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1" style={{ fontSize: 10, color: '#94a3b8' }}>
            <button onClick={() => navigate('/business/jobs')} className="hover:text-blue-600 transition-colors">Quản lý JD</button>
            <ChevronRight style={{ width: 10, height: 10 }} />
            <span style={{ fontWeight: 600, color: '#475569' }}>Chi tiết JD</span>
          </div>

          {/* Header */}
          <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '12px 14px' }}>
            <div className="flex items-start justify-between gap-3" style={{ marginBottom: 8 }}>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700" style={{ fontSize: 9, fontWeight: 500, padding: '2px 8px' }}>
                <span className="rounded-full bg-emerald-500" style={{ width: 5, height: 5 }} />
                Đang hoạt động
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button className="flex items-center gap-1 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700 transition-colors" style={{ fontSize: 10, padding: '6px 10px' }}>
                  <Edit2 style={{ width: 11, height: 11 }} />
                  Chỉnh sửa JD
                </button>
                <button className="flex items-center gap-1 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700 transition-colors" style={{ fontSize: 10, padding: '6px 10px' }}>
                  <Globe style={{ width: 11, height: 11 }} />
                  Tạo Landing Page
                </button>
                <button className="flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors" style={{ width: 26, height: 26 }}>
                  <MoreHorizontal style={{ width: 13, height: 13 }} />
                </button>
              </div>
            </div>

            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Frontend Developer (ReactJS)</h1>

            <div className="flex flex-wrap items-center justify-between gap-3" style={{ marginBottom: 6 }}>
              <div className="flex items-center flex-wrap gap-3" style={{ fontSize: 10, color: '#64748b' }}>
                <span className="flex items-center gap-1"><MapPin style={{ width: 11, height: 11, color: '#94a3b8' }} />Hà Nội</span>
                <span className="flex items-center gap-1"><Clock style={{ width: 11, height: 11, color: '#94a3b8' }} />Toàn thời gian</span>
                <span className="flex items-center gap-1"><Award style={{ width: 11, height: 11, color: '#94a3b8' }} />Cấp bậc: Middle</span>
                <span className="flex items-center gap-1"><Hash style={{ width: 11, height: 11, color: '#94a3b8' }} />Mã JD: FE2405-0012</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button className="flex items-center gap-1.5 border border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg font-semibold transition-colors" style={{ fontSize: 10, padding: '6px 10px' }}>
                  <Users style={{ width: 12, height: 12 }} />
                  Đưa lên Sàn CTV
                </button>
                <button className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity" style={{ fontSize: 10, padding: '6px 10px' }}>
                  <Target style={{ width: 12, height: 12 }} />
                  Tìm ứng viên với Scout
                </button>
              </div>
            </div>

            <p style={{ fontSize: 10, color: '#94a3b8' }}>
              Ngày đăng: 18/05/2024 &nbsp;•&nbsp; Hết hạn: 17/06/2024 (còn 28 ngày) &nbsp;•&nbsp; Người tạo: Nguyễn Văn A
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-slate-100 flex items-center gap-4 overflow-x-auto hide-sb" style={{ padding: '0 14px' }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="font-medium transition-colors flex-shrink-0"
                style={{
                  fontSize: 11,
                  padding: '10px 2px',
                  borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
                  color: activeTab === tab ? '#6366f1' : '#64748b',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Tổng quan' ? (
            <>
              {/* Recruitment Health */}
              <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px 12px' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                  <div className="flex items-center gap-1.5">
                    <h2 style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>Recruitment Health của JD</h2>
                    <Info style={{ width: 12, height: 12, color: '#cbd5e1' }} />
                  </div>
                  <button className="flex items-center gap-1 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors" style={{ fontSize: 10, padding: '4px 8px' }}>
                    7 ngày qua
                    <ChevronDown style={{ width: 11, height: 11 }} />
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-4" style={{ gap: 12 }}>
                  {healthCards.map((c, i) => {
                    const Icon = c.icon
                    return (
                      <div key={i} className={i % 4 !== 0 ? 'lg:border-l border-slate-100' : ''} style={{ paddingLeft: i % 4 !== 0 ? 14 : 0 }}>
                        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                          <div className="rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0" style={{ width: 28, height: 28 }}>
                            <Icon className="text-violet-500" style={{ width: 14, height: 14 }} />
                          </div>
                          <span style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>{c.label}</span>
                        </div>
                        <div className="flex items-baseline gap-1" style={{ marginBottom: 2 }}>
                          <span style={{ fontSize: 20, fontWeight: 700, color: '#4f46e5' }}>{c.score}</span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>/100</span>
                        </div>
                        <p style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', marginBottom: 8 }}>{c.rating}</p>
                        {c.lines.map((line, k) => (
                          <p key={k} style={{ fontSize: 9, color: '#94a3b8', lineHeight: 1.6 }}>{line}</p>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* AI Suggestion */}
              <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-blue-50" style={{ padding: '14px 16px' }}>
                <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
                  <div className="flex gap-3">
                    <div className="rounded-2xl bg-white flex items-center justify-center flex-shrink-0 relative" style={{ width: 56, height: 56 }}>
                      <Target className="text-violet-500" style={{ width: 26, height: 26 }} />
                      <Sparkles className="text-violet-300" style={{ width: 12, height: 12, position: 'absolute', top: -4, right: -4 }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <span className="inline-block rounded-full bg-violet-100 text-violet-600" style={{ fontSize: 9, fontWeight: 600, padding: '2px 8px', marginBottom: 6 }}>AI gợi ý</span>
                      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>Có 128 hồ sơ phù hợp với JD này</h2>
                      <div className="grid grid-cols-3" style={{ gap: 12 }}>
                        {matchStats.map((m, i) => (
                          <div key={i}>
                            <p style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{m.value}</p>
                            <p style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{m.label}</p>
                            <p style={{ fontSize: 9, color: '#94a3b8' }}>{m.sub}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center lg:border-l border-violet-100" style={{ gap: 10, paddingLeft: 16 }}>
                    {aiInsights.map((item, i) => {
                      const Icon = item.icon
                      return (
                        <div key={i} className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5" style={{ fontSize: 10, color: '#64748b', flexShrink: 0 }}>
                            <Icon style={{ width: 12, height: 12, color: '#a5b4fc' }} />
                            {item.label}
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: item.valueColor || '#1e293b', textAlign: 'right' }}>{item.value}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Top candidates */}
              <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px 12px' }}>
                <div className="flex items-center gap-1.5" style={{ marginBottom: 10 }}>
                  <h2 style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>Top ứng viên phù hợp nhất (Ẩn danh)</h2>
                  <Info style={{ width: 12, height: 12, color: '#cbd5e1' }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {candidates.map((c, i) => (
                    <div key={i} className="border border-slate-100 rounded-lg" style={{ padding: 10 }}>
                      <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                        <div className="rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0" style={{ width: 28, height: 28 }}>
                          <User className="text-violet-400" style={{ width: 14, height: 14 }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>{c.name}</p>
                          <p style={{ fontSize: 9, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.role}</p>
                        </div>
                      </div>
                      <span className="inline-block rounded-full bg-emerald-100 text-emerald-700" style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', marginBottom: 8 }}>{c.match}% match</span>
                      <div className="flex items-center gap-1" style={{ marginBottom: 4 }}>
                        <Calendar style={{ width: 10, height: 10, color: '#94a3b8' }} />
                        <span style={{ fontSize: 9, color: '#64748b' }}>{c.exp}</span>
                      </div>
                      <div className="flex items-center gap-1" style={{ marginBottom: 8 }}>
                        <MapPin style={{ width: 10, height: 10, color: '#94a3b8' }} />
                        <span style={{ fontSize: 9, color: '#64748b' }}>{c.location}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {c.skills.map((sk, k) => (
                          <span key={k} className="bg-slate-100 text-slate-600 rounded" style={{ fontSize: 9, padding: '2px 6px' }}>{sk}</span>
                        ))}
                        <span className="bg-slate-100 text-slate-600 rounded" style={{ fontSize: 9, padding: '2px 6px' }}>+{c.extra}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center" style={{ marginTop: 12 }}>
                  <button className="flex items-center gap-1.5 border border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg font-semibold transition-colors" style={{ fontSize: 10, padding: '8px 16px' }}>
                    Xem danh sách tất cả ứng viên match
                    <ArrowRight style={{ width: 11, height: 11 }} />
                  </button>
                </div>
              </div>

              {/* Bottom: services + activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2" style={{ paddingBottom: 8 }}>
                {/* Services */}
                <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px 12px' }}>
                  <h2 style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>Dịch vụ đang sử dụng cho JD này</h2>
                  <div className="flex flex-col" style={{ gap: 10 }}>
                    {services.map((sv, i) => {
                      const Icon = sv.icon
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`rounded-lg ${sv.iconBg} flex items-center justify-center flex-shrink-0`} style={{ width: 28, height: 28 }}>
                            <Icon className={sv.iconColor} style={{ width: 13, height: 13 }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="flex items-center gap-2" style={{ marginBottom: 1 }}>
                              <span style={{ fontSize: 10, fontWeight: 600, color: '#1e293b' }}>{sv.name}</span>
                              <span className={`inline-flex items-center rounded-full flex-shrink-0 ${sv.statusColor}`} style={{ fontSize: 9, fontWeight: 500, padding: '1px 6px' }}>{sv.status}</span>
                            </div>
                            <p style={{ fontSize: 9, color: '#94a3b8' }}>{sv.detail}</p>
                          </div>
                          <button className="font-semibold text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0" style={{ fontSize: 10 }}>{sv.action}</button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Activity */}
                <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px 12px' }}>
                  <h2 style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>Lịch sử hoạt động gần đây</h2>
                  <div className="flex flex-col" style={{ gap: 9 }}>
                    {activities.map((a, i) => {
                      const Icon = a.icon
                      return (
                        <div key={i} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                            <div className={`rounded-lg ${a.iconBg} flex items-center justify-center flex-shrink-0`} style={{ width: 22, height: 22 }}>
                              <Icon className={a.iconColor} style={{ width: 11, height: 11 }} />
                            </div>
                            <span style={{ fontSize: 10, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.text}</span>
                          </div>
                          <span style={{ fontSize: 9, color: '#94a3b8', flexShrink: 0 }}>{a.time}</span>
                        </div>
                      )
                    })}
                  </div>
                  <button className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 transition-colors" style={{ marginTop: 10, fontSize: 10 }}>
                    Xem tất cả lịch sử
                    <ArrowRight style={{ width: 10, height: 10 }} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 flex items-center justify-center" style={{ padding: '40px 0', fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
              Nội dung "{activeTab}" sẽ được hiển thị tại đây
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default JobDetail