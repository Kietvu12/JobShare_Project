import React from 'react';
import { getLandingPageTemplate } from '../../constants/landingPageTemplates';
import Lp3TemplateView from './templates/Lp3TemplateView';
import BizTemplateView from './templates/BizTemplateView';

function LandingPageTemplateRenderer({
  data,
  form,
  setForm,
  onSubmit,
  submitting,
  submitted,
}) {
  const content = data?.content || {};
  const templateKey = data?.templateKey || content.templateKey;
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
