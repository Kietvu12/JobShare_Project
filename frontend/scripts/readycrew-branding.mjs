/** JobShare Business branding — shared by landing + subpage build scripts */
export const BUSINESS_BLUE = '#0576b6';
export const BUSINESS_BLUE_DARK = '#045a8f';
export const BUSINESS_BLUE_HOVER = '#046599';

export const BUSINESS_SERVICES = [
  {
    title: 'ダイレクトスカウト',
    subtitle: '自走型で候補者を探す',
    tags: ['スキル・ポジションでAI検索', '匿名プロフィール閲覧後にunlock', '能動的にチャット・アプローチ'],
    href: '/business/scout',
  },
  {
    title: 'おまかせスカウト',
    subtitle: 'WSが探索・アプローチを支援',
    tags: ['WSがJDに沿って候補者を探索・送付', 'WSが条件交渉・面接調整', '透明な進捗レポート'],
    href: '/business/scout',
  },
  {
    title: '採用ブランディング',
    subtitle: '採用ブランドを構築・発信',
    tags: ['採用LPのプロ設計', 'マルチチャネル求人管理', 'ブランド効果分析レポート'],
    href: '/business/saiyo',
  },
  {
    title: 'HRパートナーネットワーク',
    subtitle: 'ネットワークで採用チャネルを拡大',
    tags: ['全国のCTV HR Partnerにアクセス', 'job別の質の高い推薦', '成果ベースの支払い'],
    href: '/business/candidate-sharing',
  },
];

const ABOUT_BODY = `<p>JobShare Businessは、外国人高度人材の採用に必要な機能とサービスを一元化した、企業向け採用支援プラットフォームです。</p>
<p>AIによる求人票作成、候補者検索・マッチング、スカウト、採用支援、採用ブランディング、採用パートナーネットワークまで、採用活動を一つの画面から進められます。企業ごとの採用課題や社内体制に合わせて、必要な機能・サービスだけを選択して利用できます。</p>
<p>機械・電気電子・IT・建築など、幅広い分野の外国人高度人材に対応。企業ごとの採用ニーズに合った人材をご提案します。</p>
<p><a href="/business/register" target="_top" class="o-btn-bg"><span class="o-btn-bg__text">無料で企業登録する</span></a></p>`;

