import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  ChevronDown,
  ChevronRight,
  Star,
  User,
  MoreHorizontal,
  FileText,
  Download,
  Paperclip,
  Smile,
  Send,
  CheckCheck,
  Clock,
  Check,
  Circle,
  Minus,
  Filter,
  X,
  ClipboardList,
  Headphones,
  CreditCard,
  Users,
  FileSpreadsheet,
  HelpCircle,
  History,
  Briefcase,
  Coins,
  ExternalLink,
} from 'lucide-react'

const ICON_SM = { width: 10, height: 10 }
const ICON_MD = { width: 12, height: 12 }
const CTV_TAB_INDEX = 2
const WS_TAB_INDEX = 3
const bd = '1px solid #e2e8f0'

const CONVERSATIONS = [
  { id: 1, name: 'Trần Văn Hùng', initials: 'TVH', role: 'Frontend Developer', source: 'lp', job: 'Frontend Developer (FE2405-0012)', time: '10:30', unread: 2, online: true, bg: '#bfdbfe', color: '#1e40af' },
  { id: 2, name: 'Nguyễn Thị Thu Hà', initials: 'NTH', role: 'QA Engineer', source: 'lp', job: 'QA Engineer (QA2404-0008)', time: '09:15', unread: 1, online: true, bg: '#fce7f3', color: '#9d174d' },
  { id: 3, name: 'Phạm Quang Minh', initials: 'PQM', role: 'Backend Developer', source: 'lp', job: 'Backend Developer (BE2405-0007)', time: 'Hôm qua', unread: 0, online: false, bg: '#d1fae5', color: '#065f46' },
  { id: 4, name: 'Lê Thị Mai Anh', initials: 'LMA', role: 'UI/UX Designer', source: 'lp', job: 'UI/UX Designer (UX2404-0011)', time: 'Hôm qua', unread: 1, online: true, bg: '#fef9c3', color: '#854d0e' },
]

const SCOUT_CONVERSATIONS = [
  { id: 5, name: 'Nguyễn Hoàng Nam', initials: 'NHN', role: 'DevOps Engineer', source: 'sc', job: 'DevOps Engineer (DEV2405-0006)', time: '11:20', unread: 2, online: false, bg: '#ede9fe', color: '#5b21b6' },
  { id: 6, name: 'Đỗ Thành Trung', initials: 'ĐTT', role: 'Data Engineer', source: 'sc', job: 'Data Engineer (DE2405-0008)', time: 'Hôm qua', unread: 0, online: false, bg: '#ffedd5', color: '#9a3412' },
  { id: 7, name: 'Vũ Bình An', initials: 'VBA', role: 'Fullstack Developer', source: 'sc', job: 'Fullstack Developer (FS2404-0010)', time: '2 ngày trước', unread: 0, online: false, bg: '#e0e7ff', color: '#3730a3' },
]

const WS_CONVERSATIONS = [
  { id: 101, title: 'WS Team – Tuyển dụng', subtitle: 'Yêu cầu Scout Performance', snippet: 'WS: Chúng tôi đã tiếp cận ứng viên phù hợp...', time: '10:42', unread: 3 },
  { id: 102, title: 'WS Billing', subtitle: 'Yêu cầu nạp credit', snippet: 'WS: Hóa đơn tháng 5 đã được gửi...', time: '09:15', unread: 1 },
  { id: 103, title: 'WS Branding Team', subtitle: 'Saiyo Branding', snippet: 'WS: Bản thiết kế landing page đã cập nhật...', time: 'Hôm qua', unread: 0 },
  { id: 104, title: 'WS Support', subtitle: 'Hỗ trợ kỹ thuật', snippet: 'WS: Vấn đề đăng JD đã được xử lý...', time: 'Hôm qua', unread: 0 },
  { id: 105, title: 'WS Advisory', subtitle: 'Tư vấn dịch vụ', snippet: 'WS: Lịch tư vấn 1-1 vào thứ 4...', time: '2 ngày trước', unread: 0 },
]

const MESSAGES = [
  { id: 1, type: 'incoming', text: 'Chào anh/chị,\nEm đã xem qua mô tả công việc và rất quan tâm đến vị trí Frontend Developer. Em có 3 năm kinh nghiệm với React, TypeScript. Anh/chị có thể cho em biết thêm về team và dự án hiện tại được không ạ?', time: '10:15' },
  { id: 2, type: 'outgoing', text: 'Chào Hùng,\nCảm ơn bạn đã quan tâm đến vị trí này. Hiện tại team đang phát triển nền tảng SaaS cho thị trường Nhật Bản. Bạn có thể gửi CV chi tiết để mình xem qua nhé.', time: '10:18', read: true },
  { id: 3, type: 'incoming', text: 'Dạ vâng ạ, em gửi CV chi tiết ạ.', time: '10:20', file: { name: 'CV_TranVanHung.pdf', size: '1.4 MB', kind: 'pdf' } },
  { id: 4, type: 'outgoing', text: 'Cảm ơn Hùng, CV của bạn phù hợp với vị trí. Mình sẽ sắp xếp lịch phỏng vấn, bạn có thể cho mình biết thời gian rảnh trong tuần này nhé.', time: '10:22', read: true },
]

const WS_MESSAGES = [
  { id: 1, type: 'incoming', text: 'Chào anh/chị,\nWS Team đã nhận yêu cầu Scout Performance cho vị trí Frontend Developer. Chúng tôi đang rà soát pool ứng viên phù hợp.', time: '10:30' },
  { id: 2, type: 'outgoing', text: 'Cảm ơn team WS. Anh/chị có thể cập nhật tiến độ và gửi danh sách ứng viên shortlist trong tuần này được không ạ?', time: '10:35', read: true },
  { id: 3, type: 'incoming', text: 'Dạ vâng, WS gửi báo cáo tiến độ và danh sách ứng viên phù hợp ạ.', time: '10:38', file: { name: 'Báo cáo tiến độ ứng viên', size: '1.2 MB', kind: 'pdf' } },
  { id: 4, type: 'incoming', text: '', time: '10:40', file: { name: 'Danh sách ứng viên phù hợp (4)', size: '58 KB', kind: 'xlsx' } },
  { id: 5, type: 'outgoing', text: 'Cảm ơn WS. Mình sẽ xem qua và phản hồi trong hôm nay.', time: '10:42', read: true },
]

const CTV_CONVERSATIONS = [
  { id: 201, ctvName: 'Nguyễn Văn A', initials: 'NA', bg: '#dbeafe', color: '#1d4ed8', candidate: 'Trần Minh Đức', job: 'Frontend Developer (FE2405-0012)', time: '10:45', unread: 3 },
  { id: 202, ctvName: 'Trần Thị Mai', initials: 'TM', bg: '#fce7f3', color: '#9d174d', candidate: 'Lê Hoàng Nam', job: 'QA Engineer (QA2404-0008)', time: '09:20', unread: 2 },
  { id: 203, ctvName: 'Phạm Quang Huy', initials: 'PH', bg: '#d1fae5', color: '#065f46', candidate: 'Nguyễn Văn Bình', job: 'Backend Developer (BE2405-0007)', time: 'Hôm qua', unread: 1 },
  { id: 204, ctvName: 'Lê Thị Lan', initials: 'LL', bg: '#fef9c3', color: '#854d0e', candidate: 'Đỗ Minh Tuấn', job: 'DevOps Engineer (DO2405-0003)', time: 'Hôm qua', unread: 0 },
  { id: 205, ctvName: 'Hoàng Văn Đức', initials: 'HĐ', bg: '#ede9fe', color: '#5b21b6', candidate: 'Vũ Thị Hương', job: 'UI/UX Designer (UX2404-0011)', time: '2 ngày trước', unread: 0 },
]

