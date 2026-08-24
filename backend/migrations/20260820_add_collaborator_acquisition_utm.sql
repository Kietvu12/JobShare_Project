-- UTM + nguồn đăng ký CTV (collaborators)
-- MySQL < 8.0.29 không hỗ trợ ADD COLUMN IF NOT EXISTS — dùng cú pháp dưới đây.
-- Chạy một lần: mysql -u ... -p db_name < backend/migrations/20260820_add_collaborator_acquisition_utm.sql
-- Hoặc idempotent (bỏ qua cột đã có): cd backend && pnpm migrate:collaborator-acquisition

ALTER TABLE `collaborators`
  ADD COLUMN `utm_source` VARCHAR(100) NULL COMMENT 'UTM source (facebook, linkedin, x, ...)' AFTER `description`,
  ADD COLUMN `utm_medium` VARCHAR(100) NULL COMMENT 'UTM medium (social, cpc, email, ...)' AFTER `utm_source`,
  ADD COLUMN `utm_campaign` VARCHAR(150) NULL COMMENT 'UTM campaign' AFTER `utm_medium`,
  ADD COLUMN `utm_content` VARCHAR(150) NULL COMMENT 'UTM content' AFTER `utm_campaign`,
  ADD COLUMN `utm_term` VARCHAR(150) NULL COMMENT 'UTM term' AFTER `utm_content`,
  ADD COLUMN `registration_source` VARCHAR(100) NULL COMMENT 'Self-reported acquisition source' AFTER `utm_term`,
  ADD COLUMN `registration_source_detail` VARCHAR(255) NULL COMMENT 'Detail when source=other' AFTER `registration_source`;
