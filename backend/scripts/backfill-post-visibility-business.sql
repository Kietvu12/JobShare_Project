-- Bài published cũ (mask 7) thêm bit Business Knowledge Hub (8)
UPDATE posts
SET visibility_mask = visibility_mask | 8
WHERE status = 2
  AND (visibility_mask & 8) = 0;
