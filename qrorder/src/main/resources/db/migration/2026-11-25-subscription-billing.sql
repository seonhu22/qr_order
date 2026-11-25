-- 4C 구독 자동 승격 DDL. 새 테이블 3개만 만든다. 기존 테이블은 바꾸지 않는다.
-- dry-run 확인 뒤 전체 실행한다. 쓰기 잠금 순서: sys_subscription, sys_subscription_invoice,
-- sys_billing_webhook_event, sys_user. 제공자 시각과 비교하므로 결제 시각 열은 timestamptz.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';

DO $$
BEGIN
    IF to_regclass('public.sys_subscription') IS NOT NULL
       OR to_regclass('public.sys_subscription_invoice') IS NOT NULL
       OR to_regclass('public.sys_billing_webhook_event') IS NOT NULL THEN
        RAISE EXCEPTION 'subscription billing migration is already applied or table names conflict';
    END IF;
END
$$;

CREATE TABLE public.sys_subscription (
    sys_id character varying(36) NOT NULL,
    plant_cd character varying(50) NOT NULL,
    owner_user_sys_id character varying(36) NOT NULL,
    plan_sys_id character varying(36),
    amount integer,
    currency character varying(3),
    period_month integer,
    provider character varying(30),
    provider_store_id character varying(100),
    provider_customer_id character varying(100),
    provider_subscription_id character varying(100),
    checkout_attempt_id character varying(100),
    checkout_expires_at timestamp with time zone,
    status character varying(20) NOT NULL,
    paid_through_at timestamp with time zone,
    grace_until timestamp with time zone,
    end_at timestamp with time zone,
    cancel_requested_at timestamp with time zone,
    expired_at timestamp with time zone,
    provider_end_status character varying(20) DEFAULT 'NONE' NOT NULL,
    payment_method_status character varying(20) DEFAULT 'NONE' NOT NULL,
    role_granted_yn character varying(1) DEFAULT 'N' NOT NULL,
    role_granted_at timestamp with time zone,
    role_revoked_at timestamp with time zone,
    last_failure_code character varying(100),
    insert_user_id character varying(50) NOT NULL,
    insert_datetime timestamp without time zone NOT NULL,
    modify_user_id character varying(50),
    modify_datetime timestamp without time zone,
    CONSTRAINT sys_subscription_pkey PRIMARY KEY (sys_id),
    CONSTRAINT sys_subscription_status_chk
        CHECK (status IN ('PENDING', 'ACTIVE', 'PAST_DUE', 'CANCEL_SCHEDULED', 'EXPIRED')),
    CONSTRAINT sys_subscription_amount_chk CHECK (amount > 0),
    CONSTRAINT sys_subscription_currency_chk CHECK (currency = 'KRW'),
    CONSTRAINT sys_subscription_period_month_chk CHECK (period_month > 0),
    CONSTRAINT sys_subscription_role_granted_chk CHECK (role_granted_yn IN ('Y', 'N')),
    CONSTRAINT sys_subscription_provider_end_chk
        CHECK (provider_end_status IN ('NONE', 'REQUESTED', 'DONE', 'FAILED')),
    CONSTRAINT sys_subscription_payment_method_chk
        CHECK (payment_method_status IN ('NONE', 'ACTIVE', 'EXPIRED')),
    CONSTRAINT sys_subscription_provider_subscription_uk
        UNIQUE (provider, provider_store_id, provider_subscription_id)
);

-- 매장당 진행 중(EXPIRED 외) 구독 1행.
CREATE UNIQUE INDEX sys_subscription_plant_open_uk
    ON public.sys_subscription (plant_cd)
    WHERE status <> 'EXPIRED';
CREATE INDEX sys_subscription_owner_idx
    ON public.sys_subscription (owner_user_sys_id);

