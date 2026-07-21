-- Sàn CTV (Candidate Sharing): doanh nghiệp đăng job + phí thưởng → WS duyệt → CTV tiến cử
-- Chạy: mysql -u ... -p ... < backend/migrations/20260709_business_ctv_marketplace.sql

CREATE TABLE IF NOT EXISTS `business_ctv_marketplace_listings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `business_id` bigint unsigned NOT NULL,
  `job_id` bigint unsigned NOT NULL,
  `referral_fee_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'percent' COMMENT 'percent | fixed',
  `referral_fee_value` decimal(15,2) NOT NULL DEFAULT 0 COMMENT '% hoặc số tiền cố định',
  `max_bonus_amount` decimal(15,2) DEFAULT NULL COMMENT 'Thưởng tối đa (optional)',
  `headcount` int unsigned NOT NULL DEFAULT 1 COMMENT 'Số lượng tuyển',
  `requirements` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Điều kiện tuyển bổ sung',
  `recruitment_deadline` date DEFAULT NULL,
  `platform_fee_percent` decimal(5,2) NOT NULL DEFAULT 20.00 COMMENT 'Phí sàn WS (10-20%)',
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '0=draft,1=pending,2=approved,3=published,4=paused,5=closed,6=rejected',
  `submitted_at` timestamp NULL DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `published_at` timestamp NULL DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `handled_by_admin_id` bigint unsigned DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admin_note` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `job_pickup_id` bigint unsigned DEFAULT NULL COMMENT 'job_pickups.id khi publish',
  `interest_count` int unsigned NOT NULL DEFAULT 0,
  `nominations_count` int unsigned NOT NULL DEFAULT 0,
  `hired_count` int unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ctv_mkt_business` (`business_id`),
  KEY `idx_ctv_mkt_job` (`job_id`),
  KEY `idx_ctv_mkt_status` (`status`),
  KEY `idx_ctv_mkt_deadline` (`recruitment_deadline`),
  CONSTRAINT `fk_ctv_mkt_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ctv_mkt_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ctv_mkt_admin` FOREIGN KEY (`handled_by_admin_id`) REFERENCES `admins` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ctv_mkt_pickup` FOREIGN KEY (`job_pickup_id`) REFERENCES `job_pickups` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `business_ctv_marketplace_interests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `listing_id` bigint unsigned NOT NULL,
  `collaborator_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ctv_mkt_interest` (`listing_id`, `collaborator_id`),
  KEY `idx_ctv_mkt_interest_listing` (`listing_id`),
  CONSTRAINT `fk_ctv_mkt_interest_listing` FOREIGN KEY (`listing_id`) REFERENCES `business_ctv_marketplace_listings` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ctv_mkt_interest_ctv` FOREIGN KEY (`collaborator_id`) REFERENCES `collaborators` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `business_ctv_marketplace_settlements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `listing_id` bigint unsigned NOT NULL,
  `job_application_id` bigint unsigned NOT NULL,
  `business_id` bigint unsigned NOT NULL,
  `collaborator_id` bigint unsigned DEFAULT NULL,
  `candidate_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_amount_business` decimal(15,2) NOT NULL DEFAULT 0 COMMENT 'DN trả cho WS',
  `platform_fee_percent` decimal(5,2) NOT NULL DEFAULT 20.00,
  `platform_fee_amount` decimal(15,2) NOT NULL DEFAULT 0,
  `ctv_payout_amount` decimal(15,2) NOT NULL DEFAULT 0 COMMENT 'WS trả CTV — ẩn với DN',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT 'pending|paid|cancelled',
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ctv_mkt_settle_business` (`business_id`),
  KEY `idx_ctv_mkt_settle_listing` (`listing_id`),
  KEY `idx_ctv_mkt_settle_app` (`job_application_id`),
  CONSTRAINT `fk_ctv_mkt_settle_listing` FOREIGN KEY (`listing_id`) REFERENCES `business_ctv_marketplace_listings` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ctv_mkt_settle_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ctv_mkt_settle_app` FOREIGN KEY (`job_application_id`) REFERENCES `job_applications` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
