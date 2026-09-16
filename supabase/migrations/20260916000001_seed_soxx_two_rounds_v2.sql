-- =====================================================
-- soxx: 第1回（2026年3月）・第2回（2026年9月）テストデータ
-- 問6-22（第2部含む）の比較モード検証用
-- =====================================================
-- 2回分・各15件。第2回では症状率・K6・POS・運動習慣が改善する設定。
-- 第2部テーブル（mental_health / company_support / work_life / exercise）
-- も全件挿入し、比較ダッシュボードで結果が表示されることを確認する。
-- =====================================================

DO $$
DECLARE
  r1 bigint;  -- 第1回 survey_round.id
  r2 bigint;  -- 第2回 survey_round.id
BEGIN

-- ── 実施回 ───────────────────────────────────────────────
INSERT INTO survey_rounds (client_code, title, started_at, ended_at)
VALUES ('soxx', '第1回 (2026年3月)', '2026-03-01', '2026-03-31')
RETURNING id INTO r1;

INSERT INTO survey_rounds (client_code, title, started_at, ended_at)
VALUES ('soxx', '第2回 (2026年9月)', '2026-09-01', '2026-09-15')
RETURNING id INTO r2;

-- ══════════════════════════════════════════════════════════
-- 第1回 回答（15件）
-- 特徴: 有症状73%、K6平均5.3、POS平均3.9、運動習慣47%
-- ══════════════════════════════════════════════════════════

