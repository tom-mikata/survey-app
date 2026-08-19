-- =====================================================
-- clients テーブルの存在確認用 RPC（#18）
-- =====================================================
-- clients テーブルは system_admin のみ SELECT 可能（20260424000001_add_clients_and_rls.sql）。
-- 匿名ユーザー（アンケート回答者）が直接 SELECT すると RLS で弾かれ 0 件になるため、
-- クライアントコードの存在確認だけを許可する RPC を用意する。
-- SECURITY DEFINER により、実行者ではなく関数所有者の権限で内部を検索するため RLS を経由しない。
-- 返り値は真偽値のみで、一覧取得はできない。

CREATE OR REPLACE FUNCTION client_exists(p_code text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM clients WHERE code = p_code);
$$;

GRANT EXECUTE ON FUNCTION client_exists(text) TO anon;
