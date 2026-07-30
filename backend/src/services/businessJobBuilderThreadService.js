import sequelize from '../config/database.js';
import { BusinessJobBuilderThread, Job } from '../models/index.js';

function toClientThread(row) {
  if (!row) return null;
  const plain = row.get ? row.get({ plain: true }) : row;
  return {
    id: String(plain.id),
    businessId: plain.businessId,
    jobId: plain.jobId ?? null,
    title: plain.title || 'JD mới',
    sessionId: plain.aiSessionId || null,
    messages: Array.isArray(plain.messages) ? plain.messages : [],
    formSnapshot: plain.formSnapshot ?? null,
    jdOriginalStored: plain.jdOriginalStored ?? null,
    createdAt: plain.createdAt ? new Date(plain.createdAt).getTime() : Date.now(),
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).getTime() : Date.now(),
  };
}

let schemaEnsurePromise = null;

/**
 * Tạo bảng / bổ sung cột timestamp nếu staging sync trước đó thiếu created_at/updated_at/deleted_at.
 * sync() không alter bảng đã tồn tại — cần ensure thủ công.
 * Gọi lazy từ list/upsert vì PM2 đôi khi không restart đủ để chạy ensure lúc boot.
 */
export async function ensureBusinessJobBuilderThreadSchema() {
  if (!schemaEnsurePromise) {
    schemaEnsurePromise = (async () => {
      try {
        // alter: true bổ sung cột thiếu trên bảng đã tồn tại
        await BusinessJobBuilderThread.sync({ alter: true });
      } catch (err) {
        console.warn('BusinessJobBuilderThread.sync(alter) warning:', err?.message || err);
        await BusinessJobBuilderThread.sync();
      }

      const [cols] = await sequelize.query(
        `SELECT COLUMN_NAME AS name
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'business_job_builder_threads'`,
      );
      const existing = new Set(
        (cols || []).map((c) => String(c.name || c.COLUMN_NAME || '').toLowerCase()),
      );

      const addIfMissing = async (columnSql, columnName) => {
        if (existing.has(columnName.toLowerCase())) return;
        try {
          await sequelize.query(
            `ALTER TABLE \`business_job_builder_threads\` ADD COLUMN ${columnSql}`,
          );
          existing.add(columnName.toLowerCase());
          console.log(`✅ Added column business_job_builder_threads.${columnName}`);
        } catch (err) {
          // 1060 = Duplicate column — coi như đã có
          if (err?.parent?.errno === 1060 || /duplicate column/i.test(err?.message || '')) {
            existing.add(columnName.toLowerCase());
            return;
          }
          console.error(
            `❌ Failed adding business_job_builder_threads.${columnName}:`,
            err?.message || err,
          );
          throw err;
        }
      };

      await addIfMissing('`created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP', 'created_at');
      await addIfMissing(
        '`updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        'updated_at',
      );
      await addIfMissing('`deleted_at` DATETIME NULL', 'deleted_at');
      await addIfMissing('`local_client_id` VARCHAR(80) NULL', 'local_client_id');
      await addIfMissing('`ai_session_id` VARCHAR(128) NULL', 'ai_session_id');
      await addIfMissing('`form_snapshot` JSON NULL', 'form_snapshot');
      await addIfMissing('`messages` JSON NULL', 'messages');
      await addIfMissing('`jd_original_stored` JSON NULL', 'jd_original_stored');
      await addIfMissing('`job_id` BIGINT UNSIGNED NULL', 'job_id');

      if (!existing.has('updated_at')) {
        throw new Error(
          'business_job_builder_threads.updated_at vẫn thiếu — DB user cần quyền ALTER TABLE',
        );
      }
    })().catch((err) => {
      schemaEnsurePromise = null;
      throw err;
    });
  }
  return schemaEnsurePromise;
}

async function assertJobOwnedByBusiness(jobId, businessId) {
  if (jobId == null || jobId === '') return true;
  const numeric = Number(jobId);
  if (!Number.isFinite(numeric) || numeric <= 0) return false;
  const job = await Job.findOne({
    where: { id: numeric, businessId },
    attributes: ['id'],
  });
  return Boolean(job);
}

export async function listBusinessJobBuilderThreads(businessId, { jobId } = {}) {
  await ensureBusinessJobBuilderThreadSchema();
  const where = { businessId };
  if (jobId != null && jobId !== '') {
    where.jobId = Number(jobId);
  }
  // Không SELECT JSON lớn (messages / form / file base64) — tránh ER_OUT_OF_SORTMEMORY
  const rows = await BusinessJobBuilderThread.findAll({
    where,
    attributes: [
      'id',
      'businessId',
      'jobId',
      'localClientId',
      'title',
      'aiSessionId',
      'createdAt',
      'updatedAt',
    ],
    order: [['id', 'DESC']],
    limit: 200,
  });
  return rows.map((row) => {
    const t = toClientThread(row);
    return {
      ...t,
      messages: [],
      formSnapshot: null,
      jdOriginalStored: null,
    };
  });
}

export async function getBusinessJobBuilderThread(businessId, threadId) {
  await ensureBusinessJobBuilderThreadSchema();
  const row = await BusinessJobBuilderThread.findOne({
    where: { id: threadId, businessId },
  });
  return toClientThread(row);
}

/** Lấy full thread theo job (1 row — không sort list lớn) */
export async function getBusinessJobBuilderThreadByJobId(businessId, jobId) {
  await ensureBusinessJobBuilderThreadSchema();
  const numeric = Number(jobId);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  const row = await BusinessJobBuilderThread.findOne({
    where: { businessId, jobId: numeric },
    order: [['id', 'DESC']],
  });
  return toClientThread(row);
}

