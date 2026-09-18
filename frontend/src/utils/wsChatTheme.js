/**
 * Scale typography + padding WS chat — business dùng --biz-hp-* (business-app-ui).
 */
export function wsChatTheme(mode = 'admin') {
  const biz = mode === 'business'
  return {
    fs: {
      section: biz ? 'var(--biz-hp-section)' : 10,
      body: biz ? 'var(--biz-hp-body)' : 9,
      caption: biz ? 'var(--biz-hp-caption)' : 8,
      micro: biz ? 'var(--biz-hp-micro)' : 7,
    },
    pad: {
      card: biz ? '14px 16px' : '10px 12px',
      cardSm: biz ? '12px 14px' : '8px 10px',
      attach: biz ? '12px 14px' : '8px 10px',
      bubble: biz ? '11px 14px' : '6px 10px',
      thread: biz ? '14px 16px' : '8px 10px',
      input: biz ? '10px 16px' : '6px 12px',
      listItem: biz ? '14px 16px' : '9px',
      header: biz ? '12px 16px' : '8px 10px',
      structured: biz ? '12px 14px' : '8px 9px',
    },
    gap: biz ? 10 : 6,
    logoList: biz ? 32 : 28,
    logoBubble: biz ? 28 : 24,
    maxBubbleWidth: biz ? '88%' : '78%',
  }
}
