-- Client 주문 수정 요청의 영속 멱등성과 제거 이력을 저장한다.
-- 기존 주문 데이터는 변경하지 않으며, 적용 전 dry-run SQL을 먼저 실행한다.
BEGIN;

DO $$
BEGIN
    IF to_regclass('public.client_order_revision') IS NOT NULL
       OR to_regclass('public.client_order_revision_removed_detail') IS NOT NULL THEN
        RAISE EXCEPTION 'client order revision migration is already applied or object names conflict';
    END IF;
END
$$;

CREATE TABLE public.client_order_revision (
    sys_id                varchar(36) NOT NULL,
    sys_plant_cd          varchar(50) NOT NULL,
    client_request_id     varchar(36) NOT NULL,
    order_master_id       varchar(36) NOT NULL,
    table_sys_id          varchar(36) NOT NULL,
    request_fingerprint   varchar(64) NOT NULL,
    processing_status     varchar(20) NOT NULL DEFAULT 'PROCESSING',
    response_json         jsonb NULL,
    insert_user_id        varchar(50) NOT NULL,
    insert_datetime       timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    complete_datetime     timestamp NULL,
    CONSTRAINT client_order_revision_pkey PRIMARY KEY (sys_id),
    CONSTRAINT client_order_revision_plant_request_uk
        UNIQUE (sys_plant_cd, client_request_id),
    CONSTRAINT client_order_revision_order_master_fk
        FOREIGN KEY (order_master_id)
        REFERENCES public.order_master (sys_id)
        ON DELETE RESTRICT,
    CONSTRAINT client_order_revision_table_fk
        FOREIGN KEY (table_sys_id)
        REFERENCES public.table_info (sys_id)
        ON DELETE RESTRICT,
    CONSTRAINT client_order_revision_status_chk
        CHECK (processing_status IN ('PROCESSING', 'COMPLETED')),
    CONSTRAINT client_order_revision_completion_chk
        CHECK (
            (processing_status = 'PROCESSING' AND response_json IS NULL AND complete_datetime IS NULL)
            OR
            (processing_status = 'COMPLETED' AND response_json IS NOT NULL AND complete_datetime IS NOT NULL)
        )
);

CREATE TABLE public.client_order_revision_removed_detail (
    revision_sys_id       varchar(36) NOT NULL,
    order_detail_sys_id   varchar(36) NOT NULL,
    removed_datetime      timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT client_order_revision_removed_detail_pkey
        PRIMARY KEY (revision_sys_id, order_detail_sys_id),
    CONSTRAINT client_order_revision_removed_detail_detail_uk
        UNIQUE (order_detail_sys_id),
    CONSTRAINT client_order_revision_removed_detail_revision_fk
        FOREIGN KEY (revision_sys_id)
        REFERENCES public.client_order_revision (sys_id)
        ON DELETE RESTRICT,
    CONSTRAINT client_order_revision_removed_detail_detail_fk
        FOREIGN KEY (order_detail_sys_id)
        REFERENCES public.order_detail (sys_id)
        ON DELETE RESTRICT
);

CREATE INDEX client_order_revision_master_datetime_idx
    ON public.client_order_revision
    (sys_plant_cd, order_master_id, insert_datetime DESC);

COMMENT ON TABLE public.client_order_revision IS
    'Client 주문 수정 요청 단위의 영속 멱등성, 처리 상태와 성공 응답 기록';
COMMENT ON COLUMN public.client_order_revision.sys_id IS
    '주문 수정 요청의 서버 생성 식별자';
COMMENT ON COLUMN public.client_order_revision.sys_plant_cd IS
    '주문 수정 요청을 처리한 매장 코드이자 멱등성 키 범위';
COMMENT ON COLUMN public.client_order_revision.client_request_id IS
    'Client가 재시도에도 동일하게 전송하는 주문 수정 요청 식별자';
COMMENT ON COLUMN public.client_order_revision.order_master_id IS
    '수정 대상 방문 단위 order_master 식별자';
COMMENT ON COLUMN public.client_order_revision.table_sys_id IS
    '수정 대상 테이블 식별자';
COMMENT ON COLUMN public.client_order_revision.request_fingerprint IS
    '동일 요청 식별자의 payload 일치 여부를 검증하는 SHA-256 16진수 해시';
