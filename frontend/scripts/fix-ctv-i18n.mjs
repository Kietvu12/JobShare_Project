/**
 * Replace user-facing "CTV" in EN/JA businessApp i18n (keep Vietnamese CTV).
 * EN: Collaborator / Collaborator Marketplace
 * JA: 採用パートナー / 採用パートナーマーケット
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/i18n/businessApp');

const FILES = [
  'candidateSharing.js',
  'candidates.js',
  'messages.js',
  'applications.js',
  'jdBuilder.js',
  'homepageExtras.js',
  'landingSeo.js',
  'homeProposal.js',
];

function replaceEn(s) {
  return s
    .replace(/CTV Marketplace/g, 'Collaborator Marketplace')
    .replace(/CTV marketplace/g, 'Collaborator marketplace')
    .replace(/WS CTVs/g, 'WS collaborators')
    .replace(/WS CTV/g, 'WS collaborator')
    .replace(/JobShare CTVs/g, 'JobShare collaborators')
    .replace(/JobShare CTV/g, 'JobShare collaborator')
    .replace(/Recruiting CTV/g, 'Recruiting collaborator')
    .replace(/5-star CTVs/g, '5-star collaborators')
    .replace(/Active CTVs/g, 'Active collaborators')
    .replace(/low-rated CTVs/g, 'low-rated collaborators')
    .replace(/CTVs/g, 'Collaborators')
    .replace(/CTV partners/g, 'collaborator partners')
    .replace(/CTV interest/g, 'Collaborator interest')
    .replace(/CTV interests/g, 'collaborator interests')
    .replace(/CTV nominations/g, 'Collaborator nominations')
    .replace(/CTV referral/g, 'Collaborator referral')
    .replace(/CTV code/g, 'Collaborator code')
    .replace(/CTV info/g, 'Collaborator info')
    .replace(/CTV support/g, 'collaborator support')
    .replace(/CTV:/g, 'Collaborator:')
    .replace(/chat with CTV/g, 'chat with collaborator')
    .replace(/from CTV/g, 'from collaborator')
    .replace(/pay CTVs/g, 'pay collaborators')
    .replace(/— CTV/g, '— Collaborator')
    .replace(/· CTV/g, '· Collaborator')
    .replace(/\/CTV\)/g, '/Collaborator)')
    .replace(/Search CTV,/g, 'Search collaborator,')
    .replace(/Minimum CTV rating/g, 'Minimum collaborator rating')
    .replace(/Transparent CTV /g, 'Transparent collaborator ')
    .replace(/set CTV /g, 'set collaborator ')
    .replace(/No CTV /g, 'No collaborator ')
    .replace(/'CTV'/g, "'Collaborator'")
    .replace(/"CTV"/g, '"Collaborator"')
    .replace(/\bCTV\b/g, 'Collaborator');
}

function replaceJa(s) {
  return s
    .replace(/CTVマーケット/g, '採用パートナーマーケット')
    .replace(/WS CTV/g, 'WS採用パートナー')
    .replace(/JobShare CTV/g, 'JobShare採用パートナー')
    .replace(/採用CTV/g, '採用パートナー')
    .replace(/担当CTV/g, '担当パートナー')
    .replace(/アクティブCTV/g, 'アクティブ採用パートナー')
    .replace(/CTV関心/g, 'パートナー関心')
    .replace(/CTV推薦/g, 'パートナー推薦')
    .replace(/CTV報酬/g, 'パートナー報酬')
    .replace(/CTV情報/g, 'パートナー情報')
    .replace(/CTVからの/g, '採用パートナーからの')
    .replace(/CTVが/g, '採用パートナーが')
    .replace(/CTV・/g, '採用パートナー・')
    .replace(/CTV、/g, '採用パートナー、')
    .replace(/CTV HR/g, '採用パートナー HR')
    .replace(/（WS\/CTV）/g, '（WS／採用パートナー）')
    .replace(/'CTV'/g, "'採用パートナー'")
    .replace(/"CTV"/g, '"採用パートナー"')
    .replace(/\bCTV\b/g, '採用パートナー');
}

/** Extract top-level `en: { ... },` / `ja: { ... },` blocks by brace counting after `en:` / `ja:` */
function transformLocaleBlocks(src, locale, replacer) {
  const marker = `\n  ${locale}:`;
  let from = 0;
  let out = '';
  let guard = 0;
  while (guard++ < 20) {
    const idx = src.indexOf(marker, from);
    if (idx === -1) {
      out += src.slice(from);
      break;
    }
    out += src.slice(from, idx);
    const braceStart = src.indexOf('{', idx);
    if (braceStart === -1) {
      out += src.slice(idx);
      break;
    }
    let depth = 0;
    let i = braceStart;
    for (; i < src.length; i++) {
      const ch = src[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          i++;
          break;
        }
      }
    }
    const block = src.slice(idx, i);
    out += replacer(block);
    from = i;
  }
  return out;
}

let total = 0;
for (const file of FILES) {
  const fp = path.join(dir, file);
  if (!fs.existsSync(fp)) continue;
  let src = fs.readFileSync(fp, 'utf8');
  const before = src;
  src = transformLocaleBlocks(src, 'en', replaceEn);
  src = transformLocaleBlocks(src, 'ja', replaceJa);

  // homeProposal has module-level map without en/ja nesting
  if (file === 'homeProposal.js') {
    src = src.replace(/'hr-partner-network': 'CTV Marketplace'/, "'hr-partner-network': 'Collaborator Marketplace'");
  }

  if (src !== before) {
    fs.writeFileSync(fp, src);
    const n = (before.match(/CTV/g) || []).length - (src.match(/CTV/g) || []).length;
    total += n;
    console.log(`updated ${file} (CTV refs reduced by ~${n})`);
  } else {
    console.log(`unchanged ${file}`);
  }
}

// Verify remaining CTV in en/ja user strings
for (const file of FILES) {
  const fp = path.join(dir, file);
  if (!fs.existsSync(fp)) continue;
  const src = fs.readFileSync(fp, 'utf8');
  const enBlock = transformLocaleBlocks(`\n  en:${src.includes('en:') ? '' : ''}`, 'en', (x) => x); // noop check
  // simple: list lines with CTV that are not Vietnamese comments / keys
  const lines = src.split('\n');
  const hits = [];
  let locale = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*en:\s*\{/.test(line)) locale = 'en';
    else if (/^\s*ja:\s*\{/.test(line)) locale = 'ja';
    else if (/^\s*vi:\s*\{/.test(line)) locale = 'vi';
    if ((locale === 'en' || locale === 'ja') && /\bCTV\b|CTVマーケット/.test(line) && !/ctv[_A-Za-z]|key:|iconKey|filterId|value: 'ctv/.test(line)) {
      hits.push(`${file}:${i + 1}: ${line.trim().slice(0, 120)}`);
    }
  }
  if (hits.length) {
    console.log('REMAINING:');
    hits.forEach((h) => console.log(' ', h));
  }
}

console.log('done, approx CTV reductions:', total);
