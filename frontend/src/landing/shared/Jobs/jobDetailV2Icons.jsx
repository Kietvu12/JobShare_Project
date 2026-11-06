import React from 'react';

/** Bộ icon của template JobShare_JobDetail_V2 (assets/app.js). */
const PATHS = {
  code: <path d="M8 7 3 12l5 5M16 7l5 5-5 5M14 4l-4 16" />,
  circuit: (
    <>
      <path d="M12 2v5m0 10v5M2 12h5m10 0h5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M5 5l3 3m8 8 3 3M19 5l-3 3m-8 8-3 3" />
    </>
  ),
  gear: (
    <>
      <path d="M9.7 4.2 10 2h4l.3 2.2 2.2.9L18.4 4l2.8 2.8-1.1 1.9.9 2.2 2 .3v4l-2 .3-.9 2.2 1.1 1.9-2.8 2.8-1.9-1.1-2.2.9-.3 2h-4l-.3-2-2.2-.9-1.9 1.1L2.8 19.6l1.1-1.9-.9-2.2-2-.3v-4l2-.3.9-2.2-1.1-1.9L5.6 4l1.9 1.1z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  building: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h2m4 0h2M8 11h2m4 0h2M8 15h2m4 0h2M10 21v-3h4v3" />
    </>
  ),
  handshake: <path d="M2 9l4-4 5 1 2 2m9 1-4-4-5 1-5 5 4 2 3-2 4 4-5 5-3-2-2 1-3-3-2-1z" />,
  document: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h8" />
    </>
  ),
  flask: <path d="M9 3h6M10 3v7L4.5 19a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 10V3M7 16h10" />,
  heart: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.9-7.6 1-1a5.5 5.5 0 0 0-.1-7.8z" />
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="14" rx="2" />
      <path d="M8 7V4h8v3M3 12a22 22 0 0 0 18 0M12 11v4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      <circle cx="9" cy="7" r="4" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  yen: <path d="m6 3 6 9 6-9M5 12h14M5 16h14M12 12v9" />,
  copy: (
    <>
      <rect x="8" y="8" width="13" height="13" rx="2" />
      <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
    </>
  ),
  download: <path d="M12 3v13m-4-4 4 4 4-4M4 17v4h16v-4" />,
  arrow: <path d="M5 12h14m-7-7 7 7-7 7" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  star: <path d="m12 3 2.7 5.6 6.2.9-4.5 4.4 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.5-4.4 6.2-.9z" />,
  gift: (
    <>
      <rect x="3" y="10" width="18" height="11" rx="1" />
      <path d="M2 7h20v4H2zm10 0v14M12 7C5-1 2 7 12 7Zm0 0c7-8 10 0 0 0Z" />
    </>
  ),
  layers: <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 18l9 5 9-5" />,
};

export function DetailIcon({ name }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name] || PATHS.briefcase}
    </svg>
  );
}

const ROOT_ICON = { 11: 'handshake', 51: 'document', 79: 'code', 112: 'circuit', 137: 'gear', 190: 'flask', 225: 'building' };
const ROOT_TONE = {
  11: 'sales',
  51: 'admin',
  79: 'it',
  112: 'embedded',
  137: 'mechanical',
  190: 'chemical',
  225: 'construction',
};

export const detailIconFor = (rootId) => ROOT_ICON[Number(rootId)] || 'briefcase';
export const detailToneFor = (rootId) => ROOT_TONE[Number(rootId)] || 'other';
