-- Credit cho tài khoản doanh nghiệp (JobShare Business portal)
-- Chạy: mysql -u ... -p ... < backend/migrations/20260704_business_credit.sql

ALTER TABLE `businesses`
  ADD COLUMN `credit` int NOT NULL DEFAULT 0 COMMENT 'Số credit hiện tại' AFTER `last_login_at`;

CREATE TABLE IF NOT EXISTS `business_credit_histories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `business_id` bigint unsigned NOT NULL COMMENT 'Doanh nghiệp → businesses.id',
  `change_amount` int NOT NULL COMMENT 'Thay đổi (+ cấp, - khấu trừ/sử dụng)',
  `balance_before` int NOT NULL DEFAULT 0 COMMENT 'Credit trước giao dịch',
  `balance_after` int NOT NULL DEFAULT 0 COMMENT 'Credit sau giao dịch',
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'admin_grant | admin_deduct | usage | adjustment',
  `note` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Ghi chú / lý do',
  `admin_id` bigint unsigned DEFAULT NULL COMMENT 'Admin thực hiện (nếu có)',
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_business_credit_histories_business_id` (`business_id`),
  KEY `idx_business_credit_histories_created_at` (`created_at`),
  CONSTRAINT `fk_business_credit_histories_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_business_credit_histories_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
