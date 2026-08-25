import { DataTypes } from 'sequelize';
import { loadBackendEnv } from './loadBackendEnv.js';

const loadedFrom = loadBackendEnv();
if (loadedFrom) {
  console.log(`[migration] .env loaded from: ${loadedFrom}`);
} else {
  console.warn('[migration] .env not found; using process environment / defaults');
}

const { default: sequelize } = await import('../src/config/database.js');

const PERF_REQUEST_COLUMNS = [
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

const WS_MESSAGE_COLUMNS = [
  {
    name: 'message_type',
    spec: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'text' },
    after: 'content',
  },
  {
    name: 'request_payload',
    spec: { type: DataTypes.JSON, allowNull: true },
    after: 'message_type',
  },
];

async function tableExists(queryInterface, tableName) {
  try {
    await queryInterface.describeTable(tableName);
    return true;
  } catch {
    return false;
  }
}

async function ensureColumn(queryInterface, tableName, { name, spec, after }) {
  const table = await queryInterface.describeTable(tableName);
  if (table[name]) {
    console.log(`[migration] ${tableName}.${name} already exists — skip`);
    return;
  }
  if (after && table[after]) {
    await queryInterface.addColumn(tableName, name, { ...spec, after });
  } else {
    await queryInterface.addColumn(tableName, name, spec);
  }
  console.log(`[migration] added ${tableName}.${name}`);
}

async function ensureIndex(queryInterface, tableName, indexName, fields, options = {}) {
  const indexes = await queryInterface.showIndex(tableName);
  if (indexes.some((idx) => idx.name === indexName)) {
    console.log(`[migration] ${tableName}.${indexName} already exists — skip`);
    return;
  }
  await queryInterface.addIndex(tableName, fields, { name: indexName, ...options });
  console.log(`[migration] added index ${tableName}.${indexName}`);
}

async function dropIndexIfExists(queryInterface, tableName, indexName) {
  const indexes = await queryInterface.showIndex(tableName);
  if (!indexes.some((idx) => idx.name === indexName)) {
    console.log(`[migration] ${tableName}.${indexName} not found — skip drop`);
    return;
  }
  await queryInterface.removeIndex(tableName, indexName);
  console.log(`[migration] dropped index ${tableName}.${indexName}`);
}

async function runSqlStatements(statements) {
  for (const sql of statements) {
    try {
      await sequelize.query(sql);
      console.log(`[migration] OK: ${sql.split('\n')[0].slice(0, 80)}...`);
    } catch (error) {
      const msg = String(error?.parent?.sqlMessage || error?.message || error);
      if (/Duplicate column|already exists|Duplicate key name/i.test(msg)) {
        console.log(`[migration] skip (already applied): ${msg.slice(0, 120)}`);
        continue;
      }
      throw error;
    }
  }
}

