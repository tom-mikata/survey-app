-- F-bug: 認証済みユーザー（管理者によるテスト送信）が survey_responses に INSERT できるよう RLS ポリシーを追加
--
-- 背景:
--   既存の "survey_responses_anon_insert" ポリシーは auth.role() = 'anon' のみ許可。
--   client_admin や system_admin がログインしたままアンケートURLを開いてテスト送信すると
--   auth.role() = 'authenticated' となり INSERT が RLS にブロックされ、エラーが出る。
--   addResponse() のエラーが以前は握りつぶされていたため、完了画面には遷移するが
--   DB には何も保存されないという現象が発生していた。
--
-- 対処:
--   authenticated ロール（かつ system_admin または client_admin）のユーザーにも
--   survey_responses の INSERT を許可する。
--   一般従業員は anonymous (anon) でアクセスするため、既存ポリシーで引き続き保護される。

DROP POLICY IF EXISTS "survey_responses_auth_insert" ON survey_responses;
CREATE POLICY "survey_responses_auth_insert" ON survey_responses FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'system_admin'
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'client_admin'
    )
  );
