import React from 'react';

/** Stub tạm sau khi gỡ `landing/shared` — builder cần được nối lại từ template hoặc module mới. */
export default function CompanyLandingRenderer({ preview }) {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
      {preview ? 'Preview landing (renderer đang tái triển khai)' : 'Company landing renderer unavailable'}
    </div>
  );
}

export function HtmlTemplatePageViewer() {
  return (
    <div className="flex min-h-[480px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
      HTML template preview unavailable — migrate from `src/landing/templates`.
    </div>
  );
}