export function patchBrandColorsInCss(css) {
  return css
    .replace(/#e10029/gi, BUSINESS_BLUE)
    .replace(/#e60012/gi, BUSINESS_BLUE)
    .replace(/#E10029/g, BUSINESS_BLUE)
    .replace(/#E60012/g, BUSINESS_BLUE)
    .replace(/--RC-RED-4:\s*#[a-fA-F0-9]+/g, `--RC-RED-4: ${BUSINESS_BLUE}`);
}

export function applyGlobalTextBranding(html) {
  let out = html;
  out = out.replace(/Ready Crew（レディクル）/g, 'JobShare Business');
  out = out.replace(/ReadyCrew（レディクル）/g, 'JobShare Business');
  out = out.replace(/Ready Crew\(レディクル\)/g, 'JobShare Business');
  out = out.replace(/ReadyCrew\(レディクル\)/g, 'JobShare Business');
  out = out.replace(/Ready Crew /g, 'JobShare Business ');
  out = out.replace(/Ready Crew/g, 'JobShare Business');
  out = out.replace(/ReadyCrew/g, 'JobShare Business');
  out = out.replace(/レディクル/g, 'JobShare Business');
  out = out.replace(/ビジネスマッチング業界NO\.1 \| JobShare Business/g, 'JobShare Business');
  out = out.replace(/ビジネスマッチングのJobShare Business/g, 'JobShare Business');
  out = out.replace(/ビジネスマッチングのレディクルTOP/g, 'JobShare Business TOP');
  out = out.replace(/フロンティア株式会社/g, 'Workstation Co. Ltd.');
  out = out.replace(/FRONTIER Co\. Ltd\./g, 'Workstation Co. Ltd.');
  out = out.replace(/fill="#E10029"/gi, `fill="${BUSINESS_BLUE}"`);
  out = out.replace(/fill="#e10029"/gi, `fill="${BUSINESS_BLUE}"`);
  out = out.replace(/stroke="#E10029"/gi, `stroke="${BUSINESS_BLUE}"`);
  out = out.replace(/stroke="#e10029"/gi, `stroke="${BUSINESS_BLUE}"`);
  out = out.replace(
    /<title>[^<]*JobShare Business[^<]*<\/title>/g,
    (m) => m.replace(/\s*\|\s*JobShare Business\s*$/, ' | JobShare Business'),
  );
  out = out.replace(
    /<p class="footer-top-conversion__main-text">[\s\S]*?<\/p>/g,
    '<p class="footer-top-conversion__main-text">外国人高度人材の採用を、<br>もっと自由に。もっと確実に。</p>',
  );
  out = out.replace(
    /<p class="footer-top-conversion__desc">[\s\S]*?<\/p>/,
    '<p class="footer-top-conversion__desc">JobShare Businessは、外国人エンジニア・高度人材の採用を支援する<br class="u-br-hd u-br-spu">企業向け採用プラットフォームです。お気軽にご相談ください。</p>',
  );
  out = out.replace(/<div class="page-news-visual__caption">[\s\S]*?<\/div>/g, '');
  out = out.replace(
    /(<span class="page-news-visual-marquee__text-en">)JobShare Business/g,
    '$1JobShare',
  );
  out = out.replace(/page-news-visual-marquee__text-en">JobShare Business/g, 'page-news-visual-marquee__text-en">JobShare');
  return out;
}

function buildSubpageServiceCard(service) {
  const tags = service.tags
    .map((tag) => `\t\t\t\t\t<li class="page-proposal-main__tag-text">${tag}</li>`)
    .join('\n');
  return `\t\t\t\t<a class="page-proposal-main__item u-hover-wrapper" href="${service.href}" target="_top">
\t\t\t\t\t<div class="page-proposal-main__item-header">
\t\t\t\t\t\t<div class="page-proposal-main__item-text">
\t\t\t\t\t\t\t<h3 class="page-proposal-main__subject c-text-red-4">${service.title}</h3>
\t\t\t\t\t\t\t<p class="page-proposal-main__subject-jp">${service.subtitle}</p>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t\t<ol class="page-proposal-main__tag">
${tags}
\t\t\t\t\t</ol>
\t\t\t\t\t<div class="page-proposal-main__btn o-btn-line m-btn-line-arrow u-inner-hover-btn-border">
\t\t\t\t\t\t<span class="page-proposal-main__anchor-text">詳しく見る</span>
\t\t\t\t\t\t<div class="m-btn-line-arrow__inner">
\t\t\t\t\t\t\t<span class="m-btn-line-arrow__arrow m-btn-line-arrow__arrow--first u-inner-hover-arrow--first"></span>
\t\t\t\t\t\t\t<span class="m-btn-line-arrow__arrow m-btn-line-arrow__arrow--second u-inner-hover-arrow--second"></span>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</a>`;
}

export function applySubpageContent(html, pageKey) {
  let out = html;

  if (pageKey === 'about') {
    const aboutDesc =
      'JobShare Businessは、外国人高度人材の採用に必要な機能とサービスを一元化した、企業向け採用支援プラットフォームです。';
    out = out.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${aboutDesc}">`);
    out = out.replace(/<meta property="og:title" content="[^"]*">/g, '<meta property="og:title" content="JobShare Businessとは | JobShare Business">');
    out = out.replace(/<meta property="og:description" content="[^"]*">/g, `<meta property="og:description" content="${aboutDesc}">`);
    out = out.replace(/<meta name="twitter:title" content="[^"]*">/g, '<meta name="twitter:title" content="JobShare Businessとは | JobShare Business">');
    out = out.replace(/<meta name="twitter:description" content="[^"]*">/g, `<meta name="twitter:description" content="${aboutDesc}">`);
    out = out.replace(/【夏季休業日のお知らせ】/g, 'JobShare Businessとは');
    out = out.replace(
      /<span class="page-news-article-header__heading-main-text">[^<]*<\/span>/,
      '<span class="page-news-article-header__heading-main-text">JobShare Businessとは</span>',
    );
    out = out.replace(
      /<span class="page-news-article-header__heading-sub-text">[^<]*<\/span>/,
      '<span class="page-news-article-header__heading-sub-text">About</span>',
    );
    out = out.replace(
      /<h1 class="page-news-article-main__heading">[\s\S]*?<\/h1>/,
      '<h1 class="page-news-article-main__heading">JobShare Businessとは</h1>',
    );
    out = out.replace(
      /<h1 class="page-news-article-main__heading page-news-article-main__heading--small">[\s\S]*?<\/h1>/,
      '<h1 class="page-news-article-main__heading page-news-article-main__heading--small">JobShare Businessとは</h1>',
    );
    out = out.replace(/<picture class="page-news-article-main__cover">[\s\S]*?<\/picture>\s*/g, '');
    out = out.replace(
      /<div class="page-news-article-main__body">[\s\S]*?<\/div>/,
      `<div class="page-news-article-main__body">${ABOUT_BODY}</div>`,
    );
    out = out.replace(/<title>[^<]*<\/title>/, '<title>JobShare Businessとは | JobShare Business</title>');
    out = out.replace(
      /class="o-btn-border o-btn-border--gray m-btn-bg-arrow  page-news-article-main__back-btn" href="[^"]*"/,
      'class="o-btn-border o-btn-border--gray m-btn-bg-arrow  page-news-article-main__back-btn" href="/landing/business" target="_top"',
    );
  }

  if (pageKey === 'services') {
    out = out.replace(
      /<span class="page-proposal-visual__page-title-jp l-article-mv__title-jp">[^<]*<\/span>/,
      '<span class="page-proposal-visual__page-title-jp l-article-mv__title-jp">各サービス</span>',
    );
    out = out.replace(
      /<h2 class="page-proposal-visual__catch l-article-mv__catch">[\s\S]*?<\/h2>/,
      '<h2 class="page-proposal-visual__catch l-article-mv__catch">JobShare Businessで選べる<br>4つの採用サービス</h2>',
    );
    out = out.replace(
      /<p class="page-proposal-visual__catch--small l-article-mv__catch-xs">[\s\S]*?<\/p>/,
      '<p class="page-proposal-visual__catch--small l-article-mv__catch-xs">採用課題に合わせて、必要なサービスだけを選択してご利用いただけます。<br>外国人高度人材の採用を、一つのプラットフォームで。</p>',
    );
    out = out.replace(
      /<h2 class="page-proposal-main___main-text o-section-heading">[^<]*<\/h2>/,
      '<h2 class="page-proposal-main___main-text o-section-heading">採用課題に合わせて選べる4つのサービス</h2>',
    );
    const cards = BUSINESS_SERVICES.map(buildSubpageServiceCard).join('\n');
    out = out.replace(
      /<div class="page-proposal-main__body">[\s\S]*?<\/div>(?=\s*<\/div>\s*<\/section>)/,
      `<div class="page-proposal-main__body">\n${cards}\n\t\t\t</div>`,
    );
    out = out.replace(/<title>[^<]*<\/title>/, '<title>各サービス | JobShare Business</title>');
  }

  if (pageKey === 'news') {
    out = out.replace(
      /<meta name="description" content="[^"]*">/,
      '<meta name="description" content="JobShare Businessの最新ニュース・お知らせをお届けします。">',
    );
    out = out.replace(/<title>[^<]*<\/title>/, '<title>ニュース | JobShare Business</title>');
  }

  if (pageKey === 'seminar') {
    out = out.replace(
      /<meta name="description" content="[^"]*">/,
      '<meta name="description" content="JobShare Businessのセミナー・イベント情報をご紹介します。">',
    );
    out = out.replace(/<title>[^<]*<\/title>/, '<title>セミナー・イベント | JobShare Business</title>');
  }

  if (pageKey === 'news-detail') {
    out = out.replace(/<title>[^<]*<\/title>/, '<title>ニュース詳細 | JobShare Business</title>');
  }

  return out;
}

export function getBrandThemeOverridesCss() {
  return `
/* JobShare Business — blue theme (subpages + global) */
:root {
  --RC-RED-4: ${BUSINESS_BLUE} !important;
}
.l-article-mv,
.l-article-mv-plus-lower,
.page-proposal-visual.l-article-mv,
.page-news-visual.l-article-mv-plus-lower {
  background-color: ${BUSINESS_BLUE} !important;
}
.c-text-red-4,
.u-inner-hover-text-red,
.page-news-tab__all--current,
.page-seminar-tab__anchor.is-active {
  color: ${BUSINESS_BLUE} !important;
}
.u-inner-hover-wrapper:hover .u-inner-hover-red-line,
.u-inner-hover-text-red:hover {
  color: ${BUSINESS_BLUE} !important;
}
.o-btn-line,
.m-btn-line-arrow.u-inner-hover-btn-border {
  border-color: ${BUSINESS_BLUE} !important;
  color: ${BUSINESS_BLUE} !important;
}
.page-news-visual__logo,
.m-btn-line-arrow.u-inner-hover-btn-border {
  border-color: ${BUSINESS_BLUE} !important;
  color: ${BUSINESS_BLUE} !important;
}
.page-news-visual__logo {
  display: none !important;
}
.page-proposal-visual__picture,
.page-news-visual__picture {
  display: block !important;
}
.page-proposal-visual__picture-body,
.page-news-visual__picture-body {
  display: block;
  width: 100%;
  height: auto;
  max-height: 520px;
  object-fit: contain;
  object-position: center bottom;
}
.footer-top-conversion__picture {
  display: block !important;
}
.page-news-visual-marquee {
  background-color: ${BUSINESS_BLUE_DARK} !important;
}
.header-sub__tel-icon path {
  fill: ${BUSINESS_BLUE} !important;
}
.m-pagination__item.is-current,
.page-news-pagination .is-active {
  background-color: ${BUSINESS_BLUE} !important;
  border-color: ${BUSINESS_BLUE} !important;
}
`;
}
