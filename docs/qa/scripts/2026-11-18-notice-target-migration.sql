-- 공지 수신 대상 추가 / 사용자가 DBeaver에서 직접 적용한다.
-- 기본은 dry-run이다. 전체 실행 결과 확인 후 마지막 ROLLBACK만 COMMIT으로 바꿔 재실행한다.
-- 적용 순서: 백업 확인 → 이 SQL 적용 → 새 백엔드 실행 → 새 프론트 실행.
-- 기존 공지는 all로 유지한다. 새 코드가 먼저 실행되면 target 컬럼 없음 오류가 발생한다.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';
DO $$
BEGIN
    IF to_regclass('public.brd_notice') IS NULL THEN
        RAISE EXCEPTION 'public.brd_notice 테이블이 없습니다.';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='brd_notice' AND column_name='target') THEN
        RAISE EXCEPTION 'target 컬럼이 이미 있습니다. 재적용하지 말고 기존 적용 상태를 확인하세요.';
    END IF;
END $$;
ALTER TABLE public.brd_notice
    ADD COLUMN target varchar(10) NOT NULL DEFAULT 'all',
    ADD CONSTRAINT brd_notice_target_check CHECK (target IN ('all','manager','staff'));
COMMENT ON COLUMN public.brd_notice.target IS '공지 수신 대상: all=Client 관리자와 스태프 모두, manager=Client 관리자(user_role 01), staff=스태프(user_role 02). 기존 공지는 all.';
SELECT target,count(*) FROM public.brd_notice GROUP BY target ORDER BY target;
SELECT column_name,data_type,is_nullable,column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name='brd_notice' AND column_name='target';
ROLLBACK;
