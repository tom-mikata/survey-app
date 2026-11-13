-- =====================================================
-- soxx デモデータ（比較ダッシュボード検証用）
--
-- 対象クライアント: soxx
-- 実施回: 第1回 (2026年3月) / 第2回 (2026年9月) 各15件
-- 氏名・生年月日はすべて架空のダミーデータ
--
-- 元データ: 20260916000001_seed_soxx_two_rounds_v2.sql
-- （本番適用済み。ローカルリセット用にここへ移動）
-- =====================================================

DO $$
DECLARE
  r1 bigint;
  r2 bigint;
BEGIN

-- ── 実施回 ───────────────────────────────────────────
-- round_number は trg_assign_survey_round_number で自動採番
INSERT INTO survey_rounds (client_code, title, started_at, ended_at)
VALUES ('soxx', '第1回 (2026年3月)', '2026-03-01', '2026-03-31')
RETURNING id INTO r1;

INSERT INTO survey_rounds (client_code, title, started_at, ended_at)
VALUES ('soxx', '第2回 (2026年9月)', '2026-09-01', '2026-09-15')
RETURNING id INTO r2;

-- ══════════════════════════════════════════════════════
-- 第1回 回答（15件）
-- 特徴: 有症状73%、K6平均5.3、POS平均2.9、運動習慣47%
-- ══════════════════════════════════════════════════════

