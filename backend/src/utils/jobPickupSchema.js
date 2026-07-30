import sequelize from '../config/database.js';

/** DB column → thuộc tính model JobPickup */
const DB_COLUMN_TO_MODEL_ATTR = [
  ['id', 'id'],
  ['name', 'name'],
  ['name_en', 'nameEn'],
  ['name_jp', 'nameJp'],
  ['cover_url', 'coverUrl'],
  ['description', 'description'],
  ['description_en', 'descriptionEn'],
  ['description_jp', 'descriptionJp'],
  ['created_at', 'createdAt'],
  ['updated_at', 'updatedAt'],
  ['deleted_at', 'deletedAt'],
];

let jobPickupTableCache = null;
let descriptionColumnsReady = null;

async function getJobPickupTable() {
  if (jobPickupTableCache) return jobPickupTableCache;
  try {
    jobPickupTableCache = await sequelize.getQueryInterface().describeTable('job_pickups');
  } catch {
    jobPickupTableCache = {};
  }
  return jobPickupTableCache;
}

function modelAttrsPresentInTable(table) {
  return DB_COLUMN_TO_MODEL_ATTR.filter(([col]) => Boolean(table[col])).map(([, attr]) => attr);
}

export async function hasJobPickupDescriptionColumns() {
  if (descriptionColumnsReady !== null) return descriptionColumnsReady;
  try {
    const table = await getJobPickupTable();
    descriptionColumnsReady = Boolean(table.description && table.description_en && table.description_jp);
  } catch {
    descriptionColumnsReady = false;
  }
  return descriptionColumnsReady;
}

/**
 * Danh sách attributes an toàn cho JobPickup.find/findOne/include.
 * Trả undefined khi schema đủ cột (Sequelize SELECT * theo model).
 */
export async function getJobPickupQueryAttributes() {
  const table = await getJobPickupTable();
  const present = modelAttrsPresentInTable(table);
  const expected = DB_COLUMN_TO_MODEL_ATTR.map(([, attr]) => attr);
  if (present.length >= expected.length) return undefined;
  if (present.length) return present;
  return ['id', 'name'];
}

/** Gắn `attributes` an toàn khi bảng thiếu cột (nested include JobPickup). */
export async function mergeJobPickupQueryOptions(options = {}) {
  const table = await getJobPickupTable();
  const attributes = await getJobPickupQueryAttributes();
  const next = { ...options };
  if (attributes) next.attributes = attributes;
  if (!table.deleted_at) next.paranoid = false;
  return next;
}

export function stripJobPickupDescriptionFields(body = {}) {
  if (!body || typeof body !== 'object') return body;
  const next = { ...body };
  delete next.description;
  delete next.descriptionEn;
  delete next.descriptionJp;
  return next;
}

export function isMissingJobPickupDescriptionColumnError(error) {
  const msg = String(error?.parent?.sqlMessage || error?.original?.sqlMessage || error?.message || '');
  return /Unknown column ['`]?(description(_en|_jp)?|createdAt|updatedAt|deletedAt|created_at|updated_at|deleted_at|coverUrl|cover_url)['`]?/i.test(msg)
    || /Unknown column ['`]?pickup\.(description|createdAt|updatedAt|deletedAt)/i.test(msg);
}
