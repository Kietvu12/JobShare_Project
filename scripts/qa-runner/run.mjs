/**
 * Chạy QA screenshot script (Playwright cài trong thư mục này).
 * Ví dụ:
 *   node run.mjs
 *   QA_HEADED=1 node run.mjs --only=scout-direct,scout-managed,branding,partner
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.resolve(here, '../qa-production-step-screenshots.mjs');
const nodeModules = path.join(here, 'node_modules');

const result = spawnSync(process.execPath, [script, ...process.argv.slice(2)], {
  cwd: here,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_PATH: [nodeModules, process.env.NODE_PATH].filter(Boolean).join(path.delimiter),
  },
});

process.exit(result.status ?? 1);
