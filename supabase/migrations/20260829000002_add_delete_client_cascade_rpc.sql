-- =====================================================
-- クライアント企業のカスケード削除用RPC（#40）
-- =====================================================
-- clients テーブルには関連テーブルへの ON DELETE CASCADE が設定されていないため、
-- 単純な DELETE FROM clients は外部キー制約違反になる。
-- 依存関係の順序に沿って関連データを削除する関数を用意する。
--
-- SECURITY DEFINER は付けない。呼び出し元（system_admin）自身の権限で
-- 各DELETEを実行させることで、既存のRLSポリシー（各テーブルの
-- "_admin" FOR ALL ポリシー）がそのまま適用される。system_admin以外が
-- 呼び出した場合はRLSにより個々のDELETEが失敗し、関数全体がロールバックされる。

CREATE OR REPLACE FUNCTION delete_client_cascade(p_client_code text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM mental_health_responses
    WHERE survey_response_id IN (SELECT id FROM survey_responses WHERE client_code = p_client_code);
  DELETE FROM company_support_responses
    WHERE survey_response_id IN (SELECT id FROM survey_responses WHERE client_code = p_client_code);
  DELETE FROM work_life_responses
    WHERE survey_response_id IN (SELECT id FROM survey_responses WHERE client_code = p_client_code);
  DELETE FROM exercise_responses
    WHERE survey_response_id IN (SELECT id FROM survey_responses WHERE client_code = p_client_code);
  DELETE FROM survey_responses WHERE client_code = p_client_code;
  DELETE FROM survey_rounds WHERE client_code = p_client_code;
  DELETE FROM departments WHERE client_code = p_client_code;
  DELETE FROM clients WHERE code = p_client_code;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_client_cascade(text) TO authenticated;
