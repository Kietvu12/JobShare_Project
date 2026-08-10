import React from 'react';

export const BUSINESS_SERVICE_TAGS = [
  {
    id: 'direct-scout',
    frameColor: '#0077B6',
    labelJa: 'ダイレクトスカウト',
    labelEn: 'Direct Scout',
    labelVi: 'Scout Trực Tiếp',
  },
  {
    id: 'managed-scout',
    frameColor: '#E879A8',
    labelJa: 'おまかせスカウト',
    labelEn: 'Managed Scout',
    labelVi: 'Scout Ủy Thác',
  },
  {
    id: 'employer-branding',
    frameColor: '#22C55E',
    labelJa: '採用ブランディング',
    labelEn: 'Employer Branding',
    labelVi: 'Thương hiệu Tuyển dụng',
  },
  {
    id: 'hr-partner-network',
    frameColor: '#F97316',
    labelJa: 'HRパートナーネットワーク',
    labelEn: 'HR Partner Network',
    labelVi: 'Mạng lưới Đối tác Tuyển dụng',
  },
];

export function getBusinessServiceTag(tagId) {
  return BUSINESS_SERVICE_TAGS.find((tag) => tag.id === tagId) || null;
}

/** Tên dịch vụ 3 ngôn ngữ — không còn tag màu riêng. */
export default function BusinessServiceCardTag({ tag, isOnDark = false, className = '' }) {
  if (!tag) return null;

  const textClass = isOnDark ? 'text-white/85' : 'text-slate-600';
  const strongClass = isOnDark ? 'text-white/95' : 'text-slate-800';

  return (
    <p className={`text-[9px] leading-snug sm:text-[10px] ${textClass} ${className}`}>
      <span className={`font-medium ${strongClass}`}>{tag.labelJa}</span>
      {' / '}
      <span>{tag.labelEn}</span>
      {' / '}
      <span>{tag.labelVi}</span>
    </p>
  );
}
