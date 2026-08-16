/** Shared local asset paths for JobShare Business landing + subpages */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

export const HERO_IMAGE_NAME = 'hero_bg_icon.png';
export const HERO_BADGE_IMAGE_NAME = 'hero_icon_JP.png';
export const LOGO_NAME = 'jobshare-logo.png';

const HERO_IMAGE_SRC = path.join(ROOT, 'src/assets/template_business/hero_bg_icon.png');
const HERO_BADGE_IMAGE_SRC = path.join(ROOT, 'src/assets/template_business/hero_icon_JP.png');

/** readycrew.jp/assets/images/* → local flat assets filename */
export const ASSET_IMAGE_ALIASES = {
  'pages/page-proposal-visual.png': HERO_IMAGE_NAME,
  'pages/page-proposal-visual-sp.png': HERO_IMAGE_NAME,
  'pages/page-news-visual.png': HERO_IMAGE_NAME,
  'pages/page-news-visual-sp.png': HERO_IMAGE_NAME,
  'common/common-main-text.svg': LOGO_NAME,
  'common/footer-top-people-sp.png': 'footer-top-people.png',
  'common/hd_logo@2x.png': LOGO_NAME,
};

/** style.css ../images/* basename → local asset (or null to drop background) */
export const CSS_IMAGE_ALIASES = {
  'conversion-bnr-bg.png': 'conversion-bnr-people.png',
  'conversion-bnr-bg-sp.png': 'conversion-bnr-people.png',
};

export function resolveLocalImageName(relativePath) {
  const normalized = relativePath.replace(/^\//, '');
  if (ASSET_IMAGE_ALIASES[normalized]) {
    return ASSET_IMAGE_ALIASES[normalized];
  }
  const base = path.basename(normalized);
  if (ASSET_IMAGE_ALIASES[`common/${base}`]) {
    return ASSET_IMAGE_ALIASES[`common/${base}`];
  }
  return base;
}

export function normalizeReadyCrewImageUrls(html, assetPrefix) {
  let out = html;

  out = out.replace(/https:\/\/readycrew\.jp\/assets\/images\/([^"'>\s]+)/g, (_match, rel) => {
    return `${assetPrefix}${resolveLocalImageName(rel)}`;
  });

  out = out.replace(
    /(<img[^>]*class="[^"]*(?:page-proposal-visual__picture-body|page-news-visual__picture-body|page-news-article-main__cover|footer-top-conversion__picture-body)[^"]*"[^>]*src=")#(")/g,
    `$1${assetPrefix}${HERO_IMAGE_NAME}$2`,
  );

  out = out.replace(
    /https:\/\/frontier-gr\.jp\/wp\/wp-content\/uploads\/[^"'>\s]+/g,
    `${assetPrefix}${HERO_IMAGE_NAME}`,
  );

  out = out.replace(
    /(<img[^>]+)src="#"([^>]*>)/g,
    `$1src="${assetPrefix}${HERO_IMAGE_NAME}"$2`,
  );

  out = out.replace(/footer-top-people-sp\.png/g, 'footer-top-people.png');

  return out;
}

export function patchImagePathsInCss(css, assetsDir) {
  return css.replace(/url\("\.\.\/images\/[^"]+\/([^"/]+)"\)/g, (_match, filename) => {
    const mapped = CSS_IMAGE_ALIASES[filename] || filename;
    if (mapped === 'none') {
      return 'none';
    }
    if (fs.existsSync(path.join(assetsDir, mapped))) {
      return `url("${mapped}")`;
    }
    return 'none';
  });
}

export function ensureHeroAssets(outAssetsDir) {
  fs.mkdirSync(outAssetsDir, { recursive: true });
  const copies = [
    [HERO_IMAGE_SRC, HERO_IMAGE_NAME],
    [HERO_BADGE_IMAGE_SRC, HERO_BADGE_IMAGE_NAME],
  ];
  for (const [src, name] of copies) {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(outAssetsDir, name));
    }
  }
}