COMMENT ON COLUMN public.client_order_revision.processing_status IS
    '주문 수정 처리 상태: PROCESSING 또는 COMPLETED';
COMMENT ON COLUMN public.client_order_revision.response_json IS
    '최초 성공 응답을 동일하게 replay하기 위한 JSON';
COMMENT ON COLUMN public.client_order_revision.insert_user_id IS
    '주문 수정을 실행한 Client 로그인 사용자 ID';
COMMENT ON COLUMN public.client_order_revision.insert_datetime IS
    '멱등성 요청을 최초 선점한 서버 시각';
COMMENT ON COLUMN public.client_order_revision.complete_datetime IS
    '주문 수정 트랜잭션을 완료한 서버 시각';

COMMENT ON CONSTRAINT client_order_revision_pkey ON public.client_order_revision IS
    '주문 수정 요청 서버 식별자의 기본키';
COMMENT ON CONSTRAINT client_order_revision_plant_request_uk ON public.client_order_revision IS
    '같은 매장에서는 clientRequestId를 한 번만 선점하고 다른 매장에서는 재사용 허용';
COMMENT ON CONSTRAINT client_order_revision_order_master_fk ON public.client_order_revision IS
    '존재하는 방문만 수정하며 방문 삭제 시 수정 이력을 보존';
COMMENT ON CONSTRAINT client_order_revision_table_fk ON public.client_order_revision IS
    '존재하는 테이블만 대상으로 하며 테이블 삭제 시 수정 이력을 보존';
COMMENT ON CONSTRAINT client_order_revision_status_chk ON public.client_order_revision IS
    '처리 상태를 PROCESSING과 COMPLETED로 제한';
COMMENT ON CONSTRAINT client_order_revision_completion_chk ON public.client_order_revision IS
    '처리 중에는 응답/완료시각이 없고 완료 후에는 둘 다 존재하도록 보장';

COMMENT ON INDEX public.client_order_revision_pkey IS
    'client_order_revision 기본키 인덱스';
COMMENT ON INDEX public.client_order_revision_plant_request_uk IS
    '매장별 clientRequestId 중복 선점을 막는 유일 인덱스';
COMMENT ON INDEX public.client_order_revision_master_datetime_idx IS
    '매장과 방문별 주문 수정 이력을 최근 순서로 조회하는 인덱스';

COMMENT ON TABLE public.client_order_revision_removed_detail IS
    '주문 수정 요청에서 제거된 기존 order_detail 연결 이력';
COMMENT ON COLUMN public.client_order_revision_removed_detail.revision_sys_id IS
    '제거를 수행한 client_order_revision 식별자';
COMMENT ON COLUMN public.client_order_revision_removed_detail.order_detail_sys_id IS
    '주문현황, 결제와 정산에서 제외할 기존 order_detail 식별자';
COMMENT ON COLUMN public.client_order_revision_removed_detail.removed_datetime IS
    '주문 상세를 제거 처리한 서버 시각';

COMMENT ON CONSTRAINT client_order_revision_removed_detail_pkey
    ON public.client_order_revision_removed_detail IS
    '한 수정 요청에서 같은 주문 상세을 한 번만 제거하도록 보장';
COMMENT ON CONSTRAINT client_order_revision_removed_detail_detail_uk
    ON public.client_order_revision_removed_detail IS
    '하나의 주문 상세가 여러 수정 요청에서 중복 제거되지 않도록 보장';
COMMENT ON CONSTRAINT client_order_revision_removed_detail_revision_fk
    ON public.client_order_revision_removed_detail IS
    '제거 이력을 수정 요청에 연결하고 이력이 남은 수정 요청 삭제를 제한';
COMMENT ON CONSTRAINT client_order_revision_removed_detail_detail_fk
    ON public.client_order_revision_removed_detail IS
    '존재하는 주문 상세만 제거하며 원본 주문 상세 삭제는 제한';

COMMENT ON INDEX public.client_order_revision_removed_detail_pkey IS
    '수정 요청과 제거 주문 상세 복합 기본키 인덱스';
COMMENT ON INDEX public.client_order_revision_removed_detail_detail_uk IS
    'order_detail anti-join과 중복 제거 검증에 사용하는 유일 인덱스';

COMMIT;
