import { DataTypes } from 'sequelize';
import { loadBackendEnv } from './loadBackendEnv.js';

const loadedFrom = loadBackendEnv();
if (loadedFrom) {
  console.log(`[migration] .env loaded from: ${loadedFrom}`);
} else {
  console.warn('[migration] .env not found; using process environment / defaults');
}

const { default: sequelize } = await import('../src/config/database.js');

/** Columns present in prod (jobshare_prod.sql) but missing in staging snapshot. */
const MIGRATIONS = [
  {
    table: 'collaborators',
    columns: [
      { name: 'utm_source', spec: { type: DataTypes.STRING(100), allowNull: true }, after: 'description' },
      { name: 'utm_medium', spec: { type: DataTypes.STRING(100), allowNull: true }, after: 'utm_source' },
      { name: 'utm_campaign', spec: { type: DataTypes.STRING(150), allowNull: true }, after: 'utm_medium' },
      { name: 'utm_content', spec: { type: DataTypes.STRING(150), allowNull: true }, after: 'utm_campaign' },
      { name: 'utm_term', spec: { type: DataTypes.STRING(150), allowNull: true }, after: 'utm_content' },
      { name: 'registration_source', spec: { type: DataTypes.STRING(100), allowNull: true }, after: 'utm_term' },
      { name: 'registration_source_detail', spec: { type: DataTypes.STRING(255), allowNull: true }, after: 'registration_source' },
    ],
  },
  {
    table: 'job_pickups',
    columns: [
      { name: 'description', spec: { type: DataTypes.TEXT, allowNull: true }, after: 'cover_url' },
      { name: 'description_en', spec: { type: DataTypes.TEXT, allowNull: true }, after: 'description' },
      { name: 'description_jp', spec: { type: DataTypes.TEXT, allowNull: true }, after: 'description_en' },
    ],
  },
  {
    table: 'public_ctv_chat_messages',
    columns: [
      { name: 'attachment_name', spec: { type: DataTypes.STRING(255), allowNull: true }, after: 'body_en' },
      { name: 'attachment_key', spec: { type: DataTypes.STRING(512), allowNull: true }, after: 'attachment_name' },
      { name: 'attachment_mime_type', spec: { type: DataTypes.STRING(128), allowNull: true }, after: 'attachment_key' },
      { name: 'attachment_size', spec: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }, after: 'attachment_mime_type' },
    ],
  },
  {
    table: 'public_candidate_chat_messages',
    columns: [
      { name: 'attachment_name', spec: { type: DataTypes.STRING(255), allowNull: true }, after: 'body_en' },
      { name: 'attachment_key', spec: { type: DataTypes.STRING(512), allowNull: true }, after: 'attachment_name' },
      { name: 'attachment_mime_type', spec: { type: DataTypes.STRING(128), allowNull: true }, after: 'attachment_key' },
      { name: 'attachment_size', spec: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }, after: 'attachment_mime_type' },
    ],
  },
  {
    table: 'public_ctv_chat_sessions',
    columns: [
      { name: 'visitor_last_seen_at', spec: { type: DataTypes.DATE, allowNull: true }, after: 'admin_last_seen_at' },
    ],
  },
  {
    table: 'public_candidate_chat_sessions',
    columns: [
      { name: 'visitor_last_seen_at', spec: { type: DataTypes.DATE, allowNull: true }, after: 'admin_last_seen_at' },
    ],
  },
];

async function ensureColumn(queryInterface, tableName, { name, spec, after }) {
  const table = await queryInterface.describeTable(tableName);
  if (table[name]) {
    console.log(`[migration] ${tableName}.${name} already exists — skip`);
    return false;
  }

  if (after && table[after]) {
    await queryInterface.addColumn(tableName, name, { ...spec, after });
  } else {
    await queryInterface.addColumn(tableName, name, spec);
  }

  console.log(`[migration] added ${tableName}.${name}`);
  return true;
}

async function main() {
  const queryInterface = sequelize.getQueryInterface();
  let added = 0;
  let skipped = 0;

  for (const { table, columns } of MIGRATIONS) {
    for (const col of columns) {
      const didAdd = await ensureColumn(queryInterface, table, col);
      if (didAdd) added += 1;
      else skipped += 1;
    }
  }

  console.log(`[migration] sync-staging-from-prod done — added: ${added}, skipped: ${skipped}`);
  await sequelize.close();
}

main().catch(async (error) => {
  console.error('[migration] sync-staging-from-prod failed:', error);
  try {
    await sequelize.close();
  } catch {}
  process.exitCode = 1;
});
