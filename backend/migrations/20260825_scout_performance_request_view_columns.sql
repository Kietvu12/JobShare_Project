-- Scout Performance requests: DN đã xem kết quả, trạng thái explore, yêu cầu ứng viên tương tự
-- Chạy idempotent: cd backend && pnpm migrate:scout-performance-view-columns
-- Hoặc SQL trực tiếp (một lần): mysql ... < backend/migrations/20260825_scout_performance_request_view_columns.sql

ALTER TABLE `business_scout_performance_requests`
  ADD COLUMN `business_viewed_at` timestamp NULL DEFAULT NULL
    COMMENT 'DN mở thông báo/kết quả lần đầu'
    AFTER `handled_at`;

ALTER TABLE `business_scout_performance_requests`
  ADD COLUMN `business_explore_status` varchar(30) NULL DEFAULT NULL
    COMMENT 'interested | declined'
    AFTER `business_viewed_at`;

ALTER TABLE `business_scout_performance_requests`
  ADD COLUMN `wants_similar_candidates` tinyint(1) NOT NULL DEFAULT 0
    COMMENT 'DN yêu cầu WS tìm thêm ứng viên tương tự'
    AFTER `business_explore_status`;