INSERT INTO survey_responses (
  id, client_code, survey_round_id, submitted_at,
  full_name, full_name_kana, date_of_birth, gender, department, employment_type,
  symptom_conditions, primary_condition,
  symptom_days_past30, absentee_days_past_year, work_quantity, work_quality,
  treatment_places, treatment_frequency, daily_items,
  consultation_health, consultation_work, consultation_family, consultation_mental,
  expert_support_intent
) VALUES
  -- 01: 症状なし
  ('soxx-t1-01', 'soxx', r1, '2026-03-05T10:00:00Z',
   '田中 太郎', 'タナカ タロウ', '1990-04-15', 'male', '営業部', '正社員',
   '{none}', NULL, 0, 0, 10, 10,
   '{none}', NULL, '{none}',
   'none', 'internal', 'none', 'none', 'no'),

  -- 02: 腰痛（重め）
  ('soxx-t1-02', 'soxx', r1, '2026-03-05T10:10:00Z',
   '佐藤 健', 'サトウ ケン', '1980-06-20', 'male', '製造部', '正社員',
   '{lower_back}', 'lower_back', 18, 3, 5, 5,
   '{hospital}', 2, '{patch,medicine}',
   'external', 'none', 'none', 'none', 'interested'),

  -- 03: 首・肩こり
  ('soxx-t1-03', 'soxx', r1, '2026-03-05T10:20:00Z',
   '鈴木 花子', 'スズキ ハナコ', '1992-08-10', 'female', '総務部', '正社員',
   '{neck_shoulder}', 'neck_shoulder', 10, 0, 7, 7,
   '{massage}', 1, '{patch}',
   'none', 'none', 'none', 'none', 'no'),

  -- 04: 目の不調
  ('soxx-t1-04', 'soxx', r1, '2026-03-05T10:30:00Z',
   '山田 次郎', 'ヤマダ ジロウ', '2000-03-25', 'male', 'システム部', '正社員',
   '{eye}', 'eye', 8, 0, 8, 8,
   '{hospital}', 1, '{none}',
   'none', 'internal', 'none', 'none', 'interested'),

  -- 05: 頭痛
  ('soxx-t1-05', 'soxx', r1, '2026-03-05T10:40:00Z',
   '伊藤 京子', 'イトウ キョウコ', '1982-11-30', 'female', '企画部', '正社員',
   '{headache}', 'headache', 12, 1, 6, 5,
   '{hospital}', 2, '{medicine}',
   'external', 'none', 'none', 'none', 'want'),

  -- 06: 腰痛＋全身疲労（重症）
  ('soxx-t1-06', 'soxx', r1, '2026-03-05T10:50:00Z',
   '渡辺 剛', 'ワタナベ ツヨシ', '1972-07-05', 'male', '製造部', '正社員',
   '{lower_back,fatigue}', 'lower_back', 22, 5, 4, 4,
   '{hospital,massage}', 4, '{patch,supplement}',
   'external', 'none', 'none', 'none', 'want'),

  -- 07: 症状なし
  ('soxx-t1-07', 'soxx', r1, '2026-03-06T10:00:00Z',
   '中村 美咲', 'ナカムラ ミサキ', '1995-02-14', 'female', '営業部', '契約社員',
   '{none}', NULL, 0, 0, 10, 10,
   '{none}', NULL, '{none}',
   'none', 'none', 'none', 'none', 'no'),

  -- 08: 全身疲労＋心の不調（高リスク）
  ('soxx-t1-08', 'soxx', r1, '2026-03-06T10:10:00Z',
   '小林 恵子', 'コバヤシ ケイコ', '1970-09-22', 'female', '総務部', '正社員',
   '{fatigue,mental}', 'mental', 20, 4, 5, 4,
   '{hospital}', 2, '{medicine}',
   'external', 'none', 'none', 'external', 'want'),

  -- 09: 睡眠＋心の不調（中高リスク）
  ('soxx-t1-09', 'soxx', r1, '2026-03-06T10:20:00Z',
   '加藤 大輔', 'カトウ ダイスケ', '1991-12-01', 'male', 'システム部', '正社員',
   '{sleep,mental}', 'sleep', 15, 2, 6, 5,
   '{hospital}', 1, '{supplement}',
   'none', 'none', 'none', 'external', 'interested'),

  -- 10: 症状なし（優良）
  ('soxx-t1-10', 'soxx', r1, '2026-03-06T10:30:00Z',
   '吉田 さくら', 'ヨシダ サクラ', '2001-05-07', 'female', '企画部', '正社員',
   '{none}', NULL, 0, 0, 10, 10,
   '{none}', NULL, '{supplement}',
   'internal', 'internal', 'none', 'none', 'no'),

  -- 11: 手足の関節
  ('soxx-t1-11', 'soxx', r1, '2026-03-07T10:00:00Z',
   '山本 誠', 'ヤマモト マコト', '1984-08-18', 'male', '製造部', '正社員',
   '{limb_joint}', 'limb_joint', 10, 1, 7, 6,
   '{massage}', 2, '{support,patch}',
   'none', 'none', 'none', 'none', 'interested'),

  -- 12: 症状なし
  ('soxx-t1-12', 'soxx', r1, '2026-03-07T10:10:00Z',
   '松本 浩', 'マツモト ヒロシ', '1975-01-30', 'male', '営業部', '正社員',
   '{none}', NULL, 0, 0, 10, 10,
   '{none}', NULL, '{none}',
   'none', 'none', 'none', 'none', 'no'),

  -- 13: 心の不調＋睡眠（高リスク）
  ('soxx-t1-13', 'soxx', r1, '2026-03-07T10:20:00Z',
   '井上 由美', 'イノウエ ユミ', '1983-04-12', 'female', '総務部', '正社員',
   '{mental,sleep,fatigue}', 'mental', 25, 8, 3, 3,
   '{hospital}', 3, '{medicine}',
   'none', 'none', 'none', 'external', 'want'),

  -- 14: 首・肩こり（中程度）
  ('soxx-t1-14', 'soxx', r1, '2026-03-07T10:30:00Z',
   '木村 隆', 'キムラ タカシ', '1979-10-28', 'male', 'システム部', '正社員',
   '{neck_shoulder}', 'neck_shoulder', 14, 1, 7, 6,
   '{massage}', 2, '{patch,ointment}',
   'none', 'internal', 'none', 'none', 'no'),

  -- 15: 胃腸
  ('soxx-t1-15', 'soxx', r1, '2026-03-07T10:40:00Z',
   '林 和也', 'ハヤシ カズヤ', '1994-07-16', 'male', '企画部', '正社員',
   '{gi}', 'gi', 8, 0, 8, 8,
   '{hospital}', 1, '{medicine}',
   'none', 'none', 'none', 'none', 'no');


-- ── 第1回 第2部データ ─────────────────────────────────────

-- mental_health_responses（K6: 各0-4点、合計で分類）
INSERT INTO mental_health_responses
  (survey_response_id, q17_1_score, q17_2_score, q17_3_score, q17_4_score, q17_5_score, q17_6_score)
