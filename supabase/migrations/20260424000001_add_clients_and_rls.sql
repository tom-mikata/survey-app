-- =====================================================
-- Step 1: clients テーブル作成
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
  code text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- Step 2: 既存テーブルに client_code カラム追加
-- =====================================================
ALTER TABLE departments ADD COLUMN IF NOT EXISTS client_code text;
ALTER TABLE qq_conditions ADD COLUMN IF NOT EXISTS client_code text;
ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS client_code text;

-- =====================================================
-- Step 3: デフォルトクライアント作成 + 既存データ移行
-- =====================================================
INSERT INTO clients (code, name) VALUES ('default', 'デフォルト')
  ON CONFLICT (code) DO NOTHING;

UPDATE departments SET client_code = 'default' WHERE client_code IS NULL;
UPDATE qq_conditions SET client_code = 'default' WHERE client_code IS NULL;
UPDATE survey_responses SET client_code = 'default' WHERE client_code IS NULL;

-- =====================================================
-- Step 4: NOT NULL 制約 + 外部キー制約
-- =====================================================
ALTER TABLE departments ALTER COLUMN client_code SET NOT NULL;
ALTER TABLE qq_conditions ALTER COLUMN client_code SET NOT NULL;
ALTER TABLE survey_responses ALTER COLUMN client_code SET NOT NULL;

ALTER TABLE departments
  DROP CONSTRAINT IF EXISTS fk_dept_client,
  ADD CONSTRAINT fk_dept_client FOREIGN KEY (client_code) REFERENCES clients(code);

ALTER TABLE qq_conditions
  DROP CONSTRAINT IF EXISTS fk_qq_client,
  ADD CONSTRAINT fk_qq_client FOREIGN KEY (client_code) REFERENCES clients(code);

ALTER TABLE survey_responses
  DROP CONSTRAINT IF EXISTS fk_resp_client,
  ADD CONSTRAINT fk_resp_client FOREIGN KEY (client_code) REFERENCES clients(code);

-- =====================================================
-- Step 5: RLS 有効化
-- =====================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE qq_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Step 6: RLS ポリシー設定
-- =====================================================

-- clients: system_admin のみ全操作可
DROP POLICY IF EXISTS "clients_admin" ON clients;
CREATE POLICY "clients_admin" ON clients FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'system_admin');

-- departments
DROP POLICY IF EXISTS "departments_admin" ON departments;
CREATE POLICY "departments_admin" ON departments FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'system_admin');

DROP POLICY IF EXISTS "departments_client_admin" ON departments;
CREATE POLICY "departments_client_admin" ON departments FOR SELECT
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'client_admin'
    AND client_code = (auth.jwt() -> 'app_metadata' ->> 'client_code')
  );

DROP POLICY IF EXISTS "departments_anon" ON departments;
CREATE POLICY "departments_anon" ON departments FOR SELECT
  USING (auth.role() = 'anon');

-- qq_conditions
DROP POLICY IF EXISTS "qq_conditions_admin" ON qq_conditions;
CREATE POLICY "qq_conditions_admin" ON qq_conditions FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'system_admin');

DROP POLICY IF EXISTS "qq_conditions_client_admin" ON qq_conditions;
CREATE POLICY "qq_conditions_client_admin" ON qq_conditions FOR SELECT
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'client_admin'
    AND client_code = (auth.jwt() -> 'app_metadata' ->> 'client_code')
  );

DROP POLICY IF EXISTS "qq_conditions_anon" ON qq_conditions;
CREATE POLICY "qq_conditions_anon" ON qq_conditions FOR SELECT
  USING (auth.role() = 'anon');

-- survey_responses
DROP POLICY IF EXISTS "survey_responses_admin" ON survey_responses;
CREATE POLICY "survey_responses_admin" ON survey_responses FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'system_admin');

DROP POLICY IF EXISTS "survey_responses_client_admin" ON survey_responses;
CREATE POLICY "survey_responses_client_admin" ON survey_responses FOR SELECT
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'client_admin'
    AND client_code = (auth.jwt() -> 'app_metadata' ->> 'client_code')
  );

DROP POLICY IF EXISTS "survey_responses_anon_insert" ON survey_responses;
CREATE POLICY "survey_responses_anon_insert" ON survey_responses FOR INSERT
  WITH CHECK (auth.role() = 'anon');
