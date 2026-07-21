import 'dotenv/config';
import { Sequelize, DataTypes } from 'sequelize';
import sequelize from '../src/config/database.js';

async function main() {
  const queryInterface = sequelize.getQueryInterface();
  const tableName = 'cv_storages';
  const columnName = 'language_skill_remarks';

  const table = await queryInterface.describeTable(tableName);
  if (table[columnName]) {
    console.log(`[migration] ${tableName}.${columnName} already exists`);
    await sequelize.close();
    return;
  }

  await queryInterface.addColumn(tableName, columnName, {
    type: DataTypes.TEXT,
    allowNull: true,
    after: 'other_documents'
  });

  console.log(`[migration] added ${tableName}.${columnName}`);
  await sequelize.close();
}

main().catch(async (error) => {
  console.error('[migration] add-language-skill-remarks-column failed:', error);
  try {
    await sequelize.close();
  } catch {}
  process.exitCode = 1;
});
