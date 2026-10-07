import React, { useRef } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { normalizePostImageUrl } from '../../services/api';
import { useLandingPageEditorUi } from '../../context/LandingPageEditorUiContext';

function Field({ label, children }) {
  return (
    <div className="mb-2">
      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = () => 'w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-400 outline-none';

export default function LandingPageSeoPanel({
  metaTitle,
  metaDescription,
  metaKeywords,
  ogTitle,
  ogDescription,
  metaImage,
  onChange,
  onUploadOgImage,
  uploading = false,
}) {
  const seo = useLandingPageEditorUi().seoPanel;
  const fileRef = useRef(null);
  const ogPreview = metaImage ? normalizePostImageUrl(metaImage) : '';

  const set = (patch) => onChange?.(patch);

  return (
    <div className="mb-4 pb-3 border-b border-slate-200">
      <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">{seo.heading}</div>
      <p className="text-[9px] text-slate-400 mb-2 leading-relaxed">
        {seo.intro}
      </p>

      <Field label={seo.metaTitle}>
        <input
          value={metaTitle}
          onChange={(e) => set({ metaTitle: e.target.value })}
          className={inputCls()}
          placeholder={seo.metaTitlePh}
        />
      </Field>

      <Field label={seo.metaDescription}>
        <textarea
          rows={2}
          value={metaDescription}
          onChange={(e) => set({ metaDescription: e.target.value })}
          className={inputCls()}
          placeholder={seo.metaDescriptionPh}
        />
      </Field>

      <Field label={seo.ogTitle}>
        <input
          value={ogTitle}
          onChange={(e) => set({ ogTitle: e.target.value })}
          className={inputCls()}
          placeholder={seo.ogTitlePh}
        />
      </Field>

      <Field label={seo.ogDescription}>
        <textarea
          rows={2}
          value={ogDescription}
          onChange={(e) => set({ ogDescription: e.target.value })}
          className={inputCls()}
          placeholder={seo.ogDescriptionPh}
        />
      </Field>

      <Field label={seo.ogImage}>
        <div className="flex gap-2 items-start">
          {ogPreview ? (
            <div className="relative w-16 h-16 rounded border border-slate-200 overflow-hidden shrink-0">
              <img src={ogPreview} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => set({ metaImage: '' })}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5"
                title={seo.ogImageRemove}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="w-16 h-16 rounded border border-dashed border-slate-200 flex items-center justify-center text-slate-300 shrink-0">
              <ImagePlus className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <input
              value={metaImage}
              onChange={(e) => set({ metaImage: e.target.value })}
              className={inputCls()}
              placeholder={seo.ogImagePh}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="mt-1 text-[10px] text-blue-600 font-semibold flex items-center gap-1 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {seo.ogImageUpload}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                await onUploadOgImage?.(file);
                e.target.value = '';
              }}
            />
          </div>
        </div>
      </Field>

      <Field label={seo.keywords}>
        <input
          value={metaKeywords}
          onChange={(e) => set({ metaKeywords: e.target.value })}
          className={inputCls()}
          placeholder={seo.keywordsPh}
        />
      </Field>
    </div>
  );
}
