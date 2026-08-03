import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  Paperclip,
  Send,
  Smile,
  User,
  Coins,
  Megaphone,
  LayoutTemplate,
  CalendarDays,
  Building2,
} from 'lucide-react';

const BRAND = '#0077B6';

const TYPE_ICON_MAP = {
  'Phí giới thiệu': { icon: User, bg: '#dcfce7', color: '#16a34a' },
  'Nạp credit': { icon: Coins, bg: '#e8f4fa', color: '#0077B6' },
  'Phí quảng cáo tuyển dụng': { icon: Megaphone, bg: '#dcfce7', color: '#16a34a' },
  'Landing Page premium': { icon: LayoutTemplate, bg: '#fce7f3', color: '#db2777' },
  'Seminar / Campaign': { icon: CalendarDays, bg: '#ede9fe', color: '#7c3aed' },
  'Thiết kế profile company': { icon: Building2, bg: '#fef9c3', color: '#ca8a04' },
};

function getTypeIcon(type) {
  return TYPE_ICON_MAP[type] || { icon: FileText, bg: '#e8f4fa', color: BRAND };
}

const PLACEHOLDER_ATTACHMENTS = [
  { name: 'Invoice_PM-2607-001.pdf', meta: 'PDF • 245 KB' },
  { name: 'Fee_breakdown.xlsx', meta: 'Excel • 18 KB' },
  { name: 'Contract_appendix.pdf', meta: 'PDF • 512 KB' },
];

const PLACEHOLDER_MESSAGES = [
  {
    id: 1,
    author: 'Workstation',
    initials: 'WS',
    time: '30/07/2026 09:15',
    text: 'Đã tạo yêu cầu thanh toán phí giới thiệu. Vui lòng xác nhận thông tin ứng viên và số tiền trước deadline.',
    isWs: true,
  },
  {
    id: 2,
    author: 'Doanh nghiệp',
    initials: 'DN',
    time: '30/07/2026 14:22',
    text: 'Đã xác nhận thông tin ứng viên. Nhờ WS gửi thêm chi tiết breakdown phí VAT.',
    isWs: false,
  },
];

export default function BillingPaymentDetailPanel({ payment, onClose }) {
  const [detailTab, setDetailTab] = useState('info');
  const [chatInput, setChatInput] = useState('');

  if (!payment) {
    return (
      <aside className="flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <FileText className="mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm font-semibold text-slate-700">Chi tiết yêu cầu thanh toán</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Chọn một dòng trong danh sách để xem thông tin, file đính kèm và trao đổi với WS.
        </p>
      </aside>
    );
  }

  const typeMeta = getTypeIcon(payment.type);
  const TypeIcon = typeMeta.icon;
  const attachmentCount = PLACEHOLDER_ATTACHMENTS.length;

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-900">{payment.paymentCode}</div>
          <span
            className="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: payment.statusBg, color: payment.statusColor }}
          >
            {payment.statusLabel}
          </span>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg border-0 bg-slate-50 p-1.5 hover:bg-slate-100">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      <div className="flex shrink-0 gap-1 border-b border-slate-100 px-3 py-2">
        {[
          { key: 'info', label: 'Thông tin' },
          { key: 'files', label: `File đính kèm (${attachmentCount})` },
          { key: 'chat', label: 'Trao đổi' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setDetailTab(tab.key)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              detailTab === tab.key
                ? 'bg-[#0077B6] text-white'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="billing-detail-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {detailTab === 'info' ? (
          <div className="space-y-4">
            <div className="space-y-2 text-xs sm:text-sm">
              {[
                ['Loại thanh toán', payment.type],
                ['Nguồn tạo', payment.source || 'Workstation'],
                ['Ngày tạo', payment.createdAt],
                ['Deadline', payment.deadline],
                ['Liên quan', payment.related],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <span className="w-28 shrink-0 text-slate-500">{label}</span>
                  <span className="min-w-0 flex-1 font-medium text-slate-800">{value}</span>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">Chi tiết phí</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[11px] text-slate-400">
                    {['Hạng mục', 'Giá trị'].map((h) => (
                      <th key={h} className="px-3 py-2 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-50">
                    <td className="px-3 py-2 text-slate-600">Mô tả</td>
                    <td className="px-3 py-2 text-slate-800">{payment.description || payment.related}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-slate-800">Tổng cộng</td>
                    <td className="px-3 py-2 text-base font-bold text-rose-600">{payment.amount}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {detailTab === 'files' ? (
          <div className="space-y-2">
            {PLACEHOLDER_ATTACHMENTS.map((file) => (
              <div
                key={file.name}
                className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f4fa]">
                  <FileText className="h-4 w-4 text-[#0077B6]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-slate-800">{file.name}</div>
                  <div className="text-[11px] text-slate-400">{file.meta}</div>
                </div>
                <button type="button" className="rounded-lg border-0 bg-transparent p-1.5 hover:bg-slate-50">
                  <Download className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            ))}
            <p className="pt-2 text-[11px] text-slate-400">File thật sẽ hiển thị khi WS đính kèm trên hệ thống.</p>
          </div>
        ) : null}

        {detailTab === 'chat' ? (
          <div className="space-y-3">
            {PLACEHOLDER_MESSAGES.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.isWs ? '' : 'flex-row-reverse'}`}>
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    msg.isWs ? 'bg-[#e8f4fa] text-[#0077B6]' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {msg.initials}
                </div>
                <div className={`max-w-[85%] ${msg.isWs ? '' : 'text-right'}`}>
                  <div className="text-[11px] font-semibold text-slate-700">{msg.author}</div>
                  <div
                    className={`mt-1 rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      msg.isWs ? 'bg-slate-100 text-slate-700' : 'bg-[#0077B6] text-white'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400">{msg.time}</div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {detailTab === 'chat' ? (
        <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 px-3 py-2.5">
          <button type="button" className="rounded-lg border-0 bg-transparent p-1.5 hover:bg-slate-50">
            <Paperclip className="h-4 w-4 text-slate-400" />
          </button>
          <button type="button" className="rounded-lg border-0 bg-transparent p-1.5 hover:bg-slate-50">
            <Smile className="h-4 w-4 text-slate-400" />
          </button>
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#0077B6]"
          />
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-white"
            style={{ background: BRAND }}
          >
            <Send className="h-3.5 w-3.5" />
            Gửi
          </button>
        </div>
      ) : null}
    </aside>
  );
}

export function PaymentTypeIcon({ type, className = '' }) {
  const meta = getTypeIcon(type);
  const Icon = meta.icon;
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${className}`}
      style={{ background: meta.bg }}
    >
      <Icon className="h-4 w-4" style={{ color: meta.color }} strokeWidth={2} />
    </div>
  );
}
