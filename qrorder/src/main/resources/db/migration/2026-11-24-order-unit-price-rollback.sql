-- INV-CON03 DBeaver 롤백 초안. 구버전 앱 복구/신규 쓰기 중지 뒤 전체 실행한다.
-- 저장된 가격이 있으면 스키마를 유지한다. 컬럼 제거는 별도 보존/승인이 필요하다.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';

LOCK TABLE public.order_detail, public.order_detail_option IN ACCESS EXCLUSIVE MODE NOWAIT;

DO $$
DECLARE
    expected record;
    actual_comment text;
BEGIN
    FOR expected IN
        SELECT *
        FROM (VALUES
            ('public.order_detail'::regclass, 'order_detail_order_unit_price_chk',
             'INV-CON03 주문 저장 시 검증된 메뉴 단가(원). NULL은 단가 미기록 주문.'),
            ('public.order_detail_option'::regclass, 'order_detail_option_order_unit_price_chk',
             'INV-CON03 주문 저장 시 검증된 옵션 단가(원). NULL은 단가 미기록 주문.')
        ) AS targets(rel, constraint_name, identity_comment)
    LOOP
        SELECT col_description(a.attrelid, a.attnum) INTO actual_comment
        FROM pg_attribute a
        JOIN pg_constraint c ON c.conrelid = a.attrelid AND c.conkey = ARRAY[a.attnum]
        WHERE a.attrelid = expected.rel AND a.attname = 'order_unit_price'
          AND a.atttypid = 'integer'::regtype AND NOT a.attnotnull AND NOT a.attisdropped
          AND c.conname = expected.constraint_name AND c.contype = 'c';

        IF actual_comment IS DISTINCT FROM expected.identity_comment THEN
            RAISE EXCEPTION 'rollback refused: migration column identity mismatch on %', expected.rel;
        END IF;
    END LOOP;

    IF EXISTS (SELECT FROM public.order_detail WHERE order_unit_price IS NOT NULL)
       OR EXISTS (SELECT FROM public.order_detail_option WHERE order_unit_price IS NOT NULL) THEN
        RAISE EXCEPTION 'rollback refused: order prices exist; retain columns and preserve values';
    END IF;
END
$$;

-- 옵션 → 상세 순서로 제거. CASCADE를 사용하지 않는다.
ALTER TABLE public.order_detail_option
    DROP CONSTRAINT order_detail_option_order_unit_price_chk,
    DROP COLUMN order_unit_price;
ALTER TABLE public.order_detail
    DROP CONSTRAINT order_detail_order_unit_price_chk,
    DROP COLUMN order_unit_price;

COMMIT;
