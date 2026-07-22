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
  const tableName = 'jobs';
  const columnName = 'salary_currency';

  const table = await queryInterface.describeTable(tableName);
  if (table[columnName]) {
    console.log(`[migration] ${tableName}.${columnName} already exists`);
    await sequelize.close();
    return;
  }

  await queryInterface.addColumn(tableName, columnName, {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'JPY',
    after: 'salary_review_jp',
  });

  console.log(`[migration] added ${tableName}.${columnName}`);
  await sequelize.close();
}

main().catch(async (error) => {
  console.error('[migration] add-job-salary-currency-column failed:', error);
  try {
    await sequelize.close();
  } catch {}
  process.exitCode = 1;
});
