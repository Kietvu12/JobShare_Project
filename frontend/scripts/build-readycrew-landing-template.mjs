/**
 * Ready Crew → JobShare Business landing (frontend/template/jobshare_business_landing/)
 * Chạy: node frontend/scripts/build-readycrew-landing-template.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NAV_ITEMS } from './readycrew-nav-config.mjs';
import {
  BUSINESS_BLUE,
  patchBrandColorsInCss,
  getBrandThemeOverridesCss,
  applyGlobalTextBranding,
} from './readycrew-branding.mjs';
import { patchImagePathsInCss } from './readycrew-assets.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TEMPLATE_BASE = 'Ready Crew（レディクル） _ 無料のビジネスマッチング・コンシェルジュ';
const SRC_HTML = path.join(
  ROOT,
  `src/page/LandingPage/Business/template/template_true/${TEMPLATE_BASE}.html`,
);
const SRC_ASSETS = path.join(
  ROOT,
  `src/page/LandingPage/Business/template/template_true/${TEMPLATE_BASE}_files`,
);
const OUT_DIR = path.join(ROOT, 'template/jobshare_business_landing');
const OUT_ASSETS = path.join(OUT_DIR, 'assets');
const HERO_IMAGE_SRC = path.join(ROOT, 'src/assets/template_business/hero_bg_icon.png');
const HERO_IMAGE_NAME = 'hero_bg_icon.png';
const HERO_BADGE_IMAGE_SRC = path.join(ROOT, 'src/assets/template_business/hero_icon_JP.png');
const HERO_BADGE_IMAGE_NAME = 'hero_icon_JP.png';
const LOGO_SRC = path.join(ROOT, 'src/assets/Login_files/logo-removebg-preview-C0FMBBYQ.png');
const LOGO_NAME = 'jobshare-logo.png';
const PARTNER_ASSETS_DIR = path.join(ROOT, 'public/assets');

const PARTNER_LOGOS = [
  { file: 'partner-1.png', name: 'Link Trust' },
  { file: 'partner-2.png', name: 'Koyo Engineering' },
  { file: 'partner-3.png', name: 'EXEO Engineering' },
  { file: 'partner-4.png', name: 'TechnoPro Construction' },
  { file: 'partner-5.png', name: 'Nuvoton' },
  { file: 'partner-6.png', name: 'TechnoPro Design' },
  { file: 'partner-7.png', name: 'TechnoPro IT' },
  { file: 'partner-8.png', name: 'ACA Next' },
  { file: 'partner-9.png', name: 'GMO-Z.com' },
  { file: 'partner-10.png', name: 'Rakus' },
  { file: 'partner-11.png', name: 'Brexa Technology' },
  { file: 'partner-12.png', name: 'B-Next Technologies' },
  { file: 'partner-13.png', name: 'Staff Service Engineering' },
  { file: 'partner-14.png', name: 'Quest Global' },
  { file: 'partner-15.png', name: 'Persol Excel HR Partners' },
  { file: 'partner-16.png', name: 'Meitec Fielders' },
  { file: 'partner-17.png', name: 'Unlock Design' },
  { file: 'partner-18.png', name: 'VMO Japan' },
];

/** Same 4 services as Bussiness/Homepage.jsx — Japanese copy for landing */
const BUSINESS_SERVICES = [
  {
    iconClass: 'front-page-proposal__icon--first',
    icon: 'front-page-proposal-icon-01.svg',
    title: 'ダイレクトスカウト',
    subtitle: '自走型で候補者を探す',
    tags: [
      'スキル・ポジションでAI検索',
      '匿名プロフィール閲覧後にunlock',
      '能動的にチャット・アプローチ',
    ],
    href: '/business/scout',
  },
  {
    iconClass: 'front-page-proposal__icon--second',
    icon: 'front-page-proposal-icon-02.svg',
    title: 'おまかせスカウト',
    subtitle: 'WSが探索・アプローチを支援',
    tags: [
      'WSがJDに沿って候補者を探索・送付',
      'WSが条件交渉・面接調整',
      '透明な進捗レポート',
    ],
    href: '/business/scout',
  },
  {
    iconClass: 'front-page-proposal__icon--third',
    icon: 'front-page-proposal-icon-03.svg',
    title: '採用ブランディング',
    subtitle: '採用ブランドを構築・発信',
    tags: [
      '採用LPのプロ設計',
      'マルチチャネル求人管理',
      'ブランド効果分析レポート',
    ],
    href: '/business/saiyo',
  },
  {
    iconClass: 'front-page-proposal__icon--fourth',
    icon: 'front-page-proposal-icon-04.svg',
    title: 'HRパートナーネットワーク',
    subtitle: 'ネットワークで採用チャネルを拡大',
    tags: [
      '全国のCTV HR Partnerにアクセス',
      'job別の質の高い推薦',
      '成果ベースの支払い',
    ],
    href: '/business/candidate-sharing',
  },
];

const FAQ_ITEMS = [
  {
    question: '利用開始に費用はかかりますか？',
    answer:
      '企業登録・求人作成・AI求人票作成などの基本機能は無料でご利用いただけます。ご利用いただくサービス（ダイレクトスカウト・採用支援・採用代行など）によって料金体系が異なります。',
  },
  {
    question: '外国人材の採用が初めてでも利用できますか？',
    answer:
      'もちろんです。専任担当が求人内容の整理から採用方法のご提案までサポートしますので、外国人採用が初めての企業様でも安心してご利用いただけます。',
  },
  {
    question: 'ダイレクトスカウトと採用代行の違いは何ですか？',
    answer:
      'ダイレクトスカウトでは、企業が候補者へ直接連絡を行います。<br>採用代行では、Workstationが候補者対応や日程調整などを代行し、採用活動をサポートします。',
  },
  {
    question: '候補者情報は安全に管理されていますか？',
    answer:
      'はい。企業情報・候補者情報は適切な権限管理のもとで管理されており、安全な環境でご利用いただけます。',
  },
  {
    question: '利用途中でサービスを追加・変更できますか？',
    answer:
      'はい。<br>採用状況に応じて、必要なタイミングでサービスを追加・変更していただけます。',
  },
];


const ASSET_PREFIX_OLD = `./${TEMPLATE_BASE}_files/`;
const ASSET_PREFIX_NEW = './assets/';

const SKIP_ASSET_NAMES = new Set([
  'call-chat.html',
  'main.0a101398.js', 'main.0a101398.js.download',
  'ad_status.js', 'ad_status.js.download',
  'f.txt', 'f(1).txt', 'f(2).txt',
  'js', 'js(1)', 'js(2)',
  'gtm.js', 'gtm.js.download',
  'ytag.js', 'ytag.js.download',
  'clarity.js', 'clarity.js.download',
  'fbevents.js', 'fbevents.js.download',
  'bat.js', 'bat.js.download',
  'insight.min.js', 'insight.min.js.download',
  'insight.old.min.js', 'insight.old.min.js.download',
  'analytics.js', 'analytics.js.download',
  'oaiq.min.js', 'oaiq.min.js.download',
  'gwm7ksd.js', 'gwm7ksd.js.download',
  '187012516', '187012516.js', '187012516.js.download',
  '688145445397782',
  'www-widgetapi.js', 'www-widgetapi.js.download',
  'iframe_api',
  'destination',
  'log',
  'adsct', 'adsct(1)', 'adsct(2)', 'adsct(3)',
  'tag.js', 'tag.js.download',
  'm2djmkcgrl',
  'uwt.js', 'uwt.js.download',
  'conversion.js', 'conversion.js.download',
  '0',
  'slick.min(1).js', 'slick.min(1).js.download',
  'jquery.jscroll.min(1).js', 'jquery.jscroll.min(1).js.download',
]);