VALUES
  ('soxx-t1-01', 0, 1, 0, 0, 1, 0),   -- 合計2（低リスク）
  ('soxx-t1-02', 1, 1, 1, 0, 1, 0),   -- 合計4（低リスク）
  ('soxx-t1-03', 1, 0, 1, 0, 1, 0),   -- 合計3（低リスク）
  ('soxx-t1-04', 0, 0, 1, 0, 1, 0),   -- 合計2（低リスク）
  ('soxx-t1-05', 1, 1, 1, 1, 1, 0),   -- 合計5（中リスク）
  ('soxx-t1-06', 2, 1, 2, 1, 1, 1),   -- 合計8（中リスク）
  ('soxx-t1-07', 0, 0, 0, 0, 1, 0),   -- 合計1（低リスク）
  ('soxx-t1-08', 3, 2, 3, 2, 2, 2),   -- 合計14（要支援）
  ('soxx-t1-09', 2, 2, 2, 1, 2, 1),   -- 合計10（高リスク）
  ('soxx-t1-10', 0, 0, 0, 0, 0, 0),   -- 合計0（低リスク）
  ('soxx-t1-11', 1, 1, 0, 1, 1, 0),   -- 合計4（低リスク）
  ('soxx-t1-12', 0, 1, 0, 0, 1, 0),   -- 合計2（低リスク）
  ('soxx-t1-13', 3, 3, 2, 3, 2, 2),   -- 合計15（要支援）
  ('soxx-t1-14', 1, 1, 1, 1, 2, 0),   -- 合計6（中リスク）
  ('soxx-t1-15', 0, 1, 1, 0, 1, 0);   -- 合計3（低リスク）

-- company_support_responses（POS: 各1-7点）
INSERT INTO company_support_responses
  (survey_response_id, q18_1_score, q18_2_score, q18_3_score, q18_4_score)
VALUES
  ('soxx-t1-01', 5, 5, 5, 5),   -- 平均5.0
  ('soxx-t1-02', 4, 4, 4, 4),   -- 平均4.0
  ('soxx-t1-03', 4, 4, 4, 4),   -- 平均4.0
  ('soxx-t1-04', 5, 5, 5, 5),   -- 平均5.0
  ('soxx-t1-05', 3, 3, 3, 3),   -- 平均3.0
  ('soxx-t1-06', 3, 3, 3, 3),   -- 平均3.0
  ('soxx-t1-07', 5, 5, 5, 5),   -- 平均5.0
  ('soxx-t1-08', 2, 2, 2, 2),   -- 平均2.0
  ('soxx-t1-09', 3, 3, 3, 3),   -- 平均3.0
  ('soxx-t1-10', 6, 6, 6, 6),   -- 平均6.0
  ('soxx-t1-11', 4, 4, 4, 4),   -- 平均4.0
  ('soxx-t1-12', 5, 5, 5, 5),   -- 平均5.0
  ('soxx-t1-13', 2, 2, 2, 2),   -- 平均2.0
  ('soxx-t1-14', 3, 3, 3, 3),   -- 平均3.0
  ('soxx-t1-15', 4, 4, 4, 4);   -- 平均4.0

-- work_life_responses（問19-20）
INSERT INTO work_life_responses (survey_response_id, role_impact, support_desire)
VALUES
  ('soxx-t1-01', 'rarely',     'not_needed'),
  ('soxx-t1-02', 'sometimes',  'conditional'),
  ('soxx-t1-03', 'little',     'not_needed'),
  ('soxx-t1-04', 'rarely',     'not_needed'),
  ('soxx-t1-05', 'often',      'want'),
  ('soxx-t1-06', 'often',      'want'),
  ('soxx-t1-07', 'rarely',     'not_needed'),
  ('soxx-t1-08', 'very_often', 'want'),
  ('soxx-t1-09', 'often',      'want'),
  ('soxx-t1-10', 'rarely',     'not_needed'),
  ('soxx-t1-11', 'little',     'conditional'),
  ('soxx-t1-12', 'rarely',     'not_needed'),
  ('soxx-t1-13', 'very_often', 'want'),
  ('soxx-t1-14', 'sometimes',  'conditional'),
  ('soxx-t1-15', 'little',     'not_needed');

-- exercise_responses（問21-22）
INSERT INTO exercise_responses (survey_response_id, has_exercise_habit, exercise_days)
VALUES
  ('soxx-t1-01', true,  3),
  ('soxx-t1-02', false, NULL),
  ('soxx-t1-03', true,  2),
  ('soxx-t1-04', true,  4),
  ('soxx-t1-05', false, NULL),
  ('soxx-t1-06', false, NULL),
  ('soxx-t1-07', true,  2),
  ('soxx-t1-08', false, NULL),
  ('soxx-t1-09', false, NULL),
  ('soxx-t1-10', true,  5),
  ('soxx-t1-11', true,  2),
  ('soxx-t1-12', false, NULL),
  ('soxx-t1-13', false, NULL),
  ('soxx-t1-14', false, NULL),
  ('soxx-t1-15', true,  3);


