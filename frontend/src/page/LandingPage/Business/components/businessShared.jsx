/* Shared constants, data & small UI atoms for the JobShare Business landing pages. */

export const TEMPLATE_BASE = '/template/jobshare_business_landing';
export const A = `${TEMPLATE_BASE}/assets/`;

export const FONT_STACK = '"Roboto", "Helvetica Neue", Arial, sans-serif';

export const NAV_ITEMS = [
  { href: '/landing/business/about', jp: 'JobShare Businessとは', en: 'About' },
  { href: '/landing/business/services', jp: '各サービス', en: 'Services' },
  { href: '/landing/business/seminar', jp: 'セミナー・イベント', en: 'Seminar・Event' },
  { href: '/landing/business/news', jp: 'ニュース', en: 'News' },
  { href: '/landing/business/about-us', jp: '会社概要', en: 'Company' },
];

export function ArrowSvg({ className = 'w-[11px] h-[10px]', white = false }) {
  return (
    <svg width="11" height="10" viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M10.3333 4.84082L0.333313 9.17095L0.333313 0.510693L10.3333 4.84082Z" fill={white ? 'white' : '#0576b6'} />
    </svg>
  );
}

export function TelIcon({ className = 'w-[13px] h-[18px]' }) {
  return (
    <svg className={className} width="13" height="18" viewBox="0 0 13 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.7416 17.118L9.98504 17.5794C5.54731 20.1493 -2.15198 5.16317 2.17132 2.33065L2.89611 1.87631L5.26756 6.4694L4.54278 6.91664C3.22671 7.80402 6.29753 13.8098 7.64538 12.9863L8.38288 12.532L10.7416 17.118ZM4.50463 0.839844L3.44288 1.54975L5.80798 6.13574L6.87608 5.42584L4.50463 0.839844ZM9.97869 11.4884L8.91058 12.1983L11.2757 16.7914L12.3438 16.0815L9.97869 11.4884Z" fill="currentColor" />
    </svg>
  );
}

export function BtnArrow({ className = '', size = 'sm' }) {
  const w = size === 'lg' ? 5 : 3.5;
  const l = size === 'lg' ? 13 : 8;
  return (
    <span
      aria-hidden="true"
      className={`inline-block align-middle shrink-0 ${className}`}
      style={{
        width: 0,
        height: 0,
        borderTop: `${w}px solid transparent`,
        borderBottom: `${w}px solid transparent`,
        borderLeft: `${l}px solid #0576b6`,
      }}
    />
  );
}
