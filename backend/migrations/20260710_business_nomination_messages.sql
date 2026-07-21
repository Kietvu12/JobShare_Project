-- Tin nhắn nomination: thêm tác nhân Doanh nghiệp (sender_type = 5)
-- Chạy: mysql -u ... -p ... < backend/migrations/20260710_business_nomination_messages.sql

ALTER TABLE `messages`
  ADD COLUMN `business_id` bigint unsigned DEFAULT NULL AFTER `applicant_id`,
  ADD COLUMN `is_read_by_business` tinyint(1) NOT NULL DEFAULT 0 AFTER `is_read_by_applicant`;

ALTER TABLE `messages`
  ADD KEY `idx_messages_business` (`business_id`),
  ADD CONSTRAINT `fk_messages_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
