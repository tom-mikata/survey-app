-- soxx の旧デモデータを削除する
-- 残すのは「第1回 (2026年3月)」「第2回 (2026年9月)」の2回分のみ

-- 削除対象の実施回に紐づく回答を先に削除（FKカスケードなし）
DELETE FROM survey_responses
WHERE client_code = 'soxx'
  AND (
    survey_round_id IS NULL
    OR survey_round_id IN (
      SELECT id FROM survey_rounds
      WHERE client_code = 'soxx'
        AND title NOT IN ('第1回 (2026年3月)', '第2回 (2026年9月)')
    )
  );

-- 上記2回以外の実施回を削除
DELETE FROM survey_rounds
WHERE client_code = 'soxx'
  AND title NOT IN ('第1回 (2026年3月)', '第2回 (2026年9月)');
