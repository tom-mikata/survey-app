-- =====================================================
-- clients テーブルの第2部モジュール設定 取得用 RPC（#20）
-- =====================================================
-- clients テーブルは system_admin のみ SELECT 可能（20260424000001_add_clients_and_rls.sql）。
-- 匿名ユーザー（アンケート回答者）が module_mental_health 等を直接 SELECT すると
-- RLS で弾かれ、getClientModules() が常に「全モジュールOFF」にフォールバックしてしまう。
-- client_exists（20260820000001）と同じ方式で、モジュール設定の取得だけを許可するRPCを用意する。
-- SECURITY DEFINER により、実行者ではなく関数所有者の権限で内部を検索するため RLS を経由しない。
-- 返り値はモジュールON/OFFの4カラムのみで、他のクライアント情報は返さない。

CREATE OR REPLACE FUNCTION get_client_modules(p_code text)
RETURNS TABLE (
  module_mental_health   boolean,
  module_company_support boolean,
  module_work_life       boolean,
  module_exercise        boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT module_mental_health, module_company_support, module_work_life, module_exercise
  FROM clients
  WHERE code = p_code;
$$;

GRANT EXECUTE ON FUNCTION get_client_modules(text) TO anon;
