/**
 * Nhúng lại vector DB cho tất cả hồ sơ đang trên sàn Scout (scout_status = LISTED).
 *
 * Usage (từ thư mục backend):
 *   node scripts/reembed-scout-listed-cvs.js
 *   node scripts/reembed-scout-listed-cvs.js --dry-run
 *   node scripts/reembed-scout-listed-cvs.js --limit=50
 *   node scripts/reembed-scout-listed-cvs.js --delay=800
 *   node scripts/reembed-scout-listed-cvs.js --cv-id=12345
 *
 * Env (tuỳ chọn, trong backend/.env):
 *   AI_API_BASE_URL=https://test.ws-jobshare.com/api_ai
 */

import { loadBackendEnv } from './loadBackendEnv.js';

loadBackendEnv();

const { default: sequelize } = await import('../src/config/database.js');
const { CVStorage } = await import('../src/models/index.js');
const { SCOUT_LISTING_STATUS } = await import('../src/constants/scoutCredit.js');

const AI_API_BASE = (
  process.env.AI_API_BASE_URL
  || process.env.VITE_AI_API_BASE_URL
  || 'https://test.ws-jobshare.com/api_ai'
).replace(/\/+$/, '');

function parseArgs(argv) {
  const opts = {
    dryRun: false,
    limit: null,
    delayMs: 400,
    cvId: null,
  };

  for (const arg of argv) {
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg.startsWith('--limit=')) opts.limit = Math.max(1, parseInt(arg.slice(8), 10) || 0) || null;
    else if (arg.startsWith('--delay=')) opts.delayMs = Math.max(0, parseInt(arg.slice(8), 10) || 0);
    else if (arg.startsWith('--cv-id=')) opts.cvId = parseInt(arg.slice(8), 10) || null;
  }

  return opts;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function vectorUrl(cvId) {
  return `${AI_API_BASE}/v2/vector/cv/${encodeURIComponent(String(cvId))}`;
}

async function postCvVector(cvId) {
  const response = await fetch(vectorUrl(cvId), { method: 'POST' });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${body || response.statusText}`);
  }
  return response;
}

async function markDone(cv) {
  cv.vectorSyncStatus = 'vector_done';
  cv.vectorSyncCompletedAt = new Date();
  cv.vectorSyncLastError = null;
  await cv.save();
}

async function markFailed(cv, error) {
  cv.vectorSyncStatus = 'vector_failed';
  cv.vectorSyncRetryCount = Number(cv.vectorSyncRetryCount || 0) + 1;
  cv.vectorSyncLastError = String(error?.message || error).slice(0, 2000);
  await cv.save();
}

async function loadScoutListedCvs({ limit, cvId }) {
  const where = { scoutStatus: SCOUT_LISTING_STATUS.LISTED };
  if (cvId) where.id = cvId;

  return CVStorage.findAll({
    where,
    attributes: [
      'id', 'code', 'name', 'isParse', 'status',
      'vectorSyncStatus', 'vectorSyncRetryCount', 'scoutListedAt',
    ],
    order: [['scoutListedAt', 'DESC'], ['id', 'ASC']],
    ...(limit ? { limit } : {}),
  });
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  console.log('[reembed-scout] AI base:', AI_API_BASE);
  console.log('[reembed-scout] options:', opts);

  const cvs = await loadScoutListedCvs(opts);
  if (!cvs.length) {
    console.log('[reembed-scout] Không có hồ sơ Scout LISTED nào.');
    await sequelize.close();
    return;
  }

  console.log(`[reembed-scout] Tìm thấy ${cvs.length} hồ sơ Scout LISTED.`);

  const stats = { ok: 0, fail: 0, skip: 0 };

  for (let i = 0; i < cvs.length; i += 1) {
    const cv = cvs[i];
    const label = `#${cv.id} ${cv.code || ''} ${cv.name || ''}`.trim();
    const prefix = `[${i + 1}/${cvs.length}]`;

    if (!cv.isParse) {
      console.warn(`${prefix} SKIP (chưa parse): ${label}`);
      stats.skip += 1;
      continue;
    }

    if (opts.dryRun) {
      console.log(`${prefix} DRY-RUN → POST ${vectorUrl(cv.id)}`);
      stats.ok += 1;
      continue;
    }

    cv.vectorSyncStatus = 'vector_processing';
    cv.vectorSyncRequestedAt = new Date();
    cv.vectorSyncLastError = null;
    await cv.save();

    try {
      await postCvVector(cv.id);
      await markDone(cv);
      console.log(`${prefix} OK: ${label}`);
      stats.ok += 1;
    } catch (error) {
      await markFailed(cv, error);
      console.error(`${prefix} FAIL: ${label} — ${error.message}`);
      stats.fail += 1;
    }

    if (opts.delayMs > 0 && i < cvs.length - 1) {
      await sleep(opts.delayMs);
    }
  }

  console.log('[reembed-scout] Hoàn tất:', stats);
  await sequelize.close();
}

main().catch(async (error) => {
  console.error('[reembed-scout] Lỗi:', error);
  try {
    await sequelize.close();
  } catch {
    /* ignore */
  }
  process.exitCode = 1;
});
