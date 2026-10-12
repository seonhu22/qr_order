-- Client 주문 수정 마이그레이션 사전 점검 전용 SQL.
-- 카탈로그 조회와 예외 검증만 수행하며 DB 객체나 데이터를 변경하지 않는다.
DO $$
DECLARE
    required_column record;
    target_relation text;
    actual_type text;
BEGIN
    FOREACH target_relation IN ARRAY ARRAY[
        'client_order_revision',
        'client_order_revision_pkey',
        'client_order_revision_plant_request_uk',
        'client_order_revision_master_datetime_idx',
        'client_order_revision_removed_detail',
        'client_order_revision_removed_detail_pkey',
        'client_order_revision_removed_detail_detail_uk'
    ] LOOP
        IF to_regclass('public.' || target_relation) IS NOT NULL THEN
            RAISE EXCEPTION 'target relation name public.% already exists', target_relation;
        END IF;
    END LOOP;

    FOR required_column IN
        SELECT *
        FROM (VALUES
            ('order_master', 'sys_id', 'character varying(36)'),
            ('table_info', 'sys_id', 'character varying(36)'),
            ('order_detail', 'sys_id', 'character varying(36)')
        ) AS expected(table_name, column_name, expected_type)
    LOOP
        SELECT format_type(a.atttypid, a.atttypmod)
          INTO actual_type
          FROM pg_attribute a
          JOIN pg_class c ON c.oid = a.attrelid
          JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public'
           AND c.relname = required_column.table_name
           AND a.attname = required_column.column_name
           AND a.attnum > 0
           AND NOT a.attisdropped;

        IF actual_type IS NULL THEN
            RAISE EXCEPTION 'required column public.%.% does not exist',
                required_column.table_name, required_column.column_name;
        END IF;

        IF actual_type <> required_column.expected_type THEN
            RAISE EXCEPTION 'type mismatch public.%.%: expected %, actual %',
                required_column.table_name,
                required_column.column_name,
                required_column.expected_type,
                actual_type;
        END IF;
    END LOOP;

    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE connamespace = 'public'::regnamespace
          AND conname IN (
            'client_order_revision_pkey',
            'client_order_revision_plant_request_uk',
            'client_order_revision_order_master_fk',
            'client_order_revision_table_fk',
            'client_order_revision_status_chk',
            'client_order_revision_completion_chk',
            'client_order_revision_removed_detail_pkey',
            'client_order_revision_removed_detail_detail_uk',
            'client_order_revision_removed_detail_revision_fk',
            'client_order_revision_removed_detail_detail_fk'
        )
    ) THEN
        RAISE EXCEPTION 'target constraint names conflict with existing constraints';
    END IF;

    RAISE NOTICE 'client order revision migration preflight passed; no objects or data were changed';
END
$$;
