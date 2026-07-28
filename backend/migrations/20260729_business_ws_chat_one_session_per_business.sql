-- Một doanh nghiệp = một phiên chat WS (scout_performance), không tách theo từng request

ALTER TABLE `business_ws_chat_sessions`
  DROP INDEX `uk_ws_chat_performance_request`;

ALTER TABLE `business_ws_chat_sessions`
  ADD UNIQUE KEY `uk_ws_chat_business_session_type` (`business_id`, `session_type`);
