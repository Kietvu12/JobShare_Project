import logo1 from '../../../../../../../assets/coporation/1.png';
import logo2 from '../../../../../../../assets/coporation/2.png';
import logo3 from '../../../../../../../assets/coporation/3.png';
import logo4 from '../../../../../../../assets/coporation/4.png';
import logo5 from '../../../../../../../assets/coporation/5.png';
import logo6 from '../../../../../../../assets/coporation/6.png';
import logo7 from '../../../../../../../assets/coporation/7.png';
import logo8 from '../../../../../../../assets/coporation/8.png';

const BASE_LOGOS = [
  { src: logo1, alt: '導入企業ロゴ 1' },
  { src: logo2, alt: '導入企業ロゴ 2' },
  { src: logo3, alt: '導入企業ロゴ 3' },
  { src: logo4, alt: '導入企業ロゴ 4' },
  { src: logo5, alt: '導入企業ロゴ 5' },
  { src: logo6, alt: '導入企業ロゴ 6' },
  { src: logo7, alt: '導入企業ロゴ 7' },
  { src: logo8, alt: '導入企業ロゴ 8' },
];

/** Lặp logo để marquee chạy mượt như bản gốc Ready Crew */
export const CorporationLogos = [...BASE_LOGOS, ...BASE_LOGOS, ...BASE_LOGOS];
