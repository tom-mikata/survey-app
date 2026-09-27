-- 認証済みユーザー（管理者によるテスト送信）が第2部の各レスポンステーブルに
-- INSERT できるよう RLS ポリシーを追加する。
--
-- 背景:
--   20260927000001 で survey_responses の同問題を修正したが、第2部テーブル
--   （mental_health_responses / company_support_responses /
--     work_life_responses / exercise_responses）にも同じ問題が残っていた。
--   既存の *_anon_insert ポリシーは auth.role() = 'anon' のみ許可しており、
--   system_admin / client_admin がログインしたままテスト送信すると第2部の
--   回答が保存されない。
--
-- 対処:
--   authenticated ロール（かつ system_admin または client_admin）のユーザーにも
--   各テーブルへの INSERT を許可する。
--   なお system_admin は *_admin ポリシー（FOR ALL）でカバーされているため
--   実質的な変更は client_admin のみ。

-- mental_health_responses
DROP POLICY IF EXISTS "mental_health_auth_insert" ON mental_health_responses;
CREATE POLICY "mental_health_auth_insert" ON mental_health_responses FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'system_admin'
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'client_admin'
    )
  );

-- company_support_responses
DROP POLICY IF EXISTS "company_support_auth_insert" ON company_support_responses;
CREATE POLICY "company_support_auth_insert" ON company_support_responses FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'system_admin'
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'client_admin'
    )
  );

-- work_life_responses
DROP POLICY IF EXISTS "work_life_auth_insert" ON work_life_responses;
CREATE POLICY "work_life_auth_insert" ON work_life_responses FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'system_admin'
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'client_admin'
    )
  );

-- exercise_responses
DROP POLICY IF EXISTS "exercise_auth_insert" ON exercise_responses;
CREATE POLICY "exercise_auth_insert" ON exercise_responses FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'system_admin'
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'client_admin'
    )
  );
