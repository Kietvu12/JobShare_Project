-- Scout dự bị — chạy một lần (MySQL). Nếu Duplicate column thì đã có cột, bỏ qua.

ALTER TABLE cv_storages
  ADD COLUMN scout_reserve_at DATETIME NULL AFTER scout_listed_by_collaborator_id,
  ADD COLUMN scout_refreshed_at DATETIME NULL AFTER scout_reserve_at;

-- Ghi thời điểm dự bị cho hồ sơ đã scout_status=3 mà scout_reserve_at còn NULL
UPDATE cv_storages
SET scout_reserve_at = COALESCE(updated_at, UTC_TIMESTAMP())
WHERE deleted_at IS NULL
  AND IFNULL(scout_status, 0) = 3
  AND scout_reserve_at IS NULL;
