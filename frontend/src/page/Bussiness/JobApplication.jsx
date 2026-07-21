import React, { useState } from 'react'
import {
  Users, TrendingUp, Award, CheckCircle2, Clock,
  Search, SlidersHorizontal, ChevronRight, ChevronLeft, Eye,
  MoreHorizontal, MessageSquare, Download, Mail, UserCheck,
  AlertCircle, GitBranch, Phone, MapPin, Briefcase,
} from 'lucide-react'

const scrollbarHideStyle = `
  .app-scrollbar-hide::-webkit-scrollbar { display: none; }
  .app-scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
`

// Mock data
const stats = [
  {
    icon: Users,
    label: 'Tổng ứng viên vào JD',
    value: 236,
    change: '+18% so với tuần trước',
    color: '#3b82f6',
    bg: '#eff6ff',
  },
  {
    icon: TrendingUp,
    label: 'Ứng viên từ tiến cử (Scout Performance, Sàn CTV)',
    value: 128,
    change: '+16% so với tuần trước',
    color: '#f59e0b',
    bg: '#fef3c7',
  },
  {
    icon: Award,
    label: 'Ứng viên từ Scout Credit (DN tìm kiếm hồ sơ)',
    value: 92,
    change: '+22% so với tuần trước',
    color: '#f97316',
    bg: '#fed7aa',
  },
  {
    icon: CheckCircle2,
    label: 'Đã tuyển dụng',
    value: 68,
    change: '+5% so với tuần trước',
    color: '#10b981',
    bg: '#d1fae5',
  },
  {
    icon: GitBranch,
    label: 'Đã tuyển dụng',
    value: 11,
    change: '+10% so với tuần trước',
    color: '#059669',
    bg: '#a7f3d0',
  },
]

const sourceData = [
  { label: 'Scout Credit (DN tìm kiếm hồ sơ)', value: 92, percent: 39, color: '#f97316' },
  { label: 'Tiến cử (WS/CTV) (Scout Performance, Sàn CTV)', value: 128, percent: 54, color: '#8b5cf6' },
  { label: 'Khác (Branding LP)', value: 16, percent: 7, color: '#d4d4d8' },
]

const stageData = [
  { label: 'Liên hệ', value: 52, color: '#4f46e5', width: 52 / 68 },
  { label: 'Đang xử lý', value: 68, color: '#ea580c', width: 68 / 68 },
  { label: 'Phỏng vấn', value: 42, color: '#4338ca', width: 42 / 68 },
  { label: 'Offered', value: 18, color: '#10b981', width: 18 / 68 },
  { label: 'Đã tuyển', value: 11, color: '#059669', width: 11 / 68 },
  { label: 'Không phù hợp', value: 45, color: '#b45309', width: 45 / 68 },
]

const recentActivities = [
  {
    icon: UserCheck,
    color: '#3b82f6',
    title: 'WS Admin đã chuyển ứng viên Nguyễn Thị Hương sang "Liên hệ"',
    time: '16/05/2024 10:30',
    isImportant: true,
  },
  {
    icon: MessageSquare,
    color: '#10b981',
    title: 'Phỏng vấn',
    time: '18/05/2024 10:32',
    isImportant: false,
  },
  {
    icon: Download,
    color: '#f59e0b',
    title: 'CTV Phạm Văn Tùng đã làm quen ứng viên Lê Quang Huy',
    time: '19/05/2024 11:05',
    isImportant: false,
  },
  {
    icon: Mail,
    color: '#8b5cf6',
    title: 'Ứng viên Phạm Thúy Linh đã được gửi lời mời phỏng vấn',
    time: '20/05/2024 09:15',
    isImportant: false,
  },
]

