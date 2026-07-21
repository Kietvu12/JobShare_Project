import React from 'react'
import { Calendar, ChevronDown, Download, FileText, TrendingUp, TrendingDown, ArrowRight, ArrowDownRight } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

const metrics = [
  { label: 'Tổng JD đã đăng', value: '28', change: '+12% so với kỳ trước', up: true, icon: FileText, color: '#3b82f6', bg: '#eff6ff' },
  { label: 'Tổng tiến cử nhận được', value: '156', change: '+18% so với kỳ trước', up: true, icon: TrendingUp, color: '#7c3aed', bg: '#f3f0ff' },
  { label: 'Ứng viên vào vòng phỏng vấn', value: '46', change: '+15% so với kỳ trước', up: true, icon: TrendingUp, color: '#0d9488', bg: '#f0fdfa' },
  { label: 'Tuyển thành công', value: '12', change: '+20% so với kỳ trước', up: true, icon: TrendingUp, color: '#ea580c', bg: '#fff7ed' },
  { label: 'Chi phí tuyển dụng (VNĐ)', value: '240,000,000đ', change: '-8% so với kỳ trước', up: false, icon: FileText, color: '#ca8a04', bg: '#fefce8' },
]

const trendData = [
  { date: '01/05', jd: 18, tiencu: 38, phongvan: 12, tuyendung: 4 },
  { date: '07/05', jd: 22, tiencu: 45, phongvan: 18, tuyendung: 6 },
  { date: '14/05', jd: 25, tiencu: 52, phongvan: 22, tuyendung: 8 },
  { date: '21/05', jd: 26, tiencu: 60, phongvan: 30, tuyendung: 10 },
  { date: '28/05', jd: 28, tiencu: 68, phongvan: 46, tuyendung: 12 },
]

const funnelData = [
  { name: 'JD đã đăng', value: 28, percent: '100%', color: '#3b82f6' },
  { name: 'Tiến cử nhận được', value: 156, percent: '71.4%', color: '#7c3aed' },
  { name: 'Vào phỏng vấn', value: 46, percent: '29.5%', color: '#0d9488' },
  { name: 'Tuyển thành công', value: 12, percent: '29.3%', color: '#f97316' },
]

const insights = [
  { icon: '📊', title: 'Tỷ lệ tuyển thành công tăng 20%', desc: 'So với kỳ trước, hiệu quả tuyển dụng của bạn đang cải thiện tích cực.' },
  { icon: '🎯', title: 'Frontend Developer là vị trí hiệu quả nhất', desc: 'Tỷ lệ chuyển đổi đạt 35% vượt mức trung bình.' },
  { icon: '⏱️', title: 'Thời gian tuyển dụng trung bình giảm 8 ngày', desc: 'Từ 32 ngày xuống còn 24 ngày.' },
  { icon: '👥', title: 'Nguồn CTV mang lại nhiều ứng viên chất lượng nhất', desc: 'Nhóm CTV đã mang lại 65% tổng số ứng viên đạt chất lượng.' },
]

const deptData = [
  { name: 'IT', value: 5 },
  { name: 'Sales', value: 3 },
  { name: 'Marketing', value: 2 },
  { name: 'Finance', value: 1 },
  { name: 'Operations', value: 1 },
]

const sourceData = [
  { name: 'CTV (HR Partner)', value: 7, percent: '58%' },
  { name: 'Scout (Mở bảng credit)', value: 3, percent: '25%' },
  { name: 'Website công ty', value: 1, percent: '8%' },
  { name: 'Quảng cáo tuyển dụng', value: 1, percent: '8%' },
]
const maxSource = Math.max(...sourceData.map(s => s.value))

const topPositions = [
  { name: 'Frontend Developer', rate: '35%', hires: 5 },
  { name: 'QA Engineer', rate: '32%', hires: 3 },
  { name: 'Product Owner', rate: '30%', hires: 2 },
  { name: 'DevOps Engineer', rate: '28%', hires: 1 },
  { name: 'Data Analyst', rate: '25%', hires: 1 },
]

const jdTable = [
  { jd: 'Frontend Developer (FE-2405)', dept: 'IT', tiencu: 28, phongvan: 10, tuyendung: 5, rate: '35%', status: 'Đang tuyển' },
  { jd: 'QA Engineer (QA-2405)', dept: 'IT', tiencu: 24, phongvan: 8, tuyendung: 3, rate: '32%', status: 'Đang tuyển' },
  { jd: 'Product Owner (PO-2405)', dept: 'Product', tiencu: 18, phongvan: 6, tuyendung: 2, rate: '30%', status: 'Đang tuyển' },
  { jd: 'DevOps Engineer (DO-2405)', dept: 'IT', tiencu: 12, phongvan: 3, tuyendung: 1, rate: '28%', status: 'Đang tuyển' },
  { jd: 'Data Analyst (DA-2405)', dept: 'Data', tiencu: 14, phongvan: 4, tuyendung: 1, rate: '25%', status: 'Tạm dừng' },
]