function pickThreadFields(body = {}) {
  return {
    title: body.title != null ? String(body.title).slice(0, 255) : undefined,
    jobId: body.jobId != null && body.jobId !== '' ? Number(body.jobId) : null,
    aiSessionId: body.sessionId != null ? String(body.sessionId).slice(0, 128) : null,
    formSnapshot: body.formSnapshot ?? null,
    messages: Array.isArray(body.messages) ? body.messages : [],
    jdOriginalStored: body.jdOriginalStored ?? null,
    localClientId: body.localClientId != null ? String(body.localClientId).slice(0, 80) : undefined,
  };
}

export async function createBusinessJobBuilderThread(businessId, body) {
  await ensureBusinessJobBuilderThreadSchema();
  const fields = pickThreadFields(body);
  if (fields.jobId) {
    const ok = await assertJobOwnedByBusiness(fields.jobId, businessId);
    if (!ok) {
      const err = new Error('Job không thuộc tài khoản doanh nghiệp này');
      err.status = 403;
      throw err;
    }
  }
  if (fields.jobId) {
    const existing = await BusinessJobBuilderThread.findOne({
      where: { businessId, jobId: fields.jobId },
    });
    if (existing) {
      return updateBusinessJobBuilderThread(businessId, existing.id, body);
    }
  }
  const row = await BusinessJobBuilderThread.create({
    businessId,
    jobId: fields.jobId,
    title: fields.title || 'JD mới',
    aiSessionId: fields.aiSessionId,
    formSnapshot: fields.formSnapshot,
    messages: fields.messages,
    jdOriginalStored: fields.jdOriginalStored,
    localClientId: fields.localClientId || null,
  });
  return toClientThread(row);
}

export async function updateBusinessJobBuilderThread(businessId, threadId, body) {
  await ensureBusinessJobBuilderThreadSchema();
  const row = await BusinessJobBuilderThread.findOne({
    where: { id: threadId, businessId },
  });
  if (!row) {
    const err = new Error('Không tìm thấy phiên chat');
    err.status = 404;
    throw err;
  }
  const fields = pickThreadFields(body);
  if (fields.jobId) {
    const ok = await assertJobOwnedByBusiness(fields.jobId, businessId);
    if (!ok) {
      const err = new Error('Job không thuộc tài khoản doanh nghiệp này');
      err.status = 403;
      throw err;
    }
  }
  if (fields.title !== undefined) row.title = fields.title || 'JD mới';
  if (body.jobId !== undefined) row.jobId = fields.jobId;
  if (body.sessionId !== undefined) row.aiSessionId = fields.aiSessionId;
  if (body.formSnapshot !== undefined) row.formSnapshot = fields.formSnapshot;
  if (body.messages !== undefined) row.messages = fields.messages;
  if (Object.prototype.hasOwnProperty.call(body, 'jdOriginalStored')) {
    row.jdOriginalStored = body.jdOriginalStored ?? null;
  }
  await row.save();
  return toClientThread(row);
}

export async function upsertBusinessJobBuilderThread(businessId, body) {
  await ensureBusinessJobBuilderThreadSchema();
  const rawId = body?.id;
  if (rawId != null && /^\d+$/.test(String(rawId))) {
    return updateBusinessJobBuilderThread(businessId, Number(rawId), body);
  }
  if (rawId && String(rawId).startsWith('thread-')) {
    const byLocal = await BusinessJobBuilderThread.findOne({
      where: { businessId, localClientId: String(rawId) },
    });
    if (byLocal) {
      return updateBusinessJobBuilderThread(businessId, byLocal.id, body);
    }
    return createBusinessJobBuilderThread(businessId, {
      ...body,
      localClientId: String(rawId),
    });
  }
  return createBusinessJobBuilderThread(businessId, body);
}

export async function deleteBusinessJobBuilderThread(businessId, threadId) {
  await ensureBusinessJobBuilderThreadSchema();
  const row = await BusinessJobBuilderThread.findOne({
    where: { id: threadId, businessId },
  });
  if (!row) {
    const err = new Error('Không tìm thấy phiên chat');
    err.status = 404;
    throw err;
  }
  await row.destroy();
  return { ok: true };
}

/** Import một lần từ localStorage (client) */
export async function importLegacyBusinessJobBuilderThreads(businessId, threads = []) {
  await ensureBusinessJobBuilderThreadSchema();
  if (!Array.isArray(threads) || !threads.length) {
    return { imported: 0, skipped: 0 };
  }
  let imported = 0;
  let skipped = 0;
  for (const t of threads) {
    if (!t || typeof t !== 'object') {
      skipped += 1;
      continue;
    }
    const localClientId = t.id ? String(t.id) : null;
    if (localClientId) {
      const exists = await BusinessJobBuilderThread.findOne({
        where: { businessId, localClientId },
      });
      if (exists) {
        skipped += 1;
        continue;
      }
    }
    const jobId = t.jobId != null && t.jobId !== '' ? Number(t.jobId) : null;
    if (jobId) {
      const ok = await assertJobOwnedByBusiness(jobId, businessId);
      if (!ok) {
        skipped += 1;
        continue;
      }
      const byJob = await BusinessJobBuilderThread.findOne({ where: { businessId, jobId } });
      if (byJob) {
        skipped += 1;
        continue;
      }
    }
    await BusinessJobBuilderThread.create({
      businessId,
      jobId: Number.isFinite(jobId) && jobId > 0 ? jobId : null,
      localClientId,
      title: t.title || 'JD mới',
      aiSessionId: t.sessionId || null,
      formSnapshot: t.formSnapshot ?? null,
      messages: Array.isArray(t.messages) ? t.messages : [],
      jdOriginalStored: t.jdOriginalStored ?? null,
    });
    imported += 1;
  }
  return { imported, skipped };
}
