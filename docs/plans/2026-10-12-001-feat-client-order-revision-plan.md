---
title: "feat: Client 주문 수정 저장 계약 연결"
type: feat
status: active
date: 2026-10-12
---

# feat: Client 주문 수정 저장 계약 연결

## Summary

legacy `change_order`는 그대로 두고 Client 전용 카탈로그/주문 수정 API를 추가한다. 제거 이력과 멱등성을 신규 테이블에 영속화하고, 기존 상세을 덮어쓰지 않으며 추가 메뉴는 신규 `RECEIVED` 주문 그룹 한 건으로 생성한다.

## Requirements

- R1. 기존 `POST /api/client/order_manage/status/change_order`와 `payment_yn`의 의미/값은 변경하거나 재사용하지 않는다.
- R2. 로그인 매장의 같은 `order_master`/테이블에 속한 상태 `01/02` 주문만 수정하고 `03` 이상은 차단한다.
- R3. 테이블 비활성 시 remove-only는 허용하고 add 또는 remove+add 요청은 전체 거절한다.
- R4. 부분 제거는 이력을 보존하되 주문현황/Consumer 주문/결제/정산에서 제외한다.
- R5. 유효 메뉴가 모두 제거된 그룹은 `99!`, `cancel_yn=Y`, `cancel_type=ORDER_REVISION`, `cancel_reason='주문 수정으로 모든 메뉴 제거'`, 서버 `cancel_datetime`으로 자동취소한다.
- R6. 한 요청의 추가 메뉴는 같은 방문의 신규 `RECEIVED` 주문 그룹 한 건에 저장한다.
- R7. 서버가 메뉴/옵션 소속, 사용/품절, 선택유형 `01/02/03`, required/default, 최대수량, 가격/합계를 재검증한다.
- R8. `clientRequestId`와 fingerprint/응답을 DB에 저장해 재시작/다중 인스턴스에서도 replay한다.
- R9. 잠금/검증/제거/자동취소/신규 주문/멱등성 응답은 한 트랜잭션이며, commit 후 Consumer/Client SSE를 발행한다.

## Scope Boundaries

- 기존 상세/옵션/가격 row를 삭제/덮어쓰기하지 않는다. 제거 이력 UI와 메뉴별 `requestNote`는 범위 밖이다.
- legacy API rename/deprecated와 과거 데이터 backfill은 별도 작업이다.
- 프론트 이름/가격/상태/draft ID를 서버 식별자나 계산 근거로 신뢰하지 않는다.

## API Contract

- `GET /api/client/order_manage/order-revision/catalog`: 로그인 `sysPlantCd`의 주문 가능한 메뉴와 옵션 그룹/항목/규칙을 반환한다.
- `POST /api/client/order_manage/status/revise_order`: `clientRequestId`, 원본 그룹 ID, 제거할 서버 상세 ID, 추가 메뉴/수량/옵션 ID만 받는다.
- 성공 응답은 revision ID, 제거 상세, 자동취소 그룹, 신규 주문 ID/번호/서버 합계를 담고 최초 성공/replay가 동일하다.
- Request/Response의 required/nullability를 명시하고 성공/실패 모두 공통 envelope를 사용한다. HTTP/error code로 요청 검증, 소유권, 상태 충돌, inactive 추가 차단, payload mismatch/in-progress를 구분한다.
- 타 매장 ID는 소유권을 노출하지 않도록 not-found, 상태/동시성은 conflict로 처리한다.

## Data Model / Migration

### `client_order_revision`

- revision PK, `sys_plant_cd`, `client_request_id`, `order_master_id`, `table_sys_id`, `request_fingerprint`, 생성 사용자/시각과 성공 `response_json`을 저장한다.
- `UNIQUE(sys_plant_cd, client_request_id)`와 `INSERT ... ON CONFLICT DO NOTHING`으로 선점한다. 영향 행 0이면 fingerprint/`response_json`을 읽어 replay/충돌을 판정하며 unique exception으로 transaction을 aborted시킨 뒤 조회하지 않는다. 본 작업 rollback 시 reservation도 함께 사라진다.

### `client_order_revision_removed_detail`

