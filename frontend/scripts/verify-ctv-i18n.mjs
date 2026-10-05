import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/i18n/businessApp');
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  let locale = null;
  let depth = 0;
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*en:\s*\{/.test(line)) {
      locale = 'en';
      depth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      continue;
    }
    if (/^\s*ja:\s*\{/.test(line)) {
      locale = 'ja';
      depth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      continue;
    }
    if (/^\s*vi:\s*\{/.test(line)) {
      locale = 'vi';
      depth = 0;
      continue;
    }
    if (locale === 'en' || locale === 'ja') {
      depth += (line.match(/\{/g) || []).length;
      depth -= (line.match(/\}/g) || []).length;
      if (/\bCTV\b/.test(line) && !line.trim().startsWith('//')) {
        console.log(`${f}:${i + 1} [${locale}] ${line.trim().slice(0, 140)}`);
      }
      if (depth <= 0) locale = null;
    }
  }
}
const he = fs.readFileSync(path.join(dir, 'homepageExtras.js'), 'utf8');
const en = he.slice(he.indexOf('solutionCardsEn'), he.indexOf('solutionCardsJa'));
const ja = he.slice(he.indexOf('solutionCardsJa'), he.indexOf('const newsVi'));
console.log('extras EN CTV', (en.match(/CTV/g) || []).length);
console.log('extras JA CTV', (ja.match(/CTV/g) || []).length);