const timeToHireData = [
  { date: '01/05', days: 32 },
  { date: '07/05', days: 30 },
  { date: '14/05', days: 28 },
  { date: '21/05', days: 26 },
  { date: '28/05', days: 24 },
]

const customReports = [
  { title: 'Báo cáo hiệu quả tuyển dụng tổng quan', updated: '31/05/2024' },
  { title: 'Báo cáo chi phí tuyển dụng', updated: '31/05/2024' },
  { title: 'Báo cáo nguồn ứng viên', updated: '31/05/2024' },
  { title: 'Báo cáo JD theo phòng ban', updated: '31/05/2024' },
]

const statusColors = {
  'Đang tuyển': { color: '#16a34a', bg: '#f0fdf4' },
  'Tạm dừng': { color: '#ea580c', bg: '#fff7ed' },
}

const cardStyle = { borderRadius: 8, border: '1px solid #e2e8f0', background: '#ffffff', padding: 12 }
const cardHeaderStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }
const linkStyle = { fontSize: 9, fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }

const ReportInsight = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: 12, gap: 12 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>Reports & Insights</h1>
        <p style={{ fontSize: 10, color: '#64748b' }}>Dữ liệu tổng quan và phân tích hiệu quả tuyển dụng của doanh nghiệp trên JobShare.</p>
      </div>

      {/* Filters & Export */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontSize: 10, color: '#1e293b', fontWeight: 500 }}>
            <Calendar style={{ width: 12, height: 12, color: '#94a3b8' }} />
            01/05/2024 - 31/05/2024
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontSize: 10, color: '#1e293b', fontWeight: 500 }}>
            Tất cả phòng ban
            <ChevronDown style={{ width: 12, height: 12, color: '#94a3b8' }} />
          </button>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#3b82f6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 10, color: '#ffffff', fontWeight: 600 }}>
          <Download style={{ width: 12, height: 12 }} />
          Xuất báo cáo
        </button>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {metrics.map((m, i) => {
          const Icon = m.icon
          return (
            <div key={i} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: 14, height: 14, color: m.color }} />
                </div>
                <div style={{ fontSize: 9, color: '#64748b', lineHeight: 1.3 }}>{m.label}</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{m.value}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, fontWeight: 600, color: m.up ? '#16a34a' : '#dc2626' }}>
                {m.up ? <TrendingUp style={{ width: 10, height: 10 }} /> : <ArrowDownRight style={{ width: 10, height: 10 }} />}
                {m.change}
              </div>
            </div>
          )
        })}
      </div>

      {/* Row 2: Trend chart, Donut, Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.1fr', gap: 12, alignItems: 'stretch' }}>

        {/* Trend Line Chart */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>Hiệu quả tuyển dụng tổng quan</h3>
            <button style={linkStyle}>Theo tuần <ChevronDown style={{ width: 9, height: 9 }} /></button>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: 8, color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />JD đã đăng</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }} />Tiến cử nhận được</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0d9488', display: 'inline-block' }} />Vào phòng vấn</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97316', display: 'inline-block' }} />Tuyển thành công</span>
          </div>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer>
              <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="jd" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="tiencu" stroke="#7c3aed" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="phongvan" stroke="#0d9488" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="tuyendung" stroke="#f97316" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut chart */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>Tỷ lệ chuyển đổi tuyển dụng</h3>
          </div>
          <div style={{ position: 'relative', width: '100%', height: 130 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={funnelData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={60} paddingAngle={2}>
                  {funnelData.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: 8, color: '#94a3b8' }}>Tỷ lệ chuyển đổi chung</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>29.3%</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {funnelData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 9 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                  <span style={{ color: '#1e293b' }}>{d.name}</span>
                </div>
                <span style={{ color: '#64748b', fontWeight: 500 }}>{d.value} ({d.percent})</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, fontWeight: 600, color: '#16a34a', marginTop: 8 }}>
            <TrendingUp style={{ width: 10, height: 10 }} /> 5.2% so với kỳ trước
          </div>
        </div>

        {/* Insights */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>Insight nổi bật</h3>
            <button style={linkStyle}>Xem tất cả <ArrowRight style={{ width: 9, height: 9 }} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {insights.map((ins, i) => (
              <div key={i} style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>
                  {ins.icon}
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b', marginBottom: 2, lineHeight: 1.3 }}>{ins.title}</div>
                  <div style={{ fontSize: 8, color: '#64748b', lineHeight: 1.3 }}>{ins.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Department bar, Source bar, Top positions table */}
      <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr 1.3fr', gap: 12, alignItems: 'stretch' }}>

        {/* Department bar chart */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>Hiệu quả theo phòng ban</h3>
            <button style={linkStyle}>Theo số tuyển thành công <ChevronDown style={{ width: 9, height: 9 }} /></button>
          </div>
          <div style={{ width: '100%', height: 160 }}>
            <ResponsiveContainer>
              <BarChart data={deptData} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 10, fill: '#1e293b', fontWeight: 700 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source horizontal bars */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>Hiệu quả theo nguồn ứng viên</h3>
            <button style={linkStyle}>Theo số tuyển thành công <ChevronDown style={{ width: 9, height: 9 }} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 6 }}>
            {sourceData.map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 9, color: '#1e293b', marginBottom: 6 }}>{s.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(s.value / maxSource) * 100}%`, height: '100%', background: '#7c3aed', borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 600, color: '#1e293b', minWidth: 40, textAlign: 'right' }}>{s.value} ({s.percent})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top positions table */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>Top vị trí tuyển dụng hiệu quả</h3>
            <button style={linkStyle}>Xem tất cả <ArrowRight style={{ width: 9, height: 9 }} /></button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', fontSize: 8, color: '#94a3b8', fontWeight: 600, padding: '4px 0' }}>Vị trí tuyển dụng</th>
                <th style={{ textAlign: 'right', fontSize: 8, color: '#94a3b8', fontWeight: 600, padding: '4px 0' }}>Tỷ lệ chuyển đổi</th>
                <th style={{ textAlign: 'right', fontSize: 8, color: '#94a3b8', fontWeight: 600, padding: '4px 0' }}>Tuyển thành công</th>
              </tr>
            </thead>
            <tbody>
              {topPositions.map((p, i) => (
                <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ fontSize: 9, color: '#1e293b', fontWeight: 500, padding: '8px 0' }}>{p.name}</td>
                  <td style={{ fontSize: 9, color: '#1e293b', textAlign: 'right', padding: '8px 0' }}>{p.rate}</td>
                  <td style={{ fontSize: 9, color: '#1e293b', textAlign: 'right', padding: '8px 0' }}>{p.hires}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4: JD table, Time-to-hire chart, Custom reports */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 12, alignItems: 'stretch' }}>

        {/* JD performance table */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>Hiệu quả theo JD</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', fontSize: 8, color: '#94a3b8', fontWeight: 600, padding: '4px 6px' }}>JD</th>
                  <th style={{ textAlign: 'left', fontSize: 8, color: '#94a3b8', fontWeight: 600, padding: '4px 6px' }}>Phòng ban</th>
                  <th style={{ textAlign: 'right', fontSize: 8, color: '#94a3b8', fontWeight: 600, padding: '4px 6px' }}>Tiến cử nhận được</th>
                  <th style={{ textAlign: 'right', fontSize: 8, color: '#94a3b8', fontWeight: 600, padding: '4px 6px' }}>Vào phòng vấn</th>
                  <th style={{ textAlign: 'right', fontSize: 8, color: '#94a3b8', fontWeight: 600, padding: '4px 6px' }}>Tuyển thành công</th>
                  <th style={{ textAlign: 'right', fontSize: 8, color: '#94a3b8', fontWeight: 600, padding: '4px 6px' }}>Tỷ lệ chuyển đổi</th>
                  <th style={{ textAlign: 'right', fontSize: 8, color: '#94a3b8', fontWeight: 600, padding: '4px 6px' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {jdTable.map((row, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ fontSize: 9, color: '#1e293b', fontWeight: 500, padding: '8px 6px' }}>{row.jd}</td>
                    <td style={{ fontSize: 9, color: '#64748b', padding: '8px 6px' }}>{row.dept}</td>
                    <td style={{ fontSize: 9, color: '#1e293b', textAlign: 'right', padding: '8px 6px' }}>{row.tiencu}</td>
                    <td style={{ fontSize: 9, color: '#1e293b', textAlign: 'right', padding: '8px 6px' }}>{row.phongvan}</td>
                    <td style={{ fontSize: 9, color: '#1e293b', textAlign: 'right', padding: '8px 6px' }}>{row.tuyendung}</td>
                    <td style={{ fontSize: 9, color: '#1e293b', textAlign: 'right', padding: '8px 6px' }}>{row.rate}</td>
                    <td style={{ textAlign: 'right', padding: '8px 6px' }}>
                      <span style={{ fontSize: 8, fontWeight: 600, color: statusColors[row.status].color, background: statusColors[row.status].bg, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button style={{ ...linkStyle, marginTop: 10 }}>Xem tất cả JD <ArrowRight style={{ width: 9, height: 9 }} /></button>
        </div>

        {/* Time to hire chart */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>Thời gian tuyển dụng trung bình</h3>
          </div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>24 ngày</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, fontWeight: 600, color: '#16a34a', marginBottom: 8 }}>
            <TrendingDown style={{ width: 10, height: 10 }} /> 8 ngày so với kỳ trước
          </div>
          <div style={{ width: '100%', height: 140 }}>
            <ResponsiveContainer>
              <LineChart data={timeToHireData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="days" stroke="#7c3aed" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Custom reports */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>Báo cáo tùy chỉnh</h3>
            <button style={linkStyle}>Xem tất cả <ArrowRight style={{ width: 9, height: 9 }} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {customReports.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText style={{ width: 12, height: 12, color: '#3b82f6' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b' }}>{r.title}</div>
                    <div style={{ fontSize: 8, color: '#94a3b8' }}>Cập nhật: {r.updated}</div>
                  </div>
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', flexShrink: 0 }}>
                  <Download style={{ width: 12, height: 12 }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportInsight