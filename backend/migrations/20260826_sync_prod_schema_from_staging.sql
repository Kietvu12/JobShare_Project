-- Sync PROD schema gaps from jobshare_staging.sql (2026-08-26)
-- Staging có nhưng prod chưa có:
--   6 bảng business (credit requests, invoices, job builder, perf recommendations, ws chat)
--   3 cột trên business_scout_performance_requests
--
-- Idempotent: cd backend && pnpm migrate:sync-prod-from-staging
-- Manual: mysql -u ... -p job_share_prod < backend/migrations/20260826_sync_prod_schema_from_staging.sql

-- ---------------------------------------------------------------------------
-- 1) Yêu cầu nạp credit
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `business_credit_requests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `business_id` bigint unsigned NOT NULL COMMENT 'Doanh nghiệp → businesses.id',
  `request_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Mã yêu cầu, vd CR-2607-001',
  `amount` int NOT NULL COMMENT 'Số credit yêu cầu nạp',
  `note` text COLLATE utf8mb4_unicode_ci COMMENT 'Ghi chú / lý do',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'bank_transfer | other',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT 'pending | approved | rejected | cancelled',
  `admin_id` bigint unsigned DEFAULT NULL COMMENT 'Admin xử lý',
  `admin_note` text COLLATE utf8mb4_unicode_ci,
  `credit_history_id` bigint unsigned DEFAULT NULL COMMENT 'Lịch sử credit khi duyệt',
  `requested_at` timestamp NULL DEFAULT NULL,
  `handled_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_business_credit_requests_code` (`request_code`),
  KEY `idx_business_credit_requests_business_id` (`business_id`),
  KEY `idx_business_credit_requests_status` (`status`),
  KEY `fk_business_credit_requests_admin` (`admin_id`),
  KEY `fk_business_credit_requests_history` (`credit_history_id`),
  CONSTRAINT `fk_business_credit_requests_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_business_credit_requests_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_business_credit_requests_history` FOREIGN KEY (`credit_history_id`) REFERENCES `business_credit_histories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 2) Hóa đơn billing
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `business_invoices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `business_id` bigint unsigned NOT NULL COMMENT 'Doanh nghiệp → businesses.id',
  `invoice_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Mã hóa đơn, vd INV-2405-028',
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'Số tiền',
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VND',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid' COMMENT 'draft | unpaid | paid | cancelled',
  `due_date` date DEFAULT NULL COMMENT 'Hạn thanh toán',
  `description` text COLLATE utf8mb4_unicode_ci,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_business_invoices_code` (`invoice_code`),
  KEY `idx_business_invoices_business_id` (`business_id`),
  KEY `idx_business_invoices_status` (`status`),
  KEY `idx_business_invoices_due_date` (`due_date`),
  CONSTRAINT `fk_business_invoices_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 3) JD builder threads (AI)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `business_job_builder_threads` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `business_id` bigint unsigned NOT NULL,
  `job_id` bigint unsigned DEFAULT NULL,
  `local_client_id` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'JD mới',
  `ai_session_id` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `form_snapshot` json DEFAULT NULL,
  `messages` json DEFAULT NULL,
  `jd_original_stored` json DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `business_job_builder_threads_business_id_local_client_id` (`business_id`,`local_client_id`),
  KEY `business_job_builder_threads_business_id_updated_at` (`business_id`,`updated_at`),
  KEY `business_job_builder_threads_business_id_job_id` (`business_id`,`job_id`),
  KEY `job_id` (`job_id`),
  CONSTRAINT `business_job_builder_threads_ibfk_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `business_job_builder_threads_ibfk_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 4) Scout Performance — cột tracking DN (bảng đã có trên prod)
-- ---------------------------------------------------------------------------
ALTER TABLE `business_scout_performance_requests`
  ADD COLUMN `business_viewed_at` timestamp NULL DEFAULT NULL
    COMMENT 'DN mở thông báo/kết quả lần đầu'
    AFTER `handled_at`;

ALTER TABLE `business_scout_performance_requests`
  ADD COLUMN `business_explore_status` varchar(30) NULL DEFAULT NULL
    COMMENT 'interested | declined'
    AFTER `business_viewed_at`;

ALTER TABLE `business_scout_performance_requests`
  ADD COLUMN `wants_similar_candidates` tinyint(1) NOT NULL DEFAULT 0
    COMMENT 'DN yêu cầu WS tìm thêm ứng viên tương tự'
    AFTER `business_explore_status`;

-- ---------------------------------------------------------------------------
-- 5) Gợi ý ứng viên Scout Performance
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `business_scout_performance_recommendations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `request_id` bigint unsigned NOT NULL,
  `cv_id` bigint unsigned NOT NULL,
  `source` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'system' COMMENT 'scout | ctv | system',
  `admin_note` text COLLATE utf8mb4_unicode_ci,
  `sort_order` int unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_scout_perf_rec_request_cv` (`request_id`,`cv_id`),
  KEY `idx_scout_perf_rec_request` (`request_id`),
  KEY `idx_scout_perf_rec_cv` (`cv_id`),
  CONSTRAINT `fk_scout_perf_rec_cv` FOREIGN KEY (`cv_id`) REFERENCES `cv_storages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_scout_perf_rec_request` FOREIGN KEY (`request_id`) REFERENCES `business_scout_performance_requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 6) Chat WS ↔ Business (schema cuối cùng trên staging)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `business_ws_chat_sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `business_id` bigint unsigned NOT NULL,
  `performance_request_id` bigint unsigned DEFAULT NULL COMMENT 'FK business_scout_performance_requests.id',
  `session_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scout_performance',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `last_message_at` datetime DEFAULT NULL,
  `last_message_preview` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ws_chat_business_session_type` (`business_id`,`session_type`),
  KEY `idx_ws_chat_business_id` (`business_id`),
  KEY `idx_ws_chat_last_message_at` (`last_message_at`),
  KEY `fk_ws_chat_performance_request` (`performance_request_id`),
  CONSTRAINT `fk_ws_chat_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ws_chat_performance_request` FOREIGN KEY (`performance_request_id`) REFERENCES `business_scout_performance_requests` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `business_ws_chat_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `session_id` bigint unsigned NOT NULL,
  `sender_type` enum('business','admin','system') COLLATE utf8mb4_unicode_ci NOT NULL,
  `admin_id` bigint unsigned DEFAULT NULL,
  `business_id` bigint unsigned DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `message_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text' COMMENT 'text | performance_request | performance_decision',
  `request_payload` json DEFAULT NULL COMMENT 'Payload for performance_request card (requestId, status, cv info...)',
  `cv_attachments` json DEFAULT NULL COMMENT 'Array of shared candidate cards [{cvId,code,name,desiredPosition}]',
  `is_read_by_business` tinyint(1) NOT NULL DEFAULT 0,
  `is_read_by_admin` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ws_chat_msg_session_id` (`session_id`),
  KEY `idx_ws_chat_msg_created_at` (`created_at`),
  KEY `fk_ws_chat_msg_admin` (`admin_id`),
  KEY `fk_ws_chat_msg_business` (`business_id`),
  CONSTRAINT `fk_ws_chat_msg_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ws_chat_msg_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ws_chat_msg_session` FOREIGN KEY (`session_id`) REFERENCES `business_ws_chat_sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nếu bảng ws chat đã tạo từ migration cũ (uk_ws_chat_performance_request / thiếu message_type):
-- Chạy idempotent script: pnpm migrate:sync-prod-from-staging
