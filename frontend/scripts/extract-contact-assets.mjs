import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, '../src/assets/JobShare_Business_Contact_JA_V2_1 (1).html');
const s = fs.readFileSync(htmlPath, 'utf8');
const styleStart = s.indexOf('<style>');
const styleEnd = s.indexOf('</style>');
let css = s.slice(styleStart + 7, styleEnd);
css = css.replace(/\bbody\b/g, '.jc-contact-page').replace(/html\{scroll-behavior:smooth\}/, '');
const outDir = path.join(__dirname, '../src/page/LandingPage/Business/readycrew/pages/contact');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'businessContact.css'), css, 'utf8');

const imgMatch = s.match(/<img src="(data:image\/[^"]+)"/);
if (imgMatch) {
  const m = imgMatch[1].match(/^data:(image\/\w+);base64,(.+)$/);
  if (m) {
    const ext = m[1].includes('png') ? 'png' : 'jpg';
    fs.writeFileSync(
      path.join(__dirname, `../src/assets/business-contact-hero.${ext}`),
      Buffer.from(m[2], 'base64'),
    );
  }
}
console.log('done');
