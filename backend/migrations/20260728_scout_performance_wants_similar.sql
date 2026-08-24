-- Scout Performance: DN yêu cầu WS tìm thêm ứng viên tương tự (sau khi đã mở hồ sơ)
ALTER TABLE `business_scout_performance_requests`
  ADD COLUMN `wants_similar_candidates` tinyint(1) NOT NULL DEFAULT 0
    COMMENT 'DN yêu cầu WS tìm thêm ứng viên tương tự'
    AFTER `business_explore_status`;
