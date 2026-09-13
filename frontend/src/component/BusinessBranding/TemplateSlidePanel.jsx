import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Loader2, X, FileText } from 'lucide-react';
import { LANDING_PAGE_TEMPLATES } from '../../constants/landingPageTemplates';
import { getRegisteredLandingPageTemplates, getTemplatePages, isHtmlTemplate } from '../../constants/templatePageRegistry';
import { buildCompanyContentFromTemplate } from '../../utils/companyLandingPageSchema';
import apiService from '../../services/api';
import { wjsDebug } from '../../utils/wjsBuilderDebug';
import { BUSINESS_UI_FONT, BUSINESS_UI_FONT_IMPORT } from '../../utils/businessUiFont';
import TemplateLivePreview from './TemplateLivePreview';
import { useLanguage } from '../../context/LanguageContext';
import { getBrandingCopy } from '../../i18n/businessAppI18n';

export default function TemplateSlidePanel({ open, onClose, onCreated }) {
  const { language } = useLanguage();
  const copy = useMemo(() => getBrandingCopy(language), [language]);
  const templateCopy = copy.template;

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
        window.alert(templateCopy.templateMismatch(templateKey, content.templateKey));
        return;
      }

      const res = await apiService.createBusinessLandingPage({ templateKey, content });
      if (res?.success && res.data?.landingPage) {
        const lp = res.data.landingPage;
        if (lp.templateKey !== templateKey) {
          window.alert(templateCopy.serverMismatch(lp.templateKey, templateKey));
          return;
        }
        const url = `${window.location.origin}/business/saiyo/pages/${lp.id}/build`;
        window.open(url, '_blank', 'noopener,noreferrer');
        onCreated?.(lp);
        onClose();
      } else {
        alert(res?.message || templateCopy.createFailed);
      }
    } catch (e) {
      console.error(e);
      alert(e?.message || templateCopy.createFailed);
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
        className="fixed inset-0 z-[10030] flex items-center justify-center p-3 sm:p-4"
        style={{ fontFamily: BUSINESS_UI_FONT }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-picker-title"
      >
        <button
          type="button"
          aria-label={templateCopy.close}
          className="absolute inset-0 bg-slate-900/45"
          onClick={handleClose}
        />
        <div className="relative flex h-[min(78vh,720px)] max-h-[78vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2.5 pr-12">
            <div className="min-w-0 pr-2">
              <h2 id="template-picker-title" className="truncate text-sm font-bold text-slate-900">
                {previewTemplate ? previewTemplate.name : templateCopy.pickTitle}
              </h2>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
                {previewTemplate
                  ? templateCopy.fullPreviewHint
                  : templateCopy.pickSubtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-3 top-2.5 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              aria-label={templateCopy.closeDialog}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {previewTemplate ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
                <TemplateLivePreview templateKey={previewTemplate.key} compact />
                {isHtmlTemplate(previewTemplate.key) && (
                  <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                    <FileText className="h-3.5 w-3.5" />
                    {templateCopy.htmlPages(getTemplatePages(previewTemplate.key).length)}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2 border-t border-slate-100 p-3 sm:p-4">
                <button
                  type="button"
                  onClick={() => setPreviewKey(null)}
                  disabled={!!creatingKey}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                >
                  {templateCopy.back}
                </button>
                <button
                  type="button"
                  onClick={() => handlePick(previewTemplate.key)}
                  disabled={!!creatingKey}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0077B6] py-2 text-xs font-semibold text-white hover:bg-[#006399] disabled:opacity-60"
                >
                  {creatingKey === previewTemplate.key ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {templateCopy.pickThis}
                </button>
              </div>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
              {availableTemplates.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {templateCopy.noTemplates}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {availableTemplates.map((t) => {
                    const busy = creatingKey === t.key;
                    return (
                      <article
                        key={t.key}
                        className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-[#0077B6]/40 hover:shadow-md"
                      >
                        <div
                          className="relative h-32 shrink-0 overflow-hidden sm:h-28"
                          style={{ background: `${t.previewColor}18` }}
                        >
                          <img
                            src={t.previewImage || `/template/${t.folder}/images/mainimg1.jpg`}
                            alt=""
                            className="h-full w-full object-cover object-top"
                            style={t.previewImagePosition ? { objectPosition: t.previewImagePosition } : undefined}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          {busy && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col p-2.5">
                          <div className="text-xs font-bold leading-tight text-slate-800">{t.name}</div>
                          <div className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-500">{t.description}</div>
                          {isHtmlTemplate(t.key) && (
                            <div className="mt-1.5 flex items-center gap-1 text-[9px] font-semibold text-emerald-700">
                              <FileText className="h-3 w-3" />
                              {templateCopy.htmlPages(getTemplatePages(t.key).length)}
                            </div>
                          )}
                          <div className="mt-2 grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              disabled={!!creatingKey}
                              onClick={() => setPreviewKey(t.key)}
                              className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                            >
                              <Eye className="h-3 w-3" />
                              {templateCopy.preview}
                            </button>
                            <button
                              type="button"
                              disabled={!!creatingKey}
                              onClick={() => handlePick(t.key)}
                              className="inline-flex items-center justify-center gap-1 rounded-md bg-[#0077B6] py-1.5 text-[10px] font-semibold text-white hover:bg-[#006399] disabled:opacity-60"
                            >
                              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                              {templateCopy.pickNow}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
