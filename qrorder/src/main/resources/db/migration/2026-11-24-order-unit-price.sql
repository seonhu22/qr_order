-- INV-CON03 검토 초안. 팀 승인과 dry-run 확인 후 DBeaver에서 전체 실행한다.
-- 컬럼만 추가한다. 기존 주문은 NULL을 유지하며 가격을 역산하거나 덮어쓰지 않는다.
-- 배포 순서: DDL → 가격 저장과 조회를 함께 배포. 구버전 쓰기 인스턴스는 배포 전에 비운다.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_attribute
        WHERE attrelid IN ('public.order_detail'::regclass, 'public.order_detail_option'::regclass)
          AND attname = 'order_unit_price' AND NOT attisdropped
    ) THEN
        RAISE EXCEPTION 'order unit price migration is already applied or column names conflict';
    END IF;
END
$$;

-- 기존 쓰기 순서와 같이 상세 → 옵션. 잠금 경합 시 즉시 실패한다.
LOCK TABLE public.order_detail, public.order_detail_option IN ACCESS EXCLUSIVE MODE NOWAIT;

ALTER TABLE public.order_detail
    ADD COLUMN order_unit_price integer,
    ADD CONSTRAINT order_detail_order_unit_price_chk
        CHECK (order_unit_price >= 0) NOT VALID;

ALTER TABLE public.order_detail_option
    ADD COLUMN order_unit_price integer,
    ADD CONSTRAINT order_detail_option_order_unit_price_chk
        CHECK (order_unit_price >= 0) NOT VALID;

COMMENT ON COLUMN public.order_detail.order_unit_price IS
    'INV-CON03 주문 저장 시 검증된 메뉴 단가(원). NULL은 단가 미기록 주문.';
COMMENT ON COLUMN public.order_detail_option.order_unit_price IS
    'INV-CON03 주문 저장 시 검증된 옵션 단가(원). NULL은 단가 미기록 주문.';
COMMENT ON CONSTRAINT order_detail_order_unit_price_chk ON public.order_detail IS
    '무료 메뉴의 0원은 허용하고 음수 단가는 거부한다.';
COMMENT ON CONSTRAINT order_detail_option_order_unit_price_chk ON public.order_detail_option IS
    '무료 옵션의 0원은 허용하고 음수 단가는 거부한다.';

COMMIT;

-- 별도 승인된 점검 창에서 아래를 각각 실행하면 기존 행도 제약을 검증할 수 있다.
-- ALTER TABLE public.order_detail VALIDATE CONSTRAINT order_detail_order_unit_price_chk;
-- ALTER TABLE public.order_detail_option VALIDATE CONSTRAINT order_detail_option_order_unit_price_chk;
