-- 기존 두 테스트 스태프의 누락된 소속만 보정한다. 스키마/비밀번호/역할/잠금 횟수는 변경하지 않는다.
-- 먼저 읽기 전용 조회로 각 sys_id와 올바른 매장을 확인한다.
-- SELECT sys_id,user_id,user_role,plant_cd,sys_plant_cd,delete_yn
-- FROM public.sys_user WHERE user_id IN ('autoTester21','autoTester22');
-- 아래 4개 placeholder를 실제 확인한 값으로 바꾼다. user_id만으로 대상을 선택하지 않는다.
-- 기본은 dry-run이다. 결과 확인 후 적용할 때만 마지막 ROLLBACK을 COMMIT으로 바꾸고 전체 재실행한다.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '10s';

CREATE TEMP TABLE qa_staff_store_fix (
    expected_store text NOT NULL, actor_id text NOT NULL,
    staff_21_id text NOT NULL, staff_22_id text NOT NULL
) ON COMMIT DROP;
INSERT INTO qa_staff_store_fix VALUES (
    '__EXPECTED_STORE__', '__ACTOR_ID__', '__STAFF_21_SYS_ID__', '__STAFF_22_SYS_ID__'
);

-- 두 대상과 승인 관리자를 같은 순서로 잠근다. 잠금 경합 시 기다리며 계속 실행하지 않는다.
SELECT u.sys_id,u.user_id,u.user_role,u.plant_cd,u.sys_plant_cd
FROM public.sys_user u CROSS JOIN qa_staff_store_fix c
WHERE u.sys_id IN (c.staff_21_id,c.staff_22_id) OR u.user_id=c.actor_id
ORDER BY u.sys_id FOR UPDATE OF u;

DO $$
DECLARE c record; affected integer;
BEGIN
    SELECT * INTO STRICT c FROM qa_staff_store_fix;
    IF left(c.expected_store,2)='__' OR left(c.actor_id,2)='__'
       OR left(c.staff_21_id,2)='__' OR left(c.staff_22_id,2)='__'
       OR btrim(c.expected_store)='' OR c.expected_store='ADMIN'
       OR c.staff_21_id=c.staff_22_id THEN
        RAISE EXCEPTION '확인한 실제 매장/관리자/대상 sys_id를 입력해야 합니다.';
    END IF;
    IF (SELECT count(*) FROM public.sys_plant
        WHERE plant_cd=c.expected_store AND delete_yn='N') <> 1 THEN
        RAISE EXCEPTION '대상 매장을 하나로 확인할 수 없습니다.';
    END IF;
    IF (SELECT count(*) FROM public.sys_user
        WHERE user_id=c.actor_id AND plant_cd=c.expected_store
          AND user_role='01' AND delete_yn='N') <> 1 THEN
        RAISE EXCEPTION '대상 매장의 승인 관리자를 하나로 확인할 수 없습니다.';
    END IF;
    IF (SELECT count(*) FROM public.sys_user
        WHERE (sys_id=c.staff_21_id AND user_id='autoTester21'
            OR sys_id=c.staff_22_id AND user_id='autoTester22')
          AND user_role='02' AND delete_yn='N'
          AND sys_plant_cd=c.expected_store
          AND nullif(btrim(plant_cd),'') IS NULL) <> 2 THEN
        RAISE EXCEPTION '대상 두 스태프의 ID/기존 매장/누락 상태가 예상과 다릅니다. 변경하지 않습니다.';
    END IF;
    UPDATE public.sys_user u
       SET plant_cd=c.expected_store, modify_user_id=c.actor_id, modify_datetime=now()
     WHERE u.sys_id IN (c.staff_21_id,c.staff_22_id)
       AND u.user_role='02' AND u.delete_yn='N'
       AND u.sys_plant_cd=c.expected_store
       AND nullif(btrim(u.plant_cd),'') IS NULL;
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> 2 THEN RAISE EXCEPTION '수정 건수 불일치: %',affected; END IF;
END $$;

SELECT u.sys_id,u.user_id,u.user_role,u.plant_cd,u.sys_plant_cd
FROM public.sys_user u CROSS JOIN qa_staff_store_fix c
WHERE u.sys_id IN (c.staff_21_id,c.staff_22_id)
ORDER BY u.sys_id;

ROLLBACK;
