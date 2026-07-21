import React, { useState } from 'react'
import {
  Coins,
  ArrowDownToLine,
  ClipboardList,
  Layers,
  FileWarning,
  ChevronRight,
  Plus,
  Filter,
  Search,
  ChevronDown,
  MoreHorizontal,
  Briefcase,
  TrendingUp,
  FileText,
} from 'lucide-react'

const ICON_SM = { width: 10, height: 10 }
const ICON_MD = { width: 12, height: 12 }
const bd = '1px solid #e2e8f0'

const SCROLL_HIDE = `
  .billing-scroll-hide::-webkit-scrollbar { display: none; }
  .billing-scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
`

const SUMMARY_CARDS = [
  { label: 'Credit hiện tại', value: '2,450 credit', link: 'Nạp thêm credit', icon: Coins, bg: '#ffedd5', color: '#ea580c' },
  { label: 'Đã dùng trong tháng', value: '320 credit', link: 'Chi tiết', icon: ArrowDownToLine, bg: '#ede9fe', color: '#7c3aed' },
  { label: 'Request đang xử lý', value: '7', link: 'Xem danh sách', icon: ClipboardList, bg: '#dcfce7', color: '#16a34a' },
  { label: 'Dịch vụ đang hoạt động', value: '4', link: 'Xem chi tiết', icon: Layers, bg: '#dbeafe', color: '#2563eb' },
  { label: 'Invoice chưa thanh toán', value: '2', link: 'Xem chi tiết', icon: FileWarning, bg: '#fee2e2', color: '#dc2626' },
]

const TRANSACTIONS = [
  { date: '15/05/2024 10:30', type: 'Mở hồ sơ ứng viên', change: -10, balance: 2450, content: 'Unlock ứng viên Trần Minh Đức (FE2405-0012)' },
  { date: '14/05/2024 16:45', type: 'Mở hồ sơ ứng viên', change: -10, balance: 2460, content: 'Unlock ứng viên Lê Hoàng Nam (QA2404-0008)' },
  { date: '12/05/2024 09:15', type: 'Nạp credit', change: 2000, balance: 2470, content: 'Nạp credit qua chuyển khoản' },
  { date: '10/05/2024 14:20', type: 'Scout Performance', change: -50, balance: 470, content: 'Yêu cầu Scout Performance – Frontend Developer' },
  { date: '08/05/2024 11:00', type: 'Mở hồ sơ ứng viên', change: -10, balance: 520, content: 'Unlock ứng viên Phạm Quang Minh (BE2405-0007)' },
]

const SERVICES = [
  { title: 'Scout Credit', status: 'Đang hoạt động', statusBg: '#dcfce7', statusColor: '#16a34a', desc: 'Đã unlock: 56 hồ sơ', icon: Briefcase, iconBg: '#dbeafe', iconColor: '#2563eb' },
  { title: 'Scout Performance', status: 'Đang xử lý', statusBg: '#dbeafe', statusColor: '#2563eb', desc: '2 yêu cầu đang chạy', icon: TrendingUp, iconBg: '#ede9fe', iconColor: '#7c3aed' },
  { title: 'Saiyo Branding', status: 'Đang hoạt động', statusBg: '#dcfce7', statusColor: '#16a34a', desc: 'Landing page đang live', icon: FileText, iconBg: '#fce7f3', iconColor: '#db2777' },
  { title: 'Partner CTV', status: 'Đang hoạt động', statusBg: '#dcfce7', statusColor: '#16a34a', desc: '12 CTV đang hợp tác', icon: Layers, iconBg: '#ffedd5', iconColor: '#ea580c' },
]

const RECENT_REQUESTS = [
  { id: 'SP-2405-012', title: 'Scout Performance', sub: 'Trần Minh Đức • FE2405-0012', date: '15/05/2024', status: 'Đang xử lý', statusBg: '#ffedd5', statusColor: '#ea580c' },
  { id: 'SP-2405-009', title: 'Scout Performance', sub: 'Lê Hoàng Nam • QA2404-0008', date: '12/05/2024', status: 'Hoàn thành', statusBg: '#dcfce7', statusColor: '#16a34a' },
  { id: 'SP-2405-007', title: 'Scout Credit unlock', sub: 'Phạm Quang Minh • BE2405-0007', date: '10/05/2024', status: 'Đang chờ WS', statusBg: '#fee2e2', statusColor: '#dc2626' },
]

const UNPAID_INVOICES = [
  { id: 'INV-2405-028', amount: '12,500,000 VND', due: 'Hạn: 25/05/2024' },
  { id: 'INV-2405-022', amount: '8,000,000 VND', due: 'Hạn: 20/05/2024' },
]

