import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src/page/LandingPage/Business/readycrew/pages/home');
const ASSET_PREFIX = '/landing/business/assets';

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function strip(source) {
  let out = source;
  out = out.replace(/^import type .*(\r?\n)/gm, '');
  out = out.replace(/^export type [\s\S]*?\}\r?\n\r?\n/gm, '');
  out = out.replace(/^export type .*(\r?\n)/gm, '');
  out = out.replace(/^type Props = \{[\s\S]*?\}\r?\n\r?\n/gm, '');
  out = out.replace(/\bas const\b/g, '');
  out = out.replace(/\}\s*:\s*[A-Za-z0-9_]+\s*\)/g, '})');
  out = out.replace(/export const ([A-Za-z0-9_]+):\s*[A-Za-z0-9_<>,\[\]| ]+\s*=/g, 'export const $1 =');
  out = out.replace(
    /\{\.\.\.\(\{ datetime: item\.dateIso \} as Record<string, string>\)\}/g,
    'datetime={item.dateIso}',
  );
  return out;
}

const toDelete = [];
for (const file of walk(ROOT)) {
  if (file.endsWith('.tsx')) {
    const next = file.replace(/\.tsx$/, '.jsx');
    let content = strip(fs.readFileSync(file, 'utf8'));
    content = content.replace(/(['"])\/assets\//g, `$1${ASSET_PREFIX}/`);
    content = content.replace(/from '(\.\.?\/[^']+)\.tsx'/g, "from '$1.jsx'");
    content = content.replace(/from '(\.\.?\/[^']+)\.ts'/g, "from '$1.js'");
    fs.writeFileSync(next, content, 'utf8');
    toDelete.push(file);
  } else if (file.endsWith('.ts')) {
    const next = file.replace(/\.ts$/, '.js');
    let content = strip(fs.readFileSync(file, 'utf8'));
    content = content.replace(/(['"])\/assets\//g, `$1${ASSET_PREFIX}/`);
    content = content.replace(/from '(\.\.?\/[^']+)\.tsx'/g, "from '$1.jsx'");
    content = content.replace(/from '(\.\.?\/[^']+)\.ts'/g, "from '$1.js'");
    fs.writeFileSync(next, content, 'utf8');
    toDelete.push(file);
  }
}

for (const file of toDelete) fs.unlinkSync(file);
console.log(`Converted ${toDelete.length} home files`);
