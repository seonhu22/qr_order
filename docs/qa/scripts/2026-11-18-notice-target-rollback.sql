-- 신버전 서버를 중지하고 구버전 배포를 준비한 뒤 사용자가 직접 검토/실행한다.
-- manager/staff 공지가 남으면 대상 정보 유실을 막기 위해 중단한다. 대상을 임의로 all로 바꾸지 않는다.
-- 중요: 구버전 백엔드는 대상 필터가 없어 컬럼이 남아 있어도 대상 공지가 전체에 노출될 수 있다.
-- 구버전 복귀 전에 운영자가 승인한 정책으로 대상 공지를 처리해야 한다. 자동 비활성/삭제는 하지 않는다.
-- 이 파일도 dry-run이다. 실제 제거는 마지막 ROLLBACK을 COMMIT으로 바꿔 전체 재실행한다.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';
LOCK TABLE public.brd_notice IN ACCESS EXCLUSIVE MODE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.brd_notice WHERE target <> 'all') THEN
        RAISE EXCEPTION '대상 지정 공지가 있습니다. 백업/업무 정책 확인 전 컬럼을 제거하지 않습니다.';
    END IF;
END $$;
ALTER TABLE public.brd_notice DROP CONSTRAINT brd_notice_target_check;
ALTER TABLE public.brd_notice DROP COLUMN target;
ROLLBACK;