-- ══════════════════════════════════════════════════════════
-- 第2回 回答（15件）
-- 特徴: 有症状60%、K6平均3.7、POS平均4.8、運動習慣80%
-- ══════════════════════════════════════════════════════════

INSERT INTO survey_responses (
  id, client_code, survey_round_id, submitted_at,
  full_name, full_name_kana, date_of_birth, gender, department, employment_type,
  symptom_conditions, primary_condition,
  symptom_days_past30, absentee_days_past_year, work_quantity, work_quality,
  treatment_places, treatment_frequency, daily_items,
  consultation_health, consultation_work, consultation_family, consultation_mental,
  expert_support_intent
) VALUES
  -- 01: 症状なし（変化なし）
  ('soxx-t2-01', 'soxx', r2, '2026-09-05T10:00:00Z',
   '田中 太郎', 'タナカ タロウ', '1990-04-15', 'male', '営業部', '正社員',
   '{none}', NULL, 0, 0, 10, 10,
   '{none}', NULL, '{none}',
   'none', 'internal', 'none', 'none', 'no'),

  -- 02: 腰痛（改善、日数減）
  ('soxx-t2-02', 'soxx', r2, '2026-09-05T10:10:00Z',
   '佐藤 健', 'サトウ ケン', '1980-06-20', 'male', '製造部', '正社員',
   '{lower_back}', 'lower_back', 10, 1, 7, 7,
   '{hospital,massage}', 1, '{patch}',
   'external', 'internal', 'none', 'none', 'no'),

  -- 03: 症状なし（改善）
  ('soxx-t2-03', 'soxx', r2, '2026-09-05T10:20:00Z',
   '鈴木 花子', 'スズキ ハナコ', '1992-08-10', 'female', '総務部', '正社員',
   '{none}', NULL, 0, 0, 9, 9,
   '{none}', NULL, '{none}',
   'none', 'none', 'none', 'none', 'no'),

  -- 04: 症状なし（改善）
  ('soxx-t2-04', 'soxx', r2, '2026-09-05T10:30:00Z',
   '山田 次郎', 'ヤマダ ジロウ', '2000-03-25', 'male', 'システム部', '正社員',
   '{none}', NULL, 0, 0, 10, 10,
   '{none}', NULL, '{none}',
   'none', 'internal', 'none', 'none', 'no'),

  -- 05: 頭痛（軽減）
  ('soxx-t2-05', 'soxx', r2, '2026-09-05T10:40:00Z',
   '伊藤 京子', 'イトウ キョウコ', '1982-11-30', 'female', '企画部', '正社員',
   '{headache}', 'headache', 6, 0, 8, 7,
   '{hospital}', 1, '{medicine}',
   'external', 'internal', 'none', 'none', 'interested'),

  -- 06: 腰痛（継続、若干改善）
  ('soxx-t2-06', 'soxx', r2, '2026-09-05T10:50:00Z',
   '渡辺 剛', 'ワタナベ ツヨシ', '1972-07-05', 'male', '製造部', '正社員',
   '{lower_back}', 'lower_back', 16, 3, 5, 6,
   '{hospital,massage}', 3, '{patch}',
   'external', 'internal', 'none', 'none', 'interested'),

  -- 07: 症状なし（変化なし）
  ('soxx-t2-07', 'soxx', r2, '2026-09-06T10:00:00Z',
   '中村 美咲', 'ナカムラ ミサキ', '1995-02-14', 'female', '営業部', '契約社員',
   '{none}', NULL, 0, 0, 10, 10,
   '{none}', NULL, '{none}',
   'none', 'none', 'none', 'none', 'no'),

  -- 08: 全身疲労（改善、心の不調は解消）
  ('soxx-t2-08', 'soxx', r2, '2026-09-06T10:10:00Z',
   '小林 恵子', 'コバヤシ ケイコ', '1970-09-22', 'female', '総務部', '正社員',
   '{fatigue}', 'fatigue', 12, 2, 6, 6,
   '{hospital}', 1, '{supplement}',
   'external', 'internal', 'none', 'internal', 'interested'),

  -- 09: 睡眠（改善、心の不調は解消）
  ('soxx-t2-09', 'soxx', r2, '2026-09-06T10:20:00Z',
   '加藤 大輔', 'カトウ ダイスケ', '1991-12-01', 'male', 'システム部', '正社員',
   '{sleep}', 'sleep', 8, 0, 7, 7,
   '{hospital}', 1, '{supplement}',
   'internal', 'internal', 'none', 'internal', 'no'),

  -- 10: 症状なし（変化なし、優良）
  ('soxx-t2-10', 'soxx', r2, '2026-09-06T10:30:00Z',
   '吉田 さくら', 'ヨシダ サクラ', '2001-05-07', 'female', '企画部', '正社員',
   '{none}', NULL, 0, 0, 10, 10,
   '{none}', NULL, '{supplement}',
   'internal', 'internal', 'none', 'none', 'no'),

  -- 11: 症状なし（改善）
  ('soxx-t2-11', 'soxx', r2, '2026-09-07T10:00:00Z',
   '山本 誠', 'ヤマモト マコト', '1984-08-18', 'male', '製造部', '正社員',
   '{none}', NULL, 0, 0, 9, 9,
   '{none}', NULL, '{support}',
   'none', 'none', 'none', 'none', 'no'),

  -- 12: 症状なし（変化なし）
  ('soxx-t2-12', 'soxx', r2, '2026-09-07T10:10:00Z',
   '松本 浩', 'マツモト ヒロシ', '1975-01-30', 'male', '営業部', '正社員',
   '{none}', NULL, 0, 0, 10, 10,
   '{none}', NULL, '{none}',
   'none', 'none', 'none', 'none', 'no'),

  -- 13: 全身疲労＋心の不調（改善傾向、継続中）
  ('soxx-t2-13', 'soxx', r2, '2026-09-07T10:20:00Z',
   '井上 由美', 'イノウエ ユミ', '1983-04-12', 'female', '総務部', '正社員',
   '{fatigue,mental}', 'mental', 18, 4, 4, 4,
   '{hospital}', 2, '{medicine}',
   'internal', 'internal', 'none', 'external', 'want'),

  -- 14: 首・肩こり（軽減）
  ('soxx-t2-14', 'soxx', r2, '2026-09-07T10:30:00Z',
   '木村 隆', 'キムラ タカシ', '1979-10-28', 'male', 'システム部', '正社員',
   '{neck_shoulder}', 'neck_shoulder', 8, 0, 8, 8,
   '{massage}', 1, '{patch}',
   'none', 'internal', 'none', 'none', 'no'),

  -- 15: 症状なし（改善）
  ('soxx-t2-15', 'soxx', r2, '2026-09-07T10:40:00Z',
   '林 和也', 'ハヤシ カズヤ', '1994-07-16', 'male', '企画部', '正社員',
   '{none}', NULL, 0, 0, 9, 9,
   '{none}', NULL, '{none}',
   'none', 'internal', 'none', 'none', 'no');


