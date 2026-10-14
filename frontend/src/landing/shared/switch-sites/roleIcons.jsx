import React from 'react';

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function IconCollaborator(props) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" {...STROKE} />
      <circle cx="9" cy="7" r="4" {...STROKE} />
    </svg>
  );
}

export function IconCandidate(props) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="8" r="4" {...STROKE} />
      <path d="M4 21v-2a8 8 0 0 1 16 0v2" {...STROKE} />
    </svg>
  );
}

export function IconBusiness(props) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...props}>
      <rect x="3" y="7" width="18" height="14" rx="2" {...STROKE} />
      <path d="M8 7V4h8v3M3 12a22 22 0 0 0 18 0M12 11v4" {...STROKE} />
    </svg>
  );
}