- revision FK와 제거 `order_detail` FK를 저장하고 detail unique로 중복 제거를 방지한다.
- 조회/결제/정산은 이력 존재 여부로 유효 상세을 판정하며 `payment_yn`은 수정하지 않는다.
- revision/master 조회와 detail anti-join을 기준으로 FK/unique/index를 설계한다.

### Migration files / acceptance

- Create: `qrorder/src/main/resources/db/migration/2026-10-12-client-order-revision.sql`
- Create: `qrorder/src/main/resources/db/migration/2026-10-12-client-order-revision-dry-run.sql`
- Create: `qrorder/src/main/resources/db/migration/2026-10-12-client-order-revision-rollback.sql`
- dry-run은 실제 타입/orphan/이름 충돌을 검사하고 데이터를 변경하지 않는다. rollback은 신규 객체만 의존성 역순으로 제거한다.
- PostgreSQL `COMMENT ON TABLE/COLUMN/CONSTRAINT/INDEX`로 DBeaver 설명란에 목적/범위/불변식이 보이게 한다.

## Transaction / Lock Order

1. 요청 형식/canonical fingerprint를 검사하고 `(sysPlantCd, clientRequestId)`를 선점하거나 저장 응답을 replay한다.
2. add/mixed는 매장 조건 candidate read 후 `table_info FOR UPDATE` -> `order_master FOR UPDATE` -> ID 정렬 그룹 -> ID 정렬 상세 순서로 잠근다.
3. remove-only는 table 활성 상태와 무관하므로 candidate read 후 `order_master FOR UPDATE` -> ID 정렬 그룹 -> ID 정렬 상세 순서로 잠근다.
4. 잠금 후 매장/테이블/master/group/detail 연결과 `01/02`, 미제거 상태를 모두 재검증한다. add/mixed는 잠긴 table이 active가 아니면 전체 거절한다.
5. 추가 메뉴/옵션을 서버 카탈로그로 검증하고 현재 가격을 계산한다.
6. 제거 이력/자동취소를 기록하고 추가 메뉴 전부를 신규 그룹 한 건으로 저장한 뒤 replay 응답을 확정한다.
7. commit 후 방문 Consumer `STATUS_CHANGED`와 매장 Client `ORDER_STATUS_CHANGED`를 발행한다.

`default` 옵션은 카탈로그가 preselect 근거로 전달하되 요청에 명시되지 않은 옵션을 서버가 몰래 추가하지 않는다. 서버는 최종 요청을 required/selection/max 규칙으로 검증한다.

## Implementation Units

### U1. Migration / 영속 멱등성

**Goal:** 두 테이블과 안전한 배포/복구 SQL을 만든다.
**Dependencies:** None / R8, R9

**Files:** migration 3개, `qrorder/src/test/java/htms/QROrder/client/OrderRevisionMigrationTest.java`

**Tests:** FK/unique/index, 같은 매장 key 중복/다른 매장 허용, orphan 차단, dry-run 무변경, rollback 기존 객체 보존, TABLE/COLUMN/CONSTRAINT/INDEX comment 조회.

### U2. Client 실제 주문 카탈로그 API

**Goal:** mock 대신 매장 경계가 적용된 주문 가능 카탈로그를 제공한다.
**Dependencies:** None / R2, R7

**Files:**
- Create: `qrorder/src/main/java/htms/QROrder/client/dto/OrderRevisionCatalogResponse.java`
- Create: `qrorder/src/main/java/htms/QROrder/client/service/OrderRevisionCatalogService.java`
- Create: `qrorder/src/main/java/htms/QROrder/client/repository/OrderRevisionCatalogMapper.java`
- Create: `qrorder/src/main/resources/mapper/client/OrderRevisionCatalogMapper.xml`
- Modify: `qrorder/src/main/java/htms/QROrder/client/controller/OrderManageController.java`
- Test: `qrorder/src/test/java/htms/QROrder/client/OrderRevisionCatalogServiceTest.java`

**Tests:** 매장 격리, 미사용/품절 제외, 옵션 `01/02/03`/required/default/max/가격 매핑, 옵션 없는 메뉴, 빈 결과.

