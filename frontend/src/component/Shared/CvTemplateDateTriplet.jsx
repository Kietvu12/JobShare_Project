import React from 'react';

const PART_STYLE = {
  year: {
    display: 'inline-block',
    width: '4ch',
    outline: 'none',
    letterSpacing: 0,
    padding: 0,
    verticalAlign: 'baseline',
  },
  month: {
    display: 'inline-block',
    width: '2ch',
    outline: 'none',
    letterSpacing: 0,
    padding: 0,
    verticalAlign: 'baseline',
  },
  day: {
    display: 'inline-block',
    width: '2ch',
    outline: 'none',
    letterSpacing: 0,
    padding: 0,
    verticalAlign: 'baseline',
  },
};

function moveCaretToEnd(el) {
  if (!el) return;
  requestAnimationFrame(() => {
    try {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    } catch {
      /* ignore */
    }
  });
}

function normalizePart(value, maxLen) {
  return String(value || '').replace(/\D/g, '').slice(0, maxLen);
}

/**
 * Ô nhập ngày dạng 1990年01月01日生 — khoảng cách chặt, khớp form Nhật.
 */
export default function CvTemplateDateTriplet({
  field,
  refs,
  parts,
  className = '',
  errorMessage = '',
  onCommit,
  onClearError,
  isBirthField = false,
  prefix = '',
  daySuffix = '日生',
}) {
  const handleBlur = () => onCommit?.(field, refs, isBirthField);

  const bindPart = (ref, kind, partKey, maxLen) => ({
    ref,
    contentEditable: true,
    suppressContentEditableWarning: true,
    tabIndex: 0,
    className: 'whitespace-nowrap tabular-nums',
    style: PART_STYLE[kind],
    onFocus: (e) => {
      if (!(e.currentTarget.textContent || '').trim()) {
        e.currentTarget.textContent = parts[partKey] || '';
      }
      moveCaretToEnd(e.currentTarget);
    },
    onBlur: handleBlur,
    onInput: (e) => {
      e.currentTarget.textContent = normalizePart(e.currentTarget.textContent, maxLen);
      onClearError?.(field);
      moveCaretToEnd(e.currentTarget);
    },
    children: parts[partKey] || '',
  });

  return (
    <div
      className={`inline-flex items-baseline flex-wrap ${className}`}
      style={{ letterSpacing: 0, gap: 0, lineHeight: 1.35 }}
    >
      {errorMessage ? <div className="w-full text-[10px] text-rose-600">{errorMessage}</div> : null}
      {prefix ? <span>{prefix}</span> : null}
      <span {...bindPart(refs.y, 'year', 'y', 4)} />
      <span>年</span>
      <span {...bindPart(refs.mo, 'month', 'mo', 2)} />
      <span>月</span>
      <span {...bindPart(refs.d, 'day', 'd', 2)} />
      <span>{daySuffix}</span>
    </div>
  );
}
