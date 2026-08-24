-- Job salary currency (run once on staging/production)
-- Fixes: Unknown column 'salary_currency' in 'field list' when listing business jobs

ALTER TABLE `jobs`
  ADD COLUMN `salary_currency` VARCHAR(10) NOT NULL DEFAULT 'JPY'
    COMMENT 'Đơn vị tiền lương: JPY, VND, USD'
    AFTER `salary_review_jp`;
