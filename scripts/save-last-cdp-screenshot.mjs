import fs from 'fs';
import path from 'path';

const jsonPath = process.argv[2];
const outPath = process.argv[3];
if (!jsonPath || !outPath) {
  console.error('Usage: node save-last-cdp-screenshot.mjs <cdp-json> <out.png>');
  process.exit(1);
}

const raw = fs.readFileSync(jsonPath, 'utf8');
const j = JSON.parse(raw);
const b = j.result?.data ?? j.data;
if (!b) {
  console.error('No screenshot data in', jsonPath, Object.keys(j));
  process.exit(1);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, Buffer.from(b, 'base64'));
console.log(outPath, fs.statSync(outPath).size);