const ACTIVITIES = [
  { time: '15/05/2024 10:35', text: 'JobShare đã cập nhật trạng thái request SP-2405-012' },
  { time: '14/05/2024 16:50', text: 'Credit đã trừ 10 cho unlock hồ sơ ứng viên' },
  { time: '12/05/2024 09:20', text: 'Nạp credit thành công +2,000 credit' },
]

const REQUEST_TABS = [
  { key: 'all', label: 'Tất cả', count: 18 },
  { key: 'processing', label: 'Đang xử lý', count: 7 },
  { key: 'waiting', label: 'Chờ phản hồi', count: 3 },
  { key: 'done', label: 'Hoàn thành', count: 6 },
  { key: 'closed', label: 'Đã đóng', count: 2 },
]

const REQUESTS = [
  { id: 'SP-2405-012', type: 'Scout Performance', jd: 'Frontend Developer (FE2405-0012)', candidate: 'Trần Minh Đức', status: 'Đang xử lý', statusBg: '#ffedd5', statusColor: '#ea580c', ws: 'Trần Ngọc Linh', wsInitials: 'TL', created: '15/05/2024', updated: '15/05/2024' },
  { id: 'SP-2405-011', type: 'Scout Credit', jd: 'QA Engineer (QA2404-0008)', candidate: 'Lê Hoàng Nam', status: 'Hoàn thành', statusBg: '#dcfce7', statusColor: '#16a34a', ws: 'Nguyễn Thu Hà', wsInitials: 'NH', created: '14/05/2024', updated: '14/05/2024' },
  { id: 'SP-2405-010', type: 'Scout Performance', jd: 'Backend Developer (BE2405-0007)', candidate: 'Phạm Quang Minh', status: 'Chờ phản hồi', statusBg: '#dbeafe', statusColor: '#2563eb', ws: 'Trần Ngọc Linh', wsInitials: 'TL', created: '13/05/2024', updated: '14/05/2024' },
  { id: 'SP-2405-009', type: 'Saiyo Branding', jd: '—', candidate: '—', status: 'Đang xử lý', statusBg: '#ffedd5', statusColor: '#ea580c', ws: 'Lê Quang Minh', wsInitials: 'LQ', created: '12/05/2024', updated: '13/05/2024' },
  { id: 'SP-2405-008', type: 'Scout Credit', jd: 'DevOps Engineer (DO2405-0003)', candidate: 'Đỗ Minh Tuấn', status: 'Sắp hết hạn', statusBg: '#ede9fe', statusColor: '#7c3aed', ws: 'Nguyễn Thu Hà', wsInitials: 'NH', created: '11/05/2024', updated: '12/05/2024' },
  { id: 'SP-2405-007', type: 'Scout Performance', jd: 'UI/UX Designer (UX2404-0011)', candidate: 'Vũ Thị Hương', status: 'Đã đóng', statusBg: '#f1f5f9', statusColor: '#64748b', ws: 'Trần Ngọc Linh', wsInitials: 'TL', created: '08/05/2024', updated: '10/05/2024' },
  { id: 'SP-2405-006', type: 'Partner CTV', jd: 'Frontend Developer (FE2405-0012)', candidate: 'Trần Minh Đức', status: 'Hoàn thành', statusBg: '#dcfce7', statusColor: '#16a34a', ws: 'Lê Quang Minh', wsInitials: 'LQ', created: '07/05/2024', updated: '09/05/2024' },
  { id: 'SP-2405-005', type: 'Scout Credit', jd: 'Data Analyst (DA2405-0005)', candidate: 'Hoàng Văn An', status: 'Đang xử lý', statusBg: '#ffedd5', statusColor: '#ea580c', ws: 'Nguyễn Thu Hà', wsInitials: 'NH', created: '05/05/2024', updated: '08/05/2024' },
]

const cardStyle = { background: '#fff', border: bd, borderRadius: 8, padding: '8px 10px' }
const linkStyle = { fontSize: 8, color: '#4f46e5', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 2, padding: 0 }

