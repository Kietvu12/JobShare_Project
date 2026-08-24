-- Fix staging: bảng business_job_builder_threads thiếu cột timestamp
-- Chạy trên DB của test.ws-jobshare.com nếu API vẫn 500 với
-- "Unknown column '...updated_at' in 'order clause'"

ALTER TABLE `business_job_builder_threads`
  ADD COLUMN `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE `business_job_builder_threads`
  ADD COLUMN `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `business_job_builder_threads`
  ADD COLUMN `deleted_at` DATETIME NULL;
