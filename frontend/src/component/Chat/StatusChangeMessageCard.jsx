import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../translations/translations';
import { getJobApplicationStatusLabelByLanguage } from '../../utils/jobApplicationStatus';
import LinkifiedText from '../../utils/linkifyText.jsx';
import {
  STATUS_CHANGE_THEME_MAP,
  resolveStatusCodeFromName,
} from '../../utils/statusChangeMessage';

/**
 * Thẻ tin nhắn khi đổi trạng thái — nhãn theo ngôn ngữ, thẻ gọn gàng.
 */
const StatusChangeMessageCard = ({
  statusName,
  statusCode: statusCodeProp,
  reason,
  tags = [],
  paymentAmount,
  createdAt,
  formatDate,
  variant = 'default',
}) => {
  const { language } = useLanguage();
  const t = translations[language] || translations.vi;

  const statusCode = statusCodeProp ?? resolveStatusCodeFromName(statusName);
  const localizedStatus = statusCode
    ? getJobApplicationStatusLabelByLanguage(statusCode, language)
    : (statusName || t.chatStatusDefaultName);

  const isPaidStatus = statusCode === 15 || (
    statusName && (statusName.includes('thanh toán') || statusName.includes('Paid') || statusName.includes('支払'))
  );

  const isAdminSide = variant === 'adminSide';
  const isCtvSide = variant === 'ctvSide';
  const theme = statusCode ? STATUS_CHANGE_THEME_MAP[statusCode] : null;
  const headerBg = theme?.headerBg || (isAdminSide ? '#7c3aed' : isCtvSide ? '#0d9488' : '#4b5563');
  const bodyBg = theme?.bodyBg || (isAdminSide ? '#f5f3ff' : isCtvSide ? '#f0fdfa' : '#ffffff');
  const outerBorder = theme?.outerBorder || (isAdminSide ? '#c4b5fd' : isCtvSide ? '#5eead4' : '#d1d5db');
  const chipBg = theme?.chipBg || '#f3f4f6';
  const chipText = theme?.chipText || '#374151';
  const accentText = theme?.accentText || '#6b7280';
  const linkStyle = { color: '#2563eb', textDecoration: 'underline', wordBreak: 'break-all' };

  const tagList = Array.isArray(tags) ? tags : [];
  const hasReason = Boolean(reason && String(reason).trim());
  const hasTags = tagList.length > 0;
  const hasPayment = isPaidStatus && paymentAmount;

  return (
    <div
      className="max-w-[min(100%,320px)] overflow-hidden rounded-xl border shadow-sm"
      style={{ borderColor: outerBorder, backgroundColor: bodyBg }}
    >
      <div
        className="flex items-center justify-center gap-2 px-3 py-2"
        style={{ backgroundColor: headerBg }}
      >
        <span
          className="inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold leading-tight text-white"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          {t.chatStatusUpdateBadge || 'Trạng thái'}
        </span>
        <span className="text-center text-xs font-semibold leading-snug text-white">
          {localizedStatus}
        </span>
      </div>

      {(hasReason || hasTags || hasPayment) && (
        <div className="space-y-2 px-3 py-2.5">
          {hasPayment ? (
            <div className="flex items-baseline justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs" style={{ backgroundColor: chipBg, color: chipText }}>
              <span className="font-medium shrink-0">{t.chatPaymentAmountLabel}</span>
              <span className="font-semibold text-right">{paymentAmount}</span>
            </div>
          ) : null}

          {hasReason ? (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: accentText }}>
                {t.chatReasonLabel || t.chatReasonOf || 'Lý do'}
              </p>
              <LinkifiedText
                text={String(reason).trim()}
                className="whitespace-pre-wrap text-xs leading-relaxed"
                style={{ color: '#111827' }}
                linkStyle={linkStyle}
              />
            </div>
          ) : null}

          {hasTags ? (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: accentText }}>
                {t.chatTagsLabel || 'Ghi chú'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tagList.map((tag, i) => {
                  const label = typeof tag === 'string' ? tag : tag?.label;
                  if (!label) return null;
                  const subs = typeof tag === 'object' && Array.isArray(tag.sub) ? tag.sub : [];
                  return (
                    <div key={`tag-${i}`} className="flex max-w-full flex-wrap items-center gap-1">
                      <span
                        className="inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ backgroundColor: chipBg, color: chipText }}
                      >
                        <LinkifiedText text={label} linkStyle={linkStyle} />
                      </span>
                      {subs.map((sub, j) => (
                        <span
                          key={`tag-${i}-sub-${j}`}
                          className="inline-flex max-w-full items-center rounded-full border px-1.5 py-0.5 text-[10px]"
                          style={{ borderColor: outerBorder, color: chipText, backgroundColor: '#fff' }}
                        >
                          <LinkifiedText text={sub} linkStyle={linkStyle} />
                        </span>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {formatDate && createdAt ? (
        <p
          className="border-t px-3 py-1.5 text-[10px] font-medium"
          style={{ borderColor: outerBorder, color: accentText }}
        >
          {formatDate(createdAt)}
        </p>
      ) : null}
    </div>
  );
};

export default StatusChangeMessageCard;