const applications = [
  {
    name: 'Trần Minh Đức',
    email: 'duc.tran@gmail.com',
    phone: '0901 234 540',
    position: 'IT Developer',
    jp: '(システムエンジニア)',
    service: 'Scout Credit',
    serviceColor: '#3b82f6',
    stage: 'Scout Credit',
    stageColor: '#3b82f6',
    stageLabel: 'Scout Credit',
    statusTag: 'DN tự liên hệ',
    statusColor: '#64748b',
    interview: 'Liên hệ',
    interviewColor: '#4f46e5',
    interviewBg: '#e0e7ff',
    postedDate: '20/05/2024',
    time: '3 ngày trước',
  },
  {
    name: 'Nguyễn Thị Hương',
    email: 'hung.nguyen@gmail.com',
    phone: '0-080-214-5478',
    position: 'Business Analyst',
    jp: '(ビジネスアナリスト)',
    service: 'Scout Performance',
    serviceColor: '#f59e0b',
    stage: 'Scout Performance',
    stageColor: '#f59e0b',
    stageLabel: 'WS Admin',
    statusTag: 'Phỏng vấn',
    statusColor: '#f59e0b',
    interview: 'Phỏng vấn vào 1',
    interviewColor: '#d97706',
    interviewBg: '#fef3c7',
    postedDate: '19/05/2024',
    time: '4 ngày trước',
  },
  {
    name: 'Lê Quang Huy',
    email: 'huy.le@gmail.com',
    phone: '0903 387 654',
    position: 'QA Engineer',
    jp: '(品質保証担当)',
    service: 'Sàn CTV (HR Partner)',
    serviceColor: '#8b5cf6',
    stage: 'CTV Phạm Văn Tùng',
    stageColor: '#8b5cf6',
    stageLabel: 'Đang xử lý',
    statusTag: 'Hearing & Match',
    statusColor: '#8b5cf6',
    interview: 'Hearing & Match',
    interviewColor: '#a855f7',
    interviewBg: '#ede9fe',
    postedDate: '18/05/2024',
    time: '5 ngày trước',
  },
  {
    name: 'Pham Thúy Linh',
    email: 'linh.pham@gmail.com',
    phone: '0170-6666-7777',
    position: 'Sales Executive',
    jp: '(営業担当)',
    service: 'Scout Credit',
    serviceColor: '#3b82f6',
    stage: 'Scout Credit',
    stageColor: '#3b82f6',
    stageLabel: 'DN tự liên hệ',
    statusTag: 'Đã hồ sơ',
    statusColor: '#10b981',
    interview: 'Trả lời và xếp lịch',
    interviewColor: '#059669',
    interviewBg: '#d1fae5',
    postedDate: '16/05/2024',
    time: '7 ngày trước',
  },
  {
    name: 'Nguyễn Nhật Anh',
    email: 'anh.nguyen@gmail.com',
    phone: '0909 888 777',
    position: 'Mechanical Engineer',
    jp: '(機械エンジニア)',
    service: 'Scout Performance',
    serviceColor: '#f59e0b',
    stage: 'Scout Performance',
    stageColor: '#f59e0b',
    stageLabel: 'WS Admin',
    statusTag: 'Không phù hợp',
    statusColor: '#b45309',
    interview: 'Không phù hợp',
    interviewColor: '#b45309',
    interviewBg: '#fed7aa',
    postedDate: '08/05/2024',
    time: '10 ngày trước',
  },
]

