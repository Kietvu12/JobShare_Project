import React from 'react';

/** http(s)://… hoặc www.… — bỏ dấu câu đuôi URL phổ biến */
const URL_REGEX = /((?:https?:\/\/|www\.)[^\s<]+)/gi;

function trimTrailingPunctuation(url) {
  let display = url;
  let trailing = '';
  while (display.length > 0 && /[.,;:!?)}\]]$/.test(display)) {
    trailing = display.slice(-1) + trailing;
    display = display.slice(0, -1);
  }
  return { href: display, display, trailing };
}

function toHref(raw) {
  const trimmed = trimTrailingPunctuation(raw);
  const href = trimmed.href.toLowerCase().startsWith('www.')
    ? `https://${trimmed.href}`
    : trimmed.href;
  return { href, display: trimmed.display, trailing: trimmed.trailing || '' };
}

export function linkifyTextToNodes(text, { keyPrefix = 'link', linkStyle, linkClassName } = {}) {
  const str = String(text ?? '');
  if (!str) return [];

  const nodes = [];
  let lastIndex = 0;
  let matchIndex = 0;

  for (const match of str.matchAll(URL_REGEX)) {
    const raw = match[0];
    const start = match.index ?? 0;
    if (start > lastIndex) {
      nodes.push(str.slice(lastIndex, start));
    }
    const { href, display, trailing } = toHref(raw);
    nodes.push(
      <a
        key={`${keyPrefix}-${matchIndex}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
        style={linkStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {display}
      </a>
    );
    if (trailing) nodes.push(trailing);
    lastIndex = start + raw.length;
    matchIndex += 1;
  }

  if (lastIndex < str.length) {
    nodes.push(str.slice(lastIndex));
  }

  return nodes.length ? nodes : [str];
}

export default function LinkifiedText({
  text,
  className,
  style,
  linkStyle,
  linkClassName,
  as: Tag = 'span',
}) {
  const nodes = linkifyTextToNodes(text, { linkStyle, linkClassName });
  return (
    <Tag className={className} style={style}>
      {nodes}
    </Tag>
  );
}
