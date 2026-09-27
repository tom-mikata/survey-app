-- F-1: 本番DB クリーンアップスクリプト
-- 用途: 本番環境に混入したテスト回答・不要データの削除
-- 実行環境: Supabase SQL Editor (本番プロジェクト)
--
-- ⚠️  警告: このスクリプトはデータを削除します。
--     実行前に必ず check-prod-data.sql で対象を確認してください。
--     本番DBに直接実行しないこと（F-1 作業ルール）。
--     実行する場合はトランザクションを使い、COMMIT 前に必ず SELECT で確認すること。

BEGIN;

-- ----------------------------------------------------------------
-- Step 1: 削除対象の確認（COMMIT 前に必ず目視確認する）
-- ----------------------------------------------------------------

-- テスト用回答の確認
SELECT id, client_code, full_name, submitted_at
FROM survey_responses
WHERE full_name ILIKE '%テスト%' OR full_name ILIKE '%test%'
ORDER BY submitted_at DESC;

-- ----------------------------------------------------------------
-- Step 2: 関連テーブルのカスケード削除
-- （survey_responses を削除する前にモジュール回答を先に削除）
-- ----------------------------------------------------------------

-- モジュール回答の削除（テスト回答に紐づくもの）
DELETE FROM mental_health_responses
WHERE response_id IN (
  SELECT id FROM survey_responses
  WHERE full_name ILIKE '%テスト%' OR full_name ILIKE '%test%'
);

DELETE FROM company_support_responses
WHERE response_id IN (
  SELECT id FROM survey_responses
  WHERE full_name ILIKE '%テスト%' OR full_name ILIKE '%test%'
);

DELETE FROM work_life_responses
WHERE response_id IN (
  SELECT id FROM survey_responses
  WHERE full_name ILIKE '%テスト%' OR full_name ILIKE '%test%'
);

DELETE FROM exercise_responses
WHERE response_id IN (
  SELECT id FROM survey_responses
  WHERE full_name ILIKE '%テスト%' OR full_name ILIKE '%test%'
);

-- メイン回答の削除
DELETE FROM survey_responses
WHERE full_name ILIKE '%テスト%' OR full_name ILIKE '%test%';

-- ----------------------------------------------------------------
-- Step 3: 削除件数を確認してから COMMIT or ROLLBACK を選択する
-- ----------------------------------------------------------------
-- 問題なければ: COMMIT;
-- やり直す場合: ROLLBACK;

ROLLBACK; -- デフォルトはロールバック。COMMIT に変更してから実行すること。
