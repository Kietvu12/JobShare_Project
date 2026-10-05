import { useLanguage } from '../../../../../../context/LanguageContext';
import JobShareBusinessV6 from './JobShareBusinessV6';
import JobSharePriceV5 from './JobSharePriceV5';

export default function PricePage() {
  const { language } = useLanguage();
  if (language === 'vi') return <JobShareBusinessV6 />;
  return <JobSharePriceV5 />;
}
