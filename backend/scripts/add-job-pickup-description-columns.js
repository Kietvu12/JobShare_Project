import { DataTypes } from 'sequelize';
import { loadBackendEnv } from './loadBackendEnv.js';

const loadedFrom = loadBackendEnv();
if (loadedFrom) {
  console.log(`[migration] .env loaded from: ${loadedFrom}`);
} else {
  console.warn('[migration] .env not found; using process environment / defaults');
}

const { default: sequelize } = await import('../src/config/database.js');

const COLUMNS = [
  { name: 'description', spec: { type: DataTypes.TEXT, allowNull: true } },
  { name: 'description_en', spec: { type: DataTypes.TEXT, allowNull: true } },
  { name: 'description_jp', spec: { type: DataTypes.TEXT, allowNull: true } },
];

async function main() {
  const queryInterface = sequelize.getQueryInterface();
  const tableName = 'job_pickups';
  const table = await queryInterface.describeTable(tableName);

  for (const col of COLUMNS) {
    if (table[col.name]) {
      console.log(`[migration] ${tableName}.${col.name} already exists`);
      continue;
    }
    await queryInterface.addColumn(tableName, col.name, col.spec);
    console.log(`[migration] added ${tableName}.${col.name}`);
  }

  await sequelize.close();
}

main().catch(async (error) => {
  console.error('[migration] add-job-pickup-description-columns failed:', error);
  try {
    await sequelize.close();
  } catch {}
  process.exitCode = 1;
});
