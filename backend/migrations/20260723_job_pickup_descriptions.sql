-- Job pickup descriptions (run once on production)
ALTER TABLE `job_pickups`
  ADD COLUMN `description` TEXT NULL AFTER `name_jp`,
  ADD COLUMN `description_en` TEXT NULL AFTER `description`,
  ADD COLUMN `description_jp` TEXT NULL AFTER `description_en`;
