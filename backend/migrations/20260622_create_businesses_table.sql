-- Migration: tạo bảng businesses (tài khoản doanh nghiệp JobShare Business)
-- Nguồn UI: frontend/src/page/Bussiness/Register.jsx, Login.jsx
-- Quy ước đa ngôn ngữ: cột gốc = tiếng Việt, _en = English, _jp = 日本語
-- Lĩnh vực kinh doanh: many-to-many qua bảng business_job_categories → job_categories
-- Chạy: mysql -u ... -p ... < backend/migrations/20260622_create_businesses_table.sql

CREATE TABLE IF NOT EXISTS `businesses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,

  -- Bước 1: Thông tin doanh nghiệp
  `company_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tên doanh nghiệp (VI)',
  `company_name_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tên doanh nghiệp (EN)',
  `company_name_jp` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tên doanh nghiệp (JP)',
  `tax_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Mã số thuế',
  `company_size` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Quy mô doanh nghiệp (VI)',
  `company_size_en` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Quy mô doanh nghiệp (EN)',
  `company_size_jp` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Quy mô doanh nghiệp (JP)',
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Địa chỉ trụ sở (VI)',
  `address_en` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Địa chỉ trụ sở (EN)',
  `address_jp` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Địa chỉ trụ sở (JP)',
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tỉnh / Thành phố (VI)',
  `city_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tỉnh / Thành phố (EN)',
  `city_jp` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tỉnh / Thành phố (JP)',
  `country` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Việt Nam' COMMENT 'Quốc gia (VI)',
  `country_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Quốc gia (EN)',
  `country_jp` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Quốc gia (JP)',
  `business_license_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Đường dẫn file giấy phép kinh doanh (PDF, S3/local)',

  -- Bước 2: Người liên hệ (quản trị chính)
  `contact_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Họ tên (VI)',
  `contact_name_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Họ tên (EN)',
  `contact_name_jp` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Họ tên (JP)',
  `contact_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Chức vụ (VI)',
  `contact_title_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Chức vụ (EN)',
  `contact_title_jp` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Chức vụ (JP)',
  `contact_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_phone` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,

  -- Bước 3: Tài khoản đăng nhập
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Email đăng nhập portal',
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `email_verification_token_hash` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verification_expires_at` datetime DEFAULT NULL,
  `email_verification_sent_at` datetime DEFAULT NULL,
  `password_reset_token_hash` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_reset_expires_at` datetime DEFAULT NULL,

  -- Bước 4: Xác nhận & duyệt hồ sơ
  `terms_accepted_at` timestamp NULL DEFAULT NULL COMMENT 'Thời điểm đồng ý điều khoản',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '0: chờ duyệt, 1: active, 2: từ chối, 3: tạm khóa',
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Lý do từ chối (VI)',
  `rejection_reason_en` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Lý do từ chối (EN)',
  `rejection_reason_jp` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Lý do từ chối (JP)',
  `last_login_at` timestamp NULL DEFAULT NULL,

  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `businesses_email_unique` (`email`),
  UNIQUE KEY `businesses_tax_code_unique` (`tax_code`),
  KEY `businesses_status_index` (`status`),
  KEY `businesses_contact_email_index` (`contact_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `business_job_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `business_id` bigint unsigned NOT NULL COMMENT 'Doanh nghiệp → businesses.id',
  `job_category_id` bigint unsigned NOT NULL COMMENT 'Lĩnh vực kinh doanh → job_categories.id',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_business_job_categories_business_category` (`business_id`, `job_category_id`),
  KEY `idx_business_job_categories_job_category_id` (`job_category_id`),
  CONSTRAINT `fk_business_job_categories_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_business_job_categories_job_category` FOREIGN KEY (`job_category_id`) REFERENCES `job_categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
