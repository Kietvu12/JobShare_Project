/**
 * Build Ready Crew subpages → frontend/template/jobshare_business_landing/pages/
 * Chạy: node frontend/scripts/build-readycrew-subpages.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NAV_ITEMS, SUBPAGE_SOURCES } from './readycrew-nav-config.mjs';
import {
  applyGlobalTextBranding,
  applySubpageContent,
} from './readycrew-branding.mjs';
import {
  ensureHeroAssets,
  HERO_IMAGE_NAME,
  normalizeReadyCrewImageUrls,
} from './readycrew-assets.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src/page/LandingPage/Business/template/sources');
const OUT_DIR = path.join(ROOT, 'template/jobshare_business_landing/pages');
const OUT_ASSETS = path.join(ROOT, 'template/jobshare_business_landing/assets');
const ASSET_PREFIX = '../assets/';
const LOGO_NAME = 'jobshare-logo.png';
const WP_ASSETS_DIR = path.join(OUT_ASSETS, 'wp-uploads');

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

function buildFooterSitemapList() {
  const slots = [NAV_ITEMS[0], null, NAV_ITEMS[1], null, NAV_ITEMS[2], null, NAV_ITEMS[3], NAV_ITEMS[4]];
  return slots.map((item) => buildSitemapItem(item)).join('\n');
}

function stripTracking(html) {
  let out = html;
  out = out.replace(/<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/g, '');
  out = out.replace(/<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->/g, '');
  out = out.replace(/<script[^>]*src="[^"]*(?:gtm|ytag|clarity|fbevents|bat\.js|insight|analytics|oaiq|gwm7ksd|187012516|688145445397782|typekit)[^"]*"[^>]*>\s*<\/script>/gi, '');
  out = out.replace(/<script>\s*\(function\(d\)\s*\{[\s\S]*?Typekit[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script>\s*window\.jQuery[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script>\s*window\.jQuery\.easing[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script>\s*window\.Slick[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script>\s*window\.jscroll[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<link rel='stylesheet' id='wp-block-library-css'[^>]*>/gi, '');
  out = out.replace(/<style id='(?:classic-theme-styles|global-styles)-inline-css'[\s\S]*?<\/style>/gi, '');
  out = out.replace(/<link rel="stylesheet" href="https:\/\/use\.typekit\.net[^"]*">/gi, '');
  return out;
}

function normalizeAssetRefs(html) {
  let out = html;
  out = out.replace(/href="\/assets\/css\/([^"?]+)(?:\?[^"]*)?"/g, `href="${ASSET_PREFIX}$1"`);
  out = out.replace(/src="\/assets\/js\/([^"?]+)(?:\?[^"]*)?"/g, `src="${ASSET_PREFIX}$1"`);
  out = out.replace(/src="\/assets\/images\/([^"?]+)(?:\?[^"]*)?"/g, `src="${ASSET_PREFIX}$1"`);
  out = out.replace(/https:\/\/readycrew\.jp\/assets\/images\/common\/([^"'>\s]+)/g, `${ASSET_PREFIX}$1`);
  out = normalizeReadyCrewImageUrls(out, ASSET_PREFIX);
  out = out.replace(/jquery-3\.7\.1\.min\.js/g, 'jquery.min.js');
  out = out.replace(/hd_logo@2x\.png/g, LOGO_NAME);
  return out;
}

function applyLocalLinks(html) {
  let out = html;
  out = out.replace(/https:\/\/readycrew\.jp\/inquiry_docs[^"'>\s]*/g, '/business/register');
  out = out.replace(/https:\/\/readycrew\.jp\/contact[^"'>\s]*/g, '/business/login');
  out = out.replace(/https:\/\/readycrew\.jp\/sl_cp[^"'>\s]*/g, '/business/register');
  out = out.replace(/https:\/\/readycrew\.jp\/news_cat\/20260727\/?/g, '/landing/business/news/sample');
  out = out.replace(/https:\/\/readycrew\.jp\/news_cat\/20260730\/?/g, '/landing/business/about');
  out = out.replace(/https:\/\/readycrew\.jp\/news_cat\/[^"'>\s]*/g, '/landing/business/news/sample');
  out = out.replace(/https:\/\/readycrew\.jp\/news\/?(?=["'>\s])/g, '/landing/business/news');
  out = out.replace(/https:\/\/readycrew\.jp\/proposal\/?(?=["'>\s])/g, '/landing/business/services');
  out = out.replace(/https:\/\/readycrew\.jp\/seminar\/?(?=["'>\s])/g, '/landing/business/seminar');
  out = out.replace(/https:\/\/readycrew\.jp\/?(?=["'>\s])/g, '/landing/business');
  out = out.replace(/https:\/\/readycrew\.jp\/[^"'>\s]*/g, '#');
  out = out.replace(/https:\/\/frontier-gr\.jp[^"'>\s]*/g, '#');
  out = out.replace(/https:\/\/twitter\.com[^"'>\s]*/g, '#');
  out = out.replace(/https:\/\/www\.instagram\.com[^"'>\s]*/g, '#');
  out = out.replace(/https:\/\/www\.facebook\.com[^"'>\s]*/g, '#');
  out = out.replace(
    /<a([^>]*?)href="(\/landing\/business[^"]*)"([^>]*)>/g,
    (match, before, href, after) => {
      if (/target=/.test(match)) return match;
      return `<a${before}href="${href}"${after} target="_top">`;
    },
  );
  out = out.replace(
    /<a([^>]*?)href="(\/business\/(?:register|login)[^"]*)"([^>]*)>/g,
    (match, before, href, after) => {
      if (/target=/.test(match)) return match;
      return `<a${before}href="${href}"${after} target="_top">`;
    },
  );
  return out;
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
  out = out.replace(
    /alt="(?:ビジネスマッチングの)?Ready Crew[^"]*"/g,
    'alt="JobShare Business"',
  );
  out = out.replace(/alt="Ready Crew"/g, 'alt="JobShare Business"');
  return out;
}

function injectAuthButtons(html) {
  let out = html;
  out = out.replace(
    /<span class="o-btn-bg__text">(?:資料請求|資料ダウンロード)<\/span>/g,
    '<span class="o-btn-bg__text">企業登録</span>',
  );
  out = out.replace(
    /<span class="o-btn-border__text">(?:お問い合わせ)<\/span>/g,
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
  return out;
}

function hideLoadingScreen(html) {
  return html.replace(/class="js-loading"/g, 'class="js-loading" style="display:none;"');
}

function injectBootstrap(html) {
  const boot = `<script src="${ASSET_PREFIX}jobshare-bootstrap.js"></script>`;
  if (html.includes('jobshare-bootstrap.js')) return html;
  return html.replace('</body>', `\t${boot}\n</body>`);
}

function injectOverrides(html) {
  const link = `<link rel="stylesheet" href="${ASSET_PREFIX}jobshare-overrides.css">`;
  if (html.includes('jobshare-overrides.css')) return html;
  return html.replace('</head>', `\t${link}\n</head>`);
}

function rebuildHeadScripts(html) {
  const essentialScripts = [
    `${ASSET_PREFIX}jquery.min.js`,
    `${ASSET_PREFIX}jquery.easing.min.js`,
    `${ASSET_PREFIX}slick.min.js`,
    `${ASSET_PREFIX}jquery.jscroll.min.js`,
    `${ASSET_PREFIX}picturefill.min.js`,
    `${ASSET_PREFIX}imagesloaded.pkgd.min.js`,
    `${ASSET_PREFIX}jquery.waypoints.min.js`,
    `${ASSET_PREFIX}jquery.matchHeight-min.js`,
    `${ASSET_PREFIX}jquery.counterup-2.0.js`,
    `${ASSET_PREFIX}barba.min.js`,
    `${ASSET_PREFIX}smooth-scroll.polyfills.min.js`,
    `${ASSET_PREFIX}swiper-bundle.min.js`,
    `${ASSET_PREFIX}jquery.marquee.min.js`,
    `${ASSET_PREFIX}simplebar.min.js`,
    `${ASSET_PREFIX}vivus.min.js`,
    `${ASSET_PREFIX}clipboard.min.js`,
    `${ASSET_PREFIX}app.js`,
  ];
  const scriptTags = essentialScripts.map((src) => `<script src="${src}"></script>`).join('\n\t');
  const pageModule = html.match(/<script type="module" src="[^"]*page-(news|seminar)\.js[^"]*"><\/script>/i);
  const moduleTag = pageModule
    ? `\n\t${pageModule[0].replace(/\/assets\/js\//g, ASSET_PREFIX).replace(/\.js\?[^"]+/, '.js')}`
    : '';

  let out = html;
  out = out.replace(/<script[^>]*src="(?:https?:)?\/\/[^"]+"[^>]*>\s*<\/script>\s*/gi, '');
  out = out.replace(/<script[^>]*src="\.\.\/assets\/[^"]+\.js[^"]*"[^>]*>\s*<\/script>\s*/gi, '');
  out = out.replace(/<script type="module" src="[^"]*page-(?:news|seminar)\.js[^"]*"><\/script>\s*/gi, '');

  const block = `\n\t${scriptTags}${moduleTag}\n`;
  if (/<link rel="stylesheet" href="\.\.\/assets\/style\.css"/i.test(out)) {
    return out.replace(
      /(<link rel="stylesheet" href="\.\.\/assets\/style\.css"[^>]*>)/i,
      `$1${block}`,
    );
  }
  return out.replace('</head>', `${block}</head>`);
}

async function downloadWpAssets(html) {
  const urls = [...new Set(html.match(/https:\/\/readycrew\.jp\/cms\/wp-content\/uploads\/[^"'>\s]+/g) || [])];
  let out = html;
  for (const url of urls) {
    const relative = url.replace('https://readycrew.jp/cms/wp-content/uploads/', '');
    const dest = path.join(WP_ASSETS_DIR, relative);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      try {
        const res = await fetch(url);
        if (res.ok) {
          fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
        }
      } catch {
        /* keep remote URL if download fails */
        continue;
      }
    }
    out = out.split(url).join(`${ASSET_PREFIX}wp-uploads/${relative}`);
  }
  return out;
}

async function buildSubpage(sourceFile, outFile, pageKey) {
  const srcPath = path.join(SRC_DIR, sourceFile);
  if (!fs.existsSync(srcPath)) {
    console.warn('Skip missing source:', srcPath);
    return;
  }
  let html = fs.readFileSync(srcPath, 'utf8');
  html = stripTracking(html);
  html = normalizeAssetRefs(html);
  html = await downloadWpAssets(html);
  html = applyLocalLinks(html);
  html = normalizeReadyCrewImageUrls(html, ASSET_PREFIX);
  html = applyGlobalTextBranding(html);
  html = applySubpageContent(html, pageKey);
  if (pageKey === 'about') {
    html = html.replace(
      /(<h1 class="page-news-article-main__heading">JobShare Businessとは<\/h1>)(\s*<\/header>)/,
      `$1<picture class="page-news-article-main__cover"><img src="${ASSET_PREFIX}${HERO_IMAGE_NAME}" alt="JobShare Business" /></picture>$2`,
    );
  }
  html = applyNavbar(html);
  html = injectAuthButtons(html);
  html = hideLoadingScreen(html);
  html = rebuildHeadScripts(html);
  html = injectBootstrap(html);
  html = injectOverrides(html);
  fs.writeFileSync(path.join(OUT_DIR, outFile), html, 'utf8');
  console.log('Built subpage:', outFile);
}

async function build() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  ensureHeroAssets(OUT_ASSETS);
  for (const page of SUBPAGE_SOURCES) {
    await buildSubpage(page.sourceFile, page.outFile, page.page);
  }
  console.log('Subpages output:', OUT_DIR);
}

build();
