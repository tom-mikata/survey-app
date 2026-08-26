-- =====================================================
-- 心の健康・会社のサポートのスコア列名を問番号体系に合わせて修正（#20）
-- =====================================================
-- 20260810000005_redesign_schema_v1_1.sql では、以下の誤った前提で列名を付けていた。
--   「問17〜22が6つの独立した質問」「問23〜26が4つの独立した質問」
-- クライアント確認（v1.2）の結果、正しくは以下の構造だと判明した。
--   問17（心の健康）：1つの質問に17-1〜17-6の6項目（0-4点）
--   問18（会社のサポート）：1つの質問に18-1〜18-4の4項目（1-7点）
-- 実データ・実装がまだ存在しない段階のため、列名を正しい体系に修正する。

ALTER TABLE mental_health_responses RENAME COLUMN q17_score TO q17_1_score;
ALTER TABLE mental_health_responses RENAME COLUMN q18_score TO q17_2_score;
ALTER TABLE mental_health_responses RENAME COLUMN q19_score TO q17_3_score;
ALTER TABLE mental_health_responses RENAME COLUMN q20_score TO q17_4_score;
ALTER TABLE mental_health_responses RENAME COLUMN q21_score TO q17_5_score;
ALTER TABLE mental_health_responses RENAME COLUMN q22_score TO q17_6_score;

ALTER TABLE company_support_responses RENAME COLUMN q23_score TO q18_1_score;
ALTER TABLE company_support_responses RENAME COLUMN q24_score TO q18_2_score;
ALTER TABLE company_support_responses RENAME COLUMN q25_score TO q18_3_score;
ALTER TABLE company_support_responses RENAME COLUMN q26_score TO q18_4_score;

-- CHECK制約名も列名と揃える（エラーメッセージ等での混乱を避けるため）
ALTER TABLE mental_health_responses RENAME CONSTRAINT mental_health_responses_q17_score_check TO mental_health_responses_q17_1_score_check;
ALTER TABLE mental_health_responses RENAME CONSTRAINT mental_health_responses_q18_score_check TO mental_health_responses_q17_2_score_check;
ALTER TABLE mental_health_responses RENAME CONSTRAINT mental_health_responses_q19_score_check TO mental_health_responses_q17_3_score_check;
ALTER TABLE mental_health_responses RENAME CONSTRAINT mental_health_responses_q20_score_check TO mental_health_responses_q17_4_score_check;
ALTER TABLE mental_health_responses RENAME CONSTRAINT mental_health_responses_q21_score_check TO mental_health_responses_q17_5_score_check;
ALTER TABLE mental_health_responses RENAME CONSTRAINT mental_health_responses_q22_score_check TO mental_health_responses_q17_6_score_check;

ALTER TABLE company_support_responses RENAME CONSTRAINT company_support_responses_q23_score_check TO company_support_responses_q18_1_score_check;
ALTER TABLE company_support_responses RENAME CONSTRAINT company_support_responses_q24_score_check TO company_support_responses_q18_2_score_check;
ALTER TABLE company_support_responses RENAME CONSTRAINT company_support_responses_q25_score_check TO company_support_responses_q18_3_score_check;
ALTER TABLE company_support_responses RENAME CONSTRAINT company_support_responses_q26_score_check TO company_support_responses_q18_4_score_check;
