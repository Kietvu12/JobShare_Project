import React, { useMemo } from 'react';
import { getTemplatePages, isHtmlTemplate } from '../../constants/templatePageRegistry';
import { buildCompanyContentFromTemplate } from '../../utils/companyLandingPageSchema';
import HtmlTemplatePageViewer from '../../page/LandingPage/HtmlTemplatePageViewer';
import CompanyLandingRenderer from '../../page/LandingPage/CompanyLandingRenderer';

/**
 * Xem trước live toàn bộ trang chủ template (iframe HTML hoặc React renderer).
 */
export default function TemplateLivePreview({ templateKey, companyName = '', className = '' }) {
  const isHtml = isHtmlTemplate(templateKey);

  const previewContent = useMemo(
    () => buildCompanyContentFromTemplate(templateKey, { companyName }),
    [templateKey, companyName],
  );

  const htmlHomePage = useMemo(() => {
    if (!isHtml) return null;
    const pages = getTemplatePages(templateKey);
    return pages.find((p) => p.isHome) || pages[0] || null;
  }, [isHtml, templateKey]);

  const reactHomePage = useMemo(() => {
    if (isHtml) return null;
    return previewContent.pages?.find((p) => p.isHome) || previewContent.pages?.[0] || null;
  }, [isHtml, previewContent.pages]);

  if (isHtml && !htmlHomePage) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-xs text-slate-400 ${className}`}>
        Không có trang preview
      </div>
    );
  }

  if (!isHtml && !reactHomePage) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-xs text-slate-400 ${className}`}>
        Không có trang preview
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="max-h-[min(70vh,640px)] overflow-y-auto business-homepage-scroll bg-slate-100">
        {isHtml ? (
          <HtmlTemplatePageViewer
            templateKey={templateKey}
            pageId={htmlHomePage.id}
            title={htmlHomePage.title}
            autoHeight
          />
        ) : (
          <CompanyLandingRenderer
            data={previewContent}
            pageSlug={reactHomePage.slug}
            preview
          />
        )}
      </div>
    </div>
  );
}
