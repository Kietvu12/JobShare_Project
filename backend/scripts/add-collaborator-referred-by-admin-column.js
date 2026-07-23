import { DataTypes } from 'sequelize';
import { loadBackendEnv } from './loadBackendEnv.js';

const loadedFrom = loadBackendEnv();
if (loadedFrom) {
  console.log(`[migration] .env loaded from: ${loadedFrom}`);
} else {
  console.warn('[migration] .env not found; using process environment / defaults');
}

const { default: sequelize } = await import('../src/config/database.js');

async function main() {
  const queryInterface = sequelize.getQueryInterface();
  const tableName = 'collaborators';
  const columnName = 'referred_by_admin_id';
  const table = await queryInterface.describeTable(tableName);

  if (table[columnName]) {
    console.log(`[migration] ${tableName}.${columnName} already exists`);
    await sequelize.close();
    return;
  }

  await queryInterface.addColumn(tableName, columnName, {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  });

  console.log(`[migration] added ${tableName}.${columnName}`);
  await sequelize.close();
}

main().catch(async (error) => {
  console.error('[migration] add-collaborator-referred-by-admin-column failed:', error);
  try {
    await sequelize.close();
  } catch {}
  process.exitCode = 1;
});
