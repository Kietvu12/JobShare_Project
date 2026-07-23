import sequelize from '../config/database.js';

let descriptionColumnsReady = null;

const BASE_ATTRIBUTES = [
  'id',
  'name',
  'nameEn',
  'nameJp',
  'coverUrl',
  'createdAt',
  'updatedAt',
  'deletedAt',
];

export async function hasJobPickupDescriptionColumns() {
  if (descriptionColumnsReady !== null) return descriptionColumnsReady;
  try {
    const table = await sequelize.getQueryInterface().describeTable('job_pickups');
    descriptionColumnsReady = Boolean(table.description && table.description_en && table.description_jp);
  } catch {
    descriptionColumnsReady = false;
  }
  return descriptionColumnsReady;
}

export async function getJobPickupQueryAttributes() {
  const withDescription = await hasJobPickupDescriptionColumns();
  return withDescription ? undefined : BASE_ATTRIBUTES;
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
  return /Unknown column ['`]?description(_en|_jp)?['`]?/i.test(msg);
}