### U3. 저장 계약 / DB replay

**Goal:** 요청/응답/error 계약과 원자적 idempotency 선점/replay를 구현한다.
**Dependencies:** U1 / R1, R2, R8

**Files:**
- Create: `qrorder/src/main/java/htms/QROrder/client/dto/OrderRevisionRequest.java`
- Create: `qrorder/src/main/java/htms/QROrder/client/dto/OrderRevisionResponse.java`
- Create: `qrorder/src/main/java/htms/QROrder/client/service/OrderRevisionService.java`
- Create: `qrorder/src/main/java/htms/QROrder/client/repository/OrderRevisionMapper.java`
- Create: `qrorder/src/main/resources/mapper/client/OrderRevisionMapper.xml`
- Modify/Test: `qrorder/src/main/java/htms/QROrder/client/controller/OrderManageController.java`, `qrorder/src/test/java/htms/QROrder/client/OrderRevisionServiceTest.java`, `qrorder/src/test/java/htms/QROrder/client/OrderManageControllerTest.java`

**Tests:** 같은 key/payload 순차/동시/restart replay, payload mismatch/in-progress, 매장별 key, 빈 변경/중복 ID/수량 오류, 응답/error와 legacy 계약 불변.

### U4. 제거/자동취소/신규 주문 트랜잭션

**Goal:** 확정한 잠금 순서와 정책을 부분 성공 없이 저장한다.
**Dependencies:** U2, U3 / R2-R9

**Files:**
- Create: `qrorder/src/main/java/htms/QROrder/client/service/OrderRevisionTransactionService.java`
- Modify: U3 mapper/interface/XML
- Test: `qrorder/src/test/java/htms/QROrder/client/OrderRevisionTransactionServiceTest.java`
- Test: `qrorder/src/test/java/htms/QROrder/client/OrderRevisionMapperIntegrationTest.java`

**Tests:** 01/02 성공/03 이상 거절, inactive remove-only 성공/add와 mixed rollback, 부분 제거 이력/payment 불변, 전부 제거 정확한 자동취소 값/서버 시각, 추가 전부 신규 그룹 한 건, 옵션 전 규칙/가격, 타 매장/master, 결제 경쟁, 중간 실패 rollback.

**Manual gate:** 실제 PostgreSQL에 U1 migration을 적용한 환경에서 중간 insert/완료 응답 실패를 강제로 발생시켜 revision/제거 이력/신규 주문이 모두 rollback되는지 확인하기 전에는 통합 완료로 판정하지 않는다.

### U5. 조회/합계 / SSE 정합성

**Goal:** 제거 상세을 모든 소비 경로에서 제외하고 양쪽 앱을 갱신한다.
**Dependencies:** U1, U4 / R4, R5, R9

**Files:**
- Modify: `qrorder/src/main/resources/mapper/client/StatusMapper.xml`
- Modify: `qrorder/src/main/resources/mapper/consumer/order/ConsumerOrderMapper.xml`
- Modify: `qrorder/src/main/resources/mapper/client/PaymentInfoMasterMapper.xml`
- Modify: `qrorder/src/main/resources/mapper/client/PaymentInfoDetailMapper.xml`
- Modify: `qrorder/src/main/resources/mapper/client/SettlementMapper.xml`
- Modify: `qrorder/src/main/resources/mapper/client/OrderHistoryMapper.xml`
- Create: `qrorder/src/main/java/htms/QROrder/client/service/ClientEventPublisher.java`
- Test: 관련 mapper integration test와 `qrorder/src/test/java/htms/QROrder/consumer/order/ConsumerOrderQueryServiceTest.java`

**Tests:** 제거가 모든 조회/합계에서 제외되고 원본/payment 유지, 제거된 parent의 OPTION도 제외, 살아있는 parent OPTION은 유지, 자동취소의 `ORDER_REVISION` label은 `주문 수정`, 신규 그룹 표시, commit 후 두 이벤트 각 1회/rollback 0회/SSE 실패 시 저장 성공 유지.

### U7. OpenAPI 생성

**Goal:** backend 계약 테스트 완료 후 frontend 구현 전에 생성 계약을 고정한다.
**Dependencies:** U2-U5 / R1-R9

