-- Client 주문 수정 U1 신규 객체만 의존성 역순으로 제거한다.
-- 기존 주문/테이블 데이터와 객체는 변경하지 않는다.
BEGIN;

DO $$
DECLARE
    expected_constraint record;
    actual_constraint_type "char";
    expected_count integer;
    actual_count integer;
BEGIN
    IF to_regclass('public.client_order_revision') IS NULL
       OR to_regclass('public.client_order_revision_removed_detail') IS NULL THEN
        RAISE EXCEPTION 'rollback refused: both migration tables must exist';
    END IF;

    IF obj_description('public.client_order_revision'::regclass, 'pg_class')
           IS DISTINCT FROM 'Client 주문 수정 요청 단위의 영속 멱등성, 처리 상태와 성공 응답 기록'
       OR obj_description('public.client_order_revision_removed_detail'::regclass, 'pg_class')
           IS DISTINCT FROM '주문 수정 요청에서 제거된 기존 order_detail 연결 이력' THEN
        RAISE EXCEPTION 'rollback refused: migration table identity comments do not match';
    END IF;

    FOR expected_constraint IN
        SELECT *
        FROM (VALUES
            ('client_order_revision', 'client_order_revision_pkey', 'p'::"char"),
            ('client_order_revision', 'client_order_revision_plant_request_uk', 'u'::"char"),
            ('client_order_revision', 'client_order_revision_order_master_fk', 'f'::"char"),
            ('client_order_revision', 'client_order_revision_table_fk', 'f'::"char"),
            ('client_order_revision', 'client_order_revision_status_chk', 'c'::"char"),
            ('client_order_revision', 'client_order_revision_completion_chk', 'c'::"char"),
            ('client_order_revision_removed_detail', 'client_order_revision_removed_detail_pkey', 'p'::"char"),
            ('client_order_revision_removed_detail', 'client_order_revision_removed_detail_detail_uk', 'u'::"char"),
            ('client_order_revision_removed_detail', 'client_order_revision_removed_detail_revision_fk', 'f'::"char"),
            ('client_order_revision_removed_detail', 'client_order_revision_removed_detail_detail_fk', 'f'::"char")
        ) AS expected(table_name, constraint_name, constraint_type)
    LOOP
        SELECT con.contype
          INTO actual_constraint_type
          FROM pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
          JOIN pg_namespace ns ON ns.oid = rel.relnamespace
         WHERE ns.nspname = 'public'
           AND rel.relname = expected_constraint.table_name
           AND con.conname = expected_constraint.constraint_name
           AND obj_description(con.oid, 'pg_constraint') IS NOT NULL;

        IF actual_constraint_type IS DISTINCT FROM expected_constraint.constraint_type THEN
            RAISE EXCEPTION 'rollback refused: constraint %.% is missing, undocumented, or has wrong type',
                expected_constraint.table_name, expected_constraint.constraint_name;
        END IF;
    END LOOP;

    SELECT COUNT(*)
      INTO expected_count
      FROM (VALUES (1), (2), (3), (4), (5), (6), (7), (8), (9), (10)) AS expected(n);

    SELECT COUNT(*)
      INTO actual_count
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = rel.relnamespace
     WHERE ns.nspname = 'public'
       AND rel.relname IN ('client_order_revision', 'client_order_revision_removed_detail');

    IF actual_count <> expected_count THEN
        RAISE EXCEPTION 'rollback refused: expected % constraints but found %', expected_count, actual_count;
    END IF;
END
$$;

DROP TABLE public.client_order_revision_removed_detail;
DROP TABLE public.client_order_revision;

COMMIT;
