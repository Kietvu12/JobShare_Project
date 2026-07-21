import { JOB_APPLICATION_STATUS_LABELS } from './jobApplicationStatus';

export const STATUS_CHANGE_THEME_MAP = {
  1: { headerBg: '#dc2626', bodyBg: '#fef2f2', outerBorder: '#fca5a5', chipBg: '#fee2e2', chipText: '#991b1b', accentText: '#991b1b' },
  2: { headerBg: '#0891b2', bodyBg: '#ecfeff', outerBorder: '#67e8f9', chipBg: '#cffafe', chipText: '#155e75', accentText: '#155e75' },
  3: { headerBg: '#ca8a04', bodyBg: '#fffbeb', outerBorder: '#fcd34d', chipBg: '#fef3c7', chipText: '#92400e', accentText: '#92400e' },
  4: { headerBg: '#dc2626', bodyBg: '#fef2f2', outerBorder: '#fca5a5', chipBg: '#fee2e2', chipText: '#991b1b', accentText: '#991b1b' },
  5: { headerBg: '#2563eb', bodyBg: '#eff6ff', outerBorder: '#93c5fd', chipBg: '#dbeafe', chipText: '#1e40af', accentText: '#1e40af' },
  6: { headerBg: '#dc2626', bodyBg: '#fef2f2', outerBorder: '#fca5a5', chipBg: '#fee2e2', chipText: '#991b1b', accentText: '#991b1b' },
  7: { headerBg: '#7c3aed', bodyBg: '#f5f3ff', outerBorder: '#c4b5fd', chipBg: '#ede9fe', chipText: '#5b21b6', accentText: '#5b21b6' },
  8: { headerBg: '#4f46e5', bodyBg: '#eef2ff', outerBorder: '#a5b4fc', chipBg: '#e0e7ff', chipText: '#3730a3', accentText: '#3730a3' },
  9: { headerBg: '#0e7490', bodyBg: '#ecfeff', outerBorder: '#67e8f9', chipBg: '#cffafe', chipText: '#155e75', accentText: '#155e75' },
  10: { headerBg: '#dc2626', bodyBg: '#fef2f2', outerBorder: '#fca5a5', chipBg: '#fee2e2', chipText: '#991b1b', accentText: '#991b1b' },
  11: { headerBg: '#0f766e', bodyBg: '#f0fdfa', outerBorder: '#5eead4', chipBg: '#ccfbf1', chipText: '#115e59', accentText: '#115e59' },
  12: { headerBg: '#059669', bodyBg: '#ecfdf5', outerBorder: '#86efac', chipBg: '#dcfce7', chipText: '#166534', accentText: '#166534' },
  13: { headerBg: '#be123c', bodyBg: '#fff1f2', outerBorder: '#fda4af', chipBg: '#ffe4e6', chipText: '#9f1239', accentText: '#9f1239' },
  14: { headerBg: '#16a34a', bodyBg: '#f0fdf4', outerBorder: '#86efac', chipBg: '#dcfce7', chipText: '#166534', accentText: '#166534' },
  15: { headerBg: '#16a34a', bodyBg: '#ecfdf5', outerBorder: '#86efac', chipBg: '#dcfce7', chipText: '#166534', accentText: '#166534' },
  16: { headerBg: '#6b7280', bodyBg: '#f9fafb', outerBorder: '#d1d5db', chipBg: '#f3f4f6', chipText: '#4b5563', accentText: '#4b5563' },
};

const normalizeText = (value) => (value || '').toString().trim().toLowerCase();

