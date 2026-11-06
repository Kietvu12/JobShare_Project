import { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../../../../../../context/LanguageContext';
import { useBusinessLandingBase } from '../../../../BusinessLandingContext';
import { toBusinessLandingPath } from '../../../../businessLandingBase';
import { scrollBusinessLandingToTop } from '../../../lib/templateHtml';
import { getServicesPricingContent } from './content';
import PricingConnectSection from './components/PricingConnectSection';
import PricingFaqSection from './components/PricingFaqSection';
import PricingFeesSection from './components/PricingFeesSection';
import PricingHero from './components/PricingHero';
import PricingSectionNav from './components/PricingSectionNav';
import PricingServicesSection from './components/PricingServicesSection';
import PricingSimulatorSection from './components/PricingSimulatorSection';
import '../../home/jobshare-v2/jobshare-home-v2.css';
import '../../about/about-us.page.css';
import './servicesPricing.css';

const SUPPORTED = ['ja', 'en', 'vi'];

function usePricingLocale(basePath) {
  const { language } = useLanguage();
  const fromPath = String(basePath || '').match(/^\/(vi|en|ja)\/business/)?.[1];
  if (fromPath) return fromPath;
  return SUPPORTED.includes(language) ? language : 'ja';
}

export default function ServicesPricingPage() {
  const basePath = useBusinessLandingBase();
  const lang = usePricingLocale(basePath);
  const copy = useMemo(() => getServicesPricingContent(lang), [lang]);

  const links = useMemo(
    () => ({
      register: `/business/register?lang=${lang}`,
      contact: toBusinessLandingPath('/contact_rc', basePath),
      docs: toBusinessLandingPath('/inquiry_docs_rc', basePath),
    }),
    [basePath, lang],
  );

  useEffect(() => {
    scrollBusinessLandingToTop();
  }, []);

  return (
    <div className="jsb-v2 jsb-about price-page" lang={lang}>
      <Helmet>
        <title>{`${copy.title} | JobShare Business`}</title>
        <meta name="description" content={copy.heroLead} />
      </Helmet>
      <PricingHero copy={copy} links={links} />
      <PricingSectionNav copy={copy} />
      <PricingServicesSection copy={copy} links={links} />
      <PricingFeesSection copy={copy} />
      <PricingSimulatorSection copy={copy} lang={lang} links={links} />
      <PricingFaqSection copy={copy} />
      <PricingConnectSection copy={copy} links={links} />
    </div>
  );
}
