import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, '../src/assets/JobShare_Business_VI_V6 (2).html');
const outDir = path.join(__dirname, '../src/page/LandingPage/Business/readycrew/pages/price');
const fragmentDir = path.join(__dirname, '../src/assets/JobShare_Business_Price_V6/integration');

const s = fs.readFileSync(htmlPath, 'utf8');
if (s.length < 50000) {
  console.error('HTML too short');
  process.exit(1);
}

const styles = [...s.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
  .map((m) => m[1])
  .filter((css) => css.length > 200)
  .join('\n');

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(fragmentDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'jobshare-business-v6.css'), styles, 'utf8');

const mainMatch = s.match(/<main class="jsb6"[\s\S]*?<\/main>/i);
if (!mainMatch) {
  console.error('main.jsb6 not found');
  process.exit(1);
}
fs.writeFileSync(path.join(fragmentDir, 'content-vi.html'), mainMatch[0], 'utf8');

const scriptMatch = s.match(/<script>\s*\(\s*function\s*\(\s*global\s*\)[\s\S]*?global\.JobShareBusinessV6=\{init\};\s*\}\)\(window\);\s*<\/script>/i);
if (!scriptMatch) {
  console.error('JobShareBusinessV6 script not found');
  process.exit(1);
}
const jsBody = scriptMatch[0]
  .replace(/^<script>/i, '')
  .replace(/<\/script>$/i, '')
  .replace(/<script>JobShareBusinessV6\.init\(document\.querySelector\("\.jsb6"\)\);<\/script>$/i, '');
fs.writeFileSync(path.join(outDir, 'jobshare-business-v6.js'), jsBody.trim() + '\n', 'utf8');

const title = s.match(/<title>([^<]*)<\/title>/i)?.[1] || '';
const desc = s.match(/<meta name="description" content="([^"]*)"/i)?.[1] || '';
console.log('CSS bytes', styles.length);
console.log('fragment bytes', mainMatch[0].length);
console.log('JS bytes', jsBody.length);
console.log('title', title);