-- ── 第2回 第2部データ ─────────────────────────────────────

-- mental_health_responses（K6: 改善傾向）
INSERT INTO mental_health_responses
  (survey_response_id, q17_1_score, q17_2_score, q17_3_score, q17_4_score, q17_5_score, q17_6_score)
VALUES
  ('soxx-t2-01', 0, 0, 1, 0, 0, 0),   -- 合計1（低リスク）
  ('soxx-t2-02', 0, 1, 1, 0, 1, 0),   -- 合計3（低リスク）
  ('soxx-t2-03', 0, 1, 0, 0, 1, 0),   -- 合計2（低リスク）
  ('soxx-t2-04', 0, 0, 0, 0, 1, 0),   -- 合計1（低リスク）
  ('soxx-t2-05', 1, 0, 1, 0, 1, 0),   -- 合計3（低リスク）
  ('soxx-t2-06', 1, 1, 2, 1, 1, 0),   -- 合計6（中リスク）
  ('soxx-t2-07', 0, 0, 0, 0, 0, 0),   -- 合計0（低リスク）
  ('soxx-t2-08', 2, 2, 2, 2, 2, 1),   -- 合計11（高リスク→改善中）
  ('soxx-t2-09', 1, 1, 2, 1, 1, 1),   -- 合計7（中リスク）
  ('soxx-t2-10', 0, 0, 0, 0, 0, 0),   -- 合計0（低リスク）
  ('soxx-t2-11', 0, 0, 1, 0, 1, 0),   -- 合計2（低リスク）
  ('soxx-t2-12', 0, 0, 0, 0, 1, 0),   -- 合計1（低リスク）
  ('soxx-t2-13', 2, 2, 2, 2, 2, 2),   -- 合計12（高リスク→改善中）
  ('soxx-t2-14', 1, 0, 1, 0, 1, 1),   -- 合計4（低リスク）
  ('soxx-t2-15', 0, 0, 1, 0, 1, 0);   -- 合計2（低リスク）

