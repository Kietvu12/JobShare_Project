import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const htmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/assets/JobShare_Business_Contact_JA_V2_1 (1).html');
const s = fs.readFileSync(htmlPath, 'utf8');
const styleStart = s.indexOf('<style>');
const styleEnd = s.indexOf('</style>');
console.log('CSS', s.slice(styleStart + 7, styleEnd).length);
const body = s.slice(s.indexOf('<body'), s.indexOf('</body>')).replace(/src="data:[^"]+"/g, '[base64]');
console.log(body.slice(0, 20000));
const scriptStart = s.indexOf('<script');
if (scriptStart > 0) console.log('\nSCRIPT\n', s.slice(scriptStart, Math.min(scriptStart + 4000, s.length)));
