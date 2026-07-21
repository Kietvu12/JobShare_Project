import React from 'react';

const DEFAULT_MARK_STYLE = {
  backgroundColor: '#fef08a',
  color: '#92400e',
  padding: '0 2px',
  borderRadius: 2,
  fontWeight: 600,
  boxDecorationBreak: 'clone',
  WebkitBoxDecorationBreak: 'clone',
};

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getSearchHighlightTokens(query) {
  return String(query || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function tokenMatchesPart(part, tokens) {
  const lower = String(part).toLowerCase();
  return tokens.some((token) => lower === String(token).toLowerCase());
}

/**
 * Bôi vàng các đoạn khớp từ khóa tìm kiếm (không phân biệt hoa thường).
 * Dùng <span> thay vì <mark> — Tailwind preflight reset mark thành trong suốt.
 */
export function highlightSearchText(text, query, markStyle = DEFAULT_MARK_STYLE) {
  const str = text == null ? '' : String(text);
  const tokens = getSearchHighlightTokens(query);
  if (!tokens.length || !str) return str;

  const pattern = tokens.map(escapeRegExp).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');
  const parts = str.split(regex);
  if (parts.length <= 1) return str;

  return parts.map((part, index) => {
    if (!part) return null;
    if (tokenMatchesPart(part, tokens)) {
      return (
        <span key={`hl-${index}-${part.slice(0, 12)}`} className="scout-search-highlight" style={markStyle}>
          {part}
        </span>
      );
    }
    return <React.Fragment key={`txt-${index}-${part.slice(0, 12)}`}>{part}</React.Fragment>;
  });
}

export function HighlightText({ text, query, markStyle, className, style }) {
  const content = highlightSearchText(text, query, markStyle);
  if (typeof content === 'string') {
    return (
      <span className={className} style={style}>
        {content}
      </span>
    );
  }
  return (
    <span className={className} style={style}>
      {content}
    </span>
  );
}

export default HighlightText;
