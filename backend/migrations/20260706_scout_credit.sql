-- Scout Credit: sàn hồ sơ ẩn danh + mở khóa bằng credit doanh nghiệp
-- Chạy: mysql -u ... -p ... < backend/migrations/20260706_scout_credit.sql

-- ---------------------------------------------------------------------------
-- 1. cv_storages: trạng thái đăng lên sàn Scout
-- ---------------------------------------------------------------------------
ALTER TABLE `cv_storages`
  ADD COLUMN `scout_status` tinyint NOT NULL DEFAULT 0
    COMMENT '0=chưa đăng scout, 1=đang hiển thị trên sàn, 2=tạm gỡ/suspend'
    AFTER `admin_supplement_marks`,
  ADD COLUMN `scout_public_summary` text COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'PR công khai trên sàn (ẩn danh). NULL → dùng career_summary/strengths'
    AFTER `scout_status`,
  ADD COLUMN `scout_listed_at` timestamp NULL DEFAULT NULL
    COMMENT 'Thời điểm đưa lên sàn Scout'
    AFTER `scout_public_summary`,
  ADD COLUMN `scout_unlisted_at` timestamp NULL DEFAULT NULL
    COMMENT 'Thời điểm gỡ khỏi sàn Scout'
    AFTER `scout_listed_at`,
  ADD COLUMN `scout_listed_by_admin_id` bigint unsigned DEFAULT NULL
    COMMENT 'Admin đưa lên sàn (nếu có)'
    AFTER `scout_unlisted_at`,
  ADD COLUMN `scout_listed_by_collaborator_id` bigint unsigned DEFAULT NULL
    COMMENT 'CTV đưa lên sàn (nếu có)'
    AFTER `scout_listed_by_admin_id`;

ALTER TABLE `cv_storages`
  ADD KEY `idx_cv_storages_scout_status` (`scout_status`),
  ADD KEY `idx_cv_storages_scout_listed_at` (`scout_listed_at`),
  ADD CONSTRAINT `fk_cv_storages_scout_listed_by_admin`
    FOREIGN KEY (`scout_listed_by_admin_id`) REFERENCES `admins` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cv_storages_scout_listed_by_collaborator`
    FOREIGN KEY (`scout_listed_by_collaborator_id`) REFERENCES `collaborators` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 2. Cấu hình chi phí Scout Credit (mặc định 5 credit / hồ sơ)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `scout_settings` (
  `id` tinyint unsigned NOT NULL DEFAULT 1,
  `scout_credit_cost` int NOT NULL DEFAULT 5 COMMENT 'Credit trừ mỗi lần mở hồ sơ Scout Credit',
  `is_active` tinyint NOT NULL DEFAULT 1 COMMENT '1=bật Scout Credit',
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `scout_settings` (`id`, `scout_credit_cost`, `is_active`, `updated_at`)
VALUES (1, 5, 1, NOW())
ON DUPLICATE KEY UPDATE `scout_credit_cost` = VALUES(`scout_credit_cost`);

-- ---------------------------------------------------------------------------
-- 3. Lịch sử đăng / gỡ Scout (audit)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `scout_listing_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `cv_id` bigint unsigned NOT NULL COMMENT 'cv_storages.id',
  `action` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'list | unlist | suspend',
  `actor_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'admin | collaborator',
  `actor_admin_id` bigint unsigned DEFAULT NULL,
  `actor_collaborator_id` bigint unsigned DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_scout_listing_logs_cv_id` (`cv_id`),
  KEY `idx_scout_listing_logs_created_at` (`created_at`),
  CONSTRAINT `fk_scout_listing_logs_cv` FOREIGN KEY (`cv_id`) REFERENCES `cv_storages` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_scout_listing_logs_admin` FOREIGN KEY (`actor_admin_id`) REFERENCES `admins` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_scout_listing_logs_collaborator` FOREIGN KEY (`actor_collaborator_id`) REFERENCES `collaborators` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 4. Doanh nghiệp mở khóa hồ sơ Scout (Scout Credit)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `business_scout_unlocks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `business_id` bigint unsigned NOT NULL COMMENT 'businesses.id',
  `cv_id` bigint unsigned NOT NULL COMMENT 'cv_storages.id',
  `unlock_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scout_credit'
    COMMENT 'scout_credit | scout_performance (tương lai)',
  `credit_cost` int NOT NULL DEFAULT 5 COMMENT 'Credit đã trừ tại thời điểm mở',
  `credit_history_id` bigint unsigned DEFAULT NULL COMMENT 'business_credit_histories.id',
  `unlocked_at` timestamp NULL DEFAULT NULL COMMENT 'Thời điểm mở khóa thành công',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_business_scout_unlock` (`business_id`, `cv_id`, `unlock_type`),
  KEY `idx_business_scout_unlocks_cv_id` (`cv_id`),
  KEY `idx_business_scout_unlocks_unlocked_at` (`unlocked_at`),
  CONSTRAINT `fk_business_scout_unlocks_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_business_scout_unlocks_cv` FOREIGN KEY (`cv_id`) REFERENCES `cv_storages` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_business_scout_unlocks_credit_history` FOREIGN KEY (`credit_history_id`) REFERENCES `business_credit_histories` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 5. Ứng viên đã lưu / CRM doanh nghiệp (sau khi mở khóa hoặc nguồn khác)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `business_saved_candidates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `business_id` bigint unsigned NOT NULL,
  `cv_id` bigint unsigned NOT NULL,
  `source` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scout_credit'
    COMMENT 'scout_credit | scout_performance | ctv_marketplace | other',
  `scout_unlock_id` bigint unsigned DEFAULT NULL COMMENT 'business_scout_unlocks.id nếu từ Scout Credit',
  `pipeline_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new'
    COMMENT 'new | processing | interview | hired | rejected | contact',
  `notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `saved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_business_saved_candidate` (`business_id`, `cv_id`),
  KEY `idx_business_saved_candidates_source` (`source`),
  KEY `idx_business_saved_candidates_pipeline` (`pipeline_status`),
  CONSTRAINT `fk_business_saved_candidates_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_business_saved_candidates_cv` FOREIGN KEY (`cv_id`) REFERENCES `cv_storages` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_business_saved_candidates_unlock` FOREIGN KEY (`scout_unlock_id`) REFERENCES `business_scout_unlocks` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ghi chú: business_credit_histories.type = 'usage'
--          reference_type = 'scout_unlock', reference_id = business_scout_unlocks.id
