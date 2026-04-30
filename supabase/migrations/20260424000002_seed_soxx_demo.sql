-- =====================================================
-- soxx クライアントのデモデータ
-- =====================================================

-- クライアント登録
INSERT INTO clients (code, name) VALUES ('soxx', 'soxx')
  ON CONFLICT (code) DO NOTHING;

-- 部署
INSERT INTO departments (name, sort_order, client_code) VALUES
  ('総務部',       0, 'soxx'),
  ('営業部',       1, 'soxx'),
  ('企画部',       2, 'soxx'),
  ('システム部',   3, 'soxx'),
  ('製造部',       4, 'soxx')
ON CONFLICT DO NOTHING;

-- 健康問題の選択肢（default から複製）
INSERT INTO qq_conditions (id, label, pain_areas, sort_order, client_code)
SELECT id, label, pain_areas, sort_order, 'soxx'
FROM qq_conditions
WHERE client_code = 'default'
ON CONFLICT DO NOTHING;

-- アンケート回答（30件）
INSERT INTO survey_responses (
  id, client_code, submitted_at, department, age_group, gender,
  qq_condition, symptom_days_past30, work_quantity, work_quality,
  had_absenteeism, monthly_salary_man_yen, we_vigor, we_dedication, we_absorption
) VALUES
  ('soxx-01','soxx','2026-03-01T09:00:00Z','営業部',  '30s','male',  'none',         0, 10,10,false,35,4,4,4),
  ('soxx-02','soxx','2026-03-02T09:00:00Z','製造部',  '40s','male',  'lower_back',  14,  6, 6,false,30,3,3,4),
  ('soxx-03','soxx','2026-03-03T09:00:00Z','総務部',  '30s','female','neck_shoulder',10,  7, 7,false,28,4,4,3),
  ('soxx-04','soxx','2026-03-04T09:00:00Z','システム部','20s','male', 'eye',          8,  8, 8,false,30,5,5,5),
  ('soxx-05','soxx','2026-03-05T09:00:00Z','企画部',  '40s','female','headache',    12,  6, 5,false,32,3,4,3),
  ('soxx-06','soxx','2026-03-06T09:00:00Z','製造部',  '50s','male',  'lower_back',  20,  4, 5,true, 28,2,3,3),
  ('soxx-07','soxx','2026-03-07T09:00:00Z','営業部',  '30s','female','allergy',      7,  8, 8,false,30,4,5,4),
  ('soxx-08','soxx','2026-03-08T09:00:00Z','総務部',  '50s','female','fatigue',     18,  5, 5,false,28,2,3,2),
  ('soxx-09','soxx','2026-03-09T09:00:00Z','システム部','30s','male', 'sleep',       15,  6, 6,false,35,3,3,3),
  ('soxx-10','soxx','2026-03-10T09:00:00Z','企画部',  '20s','female','none',         0, 10,10,false,26,5,5,5),
  ('soxx-11','soxx','2026-03-11T09:00:00Z','製造部',  '40s','male',  'limb_joint',  10,  7, 6,false,30,3,4,4),
  ('soxx-12','soxx','2026-03-12T09:00:00Z','営業部',  '50s','male',  'none',         0, 10,10,false,40,4,4,4),
  ('soxx-13','soxx','2026-03-13T09:00:00Z','総務部',  '40s','female','mental',      22,  4, 4,true, 28,2,2,2),
  ('soxx-14','soxx','2026-03-14T09:00:00Z','システム部','40s','male', 'neck_shoulder',16, 6, 6,false,38,3,4,3),
  ('soxx-15','soxx','2026-03-15T09:00:00Z','企画部',  '30s','male',  'gi',           9,  7, 7,false,32,4,4,4),
  ('soxx-16','soxx','2026-03-16T09:00:00Z','製造部',  '60plus','male','lower_back', 25,  3, 4,true, 28,2,2,3),
  ('soxx-17','soxx','2026-03-17T09:00:00Z','営業部',  '20s','female','none',         0, 10,10,false,26,5,5,5),
  ('soxx-18','soxx','2026-03-18T09:00:00Z','総務部',  '30s','male',  'allergy',      6,  8, 9,false,30,4,5,4),
  ('soxx-19','soxx','2026-03-19T09:00:00Z','システム部','50s','male', 'fatigue',     20,  5, 5,true, 35,2,3,3),
  ('soxx-20','soxx','2026-03-20T09:00:00Z','企画部',  '40s','female','headache',     8,  7, 7,false,32,4,4,3),
  ('soxx-21','soxx','2026-03-21T09:00:00Z','製造部',  '30s','male',  'none',         0, 10,10,false,30,4,4,4),
  ('soxx-22','soxx','2026-03-22T09:00:00Z','営業部',  '40s','male',  'neck_shoulder',12, 7, 6,false,35,3,4,4),
  ('soxx-23','soxx','2026-03-23T09:00:00Z','総務部',  '20s','female','mens_pain',   10,  6, 6,false,26,4,4,3),
  ('soxx-24','soxx','2026-03-24T09:00:00Z','システム部','30s','female','eye',         5,  9, 9,false,30,5,5,5),
  ('soxx-25','soxx','2026-03-25T09:00:00Z','企画部',  '50s','male',  'sleep',       18,  5, 6,false,38,3,3,3),
  ('soxx-26','soxx','2026-03-26T09:00:00Z','製造部',  '40s','male',  'limb_joint',  14,  6, 5,false,30,3,3,4),
  ('soxx-27','soxx','2026-03-27T09:00:00Z','営業部',  '30s','female','none',         0, 10,10,false,28,5,5,5),
  ('soxx-28','soxx','2026-03-28T09:00:00Z','総務部',  '50s','female','fatigue',     16,  5, 5,false,28,2,3,3),
  ('soxx-29','soxx','2026-03-29T09:00:00Z','システム部','20s','male', 'none',         0, 10,10,false,26,5,5,5),
  ('soxx-30','soxx','2026-03-30T09:00:00Z','企画部',  '40s','male',  'lower_back',  11,  7, 7,false,34,3,4,4);
