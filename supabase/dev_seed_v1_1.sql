-- =====================================================
-- 開発用テストデータ（v1.1スキーマ対応）
--
-- 対象クライアント: soxx
-- 用途: ダッシュボード集計ロジックの目視確認
--
-- 実行前に soxx クライアントと部署が登録済みであること
-- （20260424000002_seed_soxx_demo.sql を適用済みの状態）
-- =====================================================

-- =====================================================
-- 1. 実施回を登録
-- =====================================================
INSERT INTO survey_rounds (client_code, title, started_at, ended_at)
VALUES ('soxx', '2026年度 第1回', '2026-08-01 00:00:00+09', '2026-08-31 23:59:59+09')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. アンケート回答（8件）
--
-- カバーするシナリオ:
--   - 不調なし（損失ゼロの確認）
--   - 単一症状 / 複数症状
--   - 欠勤あり / 欠勤なし
--   - 複数の部署・性別・年代
--   - womens_health（v1.1新条件ID）
-- =====================================================

INSERT INTO survey_responses (
  id,
  client_code,
  survey_round_id,
  submitted_at,
  full_name,
  date_of_birth,
  gender,
  department,
  employment_type,
  symptom_conditions,
  symptom_conditions_other,
  primary_condition,
  symptom_days_past30,
  absentee_days_past_year,
  work_quantity,
  work_quality,
  treatment_places,
  treatment_places_other,
  treatment_frequency,
  daily_items,
  daily_items_other,
  consultation_health,
  consultation_work,
  consultation_family,
  consultation_mental,
  expert_support_intent
)
VALUES

-- 1. 頭痛＋肩こり・欠勤2日（プレゼンティーイズム＋欠勤損失の両方が発生するケース）
(
  'dev-resp-001', 'soxx',
  (SELECT id FROM survey_rounds WHERE client_code = 'soxx' ORDER BY created_at DESC LIMIT 1),
  '2026-08-01 09:15:00+09',
  '田中 太郎', '1985-03-12', 'male', '営業部', '正社員',
  ARRAY['headache', 'neck_shoulder'], NULL, 'headache',
  18, 2, 6, 5,
  ARRAY['病院・クリニック'], NULL, 2,
  ARRAY['市販薬'], NULL,
  'かかりつけ医・専門医', '会社の上司・同僚', '家族・パートナー', '相談していない',
  '内容によっては利用したい'
),

-- 2. 不調なし（損失=0のケース）
(
  'dev-resp-002', 'soxx',
  (SELECT id FROM survey_rounds WHERE client_code = 'soxx' ORDER BY created_at DESC LIMIT 1),
  '2026-08-01 10:02:00+09',
  '鈴木 花子', '1990-07-25', 'female', '総務部', '正社員',
  ARRAY['none'], NULL, NULL,
  0, 0, 10, 10,
  ARRAY[]::text[], NULL, NULL,
  ARRAY[]::text[], NULL,
  '家族・パートナー', '会社の上司・同僚', '家族・パートナー', '家族・パートナー',
  '必要ない'
),

-- 3. 腰痛＋倦怠・欠勤5日（欠勤損失が大きいケース）
(
  'dev-resp-003', 'soxx',
  (SELECT id FROM survey_rounds WHERE client_code = 'soxx' ORDER BY created_at DESC LIMIT 1),
  '2026-08-01 11:30:00+09',
  '佐藤 健一', '1978-11-08', 'male', 'システム部', '契約社員',
  ARRAY['lower_back', 'fatigue'], NULL, 'lower_back',
  22, 5, 5, 4,
  ARRAY['整体・マッサージ', '病院・クリニック'], NULL, 4,
  ARRAY['市販薬', 'サプリメント'], NULL,
  'かかりつけ医・専門医', '相談していない', '家族・パートナー', '相談していない',
  '支援があれば利用したい'
),

