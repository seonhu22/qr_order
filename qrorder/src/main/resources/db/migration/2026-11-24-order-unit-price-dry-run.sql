-- INV-CON03 DBeaver 사전 점검. DDL/DML 없이 스키마와 레거시 규모를 검증한다.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '30s';

DO $$
DECLARE
    expected record;
    actual_type text;
BEGIN
    FOR expected IN
        SELECT *
        FROM (VALUES
            ('order_detail', 'link_sys_id2', 'character varying(36)'),
            ('order_detail', 'sys_plant_cd', 'character varying(50)'),
            ('order_detail', 'qty', 'integer'),
            ('order_detail_option', 'link_sys_id2', 'character varying(36)'),
            ('order_detail_option', 'sys_plant_cd', 'character varying(50)'),
            ('order_detail_option', 'qty', 'integer'),
            ('store_menu_detail', 'sys_id', 'character varying(36)'),
            ('store_menu_detail', 'sys_plant_cd', 'character varying(50)'),
            ('store_menu_detail', 'menu_price', 'integer'),
            ('store_menu_option_detail', 'sys_id', 'character varying(36)'),
            ('store_menu_option_detail', 'sys_plant_cd', 'character varying(50)'),
            ('store_menu_option_detail', 'menu_option_price', 'integer')
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

    IF EXISTS (
        SELECT 1 FROM pg_attribute
        WHERE attrelid IN ('public.order_detail'::regclass, 'public.order_detail_option'::regclass)
          AND attname = 'order_unit_price' AND attnum > 0 AND NOT attisdropped
    ) OR EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE (conrelid, conname) IN (
            ('public.order_detail'::regclass, 'order_detail_order_unit_price_chk'),
            ('public.order_detail_option'::regclass, 'order_detail_option_order_unit_price_chk')
        )
    ) THEN
        RAISE EXCEPTION 'target migration column or constraint already exists';
    END IF;
END
$$;

-- 배포 승인 시 결과를 기록한다. 누락/음수는 원인을 확인한 뒤 진행한다.
SELECT 'menu' AS item_type, COUNT(*) AS order_rows,
       COUNT(*) FILTER (WHERE m.sys_id IS NULL) AS missing_catalog,
       COUNT(*) FILTER (WHERE m.menu_price < 0) AS negative_legacy_price
FROM public.order_detail d
LEFT JOIN public.store_menu_detail m ON m.sys_id = d.link_sys_id2 AND m.sys_plant_cd = d.sys_plant_cd
UNION ALL
SELECT 'option', COUNT(*),
       COUNT(*) FILTER (WHERE m.sys_id IS NULL),
       COUNT(*) FILTER (WHERE m.menu_option_price < 0)
FROM public.order_detail_option d
LEFT JOIN public.store_menu_option_detail m ON m.sys_id = d.link_sys_id2 AND m.sys_plant_cd = d.sys_plant_cd;

COMMIT;
