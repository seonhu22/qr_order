-- 4C 가입 선행 보안. 같은 사업자번호(plant_cd)로 살아 있는 매장이 두 개 생기지 않게 한다.
-- 삭제된 매장(delete_yn='Y')은 제외한다. dry-run에서 중복 0건을 확인한 뒤 전체 실행한다.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';

DO $$
BEGIN
    IF to_regclass('public.sys_plant_plant_cd_active_uk') IS NOT NULL THEN
        RAISE EXCEPTION 'sys_plant active unique migration is already applied';
    END IF;
    IF EXISTS (
        SELECT 1 FROM public.sys_plant WHERE delete_yn = 'N'
        GROUP BY plant_cd HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'duplicate active plant_cd exists; run dry-run and resolve first';
    END IF;
END
$$;

CREATE UNIQUE INDEX sys_plant_plant_cd_active_uk
    ON public.sys_plant (plant_cd)
    WHERE delete_yn = 'N';

COMMENT ON INDEX public.sys_plant_plant_cd_active_uk IS
    '4C 살아 있는 매장의 사업자번호(plant_cd) 중복 가입 차단.';

COMMIT;
