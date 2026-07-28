-- Business ↔ WS chat (Scout Performance and future WS services)

CREATE TABLE IF NOT EXISTS `business_ws_chat_sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `business_id` bigint unsigned NOT NULL,
  `performance_request_id` bigint unsigned DEFAULT NULL COMMENT 'FK business_scout_performance_requests.id',
  `session_type` varchar(32) NOT NULL DEFAULT 'scout_performance',
  `title` varchar(255) DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `last_message_at` datetime DEFAULT NULL,
  `last_message_preview` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ws_chat_performance_request` (`performance_request_id`),
  KEY `idx_ws_chat_business_id` (`business_id`),
  KEY `idx_ws_chat_last_message_at` (`last_message_at`),
  CONSTRAINT `fk_ws_chat_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ws_chat_performance_request` FOREIGN KEY (`performance_request_id`) REFERENCES `business_scout_performance_requests` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `business_ws_chat_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `session_id` bigint unsigned NOT NULL,
  `sender_type` enum('business','admin','system') NOT NULL,
  `admin_id` bigint unsigned DEFAULT NULL,
  `business_id` bigint unsigned DEFAULT NULL,
  `content` text,
  `cv_attachments` json DEFAULT NULL COMMENT 'Array of shared candidate cards [{cvId,code,name,desiredPosition}]',
  `is_read_by_business` tinyint(1) NOT NULL DEFAULT 0,
  `is_read_by_admin` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ws_chat_msg_session_id` (`session_id`),
  KEY `idx_ws_chat_msg_created_at` (`created_at`),
  CONSTRAINT `fk_ws_chat_msg_session` FOREIGN KEY (`session_id`) REFERENCES `business_ws_chat_sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ws_chat_msg_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ws_chat_msg_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
