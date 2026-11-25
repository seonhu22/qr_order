-- 4C 가입 선행 보안 사전 점검. DDL/DML 없이 대상 인덱스 부재와 중복 0건을 확인한다.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '30s';

DO $$
BEGIN
    IF to_regclass('public.sys_plant') IS NULL THEN
        RAISE EXCEPTION 'public.sys_plant not found';
    END IF;
    IF to_regclass('public.sys_plant_plant_cd_active_uk') IS NOT NULL THEN
        RAISE EXCEPTION 'sys_plant_plant_cd_active_uk already exists';
    END IF;
END
$$;

-- duplicate_groups가 0이 아니면 적용하지 않는다. 중복 매장 정리는 별도 승인 대상이다.
SELECT COUNT(*) AS active_plants,
       COUNT(DISTINCT plant_cd) AS distinct_plant_cd,
       COUNT(*) - COUNT(DISTINCT plant_cd) AS duplicate_rows
FROM public.sys_plant
WHERE delete_yn = 'N';

SELECT plant_cd, COUNT(*) AS rows
FROM public.sys_plant
WHERE delete_yn = 'N'
GROUP BY plant_cd
HAVING COUNT(*) > 1
ORDER BY plant_cd;

COMMIT;
