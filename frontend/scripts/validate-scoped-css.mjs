/**
 * Fail CI if scoped landing CSS still contains global leaks (parser regressions).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const fe = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'src/landing/candidates/candidate-styles.scoped.css',
  'src/landing/collaborators/collaborator-styles.scoped.css',
  'src/landing/shared/Jobs/jobs-v3-styles.scoped.css',
];

const forbidden = [
  { re: /\{html\{/g, msg: 'unscoped html{' },
  { re: /\*,\*:(before|after)\{/g, msg: 'global *,*:before,*:after reset' },
  { re: /:is\([^)]+\)\s+@media/g, msg: '@media embedded in selector (parser bug)' },
];

let failed = false;
for (const rel of files) {
  const css = fs.readFileSync(path.join(fe, rel), 'utf8');
  for (const { re, msg } of forbidden) {
    re.lastIndex = 0;
    if (re.test(css)) {
      console.error(`${rel}: ${msg}`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}
console.log('scoped landing CSS OK');
