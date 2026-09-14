---
title: "fix: 방문 결제 완료/미결제 처리 보강"
type: fix
status: active
date: 2026-09-14
scope: backend+frontend
ownership-note: 백엔드 서비스/로직 수정 허용. DB 스키마 변경 금지(권한 없음).
origin: docs/brainstorms/2026-09-08-consumer-api-integration-qa-hardening-requirements.md
---

# fix: 방문 결제 완료/미결제 처리 보강

## Summary

기존 Client 결제 API를 유지하면서 방문 전체 상태 전이, 입력 검증, 매장 권한과 Consumer 종료 반영을 테스트로 고정한다. 결제 완료는 모든 주문의 서빙 완료 후 허용하고, 미결제는 고객 부재처럼 서빙 전에도 발생할 수 있어 열린 방문에서 조기 종료를 허용한다.

---

## Problem Frame

결제 완료/미결제 API와 UI는 이미 존재하지만 두 동작이 같은 서빙 완료 조건을 사용한다. 현재 미결제 사유에는 `CUSTOMER_ABSENT`가 있어 실제 운영 조건과 맞지 않으며, 서버는 프론트가 보낸 사유를 충분히 검증하지 않는다.

---

## Requirements

- R1. 직원 로그인 매장의 열린 방문만 종료할 수 있다.
- R2. 결제 완료는 취소되지 않은 모든 주문이 서빙 완료일 때만 허용한다.
- R3. 미결제는 접수/조리/서빙 상태가 섞여 있어도 유효한 사유로 방문 전체를 종료할 수 있다.
- R4. 결제 완료는 결제수단, 미결제는 사유와 조건부 상세 설명을 서버가 검증한다.
- R5. 성공 시 방문 master와 모든 비취소 order group 상태가 하나의 트랜잭션으로 변경된다.
- R6. 처리 후 Client 조회와 Consumer 세션/주문 조회가 같은 종료 결과를 보여야 한다.

---

## Scope Boundaries

- 실제 카드 승인, PG 연동, 환불, 결제 취소와 영수증 발급은 제외한다.
- DB 스키마와 기존 API 경로는 변경하지 않는다.
- 종료된 방문을 되돌리는 기능은 포함하지 않는다.
- SSE 알림 전송은 Consumer SSE 플랜에서 연결한다.

---

## Context & Research

### Relevant Code and Patterns

- `qrorder/src/main/java/htms/QROrder/client/controller/OrderManageController.java`: 기존 결제 완료/미결제 엔드포인트를 유지한다.
- `qrorder/src/main/java/htms/QROrder/client/service/StatusService.java`: master 우선 잠금, 매장 범위와 영향 행 검증 패턴을 확장한다.
- `qrorder/src/main/resources/mapper/client/StatusMapper.xml`: 방문 전체 상태 변경 쿼리의 기준이다.
- `frontend/src/apps/client/features/order-status-management/api/orderStatusBoardApi.ts`: 생성 클라이언트를 감싸는 기존 어댑터를 유지한다.

### Institutional Learnings

- `docs/solutions/workflow-issues/consumer-order-session-contract-hardening-2026-08-28.md`: 결제는 master를 먼저 잠그고 Consumer 주문 생성과 직렬화해야 한다. 이 문서의 미결제 서빙 완료 제한은 이번 결정으로 미결제에 한해 변경한다.

---

## Key Technical Decisions

- 결제 완료/미결제를 별도 검증 경로로 분리한다. 금전 수납과 운영상 손실 종료는 허용 시점이 다르기 때문이다.
- 미결제 사유 허용 목록: `CARD_DEVICE_ERROR` / `CUSTOMER_ABSENT` / `PAYMENT_DECLINED` / `PAY_LATER` / `OTHER`. `OTHER`일 때만 공백이 아닌 상세 설명을 요구한다. (출처: `frontend/src/apps/client/features/order-status-management/constants.ts`)
- 클라이언트가 보낸 금액/body/footer는 결제 권위 데이터로 사용하지 않는다. 서버가 로그인 매장과 master 기준으로 대상을 다시 확인한다.
- 이미 종료된 방문이나 동시 중복 처리는 `409`, 다른 매장/없는 대상은 `404`, 잘못된 입력은 `400`으로 구분한다.

---

## Implementation Units

### U1. 결제/미결제 서버 계약 분리

**Goal:** 현재 결제 API에서 공통 검증과 서로 다른 허용 상태를 명확히 분리한다.

**Requirements:** R1, R2, R3, R4

**Dependencies:** 없음

**Files:**
- Modify: `qrorder/src/main/java/htms/QROrder/client/service/StatusService.java`
- Modify: `qrorder/src/main/java/htms/QROrder/client/dto/PaymentNotCompleteRequest.java`
- Test: `qrorder/src/test/java/htms/QROrder/client/StatusServiceTest.java`
- Test: `qrorder/src/test/java/htms/QROrder/client/OrderManageControllerTest.java`

**Approach:** 결제 완료는 기존 전체 서빙 검사를 유지한다. 미결제는 열린 master와 비어 있지 않은 비취소 주문 묶음을 잠근 뒤 현재 상태와 무관하게 종료하되, 사유 허용 목록/기타 상세 입력을 검증한다.