-- 4. 睡眠＋心の不調・欠勤なし
(
  'dev-resp-004', 'soxx',
  (SELECT id FROM survey_rounds WHERE client_code = 'soxx' ORDER BY created_at DESC LIMIT 1),
  '2026-08-01 13:45:00+09',
  '山田 美咲', '1993-02-14', 'female', '総務部', '正社員',
  ARRAY['sleep', 'mental'], NULL, 'sleep',
  20, 0, 7, 6,
  ARRAY[]::text[], NULL, NULL,
  ARRAY[]::text[], NULL,
  '産業医・保健師', '産業医・保健師', '相談していない', '産業医・保健師',
  '支援があれば利用したい'
),

-- 5. 胃腸＋倦怠・欠勤1日
(
  'dev-resp-005', 'soxx',
  (SELECT id FROM survey_rounds WHERE client_code = 'soxx' ORDER BY created_at DESC LIMIT 1),
  '2026-08-01 16:20:00+09',
  '中村 誠', '1981-09-30', 'male', '営業部', '正社員',
  ARRAY['gi', 'fatigue'], NULL, 'gi',
  12, 1, 7, 6,
  ARRAY['病院・クリニック'], NULL, 1,
  ARRAY['市販薬'], NULL,
  'かかりつけ医・専門医', '相談していない', '家族・パートナー', '相談していない',
  '内容によっては利用したい'
),

-- 6. womens_health（v1.1新条件）・欠勤3日
(
  'dev-resp-006', 'soxx',
  (SELECT id FROM survey_rounds WHERE client_code = 'soxx' ORDER BY created_at DESC LIMIT 1),
  '2026-08-02 09:00:00+09',
  '伊藤 あかり', '1995-04-20', 'female', '製造部', 'パート・アルバイト',
  ARRAY['womens_health'], NULL, 'womens_health',
  15, 3, 5, 6,
  ARRAY['病院・クリニック'], NULL, 1,
  ARRAY['市販薬'], NULL,
  'かかりつけ医・専門医', '相談していない', '家族・パートナー', '相談していない',
  '支援があれば利用したい'
),

-- 7. 腰痛のみ・欠勤8日・高年齢（50代）・パフォーマンス低下大
(
  'dev-resp-007', 'soxx',
  (SELECT id FROM survey_rounds WHERE client_code = 'soxx' ORDER BY created_at DESC LIMIT 1),
  '2026-08-02 10:30:00+09',
  '渡辺 浩一', '1970-06-03', 'male', 'システム部', '正社員',
  ARRAY['lower_back'], NULL, 'lower_back',
  25, 8, 3, 4,
  ARRAY['整体・マッサージ', '病院・クリニック'], NULL, 6,
  ARRAY['市販薬', '湿布・塗り薬'], NULL,
  'かかりつけ医・専門医', '相談していない', '相談していない', '相談していない',
  '内容によっては利用したい'
),

-- 8. アレルギー・欠勤なし・パフォーマンスほぼ低下なし
(
  'dev-resp-008', 'soxx',
  (SELECT id FROM survey_rounds WHERE client_code = 'soxx' ORDER BY created_at DESC LIMIT 1),
  '2026-08-02 14:00:00+09',
  '小林 まなみ', '1988-12-01', 'female', '企画部', '正社員',
  ARRAY['allergy'], NULL, 'allergy',
  10, 0, 8, 7,
  ARRAY[]::text[], NULL, NULL,
  ARRAY['点鼻薬・点眼薬'], NULL,
  'かかりつけ医・専門医', '相談していない', '相談していない', '相談していない',
  '必要ない'
)

ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 期待される集計結果（目視確認用）
--
-- 全8件のうち:
--   不調あり（健康問題率）: 7件 / 8件 = 87.5%
--   業務支障あり（presenteeism）: 7件 / 8件
--     ※ resp-002（不調なし）のみ除外
--   欠勤あり（absenteeism）: 5件
--     (001:2日, 003:5日, 005:1日, 006:3日, 007:8日)
--
--   欠勤損失合計 = (2+5+1+3+8) × 1万円 = 19万円
--
--   プレゼンティーイズム損失（resp-001 の例）:
--     days=18, q=6, u=5, p=1-0.6*0.5=0.7
--     18 × 12 × 0.7 × 1 = 151.2万円
-- =====================================================