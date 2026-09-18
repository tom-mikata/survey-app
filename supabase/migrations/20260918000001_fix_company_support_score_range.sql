-- =====================================================
-- company_support_responses のスコア範囲を修正（#20）
-- =====================================================
-- 20260810000005_redesign_schema_v1_1.sql では、company_support_responses の
-- 各スコア列（当時は q23_score〜q26_score、現 q18_1_score〜q18_4_score）を
-- CHECK (... BETWEEN 1 AND 7) としていた。
--
-- しかし採用尺度 SPOS-J（知覚された組織的支援尺度）の実際の回答形式は
-- 0点（まったくそう思わない）〜6点（非常にそう思う）の7段階であり、
-- 正しくは 0〜6 の範囲である。UI実装時（StepCompanySupport.tsx）に判明した。
--
-- 実データはまだ存在しないため、CHECK制約を作り直すだけで安全に修正できる。

ALTER TABLE company_support_responses DROP CONSTRAINT company_support_responses_q18_1_score_check;
ALTER TABLE company_support_responses ADD CONSTRAINT company_support_responses_q18_1_score_check CHECK (q18_1_score BETWEEN 0 AND 6);

ALTER TABLE company_support_responses DROP CONSTRAINT company_support_responses_q18_2_score_check;
ALTER TABLE company_support_responses ADD CONSTRAINT company_support_responses_q18_2_score_check CHECK (q18_2_score BETWEEN 0 AND 6);

ALTER TABLE company_support_responses DROP CONSTRAINT company_support_responses_q18_3_score_check;
ALTER TABLE company_support_responses ADD CONSTRAINT company_support_responses_q18_3_score_check CHECK (q18_3_score BETWEEN 0 AND 6);

ALTER TABLE company_support_responses DROP CONSTRAINT company_support_responses_q18_4_score_check;
ALTER TABLE company_support_responses ADD CONSTRAINT company_support_responses_q18_4_score_check CHECK (q18_4_score BETWEEN 0 AND 6);
