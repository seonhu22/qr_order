---
title: "feat: Consumer 주문 단일 인스턴스 멱등성 보강"
type: feat
status: active
date: 2026-09-14
---

# feat: Consumer 주문 단일 인스턴스 멱등성 보강

## Summary

`origin/feature/TTL-request-note`의 의도를 현재 `dev` 구조에 맞게 이식하되 DB 변경 없이 단일 서버에서 같은 주문 요청의 중복 생성을 막는다. 요청을 원자적으로 선점하고 DB commit 후 결과를 확정하며, 10분 뒤에는 키를 삭제하지 않고 만료 tombstone으로 유지한다.

---

## Problem Frame

프론트는 네트워크 실패 시 같은 `clientRequestId`를 재사용하지만 서버는 이를 저장하지 않아 응답 유실 뒤 중복 주문이 생길 수 있다. 원본 브랜치의 DB 테이블은 현재 스키마 권한으로 적용할 수 없고, 단순 `ConcurrentHashMap` 조회/저장과 만료 삭제도 동시 요청/rollback/만료 후 재요청을 안전하게 처리하지 못한다.

---

## Requirements

- R1. 같은 매장/방문/키/주문 내용의 순차 또는 동시 요청은 10분 안에 주문 한 건과 동일한 `201` 응답으로 수렴한다.
- R2. 같은 키에 다른 주문 내용이 들어오면 신규 주문 없이 `409`와 안정적인 오류 코드를 반환한다.
- R3. DB transaction이 commit된 뒤에만 성공 결과를 재생할 수 있다.
- R4. DB 생성 실패/rollback은 성공 cache를 남기지 않으며 동일 요청을 다시 처리할 수 있다.
- R5. 10분 이내에는 성공 결과를 재생하고 이후에는 신규 주문 없이 만료 충돌을 반환한다.
- R6. 세션 종료 `410`과 멱등성 충돌 `409`를 프론트가 구분하며 장바구니를 자동 삭제하지 않는다.
- R7. 서버 재시작/다중 인스턴스는 보장하지 않는 QA/스테이징 한정 기능임을 문서화한다.

---

## Scope Boundaries

- DB/Redis 저장소와 DB 스키마 변경은 포함하지 않는다.
- 프로세스 재시작 및 여러 서버 인스턴스 사이의 중복 방지는 보장하지 않는다.
- 만료 응답을 받은 프론트가 새 키로 자동 주문하지 않는다.
- `requestNote`는 원본 브랜치에 변경이 없으며 이번 범위에도 포함하지 않는다.
- 원본 커밋 `879c320e`는 직접 cherry-pick하지 않고 참고 자료로만 사용한다.
- 운영 배포 전 DB 또는 Redis 기반 영속 멱등성 저장소/고유 제약/보관 정책은 후속 작업으로 둔다.

---

## Key Technical Decisions

- 멱등성 키 범위는 서버 바인딩의 `sysPlantCd + consumerSessionId + clientRequestId`다. 바인딩 일치를 먼저 확인하고, 성공 재생은 새 쓰기가 아니므로 이후 테이블 상태 변화와 무관하게 원래 결과를 반환한다.
- 주문 fingerprint는 메뉴/옵션 식별자와 수량을 정규화해 만든다. 서버 가격처럼 재시도 사이에 변할 수 있는 값은 포함하지 않는다.
- 저장소 항목은 `IN_FLIGHT`, `SUCCEEDED`, `EXPIRED` 상태를 가진다. 최초 요청만 owner가 되고 나머지는 같은 처리 결과를 기다린다.
- 성공 항목은 10분 뒤 `EXPIRED` tombstone으로 바꾸되 삭제하지 않는다. 삭제하면 같은 키를 신규 요청으로 오인할 수 있기 때문이다.
- owner의 DB 생성은 별도 transactional service가 담당한다. 해당 호출이 반환되어 commit이 끝난 뒤에만 store를 `SUCCEEDED`로 완료한다.
- 실패 시 대기 요청에도 같은 실패를 전달하고 예약을 제거한다. 성공하지 않은 키가 영구적으로 막히지 않게 한다.
- 대기 시간이 길어지면 신규 생성 대신 `409`/`IDEMPOTENCY_IN_PROGRESS`를 반환한다.
- 만료는 `409`/`IDEMPOTENCY_KEY_EXPIRED`, payload 불일치는 `409`/`IDEMPOTENCY_PAYLOAD_MISMATCH`를 사용한다. 방문 종료만 기존 `410`을 유지한다.

