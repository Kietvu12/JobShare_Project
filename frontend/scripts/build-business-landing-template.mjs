/**
 * Chuyển template i-web → JobShare Business landing (frontend/template/jobshare_business_landing/)
 * Chạy: node frontend/scripts/build-business-landing-template.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_HTML = path.join(
  ROOT,
  'src/page/LandingPage/Business/template/採用管理システム i-web｜新卒・キャリア採用を一元管理.html',
);
const SRC_ASSETS = path.join(
  ROOT,
  'src/page/LandingPage/Business/template/採用管理システム i-web｜新卒・キャリア採用を一元管理_files',
);
const OUT_DIR = path.join(ROOT, 'template/jobshare_business_landing');
const OUT_ASSETS = path.join(OUT_DIR, 'assets');

const ASSET_PREFIX_OLD = './採用管理システム i-web｜新卒・キャリア採用を一元管理_files/';
const ASSET_PREFIX_NEW = './assets/';

/** File rác từ trang save-as (tracking, youtube snapshot, ads…) — không copy */
const SKIP_ASSET_NAMES = new Set([
  'ad_status.js', 'ad_status.js.download',
  'base.js', 'base.js.download',
  'WVH0yFlXOhw.html',
  'universe_cookie_sync.html',
  'cookie_js.php',
  'f.txt', 'f(1).txt', 'f(2).txt',
  'js', 'js(1)', 'js(2)',
  'gtm.js', 'gtm.js.download',
  'ytag.js', 'ytag.js.download',
  'clarity.js', 'clarity.js.download',
  'fbevents.js', 'fbevents.js.download',
  'bat.js', 'bat.js.download',
  'uh.js', 'uh.js.download',
  'track.js', 'track.js.download',
  'insight.min.js', 'insight.min.js.download',
  'insight.old.min.js', 'insight.old.min.js.download',
  'analytics.js', 'analytics.js.download',
  'munchkin.js', 'munchkin.js.download',
  'munchkin(1).js', 'munchkin(1).js.download',
  'param.min.js', 'param.min.js.download',
  '187184069', '187184069.js', '187184069.js.download',
  '319712105807214',
  'ud0s7s9aat',
  'www-player.css',
  'm=root,base',
]);