const SectionHeader = ({ title, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
    <div style={{ fontSize: 9, fontWeight: 700, color: '#1e293b' }}>{title}</div>
    {action && (
      <button type="button" style={linkStyle}>{action} <ChevronRight {...ICON_SM} /></button>
    )}
  </div>
)

const Billing = ({ focusSection }) => {
  const isRequestsView = focusSection === 'requests'
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden', padding: '6px 8px', gap: 8, fontSize: 9, minHeight: 0 }}>
      <style>{SCROLL_HIDE}</style>

      {/* Summary cards */}
      {!isRequestsView && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, flexShrink: 0 }}>
        {SUMMARY_CARDS.map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 6, minHeight: 72 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon {...ICON_MD} color={card.color} />
              </div>
              <div style={{ fontSize: 8, color: '#64748b', lineHeight: 1.4 }}>{card.label}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>{card.value}</div>
              <button type="button" style={{ ...linkStyle, marginTop: 'auto' }}>{card.link} <ChevronRight {...ICON_SM} /></button>
            </div>
          )
        })}
      </div>
      )}

      {/* Main body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 260px', gap: 8, minHeight: 0, overflow: 'hidden' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0, overflow: 'hidden' }}>

          {/* Transaction history */}
          {!isRequestsView && (
          <div style={{ ...cardStyle, flex: '0 0 auto', maxHeight: '38%', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <SectionHeader title="Lịch sử giao dịch credit" action="Xem tất cả" />
            <div className="billing-scroll-hide" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Ngày giao dịch', 'Loại giao dịch', 'Thay đổi', 'Số dư', 'Nội dung'].map(h => (
                      <th key={h} style={{ textAlign: 'left', fontSize: 7, color: '#94a3b8', fontWeight: 600, padding: '5px 4px', borderBottom: bd, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TRANSACTIONS.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ fontSize: 8, color: '#64748b', padding: '7px 4px', lineHeight: 1.45, whiteSpace: 'nowrap' }}>{row.date}</td>
                      <td style={{ fontSize: 8, color: '#1e293b', padding: '7px 4px', lineHeight: 1.45 }}>{row.type}</td>
                      <td style={{ fontSize: 8, fontWeight: 600, color: row.change > 0 ? '#16a34a' : '#dc2626', padding: '7px 4px', lineHeight: 1.45, whiteSpace: 'nowrap' }}>
                        {row.change > 0 ? `+${row.change}` : row.change}
                      </td>
                      <td style={{ fontSize: 8, color: '#1e293b', padding: '7px 4px', lineHeight: 1.45 }}>{row.balance.toLocaleString()}</td>
                      <td style={{ fontSize: 8, color: '#64748b', padding: '7px 4px', lineHeight: 1.45 }}>{row.content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* Request list */}
          <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <SectionHeader title="Danh sách yêu cầu" />

            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8, flexShrink: 0 }}>
              {REQUEST_TABS.map(tab => (
                <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} style={{
                  fontSize: 8, padding: '3px 8px', borderRadius: 99, cursor: 'pointer', border: activeTab === tab.key ? 'none' : bd,
                  background: activeTab === tab.key ? '#4f46e5' : '#fff', color: activeTab === tab.key ? '#fff' : '#64748b', fontWeight: 600,
                }}>
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexShrink: 0 }}>
              <button type="button" style={{ border: bd, borderRadius: 6, padding: '4px 8px', background: '#fff', fontSize: 8, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Tất cả loại yêu cầu <ChevronDown {...ICON_SM} />
              </button>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, border: bd, borderRadius: 6, padding: '3px 8px', background: '#f8fafc', minWidth: 0 }}>
                <Search {...ICON_MD} color="#94a3b8" />
                <input placeholder="Tìm theo mã yêu cầu, JD, ứng viên..." style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 8, outline: 'none', minWidth: 0 }} />
              </div>
              <button type="button" style={{ border: bd, borderRadius: 6, padding: '4px 6px', background: '#fff', cursor: 'pointer', display: 'flex' }}>
                <Filter {...ICON_MD} color="#64748b" />
              </button>
            </div>

            <div className="billing-scroll-hide" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
                <thead>
                  <tr>
                    {['Mã yêu cầu', 'Loại yêu cầu', 'JD liên quan', 'Ứng viên liên quan', 'Trạng thái', 'WS phụ trách', 'Ngày tạo', 'Cập nhật gần nhất', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', fontSize: 7, color: '#94a3b8', fontWeight: 600, padding: '5px 4px', borderBottom: bd, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {REQUESTS.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ fontSize: 8, fontWeight: 600, color: '#4f46e5', padding: '7px 4px', lineHeight: 1.45 }}>{row.id}</td>
                      <td style={{ fontSize: 8, color: '#1e293b', padding: '7px 4px', lineHeight: 1.45 }}>{row.type}</td>
                      <td style={{ fontSize: 8, color: '#64748b', padding: '7px 4px', lineHeight: 1.45, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.jd}</td>
                      <td style={{ fontSize: 8, color: '#64748b', padding: '7px 4px', lineHeight: 1.45 }}>{row.candidate}</td>
                      <td style={{ padding: '7px 4px' }}>
                        <span style={{ fontSize: 7, padding: '2px 6px', borderRadius: 99, background: row.statusBg, color: row.statusColor, fontWeight: 600, whiteSpace: 'nowrap' }}>{row.status}</span>
                      </td>
                      <td style={{ padding: '7px 4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#ede9fe', color: '#5b21b6', fontSize: 7, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{row.wsInitials}</div>
                          <span style={{ fontSize: 8, color: '#1e293b', whiteSpace: 'nowrap' }}>{row.ws}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 8, color: '#64748b', padding: '7px 4px', lineHeight: 1.45, whiteSpace: 'nowrap' }}>{row.created}</td>
                      <td style={{ fontSize: 8, color: '#64748b', padding: '7px 4px', lineHeight: 1.45, whiteSpace: 'nowrap' }}>{row.updated}</td>
                      <td style={{ padding: '7px 4px' }}>
                        <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                          <MoreHorizontal {...ICON_MD} color="#94a3b8" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: bd, flexShrink: 0, marginTop: 4 }}>
              <div style={{ fontSize: 8, color: '#64748b' }}>Hiển thị 1 – 8 trong tổng số 18 yêu cầu</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {[1, 2, 3].map(p => (
                  <button key={p} type="button" onClick={() => setPage(p)} style={{
                    width: 22, height: 22, borderRadius: 5, border: bd, fontSize: 8, cursor: 'pointer',
                    background: page === p ? '#4f46e5' : '#fff', color: page === p ? '#fff' : '#64748b', fontWeight: 600,
                  }}>{p}</button>
                ))}
                <button type="button" style={{ width: 22, height: 22, borderRadius: 5, border: bd, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight {...ICON_SM} color="#64748b" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="billing-scroll-hide" style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', minHeight: 0 }}>

          <div style={cardStyle}>
            <SectionHeader title="Dịch vụ đang sử dụng" action="Xem tất cả" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SERVICES.map((svc, i) => {
                const Icon = svc.icon
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < SERVICES.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: svc.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon {...ICON_MD} color={svc.iconColor} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginBottom: 2 }}>
                        <span style={{ fontSize: 8, fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>{svc.title}</span>
                        <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 99, background: svc.statusBg, color: svc.statusColor, fontWeight: 600 }}>{svc.status}</span>
                      </div>
                      <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45 }}>{svc.desc}</div>
                    </div>
                    <button type="button" style={{ fontSize: 8, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, fontWeight: 600 }}>Chi tiết</button>
                  </div>
                )
              })}
            </div>
          </div>

          <button type="button" style={{
            width: '100%', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px', fontSize: 9, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            <Plus {...ICON_MD} color="#fff" /> Tạo yêu cầu mới
          </button>

          <div style={cardStyle}>
            <SectionHeader title="Yêu cầu gần đây" action="Xem tất cả" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {RECENT_REQUESTS.map((req, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ClipboardList {...ICON_SM} color="#5b21b6" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 8, fontWeight: 600, color: '#4f46e5', lineHeight: 1.4 }}>{req.id}</div>
                    <div style={{ fontSize: 8, color: '#1e293b', lineHeight: 1.45 }}>{req.title}</div>
                    <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45 }}>{req.sub}</div>
                    <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45 }}>{req.date}</div>
                  </div>
                  <span style={{ fontSize: 7, padding: '2px 5px', borderRadius: 99, background: req.statusBg, color: req.statusColor, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{req.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <SectionHeader title="Invoice chưa thanh toán" action="Xem tất cả" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {UNPAID_INVOICES.map((inv, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileWarning {...ICON_SM} color="#dc2626" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 8, fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>{inv.id}</div>
                    <div style={{ fontSize: 8, fontWeight: 600, color: '#1e293b', lineHeight: 1.45 }}>{inv.amount}</div>
                    <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45 }}>{inv.due}</div>
                  </div>
                  <span style={{ fontSize: 7, padding: '2px 5px', borderRadius: 99, background: '#fee2e2', color: '#dc2626', fontWeight: 600, whiteSpace: 'nowrap' }}>Chưa thanh toán</span>
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <SectionHeader title="Hoạt động gần đây" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ACTIVITIES.map((act, i) => (
                <div key={i} style={{ fontSize: 8, color: '#475569', lineHeight: 1.55 }}>
                  <div style={{ fontSize: 7, color: '#94a3b8', marginBottom: 2 }}>{act.time}</div>
                  {act.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Billing
