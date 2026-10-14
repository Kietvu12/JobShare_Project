import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { getLocaleFromPathname } from '../../../utils/localeRoutes';
import uiContent from '../../templates/JobShare_Collaborator_V3/ui-content.json';
import sourceContent from '../../templates/JobShare_Collaborator_V3/source-content.json';

export function useCollaboratorCopy() {
  const { pathname } = useLocation();
  const { language } = useLanguage();
  const fromUrl = getLocaleFromPathname(pathname);
  const candidate = fromUrl || language;
  const lang = uiContent[candidate] ? candidate : 'vi';
  return {
    lang,
    ui: uiContent[lang],
    source: sourceContent[lang],
  };
}
