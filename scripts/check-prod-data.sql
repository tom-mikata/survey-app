-- F-1: 本番DB データ確認スクリプト
-- 用途: 本番環境で実行前に対象データを目視確認する（SELECT のみ・破壊的操作なし）
-- 実行環境: Supabase SQL Editor (本番プロジェクト)
-- 注意: このスクリプト自体はデータを変更しない

-- クライアント一覧
SELECT id, client_code, name, created_at
FROM clients
ORDER BY created_at;

-- 調査ラウンド一覧（クライアントごと）
SELECT
  sr.id,
  sr.client_code,
  c.name AS client_name,
  sr.label,
  sr.created_at,
  (SELECT COUNT(*) FROM survey_responses WHERE survey_round_id = sr.id) AS response_count
FROM survey_rounds sr
JOIN clients c ON c.client_code = sr.client_code
ORDER BY sr.client_code, sr.created_at DESC;

-- 回答数サマリー（テーブル別）
SELECT
  'survey_responses' AS tbl,
  COUNT(*) AS total_rows,
  COUNT(DISTINCT client_code) AS clients,
  COUNT(DISTINCT survey_round_id) AS rounds
FROM survey_responses

UNION ALL

SELECT 'mental_health_responses', COUNT(*), NULL, NULL
FROM mental_health_responses

UNION ALL

SELECT 'company_support_responses', COUNT(*), NULL, NULL
FROM company_support_responses

UNION ALL

SELECT 'work_life_responses', COUNT(*), NULL, NULL
FROM work_life_responses

UNION ALL

SELECT 'exercise_responses', COUNT(*), NULL, NULL
FROM exercise_responses;

-- シードデータ（テスト用）候補の確認
-- 氏名が「テスト」「test」を含む回答
SELECT id, client_code, full_name, submitted_at
FROM survey_responses
WHERE full_name ILIKE '%テスト%' OR full_name ILIKE '%test%'
ORDER BY submitted_at DESC;

-- 特定の client_code の全回答 (client_code を差し替えて使用)
-- SELECT id, full_name, full_name_kana, date_of_birth, submitted_at
-- FROM survey_responses
-- WHERE client_code = 'XXXX'
-- ORDER BY submitted_at DESC;