export function resolveStatusCodeFromName(statusName) {
  const normalizedStatus = normalizeText(statusName);
  if (!normalizedStatus) return null;

  for (let i = 1; i <= 16; i += 1) {
    const vi = normalizeText(JOB_APPLICATION_STATUS_LABELS.vi?.[i]);
    const en = normalizeText(JOB_APPLICATION_STATUS_LABELS.en?.[i]);
    const ja = normalizeText(JOB_APPLICATION_STATUS_LABELS.ja?.[i]);
    if (normalizedStatus === vi || normalizedStatus === en || normalizedStatus === ja) {
      return i;
    }
  }

  if (normalizedStatus.includes('thanh toán') || normalizedStatus.includes('paid') || normalizedStatus.includes('支払')) return 15;
  if (normalizedStatus.includes('hủy') || normalizedStatus.includes('huỷ') || normalizedStatus.includes('withdrew') || normalizedStatus.includes('辞退')) return 16;
  if (normalizedStatus.includes('trượt') || normalizedStatus.includes('rejected') || normalizedStatus.includes('failed') || normalizedStatus.includes('不合格')) return 10;
  if (normalizedStatus.includes('vào công ty') || normalizedStatus.includes('joined company') || normalizedStatus.includes('入社')) return 14;
  return null;
}

/** Tách lý do thường và các thẻ (+ tag / + sub-tag). */
export function parseReasonAndTags(reasonText) {
  if (!reasonText?.trim()) return { reason: '', tags: [] };

  const lines = String(reasonText).split('\n');
  const tags = [];
  const reasonLines = [];

  for (const line of lines) {
    const subMatch = line.match(/^\s+\+\s*(.+)$/);
    const mainMatch = line.match(/^\+\s*(.+)$/);
    if (mainMatch) {
      tags.push({ label: mainMatch[1].trim(), sub: [] });
    } else if (subMatch && tags.length) {
      tags[tags.length - 1].sub.push(subMatch[1].trim());
    } else {
      reasonLines.push(line);
    }
  }

  return { reason: reasonLines.join('\n').trim(), tags };
}

/**
 * Parse nội dung tin nhắn trạng thái hệ thống.
 * Trả về { isStatusChange, statusName, statusCode, reason, tags, paymentAmount }.
 */
export function parseStatusMessageContent(content) {
  if (!content || typeof content !== 'string') return { isStatusChange: false };

  const isStatusUpdate =
    (content.includes('Cập nhật trạng thái') || content.includes('Status update') || content.includes('状態更新'))
    && (
      content.includes('Trạng thái mới:')
      || content.includes('New status:')
      || content.includes('新しい状態:')
      || /\*\*Trạng thái mới:\*\*/.test(content)
    );

  if (!isStatusUpdate) return { isStatusChange: false };

  let statusName = '';
  const newStatusMatch =
    content.match(/\*\*Trạng thái mới:\*\*\s*([^\n*]+)/)
    || content.match(/\*\*New status:\*\*\s*([^\n*]+)/i)
    || content.match(/\*\*新しい状態:\*\*\s*([^\n*]+)/);
  if (newStatusMatch) statusName = newStatusMatch[1].trim();

  let rawReason = '';
  const reasonBlock =
    content.match(/\*\*Lý do:\*\*\s*([\s\S]*?)(?=\n\*\*|\n\*Tin nhắn|$)/)
    || content.match(/\*\*Reason:\*\*\s*([\s\S]*?)(?=\n\*\*|\n\*System|$)/i)
    || content.match(/\*\*Ghi chú:\*\*\s*([\s\S]*?)(?=\n\*\*|\n\*Tin nhắn|$)/)
    || content.match(/\*\*Note:\*\*\s*([\s\S]*?)(?=\n\*\*|\n\*System|$)/i);
  if (reasonBlock) rawReason = reasonBlock[1].trim();

  let paymentAmount = '';
  const paymentMatch =
    content.match(/\*\*Số tiền thanh toán:\*\*\s*([^\n]+)/)
    || content.match(/\*\*Payment amount:\*\*\s*([^\n]+)/i)
    || content.match(/\*\*支払金額:\*\*\s*([^\n]+)/);
  if (paymentMatch) paymentAmount = paymentMatch[1].trim();

  const { reason, tags } = parseReasonAndTags(rawReason);
  const statusCode = resolveStatusCodeFromName(statusName);

  return {
    isStatusChange: true,
    statusName,
    statusCode,
    reason,
    tags,
    paymentAmount,
  };
}
