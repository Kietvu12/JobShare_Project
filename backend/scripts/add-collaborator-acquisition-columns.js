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
  { name: 'utm_source', spec: { type: DataTypes.STRING(100), allowNull: true } },
  { name: 'utm_medium', spec: { type: DataTypes.STRING(100), allowNull: true } },
  { name: 'utm_campaign', spec: { type: DataTypes.STRING(150), allowNull: true } },
  { name: 'utm_content', spec: { type: DataTypes.STRING(150), allowNull: true } },
  { name: 'utm_term', spec: { type: DataTypes.STRING(150), allowNull: true } },
  { name: 'registration_source', spec: { type: DataTypes.STRING(100), allowNull: true } },
  { name: 'registration_source_detail', spec: { type: DataTypes.STRING(255), allowNull: true } },
];

async function main() {
  const queryInterface = sequelize.getQueryInterface();
  const tableName = 'collaborators';
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
  console.error('[migration] add-collaborator-acquisition-columns failed:', error);
  try {
    await sequelize.close();
  } catch {}
  process.exitCode = 1;
});