const CTV_MESSAGES = [
  { id: 1, sender: 'ws', text: 'Chào anh/chị,\nWS đã tiếp nhận đơn tiến cử #MT2405-0012. CTV Nguyễn Văn A đã gửi hồ sơ ứng viên Trần Minh Đức cho vị trí Frontend Developer.', time: '10:30' },
  { id: 2, sender: 'outgoing', text: 'Cảm ơn WS và CTV. Mình sẽ xem hồ sơ và phản hồi trong hôm nay. Anh/chị có thể bổ sung thêm kinh nghiệm dự án Nhật Bản của ứng viên không?', time: '10:35', read: true },
  { id: 3, sender: 'ctv', text: 'Dạ vâng anh/chị, em gửi kèm CV chi tiết và portfolio của ứng viên ạ. Ứng viên có 3 năm kinh nghiệm React, từng làm dự án outsourcing cho thị trường Nhật.', time: '10:40', file: { name: 'CV_TrầnMinhĐức.pdf', size: '1.4 MB', kind: 'pdf' } },
  { id: 4, sender: 'ws', text: 'WS ghi nhận. Doanh nghiệp vui lòng xác nhận lịch phỏng vấn sơ bộ trong tuần này để WS và CTV hỗ trợ điều phối.', time: '10:42' },
]

const CTV_NOTES = [
  { time: '16/05/2024 14:20', author: 'HR Manager', text: 'Đã xem CV, ứng viên phù hợp. Chờ xác nhận lịch phỏng vấn từ CTV.' },
]

const QUICK_REPLIES = ['Mời phỏng vấn', 'Follow-up', 'Yêu cầu bổ sung', 'Cảm ơn ứng tuyển', 'Từ chối']
const CTV_QUICK_REPLIES = ['Yêu cầu thêm thông tin', 'Xác nhận lịch phỏng vấn', 'Đề nghị báo giá thưởng', 'Cảm ơn CTV', 'Khác']
const WS_QUICK_REPLIES = ['Cập nhật tiến độ', 'Yêu cầu ứng viên khác', 'Sắp xếp phỏng vấn', 'Hỏi về ứng viên', 'Khác']

const TABS = [
  { label: 'LP', badge: 8 },
  { label: 'Scout', badge: 6 },
  { label: 'CTV', badge: 5 },
  { label: 'WS', badge: 2 },
]

const TIMELINE = [
  { label: 'Ứng tuyển', date: '18/05/2024', status: 'done' },
  { label: 'Sàng lọc hồ sơ', date: '18/05/2024', status: 'done' },
  { label: 'Phỏng vấn', badge: 'Sắp xếp lịch', badgeType: 'warn', status: 'active' },
  { label: 'Offer', badge: 'Chưa bắt đầu', badgeType: 'gray', status: 'pending' },
  { label: 'Hired', badge: 'Chưa bắt đầu', badgeType: 'gray', status: 'pending' },
]

const WS_REQUEST_TYPES = [
  { id: 'consult', label: 'Yêu cầu tư vấn dịch vụ', desc: 'Tư vấn gói dịch vụ tuyển dụng', icon: Headphones, bg: '#dbeafe', color: '#1d4ed8' },
  { id: 'credit', label: 'Yêu cầu nạp thêm credit', desc: 'Nạp Scout / Billing credit', icon: CreditCard, bg: '#fef9c3', color: '#854d0e' },
  { id: 'scout', label: 'Trao đổi về ứng viên (Scout Performance)', desc: 'Cập nhật tiến độ scout ứng viên', icon: Users, bg: '#dcfce7', color: '#16a34a' },
  { id: 'quote', label: 'Yêu cầu báo giá / Hợp đồng', desc: 'Báo giá dịch vụ hoặc hợp đồng', icon: FileText, bg: '#ede9fe', color: '#5b21b6' },
  { id: 'other', label: 'Hỗ trợ khác', desc: 'Các yêu cầu khác cần WS hỗ trợ', icon: HelpCircle, bg: '#f1f5f9', color: '#64748b' },
]

const WS_ACTIVE_REQUESTS = [
  { title: 'Ủy thác tuyển dụng', id: 'REQ-2405-0012', date: '15/05/2024', status: 'Đang xử lý', statusBg: '#ffedd5', statusColor: '#ea580c', dot: 'active' },
  { title: 'Scout Performance – FE', id: 'REQ-2405-0008', date: '10/05/2024', status: 'Hoàn thành', statusBg: '#dcfce7', statusColor: '#16a34a', dot: 'done' },
]

const WS_NOTES = [
  { time: '18/05/2024 11:30', author: 'Nguyễn Văn A', text: 'WS đã gửi 4 ứng viên phù hợp. Cần review và phản hồi trước thứ 6.' },
]

const RIGHT_ACTIONS = [
  { icon: User, label: 'Hồ sơ' },
  { icon: Download, label: 'CV' },
  { icon: Clock, label: 'Lịch sử' },
]

const SCROLL_HIDE = `
  .msg-scroll-hide::-webkit-scrollbar { display: none; }
  .msg-scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
`

const TimelineIcon = ({ status }) => {
  const base = { width: 8, height: 8, flexShrink: 0 }
  if (status === 'done') return <Check {...base} color="#16a34a" strokeWidth={2.5} />
  if (status === 'active') return <Circle {...base} color="#4f6ef7" fill="#4f6ef7" strokeWidth={0} />
  return <Minus {...base} color="#94a3b8" strokeWidth={2} />
}

const Avatar = ({ initials, bg, color, size = 28, online = false }) => (
  <div style={{ position: 'relative', flexShrink: 0 }}>
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 600,
    }}>{initials}</div>
    {online && (
      <div style={{
        position: 'absolute', bottom: 0, right: 0, width: 7, height: 7,
        borderRadius: '50%', background: '#22c55e', border: '1.5px solid #fff',
      }} />
    )}
  </div>
)

const WsLogo = ({ size = 28 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.32, fontWeight: 700, flexShrink: 0,
  }}>WS</div>
)

const CompanyLogo = ({ size = 28 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', background: '#1e293b',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.28, fontWeight: 700, flexShrink: 0,
  }}>ABC</div>
)

const InfoCard = ({ title, children }) => (
  <div style={{ padding: '9px 9px', borderBottom: bd }}>
    <div style={{ fontSize: 8, fontWeight: 600, color: '#64748b', marginBottom: 7, lineHeight: 1.4 }}>{title}</div>
    {children}
  </div>
)

const Tag = ({ children, type }) => {
  const styles = {
    lp: { background: '#dbeafe', color: '#1d4ed8' },
    sc: { background: '#fce7f3', color: '#9d174d' },
    role: { background: '#f1f5f9', color: '#475569' },
    active: { background: '#dcfce7', color: '#16a34a' },
    hiring: { background: '#dcfce7', color: '#16a34a' },
    discuss: { background: '#ede9fe', color: '#5b21b6' },
    ready: { background: '#dcfce7', color: '#16a34a' },
    pendingBonus: { background: '#fef9c3', color: '#854d0e' },
  }
  return (
    <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 99, fontWeight: 500, whiteSpace: 'nowrap', ...styles[type] }}>
      {children}
    </span>
  )
}

