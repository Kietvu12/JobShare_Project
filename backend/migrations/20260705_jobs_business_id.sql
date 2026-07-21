-- Liên kết job với tài khoản doanh nghiệp (Business portal)
-- Chạy: mysql -u ... -p ... < backend/migrations/20260705_jobs_business_id.sql

ALTER TABLE `jobs`
  ADD COLUMN `business_id` bigint unsigned DEFAULT NULL COMMENT 'Doanh nghiệp tạo job → businesses.id' AFTER `company_id`,
  ADD KEY `idx_jobs_business_id` (`business_id`),
  ADD CONSTRAINT `fk_jobs_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