-- company_support_responses（POS: 全体的に上昇）
INSERT INTO company_support_responses
  (survey_response_id, q18_1_score, q18_2_score, q18_3_score, q18_4_score)
VALUES
  ('soxx-t2-01', 6, 6, 6, 6),   -- 平均6.0（+1.0）
  ('soxx-t2-02', 5, 5, 5, 5),   -- 平均5.0（+1.0）
  ('soxx-t2-03', 5, 5, 5, 5),   -- 平均5.0（+1.0）
  ('soxx-t2-04', 6, 6, 6, 6),   -- 平均6.0（+1.0）
  ('soxx-t2-05', 4, 4, 4, 4),   -- 平均4.0（+1.0）
  ('soxx-t2-06', 4, 4, 4, 4),   -- 平均4.0（+1.0）
  ('soxx-t2-07', 6, 6, 6, 6),   -- 平均6.0（+1.0）
  ('soxx-t2-08', 3, 3, 3, 3),   -- 平均3.0（+1.0）
  ('soxx-t2-09', 4, 4, 4, 4),   -- 平均4.0（+1.0）
  ('soxx-t2-10', 7, 7, 7, 7),   -- 平均7.0（+1.0）
  ('soxx-t2-11', 5, 5, 5, 5),   -- 平均5.0（+1.0）
  ('soxx-t2-12', 5, 5, 5, 5),   -- 平均5.0（+1.0）
  ('soxx-t2-13', 3, 3, 3, 3),   -- 平均3.0（+1.0）
  ('soxx-t2-14', 4, 4, 4, 4),   -- 平均4.0（+1.0）
  ('soxx-t2-15', 5, 5, 5, 5);   -- 平均5.0（+1.0）

-- work_life_responses（改善傾向）
INSERT INTO work_life_responses (survey_response_id, role_impact, support_desire)
VALUES
  ('soxx-t2-01', 'rarely',     'not_needed'),
  ('soxx-t2-02', 'little',     'not_needed'),    -- sometimes→little 改善
  ('soxx-t2-03', 'rarely',     'not_needed'),    -- little→rarely 改善
  ('soxx-t2-04', 'rarely',     'not_needed'),
  ('soxx-t2-05', 'sometimes',  'conditional'),   -- often→sometimes 改善
  ('soxx-t2-06', 'sometimes',  'conditional'),   -- often→sometimes 改善
  ('soxx-t2-07', 'rarely',     'not_needed'),
  ('soxx-t2-08', 'often',      'want'),          -- very_often→often 改善
  ('soxx-t2-09', 'sometimes',  'conditional'),   -- often→sometimes 改善
  ('soxx-t2-10', 'rarely',     'not_needed'),
  ('soxx-t2-11', 'rarely',     'not_needed'),    -- little→rarely 改善
  ('soxx-t2-12', 'rarely',     'not_needed'),
  ('soxx-t2-13', 'often',      'want'),          -- very_often→often 改善
  ('soxx-t2-14', 'little',     'not_needed'),    -- sometimes→little 改善
  ('soxx-t2-15', 'rarely',     'not_needed');    -- little→rarely 改善

-- exercise_responses（大幅改善：47%→80%）
INSERT INTO exercise_responses (survey_response_id, has_exercise_habit, exercise_days)
VALUES
  ('soxx-t2-01', true,  3),    -- 継続
  ('soxx-t2-02', true,  1),    -- 新規開始
  ('soxx-t2-03', true,  3),    -- 2日→3日 増加
  ('soxx-t2-04', true,  4),    -- 継続
  ('soxx-t2-05', true,  1),    -- 新規開始
  ('soxx-t2-06', false, NULL), -- 継続なし
  ('soxx-t2-07', true,  3),    -- 2日→3日 増加
  ('soxx-t2-08', true,  1),    -- 新規開始
  ('soxx-t2-09', true,  2),    -- 新規開始
  ('soxx-t2-10', true,  5),    -- 継続
  ('soxx-t2-11', true,  3),    -- 2日→3日 増加
  ('soxx-t2-12', true,  1),    -- 新規開始
  ('soxx-t2-13', false, NULL), -- 継続なし
  ('soxx-t2-14', true,  2),    -- 新規開始
  ('soxx-t2-15', true,  3);    -- 新規開始

END $$;
