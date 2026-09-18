import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Loader2, X, FileText } from 'lucide-react';
import { LANDING_PAGE_TEMPLATES } from '../../constants/landingPageTemplates';
import { getRegisteredLandingPageTemplates, getTemplatePages, isHtmlTemplate } from '../../constants/templatePageRegistry';
import { buildCompanyContentFromTemplate } from '../../utils/companyLandingPageSchema';
import apiService from '../../services/api';
import { wjsDebug } from '../../utils/wjsBuilderDebug';
import {
  BUSINESS_HOMEPAGE_TYPOGRAPHY_STYLES,
  BUSINESS_HP_TEXT,
  BUSINESS_UI_FONT,
} from '../../utils/businessHomepageTypography.js';
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
      <style>{BUSINESS_HOMEPAGE_TYPOGRAPHY_STYLES}</style>
      <div
        className="business-app-ui fixed inset-0 z-[10030] flex items-center justify-center p-5 sm:p-8 lg:p-10"
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
        <div className="business-homepage-ui relative flex h-[min(86vh,840px)] max-h-[86vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:max-w-7xl">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-5 pr-16 sm:px-8 sm:py-6 sm:pr-20">
            <div className="min-w-0 pr-4">
              <h2 id="template-picker-title" className={`truncate ${BUSINESS_HP_TEXT.title}`}>
                {previewTemplate ? previewTemplate.name : templateCopy.pickTitle}
              </h2>
              <p className={`mt-2 line-clamp-2 text-slate-500 ${BUSINESS_HP_TEXT.bodyLg}`}>
                {previewTemplate
                  ? templateCopy.fullPreviewHint
                  : templateCopy.pickSubtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 sm:right-7 sm:top-6"
              aria-label={templateCopy.closeDialog}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {previewTemplate ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="business-homepage-scroll min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">
                <TemplateLivePreview templateKey={previewTemplate.key} compact />
                {isHtmlTemplate(previewTemplate.key) && (
                  <p className={`mt-4 flex items-center gap-2 font-semibold text-emerald-700 ${BUSINESS_HP_TEXT.body}`}>
                    <FileText className="h-4 w-4 shrink-0" />
                    {templateCopy.htmlPages(getTemplatePages(previewTemplate.key).length)}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-4 border-t border-slate-100 p-6 sm:p-8">
                <button
                  type="button"
                  onClick={() => setPreviewKey(null)}
                  disabled={!!creatingKey}
                  className={`flex-1 rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60 sm:py-3.5 ${BUSINESS_HP_TEXT.button}`}
                >
                  {templateCopy.back}
                </button>
                <button
                  type="button"
                  onClick={() => handlePick(previewTemplate.key)}
                  disabled={!!creatingKey}
                  className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0077B6] px-5 py-3 text-white hover:bg-[#006399] disabled:opacity-60 sm:py-3.5 ${BUSINESS_HP_TEXT.buttonPrimary}`}
                >
                  {creatingKey === previewTemplate.key ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {templateCopy.pickThis}
                </button>
              </div>
            </div>
          ) : (
            <div className="business-homepage-scroll min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">
              {availableTemplates.length === 0 ? (
                <div className={`py-16 text-center text-slate-400 ${BUSINESS_HP_TEXT.body}`}>
                  {templateCopy.noTemplates}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7">
                  {availableTemplates.map((t) => {
                    const busy = creatingKey === t.key;
                    return (
                      <article
                        key={t.key}
                        className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:border-[#0077B6]/40 hover:shadow-lg"
                      >
                        <div
                          className="relative h-40 shrink-0 overflow-hidden sm:h-44"
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
                        <div className="flex flex-1 flex-col p-5 sm:p-6">
                          <div className={`leading-snug text-slate-900 ${BUSINESS_HP_TEXT.section}`}>{t.name}</div>
                          <div className={`mt-3 line-clamp-3 leading-relaxed text-slate-600 ${BUSINESS_HP_TEXT.body}`}>{t.description}</div>
                          {isHtmlTemplate(t.key) && (
                            <div className={`mt-3 flex items-center gap-2 font-semibold text-emerald-700 ${BUSINESS_HP_TEXT.caption}`}>
                              <FileText className="h-4 w-4 shrink-0" />
                              {templateCopy.htmlPages(getTemplatePages(t.key).length)}
                            </div>
                          )}
                          <div className="mt-auto grid grid-cols-2 gap-3 pt-5 sm:pt-6">
                            <button
                              type="button"
                              disabled={!!creatingKey}
                              onClick={() => setPreviewKey(t.key)}
                              className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60 sm:py-3.5 ${BUSINESS_HP_TEXT.button}`}
                            >
                              <Eye className="h-4 w-4 shrink-0" />
                              {templateCopy.preview}
                            </button>
                            <button
                              type="button"
                              disabled={!!creatingKey}
                              onClick={() => handlePick(t.key)}
                              className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#0077B6] px-3 py-3 font-semibold text-white hover:bg-[#006399] disabled:opacity-60 sm:py-3.5 ${BUSINESS_HP_TEXT.buttonPrimary}`}
                            >
                              {busy ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : null}
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