INSERT INTO survey_responses (
  id, client_code, survey_round_id, submitted_at,
  full_name, full_name_kana, date_of_birth, gender, department, employment_type,
  symptom_conditions, symptom_conditions_other, primary_condition,
  symptom_days_past30, absentee_days_past_year, work_quantity, work_quality,
  treatment_places, treatment_places_other, treatment_frequency,
  daily_items, daily_items_other,
  consultation_health, consultation_work, consultation_family, consultation_mental,
  expert_support_intent
) VALUES
  ('soxx-t1-01','soxx',r1,'2026-03-05 10:00:00+00','田中 太郎','タナカ タロウ','1990-04-15','male','営業部','正社員',ARRAY['none']::text[],NULL,NULL,0,0,10,10,ARRAY['none']::text[],NULL,NULL,ARRAY['none']::text[],NULL,'none','internal','none','none','no'),
  ('soxx-t1-02','soxx',r1,'2026-03-05 10:10:00+00','佐藤 健','サトウ ケン','1980-06-20','male','製造部','正社員',ARRAY['lower_back']::text[],NULL,'lower_back',18,3,5,5,ARRAY['hospital']::text[],NULL,2,ARRAY['patch','medicine']::text[],NULL,'external','none','none','none','interested'),
  ('soxx-t1-03','soxx',r1,'2026-03-05 10:20:00+00','鈴木 花子','スズキ ハナコ','1992-08-10','female','総務部','正社員',ARRAY['neck_shoulder']::text[],NULL,'neck_shoulder',10,0,7,7,ARRAY['massage']::text[],NULL,1,ARRAY['patch']::text[],NULL,'none','none','none','none','no'),
  ('soxx-t1-04','soxx',r1,'2026-03-05 10:30:00+00','山田 次郎','ヤマダ ジロウ','2000-03-25','male','システム部','正社員',ARRAY['eye']::text[],NULL,'eye',8,0,8,8,ARRAY['hospital']::text[],NULL,1,ARRAY['none']::text[],NULL,'none','internal','none','none','interested'),
  ('soxx-t1-05','soxx',r1,'2026-03-05 10:40:00+00','伊藤 京子','イトウ キョウコ','1982-11-30','female','企画部','正社員',ARRAY['headache']::text[],NULL,'headache',12,1,6,5,ARRAY['hospital']::text[],NULL,2,ARRAY['medicine']::text[],NULL,'external','none','none','none','want'),
  ('soxx-t1-06','soxx',r1,'2026-03-05 10:50:00+00','渡辺 剛','ワタナベ ツヨシ','1972-07-05','male','製造部','正社員',ARRAY['lower_back','fatigue']::text[],NULL,'lower_back',22,5,4,4,ARRAY['hospital','massage']::text[],NULL,4,ARRAY['patch','supplement']::text[],NULL,'external','none','none','none','want'),
  ('soxx-t1-07','soxx',r1,'2026-03-06 10:00:00+00','中村 美咲','ナカムラ ミサキ','1995-02-14','female','営業部','契約社員',ARRAY['none']::text[],NULL,NULL,0,0,10,10,ARRAY['none']::text[],NULL,NULL,ARRAY['none']::text[],NULL,'none','none','none','none','no'),
  ('soxx-t1-08','soxx',r1,'2026-03-06 10:10:00+00','小林 恵子','コバヤシ ケイコ','1970-09-22','female','総務部','正社員',ARRAY['fatigue','mental']::text[],NULL,'mental',20,4,5,4,ARRAY['hospital']::text[],NULL,2,ARRAY['medicine']::text[],NULL,'external','none','none','external','want'),
  ('soxx-t1-09','soxx',r1,'2026-03-06 10:20:00+00','加藤 大輔','カトウ ダイスケ','1991-12-01','male','システム部','正社員',ARRAY['sleep','mental']::text[],NULL,'sleep',15,2,6,5,ARRAY['hospital']::text[],NULL,1,ARRAY['supplement']::text[],NULL,'none','none','none','external','interested'),
  ('soxx-t1-10','soxx',r1,'2026-03-06 10:30:00+00','吉田 さくら','ヨシダ サクラ','2001-05-07','female','企画部','正社員',ARRAY['none']::text[],NULL,NULL,0,0,10,10,ARRAY['none']::text[],NULL,NULL,ARRAY['supplement']::text[],NULL,'internal','internal','none','none','no'),
  ('soxx-t1-11','soxx',r1,'2026-03-07 10:00:00+00','山本 誠','ヤマモト マコト','1984-08-18','male','製造部','正社員',ARRAY['limb_joint']::text[],NULL,'limb_joint',10,1,7,6,ARRAY['massage']::text[],NULL,2,ARRAY['support','patch']::text[],NULL,'none','none','none','none','interested'),
  ('soxx-t1-12','soxx',r1,'2026-03-07 10:10:00+00','松本 浩','マツモト ヒロシ','1975-01-30','male','営業部','正社員',ARRAY['none']::text[],NULL,NULL,0,0,10,10,ARRAY['none']::text[],NULL,NULL,ARRAY['none']::text[],NULL,'none','none','none','none','no'),
  ('soxx-t1-13','soxx',r1,'2026-03-07 10:20:00+00','井上 由美','イノウエ ユミ','1983-04-12','female','総務部','正社員',ARRAY['mental','sleep','fatigue']::text[],NULL,'mental',25,8,3,3,ARRAY['hospital']::text[],NULL,3,ARRAY['medicine']::text[],NULL,'none','none','none','external','want'),
  ('soxx-t1-14','soxx',r1,'2026-03-07 10:30:00+00','木村 隆','キムラ タカシ','1979-10-28','male','システム部','正社員',ARRAY['neck_shoulder']::text[],NULL,'neck_shoulder',14,1,7,6,ARRAY['massage']::text[],NULL,2,ARRAY['patch','ointment']::text[],NULL,'none','internal','none','none','no'),
  ('soxx-t1-15','soxx',r1,'2026-03-07 10:40:00+00','林 和也','ハヤシ カズヤ','1994-07-16','male','企画部','正社員',ARRAY['gi']::text[],NULL,'gi',8,0,8,8,ARRAY['hospital']::text[],NULL,1,ARRAY['medicine']::text[],NULL,'none','none','none','none','no');

-- ══════════════════════════════════════════════════════
-- 第2回 回答（15件）
-- 特徴: 有症状47%（改善）、K6平均3.1、POS平均3.9、運動習慣80%
-- ══════════════════════════════════════════════════════

