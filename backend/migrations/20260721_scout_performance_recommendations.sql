-- Scout Performance: gợi ý ứng viên + tracking phản hồi DN
-- Chạy: mysql -u ... -p ... < backend/migrations/20260721_scout_performance_recommendations.sql

ALTER TABLE `business_scout_performance_requests`
  ADD COLUMN `business_viewed_at` timestamp NULL DEFAULT NULL COMMENT 'DN mở thông báo/kết quả lần đầu' AFTER `handled_at`,
  ADD COLUMN `business_explore_status` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'interested | declined' AFTER `business_viewed_at`;

CREATE TABLE IF NOT EXISTS `business_scout_performance_recommendations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `request_id` bigint unsigned NOT NULL,
  `cv_id` bigint unsigned NOT NULL,
  `source` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'system'
    COMMENT 'scout | ctv | system',
  `admin_note` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_scout_perf_rec_request_cv` (`request_id`, `cv_id`),
  KEY `idx_scout_perf_rec_request` (`request_id`),
  KEY `idx_scout_perf_rec_cv` (`cv_id`),
  CONSTRAINT `fk_scout_perf_rec_request` FOREIGN KEY (`request_id`) REFERENCES `business_scout_performance_requests` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_scout_perf_rec_cv` FOREIGN KEY (`cv_id`) REFERENCES `cv_storages` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
