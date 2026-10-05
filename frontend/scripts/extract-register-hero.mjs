import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, '../src/assets/JobShare_Business_Register_JA_V1.html');
const outPath = path.join(__dirname, '../src/assets/business-register-hero.jpg');
const cssPath = path.join(__dirname, '../src/page/Bussiness/businessRegister.css');

const s = fs.readFileSync(htmlPath, 'utf8');
const styleStart = s.indexOf('<style>');
const styleEnd = s.indexOf('</style>');
const css = styleStart >= 0 && styleEnd > styleStart ? s.slice(styleStart + 7, styleEnd) : '';
fs.writeFileSync(cssPath, css, 'utf8');

const imgMatch = s.match(/<img src="(data:image\/[^"]+)"/);
if (imgMatch) {
  const dataUrl = imgMatch[1];
  const [, meta, b64] = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/) || [];
  if (b64) {
    const ext = meta.includes('jpeg') || meta.includes('jpg') ? 'jpg' : 'png';
    const finalPath = outPath.replace(/\.jpg$/, `.${ext}`);
    fs.writeFileSync(finalPath, Buffer.from(b64, 'base64'));
    console.log('Wrote', finalPath);
  }
}
console.log('Wrote CSS', cssPath.length, 'bytes');
