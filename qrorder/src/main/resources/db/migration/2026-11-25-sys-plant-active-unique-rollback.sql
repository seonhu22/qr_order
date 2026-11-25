-- 4C 가입 선행 보안 롤백. 인덱스만 제거한다. 데이터는 바꾸지 않는다.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';

DO $$
BEGIN
    IF obj_description('public.sys_plant_plant_cd_active_uk'::regclass, 'pg_class')
            IS DISTINCT FROM '4C 살아 있는 매장의 사업자번호(plant_cd) 중복 가입 차단.' THEN
        RAISE EXCEPTION 'rollback refused: index identity mismatch';
    END IF;
END
$$;

DROP INDEX public.sys_plant_plant_cd_active_uk;

COMMIT;