CREATE TABLE public.sys_subscription_invoice (
    sys_id character varying(36) NOT NULL,
    subscription_sys_id character varying(36) NOT NULL,
    provider character varying(30) NOT NULL,
    provider_store_id character varying(100) NOT NULL,
    provider_invoice_id character varying(100) NOT NULL,
    charge_kind character varying(30) NOT NULL,
    amount integer NOT NULL,
    refunded_amount integer DEFAULT 0 NOT NULL,
    currency character varying(3) NOT NULL,
    status character varying(30) NOT NULL,
    attempt_count integer DEFAULT 0 NOT NULL,
    provider_updated_at timestamp with time zone NOT NULL,
    period_start_at timestamp with time zone,
    period_end_at timestamp with time zone,
    paid_at timestamp with time zone,
    apply_result character varying(20),
    insert_user_id character varying(50) NOT NULL,
    insert_datetime timestamp without time zone NOT NULL,
    modify_user_id character varying(50),
    modify_datetime timestamp without time zone,
    CONSTRAINT sys_subscription_invoice_pkey PRIMARY KEY (sys_id),
    CONSTRAINT sys_subscription_invoice_subscription_fk
        FOREIGN KEY (subscription_sys_id) REFERENCES public.sys_subscription (sys_id),
    CONSTRAINT sys_subscription_invoice_amount_chk CHECK (amount >= 0),
    CONSTRAINT sys_subscription_invoice_refund_chk CHECK (refunded_amount BETWEEN 0 AND amount),
    CONSTRAINT sys_subscription_invoice_attempt_chk CHECK (attempt_count >= 0),
    CONSTRAINT sys_subscription_invoice_status_chk
        CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED')),
    CONSTRAINT sys_subscription_invoice_apply_result_chk
        CHECK (apply_result IN ('APPLIED', 'MISMATCH', 'STALE', 'AFTER_CANCEL', 'OWNER_MISSING')),
    CONSTRAINT sys_subscription_invoice_provider_uk
        UNIQUE (provider, provider_store_id, provider_invoice_id)
);

CREATE INDEX sys_subscription_invoice_subscription_idx
    ON public.sys_subscription_invoice (subscription_sys_id);

CREATE TABLE public.sys_billing_webhook_event (
    sys_id character varying(36) NOT NULL,
    provider character varying(30) NOT NULL,
    provider_store_id character varying(100) NOT NULL,
    webhook_id character varying(200) NOT NULL,
    event_type character varying(100) NOT NULL,
    resource_id character varying(100),
    occurred_at timestamp with time zone,
    received_at timestamp with time zone NOT NULL,
    processed_at timestamp with time zone,
    result character varying(20) NOT NULL,
    CONSTRAINT sys_billing_webhook_event_pkey PRIMARY KEY (sys_id),
    CONSTRAINT sys_billing_webhook_event_result_chk CHECK (result IN ('PROCESSED', 'IGNORED', 'MISMATCH')),
    CONSTRAINT sys_billing_webhook_event_uk UNIQUE (provider, provider_store_id, webhook_id)
);

COMMENT ON TABLE public.sys_subscription IS '4C 매장 구독. 매장당 진행 중 1행, 대표는 가입 때 고정.';
COMMENT ON COLUMN public.sys_subscription.owner_user_sys_id IS '구독 대표 sys_user.sys_id. 결제자이자 승격 대상.';
COMMENT ON COLUMN public.sys_subscription.plan_sys_id IS '결제 시작 때 고른 sys_payment.sys_id. 가입 직후 PENDING은 NULL.';
COMMENT ON COLUMN public.sys_subscription.amount IS '결제 시작 때 스냅샷한 회차 금액(원).';
COMMENT ON COLUMN public.sys_subscription.status IS 'PENDING/ACTIVE/PAST_DUE/CANCEL_SCHEDULED/EXPIRED.';
COMMENT ON COLUMN public.sys_subscription.paid_through_at IS '결제된 기간의 끝. 앞으로만 움직인다.';
COMMENT ON COLUMN public.sys_subscription.grace_until IS 'PAST_DUE 유예 끝 = paid_through_at + 7일.';
COMMENT ON COLUMN public.sys_subscription.end_at IS '해지 예약 시 고정한 종료 시각.';
COMMENT ON COLUMN public.sys_subscription.provider_end_status IS '제공자 구독 종료 요청 상태 NONE/REQUESTED/DONE/FAILED.';
COMMENT ON COLUMN public.sys_subscription.role_granted_yn IS 'Y = 이 구독 결제가 02에서 01로 직접 올림. 수동 승격은 N.';
COMMENT ON TABLE public.sys_subscription_invoice IS '4C 제공자 인보이스 사본. 재조회한 값만 저장.';
COMMENT ON COLUMN public.sys_subscription_invoice.refunded_amount IS '재조회한 누적 환불 금액(원).';
COMMENT ON COLUMN public.sys_subscription_invoice.provider_updated_at IS '제공자 기준 갱신 시각. 더 새로울 때만 반영.';
COMMENT ON COLUMN public.sys_subscription_invoice.apply_result IS 'APPLIED/MISMATCH/STALE/AFTER_CANCEL/OWNER_MISSING.';
COMMENT ON TABLE public.sys_billing_webhook_event IS '4C 처리한 웹훅 기록. 상태 변경과 같은 트랜잭션에서만 INSERT.';
COMMENT ON COLUMN public.sys_billing_webhook_event.result IS 'PROCESSED/IGNORED/MISMATCH(서명 요청 ID와 조회/저장 행 연결 불일치, 행 변경 없음).';

COMMIT;
