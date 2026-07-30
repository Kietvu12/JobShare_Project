import crypto from 'crypto';
import { Op } from 'sequelize';
import { Job } from '../models/index.js';

const SLUG_MAX_LEN = 220;
const RANDOM_SUFFIX_LEN = 6;
const MAX_ATTEMPTS = 24;

export function slugifyJob(text) {
  return (
    String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, SLUG_MAX_LEN) || 'job'
  );
}

function randomSlugSuffix(length = RANDOM_SUFFIX_LEN) {
  return crypto
    .randomBytes(Math.ceil(length * 0.75))
    .toString('base64url')
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, length)
    .toLowerCase() || crypto.randomBytes(3).toString('hex');
}

async function slugTaken(slug, { excludeId = null, transaction = null } = {}) {
  const where = { slug };
  if (excludeId != null) where.id = { [Op.ne]: excludeId };
  const opts = { where };
  if (transaction) opts.transaction = transaction;
  const existing = await Job.findOne(opts);
  return !!existing;
}

/**
 * Returns a job slug that is not used in `jobs.slug`.
 * If `baseSlug` is free, returns it (normalized). Otherwise appends `-` + random chars.
 */
export async function ensureUniqueJobSlug(baseSlug, { excludeId = null, transaction = null } = {}) {
  const base = slugifyJob(baseSlug);
  if (!(await slugTaken(base, { excludeId, transaction }))) {
    return base;
  }

  const trimmedBase = base.slice(0, Math.max(1, SLUG_MAX_LEN - RANDOM_SUFFIX_LEN - 1));

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const suffix = randomSlugSuffix();
    const candidate = `${trimmedBase}-${suffix}`.slice(0, SLUG_MAX_LEN);
    if (!(await slugTaken(candidate, { excludeId, transaction }))) {
      return candidate;
    }
  }

  const fallback = `${trimmedBase}-${Date.now().toString(36)}`.slice(0, SLUG_MAX_LEN);
  if (!(await slugTaken(fallback, { excludeId, transaction }))) {
    return fallback;
  }

  throw new Error('Không thể tạo slug duy nhất');
}

const JOB_CODE_MAX_LEN = 64;

function randomJobCodeSuffix(length = 5) {
  return crypto
    .randomBytes(Math.ceil(length * 0.75))
    .toString('base64url')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, length)
    .toUpperCase() || crypto.randomBytes(3).toString('hex').toUpperCase();
}

async function jobCodeTaken(jobCode, { transaction = null } = {}) {
  const opts = { where: { jobCode } };
  if (transaction) opts.transaction = transaction;
  const existing = await Job.findOne(opts);
  return !!existing;
}

/** If jobCode exists, append `-` + random suffix until unique. */
export async function ensureUniqueJobCode(jobCode, { transaction = null } = {}) {
  const base = String(jobCode || '').trim();
  if (!base) throw new Error('jobCode is required');
  if (!(await jobCodeTaken(base, { transaction }))) return base;

  const trimmed = base.slice(0, Math.max(1, JOB_CODE_MAX_LEN - 7));

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const candidate = `${trimmed}-${randomJobCodeSuffix()}`.slice(0, JOB_CODE_MAX_LEN);
    if (!(await jobCodeTaken(candidate, { transaction }))) return candidate;
  }

  const fallback = `${trimmed}-${Date.now().toString(36).toUpperCase()}`.slice(0, JOB_CODE_MAX_LEN);
  if (!(await jobCodeTaken(fallback, { transaction }))) return fallback;

  throw new Error('Không thể tạo mã việc làm duy nhất');
}
