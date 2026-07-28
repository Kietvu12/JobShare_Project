import { loadBackendEnv } from './loadBackendEnv.js';

const loadedFrom = loadBackendEnv();
if (loadedFrom) {
  console.log(`[migration] .env loaded from: ${loadedFrom}`);
} else {
  console.warn('[migration] .env not found; using process environment / defaults');
}

const { default: sequelize } = await import('../src/config/database.js');

const TABLE = 'collaborator_notifications';
const COLUMNS = [
  {
    name: 'created_at',
    sql: 'ADD COLUMN `created_at` datetime DEFAULT CURRENT_TIMESTAMP',
  },
  {
    name: 'updated_at',
    sql: 'ADD COLUMN `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  },
];

async function main() {
  const queryInterface = sequelize.getQueryInterface();
  const table = await queryInterface.describeTable(TABLE);

  for (const { name, sql } of COLUMNS) {
    if (table[name]) {
      console.log(`[migration] ${TABLE}.${name} already exists`);
      continue;
    }
    await sequelize.query(`ALTER TABLE \`${TABLE}\` ${sql}`);
    console.log(`[migration] added ${TABLE}.${name}`);
  }

  await sequelize.close();
}

main().catch(async (error) => {
  console.error('[migration] add-collaborator-notification-timestamp-columns failed:', error);
  try {
    await sequelize.close();
  } catch {}
  process.exitCode = 1;
});
