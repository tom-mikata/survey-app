-- survey_rounds にクライアントごとの連番 round_number を追加する
--
-- 背景: id はグローバルな IDENTITY 連番のため、URLに露出すると
--       「第1回なのに ?round=5」のようになり不自然。
--       round_number は client_code スコープで 1 始まりの連番とする。

-- 1. カラム追加（既存レコードのバックフィルのため一旦 NULL 許容）
ALTER TABLE survey_rounds ADD COLUMN IF NOT EXISTS round_number integer;

-- 2. 既存レコードへのバックフィル（client_code ごとに created_at, id 順で 1 から採番）
UPDATE survey_rounds sr
SET round_number = sub.rn
FROM (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY client_code
           ORDER BY created_at, id
         )::integer AS rn
  FROM survey_rounds
) sub
WHERE sr.id = sub.id;

-- 3. NOT NULL 制約を付与
ALTER TABLE survey_rounds ALTER COLUMN round_number SET NOT NULL;

-- 4. クライアント内でユニーク制約
ALTER TABLE survey_rounds
  ADD CONSTRAINT survey_rounds_client_round_unique UNIQUE (client_code, round_number);

-- 5. 新規 INSERT 時に round_number を自動採番するトリガー関数
CREATE OR REPLACE FUNCTION assign_survey_round_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.round_number IS NULL THEN
    NEW.round_number := COALESCE(
      (SELECT MAX(round_number) FROM survey_rounds WHERE client_code = NEW.client_code),
      0
    ) + 1;
  END IF;
  RETURN NEW;
END;
$$;

-- 6. トリガー登録
DROP TRIGGER IF EXISTS trg_assign_survey_round_number ON survey_rounds;
CREATE TRIGGER trg_assign_survey_round_number
  BEFORE INSERT ON survey_rounds
  FOR EACH ROW
  EXECUTE FUNCTION assign_survey_round_number();
