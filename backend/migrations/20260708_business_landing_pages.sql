-- Saiyo Branding: landing page tuyển dụng theo template (business portal + public /lp/:slug)
-- Chạy: mysql -u ... -p ... < backend/migrations/20260708_business_landing_pages.sql

CREATE TABLE IF NOT EXISTS `business_landing_pages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `business_id` bigint unsigned NOT NULL,
  `job_id` bigint unsigned DEFAULT NULL COMMENT 'JD liên kết',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(220) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Public URL: /lp/{slug}',
  `template_key` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'classic',
  `content_json` json DEFAULT NULL COMMENT 'Hero, sections, form config',
  `meta_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_keywords` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `og_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `og_description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '0=nháp,1=active,2=paused,3=closed',
  `published_at` timestamp NULL DEFAULT NULL,
  `views_count` int unsigned NOT NULL DEFAULT 0,
  `form_submissions_count` int unsigned NOT NULL DEFAULT 0,
  `candidates_count` int unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_business_landing_slug` (`slug`),
  KEY `idx_business_landing_business` (`business_id`),
  KEY `idx_business_landing_job` (`job_id`),
  KEY `idx_business_landing_status` (`status`),
  CONSTRAINT `fk_business_landing_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_business_landing_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `business_landing_page_submissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `landing_page_id` bigint unsigned NOT NULL,
  `business_id` bigint unsigned NOT NULL,
  `job_id` bigint unsigned DEFAULT NULL,
  `applicant_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applicant_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applicant_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payload_json` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_lp_submissions_page` (`landing_page_id`),
  KEY `idx_lp_submissions_business` (`business_id`),
  CONSTRAINT `fk_lp_submissions_page` FOREIGN KEY (`landing_page_id`) REFERENCES `business_landing_pages` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_lp_submissions_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `business_landing_page_activities` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `landing_page_id` bigint unsigned NOT NULL,
  `business_id` bigint unsigned NOT NULL,
  `activity_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'created|published|paused|closed|form_submitted|view_milestone',
  `message` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `metadata_json` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_lp_activities_page` (`landing_page_id`),
  KEY `idx_lp_activities_business` (`business_id`),
  CONSTRAINT `fk_lp_activities_page` FOREIGN KEY (`landing_page_id`) REFERENCES `business_landing_pages` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
