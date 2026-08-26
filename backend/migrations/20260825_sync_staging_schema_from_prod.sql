-- Sync staging schema gaps found vs jobshare_prod.sql (2026-08-25)
-- Prod has these columns; staging was missing them.
--
-- Tables affected (20 columns):
--   collaborators (7): utm_*, registration_source*
--   job_pickups (3): description, description_en, description_jp
--   public_ctv_chat_messages / public_candidate_chat_messages (4 each): attachment_*
--   public_ctv_chat_sessions / public_candidate_chat_sessions (1 each): visitor_last_seen_at
--
-- Idempotent run (recommended):
--   cd backend && pnpm migrate:sync-staging-from-prod
--
-- Manual SQL (run once; fails if column already exists):
--   mysql -u ... -p jobshare_staging < backend/migrations/20260825_sync_staging_schema_from_prod.sql

-- 1) Collaborators — UTM & acquisition source
ALTER TABLE `collaborators`
  ADD COLUMN `utm_source` VARCHAR(100) NULL COMMENT 'UTM source (facebook, linkedin, x, ...)' AFTER `description`,
  ADD COLUMN `utm_medium` VARCHAR(100) NULL COMMENT 'UTM medium (social, cpc, email, ...)' AFTER `utm_source`,
  ADD COLUMN `utm_campaign` VARCHAR(150) NULL COMMENT 'UTM campaign' AFTER `utm_medium`,
  ADD COLUMN `utm_content` VARCHAR(150) NULL COMMENT 'UTM content' AFTER `utm_campaign`,
  ADD COLUMN `utm_term` VARCHAR(150) NULL COMMENT 'UTM term' AFTER `utm_content`,
  ADD COLUMN `registration_source` VARCHAR(100) NULL COMMENT 'Self-reported acquisition source' AFTER `utm_term`,
  ADD COLUMN `registration_source_detail` VARCHAR(255) NULL COMMENT 'Detail when source=other' AFTER `registration_source`;

-- 2) Job pickups — multilingual descriptions
ALTER TABLE `job_pickups`
  ADD COLUMN `description` TEXT NULL AFTER `cover_url`,
  ADD COLUMN `description_en` TEXT NULL AFTER `description`,
  ADD COLUMN `description_jp` TEXT NULL AFTER `description_en`;

-- 3) Public CTV chat — file attachments on messages
ALTER TABLE `public_ctv_chat_messages`
  ADD COLUMN `attachment_name` VARCHAR(255) NULL AFTER `body_en`,
  ADD COLUMN `attachment_key` VARCHAR(512) NULL AFTER `attachment_name`,
  ADD COLUMN `attachment_mime_type` VARCHAR(128) NULL AFTER `attachment_key`,
  ADD COLUMN `attachment_size` INT UNSIGNED NULL AFTER `attachment_mime_type`;

-- 4) Public candidate chat — file attachments on messages
ALTER TABLE `public_candidate_chat_messages`
  ADD COLUMN `attachment_name` VARCHAR(255) NULL AFTER `body_en`,
  ADD COLUMN `attachment_key` VARCHAR(512) NULL AFTER `attachment_name`,
  ADD COLUMN `attachment_mime_type` VARCHAR(128) NULL AFTER `attachment_key`,
  ADD COLUMN `attachment_size` INT UNSIGNED NULL AFTER `attachment_mime_type`;

-- 5) Public chat sessions — visitor read receipts
ALTER TABLE `public_ctv_chat_sessions`
  ADD COLUMN `visitor_last_seen_at` DATETIME NULL AFTER `admin_last_seen_at`;

ALTER TABLE `public_candidate_chat_sessions`
  ADD COLUMN `visitor_last_seen_at` DATETIME NULL AFTER `admin_last_seen_at`;
