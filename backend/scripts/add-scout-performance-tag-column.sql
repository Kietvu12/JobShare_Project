-- Tag hồ sơ khi admin gửi cho doanh nghiệp qua Scout Performance
ALTER TABLE `cv_storages`
  ADD COLUMN `scout_performance_tagged_at` timestamp NULL DEFAULT NULL
    COMMENT 'Thời điểm admin gửi hồ sơ cho DN qua Scout Performance'
    AFTER `scout_listed_by_collaborator_id`;
