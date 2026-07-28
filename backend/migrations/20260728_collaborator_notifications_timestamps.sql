-- Timestamps cho collaborator_notifications (staging cũ có thể thiếu)
ALTER TABLE `collaborator_notifications`
  ADD COLUMN `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