async function main() {
  const queryInterface = sequelize.getQueryInterface();

  // --- business_scout_performance_requests columns ---
  if (await tableExists(queryInterface, 'business_scout_performance_requests')) {
    for (const col of PERF_REQUEST_COLUMNS) {
      await ensureColumn(queryInterface, 'business_scout_performance_requests', col);
    }
  } else {
    console.warn('[migration] business_scout_performance_requests missing — run 20260707 first');
  }

  // --- CREATE TABLE IF NOT EXISTS via raw SQL (FK-safe order) ---
  await runSqlStatements([
    `CREATE TABLE IF NOT EXISTS business_credit_requests (
      id bigint unsigned NOT NULL AUTO_INCREMENT,
      business_id bigint unsigned NOT NULL,
      request_code varchar(50) NOT NULL,
      amount int NOT NULL,
      note text,
      payment_method varchar(50) DEFAULT NULL,
      status varchar(30) NOT NULL DEFAULT 'pending',
      admin_id bigint unsigned DEFAULT NULL,
      admin_note text,
      credit_history_id bigint unsigned DEFAULT NULL,
      requested_at timestamp NULL DEFAULT NULL,
      handled_at timestamp NULL DEFAULT NULL,
      created_at timestamp NULL DEFAULT NULL,
      updated_at timestamp NULL DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_business_credit_requests_code (request_code),
      KEY idx_business_credit_requests_business_id (business_id),
      KEY idx_business_credit_requests_status (status),
      KEY fk_business_credit_requests_admin (admin_id),
      KEY fk_business_credit_requests_history (credit_history_id),
      CONSTRAINT fk_business_credit_requests_admin FOREIGN KEY (admin_id) REFERENCES admins (id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_business_credit_requests_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_business_credit_requests_history FOREIGN KEY (credit_history_id) REFERENCES business_credit_histories (id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS business_invoices (
      id bigint unsigned NOT NULL AUTO_INCREMENT,
      business_id bigint unsigned NOT NULL,
      invoice_code varchar(50) NOT NULL,
      amount decimal(15,2) NOT NULL DEFAULT 0.00,
      currency varchar(10) NOT NULL DEFAULT 'VND',
      status varchar(20) NOT NULL DEFAULT 'unpaid',
      due_date date DEFAULT NULL,
      description text,
      paid_at timestamp NULL DEFAULT NULL,
      created_at timestamp NULL DEFAULT NULL,
      updated_at timestamp NULL DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_business_invoices_code (invoice_code),
      KEY idx_business_invoices_business_id (business_id),
      KEY idx_business_invoices_status (status),
      KEY idx_business_invoices_due_date (due_date),
      CONSTRAINT fk_business_invoices_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS business_job_builder_threads (
      id bigint unsigned NOT NULL AUTO_INCREMENT,
      business_id bigint unsigned NOT NULL,
      job_id bigint unsigned DEFAULT NULL,
      local_client_id varchar(80) DEFAULT NULL,
      title varchar(255) NOT NULL DEFAULT 'JD mới',
      ai_session_id varchar(128) DEFAULT NULL,
      form_snapshot json DEFAULT NULL,
      messages json DEFAULT NULL,
      jd_original_stored json DEFAULT NULL,
      created_at datetime DEFAULT NULL,
      updated_at datetime DEFAULT NULL,
      deleted_at datetime DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY business_job_builder_threads_business_id_local_client_id (business_id, local_client_id),
      KEY business_job_builder_threads_business_id_updated_at (business_id, updated_at),
      KEY business_job_builder_threads_business_id_job_id (business_id, job_id),
      KEY job_id (job_id),
      CONSTRAINT business_job_builder_threads_ibfk_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON UPDATE CASCADE,
      CONSTRAINT business_job_builder_threads_ibfk_job FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS business_scout_performance_recommendations (
      id bigint unsigned NOT NULL AUTO_INCREMENT,
      request_id bigint unsigned NOT NULL,
      cv_id bigint unsigned NOT NULL,
      source varchar(30) NOT NULL DEFAULT 'system',
      admin_note text,
      sort_order int unsigned NOT NULL DEFAULT 0,
      created_at timestamp NULL DEFAULT NULL,
      updated_at timestamp NULL DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_scout_perf_rec_request_cv (request_id, cv_id),
      KEY idx_scout_perf_rec_request (request_id),
      KEY idx_scout_perf_rec_cv (cv_id),
      CONSTRAINT fk_scout_perf_rec_cv FOREIGN KEY (cv_id) REFERENCES cv_storages (id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_scout_perf_rec_request FOREIGN KEY (request_id) REFERENCES business_scout_performance_requests (id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS business_ws_chat_sessions (
      id bigint unsigned NOT NULL AUTO_INCREMENT,
      business_id bigint unsigned NOT NULL,
      performance_request_id bigint unsigned DEFAULT NULL,
      session_type varchar(32) NOT NULL DEFAULT 'scout_performance',
      title varchar(255) DEFAULT NULL,
      status varchar(32) NOT NULL DEFAULT 'active',
      last_message_at datetime DEFAULT NULL,
      last_message_preview varchar(500) DEFAULT NULL,
      created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at datetime DEFAULT NULL,
      PRIMARY KEY (id),
      KEY idx_ws_chat_business_id (business_id),
      KEY idx_ws_chat_last_message_at (last_message_at),
      KEY fk_ws_chat_performance_request (performance_request_id),
      CONSTRAINT fk_ws_chat_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_ws_chat_performance_request FOREIGN KEY (performance_request_id) REFERENCES business_scout_performance_requests (id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS business_ws_chat_messages (
      id bigint unsigned NOT NULL AUTO_INCREMENT,
      session_id bigint unsigned NOT NULL,
      sender_type enum('business','admin','system') NOT NULL,
      admin_id bigint unsigned DEFAULT NULL,
      business_id bigint unsigned DEFAULT NULL,
      content text,
      cv_attachments json DEFAULT NULL,
      is_read_by_business tinyint(1) NOT NULL DEFAULT 0,
      is_read_by_admin tinyint(1) NOT NULL DEFAULT 0,
      created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at datetime DEFAULT NULL,
      PRIMARY KEY (id),
      KEY idx_ws_chat_msg_session_id (session_id),
      KEY idx_ws_chat_msg_created_at (created_at),
      KEY fk_ws_chat_msg_admin (admin_id),
      KEY fk_ws_chat_msg_business (business_id),
      CONSTRAINT fk_ws_chat_msg_admin FOREIGN KEY (admin_id) REFERENCES admins (id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_ws_chat_msg_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_ws_chat_msg_session FOREIGN KEY (session_id) REFERENCES business_ws_chat_sessions (id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  ]);

  // --- WS chat upgrades for DB đã có bảng từ migration cũ ---
  if (await tableExists(queryInterface, 'business_ws_chat_messages')) {
    for (const col of WS_MESSAGE_COLUMNS) {
      await ensureColumn(queryInterface, 'business_ws_chat_messages', col);
    }
  }

  if (await tableExists(queryInterface, 'business_ws_chat_sessions')) {
    await dropIndexIfExists(queryInterface, 'business_ws_chat_sessions', 'uk_ws_chat_performance_request');
    await ensureIndex(
      queryInterface,
      'business_ws_chat_sessions',
      'uk_ws_chat_business_session_type',
      ['business_id', 'session_type'],
      { unique: true },
    );
  }

  console.log('[migration] sync-prod-from-staging done');
  await sequelize.close();
}

main().catch(async (error) => {
  console.error('[migration] sync-prod-from-staging failed:', error);
  try {
    await sequelize.close();
  } catch {}
  process.exitCode = 1;
});
