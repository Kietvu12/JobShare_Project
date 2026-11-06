import fs from 'fs';
import path from 'path';

/** Decode latest or given CDP Page.captureScreenshot JSON into PNG. */
const jsonPath = process.argv[2];
const outPath = process.argv[3];
const logDir =
  process.env.CURSOR_BROWSER_LOG_DIR ||
  path.join(process.env.USERPROFILE || '', '.cursor', 'browser-logs');

function resolveJson(input) {
  if (input && input !== 'latest') return input;
  const files = fs
    .readdirSync(logDir)
    .filter((f) => f.startsWith('cdp-response-Page.captureScreenshot-') && f.endsWith('.json'))
    .map((f) => ({ f, m: fs.statSync(path.join(logDir, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  if (!files.length) throw new Error(`No CDP screenshots in ${logDir}`);
  return path.join(logDir, files[0].f);
}

const src = resolveJson(jsonPath);
const raw = fs.readFileSync(src, 'utf8');
const j = JSON.parse(raw);
const b = j.result?.data ?? j.data;
if (!b) {
  console.error('No screenshot data in', src);
  process.exit(1);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, Buffer.from(b, 'base64'));
console.log(outPath, fs.statSync(outPath).size);
