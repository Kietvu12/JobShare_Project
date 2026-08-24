-- WS chat message types for Scout Performance request cards

ALTER TABLE `business_ws_chat_messages`
  ADD COLUMN `message_type` varchar(32) NOT NULL DEFAULT 'text'
    COMMENT 'text | performance_request | performance_decision'
    AFTER `content`,
  ADD COLUMN `request_payload` json DEFAULT NULL
    COMMENT 'Payload for performance_request card (requestId, status, cv info...)'
    AFTER `message_type`;