const StatCard = ({ s }) => {
  const Icon = s.icon
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-2 flex flex-col gap-1.5 min-w-0">
      <div className="flex items-center gap-1.5">
        <div
          style={{
            width: 22, height: 22, borderRadius: 6,
            background: s.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <Icon style={{ width: 11, height: 11, color: s.color }} />
        </div>
        <span style={{ fontSize: 8, fontWeight: 500, color: '#64748b', flex: 1, lineHeight: 1.3 }}>
          {s.label}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{s.value}</span>
      </div>
      <div style={{ fontSize: 8, color: '#10b981', fontWeight: 500 }}>↑ {s.change}</div>
    </div>
  )
}

const PieChart = () => {
  const total = sourceData.reduce((sum, d) => sum + d.value, 0)
  const slices = []
  let currentAngle = -90

  sourceData.forEach((d) => {
    const percentage = (d.value / total) * 100
    const sliceAngle = (percentage / 100) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + sliceAngle

    const r = 35
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const x1 = 50 + r * Math.cos(startRad)
    const y1 = 50 + r * Math.sin(startRad)
    const x2 = 50 + r * Math.cos(endRad)
    const y2 = 50 + r * Math.sin(endRad)

    const largeArcFlag = sliceAngle > 180 ? 1 : 0
    const pathData = `M 50 50 L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`

    slices.push({ path: pathData, color: d.color })
    currentAngle = endAngle
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={90} height={90} viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
        {slices.map((slice, i) => (
          <path key={i} d={slice.path} fill={slice.color} stroke="white" strokeWidth="2" />
        ))}
        <circle cx="50" cy="50" r="25" fill="white" />
        <text x="50" y="48" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b">
          236
        </text>
        <text x="50" y="60" textAnchor="middle" fontSize="7" fill="#64748b">
          Tổng
        </text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {sourceData.map((d, i) => (
          <div key={i} style={{ fontSize: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
            <span style={{ color: '#475569', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.label}
            </span>
            <span style={{ color: '#64748b', fontWeight: 600, flexShrink: 0 }}>
              {d.value} ({d.percent}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const JobApplication = () => {
  const [activeTab, setActiveTab] = useState('Tất cả')
  const tabs = ['Tất cả', 'Tiến cử (WS/CTV)', 'Scout Credit', 'Đã tuyển dụng', 'Không phù hợp', 'Khác']

  const filteredApps =
    activeTab === 'Tất cả'
      ? applications
      : applications.filter((app) => {
          if (activeTab === 'Tiến cử (WS/CTV)') return app.service.includes('Scout Performance') || app.service.includes('Sàn CTV')
          if (activeTab === 'Scout Credit') return app.service.includes('Scout Credit')
          if (activeTab === 'Đã tuyển dụng') return app.statusColor === '#10b981'
          if (activeTab === 'Không phù hợp') return app.statusColor === '#b45309'
          return true
        })

  return (
    <>
      <style>{scrollbarHideStyle}</style>
      <div className="app-scrollbar-hide" style={{ height: '100%', overflowY: 'auto', background: '#f8fafc', padding: 8 }}>
        <div style={{ maxWidth: 1440, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>Quản lý tiến cử</h1>
              <p style={{ fontSize: 9, color: '#64748b', lineHeight: 1.35 }}>
                Theo dõi và quản lý tiến cử ứng viên được tiến cử từ các dịch vụ (Scout Credit, JD tiên hiệp JD của bạn)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button style={{ fontSize: 8, fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Xuất báo cáo
              </button>
              <button
                style={{
                  fontSize: 8, fontWeight: 600, color: 'white',
                  background: '#3b82f6', border: 'none', cursor: 'pointer', padding: '4px 8px',
                  borderRadius: 5, display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                Thêm ứng viên thủ công
              </button>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 250px' }}>

            {/* Left Column */}
            <div className="flex flex-col gap-2">
              {/* Stats Grid */}
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
                {stats.map((s, i) => (
                  <StatCard key={i} s={s} />
                ))}
              </div>

              {/* Tabs + Table */}
              <div className="bg-white rounded-xl border border-slate-100 flex flex-col" style={{ minHeight: 600 }}>

              {/* Tabs */}
              <div className="flex items-center gap-0 border-b border-slate-100 overflow-x-auto" style={{ padding: '0 8px' }}>
                {tabs.map((tab, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      fontSize: 9,
                      fontWeight: activeTab === tab ? 700 : 500,
                      color: activeTab === tab ? '#3b82f6' : '#64748b',
                      padding: '7px 10px',
                      borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Filter row */}
              <div className="flex items-center gap-1.5 border-b border-slate-100" style={{ padding: '6px 8px', flexWrap: 'wrap' }}>
                <div className="flex items-center gap-1 bg-slate-50 rounded-lg flex-1" style={{ padding: '4px 6px', minWidth: 120 }}>
                  <Search style={{ width: 9, height: 9, color: '#94a3b8', flexShrink: 0 }} />
                  <input
                    type="text" placeholder="Tìm kiếm ứng viên, JD..."
                    className="bg-transparent outline-none w-full"
                    style={{ fontSize: 8, color: '#475569' }}
                  />
                </div>
                <select className="border border-slate-200 rounded-lg text-slate-600 bg-white" style={{ fontSize: 8, padding: '4px 6px' }}>
                  <option>JD: Tất cả</option>
                </select>
                <select className="border border-slate-200 rounded-lg text-slate-600 bg-white" style={{ fontSize: 8, padding: '4px 6px' }}>
                  <option>Nguồn: Tất cả</option>
                </select>
                <select className="border border-slate-200 rounded-lg text-slate-600 bg-white" style={{ fontSize: 8, padding: '4px 6px' }}>
                  <option>Trạng thái: Tất cả</option>
                </select>
                <button
                  className="flex items-center gap-1 font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex-shrink-0"
                  style={{ fontSize: 8, padding: '4px 6px' }}
                >
                  <SlidersHorizontal style={{ width: 8, height: 8 }} />
                  Bộ lọc
                </button>
              </div>

              {/* Table */}
              <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
                <table style={{
                  width: '100%', textAlign: 'left', fontSize: 8,
                  tableLayout: 'fixed', borderCollapse: 'collapse',
                }}>
                  <colgroup>
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '11%' }} />
                  </colgroup>
                  <thead>
                    <tr style={{ fontSize: 7, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      <th style={{ fontWeight: 500, padding: '6px 8px', textAlign: 'left' }}>Ứng viên</th>
                      <th style={{ fontWeight: 500, padding: '6px 6px', textAlign: 'left' }}>JD / Vị trí</th>
                      <th style={{ fontWeight: 500, padding: '6px 6px', textAlign: 'left' }}>Nguồn</th>
                      <th style={{ fontWeight: 500, padding: '6px 6px', textAlign: 'left' }}>Loại</th>
                      <th style={{ fontWeight: 500, padding: '6px 6px', textAlign: 'left' }}>Tiến cử bởi</th>
                      <th style={{ fontWeight: 500, padding: '6px 6px', textAlign: 'left' }}>Trạng thái</th>
                      <th style={{ fontWeight: 500, padding: '6px 6px', textAlign: 'left' }}>Giai đoạn hiện tại</th>
                      <th style={{ fontWeight: 500, padding: '6px 6px', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.map((app, i) => (
                      <tr
                        key={i}
                        style={{
                          borderTop: '1px solid #e2e8f0',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {/* Ứng viên */}
                        <td style={{ padding: '6px 8px', borderRight: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{
                              width: 20, height: 20, borderRadius: '50%',
                              background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              <Users style={{ width: 8, height: 8, color: '#94a3b8' }} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 8, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {app.name}
                              </div>
                              <div style={{ fontSize: 7, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {app.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* JD / Vị trí */}
                        <td style={{ padding: '6px 6px', borderRight: '1px solid #e2e8f0' }}>
                          <div>
                            <div style={{ fontSize: 8, fontWeight: 600, color: '#1e293b' }}>
                              {app.position}
                            </div>
                            <div style={{ fontSize: 7, color: '#94a3b8' }}>
                              {app.jp}
                            </div>
                          </div>
                        </td>

                        {/* Nguồn */}
                        <td style={{ padding: '6px 6px', borderRight: '1px solid #e2e8f0' }}>
                          <span style={{
                            fontSize: 7, fontWeight: 600, color: app.serviceColor,
                            display: 'block',
                          }}>
                            ● {app.service}
                          </span>
                        </td>

                        {/* Loại */}
                        <td style={{ padding: '6px 6px', borderRight: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: 7, color: '#475569', fontWeight: 500 }}>
                            {app.stage}
                          </span>
                        </td>

                        {/* Tiến cử bởi */}
                        <td style={{ padding: '6px 6px', borderRight: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: 7, color: '#475569', fontWeight: 500 }}>
                            {app.stageLabel}
                          </span>
                        </td>

                        {/* Trạng thái */}
                        <td style={{ padding: '6px 6px', borderRight: '1px solid #e2e8f0' }}>
                          <div
                            style={{
                              display: 'inline-flex', alignItems: 'center',
                              fontSize: 7, fontWeight: 500, color: app.statusColor,
                              padding: '2px 6px', borderRadius: 20,
                            }}
                          >
                            {app.statusTag}
                          </div>
                        </td>

                        {/* Giai đoạn hiện tại */}
                        <td style={{ padding: '6px 6px' }}>
                          <div
                            style={{
                              display: 'inline-flex', alignItems: 'center',
                              fontSize: 7, fontWeight: 600, color: app.interviewColor,
                              background: app.interviewBg, borderRadius: 4, padding: '2px 6px',
                            }}
                          >
                            {app.interview}
                          </div>
                        </td>

                        {/* Action */}
                        <td style={{ padding: '6px 6px', textAlign: 'right' }}>
                          <button
                            style={{
                              width: 18, height: 18, borderRadius: 4, background: 'none',
                              border: 'none', cursor: 'pointer', color: '#94a3b8',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <MoreHorizontal style={{ width: 8, height: 8 }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-slate-100" style={{ padding: '6px 8px', background: '#f8fafc' }}>
                <span style={{ fontSize: 8, color: '#94a3b8' }}>Hiển thị 1 - 10 trong {filteredApps.length} tiến cử</span>
                <div className="flex items-center gap-1">
                  <button className="rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50" style={{ width: 20, height: 20 }}>
                    <ChevronLeft style={{ width: 9, height: 9 }} />
                  </button>
                  <button className="rounded-lg bg-blue-600 text-white font-semibold flex items-center justify-center" style={{ width: 20, height: 20, fontSize: 8 }}>
                    1
                  </button>
                  <button className="rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50" style={{ width: 20, height: 20 }}>
                    <ChevronRight style={{ width: 9, height: 9 }} />
                  </button>
                </div>
              </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="flex max-h-auto flex-col gap-2 app-scrollbar-hide" style={{ overflowY: 'auto'}}>

              {/* Pie Chart - Tỷ lệ nguồn ứng viên */}
              <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '8px 10px' }}>
                <h2 style={{ fontSize: 9, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
                  Tỷ lệ nguồn ứng viên
                </h2>
                <PieChart />
              </div>

              {/* Stage Health Bars */}
              <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '8px 10px' }}>
                <h2 style={{ fontSize: 9, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
                  Trang thái tiến cử
                </h2>
                <div className="flex flex-col" style={{ gap: 6 }}>
                  {stageData.map((stage, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between gap-2" style={{ marginBottom: 3 }}>
                        <span style={{ fontSize: 8, fontWeight: 500, color: '#64748b' }}>{stage.label}</span>
                        <span style={{ fontSize: 8, fontWeight: 700, color: '#1e293b' }}>{stage.value}</span>
                      </div>
                      <div style={{ width: '100%', height: 5, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${stage.width * 100}%`,
                            height: '100%',
                            background: stage.color,
                            borderRadius: 3,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activities */}
              <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '8px 10px', flex: 1, minHeight: 0 }}>
                <h2 style={{ fontSize: 9, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                  Hoạt động gần đây
                </h2>
                <div className="flex flex-col app-scrollbar-hide" style={{ gap: 6, overflowY: 'auto', maxHeight: 220 }}>
                  {recentActivities.map((act, i) => {
                    const Icon = act.icon
                    return (
                      <div key={i} className="flex items-start gap-1.5">
                        <div
                          style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}
                        >
                          <Icon style={{ width: 9, height: 9, color: act.color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 8, color: '#334155', lineHeight: 1.35 }}>{act.title}</div>
                          <div style={{ fontSize: 7, color: '#94a3b8', marginTop: 1 }}>{act.time}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <button
                  className="flex items-center gap-1 font-semibold"
                  style={{ marginTop: 6, fontSize: 8, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Xem tất cả lịch sử
                  <ChevronRight style={{ width: 8, height: 8 }} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

export default JobApplication
