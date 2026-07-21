-- Scout Performance: doanh nghiệp gửi yêu cầu mở khóa Scout qua Admin/CTV (không trừ credit)
-- Chạy: mysql -u ... -p ... < backend/migrations/20260707_scout_performance_requests.sql

CREATE TABLE IF NOT EXISTS `business_scout_performance_requests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `business_id` bigint unsigned NOT NULL COMMENT 'businesses.id',
  `cv_id` bigint unsigned NOT NULL COMMENT 'cv_storages.id',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending'
    COMMENT 'pending | approved | rejected | cancelled',
  `message` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Ghi chú từ doanh nghiệp',
  `admin_note` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Ghi chú khi duyệt/từ chối',
  `handled_by_admin_id` bigint unsigned DEFAULT NULL,
  `handled_by_collaborator_id` bigint unsigned DEFAULT NULL,
  `scout_unlock_id` bigint unsigned DEFAULT NULL COMMENT 'business_scout_unlocks.id sau khi duyệt',
  `requested_at` timestamp NULL DEFAULT NULL,
  `handled_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_scout_perf_req_business` (`business_id`),
  KEY `idx_scout_perf_req_cv` (`cv_id`),
  KEY `idx_scout_perf_req_status` (`status`),
  KEY `idx_scout_perf_req_requested_at` (`requested_at`),
  CONSTRAINT `fk_scout_perf_req_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_scout_perf_req_cv` FOREIGN KEY (`cv_id`) REFERENCES `cv_storages` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_scout_perf_req_admin` FOREIGN KEY (`handled_by_admin_id`) REFERENCES `admins` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_scout_perf_req_collaborator` FOREIGN KEY (`handled_by_collaborator_id`) REFERENCES `collaborators` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_scout_perf_req_unlock` FOREIGN KEY (`scout_unlock_id`) REFERENCES `business_scout_unlocks` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
