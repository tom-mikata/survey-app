-- =====================================================
-- soxx クライアントの qq_conditions シード
--
-- 000002 でも同じ INSERT を試みているが、あの時点では PK が
-- qq_conditions(id) の単一カラムのため ON CONFLICT DO NOTHING
-- で全件スキップされる。
-- 000003 で PK が (id, client_code) の複合PKに変わった後に
-- 実行する必要があるため、このマイグレーションで行う。
-- =====================================================
INSERT INTO qq_conditions (id, label, pain_areas, sort_order, client_code)
SELECT id, label, pain_areas, sort_order, 'soxx'
FROM qq_conditions
WHERE client_code = 'default'
ON CONFLICT DO NOTHING;
