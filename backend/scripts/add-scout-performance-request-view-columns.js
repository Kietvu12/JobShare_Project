import { DataTypes } from 'sequelize';
import { loadBackendEnv } from './loadBackendEnv.js';

const loadedFrom = loadBackendEnv();
if (loadedFrom) {
  console.log(`[migration] .env loaded from: ${loadedFrom}`);
} else {
  console.warn('[migration] .env not found; using process environment / defaults');
}

const { default: sequelize } = await import('../src/config/database.js');

const TABLE = 'business_scout_performance_requests';

const COLUMNS = [
  {
    name: 'business_viewed_at',
    spec: { type: DataTypes.DATE, allowNull: true },
    after: 'handled_at',
  },
  {
    name: 'business_explore_status',
    spec: { type: DataTypes.STRING(30), allowNull: true },
    after: 'business_viewed_at',
  },
  {
    name: 'wants_similar_candidates',
    spec: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    after: 'business_explore_status',
  },
];

async function main() {
  const queryInterface = sequelize.getQueryInterface();
  let table = await queryInterface.describeTable(TABLE);

  for (const col of COLUMNS) {
    if (table[col.name]) {
      console.log(`[migration] ${TABLE}.${col.name} already exists — skip`);
      continue;
    }
    const afterExists = !col.after || table[col.after];
    if (afterExists && col.after) {
      await queryInterface.addColumn(TABLE, col.name, { ...col.spec, after: col.after });
    } else {
      await queryInterface.addColumn(TABLE, col.name, col.spec);
    }
    console.log(`[migration] added ${TABLE}.${col.name}`);
    table = await queryInterface.describeTable(TABLE);
  }

  await sequelize.close();
}

main().catch(async (error) => {
  console.error('[migration] add-scout-performance-request-view-columns failed:', error);
  try {
    await sequelize.close();
  } catch {}
  process.exitCode = 1;
});
