import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Loader2, X, FileText } from 'lucide-react';
import { LANDING_PAGE_TEMPLATES } from '../../constants/landingPageTemplates';
import { getRegisteredLandingPageTemplates, getTemplatePages, isHtmlTemplate } from '../../constants/templatePageRegistry';
import { buildCompanyContentFromTemplate } from '../../utils/companyLandingPageSchema';
import apiService from '../../services/api';
import { wjsDebug } from '../../utils/wjsBuilderDebug';
import { BUSINESS_UI_FONT, BUSINESS_UI_FONT_IMPORT } from '../../utils/businessUiFont';
import TemplateLivePreview from './TemplateLivePreview';

export default function TemplateSlidePanel({ open, onClose, onCreated }) {
  const [creatingKey, setCreatingKey] = useState(null);
  const [previewKey, setPreviewKey] = useState(null);
  const availableTemplates = getRegisteredLandingPageTemplates(LANDING_PAGE_TEMPLATES);
  const previewTemplate = previewKey
    ? availableTemplates.find((t) => t.key === previewKey)
    : null;

  const handlePick = async (templateKey) => {
    if (creatingKey) return;
    setCreatingKey(templateKey);
    setPreviewKey(null);
    wjsDebug('template', 'create landing page', { templateKey });
    try {
      let companyName = '';
      try {
        const profile = await apiService.getBusinessProfile();
        companyName = profile?.data?.business?.companyName
          || profile?.data?.companyName
          || '';
      } catch {
        // optional
      }

      const content = buildCompanyContentFromTemplate(templateKey, { companyName });
      wjsDebug('template', 'built content', {
        templateKey,
        contentKey: content.templateKey,
        folder: content.theme?.folder,
        sections: content.pages?.[0]?.sections?.length,
      });

      if (content.templateKey !== templateKey) {
        window.alert(`Lỗi nội bộ: templateKey không khớp (${templateKey} → ${content.templateKey})`);
        return;
      }

      const res = await apiService.createBusinessLandingPage({ templateKey, content });
      if (res?.success && res.data?.landingPage) {
        const lp = res.data.landingPage;
        if (lp.templateKey !== templateKey) {
          window.alert(
            `Server lưu template "${lp.templateKey}" thay vì "${templateKey}". `
            + 'Hãy restart backend (pnpm dev) rồi thử lại.',
          );
          return;
        }
        const url = `${window.location.origin}/business/saiyo/pages/${lp.id}/build`;
        window.open(url, '_blank', 'noopener,noreferrer');
        onCreated?.(lp);
        onClose();
      } else {
        alert(res?.message || 'Tạo thất bại');
      }
    } catch (e) {
      console.error(e);
      alert(e?.message || 'Tạo thất bại');
    } finally {
      setCreatingKey(null);
    }
  };

  const handleClose = () => {
    if (creatingKey) return;
    setPreviewKey(null);
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <>
      <style>{BUSINESS_UI_FONT_IMPORT}</style>
      <div
        className="fixed inset-0 z-[10030] flex items-center justify-center p-4"
        style={{ fontFamily: BUSINESS_UI_FONT }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-picker-title"
      >
        <button
          type="button"
          aria-label="Đóng"
          className="absolute inset-0 bg-slate-900/45"
          onClick={handleClose}
        />
        <div
          className={`relative flex max-h-[min(90vh,720px)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${
            previewTemplate ? 'max-w-[1000px]' : 'max-w-[1000px]'
          }`}
        >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 pr-12">
          <div className="min-w-0 pr-2">
            <h2 id="template-picker-title" className="truncate text-sm font-bold text-slate-900">
              {previewTemplate ? previewTemplate.name : 'Chọn template'}
            </h2>
            <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
              {previewTemplate
                ? previewTemplate.description
                : 'Xem trước toàn trang hoặc chọn để mở trình chỉnh sửa'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            aria-label="Đóng hộp thoại"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {previewTemplate ? (
          <div className="flex flex-1 flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4">
              <TemplateLivePreview templateKey={previewTemplate.key} />
              {isHtmlTemplate(previewTemplate.key) && (
                <p className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                  <FileText className="w-3.5 h-3.5" />
                  {getTemplatePages(previewTemplate.key).length} trang HTML gốc
                </p>
              )}
            </div>
            <div className="shrink-0 flex gap-2 border-t border-slate-100 p-4">
              <button
                type="button"
                onClick={() => setPreviewKey(null)}
                disabled={!!creatingKey}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={() => handlePick(previewTemplate.key)}
                disabled={!!creatingKey}
                className="flex-1 rounded-lg bg-[#0077B6] py-2.5 text-xs font-semibold text-white hover:bg-[#006399] disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {creatingKey === previewTemplate.key ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                Chọn template này
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {availableTemplates.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-8">
                Chưa có template nào được đăng ký.
              </div>
            ) : availableTemplates.map((t) => {
              const busy = creatingKey === t.key;
              return (
                <article
                  key={t.key}
                  className="overflow-hidden rounded-xl border border-slate-200 transition-all hover:border-blue-400 hover:shadow-md"
                >
                  <div
                    className="relative aspect-[16/10] overflow-hidden"
                    style={{ background: `${t.previewColor}18` }}
                  >
                    <img
                      src={t.previewImage || `/template/${t.folder}/images/mainimg1.jpg`}
                      alt=""
                      className="h-full w-full object-cover"
                      style={t.previewImagePosition ? { objectPosition: t.previewImagePosition } : { objectPosition: 'top' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    {busy && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-bold text-slate-800">{t.name}</div>
                    <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">{t.description}</div>
                    {isHtmlTemplate(t.key) && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-700 font-semibold">
                        <FileText className="w-3 h-3" />
                        {getTemplatePages(t.key).length} trang HTML gốc
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={!!creatingKey}
                        onClick={() => setPreviewKey(t.key)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem trước
                      </button>
                      <button
                        type="button"
                        disabled={!!creatingKey}
                        onClick={() => handlePick(t.key)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0077B6] py-2 text-[11px] font-semibold text-white hover:bg-[#006399] disabled:opacity-60"
                      >
                        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Chọn ngay
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </>,
    document.body,
  );
}