function shouldSkipAsset(name) {
  const base = name.endsWith('.download') ? name.replace(/\.download$/, '') : name;
  if (SKIP_ASSET_NAMES.has(name) || SKIP_ASSET_NAMES.has(base)) return true;
  if (/^main\.[a-f0-9]+\.js/.test(base)) return true;
  return false;
}

function copyAssetsRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (shouldSkipAsset(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    let name = entry.name;
    if (name.endsWith('.download')) {
      name = name.replace(/\.download$/, '');
    }
    const destPath = path.join(dest, name);
    if (entry.isDirectory()) {
      copyAssetsRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function stripTracking(html) {
  let out = html;
  out = out.replace(/<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/g, '');
  out = out.replace(/<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->/g, '');
  out = out.replace(/<script[^>]*src="[^"]*(?:gtm|ytag|clarity|fbevents|bat\.js|insight|analytics|oaiq|gwm7ksd|187012516|688145445397782|f\.txt|f\(1\)\.txt|adsct|\/log"|assets\/js")[^"]*"[^>]*>\s*<\/script>/gi, '');
  out = out.replace(/<script async="" src="\.\/assets\/analytics\.js"[^>]*><\/script>/gi, '');
  out = out.replace(/<script>\s*window\.jQuery[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script>\s*window\.jQuery\.easing[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script>\s*window\.Slick[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script>\s*window\.jscroll[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script type="text\/javascript" src="\.\/assets\/slick\.min\(1\)\.js"><\/script>/gi, '');
  out = out.replace(/<script type="text\/javascript" src="\.\/assets\/jquery\.jscroll\.min\(1\)\.js"><\/script>/gi, '');
  out = out.replace(/<script type="text\/javascript" id="" charset="">[\s\S]*?oaiq[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<div style="display: none; visibility: hidden;">[\s\S]*?<\/div>/gi, '');
  out = out.replace(/<!-- optemo chat removed for local preview -->/g, '');
  out = out.replace(/<div id="optemo__main"[\s\S]*?<\/iframe><\/div>/gi, '');
  out = out.replace(/<div id="batBeacon[^"]*"[\s\S]*?<\/div>/gi, '');
  out = out.replace(/<pt-experience[\s\S]*?<\/pt-experience>/gi, '');
  out = out.replace(/<noscript>[\s\S]*?yahoo\.co\.jp[\s\S]*?<\/noscript>/gi, '');
  out = out.replace(/<img src="\.\/assets\/adsct[^"]*"[^>]*>/gi, '');
  out = out.replace(/<script type="text\/javascript" src="\.\/assets\/log"[^>]*><\/script>/gi, '');
  return out;
}

function normalizeAssetRefs(html) {
  return html
    .replace(/\.js\.download/g, '.js')
    .replace(/\.css\.download/g, '.css');
}

function applyLocalLinks(html) {
  let out = html.split(ASSET_PREFIX_OLD).join(ASSET_PREFIX_NEW);
  out = out.replace(/https:\/\/readycrew\.jp\/inquiry_docs[^"'>\s]*/g, '/business/register');
  out = out.replace(/https:\/\/readycrew\.jp\/contact[^"'>\s]*/g, '/business/login');
  out = out.replace(/https:\/\/readycrew\.jp\/sl_cp[^"'>\s]*/g, '/business/register');
  out = out.replace(/https:\/\/readycrew\.jp\/?(?=["'>\s])/g, '/landing/business');
  out = out.replace(/https:\/\/readycrew\.jp\/[^"'>\s]*/g, '#');
  out = out.replace(/https:\/\/frontier-gr\.jp[^"'>\s]*/g, '#');
  out = out.replace(/https:\/\/twitter\.com[^"'>\s]*/g, '#');
  out = out.replace(/https:\/\/www\.instagram\.com[^"'>\s]*/g, '#');
  out = out.replace(/https:\/\/www\.facebook\.com[^"'>\s]*/g, '#');
  return out;
}

function injectAuthButtons(html) {
  let out = html;
  out = out.replace(
    /<span class="o-btn-bg__text">(?:資料請求|Đăng ký|資料ダウンロード)<\/span>/g,
    '<span class="o-btn-bg__text">企業登録</span>',
  );
  out = out.replace(
    /<span class="o-btn-border__text">(?:お問い合わせ|Đăng nhập)<\/span>/g,
    '<span class="o-btn-border__text">ログイン</span>',
  );
  out = out.replace(
    /<span class="common-nav__btn-text o-btn-bg__text">資料ダウンロード<\/span>/g,
    '<span class="common-nav__btn-text o-btn-bg__text">企業登録</span>',
  );
  out = out.replace(
    /<span class="common-nav__btn-text o-btn-border__text">お問い合わせ<\/span>/g,
    '<span class="common-nav__btn-text o-btn-border__text">ログイン</span>',
  );
  out = out.replace(
    /href="(\/business\/(?:register|login)[^"]*)"/g,
    'href="$1" target="_top"',
  );
  return out;
}

function buildHeaderNavList() {
  return NAV_ITEMS.map(
    (item) =>
      `\t\t\t\t\t\t\t\t\t<li class="header-nav__item">
\t\t\t\t\t\t\t\t\t\t<a href="${item.href}" class="header-nav__anchor"${item.headerTarget}>${item.jp}</a>
\t\t\t\t\t\t\t\t\t</li>`,
  ).join('\n');
}

function buildSitemapItem(item) {
  if (!item) {
    return `\t\t\t<li class="common-nav-sitemap__item common-nav-sitemap__item--spacer" aria-hidden="true"></li>`;
  }
  return `\t\t\t<li class="common-nav-sitemap__item">
\t\t\t\t\t<a href="${item.href}" class="common-nav-sitemap__anchor"${item.headerTarget}>
\t\t\t\t\t\t<span class="common-nav-sitemap__jp">${item.jp}</span>
\t\t\t\t\t\t<span class="common-nav-sitemap__en">${item.en}</span>
\t\t\t\t\t</a>
\t\t\t\t</li>`;
}

function buildSitemapList() {
  return NAV_ITEMS.map((item) => buildSitemapItem(item)).join('\n');
}

/** Footer sitemap — 2 rows aligned with top nav grid positions */
function buildFooterSitemapList() {
  const slots = [
    NAV_ITEMS[0],
    null,
    NAV_ITEMS[1],
    null,
    NAV_ITEMS[2],
    null,
    NAV_ITEMS[3],
    NAV_ITEMS[4],
  ];
  return slots.map((item) => buildSitemapItem(item)).join('\n');
}

function applyNavbar(html) {
  let out = html.replace(
    /<ol class="header-nav__list">[\s\S]*?<\/ol>/,
    `<ol class="header-nav__list">\n${buildHeaderNavList()}\n\t\t\t\t\t\t\t\t</ol>`,
  );
  out = out.replace(
    /<ol class="common-nav-sitemap__list-ham">[\s\S]*?<\/ol>/,
    `<ol class="common-nav-sitemap__list-ham">\n${buildSitemapList()}\n\t\t\t</ol>`,
  );
  out = out.replace(
    /<ol class="common-nav-sitemap__list">[\s\S]*?<\/ol>/,
    `<ol class="common-nav-sitemap__list common-nav-sitemap__list--footer">\n${buildFooterSitemapList()}\n\t\t</ol>`,
  );
  out = out.replace(/hd_logo@2x\.png/g, LOGO_NAME);
  out = out.replace(
    /alt="(?:ビジネスマッチングの)?Ready Crew[^"]*"/g,
    'alt="JobShare Business"',
  );
  out = out.replace(/alt="Ready Crew"/g, 'alt="JobShare Business"');
  out = out.replace(
    /<a href="#" class="common-nav-row__anchor o-anchor-text">[\s\S]*?<\/a>/g,
    '',
  );
  return out;
}

function rebuildHeadScripts(html) {
  const essentialScripts = [
    './assets/jquery.min.js',
    './assets/jquery.easing.min.js',
    './assets/slick.min.js',
    './assets/jquery.jscroll.min.js',
    './assets/picturefill.min.js',
    './assets/imagesloaded.pkgd.min.js',
    './assets/jquery.waypoints.min.js',
    './assets/jquery.matchHeight-min.js',
    './assets/jquery.counterup-2.0.js',
    './assets/barba.min.js',
    './assets/smooth-scroll.polyfills.min.js',
    './assets/swiper-bundle.min.js',
    './assets/jquery.marquee.min.js',
    './assets/simplebar.min.js',
    './assets/vivus.min.js',
    './assets/clipboard.min.js',
    './assets/app.js',
    './assets/front-page.js',
  ];
  const scriptTags = essentialScripts.map((src) => `<script src="${src}"></script>`).join('\n\t');
  return html.replace(
    /<script[^>]*src="\.\/assets\/jquery\.min\.js"[^>]*>\s*<\/script>[\s\S]*?<script[^>]*src="\.\/assets\/front-page\.js"[^>]*>\s*<\/script>/i,
    scriptTags,
  );
}

function injectBootstrap(html) {
  const boot = '<script src="./assets/jobshare-bootstrap.js"></script>';
  if (html.includes('jobshare-bootstrap.js')) return html;
  return html.replace('</body>', `\t${boot}\n</body>`);
}

function injectOverrides(html) {
  const link = '<link rel="stylesheet" href="./assets/jobshare-overrides.css">';
  if (html.includes('jobshare-overrides.css')) return html;
  return html.replace('</head>', `\t${link}\n</head>`);
}

function hideLoadingScreen(html) {
  return html.replace(/class="js-loading"/g, 'class="js-loading" style="display:none;"');
}

/** JobShare Business — hero section copy (JobShare branding) */
function applyHeroSection(html) {
  let out = html.replace(
    /<p class="front-page-visual__sub-text">[\s\S]*?<\/p>/,
    '<p class="front-page-visual__sub-text">外国人高度人材採用プラットフォーム</p>',
  );
  out = out.replace(
    /<h2 class="front-page-visual__main-text[^"]*">[\s\S]*?<\/h2>/,
    `<h2 class="front-page-visual__main-text js-hero-headline">
\t\t\t\t\t\t<span class="js-hero-headline__text">外国人高度人材の採用を、<br>もっと自由に。もっと確実に。</span>
\t\t\t\t\t</h2>`,
  );
  out = out.replace(
    /<p class="front-page-visual__desc[^"]*">[\s\S]*?<\/p>/,
    '<p class="front-page-visual__desc js-hero-desc">JobShare Businessは、外国人エンジニア・高度人材の採用を支援する企業向け採用プラットフォームです。求人作成、候補者検索、スカウト、採用代行、採用広報、採用パートナー連携まで、採用課題に合った方法を選択できます。</p>',
  );
  out = out.replace(
    /<div class="fpv_btn_group">[\s\S]*?<\/div>/,
    `<div class="fpv_btn_group">
\t\t\t\t\t\t<a class="fpv_btn_group_download o-btn-bg o-btn-bg--hover-border" href="/business/register" target="_top"><span class="front-page-visual__btn-text o-btn-bg__text">サービス資料を<br>ダウンロード</span></a>
\t\t\t\t\t\t<a class="fpv_btn_group_contact_rc o-btn-bg o-btn-bg--white o-btn-bg--hover-border" href="/business/register" target="_top"><span class="front-page-visual__btn-text o-btn-bg__text">無料で<br>企業登録する</span></a>
\t\t\t\t\t\t<a class="fpv_btn_group__contact_sl o-btn-bg o-btn-bg--white o-btn-bg--hover-border" href="/business/login" target="_top"><span class="front-page-visual__btn-text o-btn-bg__text o-btn-bg__text--blue">採用について<br>相談する</span></a>
\t\t\t\t\t</div>`,
  );
  out = out.replace(
    /<div class="front-page-visual__picture-area[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<div class="front-page-visual__lower">/,
    `<div class="front-page-visual__picture-area js-visual-picture-area js-hero-visual" style="height: auto;">
\t\t\t\t\t\t<picture class="front-page-visual__picture">
\t\t\t\t\t\t\t<img class="front-page-visual__picture-body js-hero-visual__img" src="./assets/${HERO_IMAGE_NAME}" alt="JobShare Business 採用プラットフォーム">
\t\t\t\t\t\t</picture>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t\t<div class="front-page-visual__lower">`,
  );
  return out;
}

function applyHeroBackground(html) {
  return html.replace(
    /<div class="front-page-visual__upper"[^>]*>/,
    `<div class="front-page-visual__upper" style="background-color: ${BUSINESS_BLUE}; background-image: none;">`,
  );
}

function applyIndexMeta(html) {
  const desc =
    'JobShare Businessは、外国人エンジニア・高度人材の採用を支援する企業向け採用プラットフォームです。';
  let out = html;
  out = out.replace(
    /<title>[^<]*<\/title>/,
    '<title>JobShare Business | 外国人高度人材採用プラットフォーム</title>',
  );
  out = out.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${desc}">`,
  );
  out = out.replace(
    /<meta property="og:title" content="[^"]*">/g,
    '<meta property="og:title" content="JobShare Business | 外国人高度人材採用プラットフォーム">',
  );
  out = out.replace(
    /<meta property="og:description" content="[^"]*">/g,
    `<meta property="og:description" content="${desc}">`,
  );
  out = out.replace(
    /<meta property="og:site_name" content="[^"]*">/g,
    '<meta property="og:site_name" content="JobShare Business">',
  );
  out = out.replace(
    /<meta name="twitter:title" content="[^"]*">/g,
    '<meta name="twitter:title" content="JobShare Business | 外国人高度人材採用プラットフォーム">',
  );
  out = out.replace(
    /<meta name="twitter:description" content="[^"]*">/g,
    `<meta name="twitter:description" content="${desc}">`,
  );
  return out;
}

function patchHeroBackgroundInCss() {
  const stylePath = path.join(OUT_ASSETS, 'style.css');
  let css = fs.readFileSync(stylePath, 'utf8');
  css = css.replace(
    /(\.front-page-visual__upper\s*\{[^}]*?)background-color:\s*#e10029;/,
    `$1background-color: ${BUSINESS_BLUE};`,
  );
  css = css.replace(
    /(\.front-page-visual__upper\s*\{[^}]*?)background-image:[^;]+;/,
    '$1background-image: none;',
  );
  css = css.replace(
    /(@media \(max-width: 767px\)\s*\{\s*\.front-page-visual__upper\s*\{[^}]*?)background-image:[^;]+;/,
    '$1background-image: none;',
  );
  css = patchBrandColorsInCss(css);
  css = patchImagePathsInCss(css, OUT_ASSETS);
  fs.writeFileSync(stylePath, css, 'utf8');
}

/** JobShare partner logo marquee — same assets/layout as Candidate Home.jsx */
function buildPartnerLogoCard(partner) {
  return `<div class="partner-logo-card">
\t\t\t\t\t<img class="partner-logo-image" src="./assets/${partner.file}" alt="${partner.name}" title="${partner.name}" loading="lazy" decoding="async">
\t\t\t\t</div>`;
}

function buildPartnerMarqueeRow(partners, reverse = false) {
  const cards = [...partners, ...partners]
    .map((partner) => buildPartnerLogoCard(partner))
    .join('\n\t\t\t\t\t');
  const trackStyle = reverse ? ' style="animation-direction: reverse; animation-duration: 36s;"' : '';
  return `<div class="partner-marquee">
\t\t\t\t<div class="partner-marquee-fade partner-marquee-fade--left"></div>
\t\t\t\t<div class="partner-marquee-fade partner-marquee-fade--right"></div>
\t\t\t\t<div class="partner-marquee-track"${trackStyle}>
\t\t\t\t\t${cards}
\t\t\t\t</div>
\t\t\t</div>`;
}

function applyPartnerMarqueeSection(html) {
  const row1 = PARTNER_LOGOS.slice(0, 9);
  const row2 = PARTNER_LOGOS.slice(9);
  const cleanUpper = `<div class="front-page-corporation__upper l-wrapper--large-on-bg">
\t\t\t<div class="front-page-corporation__contents front-page-corporation__contents--partners">
\t\t\t\t<div class="partner-marquee-group">
\t\t\t\t\t${buildPartnerMarqueeRow(row1)}
\t\t\t\t\t${buildPartnerMarqueeRow(row2, true)}
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>`;

  return html.replace(
    /<div class="front-page-corporation__upper l-wrapper--large-on-bg">[\s\S]*?<div class="front-page-corporation__lower">/,
    `${cleanUpper}
\t\t<div class="front-page-corporation__lower">`,
  );
}

function copyPartnerAssets() {
  for (const partner of PARTNER_LOGOS) {
    const src = path.join(PARTNER_ASSETS_DIR, partner.file);
    if (!fs.existsSync(src)) {
      console.warn('Partner asset missing:', src);
      continue;
    }
    fs.copyFileSync(src, path.join(OUT_ASSETS, partner.file));
  }
}

/** Corporation section lower headline — JobShare Business copy */
function applyCorporationSectionText(html) {
  return html.replace(
    /<h2 class="front-page-corporation__main-text">[\s\S]*?<\/h2>/,
    `<h2 class="front-page-corporation__main-text">機械・電気電子・IT・建築など、幅広い分野の外国人高度人材に対応。<br>企業ごとの採用ニーズに合った人材をご提案します。</h2>`,
  );
}

/** Appeal section — JobShare Business copy */
function applyAppealSection(html) {
  let out = html;
  out = out.replace(
    /<h2 class="front-page-appeal__main-text">[\s\S]*?<\/h2>/,
    '<h2 class="front-page-appeal__main-text"><span class="c-text-red-4">外国人材採用に必要なすべてを、<br>ひとつのプラットフォームに。</span></h2>',
  );
  out = out.replace(
    /<p class="front-page-appeal__desc">[\s\S]*?<\/p>/,
    '<p class="front-page-appeal__desc">JobShare Businessは、外国人高度人材の採用に必要な機能とサービスを一元化した、企業向け採用支援プラットフォームです。AIによる求人票作成、候補者検索・マッチング、スカウト、採用支援、採用ブランディング、採用パートナーネットワークまで、採用活動を一つの画面から進められます。企業ごとの採用課題や社内体制に合わせて、必要な機能・サービスだけを選択して利用できます。</p>',
  );
  out = out.replace(
    /<a href="[^"]*" target="_top" class="button">\s*外注先を無料で相談する\s*<span class="arrow"><\/span>\s*<\/a>/,
    `<a href="/business/register" target="_top" class="button">
\t\t\t\t\t外国人材採用について相談する
\t\t\t\t\t<span class="arrow"></span>
\t\t\t\t</a>`,
  );
  return out;
}

function buildProposalServiceCard(service) {
  const tags = service.tags
    .map((tag) => `\t\t\t\t\t<li class="front-page-proposal__tag-text">${tag}</li>`)
    .join('\n');
  return `\t\t\t\t<a class="front-page-proposal__item" href="${service.href}" target="_top">
\t\t\t\t\t<div class="front-page-proposal__item-header">
\t\t\t\t\t\t<div class="front-page-proposal__icon ${service.iconClass}"><img src="./assets/${service.icon}" alt=""></div>
\t\t\t\t\t\t<div class="front-page-proposal__item-text">
\t\t\t\t\t\t\t<h3 class="front-page-proposal__subject c-text-red-4">${service.title}</h3>
\t\t\t\t\t\t\t<p class="front-page-proposal__subject-jp">${service.subtitle}</p>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t\t<ol class="front-page-proposal__tag">
${tags}
\t\t\t\t\t</ol>
\t\t\t\t</a>`;
}

/** Proposal section — 4 JobShare Business services (Homepage.jsx) */
function applyProposalSection(html) {
  let out = html;
  const cards = BUSINESS_SERVICES.map(buildProposalServiceCard).join('\n');

  out = out.replace(
    /<h2 class="front-page-proposal__main-text">[\s\S]*?<\/h2>/,
    '<h2 class="front-page-proposal__main-text">採用課題に合わせて選べる<br><span class="c-text-red-4">4つのサービス</span></h2>',
  );
  out = out.replace(
    /<a class="front-page-proposal__btn o-btn-border--gray m-btn-bg-arrow" href="#">[\s\S]*?<\/a>/,
    `<a class="front-page-proposal__btn o-btn-border--gray m-btn-bg-arrow" href="/business/register" target="_top">
\t\t\t\t<span class="front-page-news__anchor-text m-btn-bg-arrow__text">サービス一覧を見る</span>
\t\t\t\t<div class="m-btn-bg-arrow__inner"><span class="m-btn-bg-arrow__arrow m-btn-bg-arrow__arrow--first"></span><span class="m-btn-bg-arrow__arrow m-btn-bg-arrow__arrow--second"></span></div>
\t\t\t</a>`,
  );
  out = out.replace(
    /<div class="front-page-proposal__body">[\s\S]*?<\/div>\s*<\/div>\s*\n\t\t<!-- <div class="front-page-proposal-modal/,
    `<div class="front-page-proposal__body front-page-proposal__body--four">
${cards}
\t\t\t</div>
\t\t</div>
\t\t<!-- <div class="front-page-proposal-modal`,
  );
  return out;
}

const REASON_CTA_BTN = `<div class="front-page-reason__btn"><a class="front-page-reason__contact-subject o-btn-bg o-btn-bg--red" href="/business/register" target="_top"><p class="front-page-reason__contact-subject-text o-btn-bg__text">無料相談する</p></a></div>`;

/** Reason section — JobShare Businessが選ばれる理由 */
function applyReasonSection(html) {
  const reasonBody = `\t\t\t<div class="front-page-reason__body">
\t\t\t\t<div class="front-page-reason__item">
\t\t\t\t\t<a id="price" class="o-anchor-target js-anchor-target"></a>
\t\t\t\t\t<p class="front-page-reason__num">01</p>
\t\t\t\t\t<div class="front-page-reason__text-area u-border-bottom-absolute">
\t\t\t\t\t\t<h3 class="front-page-reason__subject"><span class="c-text-red-4">採用課題に合わせて</span><br>
\t\t\t\t\t\t\t最適な採用方法を自由に選べる</h3>
\t\t\t\t\t\t<p class="front-page-reason__desc">必要なサービスだけを組み合わせて、自社に合った採用体制を実現。JobShare Businessでは、企業ごとの採用課題や社内体制に合わせて、複数の採用支援サービスを一つのプラットフォーム上でご利用いただけます。自社で積極的に採用を進めたい企業から、採用業務を専門スタッフへ任せたい企業まで、目的に応じた最適な採用方法を柔軟に選択できます。必要なサービスだけを利用できるため、無駄なコストを抑えながら、効率的な採用活動を実現します。</p>
\t\t\t\t\t\t${REASON_CTA_BTN}
\t\t\t\t\t</div>
\t\t\t\t\t<div class="front-page-reason__picture"><img src="./assets/front-page-reason-01.png" loading="lazy"></div>
\t\t\t\t</div>
\t\t\t\t<div class="front-page-reason__item">
\t\t\t\t\t<p class="front-page-reason__num">02</p>
\t\t\t\t\t<div class="front-page-reason__text-area u-border-bottom-absolute">
\t\t\t\t\t\t<h3 class="front-page-reason__subject"><span class="c-text-red-4">AIが採用業務をサポート</span><br>
\t\t\t\t\t\t\t採用担当者の工数を大幅削減</h3>
\t\t\t\t\t\t<p class="front-page-reason__desc">求人票作成から候補者選定まで、AIが採用業務をサポート。AIチャットを活用することで、求人票の作成や内容のブラッシュアップを短時間で行えます。さらに、候補者とのマッチングや採用ページの作成支援など、採用活動全体をAIがサポートします。採用担当者は、応募者対応や面接など本来注力すべき業務に集中できます。</p>
\t\t\t\t\t\t${REASON_CTA_BTN}
\t\t\t\t\t</div>
\t\t\t\t\t<div class="front-page-reason__picture"><img src="./assets/front-page-reason-02.png" loading="lazy"></div>
\t\t\t\t</div>
\t\t\t\t<div class="front-page-reason__item">
\t\t\t\t\t<p class="front-page-reason__num">03</p>
\t\t\t\t\t<div class="front-page-reason__text-area">
\t\t\t\t\t\t<h3 class="front-page-reason__subject"><span class="c-text-red-4">専任スタッフが伴走</span><br>
\t\t\t\t\t\t\t安心して採用を進められる</h3>
\t\t\t\t\t\t<p class="front-page-reason__desc">導入から採用成功まで、Workstationが継続してサポート。JobShare Businessでは、専任スタッフが企業ごとの採用状況に合わせて継続的にサポートします。チャットによる迅速な対応や、採用状況の共有、候補者対応まで一貫して支援します。また、企業情報・候補者情報は安全に管理され、安心してご利用いただける環境を提供しています。</p>
\t\t\t\t\t\t${REASON_CTA_BTN}
\t\t\t\t\t</div>
\t\t\t\t\t<div class="front-page-reason__picture"><img src="./assets/front-page-reason-03.png" loading="lazy"></div>
\t\t\t\t</div>
\t\t\t</div>`;

  let out = html;
  out = out.replace(
    /<h2 class="front-page-reason__main-text o-section-heading">[\s\S]*?<\/h2>/,
    '<h2 class="front-page-reason__main-text o-section-heading">JobShare Businessが<span class="c-text-red-4">選ばれる理由</span></h2>',
  );
  out = out.replace(
    /<div class="front-page-reason__body">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>\s*<div class="js-loading-lazy-contents"/,
    `${reasonBody}
\t\t</div>
\t</section>
\t<div class="js-loading-lazy-contents"`,
  );
  return out;
}

/** Flow section — JobShare Businessのご利用の流れ */
function applyFlowSection(html) {
  const flowSection = `\t\t<section class="front-page-flow l-section">
\t\t\t<div class="front-page-flow__target js-scroll-target" id="flow"></div>
\t\t\t<div class="front-page-flow__contents l-contents">
\t\t\t\t<header class="front-page-flow__header m-section-header">
\t\t\t\t\t<h2 class="o-section-heading">JobShare Businessのご利用の流れ | 企業登録・求人作成 → サービス選択 → 採用活動開始</h2>
\t\t\t\t</header>
\t\t\t\t<div class="front-page-flow__body">
\t\t\t\t\t<div class="front-page-flow__one-column">
\t\t\t\t\t\t<div class="front-page-flow__item">
\t\t\t\t\t\t\t<div class="front-page-flow__picture">
\t\t\t\t\t\t\t\t<div class="front-page-flow__picture-body"><img src="./assets/front-page-flow-picture-01.svg" alt="無料企業登録"></div>
\t\t\t\t\t\t\t\t<div class="front-page-flow__arrow"></div>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<div class="front-page-flow__text-area">
\t\t\t\t\t\t\t\t<p class="front-page-flow__main-text-en">STEP 1</p>
\t\t\t\t\t\t\t\t<h3 class="front-page-flow__main-text-jp">無料企業登録｜まずは企業情報の登録から</h3>
\t\t\t\t\t\t\t\t<p class="front-page-flow__desc">JobShare Businessの企業登録は無料です。基本的な企業情報と採用担当者情報をご入力いただくだけで、すぐに利用を開始できます。<br><br>外国人材の採用が初めての場合や、募集条件がまだ決まっていない場合は、Workstationへ採用に関するご相談をお送りいただけます。</p>
\t\t\t\t\t\t\t\t<div class="front-page-flow__contact">
\t\t\t\t\t\t\t\t\t<a class="front-page-flow__contact-subject o-btn-bg o-btn-bg--red" href="/business/register" target="_top">
\t\t\t\t\t\t\t\t\t\t<p class="front-page-flow__contact-subject-text o-btn-bg__text">無料相談はこちら!</p>
\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div class="front-page-flow__item">
\t\t\t\t\t\t\t<div class="front-page-flow__picture">
\t\t\t\t\t\t\t\t<div class="front-page-flow__picture-body"><img src="./assets/front-page-flow-picture-02.svg" alt="求人作成"></div>
\t\t\t\t\t\t\t\t<div class="front-page-flow__arrow"></div>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<div class="front-page-flow__text-area">
\t\t\t\t\t\t\t\t<p class="front-page-flow__main-text-en">STEP 2</p>
\t\t\t\t\t\t\t\t<h3 class="front-page-flow__main-text-jp">求人作成｜AIと対話しながら募集要件を整理</h3>
\t\t\t\t\t\t\t\t<p class="front-page-flow__desc">職種、仕事内容、勤務地、給与、必要な経験・スキル、日本語レベルなどを入力すると、AIが求人票の作成をサポートします。<br>既存の求人票がある場合は、ファイルをアップロードすることで、内容の整理や改善も可能です。作成した求人をもとに、条件に合う匿名候補者も確認できます。</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div class="front-page-flow__item">
\t\t\t\t\t\t\t<div class="front-page-flow__picture">
\t\t\t\t\t\t\t\t<div class="front-page-flow__picture-body"><img src="./assets/front-page-flow-picture-03.svg" alt="サービス選択"></div>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<div class="front-page-flow__text-area">
\t\t\t\t\t\t\t\t<p class="front-page-flow__main-text-en">STEP 3</p>
\t\t\t\t\t\t\t\t<h3 class="front-page-flow__main-text-jp">サービス選択・採用開始｜自社に合った方法で候補者へアプローチ</h3>
\t\t\t\t\t\t\t\t<p class="front-page-flow__desc">求人作成後、自社の採用課題や体制に合わせて、必要なサービスを選択します。<br>企業が候補者を検索して直接連絡する方法、Workstationへ候補者対応を依頼する方法、採用ページによる情報発信、採用パートナーネットワークの活用など、複数の方法から選択できます。<br><br>候補者の推薦、メッセージ、選考状況、関連する依頼内容は、JobShare Business上で一元管理できます。Workstationへの相談やサービス依頼も、管理画面からいつでも送信できます。</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="front-page-flow__lower">
\t\t\t\t\t\t<p class="front-page-flow__lower-text m-element-side-space">外国人材採用を、JobShare Businessで始めませんか？</p>
\t\t\t\t\t\t<a class="front-page-flow__contact-btn o-btn-bg o-btn-bg--white o-btn-bg--hover-border m-element-side-space" href="/business/register" target="_top"><span class="front-page-flow__anchor-text o-btn-bg__text">無料で<br class="br-sp">企業登録する</span></a>
\t\t\t\t\t\t<a class="front-page-flow__download-btn o-btn-bg o-btn-bg--hover-border m-element-side-space" href="/business/register" target="_top"><span class="front-page-flow__anchor-text o-btn-bg__text">サービス資料を<br class="br-sp">ダウンロード</span></a>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t</section>`;

  return html.replace(
    /<section class="front-page-flow l-section">[\s\S]*?<\/section>\s*\n\s*<section class="front-page-news/,
    `${flowSection}

\t\t<section class="front-page-news`,
  );
}

function buildFaqItem(question, answer) {
  return `
            <div class="front-page-faq__item">
              <div class="front-page-faq__question">
                <p class="front-page-faq__icon">Q.</p>
                <h3 class="front-page-faq__subject">
                  <span class="u-inner-hover-line">${question}</span>
                </h3>
              </div>

              <div class="front-page-faq__answer">
                <div class="front-page-faq__anchor">
                  <p class="front-page-faq__answer-desc">
                    ${answer}
                  </p>
                </div>
              </div>
            </div>`;
}

/** FAQ section — JobShare Business */
function applyFaqSection(html) {
  const faqItems = FAQ_ITEMS.map(({ question, answer }) => buildFaqItem(question, answer)).join('\n');
  const faqSection = `\t\t<section class="front-page-faq l-section">
  <div class="front-page-faq__target js-scroll-target" id="faq"></div>
  <div class="front-page-faq__wrapper l-wrapper-faq--xlarge-on-bg l-wrapper--xlarge-on-bg">
    <div class="front-page-faq__contents l-contents l-contents--sp-full">
      <header class="front-page-faq__header m-section-header--large">
        <h2 class="o-section-heading">よくあるご質問｜JobShare Business</h2>
      </header>

      <div class="front-page-faq__body">
${faqItems}

              </div>
    </div>
  </div>
</section>`;

  return html.replace(/<section class="front-page-faq l-section">[\s\S]*?<\/section>/, faqSection);
}

function stripMarqueeInlineStyles(html) {
  return html.replace(/<style>@keyframes marqueeAnimation-[\s\S]*?<\/style>/g, '');
}

/** Reset appeal section background watermark marquee (JobShare branding) */
function sanitizeAppealMarqueeSection(html) {
  const cleanMarquee = `<div class="front-page-appeal-marquee">
\t\t<div class="front-page-appeal-marquee__body js-logo-marquee">
\t\t\t<p class="front-page-appeal-marquee__text"><span class="front-page-appeal-marquee__text-en">JobShare</span><span class="front-page-appeal-marquee__text-jp">Business</span></p>
\t\t</div>
\t\t</div>
\t\t`;

  return html.replace(
    /<div class="front-page-appeal-marquee">[\s\S]*?(?=<\/section>\s*<section class="front-page-proposal)/,
    cleanMarquee,
  );
}

/** JobShare Business — hero achievement badges */
function applyHeroBadgeSection(html) {
  return html.replace(
    /<div class="front-page-visual__badge-group">\s*<img[^>]*>\s*<\/div>\s*<ol class="front-page-visual__caption-list">[\s\S]*?<\/ol>/,
    `<div class="front-page-visual__badge-group js-hero-badge-group">
\t\t\t\t\t<img class="js-hero-badge__img" src="./assets/${HERO_BADGE_IMAGE_NAME}" alt="技術系外国人人材データベース40,000+ HRパートナーネットワーク500+ AI外国人採用プラットフォーム東南アジア初">
\t\t\t\t</div>`,
  );
}

function build() {
  if (!fs.existsSync(SRC_HTML)) {
    console.error('Source HTML not found:', SRC_HTML);
    process.exit(1);
  }
  if (!fs.existsSync(SRC_ASSETS)) {
    console.error('Source assets not found:', SRC_ASSETS);
    process.exit(1);
  }

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  copyAssetsRecursive(SRC_ASSETS, OUT_ASSETS);

  if (!fs.existsSync(HERO_IMAGE_SRC)) {
    console.error('Hero image not found:', HERO_IMAGE_SRC);
    process.exit(1);
  }
  fs.copyFileSync(HERO_IMAGE_SRC, path.join(OUT_ASSETS, HERO_IMAGE_NAME));

  if (!fs.existsSync(HERO_BADGE_IMAGE_SRC)) {
    console.error('Hero badge image not found:', HERO_BADGE_IMAGE_SRC);
    process.exit(1);
  }
  fs.copyFileSync(HERO_BADGE_IMAGE_SRC, path.join(OUT_ASSETS, HERO_BADGE_IMAGE_NAME));

  if (!fs.existsSync(LOGO_SRC)) {
    console.error('JobShare logo not found:', LOGO_SRC);
    process.exit(1);
  }
  fs.copyFileSync(LOGO_SRC, path.join(OUT_ASSETS, LOGO_NAME));
  copyPartnerAssets();

  patchHeroBackgroundInCss();

  const bootstrapJs = `/* Ready Crew template — iframe bootstrap */
(function () {
  var LANDING_MAP = {
    'index.html': '/landing/business',
    'pages/about.html': '/landing/business/about',
    'pages/services.html': '/landing/business/services',
    'pages/seminar.html': '/landing/business/seminar',
    'pages/news.html': '/landing/business/news',
    'pages/news-detail.html': '/landing/business/news/sample',
  };
  var TEMPLATE_BASE = '/template/jobshare_business_landing/';

  function resolveLandingHref(href) {
    if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) {
      return null;
    }
    if (href.indexOf('/landing/business') === 0 || href.indexOf('/business/') === 0) {
      return null;
    }
    if (href.indexOf('http://') === 0 || href.indexOf('https://') === 0) {
      return null;
    }
    if (href.indexOf(TEMPLATE_BASE) === 0) {
      var rest = href.slice(TEMPLATE_BASE.length);
      return LANDING_MAP[rest] || '/landing/business';
    }
    if (href.indexOf('pages/') === 0) {
      return LANDING_MAP[href] || null;
    }
    if (href === './' || href === '../index.html' || href === 'index.html') {
      return '/landing/business';
    }
    return null;
  }

  document.addEventListener(
    'click',
    function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var targetAttr = (a.getAttribute('target') || '').toLowerCase();
      if (targetAttr !== '_top' && targetAttr !== '_parent') return;
      var landing = resolveLandingHref(a.getAttribute('href'));
      if (!landing) return;
      e.preventDefault();
      window.top.location.href = landing;
    },
    true,
  );

  var initialized = false;
  function init() {
    if (initialized) return;
    initialized = true;
    var loading = document.querySelector('.js-loading');
    if (loading) loading.style.display = 'none';
    document.body.classList.add('is-loaded');
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
  window.addEventListener('load', init, { once: true });
})();
`;
  fs.writeFileSync(path.join(OUT_ASSETS, 'jobshare-bootstrap.js'), bootstrapJs, 'utf8');

  const overridesCss = `/* Ready Crew — iframe / JobShare auth CTAs */
html, body {
  overflow-x: hidden;
  font-family: "Roboto", sans-serif;
}
.front-page-visual__upper {
  background-color: ${BUSINESS_BLUE} !important;
  background-image: none !important;
}
@media (max-width: 767px) {
  .front-page-visual__upper {
    background-image: none !important;
  }
}
.front-page-visual__sub-text {
  letter-spacing: 0.02em;
}
.front-page-visual__main-text.js-hero-headline {
  display: block;
  margin: 0 0 12px;
}
.js-hero-headline__text {
  display: block;
  font-family: "Roboto", sans-serif;
  font-weight: 900;
  color: #fff;
  font-size: 52px;
  line-height: 1.32;
  font-feature-settings: "palt";
  letter-spacing: 0.02em;
}
.front-page-visual__desc.js-hero-desc {
  color: #fff !important;
  font-weight: 500;
  font-size: 15px;
  line-height: 1.75;
  max-width: 560px;
  margin: 12px 0 24px;
  opacity: 0.96;
}
@media (max-width: 1279px) {
  .js-hero-headline__text {
    font-size: 42px;
  }
}
@media (max-width: 767px) {
  .front-page-visual__sub-text {
    font-size: 15px;
    line-height: 1.45;
  }
  .js-hero-headline__text {
    font-size: 28px;
    line-height: 1.38;
  }
  .front-page-visual__desc.js-hero-desc {
    font-size: 13px;
    line-height: 1.7;
    max-width: 100%;
    margin: 10px 0 16px;
  }
}
.header-nav__btn[href="/business/register"] .o-btn-bg__text,
.header-nav__btn[href="/business/register"].o-btn-bg {
  white-space: nowrap;
  background: ${BUSINESS_BLUE};
  border-color: ${BUSINESS_BLUE};
}
.header-nav__btn[href="/business/login"] .o-btn-border__text,
.header-nav__btn[href="/business/login"].o-btn-border {
  white-space: nowrap;
  border-color: ${BUSINESS_BLUE};
  color: ${BUSINESS_BLUE};
}

.fpv_btn_group .fpv_btn_group_download .o-btn-bg__text,
.fpv_btn_group .fpv_btn_group_contact_rc .o-btn-bg__text,
.fpv_btn_group .fpv_btn_group__contact_sl .o-btn-bg__text {
  font-size: 13px;
  line-height: 1.45;
}
@media (max-width: 767px) {
  .fpv_btn_group .fpv_btn_group_download .o-btn-bg__text,
  .fpv_btn_group .fpv_btn_group_contact_rc .o-btn-bg__text,
  .fpv_btn_group .fpv_btn_group__contact_sl .o-btn-bg__text {
    font-size: 11px;
    line-height: 1.35;
  }
}

/* Hero CTA — dark / white+blue / white+blue */
.fpv_btn_group .fpv_btn_group_download.o-btn-bg {
  background-color: #373c47 !important;
  border-color: #373c47 !important;
  color: #fff !important;
}
.fpv_btn_group .fpv_btn_group_download .o-btn-bg__text {
  color: #fff !important;
}
@media (hover: hover) and (pointer: fine) {
  .fpv_btn_group .fpv_btn_group_download.o-btn-bg:hover {
    background-color: #282c32 !important;
    border-color: #282c32 !important;
    color: #fff !important;
  }
  .fpv_btn_group .fpv_btn_group_download.o-btn-bg:hover .o-btn-bg__text {
    color: #fff !important;
  }
}

.fpv_btn_group .fpv_btn_group_contact_rc.o-btn-bg--white {
  background-color: #fff !important;
  border-color: #fff !important;
  color: ${BUSINESS_BLUE} !important;
}
.fpv_btn_group .fpv_btn_group_contact_rc .o-btn-bg__text {
  color: ${BUSINESS_BLUE} !important;
}
@media (hover: hover) and (pointer: fine) {
  .fpv_btn_group .fpv_btn_group_contact_rc.o-btn-bg--white:hover {
    background-color: transparent !important;
    border-color: #fff !important;
    color: #fff !important;
  }
  .fpv_btn_group .fpv_btn_group_contact_rc.o-btn-bg--white:hover .o-btn-bg__text {
    color: #fff !important;
  }
}

.fpv_btn_group .fpv_btn_group__contact_sl.o-btn-bg--white {
  background-color: #fff !important;
  border-color: #fff !important;
  color: ${BUSINESS_BLUE} !important;
}
.fpv_btn_group .fpv_btn_group__contact_sl .o-btn-bg__text {
  color: ${BUSINESS_BLUE} !important;
}
@media (hover: hover) and (pointer: fine) {
  .fpv_btn_group .fpv_btn_group__contact_sl.o-btn-bg--white:hover {
    background-color: ${BUSINESS_BLUE} !important;
    border-color: ${BUSINESS_BLUE} !important;
    color: #fff !important;
  }
  .fpv_btn_group .fpv_btn_group__contact_sl.o-btn-bg--white:hover .o-btn-bg__text {
    color: #fff !important;
  }
}

.front-page-visual__picture-area.js-hero-visual {
  flex: 0 1 auto;
  width: min(760px, 56vw);
  max-width: 100%;
}
.front-page-visual__picture-area.js-hero-visual .front-page-visual__picture {
  display: block;
  width: 100%;
}
.front-page-visual__picture-area.js-hero-visual .js-hero-visual__img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 620px;
  object-fit: contain;
  object-position: center bottom;
}
.front-page-visual__picture-caption {
  display: none !important;
}
@media (max-width: 767px) {
  .front-page-visual__picture-area.js-hero-visual {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
  }
  .front-page-visual__picture-area.js-hero-visual .js-hero-visual__img {
    max-height: 340px;
  }
}

.front-page-visual__lower {
  position: relative;
  padding-top: 72px;
  padding-bottom: 16px;
}
.front-page-visual__badge-group.js-hero-badge-group {
  position: absolute;
  top: -170px;
  left: 0;
  z-index: 3;
  max-width: 580px;
  width: 100%;
  margin: 0;
}
.front-page-visual__badge-group.js-hero-badge-group .js-hero-badge__img {
  display: block;
  width: 100%;
  height: auto;
}
.front-page-visual__caption-list {
  display: none !important;
}
@media (max-width: 1439px) {
  .front-page-visual__badge-group.js-hero-badge-group {
    top: -11vw;
  }
}
@media (max-width: 767px) {
  .front-page-visual__lower {
    padding-top: 0;
    padding-bottom: 24px;
  }
  .front-page-visual__badge-group.js-hero-badge-group {
    position: relative;
    top: auto;
    left: auto;
    margin: -72px 0 20px;
    max-width: 100%;
  }
}

.header-main__catch {
  display: none !important;
}
.header-main__logo-body,
.common-nav-info__logo-body,
.js-loading__logo--body {
  height: 44px;
  width: auto;
  max-width: 220px;
  object-fit: contain;
}
@media (max-width: 767px) {
  .header-main__logo-body,
  .common-nav-info__logo-body {
    height: 36px;
    max-width: 180px;
  }
}


.front-page-corporation__contents--partners {
  width: 100%;
}
.partner-marquee-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
.partner-marquee {
  position: relative;
  overflow: hidden;
  width: 100%;
}
.partner-marquee-fade {
  pointer-events: none;
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 10;
  width: 64px;
}
.partner-marquee-fade--left {
  left: 0;
  background: linear-gradient(to right, #fcf8f7, transparent);
}
.partner-marquee-fade--right {
  right: 0;
  background: linear-gradient(to left, #fcf8f7, transparent);
}
@media (min-width: 768px) {
  .partner-marquee-fade {
    width: 96px;
  }
}
.partner-marquee-track {
  display: flex;
  align-items: center;
  width: max-content;
  gap: 14px;
  animation: partner-marquee-rtl 42s linear infinite;
}
.partner-logo-card {
  flex: 0 0 auto;
  width: 170px;
  height: 76px;
  border-radius: 8px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}
.partner-logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
@keyframes partner-marquee-rtl {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

.front-page-appeal-marquee {
  z-index: 0 !important;
}
.front-page-appeal__contents {
  position: relative;
  z-index: 1;
}
.front-page-appeal-marquee__text {
  white-space: nowrap;
}
.front-page-appeal-marquee__text-en,
.front-page-appeal-marquee__text-jp {
  white-space: nowrap;
}

.front-page-proposal__body--four {
  grid-template-columns: 1fr 1fr !important;
  max-width: 960px;
  margin-left: auto;
  margin-right: auto;
}
@media (max-width: 767px) {
  .front-page-proposal__body--four {
    grid-template-columns: 1fr !important;
  }
}

.front-page-flow__lower-text {
  color: #fff;
  font-family: "Roboto", sans-serif;
  font-weight: 700;
  font-size: clamp(16px, 2vw, 20px);
  line-height: 1.6;
  margin: 0;
  flex: 1 1 280px;
  max-width: 420px;
  align-self: center;
}
@media (max-width: 865px) {
  .front-page-flow__lower-text {
    flex: 1 1 100%;
    max-width: none;
    text-align: center;
    margin-bottom: 8px;
  }
}

.footer .common-nav-sitemap__list--footer {
  grid-template-columns: repeat(4, 1fr) !important;
}
@media (max-width: 1439px) {
  .footer .common-nav-sitemap__list--footer {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
@media (max-width: 767px) {
  .footer .common-nav-sitemap__list--footer {
    grid-template-columns: 1fr !important;
  }
  .footer .common-nav-sitemap__item--spacer {
    display: none !important;
  }
}
.common-nav-sitemap__item--spacer {
  visibility: hidden;
  pointer-events: none;
  min-height: 0;
  padding: 0;
  margin: 0;
}

/* Roboto — override legacy Noto / Typekit stacks in style.css */
body :not(pre):not(code):not(kbd):not(samp) {
  font-family: "Roboto", sans-serif !important;
}
${getBrandThemeOverridesCss()}
`;
  fs.writeFileSync(path.join(OUT_ASSETS, 'jobshare-overrides.css'), overridesCss, 'utf8');

  let html = fs.readFileSync(SRC_HTML, 'utf8');
  html = stripTracking(html);
  html = applyLocalLinks(html);
  html = applyGlobalTextBranding(html);
  html = applyIndexMeta(html);
  html = applyNavbar(html);
  html = injectAuthButtons(html);
  html = normalizeAssetRefs(html);
  html = hideLoadingScreen(html);
  html = applyHeroSection(html);
  html = applyHeroBackground(html);
  html = applyHeroBadgeSection(html);
  html = applyPartnerMarqueeSection(html);
  html = applyCorporationSectionText(html);
  html = applyAppealSection(html);
  html = applyProposalSection(html);
  html = applyReasonSection(html);
  html = applyFlowSection(html);
  html = applyFaqSection(html);
  html = sanitizeAppealMarqueeSection(html);
  html = stripMarqueeInlineStyles(html);
  html = rebuildHeadScripts(html);
  html = injectBootstrap(html);
  html = injectOverrides(html);

  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html, 'utf8');
  console.log('Built Ready Crew landing:', OUT_DIR);
}

build();
