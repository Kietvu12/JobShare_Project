import sequelize from '../config/database.js';

let adminColumnReady = null;
let businessColumnReady = null;
let timestampColumnsReady = null;
let tableMetaCache = null;

async function loadCollaboratorNotificationTableMeta() {
  if (tableMetaCache) return tableMetaCache;
  try {
    const table = await sequelize.getQueryInterface().describeTable('collaborator_notifications');
    tableMetaCache = {
      hasCreatedAt: Boolean(table.created_at || table.createdAt),
      hasUpdatedAt: Boolean(table.updated_at || table.updatedAt),
      hasBusinessId: Boolean(table.business_id),
    };
  } catch {
    tableMetaCache = {
      hasCreatedAt: false,
      hasUpdatedAt: false,
      hasBusinessId: false,
    };
  }
  return tableMetaCache;
}

export async function hasCollaboratorNotificationAdminColumn() {
  if (adminColumnReady !== null) return adminColumnReady;
  try {
    const table = await sequelize.getQueryInterface().describeTable('collaborator_notifications');
    adminColumnReady = Boolean(table.admin_id);
  } catch {
    adminColumnReady = false;
  }
  return adminColumnReady;
}

export async function hasCollaboratorNotificationBusinessColumn() {
  if (businessColumnReady !== null) return businessColumnReady;
  try {
    const table = await sequelize.getQueryInterface().describeTable('collaborator_notifications');
    businessColumnReady = Boolean(table.business_id);
  } catch {
    businessColumnReady = false;
  }
  return businessColumnReady;
}

export async function hasCollaboratorNotificationTimestampColumns() {
  if (timestampColumnsReady !== null) return timestampColumnsReady;
  try {
    const table = await sequelize.getQueryInterface().describeTable('collaborator_notifications');
    timestampColumnsReady = Boolean(table.created_at && table.updated_at);
  } catch {
    timestampColumnsReady = false;
  }
  return timestampColumnsReady;
}

function mergeAttributeExcludes(baseAttributes, extraExclude = []) {
  if (!extraExclude.length) return baseAttributes;
  const exclude = [...new Set([...(baseAttributes?.exclude || []), ...extraExclude])];
  return { ...(baseAttributes || {}), exclude };
}

/** findAndCountAll options — bỏ timestamp khi DB staging thiếu cột */
export async function buildCollaboratorNotificationListFindOptions(overrides = {}) {
  const meta = await loadCollaboratorNotificationTableMeta();
  const timestampExclude = [];
  if (!meta.hasCreatedAt) timestampExclude.push('createdAt');
  if (!meta.hasUpdatedAt) timestampExclude.push('updatedAt');

  const { attributes: overrideAttributes, order: _ignoredOrder, ...rest } = overrides;

  return {
    ...rest,
    order: meta.hasCreatedAt ? [['createdAt', 'DESC']] : [['id', 'DESC']],
    attributes: mergeAttributeExcludes(overrideAttributes, timestampExclude),
  };
}

/** Retry khi query vẫn đụng cột timestamp cũ */
export function getCollaboratorNotificationLegacyListFallbackOptions(base = {}) {
  const { attributes, ...rest } = base;
  return {
    ...rest,
    order: [['id', 'DESC']],
    attributes: mergeAttributeExcludes(attributes, ['createdAt', 'updatedAt']),
  };
}

/** @deprecated use buildCollaboratorNotificationListFindOptions */
export async function getCollaboratorNotificationListOrder() {
  const meta = await loadCollaboratorNotificationTableMeta();
  return meta.hasCreatedAt ? [['createdAt', 'DESC']] : [['id', 'DESC']];
}

export function isMissingCollaboratorNotificationAdminColumnError(error) {
  const msg = String(error?.parent?.sqlMessage || error?.original?.sqlMessage || error?.message || '');
  return /Unknown column ['`]?admin_id['`]?/i.test(msg)
    || /Unknown column ['`]?collaborator_notifications\.admin_id/i.test(msg);
}

export function isMissingCollaboratorNotificationTimestampColumnError(error) {
  const msg = String(error?.parent?.sqlMessage || error?.original?.sqlMessage || error?.message || '');
  return (error?.parent?.errno === 1054 || error?.original?.errno === 1054 || error?.code === 'ER_BAD_FIELD_ERROR')
    && /Unknown column ['`]?(collaborator_notifications\.)?created_at['`]?/i.test(msg);
}

export function isMissingCollaboratorNotificationTimestampError(error) {
  const msg = String(error?.parent?.sqlMessage || error?.original?.sqlMessage || error?.message || '');
  return (error?.parent?.errno === 1054 || error?.original?.errno === 1054 || error?.parent?.code === 'ER_BAD_FIELD_ERROR')
    && /created_at|createdAt|updated_at|updatedAt/i.test(msg);
}

/** @deprecated alias */
export const isMissingCollaboratorNotificationCreatedAtError = isMissingCollaboratorNotificationTimestampError;