---

## Implementation Units

### U1. 요청 범위/fingerprint/store 계약

**Goal:** 동일 요청 여부와 처리 상태를 원자적으로 판정하는 메모리 저장소를 만든다.

**Requirements:** R1, R2, R5, R7

**Dependencies:** 없음

**Files:**
- Create: `qrorder/src/main/java/htms/QROrder/consumer/order/idempotency/ConsumerOrderIdempotencyKey.java`
- Create: `qrorder/src/main/java/htms/QROrder/consumer/order/idempotency/ConsumerOrderRequestFingerprint.java`
- Create: `qrorder/src/main/java/htms/QROrder/consumer/order/idempotency/ConsumerOrderIdempotencyStore.java`
- Test: `qrorder/src/test/java/htms/QROrder/consumer/order/idempotency/ConsumerOrderIdempotencyStoreTest.java`

**Approach:** `ConcurrentHashMap`의 원자적 등록으로 owner/waiter/replay/conflict 결과를 구분한다. 성공 결과와 fingerprint를 보관하며 10분 뒤에는 삭제 대신 tombstone으로 전환한다. 자동 sweep은 사용하지 않는다.

**Test scenarios:**
- 같은 범위/키/fingerprint 동시 요청 -> owner 한 명, 나머지는 동일 결과 대기.
- 같은 키/다른 fingerprint -> payload mismatch, owner 실행 없음.
- 같은 키/다른 매장 또는 방문 -> 서로 다른 항목이며 결과 노출 없음.
- 성공 후 10분 이내 -> 저장된 결과 재생.
- 성공 후 10분 초과 -> expired 충돌, 신규 owner 생성 없음.
- owner 실패 -> waiter에 실패 전달, 항목 제거 후 재요청 가능.

### U2. transaction commit 이후 결과 확정

**Goal:** DB 주문 생성과 메모리 상태가 rollback 상황에서도 모순되지 않게 한다.

**Requirements:** R1, R3, R4

**Dependencies:** U1

**Files:**
- Create: `qrorder/src/main/java/htms/QROrder/consumer/order/service/ConsumerOrderTransactionService.java`
- Modify: `qrorder/src/main/java/htms/QROrder/consumer/order/service/ConsumerOrderCreationService.java`
- Test: `qrorder/src/test/java/htms/QROrder/consumer/order/ConsumerOrderCreationServiceTest.java`
- Test: `qrorder/src/test/java/htms/QROrder/consumer/order/ConsumerOrderTransactionServiceTest.java`

**Approach:** coordinator는 서버 바인딩을 검증한 뒤 키를 판정한다. 신규 owner만 별도 transactional service에서 기존 테이블/방문/order number 잠금, 가격 검증, 저장/touch를 수행한다. 호출이 정상 반환된 뒤 성공 결과를 store에 완료하고 예외면 예약을 제거한다.

**Test scenarios:**
- owner 주문 commit 성공 -> 결과 저장 후 waiter/retry에 동일 orderId 반환.
- validator/Mapper/touch 실패 -> 성공 결과 없음, 부분 주문 rollback.
- 첫 요청 처리 중 같은 요청 -> 두 번째 DB 생성 호출 없음.
- 첫 요청 실패 후 같은 요청 -> 다음 요청이 새 owner가 되어 정상 생성 가능.

### U3. 오류 계약/OpenAPI 보강

**Goal:** 멱등성 충돌과 방문 종료를 안정적인 응답 코드로 구분한다.

**Requirements:** R2, R5, R6

**Dependencies:** U1, U2

**Files:**
- Create: `qrorder/src/main/java/htms/QROrder/consumer/order/exception/ConsumerOrderIdempotencyException.java`
- Modify: `qrorder/src/main/java/htms/QROrder/common/exception/GlobalExceptionHandler.java`
- Modify: `qrorder/src/main/java/htms/QROrder/consumer/order/controller/ConsumerOrderController.java`
- Test: `qrorder/src/test/java/htms/QROrder/consumer/order/ConsumerOrderControllerTest.java`

**Approach:** `CommonResponse.error`에 만료/불일치/처리 중 코드를 넣고 모두 `409`로 반환한다. 세션 종료는 기존 `410` 계약을 유지한다. 신규/재생 성공 모두 Controller의 기존 `201` envelope를 사용한다.

**Test scenarios:**
- 신규/재생 성공 -> 모두 `201`, 동일 response data.
- 만료/불일치/처리 중 -> `409`와 각각의 error 코드.
- 종료된 방문 -> 기존 `410`, 멱등성 error 코드로 오인하지 않음.
- 예상하지 못한 예외 -> 내부 정보 없는 기존 `500` 응답.