**Execution note:** 상태 전이 특성 테스트를 먼저 변경한 뒤 서비스 조건을 수정한다.

**Test scenarios:**
- 결제 완료/모든 비취소 주문 서빙 완료 -> master/group 결제 완료 처리.
- 결제 완료/접수 또는 조리 중 포함 -> `409`, 쓰기 없음.
- 미결제/고객 부재/접수 또는 조리 중 포함 -> 방문 전체 미결제 처리.
- 미결제/사유 없음 또는 미지원 값 -> `400`, 쓰기 없음.
- 미결제/기타/상세 설명 없음 -> `400`, 쓰기 없음.
- 다른 매장 또는 이미 종료된 master -> 각각 `404`/`409`, 부분 변경 없음.

**Verification:** 두 종료 경로의 허용 조건과 오류가 서비스/컨트롤러 테스트에 고정된다.

### U2. 방문 전체 트랜잭션과 조회 일관성 고정

**Goal:** master와 비취소 group이 동일한 방문 범위에서 원자적으로 종료되도록 보장한다.

**Requirements:** R1, R5, R6

**Dependencies:** U1

**Files:**
- Modify: `qrorder/src/main/java/htms/QROrder/client/repository/StatusMapper.java`
- Modify: `qrorder/src/main/resources/mapper/client/StatusMapper.xml`
- Test: `qrorder/src/test/java/htms/QROrder/client/StatusMapperXmlTest.java`
- Test: `qrorder/src/test/java/htms/QROrder/consumer/session/ConsumerSessionServiceTest.java`
- Test: `qrorder/src/test/java/htms/QROrder/consumer/session/ConsumerVisitServiceTest.java`
- Test: `qrorder/src/test/java/htms/QROrder/consumer/order/ConsumerOrderQueryServiceTest.java`

**Approach:** 로그인 매장의 열린 master를 먼저 잠그고 대상 group을 잠근다. 취소 주문은 유지하고 나머지는 결제 완료 또는 미결제 상태로 바꾸며, master 종료 상태가 Consumer `CLOSED` 판정의 단일 기준이 되게 한다.

**Test scenarios:**
- 여러 group/일부 취소 방문 종료 -> 비취소 group과 master만 일관되게 변경.
- 결제와 Consumer 추가 주문 경쟁 -> master 잠금 순서로 둘 중 하나만 유효하게 완료.
- 중간 update 영향 행 불일치 -> 전체 트랜잭션 롤백.
- 종료 후 Consumer 세션 조회 -> `CLOSED`, 주문 생성 -> 거부.

**Verification:** Mapper 범위 테스트와 Consumer 종료 테스트가 같은 master 상태를 기준으로 통과한다.

### U3. Client 연동/실제 QA 보강

**Goal:** 기존 화면이 서버 검증 결과를 보존하고 성공 후 관련 조회를 갱신하도록 한다.

**Requirements:** R4, R6

**Dependencies:** U1, U2

**Files:**
- Modify: `frontend/src/apps/client/features/order-status-management/api/orderStatusBoardApi.ts`
- Modify: `frontend/src/apps/client/features/order-status-management/hooks/useOrderPaymentModalFlow.ts`
- Test: `frontend/src/apps/client/features/order-status-management/api/orderStatusBoardApi.test.ts`
- Test: `frontend/src/apps/client/features/order-status-management/hooks/useOrderModalSnapshots.test.tsx`
- Test: `frontend/src/apps/client/features/order-status-management/mock/orderStatusHandlers.test.ts`

**Approach:** 현재 모달 흐름과 생성 API 클라이언트를 유지한다. 입력 오류는 모달에 남기고 성공한 경우에만 주문현황/결제현황을 갱신한다. 미결제 안내에는 방문 전체가 종료되고 되돌릴 수 없음을 유지한다.

**Test scenarios:**
- 결제수단/미결제 사유 검증 실패 -> API 미호출 또는 서버 오류 표시.
- API 실패 -> 모달 입력 유지, 완료 안내 미표시.
- 성공 -> 완료 안내와 관련 쿼리 무효화.
- `dev:real`에서 접수 상태 고객 부재 미결제 -> Client 목록 제거, 결제현황 UNPAID, Consumer CLOSED.
- `dev:real`에서 조리 중 주문 결제 완료 -> 거부, 기존 상태 유지.

**Verification:** 자동 테스트와 실제 API QA 결과가 결제/미결제별로 기록된다.

---

## Risks & Dependencies

| Risk | Mitigation |
|---|---|
| 조리 중 주문을 미결제로 종료해 주방이 상태를 놓침 | 최종 확인 문구를 유지하고 방문 전체 종료 이벤트를 SSE/직원 화면 갱신에 연결한다. |
| 프론트 사유 목록과 서버 허용 목록 불일치 | OpenAPI 설명과 양쪽 계약 테스트를 함께 갱신한다. |
| 결제와 추가 주문의 경쟁 | 동일 master 우선 잠금과 트랜잭션으로 직렬화한다. |

---

## Sources & References

- `docs/brainstorms/2026-09-08-consumer-api-integration-qa-hardening-requirements.md`
- `docs/specs/consumer-mvp/policy-decisions.md`
- `docs/specs/consumer-mvp/session-api.md`
