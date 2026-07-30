/**
 * template_true (Ready Crew save) → frontend/template/jobshare_business_landing/
 * Chạy: node frontend/scripts/build-readycrew-business-landing-template.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(ROOT, 'src/page/LandingPage/Business/template/template_true');
const SRC_HTML = path.join(
  TEMPLATE_DIR,
  'Ready Crew（レディクル） _ 無料のビジネスマッチング・コンシェルジュ.html',
);
const SRC_ASSETS = path.join(
  TEMPLATE_DIR,
  'Ready Crew（レディクル） _ 無料のビジネスマッチング・コンシェルジュ_files',
);
const THEME_IMAGES_SRC = path.join(TEMPLATE_DIR, '_theme_images');
const OUT_DIR = path.join(ROOT, 'template/jobshare_business_landing');
const OUT_ASSETS = path.join(OUT_DIR, 'assets');

const ASSET_PREFIX_OLD = './Ready Crew（レディクル） _ 無料のビジネスマッチング・コンシェルジュ_files/';
const ASSET_PREFIX_NEW = './assets/';

const READYCREW_THEME_IMAGES = [
  'common/conversion-bnr-bg.png',
  'common/conversion-bnr-bg-sp.png',
  'common/footer-top-gradient.png',
  'common/footer-top-gradient-sp.png',
  'common/icon-new-window.svg',
  'common/apple-touch-icon-precomposed.png',
  'common/ogp.png',
  'front-page/front-page-conversion-bg.png',
  'front-page/front-page-conversion-bg-sp.png',
  'front-page/front-page-thought-bg.svg',
  'front-page/front-page-thought-bg-sp.svg',
  'front-page/front-page-visual-bg.png',
  'front-page/front-page-visual-bg-sp.png',
  'pages/page-manga-visual-bg.png',
  'pages/page-manga-visual-bg-sp.png',
];

const SKIP_ASSET_NAMES = new Set([
  'adsct', 'adsct(1)', 'adsct(2)', 'adsct(3)',
  'destination', 'log', 'call-chat.html', 'iframe_api', '0',
  'f.txt', 'f(1).txt', 'f(2).txt', 'js', 'js(1)', 'js(2)',
  'gtm.js', 'gtm.js.download', 'ytag.js', 'ytag.js.download',
  'clarity.js', 'clarity.js.download', 'fbevents.js', 'fbevents.js.download',
  'bat.js', 'bat.js.download', 'analytics.js', 'analytics.js.download',
  'insight.min.js', 'insight.min.js.download', 'insight.old.min.js', 'insight.old.min.js.download',
  'oaiq.min.js', 'oaiq.min.js.download', 'connect.js', 'connect.js.download',
  '2fjm6f27.js', '2fjm6f27.js.download', '187012516', '187012516.js', '187012516.js.download',
  '688145445397782', 'www-widgetapi.js', 'www-widgetapi.js.download',
  'gwm7ksd.js', 'gwm7ksd.js.download', 'm2djmkcgrl', 'uwt.js', 'uwt.js.download',
  'conversion.js', 'conversion.js.download', 'app.js(1).download',
  'slick.min(1).js.download', 'jquery.jscroll.min(1).js.download',
  'tag.js', 'tag.js.download', 's_retargeting.js', 's_retargeting.js.download',
  'tr.js', 'tr.js.download',
]);

function shouldSkipAsset(name) {
  const base = name.endsWith('.download') ? name.replace(/\.download$/, '') : name;
  if (SKIP_ASSET_NAMES.has(name) || SKIP_ASSET_NAMES.has(base)) return true;
  if (/^\d+$/.test(name)) return true;
  if (name.startsWith('adsct')) return true;
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

function copyThemeImages(outAssetsDir) {
  const destRoot = path.join(outAssetsDir, 'images');
  const copyFrom = (srcRoot) => {
    if (!fs.existsSync(srcRoot)) return false;
    copyAssetsRecursive(srcRoot, destRoot);
    return true;
  };
  if (copyFrom(THEME_IMAGES_SRC)) return;
  const legacy = path.join(OUT_DIR, 'assets/images');
  if (fs.existsSync(legacy)) copyFrom(legacy);
}

async function downloadMissingThemeImages(outAssetsDir) {
  const base = 'https://readycrew.jp/assets/images/';
  const destRoot = path.join(outAssetsDir, 'images');
  for (const rel of READYCREW_THEME_IMAGES) {
    const dest = path.join(destRoot, rel);
    if (fs.existsSync(dest)) continue;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    try {
      const res = await fetch(base + rel);
      if (!res.ok) {
        console.warn('Theme image missing:', rel, res.status);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buf);
    } catch (e) {
      console.warn('Theme image download failed:', rel, e.message);
    }
  }
}

function stripTracking(html) {
  let out = html;
  out = out.replace(/<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/g, '');
  out = out.replace(/<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->/g, '');
  out = out.replace(/<script[^>]*src="[^"]*(?:gtm|ytag|clarity|fbevents|bat\.js|insight|analytics|oaiq|187012516|fbevents|connect\.js|2fjm6f27|destination|uwt\.js|m2djmkcgrl|s_retargeting|conversion\.js|\/log(?:\?|$)|tag\.js|tr\.js)[^"]*"[^>]*>\s*<\/script>/gi, '');
  out = out.replace(/<script[^>]*src="[^"]*(?:f\.txt|f\(1\)\.txt|www-widgetapi|iframe_api)[^"]*"[^>]*>\s*<\/script>/gi, '');
  out = out.replace(/<script async="" src="[^"]*analytics\.js[^"]*"[^>]*>\s*<\/script>/gi, '');
  out = out.replace(/<noscript>[\s\S]*?googletagmanager[\s\S]*?<\/noscript>/gi, '');
  return out;
}

function stripBodyTracking(html) {
  let out = html;
  out = out.replace(/<script type="speculationrules">[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<!-- HM TAG -->[\s\S]*?<!-- HM TAG -->/g, '');
  out = out.replace(/<!-- 料金タグ -->[\s\S]*?<!-- HM TAG -->/g, '');
  out = out.replace(/<script id=""[^>]*>[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script id=""[^>]*src="[^"]*"[^>]*>\s*<\/script>/gi, '');
  out = out.replace(/<script[^>]*src="\.\/assets\/(?:s_retargeting|tr|tag|conversion|log|ytag|connect|2fjm6f27)[^"]*"[^>]*>\s*<\/script>/gi, '');
  out = out.replace(/<script type="text\/javascript" id="" charset="">[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<div style="display: none; visibility: hidden;">[\s\S]*?<\/div>/gi, '');
  out = out.replace(/<noscript>[\s\S]*?yahoo\.co\.jp[\s\S]*?<\/noscript>/gi, '');
  out = out.replace(/<img src="\.\/assets\/adsct[^"]*"[^>]*>/gi, '');
  out = out.replace(/<pt-experience[\s\S]*?(?=<\/body>)/gi, '');
  out = out.replace(/<div id="optemo__main"[\s\S]*?(?=<\/body>)/gi, '');
  out = out.replace(/<div id="batBeacon[\s\S]*?(?=<\/body>)/gi, '');
  return out;
}

function stripHeadInjectedScripts(html) {
  return html.replace(
    /(<script type="text\/javascript" src="\.\/assets\/front-page\.js"><\/script>)([\s\S]*?)(<link rel="stylesheet" href="\.\/assets\/jobshare-overrides\.css">|<\/head>)/i,
    (_, frontPage, middle, tail) => {
      const kept = middle.replace(/<script[\s\S]*?<\/script>/gi, '');
      return `${frontPage}${kept}${tail}`;
    },
  );
}

function normalizeAssetRefs(html) {
  return html
    .replace(/\.js\.download/g, '.js')
    .replace(/\.css\.download/g, '.css');
}

const READYCREW_ASSETS_CDN = 'https://readycrew.jp/assets/';

/** Giữ nội dung/branding Ready Crew từ template_true; chỉ đổi link đăng ký/đăng nhập */
function applyLocalLinks(html) {
  let out = html.split(ASSET_PREFIX_OLD).join(ASSET_PREFIX_NEW);

  out = out.replace(/https:\/\/readycrew\.jp\/inquiry_docs_rc\/?/g, '/business/register');
  out = out.replace(/https:\/\/readycrew\.jp\/contact_rc\/?/g, '/business/login');
  out = out.replace(
    /https:\/\/readycrew\.jp\/(?:price|results|proposal|manga|seminar|document|news|partner|inquiry|contact)[^"'>\s]*/g,
    '#',
  );
  out = out.replace(/https:\/\/readycrew\.jp\/cms\/[^"'>\s]*/g, '#');
  // Theme images: local mirror when present, else CDN (must run before homepage replace)
  out = out.replace(/https:\/\/readycrew\.jp\/assets\/([^"'>\s]+)/g, (_, rel) => {
    const local = path.join(OUT_ASSETS, rel.replace(/\//g, path.sep));
    if (fs.existsSync(local)) {
      return `./assets/${rel}`;
    }
    return `${READYCREW_ASSETS_CDN}${rel}`;
  });
  // Homepage only — do not match readycrew.jp/assets/...
  out = out.replace(/https:\/\/readycrew\.jp\/?(\?[^"'>\s]*)?(?=["'>\s])/g, '/landing/business');
  // Saved page sometimes uses homepage URL as broken img src
  out = out.replace(/(<img\b[^>]*\ssrc=")\/landing\/business(")/gi, '$1#$2');
  out = out.replace(/https:\/\/frontier-gr\.jp[^"'>\s]*/g, '#');

  return out;
}

function injectAuthButtons(html) {
  const desktopBtns = `<li class="header-nav__btn-item">
\t\t\t\t\t\t\t\t\t\t\t<a href="/business/login" target="_top" class="header-nav__btn o-btn-border">
\t\t\t\t\t\t\t\t\t\t\t\t<span class="o-btn-border__text">Đăng nhập</span>
\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t\t\t\t<li class="header-nav__btn-item">
\t\t\t\t\t\t\t\t\t\t\t<a href="/business/register" target="_top" class="header-nav__btn o-btn-bg">
\t\t\t\t\t\t\t\t\t\t\t\t<span class="o-btn-bg__text">Đăng ký</span>
\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t</li>`;

  return html.replace(
    /<ol class="header-nav__btn-group">[\s\S]*?<\/ol>/,
    `<ol class="header-nav__btn-group">${desktopBtns}</ol>`,
  );
}

/** Save-page giữ state jQuery Marquee (width:100000px) → vỡ layout / scroll ngang */
function resetMarqueeSaveState(html) {
  let out = html;
  out = out.replace(/<style>@keyframes marqueeAnimation-[\s\S]*?<\/style>/gi, '');
  out = out.replace(/<div([^>]*\bclass="js-marquee-wrapper"[^>]*)>/gi, (_, attrs) => {
    const cleaned = attrs.replace(/\sstyle="[^"]*"/gi, '');
    return `<div${cleaned}>`;
  });
  out = out.replace(/<div([^>]*\bclass="js-marquee"[^>]*)>/gi, (_, attrs) => {
    const cleaned = attrs.replace(/\sstyle="[^"]*"/gi, '');
    return `<div${cleaned}>`;
  });
  out = out.replace(/(<html\b[^>]*)\sstyle="[^"]*"/i, '$1');
  // Bỏ bản clone trong save — chỉ giữ nội dung gốc, plugin init lại khi load
  out = out.replace(
    /<div class="front-page-corporation-slider js-corp-marquee"><div class="js-marquee-wrapper"><div class="js-marquee">\s*(<div class="front-page-corporation-slider__wrapper js-corp-marquee__wrapper">[\s\S]*?<\/div>)\s*<\/div><div class="js-marquee">[\s\S]*?<\/div><\/div><\/div>/g,
    '<div class="front-page-corporation-slider js-corp-marquee">$1</div>',
  );
  out = out.replace(
    /<div class="front-page-appeal-marquee__body js-logo-marquee"><div class="js-marquee-wrapper"><div class="js-marquee">\s*(<p class="front-page-appeal-marquee__text">[\s\S]*?<\/p>)\s*<\/div><div class="js-marquee">[\s\S]*?<\/div><\/div><\/div>/g,
    '<div class="front-page-appeal-marquee__body js-logo-marquee">$1</div>',
  );
  return out;
}

function sanitizeLandingHtml(html) {
  let out = html;

  out = out.replace(/<script>\s*window\.jQuery[\s\S]*?document\.write[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script>\s*window\.jQuery\.easing[\s\S]*?document\.write[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script>\s*window\.Slick[\s\S]*?document\.write[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script>\s*window\.jscroll[\s\S]*?document\.write[\s\S]*?<\/script>/gi, '');

  out = out.replace(/<script[^>]*src="\.\/assets\/[^"]*\(\d+\)[^"]*"[^>]*>\s*<\/script>/gi, '');
  out = out.replace(/<script type="text\/javascript" src="\.\/assets\/barba\.min\.js"><\/script>/g, '');

  // Giữ ofq0clf.css + css2 + Typekit (ryo-gothic) như template_true — bỏ slick.css (không có trong bản gốc)
  out = out.replace(
    /<link rel="stylesheet" href="\.\/assets\/slick\.css">\s*/g,
    '',
  );

  return out;
}

function injectBootstrap(html) {
  const boot = `<script src="./assets/jobshare-bootstrap.js"></script>`;
  if (html.includes('jobshare-bootstrap.js')) return html;
  return html.replace(
    /<script type="text\/javascript" src="\.\/assets\/front-page\.js"><\/script>/,
    `${boot}\n\t<script type="text/javascript" src="./assets/front-page.js"></script>`,
  );
}

function fixStylesheetImagePaths(outAssetsDir) {
  const stylePath = path.join(outAssetsDir, 'style.css');
  if (!fs.existsSync(stylePath)) return;
  const cdnBase = READYCREW_ASSETS_CDN + 'images/';
  let css = fs.readFileSync(stylePath, 'utf8');
  css = css.replace(/url\("\.\.\/images\//g, 'url("./images/');
  css = css.replace(/url\("\.\/images\/([^"]+)"\)/g, (match, rel) => {
    const local = path.join(outAssetsDir, 'images', rel.replace(/\//g, path.sep));
    if (fs.existsSync(local)) return match;
    return `url("${cdnBase}${rel}")`;
  });
  fs.writeFileSync(stylePath, css, 'utf8');
}

function injectOverrides(html) {
  const link = '<link rel="stylesheet" href="./assets/jobshare-overrides.css">';
  if (html.includes('jobshare-overrides.css')) return html;
  return html.replace('</head>', `    ${link}\n</head>`);
}

async function build() {
  if (!fs.existsSync(SRC_HTML)) {
    console.error('Source HTML not found:', SRC_HTML);
    process.exit(1);
  }
  if (!fs.existsSync(SRC_ASSETS)) {
    console.error('Source assets not found:', SRC_ASSETS);
    process.exit(1);
  }

  const imagesSrc = path.join(OUT_DIR, 'assets/images');
  const preservedImages = fs.existsSync(imagesSrc) ? imagesSrc : null;

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  copyAssetsRecursive(SRC_ASSETS, OUT_ASSETS);

  if (preservedImages && fs.existsSync(preservedImages)) {
    copyAssetsRecursive(preservedImages, path.join(OUT_ASSETS, 'images'));
  } else {
    copyThemeImages(OUT_ASSETS);
  }
  await downloadMissingThemeImages(OUT_ASSETS);
  fixStylesheetImagePaths(OUT_ASSETS);

  const bootstrapJs = `/* Ready Crew template_true — iframe embed */
(function () {
  window.dataLayer = window.dataLayer || [];
  window.ytag = window.ytag || function () {};
  window.fbq = window.fbq || function () {};
  window.__pParams = window.__pParams || [];

  function skipSplash() {
    try { sessionStorage.setItem('access', 'true'); } catch (e) {}
    var loading = document.querySelector('.js-loading');
    if (loading) {
      loading.classList.add('js-loading--none');
      loading.style.display = 'none';
    }
    document.querySelectorAll('.js-loading-hide').forEach(function (el) {
      el.style.display = 'block';
    });
  }

  /** Bỏ DOM marquee đã serialize (100000px + bản clone logo) trước khi front-page.js init */
  function resetSavedMarqueeDom() {
    document.querySelectorAll('.js-corp-marquee').forEach(function (root) {
      var inner = root.querySelector('.js-corp-marquee__wrapper');
      if (!inner) return;
      root.replaceChildren(inner);
    });
    document.querySelectorAll('.js-logo-marquee').forEach(function (root) {
      var text = root.querySelector('.front-page-appeal-marquee__text');
      if (!text) return;
      root.replaceChildren(text);
    });
  }

  function init() {
    skipSplash();
    resetSavedMarqueeDom();
    document.querySelectorAll('a[href*="/assets/call-chat"]').forEach(function (a) {
      a.setAttribute('href', '#');
    });
    if (window.jQuery) {
      window.jQuery(window).trigger('resize');
      window.jQuery(window).trigger('load');
    }
  }

  skipSplash();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('load', init);
})();
`;
  fs.writeFileSync(path.join(OUT_ASSETS, 'jobshare-bootstrap.js'), bootstrapJs, 'utf8');

  const overridesCss = `/* template_true — layout fixes (save page thiếu giới hạn kích thước desktop) */
html, body {
  overflow-x: hidden;
  max-width: 100%;
}
.js-corp-marquee,
.js-logo-marquee,
.front-page-corporation-slider {
  overflow: hidden;
  max-width: 100%;
}
@media (min-width: 1024px) {
  .header-sub {
    left: 21px;
    right: 21px;
    width: auto;
    max-width: none;
  }
}
.header-sub__tel:empty,
.header-sub__time:empty {
  display: none !important;
}
#optemo__main,
[id^="batBeacon"] {
  display: none !important;
}
@media (min-width: 1024px) {
  .header-main__site-name {
    align-items: flex-end;
    min-width: 0;
  }
  .header-main__logo-body {
    display: block;
    height: auto;
    max-height: 38px;
    width: auto;
    max-width: 100%;
  }
  .header-main__catch {
    flex: 1;
    min-width: 0;
    max-width: 280px;
  }
  .header-main__catch-body {
    display: block;
    width: 100%;
    max-width: 100%;
    height: auto;
  }
}
.front-page-visual__main-text-body img {
  max-width: 100%;
  height: auto;
}
a[href="/business/register"],
a[href="/business/login"] {
  cursor: pointer;
}
.header-nav__btn .o-btn-bg__text,
.header-nav__btn .o-btn-border__text {
  white-space: nowrap;
}
`;
  fs.writeFileSync(path.join(OUT_ASSETS, 'jobshare-overrides.css'), overridesCss, 'utf8');

  let html = fs.readFileSync(SRC_HTML, 'utf8');
  html = stripTracking(html);
  html = applyLocalLinks(html);
  html = injectAuthButtons(html);
  html = normalizeAssetRefs(html);
  html = resetMarqueeSaveState(html);
  html = sanitizeLandingHtml(html);
  html = stripBodyTracking(html);
  html = injectBootstrap(html);
  html = injectOverrides(html);
  html = stripHeadInjectedScripts(html);

  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html, 'utf8');
  console.log('Built Ready Crew landing (template_true):', OUT_DIR);
}

await build();
