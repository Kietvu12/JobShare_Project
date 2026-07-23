import { DataTypes } from 'sequelize';
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
  { name: 'admin_id', spec: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true } },
  { name: 'business_id', spec: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true } },
];

async function main() {
  const queryInterface = sequelize.getQueryInterface();
  const table = await queryInterface.describeTable(TABLE);

  for (const { name, spec } of COLUMNS) {
    if (table[name]) {
      console.log(`[migration] ${TABLE}.${name} already exists`);
      continue;
    }
    await queryInterface.addColumn(TABLE, name, spec);
    console.log(`[migration] added ${TABLE}.${name}`);
  }

  await sequelize.close();
}

main().catch(async (error) => {
  console.error('[migration] add-collaborator-notification-recipient-columns failed:', error);
  try {
    await sequelize.close();
  } catch {}
  process.exitCode = 1;
});
