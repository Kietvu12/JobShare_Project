/**
 * Prefix CSS selectors so landing template rules only apply inside persona shells.
 * Handles @media / @keyframes blocks recursively.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOTS = ':is(#candidate-site-root, #collaborator-site-root)';
const PERSONA_BODY = 'body:is(.jobshare-candidate-v1, .jobshare-collaborator-v3)';

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Catch rules still missing persona / shell prefix (e.g. inside @media). */
function postTighten(css) {
  let out = css;
  out = out.replace(/body:lang\(/g, `${PERSONA_BODY}:lang(`);
  // Rule thẻ trần theo ngôn ngữ (vd. `:lang(ja) h2{font-size:40px}`) nằm ngoài @layer nên thắng utility Tailwind
  // của các trang React trong shell — bỏ qua phần tử đã tự đặt cỡ chữ bằng class `text-*`.
  out = out.replace(
    new RegExp(`(${PERSONA_BODY.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:lang\\([a-z-]+\\) )(h[1-6]|p|li)(?=[,{])`, 'g'),
    '$1$2:not([class*="text-"])',
  );
  out = out.replace(/(^|[^:])body\{/g, `$1${PERSONA_BODY}{`);
  // Parser used to treat "\n@media(...)" as selector text — unwrap nested @ blocks.
  out = out.replace(
    new RegExp(`${ROOTS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*@media`, 'g'),
    '@media',
  );
  out = out.replace(/\bhtml\{/g, `${ROOTS}{`);
  out = out.replace(
    /(^|[\{}])\*,\*:(before|after)\{/g,
    `$1${ROOTS} *,${ROOTS} *:before,${ROOTS} *:after{`,
  );
  out = out.replace(
    /(^|[\};])([.#][a-zA-Z0-9_-][^{@]*?)\{/g,
    (match, before, sel) => {
      const s = sel.trim();
      if (!s || s.includes('#candidate-site-root') || s.includes('body:is(')) {
        return match;
      }
      if (s.startsWith('@')) return match;
      return `${before}${scopeRuleBlock(s)}{`;
    },
  );
  return out;
}

function splitSelectors(selectorText) {
  const parts = [];
  let cur = '';
  let p = 0;
  for (let i = 0; i < selectorText.length; i += 1) {
    const ch = selectorText[i];
    if (ch === '(') p += 1;
    else if (ch === ')') p -= 1;
    else if (ch === ',' && p === 0) {
      parts.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

function scopeOneSelector(sel) {
  const s = sel.trim();
  if (!s) return s;
  if (s.startsWith('@')) return s;

  // Keep keyframes steps / vendor pseudos untouched
  if (/^(\d+\.\d+%|from|to)$/.test(s)) return s;

  if (s === ':root' || s === 'html') {
    return ROOTS;
  }

  // body{...} typography — only when persona body class is set (see layout useEffect)
  if (s === 'body' || s.startsWith('body:')) {
    return s.replace(/^body/, 'body:is(.jobshare-candidate-v1, .jobshare-collaborator-v3)');
  }

  // Already scoped
  if (s.includes('#candidate-site-root') || s.includes('#collaborator-site-root')) {
    return s;
  }

  return `${ROOTS} ${s}`;
}

function scopeRuleBlock(selectorText) {
  const scoped = splitSelectors(selectorText)
    .map(scopeOneSelector)
    .filter(Boolean)
    .join(',');
  return scoped || selectorText;
}

function scopeCss(css) {
  let out = '';
  let i = 0;

  while (i < css.length) {
    while (i < css.length && /\s/.test(css[i])) {
      i += 1;
    }
    if (i >= css.length) break;

    if (css[i] === '@') {
      const semi = css.indexOf(';', i);
      const brace = css.indexOf('{', i);
      if (semi !== -1 && (brace === -1 || semi < brace)) {
        out += css.slice(i, semi + 1);
        i = semi + 1;
        continue;
      }
      if (brace === -1) {
        out += css.slice(i);
        break;
      }
      const header = css.slice(i, brace + 1);
      out += header;
      i = brace + 1;
      let depth = 1;
      let j = i;
      while (j < css.length && depth > 0) {
        if (css[j] === '{') depth += 1;
        else if (css[j] === '}') depth -= 1;
        j += 1;
      }
      const inner = css.slice(i, j - 1);
      out += scopeCss(inner);
      out += '}';
      i = j;
      continue;
    }

    const open = css.indexOf('{', i);
    if (open === -1) {
      out += css.slice(i);
      break;
    }
    const selectorText = css.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth += 1;
      else if (css[j] === '}') depth -= 1;
      j += 1;
    }
    const body = css.slice(open + 1, j - 1);
    out += `${scopeRuleBlock(selectorText)}{${body}}`;
    i = j;
  }

  return out;
}

function run(inFile, outFile) {
  const css = stripComments(fs.readFileSync(inFile, 'utf8'));
  const scoped = postTighten(scopeCss(css));
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(
    outFile,
    `/* AUTO-GENERATED — scope-css-selectors.mjs. Do not edit. Source: ${path.basename(inFile)} */\n${scoped}`,
  );
  console.log('scoped', inFile, '->', outFile);
}

const base = path.dirname(fileURLToPath(import.meta.url));
const fe = path.join(base, '..');

run(
  path.join(fe, 'src/landing/templates/JobShare_Candidate_V1_1_20261006/styles.css'),
  path.join(fe, 'src/landing/candidates/candidate-styles.scoped.css'),
);
run(
  path.join(fe, 'src/landing/templates/JobShare_Collaborator_V3/styles.css'),
  path.join(fe, 'src/landing/collaborators/collaborator-styles.scoped.css'),
);

// Jobs V3 public list — only inside .jobshare-jobs-v3 under persona roots
const jobsBundle = ['jobs.css', 'filters-v3.css']
  .map((f) => fs.readFileSync(path.join(fe, `src/landing/templates/JobShare_Jobs_V3_20261007/dist/${f}`), 'utf8'))
  .join('\n');

const jobsScoped = postTighten(scopeCss(stripComments(jobsBundle))).replaceAll(
  ROOTS,
  ':is(#candidate-site-root, #collaborator-site-root) .jobshare-jobs-v3',
);
fs.writeFileSync(
  path.join(fe, 'src/landing/shared/Jobs/jobs-v3-styles.scoped.css'),
  `/* AUTO-GENERATED — Jobs V3 scoped to .jobshare-jobs-v3 under persona shell */\n${jobsScoped}`,
);
console.log('scoped jobs v3 bundle');

const loginCss = fs.readFileSync(
  path.join(
    fe,
    'src/landing/templates/JobShare_Candidate_Login_V2_20261006/JobShare_Candidate_Login_V2_20261006/styles.css',
  ),
  'utf8',
);
const loginScoped = postTighten(scopeCss(stripComments(loginCss)))
  .replaceAll(ROOTS, '#jobshare-login-root')
  .replaceAll(PERSONA_BODY, 'body.jobshare-template-login');
const loginOut = path.join(fe, 'src/landing/shared/styles/login-template.scoped.css');
fs.writeFileSync(
  loginOut,
  `/* AUTO-GENERATED — login template scoped to #jobshare-login-root */\n${loginScoped}`,
);
console.log('scoped login template ->', loginOut);