INSERT INTO survey_responses (
  id, client_code, survey_round_id, submitted_at,
  full_name, full_name_kana, date_of_birth, gender, department, employment_type,
  symptom_conditions, symptom_conditions_other, primary_condition,
  symptom_days_past30, absentee_days_past_year, work_quantity, work_quality,
  treatment_places, treatment_places_other, treatment_frequency,
  daily_items, daily_items_other,
  consultation_health, consultation_work, consultation_family, consultation_mental,
  expert_support_intent
) VALUES
  ('soxx-t2-01','soxx',r2,'2026-09-05 10:00:00+00','田中 太郎','タナカ タロウ','1990-04-15','male','営業部','正社員',ARRAY['none']::text[],NULL,NULL,0,0,10,10,ARRAY['none']::text[],NULL,NULL,ARRAY['none']::text[],NULL,'none','internal','none','none','no'),
  ('soxx-t2-02','soxx',r2,'2026-09-05 10:10:00+00','佐藤 健','サトウ ケン','1980-06-20','male','製造部','正社員',ARRAY['lower_back']::text[],NULL,'lower_back',10,1,7,7,ARRAY['hospital','massage']::text[],NULL,1,ARRAY['patch']::text[],NULL,'external','internal','none','none','no'),
  ('soxx-t2-03','soxx',r2,'2026-09-05 10:20:00+00','鈴木 花子','スズキ ハナコ','1992-08-10','female','総務部','正社員',ARRAY['none']::text[],NULL,NULL,0,0,9,9,ARRAY['none']::text[],NULL,NULL,ARRAY['none']::text[],NULL,'none','none','none','none','no'),
  ('soxx-t2-04','soxx',r2,'2026-09-05 10:30:00+00','山田 次郎','ヤマダ ジロウ','2000-03-25','male','システム部','正社員',ARRAY['none']::text[],NULL,NULL,0,0,10,10,ARRAY['none']::text[],NULL,NULL,ARRAY['none']::text[],NULL,'none','internal','none','none','no'),
  ('soxx-t2-05','soxx',r2,'2026-09-05 10:40:00+00','伊藤 京子','イトウ キョウコ','1982-11-30','female','企画部','正社員',ARRAY['headache']::text[],NULL,'headache',6,0,8,7,ARRAY['hospital']::text[],NULL,1,ARRAY['medicine']::text[],NULL,'external','internal','none','none','interested'),
  ('soxx-t2-06','soxx',r2,'2026-09-05 10:50:00+00','渡辺 剛','ワタナベ ツヨシ','1972-07-05','male','製造部','正社員',ARRAY['lower_back']::text[],NULL,'lower_back',16,3,5,6,ARRAY['hospital','massage']::text[],NULL,3,ARRAY['patch']::text[],NULL,'external','internal','none','none','interested'),
  ('soxx-t2-07','soxx',r2,'2026-09-06 10:00:00+00','中村 美咲','ナカムラ ミサキ','1995-02-14','female','営業部','契約社員',ARRAY['none']::text[],NULL,NULL,0,0,10,10,ARRAY['none']::text[],NULL,NULL,ARRAY['none']::text[],NULL,'none','none','none','none','no'),
  ('soxx-t2-08','soxx',r2,'2026-09-06 10:10:00+00','小林 恵子','コバヤシ ケイコ','1970-09-22','female','総務部','正社員',ARRAY['fatigue']::text[],NULL,'fatigue',12,2,6,6,ARRAY['hospital']::text[],NULL,1,ARRAY['supplement']::text[],NULL,'external','internal','none','internal','interested'),
  ('soxx-t2-09','soxx',r2,'2026-09-06 10:20:00+00','加藤 大輔','カトウ ダイスケ','1991-12-01','male','システム部','正社員',ARRAY['sleep']::text[],NULL,'sleep',8,0,7,7,ARRAY['hospital']::text[],NULL,1,ARRAY['supplement']::text[],NULL,'internal','internal','none','internal','no'),
  ('soxx-t2-10','soxx',r2,'2026-09-06 10:30:00+00','吉田 さくら','ヨシダ サクラ','2001-05-07','female','企画部','正社員',ARRAY['none']::text[],NULL,NULL,0,0,10,10,ARRAY['none']::text[],NULL,NULL,ARRAY['supplement']::text[],NULL,'internal','internal','none','none','no'),
  ('soxx-t2-11','soxx',r2,'2026-09-07 10:00:00+00','山本 誠','ヤマモト マコト','1984-08-18','male','製造部','正社員',ARRAY['none']::text[],NULL,NULL,0,0,9,9,ARRAY['none']::text[],NULL,NULL,ARRAY['support']::text[],NULL,'none','none','none','none','no'),
  ('soxx-t2-12','soxx',r2,'2026-09-07 10:10:00+00','松本 浩','マツモト ヒロシ','1975-01-30','male','営業部','正社員',ARRAY['none']::text[],NULL,NULL,0,0,10,10,ARRAY['none']::text[],NULL,NULL,ARRAY['none']::text[],NULL,'none','none','none','none','no'),
  ('soxx-t2-13','soxx',r2,'2026-09-07 10:20:00+00','井上 由美','イノウエ ユミ','1983-04-12','female','総務部','正社員',ARRAY['fatigue','mental']::text[],NULL,'mental',18,4,4,4,ARRAY['hospital']::text[],NULL,2,ARRAY['medicine']::text[],NULL,'internal','internal','none','external','want'),
  ('soxx-t2-14','soxx',r2,'2026-09-07 10:30:00+00','木村 隆','キムラ タカシ','1979-10-28','male','システム部','正社員',ARRAY['neck_shoulder']::text[],NULL,'neck_shoulder',8,0,8,8,ARRAY['massage']::text[],NULL,1,ARRAY['patch']::text[],NULL,'none','internal','none','none','no'),
  ('soxx-t2-15','soxx',r2,'2026-09-07 10:40:00+00','林 和也','ハヤシ カズヤ','1994-07-16','male','企画部','正社員',ARRAY['none']::text[],NULL,NULL,0,0,9,9,ARRAY['none']::text[],NULL,NULL,ARRAY['none']::text[],NULL,'none','internal','none','none','no');