function shouldSkipAsset(name) {
  const base = name.endsWith('.download') ? name.replace(/\.download$/, '') : name;
  if (SKIP_ASSET_NAMES.has(name) || SKIP_ASSET_NAMES.has(base)) return true;
  if (name.startsWith('m=root')) return true;
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
  out = out.replace(/<script data-uqid[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script>\(function\(\)\{[\s\S]*?cookie_js\.php[\s\S]*?\}\)\(\);<\/script>/gi, '');
  out = out.replace(/<script[^>]*src="[^"]*(?:gtm|ytag|clarity|fbevents|bat\.js|uh\.js|track\.js|insight|analytics|munchkin|param\.min|187184069|ad_status|cookie_js|\/assets\/js"|assets\/js")[^"]*"[^>]*>\s*<\/script>/gi, '');
  out = out.replace(/<script[^>]*src="\.\/assets\/js"[^>]*>\s*<\/script>/gi, '');
  out = out.replace(/<script[^>]*src="[^"]*(?:js\(1\)|js\(2\)|f\.txt|f\(1\)\.txt|f\(2\)\.txt|ud0s7s9aat|319712105807214|base\.js|ad_status)[^"]*"[^>]*>\s*<\/script>/gi, '');
  out = out.replace(/<script[^>]*charset=""[^>]*>[\s\S]*?<\/script>/gi, (block) => {
    if (/fbq|_uhtracker|uetq|microAdUniverseTracker|ytag|UserHeatTag|UET\(/.test(block)) return '';
    return block;
  });
  out = out.replace(/<div style="display: none; visibility: hidden;">[\s\S]*?<\/div>/gi, '');
  out = out.replace(/<div id="batBeacon[^"]*"[\s\S]*?<\/div>/gi, '');
  out = out.replace(/<iframe[^>]*(?:googletagmanager|universe_cookie_sync)[^>]*>\s*<\/iframe>/gi, '');
  out = out.replace(/<noscript>[\s\S]*?facebook\.com\/tr[\s\S]*?<\/noscript>/gi, '');
  // Cookie ad-cast injector (còn sót trong body)
  out = out.replace(/<script>\s*\(function\(\)\{[\s\S]*?ad-cast\.tokyo[\s\S]*?\}\)\(\);\s*<\/script>/gi, '');
  return out;
}

function normalizeAssetRefs(html) {
  return html
    .replace(/\.js\.download/g, '.js')
    .replace(/\.css\.download/g, '.css');
}

function fixEmbeds(html) {
  return html.replace(
    /src="\.\/assets\/WVH0yFlXOhw\.html"/g,
    'src="https://www.youtube.com/embed/WVH0yFlXOhw"',
  );
}

function fixHeader(html) {
  return html.replace('<header class="fixed -hide">', '<header class="fixed">');
}

function rebuildHeadScripts(html) {
  const essentialScripts = [
    './assets/jquery-3.5.1.min.js',
    './assets/gsap.min.js',
    './assets/ScrollTrigger.min.js',
    './assets/swiper.js',
    './assets/isotope.pkgd.min.js',
    './assets/lity.min.js',
    './assets/aos.js',
  ];
  const scriptTags = essentialScripts.map((src) => `<script src="${src}"></script>`).join('\n        ');
  return html.replace(
    /<script[^>]*src="\.\/assets\/[^"]*"[^>]*>\s*<\/script>\s*(?:<script[^>]*src="\.\/assets\/[^"]*"[^>]*>\s*<\/script>\s*)*/i,
    `${scriptTags}\n        `,
  );
}

function injectBootstrap(html) {
  const boot = `<script src="./assets/jobshare-bootstrap.js"></script>`;
  if (html.includes('jobshare-bootstrap.js')) return html;
  return html.replace('<script src="./assets/script.js"></script>', `${boot}\n        <script src="./assets/script.js"></script>`);
}

function injectAuthButtons(html) {
  const headerBtns = `<li class="contact contact-login"><a href="/business/login" target="_top">Đăng nhập</a></li>
                            <li class="contact contact-register"><a href="/business/register" target="_top" class="_anime -wipe -active">Đăng ký</a></li>`;
  const footerBtns = `<li class="contact contact-login btn"><a href="/business/login" target="_top"><span>Đăng nhập</span></a></li>
                                <li class="contact contact-register btn"><a href="/business/register" target="_top"><span class="_anime -wipe -active">Đăng ký</span></a></li>`;

  let out = html;
  out = out.replace(
    /<li class="contact"><a href="[^"]*"[^>]*>Đăng ký doanh nghiệp<\/a><\/li>/g,
    headerBtns,
  );
  out = out.replace(
    /<li class="contact"><a href="[^"]*"[^>]*>オンライン相談<\/a><\/li>/g,
    headerBtns,
  );
  out = out.replace(
    /<li class="contact btn"><a href="[^"]*"[^>]*><span class="_anime -wipe -active">(?:Đăng ký doanh nghiệp|オンライン相談)<\/span><\/a><\/li>/g,
    footerBtns,
  );
  return out;
}

