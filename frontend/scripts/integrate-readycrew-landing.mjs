/**
 * Chuyển ReadyCrew TS → JSX/JS (phiên bản an toàn hơn).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src/page/LandingPage/Business/readycrew');
const ASSET_PREFIX = '/landing/business/assets';

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function stripTypeScript(source) {
  let out = source;
  out = out.replace(/^import type .* from .*;\r?\n/gm, '');
  out = out.replace(/^import \{([^}]*)\} type ([^}]+)\} from .*;\r?\n/gm, '');
  out = out.replace(/^export type [\s\S]*?\}\r?\n\r?\n/gm, '');
  out = out.replace(/^export type .*;\r?\n/gm, '');
  out = out.replace(/\bas const\b/g, '');
  out = out.replace(/\(([^)]*)\):\s*[A-Za-z0-9_<>,\[\]| ]+\s*=>/g, '($1) =>');
  out = out.replace(/function\s+([A-Za-z0-9_]+)\(([^)]*)\):\s*[A-Za-z0-9_<>,\[\]| ]+\s*\{/g, 'function $1($2) {');
  out = out.replace(/\}\s*:\s*\{[\s\S]*?\}\)\s*\{/g, '}) {');
  out = out.replace(/export const ([A-Z_0-9]+):\s*[A-Za-z0-9_<>,\[\]| ]+\s*=/g, 'export const $1 =');
  out = out.replace(/:\s*RefObject<[^>]+>/g, '');
  out = out.replace(/:\s*HTMLLinkElement \| null/g, '');
  out = out.replace(/:\s*path is NavRoute/g, '');
  out = out.replace(/ as DOMNode\[\]/g, '');
  out = out.replace(/ as readonly string\[\]/g, '');
  out = out.replace(/Promise<void>/g, 'Promise');
  out = out.replace(/extra:\s*string\[\]/g, 'extra');
  return out;
}

function rewritePaths(source) {
  return source.replace(/(['"])\/assets\//g, `$1${ASSET_PREFIX}/`);
}

function updateImports(source) {
  return source
    .replace(/from '(\.\.?\/[^']+)\.tsx'/g, "from '$1.jsx'")
    .replace(/from '(\.\.?\/[^']+)\.ts'/g, "from '$1.js'");
}

const files = walk(ROOT);
const toDelete = [];

for (const file of files) {
  if (file.endsWith('.tsx')) {
    const next = file.replace(/\.tsx$/, '.jsx');
    let content = stripTypeScript(fs.readFileSync(file, 'utf8'));
    content = rewritePaths(content);
    content = updateImports(content);
    fs.writeFileSync(next, content, 'utf8');
    toDelete.push(file);
  } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
    const next = file.replace(/\.ts$/, '.js');
    let content = stripTypeScript(fs.readFileSync(file, 'utf8'));
    content = rewritePaths(content);
    content = updateImports(content);
    fs.writeFileSync(next, content, 'utf8');
    toDelete.push(file);
  } else if (file.endsWith('.html') || file.endsWith('.css')) {
    const content = rewritePaths(fs.readFileSync(file, 'utf8'));
    fs.writeFileSync(file, content, 'utf8');
  }
}

for (const file of toDelete) fs.unlinkSync(file);
['App.tsx', 'App.jsx', 'main.tsx', 'main.jsx'].forEach((name) => {
  const p = path.join(ROOT, name);
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

console.log(`Converted ${toDelete.length} files`);
