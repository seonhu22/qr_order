-- 직원 호출을 요청 1건(master)과 호출 항목 N건(child)으로 묶는 PostgreSQL 마이그레이션.
-- 주의: 운영 적용 전 백업과 점검 결과를 확인하고, 애플리케이션 배포와 같은 점검 시간에 실행한다.
-- 현재 legacy child에는 테이블 정보가 없어 정확한 backfill이 불가능하므로 별도 테이블에 보존한다.
-- dry-run은 마지막 COMMIT을 ROLLBACK으로 바꾼 복사본에서 수행한다.

BEGIN;

LOCK TABLE public.consumer_staff_call IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'consumer_staff_call'
          AND column_name = 'link_sys_id'
    ) THEN
        RAISE EXCEPTION 'consumer_staff_call migration is already applied';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.consumer_staff_call_setting
        GROUP BY sys_plant_cd, call_cd
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'duplicate staff-call settings exist for (sys_plant_cd, call_cd)';
    END IF;
END
$$;

-- 기존 행에는 어느 테이블에서 호출했는지 남아 있지 않다.
-- 임의 테이블에 연결하지 않고 원본 형태로 보존한 뒤 신규 구조는 깨끗하게 시작한다.
CREATE TABLE IF NOT EXISTS public.consumer_staff_call_legacy_20260918
    (LIKE public.consumer_staff_call INCLUDING ALL);

INSERT INTO public.consumer_staff_call_legacy_20260918
SELECT *
FROM public.consumer_staff_call
ON CONFLICT (sys_id) DO NOTHING;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.consumer_staff_call source
        LEFT JOIN public.consumer_staff_call_legacy_20260918 backup
          ON backup.sys_id = source.sys_id
        WHERE backup.sys_id IS NULL
    ) THEN
        RAISE EXCEPTION 'legacy staff-call backup is incomplete';
    END IF;
END
$$;

DELETE FROM public.consumer_staff_call;

CREATE TABLE public.consumer_staff_call_master (
    sys_id              varchar(36) NOT NULL,
    sys_plant_cd        varchar(50) NOT NULL,
    table_sys_id        varchar(36) NOT NULL,
    table_num           int4 NOT NULL,
    consumer_session_id varchar(36) NOT NULL,
    read_yn             varchar(1) NOT NULL DEFAULT 'N',
    insert_datetime     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT consumer_staff_call_master_pkey PRIMARY KEY (sys_id),
    CONSTRAINT consumer_staff_call_master_read_yn_chk CHECK (read_yn IN ('Y', 'N')),
    CONSTRAINT consumer_staff_call_master_table_fk
        FOREIGN KEY (table_sys_id)
        REFERENCES public.table_info (sys_id)
        ON DELETE RESTRICT
);

ALTER TABLE public.consumer_staff_call
    ADD COLUMN link_sys_id varchar(36) NOT NULL,
    ADD COLUMN quantity int4 NOT NULL DEFAULT 1,
    DROP COLUMN read_yn,
    DROP COLUMN sys_plant_cd,
    DROP COLUMN insert_datetime,
    ADD CONSTRAINT consumer_staff_call_quantity_chk CHECK (quantity BETWEEN 1 AND 99),
    ADD CONSTRAINT consumer_staff_call_master_fk
        FOREIGN KEY (link_sys_id)
        REFERENCES public.consumer_staff_call_master (sys_id)
        ON DELETE CASCADE;

CREATE INDEX consumer_staff_call_master_plant_unread_datetime_idx
    ON public.consumer_staff_call_master (sys_plant_cd, read_yn, insert_datetime DESC);

CREATE INDEX consumer_staff_call_master_table_datetime_idx
    ON public.consumer_staff_call_master (sys_plant_cd, table_sys_id, insert_datetime DESC);

CREATE INDEX consumer_staff_call_link_sys_id_idx
    ON public.consumer_staff_call (link_sys_id);

COMMIT;

-- 적용 후 구조 확인
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name IN ('consumer_staff_call_master', 'consumer_staff_call')
-- ORDER BY table_name, ordinal_position;

-- 세션 단위 목록 조회 예시
-- 호출 항목 순서는 monotonic ULID인 child sys_id 순서를 사용한다.
/*
SELECT
    m.sys_id,
    m.sys_plant_cd,
    m.table_sys_id,
    m.table_num,
    m.consumer_session_id,
    m.read_yn,
    m.insert_datetime,
    jsonb_agg(
        jsonb_build_object(
            'callCd', s.call_cd,
            'callName', COALESCE(ss.call_nm, s.call_cd),
            'quantity', s.quantity,
            'description', s.description
        )
        ORDER BY s.sys_id
    ) AS items
FROM public.consumer_staff_call_master m
JOIN public.consumer_staff_call s
  ON s.link_sys_id = m.sys_id
LEFT JOIN public.consumer_staff_call_setting ss
  ON ss.sys_plant_cd = m.sys_plant_cd
 AND ss.call_cd = s.call_cd
WHERE m.sys_plant_cd = :sys_plant_cd
GROUP BY
    m.sys_id,
    m.sys_plant_cd,
    m.table_sys_id,
    m.table_num,
    m.consumer_session_id,
    m.read_yn,
    m.insert_datetime
ORDER BY m.insert_datetime DESC, m.sys_id DESC;
*/

-- 세션 1건 읽음 처리 예시. 매장 조건을 함께 사용해 다른 매장의 호출을 변경하지 않는다.
-- UPDATE public.consumer_staff_call_master
-- SET read_yn = 'Y'
-- WHERE sys_id = :staff_call_master_id
--   AND sys_plant_cd = :sys_plant_cd
--   AND read_yn = 'N';
