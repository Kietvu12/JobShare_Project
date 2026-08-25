import fs from 'fs';

function parseSchema(file) {
  const sql = fs.readFileSync(file, 'utf8');
  const tables = {};
  const fullCreate = {};
  const tableRegex = /CREATE TABLE `([^`]+)`\s*\(([\s\S]*?)\)\s*ENGINE=([^;]+);/g;
  let m;
  while ((m = tableRegex.exec(sql)) !== null) {
    const name = m[1];
    const body = m[2];
    fullCreate[name] = m[0];
    const columns = {};
    const indexes = {};
    const constraints = [];
    const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.startsWith('`')) {
        const colMatch = line.match(/^`([^`]+)`\s+(.+?)(?:,)?$/);
        if (colMatch) columns[colMatch[1]] = colMatch[2].replace(/,$/, '');
      } else if (line.match(/^PRIMARY KEY/)) {
        indexes.PRIMARY = line.replace(/,$/, '');
      } else if (line.match(/^UNIQUE KEY/)) {
        const um = line.match(/^UNIQUE KEY `([^`]+)`/);
        indexes[um ? um[1] : `UNIQUE_${Object.keys(indexes).length}`] = line.replace(/,$/, '');
      } else if (line.match(/^KEY /)) {
        const km = line.match(/^KEY `([^`]+)`/);
        indexes[km ? km[1] : `KEY_${Object.keys(indexes).length}`] = line.replace(/,$/, '');
      } else if (line.match(/^CONSTRAINT /)) {
        constraints.push(line.replace(/,$/, ''));
      }
    }
    tables[name] = { columns, indexes, constraints };
  }
  return { tables, fullCreate };
}

function normalizeDef(def) {
  return def
    .replace(/CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci/g, 'COLLATE utf8mb4_unicode_ci')
    .replace(/\s+/g, ' ')
    .trim();
}

const prod = parseSchema('backend/src/schema/jobshare_prod.sql');
const staging = parseSchema('backend/src/schema/jobshare_staging.sql');
const prodTables = new Set(Object.keys(prod.tables));
const stagingTables = new Set(Object.keys(staging.tables));

const direction = process.argv[2] || 'both';

function reportProdMissingFromStaging() {
  const tablesOnlyStaging = [...stagingTables].filter((t) => !prodTables.has(t)).sort();
  console.log(`=== TABLES in STAGING but NOT in PROD (${tablesOnlyStaging.length}) ===`);
  console.log(tablesOnlyStaging.join('\n') || '(none)');

  const cols = [];
  const idx = [];
  for (const t of [...stagingTables].filter((x) => prodTables.has(x)).sort()) {
    for (const col of Object.keys(staging.tables[t].columns)) {
      if (!prod.tables[t].columns[col]) {
        cols.push({ table: t, col, def: staging.tables[t].columns[col] });
      }
    }
    for (const key of Object.keys(staging.tables[t].indexes)) {
      if (!prod.tables[t].indexes[key]) {
        idx.push({ table: t, key, def: staging.tables[t].indexes[key] });
      }
    }
  }

  console.log(`\n=== COLUMNS in STAGING but NOT in PROD (${cols.length}) ===`);
  for (const c of cols) console.log(`${c.table}.${c.col}: ${c.def}`);

  console.log(`\n=== INDEXES in STAGING but NOT in PROD (${idx.length}) ===`);
  for (const i of idx) console.log(`${i.table} [${i.key}]: ${i.def}`);

  return { tablesOnlyStaging, cols, idx, fullCreate: staging.fullCreate };
}

function reportStagingMissingFromProd() {
  const tablesOnlyProd = [...prodTables].filter((t) => !stagingTables.has(t)).sort();
  console.log(`=== TABLES in PROD but NOT in STAGING (${tablesOnlyProd.length}) ===`);
  console.log(tablesOnlyProd.join('\n') || '(none)');

  const cols = [];
  const idx = [];
  for (const t of [...prodTables].filter((x) => stagingTables.has(x)).sort()) {
    for (const col of Object.keys(prod.tables[t].columns)) {
      if (!staging.tables[t].columns[col]) {
        cols.push({ table: t, col, def: prod.tables[t].columns[col] });
      }
    }
    for (const key of Object.keys(prod.tables[t].indexes)) {
      if (!staging.tables[t].indexes[key]) {
        idx.push({ table: t, key, def: prod.tables[t].indexes[key] });
      }
    }
  }

  console.log(`\n=== COLUMNS in PROD but NOT in STAGING (${cols.length}) ===`);
  for (const c of cols) console.log(`${c.table}.${c.col}: ${c.def}`);

  console.log(`\n=== INDEXES in PROD but NOT in STAGING (${idx.length}) ===`);
  for (const i of idx) console.log(`${i.table} [${i.key}]: ${i.def}`);
}

if (direction === 'staging-to-prod') {
  reportProdMissingFromStaging();
} else if (direction === 'prod-to-staging') {
  reportStagingMissingFromProd();
} else {
  console.log('--- STAGING → PROD (bổ sung vào prod) ---\n');
  reportProdMissingFromStaging();
  console.log('\n\n--- PROD → STAGING (bổ sung vào staging) ---\n');
  reportStagingMissingFromProd();
}