### U4. 프론트 오류 처리/장바구니 보존

**Goal:** 안전한 재시도는 같은 키로만 수행하고 모호한 주문을 자동 재생성하지 않는다.

**Requirements:** R5, R6

**Dependencies:** U3

**Files:**
- Modify: `frontend/src/apps/consumer/features/order-shell/api/consumerOrderApi.ts`
- Modify: `frontend/src/apps/consumer/features/order-shell/hooks/useConsumerOrderPage.ts`
- Test: `frontend/src/apps/consumer/features/order-shell/api/consumerOrderApi.test.ts`
- Test: `frontend/src/apps/consumer/pages/order/ConsumerOrderPage.test.tsx`

**Approach:** 일반 네트워크 실패는 현재처럼 같은 `clientRequestId`를 유지한다. 만료/불일치/처리 중 오류는 장바구니와 키를 유지하고 주문내역 확인을 안내하며 자동 재시도하지 않는다. 사용자가 장바구니를 실제 변경할 때만 기존 store 규칙에 따라 새 키가 만들어진다.

**Test scenarios:**
- 네트워크 실패 후 수동 재시도 -> 같은 clientRequestId 전송.
- expired/mismatch/in-progress -> cart/key 유지, 세션 종료 화면 미표시, 자동 POST 없음.
- 세션 종료 `410` -> 기존 CLOSED 처리와 장바구니 정책 유지.
- 주문 성공/재생 -> 성공 화면과 orderNo 표시, 장바구니 삭제.

### U5. 제한사항 문서/통합 QA

**Goal:** 단일 인스턴스 보장 범위와 운영 승격 조건을 검증 가능하게 남긴다.

**Requirements:** R1, R3, R5, R7

**Dependencies:** U1, U2, U3, U4

**Files:**
- Modify: `docs/specs/consumer-mvp/order-api.md`
- Modify: `docs/specs/consumer-mvp/policy-decisions.md`
- Modify: `docs/specs/consumer-mvp/implementation-plan.md`

**Approach:** 실제 TTL 상수를 임시로 낮추지 않고 주입 가능한 clock/TTL로 테스트한다. `dev:real`에서는 동일 payload 재전송과 동시 요청을 확인하되 재시작/다중 서버는 미지원 결과로 기록한다.

**Test scenarios:**
- 동일 키 순차/동시 요청 -> 주문 한 건/동일 `201` 응답.
- 동일 키/다른 payload -> `409`, 주문 수 불변.
- clock 전진 후 같은 키 -> expired `409`, 주문 수 불변.
- DB 실패 후 재시도 -> 부분 데이터 없이 정상 재처리.
- 서버 재시작 -> 보장되지 않음을 QA 결과와 배포 제한에 명시.

---

## Risks & Dependencies

| Risk | Mitigation |
|---|---|
| 서버 재시작/다중 인스턴스에서 기록 소실 | QA/스테이징으로 제한하고 운영 전 DB/Redis 작업을 차단 조건으로 둔다. |
| tombstone 누적으로 메모리 증가 | 단일 인스턴스 stopgap으로 수용하고 방문 종료 단위 정리는 구현 중 안전성이 증명될 때만 추가한다. |
| 처리 중 요청이 오래 걸림 | waiter는 제한 시간 뒤 처리 중 충돌을 반환하되 owner 항목은 삭제하지 않는다. |
| 가격 변경 후 재시도 | fingerprint는 주문 선택만 비교하고 성공 기록이 있으면 기존 확정 응답을 재생한다. |

---

## Completion Gate

- 동시 요청/rollback/TTL/payload mismatch 테스트가 모두 통과한다.
- 프론트가 만료 키를 새 키로 자동 재주문하지 않는다.
- 신규/재생 성공 응답이 모두 `201`이다.
- 운영급 영속 멱등성이 아니라는 제한이 QA 문서에 남는다.
- DB/Redis 승격 전에는 다중 인스턴스 배포를 허용하지 않는다.

---

## Sources & References

- `origin/feature/TTL-request-note`, commit `879c320e`
- `qrorder/src/main/java/htms/QROrder/consumer/order/service/ConsumerOrderCreationService.java`
- `frontend/src/apps/consumer/features/order-shell/stores/consumerCartStore.ts`
- `docs/solutions/workflow-issues/consumer-order-session-contract-hardening-2026-08-28.md`
