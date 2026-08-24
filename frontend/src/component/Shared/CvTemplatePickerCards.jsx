import React from 'react';
import { Eye } from 'lucide-react';
import { CV_TEMPLATE_OPTIONS } from '../../utils/cvTemplateMeta.js';

function TemplatePreviewFigure({ gradient, border }) {
  return (
    <div
      className={`relative mx-auto aspect-[210/297] w-full max-w-[120px] overflow-hidden rounded-md border-2 bg-gradient-to-br shadow-inner sm:max-w-[140px] ${gradient} ${border}`}
      aria-hidden
    >
      <div className="absolute inset-2 rounded-sm bg-white/90 shadow-sm">
        <div className="mx-auto mt-2 h-1.5 w-2/5 rounded-full bg-neutral-200" />
        <div className="mx-2 mt-2 space-y-1">
          <div className="h-0.5 rounded bg-neutral-200" />
          <div className="h-0.5 w-4/5 rounded bg-neutral-200" />
          <div className="h-0.5 w-3/5 rounded bg-neutral-200" />
        </div>
        <div className="mx-2 mt-3 grid grid-cols-2 gap-1">
          <div className="h-6 rounded bg-neutral-100" />
          <div className="h-6 rounded bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}

/**
 * Chọn loại template CV — placeholder preview cho đến khi QA cung cấp ảnh.
 */
export default function CvTemplatePickerCards({
  value = null,
  onChange,
  language = 'vi',
  disabled = false,
  compact = false,
  onPreview,
  previewLoadingId = null,
}) {
  const getLabel = (opt) => {
    if (language === 'en') return opt.labelEn;
    if (language === 'ja') return opt.labelJa;
    return opt.labelVi;
  };

  const previewLabel = language === 'en' ? 'Preview' : language === 'ja' ? 'プレビュー' : 'Xem preview';

  return (
    <div className={`grid gap-3 ${compact ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'}`}>
      {CV_TEMPLATE_OPTIONS.map((opt) => {
        const selected = value === opt.id;
        const previewLoading = previewLoadingId === opt.id;
        return (
          <div
            key={opt.id}
            className={`flex flex-col items-center rounded-xl border-2 p-3 transition-all ${opt.border} ${
              selected ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/40' : 'bg-white'
            }`}
          >
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange?.(opt.id)}
              className={`w-full text-left transition-all disabled:opacity-50 ${opt.cardHover} rounded-lg`}
            >
              <TemplatePreviewFigure gradient={opt.gradient} border={opt.border} />
              <p className="mt-2 text-xs font-semibold text-gray-900 text-center">{getLabel(opt)}</p>
            </button>
            {onPreview ? (
              <button
                type="button"
                disabled={disabled || previewLoading}
                onClick={() => onPreview(opt.id)}
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm transition-colors hover:border-blue-500 hover:text-blue-600 disabled:opacity-50"
              >
                <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {previewLoading ? (language === 'en' ? 'Loading…' : language === 'ja' ? '読み込み中…' : 'Đang tải…') : previewLabel}
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
