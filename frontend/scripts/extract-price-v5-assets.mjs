import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, '../src/assets/JobShare_Business_VI_V5 (1).html');
const cssOut = path.join(__dirname, '../src/page/LandingPage/Business/readycrew/pages/price/businessPriceV5.css');
const fragmentOut = path.join(__dirname, '../src/assets/JobShare_Business_Price_V5/integration/content-vi.html');

const s = fs.readFileSync(htmlPath, 'utf8');
if (s.length < 8000) {
  console.error('HTML too short — file may be truncated. Expected full JobShare_Business_VI_V5 export.');
  process.exit(1);
}

const styles = [...s.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
const scoped = styles
  .replace(/\bbody\b/g, '.jp-price-page')
  .replace(/html\{scroll-behavior:smooth\}/, '');
fs.mkdirSync(path.dirname(fragmentOut), { recursive: true });
fs.writeFileSync(cssOut, scoped, 'utf8');

const body = s.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || '';
const fragment = body.replace(/<script[\s\S]*?<\/script>/gi, '').trim();
fs.writeFileSync(fragmentOut, fragment, 'utf8');
console.log('Wrote CSS', cssOut);
console.log('Wrote fragment', fragmentOut, fragment.length, 'chars');

const imgMatch = s.match(/<img src="(data:image\/[^"]+)"/);
if (imgMatch) {
  const dataUrl = imgMatch[1];
  const m = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (m) {
    const ext = m[1].includes('png') ? 'png' : 'jpg';
    const out = path.join(__dirname, `../src/assets/business-price-hero.${ext}`);
    fs.writeFileSync(out, Buffer.from(m[2], 'base64'));
    console.log('hero', out);
  }
}