const FileCard = ({ file }) => {
  const isXlsx = file.kind === 'xlsx'
  return (
    <div style={{ background: '#fff', border: bd, borderRadius: 6, padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6, width: '100%', maxWidth: 210 }}>
      <div style={{ width: 24, height: 24, background: isXlsx ? '#dcfce7' : '#fce7f3', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isXlsx ? <FileSpreadsheet {...ICON_MD} color="#16a34a" /> : <FileText {...ICON_MD} color="#9d174d" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 8, fontWeight: 500, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
        <div style={{ fontSize: 7, color: '#64748b' }}>{file.size} • {isXlsx ? 'XLSX' : 'PDF'}</div>
      </div>
      <button type="button" style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
        <Download {...ICON_MD} color="#64748b" />
      </button>
    </div>
  )
}

const ConvItem = ({ conv, active, onClick }) => (
  <div onClick={onClick} style={{
    display: 'flex', alignItems: 'flex-start', gap: 7, padding: '9px 9px',
    cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: active ? '#eff2ff' : 'transparent',
  }}>
    <Avatar initials={conv.initials} bg={conv.bg} color={conv.color} size={28} online={conv.online} />
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.4 }}>{conv.name}</div>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Tag type="role">{conv.role}</Tag>
        <Tag type={conv.source}>{conv.source === 'lp' ? 'Từ Landing Page' : 'Scout Credit'}</Tag>
      </div>
      <div style={{ fontSize: 8, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.45 }}>
        {conv.source === 'lp' ? 'Ứng tuyển: ' : 'JD: '}{conv.job}
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
      <span style={{ fontSize: 8, color: '#94a3b8', whiteSpace: 'nowrap' }}>{conv.time}</span>
      {conv.unread > 0 && (
        <span style={{ background: '#4f6ef7', color: '#fff', borderRadius: 99, fontSize: 7, fontWeight: 600, padding: '0 4px', minWidth: 14, textAlign: 'center' }}>{conv.unread}</span>
      )}
    </div>
  </div>
)

const CtvConvItem = ({ conv, active, onClick }) => (
  <div onClick={onClick} style={{
    display: 'flex', alignItems: 'flex-start', gap: 7, padding: '9px 9px',
    cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
    background: active ? '#eff2ff' : 'transparent',
    borderLeft: active ? '3px solid #4f6ef7' : '3px solid transparent',
  }}>
    <Avatar initials={conv.initials} bg={conv.bg} color={conv.color} size={28} />
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>{conv.ctvName} (CTV)</div>
      <div style={{ fontSize: 8, color: '#64748b', lineHeight: 1.45 }}>Ứng viên: {conv.candidate}</div>
      <div style={{ fontSize: 8, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.45 }}>JD: {conv.job}</div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
      <span style={{ fontSize: 8, color: '#94a3b8', whiteSpace: 'nowrap' }}>{conv.time}</span>
      {conv.unread > 0 && (
        <span style={{ background: '#4f6ef7', color: '#fff', borderRadius: 99, fontSize: 7, fontWeight: 600, padding: '0 4px', minWidth: 14, textAlign: 'center' }}>{conv.unread}</span>
      )}
    </div>
  </div>
)

const CtvChatMessage = ({ msg }) => {
  const isOutgoing = msg.sender === 'outgoing'
  const isCtv = msg.sender === 'ctv'
  const bubbleStyle = isOutgoing
    ? { background: '#4f6ef7', color: '#fff', border: 'none' }
    : isCtv
      ? { background: '#ecfdf5', color: '#1e293b', border: '1px solid #bbf7d0' }
      : { background: '#fff', color: '#1e293b', border: bd }

  const AvatarEl = isOutgoing ? <CompanyLogo size={24} /> : isCtv ? <Avatar initials="NA" bg="#dbeafe" color="#1d4ed8" size={24} /> : <WsLogo size={24} />

  return (
    <div style={{
      maxWidth: '78%', display: 'flex', gap: 6, alignSelf: isOutgoing ? 'flex-end' : 'flex-start',
      flexDirection: isOutgoing ? 'row-reverse' : 'row', alignItems: 'flex-end',
    }}>
      {AvatarEl}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
        {msg.text && (
          <div style={{ padding: '5px 9px', borderRadius: 8, fontSize: 9, lineHeight: 1.4, whiteSpace: 'pre-line', ...bubbleStyle }}>{msg.text}</div>
        )}
        {msg.file && <FileCard file={msg.file} />}
        <div style={{ fontSize: 7, color: '#94a3b8', textAlign: isOutgoing ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 3, justifyContent: isOutgoing ? 'flex-end' : 'flex-start' }}>
          {msg.time}
          {msg.read && <CheckCheck {...ICON_SM} color="#a5b4fc" />}
        </div>
      </div>
    </div>
  )
}

const WsConvItem = ({ conv, active, onClick }) => (
  <div onClick={onClick} style={{
    display: 'flex', alignItems: 'flex-start', gap: 7, padding: '9px 9px',
    cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
    background: active ? '#eef2ff' : 'transparent',
    borderLeft: active ? '3px solid #4f46e5' : '3px solid transparent',
  }}>
    <WsLogo size={28} />
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>{conv.title}</div>
      <div style={{ fontSize: 8, color: '#64748b', lineHeight: 1.45 }}>{conv.subtitle}</div>
      <div style={{ fontSize: 8, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.45 }}>{conv.snippet}</div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
      <span style={{ fontSize: 8, color: '#94a3b8', whiteSpace: 'nowrap' }}>{conv.time}</span>
      {conv.unread > 0 && (
        <span style={{ background: '#4f46e5', color: '#fff', borderRadius: 99, fontSize: 7, fontWeight: 600, padding: '0 4px', minWidth: 14, textAlign: 'center' }}>{conv.unread}</span>
      )}
    </div>
  </div>
)

const ChatMessage = ({ msg, showWsAvatar = false }) => (
  <div style={{
    maxWidth: '72%', display: 'flex', gap: 6, alignSelf: msg.type === 'outgoing' ? 'flex-end' : 'flex-start',
    flexDirection: msg.type === 'outgoing' ? 'row-reverse' : 'row', alignItems: 'flex-end',
  }}>
    {showWsAvatar && msg.type === 'incoming' && <WsLogo size={24} />}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
      {msg.text && (
        <div style={{
          padding: '5px 9px', borderRadius: 8, fontSize: 9, lineHeight: 1.4,
          background: msg.type === 'outgoing' ? '#4f46e5' : '#fff',
          color: msg.type === 'outgoing' ? '#fff' : '#1e293b',
          whiteSpace: 'pre-line', border: msg.type === 'incoming' ? bd : 'none',
        }}>{msg.text}</div>
      )}
      {msg.file && <FileCard file={msg.file} />}
      <div style={{ fontSize: 7, color: '#94a3b8', textAlign: msg.type === 'outgoing' ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 3, justifyContent: msg.type === 'outgoing' ? 'flex-end' : 'flex-start' }}>
        {msg.time}
        {msg.read && <CheckCheck {...ICON_SM} color="#a5b4fc" />}
      </div>
    </div>
  </div>
)

