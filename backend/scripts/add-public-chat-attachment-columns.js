import { loadBackendEnv } from './loadBackendEnv.js';

const loadedFrom = loadBackendEnv();
if (loadedFrom) {
  console.log(`[migration] .env loaded from: ${loadedFrom}`);
} else {
  console.warn('[migration] .env not found; using process environment / defaults');
}

const { default: sequelize } = await import('../src/config/database.js');

const TABLES = ['public_ctv_chat_messages', 'public_candidate_chat_messages'];

const COLUMNS = [
  { name: 'attachment_name', sql: 'VARCHAR(255) NULL' },
  { name: 'attachment_key', sql: 'VARCHAR(512) NULL' },
  { name: 'attachment_mime_type', sql: 'VARCHAR(128) NULL' },
  { name: 'attachment_size', sql: 'INT UNSIGNED NULL' },
];

async function ensureColumns(queryInterface, tableName) {
  const table = await queryInterface.describeTable(tableName);
  for (const col of COLUMNS) {
    if (table[col.name]) {
      console.log(`[migration] ${tableName}.${col.name} already exists`);
      continue;
    }
    await queryInterface.sequelize.query(
      `ALTER TABLE \`${tableName}\` ADD COLUMN \`${col.name}\` ${col.sql}`
    );
    console.log(`[migration] added ${tableName}.${col.name}`);
  }
}

async function main() {
  const queryInterface = sequelize.getQueryInterface();
  for (const tableName of TABLES) {
    await ensureColumns(queryInterface, tableName);
  }
  await sequelize.close();
}

main().catch(async (error) => {
  console.error('[migration] add-public-chat-attachment-columns failed:', error);
  try {
    await sequelize.close();
  } catch {}
  process.exitCode = 1;
});