-- ── mental_health_responses（K6: 各0〜4点）────────────

INSERT INTO mental_health_responses (survey_response_id,q17_1_score,q17_2_score,q17_3_score,q17_4_score,q17_5_score,q17_6_score) VALUES
  ('soxx-t1-01',0,1,0,0,1,0),
  ('soxx-t1-02',1,1,1,0,1,0),
  ('soxx-t1-03',1,0,1,0,1,0),
  ('soxx-t1-04',0,0,1,0,1,0),
  ('soxx-t1-05',1,1,1,1,1,0),
  ('soxx-t1-06',2,1,2,1,1,1),
  ('soxx-t1-07',0,0,0,0,1,0),
  ('soxx-t1-08',3,2,3,2,2,2),
  ('soxx-t1-09',2,2,2,1,2,1),
  ('soxx-t1-10',0,0,0,0,0,0),
  ('soxx-t1-11',1,1,0,1,1,0),
  ('soxx-t1-12',0,1,0,0,1,0),
  ('soxx-t1-13',3,3,2,3,2,2),
  ('soxx-t1-14',1,1,1,1,2,0),
  ('soxx-t1-15',0,1,1,0,1,0),
  ('soxx-t2-01',0,0,1,0,0,0),
  ('soxx-t2-02',0,1,1,0,1,0),
  ('soxx-t2-03',0,1,0,0,1,0),
  ('soxx-t2-04',0,0,0,0,1,0),
  ('soxx-t2-05',1,0,1,0,1,0),
  ('soxx-t2-06',1,1,2,1,1,0),
  ('soxx-t2-07',0,0,0,0,0,0),
  ('soxx-t2-08',2,2,2,2,2,1),
  ('soxx-t2-09',1,1,2,1,1,1),
  ('soxx-t2-10',0,0,0,0,0,0),
  ('soxx-t2-11',0,0,1,0,1,0),
  ('soxx-t2-12',0,0,0,0,1,0),
  ('soxx-t2-13',2,2,2,2,2,2),
  ('soxx-t2-14',1,0,1,0,1,1),
  ('soxx-t2-15',0,0,1,0,1,0);

-- ── company_support_responses（SPOS-J: 各0〜6点）────────
-- 元マイグレーション(20260916)が1-7スケールで記述されていたため全値-1して変換。
-- t2-10: 原値7（1-7上限）→ 0-6スケールでは6（上限）。
-- t2-12: 原値5（typo; 本来6）→ -1後=5、設計通り t1(4)+1=5 と一致。

