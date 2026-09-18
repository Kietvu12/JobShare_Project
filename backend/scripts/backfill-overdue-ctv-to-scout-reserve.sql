-- =============================================================================
-- Scout dự bị (admin): đưa hồ sơ CTV quá hạn 6 tháng vào danh sách quản lý
-- Database: MySQL (cv_storages)
--
-- scout_status: 0=off, 1=listed, 2=suspended, 3=reserve (Scout dự bị)
-- status CV: 4 = quá hạn 6 tháng (CV_STATUS_OVERDUE_6_MONTHS)
--
-- Khuyến nghị: backup DB trước khi chạy. Chạy từng section; xem SELECT trước UPDATE.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0) Cột hỗ trợ (bỏ qua nếu đã có — lỗi "Duplicate column" là bình thường)
-- -----------------------------------------------------------------------------
ALTER TABLE cv_storages
  ADD COLUMN scout_reserve_at DATETIME NULL AFTER scout_listed_by_collaborator_id;

ALTER TABLE cv_storages
  ADD COLUMN scout_refreshed_at DATETIME NULL AFTER scout_reserve_at;

-- -----------------------------------------------------------------------------
-- 1) Kiểm tra: CTV + đã quá hạn (status = 4), chưa ở Scout dự bị
-- -----------------------------------------------------------------------------
SELECT
  COUNT(*) AS cnt_will_move_to_reserve
FROM cv_storages
WHERE deleted_at IS NULL
  AND collaborator_id IS NOT NULL
  AND status = 4
  AND IFNULL(scout_status, 0) <> 3;

-- -----------------------------------------------------------------------------
-- 2) Chuyển vào Scout dự bị (scout_status = 3)
--    - Nếu đang trên sàn Scout (scout_status = 1): gỡ sàn, ghi scout_unlisted_at
-- -----------------------------------------------------------------------------
START TRANSACTION;

UPDATE cv_storages
SET
  scout_status = 3,
  scout_reserve_at = COALESCE(scout_reserve_at, UTC_TIMESTAMP()),
  scout_unlisted_at = CASE
    WHEN IFNULL(scout_status, 0) = 1 THEN UTC_TIMESTAMP()
    ELSE scout_unlisted_at
  END
WHERE deleted_at IS NULL
  AND collaborator_id IS NOT NULL
  AND status = 4
  AND IFNULL(scout_status, 0) <> 3;

-- Xem số dòng vừa cập nhật (MySQL: ROW_COUNT() ngay sau UPDATE)
SELECT ROW_COUNT() AS rows_updated_step2;

COMMIT;

-- -----------------------------------------------------------------------------
-- 3) (TUỲ CHỌN) CTV canonical > 6 tháng nhưng vẫn status = 1
--    → đánh status = 4 + Scout dự bị (giống scheduler, KHÔNG xử lý promote trùng)
--    Chỉ bật khi bạn chắc muốn gom luôn hồ sơ chưa bị job mark-overdue.
--    Sau block này nên chạy thêm (Node): node scripts/backfill-scout-reserve-from-overdue.js --apply
--    hoặc POST /api/admin/cvs/mark-overdue để promote bản trùng.
-- -----------------------------------------------------------------------------
/*
START TRANSACTION;

UPDATE cv_storages
SET
  status = 4,
  scout_status = 3,
  scout_reserve_at = COALESCE(scout_reserve_at, UTC_TIMESTAMP()),
  scout_unlisted_at = CASE
    WHEN IFNULL(scout_status, 0) = 1 THEN UTC_TIMESTAMP()
    ELSE scout_unlisted_at
  END
WHERE deleted_at IS NULL
  AND collaborator_id IS NOT NULL
  AND status = 1
  AND IFNULL(is_duplicate, 0) = 0
  AND duplicate_with_cv_id IS NULL
  AND COALESCE(scout_refreshed_at, created_at) < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 6 MONTH)
  AND IFNULL(scout_status, 0) <> 3;

SELECT ROW_COUNT() AS rows_updated_step3_optional;

COMMIT;
*/

-- -----------------------------------------------------------------------------
-- 4) Xác nhận danh sách Scout dự bị (admin API dùng cùng điều kiện tương đương)
-- -----------------------------------------------------------------------------
SELECT
  id,
  code,
  name,
  status,
  scout_status,
  scout_reserve_at,
  collaborator_id,
  created_at,
  scout_refreshed_at
FROM cv_storages
WHERE deleted_at IS NULL
  AND collaborator_id IS NOT NULL
  AND (
    IFNULL(scout_status, 0) = 3
    OR (
      status = 4
      AND IFNULL(scout_status, 0) IN (0, 2)
    )
  )
ORDER BY COALESCE(scout_reserve_at, updated_at) DESC
LIMIT 200;
