import React, { useMemo } from 'react';
import { getLandingPageTemplate } from '../../constants/landingPageTemplates';
import { getTemplatePageRegistry } from '../../constants/templatePageRegistry';
import {
  isCompanyBuilderContent,
  isHtmlBuilderContent,
  findPageBySlug,
  mergeHtmlTemplateContent,
} from '../../utils/companyLandingPageSchema';
import CompanyLandingRenderer from './CompanyLandingRenderer';
import HtmlTemplatePageViewer from './HtmlTemplatePageViewer';
import Lp3TemplateView from './templates/Lp3TemplateView';
import BizTemplateView from './templates/BizTemplateView';

function LandingPageTemplateRenderer({
  data,
  pageSlug = '',
  form,
  setForm,
  onSubmit,
  submitting,
  submitted,
}) {
  const content = data?.content || {};
  const templateKey = data?.templateKey || content.templateKey;
  const isHtmlCompany = isCompanyBuilderContent(content) && isHtmlBuilderContent(content);
  const mergedHtml = useMemo(
    () => (isHtmlCompany ? mergeHtmlTemplateContent(content) : null),
    [content, isHtmlCompany],
  );

  if (isHtmlCompany && mergedHtml) {
    const activePage = findPageBySlug(mergedHtml.pages, pageSlug);
    const templatePageId = activePage?.templatePageId || 'index';
    const templateRegistry = getTemplatePageRegistry(templateKey);
    return (
      <HtmlTemplatePageViewer
        templateKey={templateKey}
        pageId={templatePageId}
        className="w-full"
        title={activePage?.title || data.title}
        sections={activePage?.sections || []}
        autoHeight
        documentMeta={{
          title: data.seo?.title || data.metaTitle || data.title,
          description: data.seo?.description || data.metaDescription || '',
        }}
        globals={{
          companyName: mergedHtml.companyName,
          logoText: mergedHtml.sharedBlocks?.logoText || mergedHtml.companyName,
          logoHidden: mergedHtml.sharedBlocks?.logoHidden,
          announcement: mergedHtml.announcement,
          theme: mergedHtml.theme,
          globalNav: mergedHtml.globalNav,
          pages: mergedHtml.pages,
          currentTemplatePageId: templatePageId,
          sharedBlocks: {
            ...templateRegistry?.sharedBlocks,
            ...mergedHtml.sharedBlocks,
          },
        }}
      />
    );
  }

  if (isCompanyBuilderContent(content)) {
    return (
      <CompanyLandingRenderer
        data={data}
        pageSlug={pageSlug}
        form={form}
        setForm={setForm}
        onSubmit={onSubmit}
        submitting={submitting}
        submitted={submitted}
      />
    );
  }

  const tpl = getLandingPageTemplate(templateKey);
  const layout = content.layout || tpl.layout;

  const props = {
    data,
    content,
    form,
    setForm,
    onSubmit,
    submitting,
    submitted,
  };

  if (layout === 'lp3') {
    return <Lp3TemplateView {...props} />;
  }

  return <BizTemplateView {...props} layout={layout} />;
}

export default LandingPageTemplateRenderer;
