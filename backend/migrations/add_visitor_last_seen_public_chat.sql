-- Theo dõi thời điểm CTV/ứng viên mở hộp chat (để admin biết tin đã gửi đã được xem chưa)
ALTER TABLE `public_ctv_chat_sessions`
  ADD COLUMN `visitor_last_seen_at` datetime DEFAULT NULL AFTER `admin_last_seen_at`;

ALTER TABLE `public_candidate_chat_sessions`
  ADD COLUMN `visitor_last_seen_at` datetime DEFAULT NULL AFTER `admin_last_seen_at`;