**Files:** `frontend/openapi.json`, `frontend/src/generated/`

**Approach:** backend 실행과 `/v3/api-docs` 검증 후 schema -> Orval 순서로 생성하며 generated 파일은 수동 수정하지 않는다.

**Tests:** required/envelope/HTTP 오류 응답, catalog/revision DTO, legacy `changeOrder(string[])` 불변을 generated diff/type으로 확인한다.

### U6. Frontend ID 분리 / 비동기 저장

**Goal:** 실제 카탈로그 draft를 서버 계약으로 변환하고 성공 응답만 UI에 반영한다.
**Dependencies:** U7 / R1-R9

**Files:**
- Create: `frontend/src/apps/client/features/order-status-management/api/orderRevisionMapper.ts`
- Modify: `frontend/src/apps/client/features/order-status-management/api/orderStatusBoardApi.ts`
- Modify: `frontend/src/apps/client/features/order-status-management/hooks/useOrderEditModalFlow.ts`
- Modify: `frontend/src/apps/client/features/order-status-management/hooks/useOrderStatusBoardPage.ts`
- Modify: `frontend/src/apps/client/pages/order-status-management/OrderStatusManagementPage.tsx`
- Modify: `frontend/src/apps/client/features/order-status-management/mock/orderStatusHandlers.ts`
- Test: `frontend/src/apps/client/features/order-status-management/api/orderRevisionMapper.test.ts`
- Test: `frontend/src/apps/client/features/order-status-management/api/orderStatusBoardApi.test.tsx`
- Test: `frontend/src/apps/client/features/order-status-management/hooks/useOrderEditModalFlow.test.tsx`
- Test: `frontend/src/apps/client/features/order-status-management/hooks/useOrderStatusBoardPage.test.tsx`

**Approach:** 기존 항목의 source `sysId`와 신규 `draftId`를 별도 필드/type으로 관리하고 문자열 prefix 파싱을 금지한다. `onConfirmEdit: Promise<void>`, `isPending`, `saveError`를 노출해 성공 시에만 invalidate/refetch 완료 후 reset/notice하고, 실패 시 draft를 유지하며 pending 중 닫기/중복 저장/편집을 차단한다.

**Tests:** `01` optional single은 0/1개, `02` checkbox는 선택당 qty 1, `03` stepper는 max 이내이며 required/default/soldOut/loading/error/empty/retry를 검증한다. mock/draft ID 미전송, canonical stable sort fingerprint, 동일 payload retry key 유지, draft 변경/성공/새 모달은 새 key, 실패 draft/error 유지, pending 차단, 정확한 query invalidate/refetch 뒤 notice를 검증한다.

### U8. 문서 / 전체 회귀

**Goal:** 적용/복구 절차와 추적 문서를 동기화하고 전체 회귀를 검증한다.
**Dependencies:** U1-U7 / R1-R9

**Files:** `docs/api-integration/README.md`와 관련 index/QA 링크.

**Approach:** migration/rollback, 상태/inactive/error/idempotency 정책과 검증 결과를 링크한다.

**Tests:** backend 전체 test, frontend unit/typecheck/build, real API remove-only/add/mixed/replay/동시 결제 통합 QA.

## Merge Gates / Risks

- 조회/결제/정산 호출 경로별 anti-join integration test가 없으면 금액 불일치 위험 때문에 merge하지 않는다.
- FK 적용 전 타입/orphan dry-run, 백업, transaction 적용, rollback 리허설 결과를 사용자 검토 대상으로 남긴다.
- P0: master 선잠금, 영속 replay, inactive mixed rollback, 03 차단, 서버 옵션/가격 검증, async 실패 draft 보존을 모두 통과해야 한다.

## Sources

- `docs/solutions/workflow-issues/consumer-order-session-contract-hardening-2026-08-28.md`
- `docs/solutions/integration-issues/consumer-session-order-api-integration-2026-09-01.md`
- `frontend/src/apps/client/features/order-status-management/hooks/useOrderEditModalFlow.ts`
- `qrorder/src/main/java/htms/QROrder/consumer/order/service/ConsumerOrderTransactionService.java`
