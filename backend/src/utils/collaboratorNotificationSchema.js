import sequelize from '../config/database.js';

let adminColumnReady = null;
let businessColumnReady = null;

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

export function isMissingCollaboratorNotificationAdminColumnError(error) {
  const msg = String(error?.parent?.sqlMessage || error?.original?.sqlMessage || error?.message || '');
  return /Unknown column ['`]?admin_id['`]?/i.test(msg)
    || /Unknown column ['`]?collaborator_notifications\.admin_id/i.test(msg);
}
