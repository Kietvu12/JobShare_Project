-- Job pickup descriptions (run once on production/staging)
ALTER TABLE `job_pickups`
  ADD COLUMN `description` TEXT NULL AFTER `cover_url`,
  ADD COLUMN `description_en` TEXT NULL AFTER `description`,
  ADD COLUMN `description_jp` TEXT NULL AFTER `description_en`;
