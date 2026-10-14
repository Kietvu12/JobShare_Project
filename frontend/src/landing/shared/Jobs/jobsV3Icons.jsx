import React from 'react';

const PATHS = {
  search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
  pin: '<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  briefcase:
    '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12l9 4 9-4M12 14v4"/>',
  code: '<rect x="2" y="3" width="20" height="15" rx="2"/><path d="m9 8-3 3 3 3m6-6 3 3-3 3M8 22h8M12 18v4"/>',
  gear:
    '<path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>',
  circuit:
    '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4M9 9h6v6H9Z"/>',
  building: '<path d="M4 21V3h11v18M15 10h5v11M2 21h20M8 7h3M8 11h3M8 15h3M9 21v-3"/>',
  flask:
    '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/><path d="M7.5 15h9"/>',
  document: '<path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  handshake:
    '<path d="m8 12 2 2a2 2 0 0 0 3 0l4-4"/><path d="m3 8 4-3 4 2 2-1 8 5-3 5-3 3-3-2-2 1-5-5-2-5Z"/>',
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
  yen: '<path d="M7 4l5 7 5-7M8 12h8M8 16h8M12 11v9"/>',
  bookmark: '<path d="M6 3h12v19l-6-4-6 4Z"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  left: '<path d="m15 6-6 6 6 6"/>',
  right: '<path d="m9 6 6 6-6 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  filter:
    '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="white"/><circle cx="15" cy="12" r="2" fill="white"/><circle cx="9" cy="18" r="2" fill="white"/>',
  sort: '<path d="M5 4v16m-3-3 3 3 3-3M12 5h9M12 11h6M12 17h3"/>',
};

export function JobsV3Icon({ name, className }) {
  const inner = PATHS[name] || PATHS.briefcase;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}

export const jobsV3IconFor = (id) =>
  ({
    11: 'handshake',
    51: 'document',
    79: 'code',
    112: 'circuit',
    137: 'gear',
    190: 'flask',
    225: 'building',
    296: 'handshake',
    326: 'document',
    348: 'heart',
    2: 'circuit',
  }[id] || 'briefcase');

export const jobsV3ToneFor = (id) =>
  ({
    11: 'sales',
    51: 'admin',
    79: 'it',
    112: 'embedded',
    137: 'mechanical',
    190: 'chemical',
    225: 'construction',
    296: 'sales',
    326: 'admin',
    348: 'construction',
    2: 'mechanical',
  }[id] || 'other');
