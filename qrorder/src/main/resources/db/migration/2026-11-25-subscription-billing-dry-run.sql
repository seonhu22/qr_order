-- 4C 구독 DDL 사전 점검. DDL/DML 없이 대상 테이블 부재와 연결 열 타입을 확인한다.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '30s';

DO $$
DECLARE
    expected record;
    actual_type text;
BEGIN
    IF to_regclass('public.sys_subscription') IS NOT NULL
       OR to_regclass('public.sys_subscription_invoice') IS NOT NULL
       OR to_regclass('public.sys_billing_webhook_event') IS NOT NULL THEN
        RAISE EXCEPTION 'target subscription tables already exist';
    END IF;

    FOR expected IN
        SELECT *
        FROM (VALUES
            ('sys_plant', 'plant_cd', 'character varying(50)'),
            ('sys_user', 'sys_id', 'character varying(36)'),
            ('sys_user', 'plant_cd', 'character varying(50)'),
            ('sys_user', 'user_role', 'character varying(50)'),
            ('sys_payment', 'sys_id', 'character varying(36)'),
            ('sys_payment', 'payment_fee', 'integer')
        ) AS columns(table_name, column_name, column_type)
    LOOP
        SELECT format_type(a.atttypid, a.atttypmod) INTO actual_type
        FROM pg_attribute a
        WHERE a.attrelid = to_regclass('public.' || expected.table_name)
          AND a.attname = expected.column_name
          AND a.attnum > 0 AND NOT a.attisdropped;

        IF actual_type IS DISTINCT FROM expected.column_type THEN
            RAISE EXCEPTION 'unexpected type for %.%: expected %, found %',
                expected.table_name, expected.column_name, expected.column_type, actual_type;
        END IF;
    END LOOP;
END
$$;

-- 기록용 규모. 기존 01은 레거시로 구독 없이 유지된다.
SELECT (SELECT COUNT(*) FROM public.sys_plant WHERE delete_yn = 'N') AS active_plants,
       (SELECT COUNT(*) FROM public.sys_user WHERE delete_yn = 'N' AND user_role = '01') AS active_role_01,
       (SELECT COUNT(*) FROM public.sys_user WHERE delete_yn = 'N' AND user_role = '02') AS active_role_02,
       (SELECT COUNT(*) FROM public.sys_payment WHERE COALESCE(delete_yn, 'N') = 'N') AS payment_plans;

COMMIT;
