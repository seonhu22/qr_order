-- 4C 구독 DDL 롤백. 구독 기능을 끈 앱으로 되돌린 뒤 실행한다.
-- 행이 하나라도 있으면 거부한다. 결제 기록 보존/이관은 별도 승인 대상이다.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';

LOCK TABLE public.sys_subscription, public.sys_subscription_invoice, public.sys_billing_webhook_event
    IN ACCESS EXCLUSIVE MODE NOWAIT;

DO $$
BEGIN
    IF obj_description('public.sys_subscription'::regclass, 'pg_class')
            IS DISTINCT FROM '4C 매장 구독. 매장당 진행 중 1행, 대표는 가입 때 고정.'
       OR obj_description('public.sys_subscription_invoice'::regclass, 'pg_class')
            IS DISTINCT FROM '4C 제공자 인보이스 사본. 재조회한 값만 저장.'
       OR obj_description('public.sys_billing_webhook_event'::regclass, 'pg_class')
            IS DISTINCT FROM '4C 처리한 웹훅 기록. 상태 변경과 같은 트랜잭션에서만 INSERT.' THEN
        RAISE EXCEPTION 'rollback refused: table identity mismatch';
    END IF;

    IF EXISTS (SELECT FROM public.sys_subscription)
       OR EXISTS (SELECT FROM public.sys_subscription_invoice)
       OR EXISTS (SELECT FROM public.sys_billing_webhook_event) THEN
        RAISE EXCEPTION 'rollback refused: subscription rows exist; preserve them first';
    END IF;
END
$$;

-- 자식 테이블부터 제거. CASCADE를 사용하지 않는다.
DROP TABLE public.sys_billing_webhook_event;
DROP TABLE public.sys_subscription_invoice;
DROP TABLE public.sys_subscription;

COMMIT;