function replaceBrand(html) {
  let out = html;
  out = out.split(ASSET_PREFIX_OLD).join(ASSET_PREFIX_NEW);

  const replacements = [
    [/https:\/\/i-web-ats\.humanage\.co\.jp\/?[^"'>\s]*/g, '/landing/business'],
    [/https:\/\/www\.humanage\.co\.jp[^"'>\s]*/g, '/'],
    [/https:\/\/humanage\.eeasy\.jp\/appointment_iweb/g, '/business/register'],
    [/https:\/\/www\.i-note\.jp\/humanage[^"'>\s]*/g, '#'],
    [/採用管理システム i-web｜新卒・キャリア採用を一元管理/g, 'JobShare Business｜Nền tảng quản lý tuyển dụng'],
    [/採用担当者が選ぶ、No\.1採用管理システム－i-web/g, 'Nền tảng tuyển dụng JobShare Business'],
    [/採用管理システム i-web/g, 'JobShare Business'],
    [/What's i-web？/g, "What's JobShare Business?"],
    [/i-webが選ばれる理由/g, 'Lý do chọn JobShare Business'],
    [/採用管理システム i-webとは/g, 'JobShare Business là gì'],
    [/i-webひとつで/g, 'JobShare Business'],
    [/i-webの/g, 'JobShare Business '],
    [/i-webは/g, 'JobShare Business'],
    [/i-webに/g, 'JobShare Business'],
    [/i-webで/g, 'JobShare Business'],
    [/i-webを/g, 'JobShare Business'],
    [/i-webが/g, 'JobShare Business'],
    [/i-web\s/g, 'JobShare Business '],
    [/i-web/g, 'JobShare Business'],
    [/I-web/g, 'JobShare Business'],
    [/HUMANAGE/g, 'JobShare'],
    [/Humanage,Inc\./g, 'JobShare'],
    [/ヒューマネージ/g, 'JobShare'],
    [/alt="応募者と企業をつなぐ採用担当者が選ぶ、No\.1採用管理システム－i-web"/g,
      'alt="JobShare Business — Nền tảng quản lý tuyển dụng"'],
    [/src="\.\/assets\/iweb-blue\.png"/g, 'src="/logo.png"'],
    [/src="\.\/assets\/iweb-blue\(1\)\.png"/g, 'src="/logo.png"'],
    [/src="\.\/assets\/logo_white\.svg"/g, 'src="/logo.png"'],
  ];

  for (const [pattern, replacement] of replacements) {
    out = out.replace(pattern, replacement);
  }

  out = out.replace(
    /<p class="main"><img src="\.\/assets\/tit\.png" alt="[^"]*"><\/p>/,
    `<p class="main jobshare-hero-title"><span class="jobshare-hero-kicker">Nền tảng tuyển dụng thông minh</span><strong class="jobshare-hero-brand">JobShare Business</strong><span class="jobshare-hero-sub">Quản lý JD, ứng viên, CTV &amp; Scout trên một hệ thống</span></p>`,
  );

  out = out.replace(/JobShare Business取り込まれ/g, 'JobShare Businessに取り込まれ');
  out = out.replace(/JobShare Business応募者/g, 'JobShare Businessは応募者');
  out = out.replace(/JobShare Business 管理画面/g, 'JobShare Businessの管理画面');
  out = out.replace(/JobShare Business 特定モデル/g, 'JobShare Business特定モデル');

  return out;
}

function injectOverrides(html) {
  const link = '<link rel="stylesheet" href="./assets/jobshare-overrides.css">';
  if (html.includes('jobshare-overrides.css')) return html;
  return html.replace('</head>', `    ${link}\n    </head>`);
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

  const bootstrapJs = `/* JobShare — khởi tạo navbar & animation khi nhúng iframe */
(function () {
  function init() {
    var header = document.querySelector('header');
    if (header) {
      header.classList.remove('-hide');
      header.classList.add('fixed');
    }
    document.body.classList.add('-initialize');
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('load', init);
})();
`;
  fs.writeFileSync(path.join(OUT_ASSETS, 'jobshare-bootstrap.js'), bootstrapJs, 'utf8');

  const overridesCss = `/* JobShare Business — overrides trên template gốc */
html, body {
  overflow-x: hidden;
}
header.fixed {
  opacity: 1 !important;
  pointer-events: auto !important;
}
header.fixed.-hide {
  opacity: 1 !important;
  pointer-events: auto !important;
}
.jobshare-hero-title {
  display: flex;
  flex-direction: column;
  gap: 0.35em;
  line-height: 1.35;
  color: #1a1a1a;
}
.jobshare-hero-kicker {
  font-size: clamp(14px, 2vw, 18px);
  font-weight: 600;
  letter-spacing: 0.04em;
}
.jobshare-hero-brand {
  font-size: clamp(28px, 5vw, 46px);
  font-weight: 800;
  color: #c61414;
  letter-spacing: -0.02em;
}
.jobshare-hero-sub {
  font-size: clamp(13px, 1.8vw, 16px);
  font-weight: 500;
  color: #4b5563;
  max-width: 32em;
}
header h1 a img {
  height: 36px;
  width: auto;
  object-fit: contain;
}
footer .left h2 a img {
  filter: brightness(0) invert(1);
  height: 32px;
  width: auto;
}
header .right .nav_area nav.subnav ul {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
}
header .right .nav_area nav.subnav ul li.contact a {
  width: auto;
  min-width: 108px;
  padding: 0 18px;
  white-space: nowrap;
  line-height: 42px;
  font-size: 13px;
}
header .right .nav_area nav ul li.contact-register a {
  background: #c61414;
  color: #fff;
  border-color: #c61414;
}
header .right .nav_area nav ul li.contact-register a:hover {
  background: #a01010;
  border-color: #a01010;
  color: #fff;
}
footer .row .right .subnav ul {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
footer .row .right .subnav ul li.contact-register a {
  background: #c61414;
  border-color: #c61414;
}
footer .row .right .subnav ul li.contact-register a span {
  color: #fff;
}
`;
  fs.writeFileSync(path.join(OUT_ASSETS, 'jobshare-overrides.css'), overridesCss, 'utf8');

  let html = fs.readFileSync(SRC_HTML, 'utf8');
  html = stripTracking(html);
  html = replaceBrand(html);
  html = injectAuthButtons(html);
  html = normalizeAssetRefs(html);
  html = fixEmbeds(html);
  html = fixHeader(html);
  html = rebuildHeadScripts(html);
  html = injectBootstrap(html);
  html = injectOverrides(html);

  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html, 'utf8');
  console.log('Built:', OUT_DIR);
}

build();
