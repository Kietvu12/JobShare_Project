/**
 * Media Collaborator V3 — khớp paths trong index.html / index-en.html / index-ja.html
 * (copy đa ngôn ngữ nằm ở ui-content.json + source-content.json).
 */
import logo from '../../templates/JobShare_Collaborator_V3/assets/jobshare-logo.png';
import logoWhite from '../../templates/JobShare_Collaborator_V3/assets/jobshare-white.png';
import hero from '../../templates/JobShare_Collaborator_V3/assets/hero.webp';
import aiCv from '../../templates/JobShare_Collaborator_V3/assets/ai-cv.webp';
import network from '../../templates/JobShare_Collaborator_V3/assets/network.webp';
import support from '../../templates/JobShare_Collaborator_V3/assets/support.webp';
import news1 from '../../templates/JobShare_Collaborator_V3/assets/news-1.jpg';
import news2 from '../../templates/JobShare_Collaborator_V3/assets/news-2.jpg';
import news3 from '../../templates/JobShare_Collaborator_V3/assets/news-3.jpg';
import partner1 from '../../templates/JobShare_Collaborator_V3/assets/partner-1.png';
import partner2 from '../../templates/JobShare_Collaborator_V3/assets/partner-2.png';
import partner3 from '../../templates/JobShare_Collaborator_V3/assets/partner-3.png';
import partner4 from '../../templates/JobShare_Collaborator_V3/assets/partner-4.png';
import partner5 from '../../templates/JobShare_Collaborator_V3/assets/partner-5.png';
import partner6 from '../../templates/JobShare_Collaborator_V3/assets/partner-6.png';
import partner7 from '../../templates/JobShare_Collaborator_V3/assets/partner-7.png';
import partner8 from '../../templates/JobShare_Collaborator_V3/assets/partner-8.png';
import partner9 from '../../templates/JobShare_Collaborator_V3/assets/partner-9.png';
import partner10 from '../../templates/JobShare_Collaborator_V3/assets/partner-10.png';
import partner11 from '../../templates/JobShare_Collaborator_V3/assets/partner-11.png';
import partner12 from '../../templates/JobShare_Collaborator_V3/assets/partner-12.png';
import partner13 from '../../templates/JobShare_Collaborator_V3/assets/partner-13.png';
import partner14 from '../../templates/JobShare_Collaborator_V3/assets/partner-14.png';
import partner15 from '../../templates/JobShare_Collaborator_V3/assets/partner-15.png';
import partner16 from '../../templates/JobShare_Collaborator_V3/assets/partner-16.png';
import partner17 from '../../templates/JobShare_Collaborator_V3/assets/partner-17.png';
import partner18 from '../../templates/JobShare_Collaborator_V3/assets/partner-18.png';

export const COLLABORATOR_LOGO = logo;
export const COLLABORATOR_LOGO_WHITE = logoWhite;

/** Ảnh section homepage (cùng file cho mọi locale). */
export const COLLABORATOR_HOME_IMAGES = {
  hero: { src: hero, width: 1672, height: 941 },
  aiCv: { src: aiCv, width: 1672, height: 941 },
  network: { src: network, width: 1672, height: 941 },
  support: { src: support, width: 1448, height: 1086 },
};

/** Khớp `image` trong news.json (assets/news-*.jpg). */
const NEWS_BY_TEMPLATE_PATH = {
  'assets/news-1.jpg': news1,
  'assets/news-2.jpg': news2,
  'assets/news-3.jpg': news3,
};

export function collaboratorNewsImage(templatePath) {
  return NEWS_BY_TEMPLATE_PATH[templatePath] || news1;
}

/** Khớp partner-grid trong template (title + assets/partner-N.png). */
export const COLLABORATOR_PARTNERS = [
  { name: 'Link Trust', src: partner1 },
  { name: 'Koyo Engineering', src: partner2 },
  { name: 'EXEO Engineering West Japan', src: partner3 },
  { name: 'TechnoPro Construction', src: partner4 },
  { name: 'Nuvoton', src: partner5 },
  { name: 'TechnoPro Design', src: partner6 },
  { name: 'TechnoPro IT', src: partner7 },
  { name: 'ACA Next', src: partner8 },
  { name: 'GMO-Z.com Trust Company', src: partner9 },
  { name: 'Rakus', src: partner10 },
  { name: 'BREXA Technology', src: partner11 },
  { name: 'B-Next Technologies', src: partner12 },
  { name: 'Staff Service Engineering', src: partner13 },
  { name: 'Quest Global', src: partner14 },
  { name: 'Persol Excel HR Partners', src: partner15 },
  { name: 'Meitec Fielders', src: partner16 },
  { name: 'Unlock Design', src: partner17 },
  { name: 'VMO Japan', src: partner18 },
];
