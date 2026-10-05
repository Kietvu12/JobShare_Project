import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, '../src/assets/JobShare_Business_Download_JA_V2_1 (1).html');
const s = fs.readFileSync(htmlPath, 'utf8');

const styleStart = s.indexOf('<style>');
const styleEnd = s.indexOf('</style>');
const css = s.slice(styleStart + 7, styleEnd);
const scoped = css
  .replace(/\bbody\b/g, '.jd-download-page')
  .replace(/html\{scroll-behavior:smooth\}/, '');
fs.writeFileSync(path.join(__dirname, '../src/page/LandingPage/Business/readycrew/pages/download/businessDownload.css'), scoped, 'utf8');

const imgMatch = s.match(/<img src="(data:image\/[^"]+)"/);
if (imgMatch) {
  const dataUrl = imgMatch[1];
  const m = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (m) {
    const ext = m[1].includes('png') ? 'png' : 'jpg';
    const out = path.join(__dirname, `../src/assets/business-download-hero.${ext}`);
    fs.writeFileSync(out, Buffer.from(m[2], 'base64'));
    console.log('hero', out);
  }
}

const pdfMatch = s.match(/const PDF_DATA="(data:application\/pdf;base64,[^"]+)"/);
if (pdfMatch) {
  const b64 = pdfMatch[1].replace(/^data:application\/pdf;base64,/, '');
  const pdfBuf = Buffer.from(b64, 'base64');
  const publicDir = path.join(__dirname, '../public/documents');
  fs.mkdirSync(publicDir, { recursive: true });
  fs.mkdirSync(path.join(__dirname, '../../backend/assets/business'), { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'JobShare_Business_Service_Guide.pdf'), pdfBuf);
  fs.writeFileSync(path.join(__dirname, '../../backend/assets/business/JobShare_Business_Service_Guide.pdf'), pdfBuf);
  console.log('pdf bytes', pdfBuf.length);
}

console.log('css bytes', scoped.length);
