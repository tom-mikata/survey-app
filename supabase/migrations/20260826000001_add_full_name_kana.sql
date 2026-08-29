-- =====================================================
-- 問1: フリガナ氏名の追加（#20）
-- =====================================================
-- クライアント回答（2026-08-26）：フリガナ欄を追加する。
-- 氏名・フリガナとも字種の制限・チェックは不要（自由入力）。

ALTER TABLE survey_responses
  ADD COLUMN full_name_kana text NOT NULL DEFAULT '';

ALTER TABLE survey_responses
  ALTER COLUMN full_name_kana DROP DEFAULT;