INSERT INTO company_support_responses (survey_response_id,q18_1_score,q18_2_score,q18_3_score,q18_4_score) VALUES
  ('soxx-t1-01',4,4,4,4),
  ('soxx-t1-02',3,3,3,3),
  ('soxx-t1-03',3,3,3,3),
  ('soxx-t1-04',4,4,4,4),
  ('soxx-t1-05',2,2,2,2),
  ('soxx-t1-06',2,2,2,2),
  ('soxx-t1-07',4,4,4,4),
  ('soxx-t1-08',1,1,1,1),
  ('soxx-t1-09',2,2,2,2),
  ('soxx-t1-10',5,5,5,5),
  ('soxx-t1-11',3,3,3,3),
  ('soxx-t1-12',4,4,4,4),
  ('soxx-t1-13',1,1,1,1),
  ('soxx-t1-14',2,2,2,2),
  ('soxx-t1-15',3,3,3,3),
  ('soxx-t2-01',5,5,5,5),
  ('soxx-t2-02',4,4,4,4),
  ('soxx-t2-03',4,4,4,4),
  ('soxx-t2-04',5,5,5,5),
  ('soxx-t2-05',3,3,3,3),
  ('soxx-t2-06',3,3,3,3),
  ('soxx-t2-07',5,5,5,5),
  ('soxx-t2-08',2,2,2,2),
  ('soxx-t2-09',3,3,3,3),
  ('soxx-t2-10',6,6,6,6),
  ('soxx-t2-11',4,4,4,4),
  ('soxx-t2-12',5,5,5,5),
  ('soxx-t2-13',2,2,2,2),
  ('soxx-t2-14',3,3,3,3),
  ('soxx-t2-15',4,4,4,4);

-- ── work_life_responses ──────────────────────────────

INSERT INTO work_life_responses (survey_response_id,role_impact,support_desire) VALUES
  ('soxx-t1-01','rarely','not_needed'),
  ('soxx-t1-02','sometimes','conditional'),
  ('soxx-t1-03','little','not_needed'),
  ('soxx-t1-04','rarely','not_needed'),
  ('soxx-t1-05','often','want'),
  ('soxx-t1-06','often','want'),
  ('soxx-t1-07','rarely','not_needed'),
  ('soxx-t1-08','very_often','want'),
  ('soxx-t1-09','often','want'),
  ('soxx-t1-10','rarely','not_needed'),
  ('soxx-t1-11','little','conditional'),
  ('soxx-t1-12','rarely','not_needed'),
  ('soxx-t1-13','very_often','want'),
  ('soxx-t1-14','sometimes','conditional'),
  ('soxx-t1-15','little','not_needed'),
  ('soxx-t2-01','rarely','not_needed'),
  ('soxx-t2-02','little','not_needed'),
  ('soxx-t2-03','rarely','not_needed'),
  ('soxx-t2-04','rarely','not_needed'),
  ('soxx-t2-05','sometimes','conditional'),
  ('soxx-t2-06','sometimes','conditional'),
  ('soxx-t2-07','rarely','not_needed'),
  ('soxx-t2-08','often','want'),
  ('soxx-t2-09','sometimes','conditional'),
  ('soxx-t2-10','rarely','not_needed'),
  ('soxx-t2-11','rarely','not_needed'),
  ('soxx-t2-12','rarely','not_needed'),
  ('soxx-t2-13','often','want'),
  ('soxx-t2-14','little','not_needed'),
  ('soxx-t2-15','rarely','not_needed');

-- ── exercise_responses ───────────────────────────────

INSERT INTO exercise_responses (survey_response_id,has_exercise_habit,exercise_days) VALUES
  ('soxx-t1-01',true,3),
  ('soxx-t1-02',false,NULL),
  ('soxx-t1-03',true,2),
  ('soxx-t1-04',true,4),
  ('soxx-t1-05',false,NULL),
  ('soxx-t1-06',false,NULL),
  ('soxx-t1-07',true,2),
  ('soxx-t1-08',false,NULL),
  ('soxx-t1-09',false,NULL),
  ('soxx-t1-10',true,5),
  ('soxx-t1-11',true,2),
  ('soxx-t1-12',false,NULL),
  ('soxx-t1-13',false,NULL),
  ('soxx-t1-14',false,NULL),
  ('soxx-t1-15',true,3),
  ('soxx-t2-01',true,3),
  ('soxx-t2-02',true,1),
  ('soxx-t2-03',true,3),
  ('soxx-t2-04',true,4),
  ('soxx-t2-05',true,1),
  ('soxx-t2-06',false,NULL),
  ('soxx-t2-07',true,3),
  ('soxx-t2-08',true,1),
  ('soxx-t2-09',true,2),
  ('soxx-t2-10',true,5),
  ('soxx-t2-11',true,3),
  ('soxx-t2-12',true,1),
  ('soxx-t2-13',false,NULL),
  ('soxx-t2-14',true,2),
  ('soxx-t2-15',true,3);

END $$;