const RequestFormPanel = ({ onClose, requestType, setRequestType, description, setDescription }) => (
  <div style={{
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    width: '88%', maxWidth: 340, background: '#fff', borderRadius: 10, border: bd,
    boxShadow: '0 8px 32px rgba(15,23,42,0.12)', zIndex: 20, display: 'flex', flexDirection: 'column', maxHeight: '92%',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderBottom: bd, flexShrink: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>Phiếu gửi yêu cầu</div>
      <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
        <X {...ICON_MD} color="#64748b" />
      </button>
    </div>
    <div className="msg-scroll-hide" style={{ overflowY: 'auto', padding: '8px 10px', flex: 1 }}>
      <div style={{ fontSize: 8, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Chọn loại yêu cầu</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
        {WS_REQUEST_TYPES.map((rt) => {
          const Icon = rt.icon
          const selected = requestType === rt.id
          return (
            <label key={rt.id} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '7px 8px', borderRadius: 7, cursor: 'pointer',
              border: selected ? '1.5px solid #4f46e5' : bd, background: selected ? '#eef2ff' : '#fff',
            }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: rt.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon {...ICON_MD} color={rt.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 8, fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>{rt.label}</div>
                <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.4 }}>{rt.desc}</div>
              </div>
              <input type="radio" name="ws-request-type" checked={selected} onChange={() => setRequestType(rt.id)} style={{ accentColor: '#4f46e5', flexShrink: 0 }} />
            </label>
          )
        })}
      </div>
      <div style={{ fontSize: 8, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>Mô tả yêu cầu (không bắt buộc)</div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value.slice(0, 500))}
        placeholder="Nhập chi tiết yêu cầu của bạn..."
        rows={4}
        style={{ width: '100%', border: bd, borderRadius: 7, padding: '6px 8px', fontSize: 8, resize: 'none', outline: 'none', boxSizing: 'border-box', lineHeight: 1.45, fontFamily: 'inherit' }}
      />
      <div style={{ fontSize: 7, color: '#94a3b8', textAlign: 'right', marginTop: 3 }}>{description.length}/500</div>
    </div>
    <div style={{ padding: '8px 10px', borderTop: bd, flexShrink: 0 }}>
      <button type="button" onClick={onClose} style={{ width: '100%', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 7, padding: '7px', fontSize: 9, fontWeight: 600, cursor: 'pointer' }}>
        Gửi yêu cầu
      </button>
    </div>
  </div>
)

const Message = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [activeConv, setActiveConv] = useState(1)
  const [activeWsConv, setActiveWsConv] = useState(101)
  const [activeCtvConv, setActiveCtvConv] = useState(201)
  const [chatTab, setChatTab] = useState(0)
  const [wsChatTab, setWsChatTab] = useState(0)
  const [input, setInput] = useState('')
  const [wsInput, setWsInput] = useState('')
  const [ctvInput, setCtvInput] = useState('')
  const [messages, setMessages] = useState(MESSAGES)
  const [wsMessages, setWsMessages] = useState(WS_MESSAGES)
  const [ctvMessages, setCtvMessages] = useState(CTV_MESSAGES)
  const [showRequestForm, setShowRequestForm] = useState(true)
  const [requestType, setRequestType] = useState('scout')
  const [requestDescription, setRequestDescription] = useState('')
  const msgEndRef = useRef(null)
  const wsMsgEndRef = useRef(null)
  const ctvMsgEndRef = useRef(null)

  const isWsTab = activeTab === WS_TAB_INDEX
  const isCtvTab = activeTab === CTV_TAB_INDEX
  const selectedConv = [...CONVERSATIONS, ...SCOUT_CONVERSATIONS].find(c => c.id === activeConv) || CONVERSATIONS[0]
  const selectedWsConv = WS_CONVERSATIONS.find(c => c.id === activeWsConv) || WS_CONVERSATIONS[0]
  const selectedCtvConv = CTV_CONVERSATIONS.find(c => c.id === activeCtvConv) || CTV_CONVERSATIONS[0]

  const handleSend = () => {
    if (!input.trim()) return
    setMessages(prev => [...prev, {
      id: prev.length + 1, type: 'outgoing', text: input.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), read: false,
    }])
    setInput('')
  }

  const handleWsSend = () => {
    if (!wsInput.trim()) return
    setWsMessages(prev => [...prev, {
      id: prev.length + 1, type: 'outgoing', text: wsInput.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), read: false,
    }])
    setWsInput('')
  }

  const handleCtvSend = () => {
    if (!ctvInput.trim()) return
    setCtvMessages(prev => [...prev, {
      id: prev.length + 1, sender: 'outgoing', text: ctvInput.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), read: false,
    }])
    setCtvInput('')
  }

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    wsMsgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [wsMessages])

  useEffect(() => {
    ctvMsgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ctvMessages])

  const handleTabChange = (i) => {
    setActiveTab(i)
    if (i === WS_TAB_INDEX) {
      setWsChatTab(0)
      setShowRequestForm(true)
    }
    if (i === CTV_TAB_INDEX) setShowRequestForm(false)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden', padding: '3px 5px', minHeight: 0, fontSize: 9 }}>
      <style>{SCROLL_HIDE}</style>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '210px 1fr 210px', overflow: 'hidden', border: bd, borderRadius: 8, background: '#fff', minHeight: 0 }}>

        {/* LEFT */}
        <div style={{ borderRight: bd, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ display: 'flex', borderBottom: bd, flexShrink: 0 }}>
            {TABS.map((tab, i) => (
              <div key={i} onClick={() => handleTabChange(i)} style={{
                flex: 1, padding: '4px 2px 3px', textAlign: 'center', fontSize: 8,
                color: activeTab === i ? '#4f6ef7' : '#64748b',
                borderBottom: activeTab === i ? '2px solid #4f6ef7' : '2px solid transparent',
                cursor: 'pointer', position: 'relative',
              }}>
                {tab.label}
                <span style={{ position: 'absolute', top: 2, right: 3, background: '#ef4444', color: '#fff', borderRadius: 99, fontSize: 6, fontWeight: 700, padding: '0 3px', minWidth: 12, textAlign: 'center' }}>{tab.badge}</span>
              </div>
            ))}
          </div>

          {isWsTab ? (
            <>
              <div style={{ padding: '4px 6px', borderBottom: bd, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, border: bd, borderRadius: 6, padding: '3px 6px', background: '#f8fafc', marginBottom: 4 }}>
                  <Search {...ICON_MD} color="#94a3b8" style={{ flexShrink: 0 }} />
                  <input placeholder="Tìm kiếm theo tên, nội dung, yêu cầu..." style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 8, outline: 'none', minWidth: 0 }} />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="button" style={{ flex: 1, border: bd, borderRadius: 6, padding: '3px 6px', background: '#fff', cursor: 'pointer', fontSize: 8, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    Tất cả trạng thái <ChevronDown {...ICON_SM} />
                  </button>
                  <button type="button" style={{ border: bd, borderRadius: 6, padding: '3px 6px', background: '#fff', cursor: 'pointer', display: 'flex' }}>
                    <Filter {...ICON_MD} color="#64748b" />
                  </button>
                </div>
              </div>
              <div className="msg-scroll-hide" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
                {WS_CONVERSATIONS.map(conv => (
                  <WsConvItem key={conv.id} conv={conv} active={activeWsConv === conv.id} onClick={() => setActiveWsConv(conv.id)} />
                ))}
                <button type="button" style={{ padding: '10px 9px', fontSize: 8, color: '#4f46e5', cursor: 'pointer', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 2, lineHeight: 1.5 }}>
                  Xem tất cả cuộc trò chuyện <ChevronRight {...ICON_SM} />
                </button>
              </div>
            </>
          ) : isCtvTab ? (
            <>
              <div style={{ padding: '4px 6px', borderBottom: bd, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, border: bd, borderRadius: 6, padding: '3px 6px', background: '#f8fafc', marginBottom: 4 }}>
                  <Search {...ICON_MD} color="#94a3b8" style={{ flexShrink: 0 }} />
                  <input placeholder="Tìm kiếm CTV, ứng viên, tên JD..." style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 8, outline: 'none', minWidth: 0 }} />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="button" style={{ flex: 1, border: bd, borderRadius: 6, padding: '3px 6px', background: '#fff', cursor: 'pointer', fontSize: 8, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    Tất cả trạng thái <ChevronDown {...ICON_SM} />
                  </button>
                  <button type="button" style={{ border: bd, borderRadius: 6, padding: '3px 6px', background: '#fff', cursor: 'pointer', display: 'flex' }}>
                    <Filter {...ICON_MD} color="#64748b" />
                  </button>
                </div>
              </div>
              <div className="msg-scroll-hide" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
                {CTV_CONVERSATIONS.map(conv => (
                  <CtvConvItem key={conv.id} conv={conv} active={activeCtvConv === conv.id} onClick={() => setActiveCtvConv(conv.id)} />
                ))}
                <button type="button" style={{ padding: '10px 9px', fontSize: 8, color: '#4f6ef7', cursor: 'pointer', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 2, lineHeight: 1.5 }}>
                  Xem tất cả cuộc trò chuyện <ChevronRight {...ICON_SM} />
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 5px', borderBottom: bd, flexShrink: 0 }}>
                <Search {...ICON_MD} color="#94a3b8" style={{ flexShrink: 0 }} />
                <input placeholder="Tìm kiếm tên, vị trí, JD..." style={{ flex: 1, border: bd, borderRadius: 6, padding: '3px 6px', fontSize: 8, background: '#f8fafc', color: '#1e293b', outline: 'none', minWidth: 0 }} />
                <button type="button" style={{ border: bd, borderRadius: 6, padding: '2px 5px', background: '#fff', cursor: 'pointer', fontSize: 8, color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
                  Trạng thái <ChevronDown {...ICON_SM} />
                </button>
              </div>
              <div className="msg-scroll-hide" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
                {(activeTab === 1 ? SCOUT_CONVERSATIONS : CONVERSATIONS).map(conv => (
                  <ConvItem key={conv.id} conv={conv} active={activeConv === conv.id} onClick={() => setActiveConv(conv.id)} />
                ))}
                <button type="button" style={{ padding: '10px 9px', fontSize: 8, color: '#4f6ef7', cursor: 'pointer', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 2, lineHeight: 1.5 }}>
                  Xem tất cả cuộc trò chuyện <ChevronRight {...ICON_SM} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* CENTER */}
        {isWsTab ? (
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc', minHeight: 0, position: 'relative' }}>
            <div style={{ background: '#fff', borderBottom: bd, padding: '4px 8px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <WsLogo size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', lineHeight: 1.3 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#1e293b' }}>{selectedWsConv.title}</span>
                    <Tag type="active">Đang hoạt động</Tag>
                  </div>
                  <div style={{ fontSize: 8, color: '#64748b', marginTop: 2, lineHeight: 1.45 }}>Đội ngũ tư vấn tuyển dụng của JobShare</div>
                  <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45 }}>Thời gian phản hồi trung bình: 15 phút</div>
                </div>
                <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
                  <button type="button" onClick={() => setShowRequestForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 3, border: '1.5px solid #4f46e5', borderRadius: 5, padding: '3px 7px', fontSize: 8, color: '#4f46e5', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                    <ClipboardList {...ICON_SM} /> Phiếu gửi yêu cầu
                  </button>
                  <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
                    <MoreHorizontal {...ICON_MD} color="#64748b" />
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', borderBottom: bd, background: '#fff', padding: '0 8px', flexShrink: 0 }}>
              {['Trò chuyện', 'Yêu cầu của tôi', 'Lịch sử yêu cầu'].map((t, i) => (
                <div key={i} onClick={() => setWsChatTab(i)} style={{
                  padding: '4px 6px', fontSize: 8, cursor: 'pointer',
                  color: wsChatTab === i ? '#4f46e5' : '#64748b',
                  borderBottom: wsChatTab === i ? '2px solid #4f46e5' : '2px solid transparent',
                  fontWeight: wsChatTab === i ? 600 : 400,
                }}>{t}</div>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
              {wsChatTab === 0 ? (
                <>
                  <div style={{ textAlign: 'center', fontSize: 8, color: '#94a3b8', position: 'relative' }}>
                    <span style={{ background: '#f8fafc', padding: '0 6px', position: 'relative', zIndex: 1 }}>Hôm nay</span>
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: '#e2e8f0', zIndex: 0 }} />
                  </div>
                  {wsMessages.map(msg => <ChatMessage key={msg.id} msg={msg} showWsAvatar />)}
                  <div ref={wsMsgEndRef} />
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#94a3b8', padding: 20, textAlign: 'center', lineHeight: 1.5 }}>
                  {wsChatTab === 1 ? 'Danh sách yêu cầu đang xử lý sẽ hiển thị tại đây.' : 'Lịch sử các yêu cầu đã gửi tới WS Team.'}
                </div>
              )}
            </div>

            <div style={{ background: '#fff', borderTop: bd, padding: '2px 6px', display: 'flex', gap: 2, flexWrap: 'wrap', flexShrink: 0 }}>
              {WS_QUICK_REPLIES.map((qr, i) => (
                <button key={i} type="button" onClick={() => setWsInput(qr)} style={{ fontSize: 8, border: bd, borderRadius: 99, padding: '1px 6px', background: '#fff', color: '#475569', cursor: 'pointer' }}>{qr}</button>
              ))}
              <button type="button" style={{ fontSize: 8, border: bd, borderRadius: 99, padding: '1px 6px', background: '#fff', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <MoreHorizontal {...ICON_SM} />
              </button>
            </div>

            <div style={{ background: '#fff', borderTop: bd, padding: '4px 6px', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <input value={wsInput} onChange={e => setWsInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleWsSend()} placeholder="Nhập tin nhắn..." style={{ flex: 1, border: bd, borderRadius: 99, padding: '4px 10px', fontSize: 8, background: '#f8fafc', color: '#1e293b', outline: 'none' }} />
              <button type="button" style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}><Paperclip {...ICON_MD} color="#64748b" /></button>
              <button type="button" style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}><Smile {...ICON_MD} color="#64748b" /></button>
              <button type="button" onClick={handleWsSend} style={{ width: 26, height: 26, borderRadius: '50%', background: '#4f46e5', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Send {...ICON_SM} color="#fff" />
              </button>
            </div>

            {showRequestForm && (
              <>
                <div onClick={() => setShowRequestForm(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.25)', zIndex: 10 }} />
                <RequestFormPanel
                  onClose={() => setShowRequestForm(false)}
                  requestType={requestType}
                  setRequestType={setRequestType}
                  description={requestDescription}
                  setDescription={setRequestDescription}
                />
              </>
            )}
          </div>
        ) : isCtvTab ? (
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc', minHeight: 0 }}>
            {/* Header */}
            <div style={{ background: '#fff', borderBottom: bd, padding: '4px 8px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', lineHeight: 1.3 }}>
                    <span style={{ fontSize: 9, fontWeight: 600, color: '#1e293b' }}>Cuộc trò chuyện: Đơn tiến cử <strong>#MT2405-0012</strong></span>
                    <Tag type="discuss">Đang trao đổi</Tag>
                  </div>
                </div>
                <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 2, border: bd, borderRadius: 5, padding: '3px 6px', fontSize: 8, color: '#475569', background: '#fff', cursor: 'pointer' }}>
                  <ExternalLink {...ICON_SM} /> Xem chi tiết đơn
                </button>
                <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
                  <MoreHorizontal {...ICON_MD} color="#64748b" />
                </button>
              </div>
            </div>

            {/* Participants */}
            <div style={{ background: '#fff', borderBottom: bd, padding: '6px 8px', flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {[
                { logo: <CompanyLogo size={22} />, label: 'Doanh nghiệp (Bạn)', name: 'Công ty ABC', sub: 'HR Manager' },
                { logo: <WsLogo size={22} />, label: 'WS (JobShare)', name: 'Trần Ngọc Linh', sub: 'Senior Talent Consultant' },
                { logo: <Avatar initials="NA" bg="#dbeafe" color="#1d4ed8" size={22} />, label: 'CTV', name: selectedCtvConv.ctvName, sub: 'CTV tuyển dụng' },
              ].map((p, i) => (
                <div key={i} style={{ border: bd, borderRadius: 6, padding: '5px 6px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    {p.logo}
                    <div style={{ fontSize: 7, fontWeight: 600, color: '#64748b', lineHeight: 1.3 }}>{p.label}</div>
                  </div>
                  <div style={{ fontSize: 8, fontWeight: 600, color: '#1e293b', lineHeight: 1.35 }}>{p.name}</div>
                  <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.35 }}>{p.sub}</div>
                </div>
              ))}
            </div>

            {/* Application summary */}
            <div style={{ background: '#f1f5f9', borderBottom: bd, padding: '5px 8px', flexShrink: 0, fontSize: 7, color: '#475569', lineHeight: 1.55 }}>
              <strong>Ứng viên:</strong> {selectedCtvConv.candidate} &nbsp;|&nbsp; <strong>Vị trí:</strong> {selectedCtvConv.job} &nbsp;|&nbsp; <strong>Ngày:</strong> 16/05/2024<br />
              <strong>Thưởng:</strong> 8,000,000 VND &nbsp;|&nbsp; <strong>Trạng thái:</strong> Đang trao đổi
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
              <div style={{ textAlign: 'center', fontSize: 8, color: '#94a3b8', position: 'relative' }}>
                <span style={{ background: '#f8fafc', padding: '0 6px', position: 'relative', zIndex: 1 }}>Hôm nay</span>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: '#e2e8f0', zIndex: 0 }} />
              </div>
              {ctvMessages.map(msg => <CtvChatMessage key={msg.id} msg={msg} />)}
              <div ref={ctvMsgEndRef} />
            </div>

            {/* Quick replies */}
            <div style={{ background: '#fff', borderTop: bd, padding: '2px 6px', flexShrink: 0 }}>
              <div style={{ fontSize: 7, color: '#94a3b8', marginBottom: 3 }}>Tin nhắn nhanh</div>
              <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {CTV_QUICK_REPLIES.map((qr, i) => (
                  <button key={i} type="button" onClick={() => setCtvInput(qr)} style={{ fontSize: 8, border: bd, borderRadius: 99, padding: '1px 6px', background: '#fff', color: '#475569', cursor: 'pointer' }}>{qr}</button>
                ))}
                <button type="button" style={{ fontSize: 8, border: bd, borderRadius: 99, padding: '1px 6px', background: '#fff', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <MoreHorizontal {...ICON_SM} />
                </button>
              </div>
            </div>

            {/* Input */}
            <div style={{ background: '#fff', borderTop: bd, padding: '4px 6px', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <input value={ctvInput} onChange={e => setCtvInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCtvSend()} placeholder="Nhập tin nhắn..." style={{ flex: 1, border: bd, borderRadius: 99, padding: '4px 10px', fontSize: 8, background: '#f8fafc', color: '#1e293b', outline: 'none' }} />
              <button type="button" style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}><Paperclip {...ICON_MD} color="#64748b" /></button>
              <button type="button" style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}><Smile {...ICON_MD} color="#64748b" /></button>
              <button type="button" onClick={handleCtvSend} style={{ width: 26, height: 26, borderRadius: '50%', background: '#4f46e5', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Send {...ICON_SM} color="#fff" />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc', minHeight: 0 }}>
            <div style={{ background: '#fff', borderBottom: bd, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <Avatar initials={selectedConv.initials} bg={selectedConv.bg} color={selectedConv.color} size={30} online={selectedConv.online} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 3, lineHeight: 1.2 }}>
                  {selectedConv.name}
                  <Star {...ICON_SM} color="#f59e0b" fill="#f59e0b" />
                  <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 99, background: '#dbeafe', color: '#1d4ed8', fontWeight: 500 }}>Từ Landing Page</span>
                </div>
                <div style={{ fontSize: 8, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{selectedConv.role} • 3 năm KN • Hà Nội • {selectedConv.job}</div>
              </div>
              <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
                <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 2, border: bd, borderRadius: 5, padding: '3px 6px', fontSize: 8, color: '#475569', background: '#fff', cursor: 'pointer' }}><User {...ICON_SM} /> Hồ sơ</button>
                <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}><MoreHorizontal {...ICON_MD} color="#64748b" /></button>
              </div>
            </div>
            <div style={{ display: 'flex', borderBottom: bd, background: '#fff', padding: '0 8px', flexShrink: 0 }}>
              {['Trò chuyện', 'Hồ sơ ứng viên', 'Lịch sử hoạt động'].map((t, i) => (
                <div key={i} onClick={() => setChatTab(i)} style={{ padding: '4px 6px', fontSize: 8, cursor: 'pointer', color: chatTab === i ? '#4f6ef7' : '#64748b', borderBottom: chatTab === i ? '2px solid #4f6ef7' : '2px solid transparent', fontWeight: chatTab === i ? 600 : 400 }}>{t}</div>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 5, minHeight: 0 }}>
              <div style={{ textAlign: 'center', fontSize: 8, color: '#94a3b8', position: 'relative' }}>
                <span style={{ background: '#f8fafc', padding: '0 6px', position: 'relative', zIndex: 1 }}>Hôm nay</span>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: '#e2e8f0', zIndex: 0 }} />
              </div>
              {messages.map(msg => <ChatMessage key={msg.id} msg={msg} />)}
              <div ref={msgEndRef} />
            </div>
            <div style={{ background: '#fff', borderTop: bd, padding: '2px 6px', display: 'flex', gap: 2, flexWrap: 'wrap', flexShrink: 0 }}>
              {QUICK_REPLIES.map((qr, i) => (
                <button key={i} type="button" onClick={() => setInput(qr)} style={{ fontSize: 8, border: bd, borderRadius: 99, padding: '1px 6px', background: '#fff', color: '#475569', cursor: 'pointer' }}>{qr}</button>
              ))}
            </div>
            <div style={{ background: '#fff', borderTop: bd, padding: '4px 6px', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Nhập tin nhắn..." style={{ flex: 1, border: bd, borderRadius: 99, padding: '4px 10px', fontSize: 8, background: '#f8fafc', color: '#1e293b', outline: 'none' }} />
              <button type="button" style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}><Paperclip {...ICON_MD} color="#64748b" /></button>
              <button type="button" style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}><Smile {...ICON_MD} color="#64748b" /></button>
              <button type="button" onClick={handleSend} style={{ width: 26, height: 26, borderRadius: '50%', background: '#4f6ef7', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Send {...ICON_SM} color="#fff" /></button>
            </div>
          </div>
        )}

        {/* RIGHT */}
        {isWsTab ? (
          <div style={{ borderLeft: bd, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            <div style={{ padding: '4px 8px 3px', borderBottom: bd, flexShrink: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b' }}>Thông tin WS</div>
            </div>
            <div className="msg-scroll-hide" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
              <div style={{ padding: '9px 9px', borderBottom: bd }}>
                <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                  <WsLogo size={28} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>WS Team – Tuyển dụng</div>
                    <Tag type="active">Đang hoạt động</Tag>
                    <div style={{ fontSize: 8, color: '#64748b', lineHeight: 1.45 }}>Đội ngũ tư vấn tuyển dụng của JobShare</div>
                    <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45 }}>Phản hồi TB: 15 phút</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                  <button type="button" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, border: bd, borderRadius: 5, padding: '6px 4px', fontSize: 7, color: '#475569', background: '#fff', cursor: 'pointer' }}><User {...ICON_SM} /> Xem hồ sơ WS</button>
                  <button type="button" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, border: bd, borderRadius: 5, padding: '6px 4px', fontSize: 7, color: '#475569', background: '#fff', cursor: 'pointer' }}><History {...ICON_SM} /> Lịch sử hợp tác</button>
                </div>
              </div>

              <div style={{ padding: '9px 9px', borderBottom: bd }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                  <div style={{ fontSize: 8, fontWeight: 600, color: '#64748b', lineHeight: 1.4 }}>Yêu cầu đang xử lý (2)</div>
                  <button type="button" style={{ fontSize: 8, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, padding: 0 }}>Xem tất cả <ChevronRight {...ICON_SM} /></button>
                </div>
                {WS_ACTIVE_REQUESTS.map((req, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: i < WS_ACTIVE_REQUESTS.length - 1 ? 8 : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: req.dot === 'done' ? '#16a34a' : '#f97316', marginTop: 3 }} />
                      {i < WS_ACTIVE_REQUESTS.length - 1 && <div style={{ width: 1, flex: 1, background: '#e2e8f0', minHeight: 24, marginTop: 2 }} />}
                    </div>
                    <div style={{ flex: 1, paddingBottom: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4, marginBottom: 3 }}>
                        <div style={{ fontSize: 8, fontWeight: 600, color: '#1e293b', lineHeight: 1.45 }}>{req.title}</div>
                        <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 99, background: req.statusBg, color: req.statusColor, whiteSpace: 'nowrap', flexShrink: 0 }}>{req.status}</span>
                      </div>
                      <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45 }}>{req.id}</div>
                      <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45 }}>{req.date}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '9px 9px', borderBottom: bd }}>
                <div style={{ fontSize: 8, fontWeight: 600, color: '#64748b', marginBottom: 7, lineHeight: 1.4 }}>Vị trí liên quan</div>
                <div style={{ border: bd, borderRadius: 6, padding: '8px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4, marginBottom: 4 }}>
                    <div style={{ fontSize: 8, fontWeight: 600, color: '#1e293b', lineHeight: 1.45 }}>Frontend Developer (React)</div>
                    <Tag type="hiring">Đang tuyển</Tag>
                  </div>
                  <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45, marginBottom: 2 }}>JD: FE2405-0012</div>
                  <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45, marginBottom: 8 }}>Ngày đăng: 10/05/2024</div>
                  <button type="button" style={{ width: '100%', border: bd, borderRadius: 5, padding: '5px', fontSize: 8, color: '#475569', background: '#fff', cursor: 'pointer' }}>Xem chi tiết JD</button>
                </div>
              </div>

              <div style={{ padding: '9px 9px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                  <div style={{ fontSize: 8, fontWeight: 600, color: '#64748b', lineHeight: 1.4 }}>Ghi chú nội bộ</div>
                  <span style={{ fontSize: 8, color: '#4f46e5', cursor: 'pointer', lineHeight: 1.4 }}>+ Thêm ghi chú</span>
                </div>
                {WS_NOTES.map((note, i) => (
                  <div key={i} style={{ background: '#f8fafc', borderRadius: 5, padding: '8px', fontSize: 8, color: '#1e293b', lineHeight: 1.55 }}>
                    <div style={{ fontSize: 7, color: '#94a3b8', marginBottom: 5, lineHeight: 1.45 }}>{note.time} • {note.author}</div>
                    {note.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : isCtvTab ? (
          <div style={{ borderLeft: bd, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            <div className="msg-scroll-hide" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
              <InfoCard title="Thông tin đơn tiến cử">
                <div style={{ fontSize: 8, fontWeight: 600, color: '#1e293b', lineHeight: 1.45, marginBottom: 3 }}>#MT2405-0012</div>
                <Tag type="discuss">Đang trao đổi</Tag>
              </InfoCard>

              <InfoCard title="Thông tin ứng viên">
                <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                  <Avatar initials="TĐ" bg="#d1fae5" color="#065f46" size={28} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>{selectedCtvConv.candidate}</div>
                    <Tag type="ready">Đang sẵn sàng</Tag>
                    <div style={{ fontSize: 8, color: '#475569', lineHeight: 1.45 }}>Frontend Developer</div>
                    <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45 }}>3 năm kinh nghiệm • Hà Nội</div>
                  </div>
                </div>
                <button type="button" style={{ width: '100%', marginTop: 8, border: bd, borderRadius: 5, padding: '5px', fontSize: 8, color: '#475569', background: '#fff', cursor: 'pointer' }}>Xem hồ sơ ứng viên</button>
              </InfoCard>

              <InfoCard title="Thông tin JD">
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 5, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Briefcase {...ICON_MD} color="#1d4ed8" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 8, fontWeight: 600, color: '#1e293b', lineHeight: 1.45, marginBottom: 3 }}>{selectedCtvConv.job}</div>
                    <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45 }}>Phòng IT – Product</div>
                    <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45 }}>Ngày đăng: 05/05/2024</div>
                  </div>
                </div>
                <button type="button" style={{ width: '100%', marginTop: 8, border: bd, borderRadius: 5, padding: '5px', fontSize: 8, color: '#475569', background: '#fff', cursor: 'pointer' }}>Xem chi tiết JD</button>
              </InfoCard>

              <InfoCard title="Thông tin CTV">
                <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                  <Avatar initials={selectedCtvConv.initials} bg={selectedCtvConv.bg} color={selectedCtvConv.color} size={28} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>{selectedCtvConv.ctvName}</div>
                    <div style={{ fontSize: 8, color: '#475569', lineHeight: 1.45 }}>CTV tuyển dụng</div>
                    <div style={{ fontSize: 7, color: '#64748b', lineHeight: 1.45, display: 'flex', alignItems: 'center', gap: 2 }}>
                      4.8 <Star {...ICON_SM} color="#f59e0b" fill="#f59e0b" /> (56 đánh giá)
                    </div>
                    <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45 }}>Tỷ lệ thành công: 82% • 38 tiến cử</div>
                  </div>
                </div>
                <button type="button" style={{ width: '100%', marginTop: 8, border: bd, borderRadius: 5, padding: '5px', fontSize: 8, color: '#475569', background: '#fff', cursor: 'pointer' }}>Xem hồ sơ CTV</button>
              </InfoCard>

              <InfoCard title="Thông tin thưởng">
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 5, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Coins {...ICON_MD} color="#16a34a" />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#1e293b', lineHeight: 1.4 }}>8,000,000 VND</div>
                    <Tag type="pendingBonus">Chưa chốt</Tag>
                  </div>
                </div>
                <button type="button" style={{ width: '100%', border: bd, borderRadius: 5, padding: '5px', fontSize: 8, color: '#475569', background: '#fff', cursor: 'pointer' }}>Đề nghị điều chỉnh</button>
              </InfoCard>

              <InfoCard title="Ghi chú">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -28, marginBottom: 7 }}>
                  <span style={{ fontSize: 8, color: '#4f46e5', cursor: 'pointer', lineHeight: 1.4 }}>+ Thêm ghi chú</span>
                </div>
                {CTV_NOTES.map((note, i) => (
                  <div key={i} style={{ background: '#f8fafc', borderRadius: 5, padding: '8px', fontSize: 8, color: '#1e293b', lineHeight: 1.55 }}>
                    <div style={{ fontSize: 7, color: '#94a3b8', marginBottom: 5, lineHeight: 1.45 }}>{note.time} • {note.author}</div>
                    {note.text}
                  </div>
                ))}
              </InfoCard>
            </div>
          </div>
        ) : (
          <div style={{ borderLeft: bd, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            <div style={{ padding: '4px 8px 3px', borderBottom: bd, flexShrink: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b' }}>Thông tin ứng viên</div>
            </div>
            <div className="msg-scroll-hide" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '10px 9px', borderBottom: bd }}>
                <Avatar initials={selectedConv.initials} bg={selectedConv.bg} color={selectedConv.color} size={28} />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>{selectedConv.name}</div>
                  <span style={{ fontSize: 7, padding: '1px 4px', borderRadius: 99, background: '#dbeafe', color: '#1d4ed8', fontWeight: 500, display: 'inline-block', alignSelf: 'flex-start' }}>Từ Landing Page</span>
                  <div style={{ fontSize: 8, color: '#475569', lineHeight: 1.45 }}>{selectedConv.role}</div>
                  <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45 }}>Hà Nội • 3 năm KN</div>
                </div>
                <div style={{ position: 'relative', width: 38, height: 38, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="38" height="38" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                    <circle cx="19" cy="19" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <circle cx="19" cy="19" r="15" fill="none" stroke="#4f6ef7" strokeWidth="3" strokeDasharray="94 94" strokeDashoffset="14" strokeLinecap="round" />
                  </svg>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#4f6ef7' }}>85%</div>
                  <div style={{ fontSize: 5, color: '#94a3b8', textAlign: 'center' }}>Match</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, padding: '8px 9px', borderBottom: bd }}>
                {RIGHT_ACTIONS.map(({ icon: Icon, label }, i) => (
                  <button key={i} type="button" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, border: bd, borderRadius: 5, padding: '6px 4px', fontSize: 7, color: '#475569', background: '#fff', cursor: 'pointer', lineHeight: 1.4 }}><Icon {...ICON_SM} /> {label}</button>
                ))}
              </div>
              <div style={{ padding: '9px 9px', borderBottom: bd }}>
                <div style={{ fontSize: 8, fontWeight: 600, color: '#64748b', marginBottom: 7, lineHeight: 1.4 }}>Ứng viên đang ứng tuyển</div>
                {[
                  { title: '1. Frontend Developer (FE2405-0012)', status: 'Screening', statusBg: '#dbeafe', statusColor: '#1d4ed8', date: '18/05/2024' },
                  { title: '2. Fullstack Developer (FS2404-0009)', status: 'Đang xem xét', statusBg: '#fef9c3', statusColor: '#854d0e', date: '10/05/2024' },
                ].map((job, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4, marginBottom: 3 }}>
                      <div style={{ fontSize: 8, fontWeight: 500, color: '#1e293b', lineHeight: 1.5 }}>{job.title}</div>
                      <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 99, background: job.statusBg, color: job.statusColor, whiteSpace: 'nowrap', flexShrink: 0 }}>{job.status}</span>
                    </div>
                    <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.45 }}>Ngày ứng tuyển: {job.date}</div>
                  </div>
                ))}
                <button type="button" style={{ fontSize: 8, color: '#4f6ef7', cursor: 'pointer', background: 'none', border: 'none', padding: '4px 0 0', display: 'flex', alignItems: 'center', gap: 2, lineHeight: 1.45 }}>Xem tất cả (2) <ChevronRight {...ICON_SM} /></button>
              </div>
              <div style={{ padding: '9px 9px', borderBottom: bd }}>
                <div style={{ fontSize: 8, fontWeight: 600, color: '#64748b', marginBottom: 7, lineHeight: 1.4 }}>Tiến trình tuyển dụng</div>
                {TIMELINE.map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, paddingBottom: 8 }}>
                    <div style={{ width: 13, height: 13, borderRadius: '50%', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: step.status === 'done' ? '#dcfce7' : step.status === 'active' ? '#dbeafe' : '#f1f5f9' }}>
                      <TimelineIcon status={step.status} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ fontSize: 8, fontWeight: 500, color: step.status === 'pending' ? '#94a3b8' : '#1e293b', lineHeight: 1.45 }}>{step.label}</div>
                        {step.date && <div style={{ fontSize: 7, color: '#94a3b8', lineHeight: 1.4 }}>{step.date}</div>}
                      </div>
                      {step.badge && <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 99, flexShrink: 0, background: step.badgeType === 'warn' ? '#fef9c3' : '#f1f5f9', color: step.badgeType === 'warn' ? '#854d0e' : '#94a3b8' }}>{step.badge}</span>}
                    </div>
                  </div>
                ))}
                <button type="button" style={{ width: '100%', marginTop: 4, background: '#4f6ef7', color: '#fff', border: 'none', borderRadius: 5, padding: '6px', fontSize: 8, cursor: 'pointer', lineHeight: 1.4 }}>Cập nhật trạng thái</button>
              </div>
              <div style={{ padding: '9px 9px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                  <div style={{ fontSize: 8, fontWeight: 600, color: '#64748b', lineHeight: 1.4 }}>Ghi chú nội bộ</div>
                  <span style={{ fontSize: 8, color: '#4f6ef7', cursor: 'pointer', lineHeight: 1.4 }}>+ Thêm</span>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 5, padding: '8px', fontSize: 8, color: '#1e293b', lineHeight: 1.55 }}>
                  <div style={{ fontSize: 7, color: '#94a3b8', marginBottom: 5, lineHeight: 1.45 }}>18/05/2024 11:30 • Nguyễn Văn A</div>
                  Ứng viên có kinh nghiệm tốt với React, TypeScript. Trao đổi rất nhiệt tình, sẵn phỏng vấn technical test.
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default Message
