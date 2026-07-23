-- Thêm cột nhận thông báo cho admin / doanh nghiệp trên bảng collaborator_notifications
-- Chạy: mysql -u ... -p ... < backend/migrations/20260723_collaborator_notifications_admin_business.sql

ALTER TABLE `collaborator_notifications`
  ADD COLUMN `admin_id` bigint unsigned DEFAULT NULL COMMENT 'Admin nhận thông báo → admins.id' AFTER `collaborator_id`,
  ADD COLUMN `business_id` bigint unsigned DEFAULT NULL COMMENT 'Doanh nghiệp nhận thông báo → businesses.id' AFTER `admin_id`,
  ADD KEY `idx_collaborator_notifications_admin_id` (`admin_id`),
  ADD KEY `idx_collaborator_notifications_business_id` (`business_id`);
