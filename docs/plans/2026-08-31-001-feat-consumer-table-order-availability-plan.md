---
title: Consumer 테이블 주문 가능 상태 구현
type: feat
status: completed
date: 2026-08-31
origin: docs/brainstorms/2026-08-31-consumer-table-order-availability-requirements.md
---

# Consumer 테이블 주문 가능 상태 구현

## Summary

기존 테이블 활성 상태를 Consumer 세션 계약에 투영하고, 주문 트랜잭션이 테이블/방문 순서로 행을 잠근 뒤 비활성 주문을 거절한다. 백엔드 계약과 OpenAPI 생성 클라이언트까지만 이번 작업에 포함하며 실제 프론트 연결은 후속 API integration으로 분리한다.

---

## Problem Frame

신규 QR 연결은 이미 비활성 테이블을 거부하지만, 발급된 세션의 주문 생성은 테이블 상태를 다시 확인하지 않는다. 단순 상태 조회를 추가하면 테이블 비활성화와 주문 저장이 경쟁할 때 오래된 판정으로 주문이 생성될 수 있다.

---

## Requirements

- R1. 방문 생명주기 상태와 주문 가능 여부를 분리한다.
- R2. 테이블 비활성화가 방문을 종료/만료 상태로 변경하지 않게 한다.
- R3. 메뉴와 기존 주문 조회 계약을 테이블 비활성화와 무관하게 유지한다.
- R4. 테이블 재활성화 시 활성 방문의 주문 가능 여부가 자동 복구되게 한다.
- R5. 종료/만료 방문은 테이블 재활성화로 복구하지 않는다.
- R6. 주문 저장 전 현재 테이블 상태를 잠금 아래에서 최종 확인한다.
- R7. 비활성 주문을 `409`와 `TABLE_INACTIVE`로 구분한다.
- R8. [Deferred/enabled by this work] 프론트는 사전 차단과 주문 중 경합을 처리한다.
- R9. 비활성 테이블 신규 QR은 일반 `404` 동작을 유지한다.
- R10. DB 스키마와 데이터 마이그레이션을 변경하지 않는다.
- R11. [Deferred/enabled by this work] 프론트는 주문 차단 시 장바구니를 유지한다.
- R12. 기존 직원 주문 처리 흐름에 영향을 주지 않는다.

**Origin trace:** A1 소비자/A2 매장 직원, F1~F3, AE1~AE5

---

## Scope Boundaries

- `table_info`를 포함한 DB 테이블/컬럼/인덱스를 추가하거나 변경하지 않는다.
- QR 연결의 현재 필터와 일반 `404` 응답을 변경하지 않는다.
- 메뉴 조회, 주문 목록/상세, 직원 주문 상태 처리 코드를 기능 확장하지 않는다.
- 영속 멱등성, `requestNote` 저장, PIN, Consumer SSE를 구현하지 않는다.

### Deferred to Follow-Up Work

- 실제 세션 API 연결/Guard 활성화: Consumer API integration 작업
- 주문 생성 mutation/주문 목록/상세 연결: Consumer API integration 작업
- 비활성 안내/주문 버튼 차단/장바구니 유지 UI: Consumer API integration 작업

---

## Context & Research

### Relevant Code and Patterns

- `qrorder/src/main/resources/mapper/consumer/session/ConsumerVisitMapper.xml`: 기존 테이블/방문 잠금과 방문 상태 조립
- `qrorder/src/main/java/htms/QROrder/consumer/session/service/ConsumerSessionService.java`: ACTIVE/CLOSED/EXPIRED 응답 조립
- `qrorder/src/main/java/htms/QROrder/consumer/order/service/ConsumerOrderCreationService.java`: 주문 생성 트랜잭션과 현재 방문 잠금
- `qrorder/src/main/java/htms/QROrder/common/exception/GlobalExceptionHandler.java`: Consumer 주문 오류의 HTTP 매핑
- `frontend/docs/operations/api-response-policy.md`: 생성 클라이언트/기능 wrapper 경계
- `frontend/docs/api-codegen.md`: OpenAPI와 Orval 생성물 갱신 절차

### Institutional Learnings

- `docs/solutions/workflow-issues/consumer-order-session-contract-hardening-2026-08-28.md`: 상태 확인과 후속 조회/저장을 같은 행 잠금 경계에서 선형화해야 한다.
- 세션 생성의 기존 잠금 순서가 테이블 다음 방문이므로 주문 생성도 같은 순서를 사용해 교착 역전을 피한다.
- 처리되지 않은 내부 예외는 로그에만 남기고 클라이언트는 안정적인 코드로 분기하게 한다.

---

## Key Technical Decisions

- 세션 응답은 `status`를 유지하고 required `orderingAllowed: boolean`과 nullable `orderingBlockedReason: 'TABLE_INACTIVE' | null`을 추가한다.
- 테이블 상태는 승인된 범위대로 기존 `table_info.use_yn`을 트랜잭션 내에서 읽으며 별도 상태를 저장하지 않는다.
- 잠금 순서는 `table_info` → `order_master` 방문 → 주문번호 advisory lock → 주문 저장으로 고정한다.
- 테이블 행은 활성 조건으로 필터링하기 전에 잠가 활성/비활성 양쪽 경합 순서를 확정한다.
- 품절 등에 쓰는 일반 주문 충돌과 분리된 예외를 사용해 `TABLE_INACTIVE`만 `CommonResponse.error`에 기록한다.
- 생성 영역은 직접 수정하지 않고 갱신된 OpenAPI에서 다시 생성한다.

---

## Implementation Units

### U1. 세션 주문 가능 계약 추가

**Goal:** 방문 상태를 바꾸지 않고 현재 테이블의 주문 가능 여부를 세션 응답에 제공한다.
**Requirements:** R1, R2, R3, R4, R5, R10 / R8 prerequisite
**Dependencies:** None
**Files:**
- Modify: `qrorder/src/main/java/htms/QROrder/consumer/session/dto/ConsumerVisitRecord.java`
- Modify: `qrorder/src/main/java/htms/QROrder/consumer/session/dto/ConsumerSessionResponse.java`
- Modify: `qrorder/src/main/java/htms/QROrder/consumer/session/service/ConsumerSessionService.java`
- Modify: `qrorder/src/main/resources/mapper/consumer/session/ConsumerVisitMapper.xml`
- Test: `qrorder/src/test/java/htms/QROrder/consumer/session/ConsumerSessionServiceTest.java`
- Test: `qrorder/src/test/java/htms/QROrder/consumer/session/ConsumerSessionControllerTest.java`
**Approach:**
- 방문 조회 결과에 현재 테이블 활성 여부를 함께 투영한다.
- ACTIVE 방문만 테이블 상태에 따라 주문 가능 여부가 달라지고 CLOSED/EXPIRED는 항상 주문 불가로 조립한다.
- ACTIVE/활성은 `true/null`, ACTIVE/비활성은 `false/TABLE_INACTIVE`, CLOSED/EXPIRED는 `false/null`로 조립한다.
**Test scenarios:**
- Happy path: 활성 테이블/ACTIVE 방문은 주문 가능 응답을 반환한다.
- State: 비활성 테이블/ACTIVE 방문은 ACTIVE를 유지하면서 주문 불가와 `TABLE_INACTIVE`를 반환한다.
- State: CLOSED/EXPIRED는 테이블이 활성이어도 주문 가능으로 복구되지 않는다.
- Recovery: 같은 ACTIVE 방문에서 테이블이 재활성화되면 다음 조회가 주문 가능으로 바뀐다.
**Verification:** 세션 API 계약이 방문 상태와 주문 권한을 독립적으로 표현한다.

### U2. 주문 생성의 테이블 상태 선형화

**Goal:** 테이블 비활성화와 주문 저장의 경쟁 순서를 확정하고 비활성 주문을 부분 저장 없이 거절한다.
**Requirements:** R4, R6, R7, R10, R12 / R11 prerequisite
**Dependencies:** U1
**Files:**
- Modify: `qrorder/src/main/java/htms/QROrder/consumer/session/repository/ConsumerVisitMapper.java`
- Modify: `qrorder/src/main/resources/mapper/consumer/session/ConsumerVisitMapper.xml`
- Modify: `qrorder/src/main/java/htms/QROrder/consumer/session/service/ConsumerVisitService.java`
- Modify: `qrorder/src/main/java/htms/QROrder/consumer/order/service/ConsumerOrderCreationService.java`
- Create: `qrorder/src/main/java/htms/QROrder/consumer/order/exception/ConsumerTableInactiveException.java`
- Modify: `qrorder/src/main/java/htms/QROrder/common/exception/GlobalExceptionHandler.java`
- Modify: `qrorder/src/main/java/htms/QROrder/consumer/order/controller/ConsumerOrderController.java`
- Test: `qrorder/src/test/java/htms/QROrder/consumer/order/ConsumerOrderCreationServiceTest.java`
- Test: `qrorder/src/test/java/htms/QROrder/consumer/order/ConsumerOrderControllerTest.java`
- Test: `qrorder/src/test/java/htms/QROrder/consumer/order/ConsumerOrderMapperXmlTest.java`
**Approach:**
- 주문 트랜잭션이 테이블 행을 먼저 잠그고 현재 상태를 판정한 뒤 방문 행을 잠근다.
- 검증된 QR/방문 바인딩만 테이블 잠금 식별자로 사용하고, 불일치 요청은 잠금/쓰기 전에 거절한다.
- 비활성 판정은 전용 충돌 예외로 종료하고 메뉴 검증/주문번호 계산/주문 저장을 실행하지 않는다.
- 공통 응답의 기존 `error` 필드에만 안정 코드를 넣어 다른 `409` 의미를 보존한다.
**Test scenarios:**
- Happy path: 활성 테이블은 테이블/방문/주문번호 순서로 잠근 뒤 주문을 저장한다.
- Error path: 비활성 테이블은 `409 / TABLE_INACTIVE`이고 주문 관련 쓰기가 전혀 없다.
- Security: 다른 매장/테이블 방문 바인딩은 대상 행 잠금 전 거절된다.
- Concurrency contract: SQL 잠금이 테이블 상태를 포함하며 주문 저장보다 먼저 수행된다.
- Regression: 기존 품절 충돌은 `TABLE_INACTIVE`로 잘못 분류되지 않는다.
**Verification:** 비활성화와 주문이 경합해도 먼저 확정된 상태에 따라 한쪽만 성공하고 부분 주문은 남지 않는다.

### U3. 계약 문서/OpenAPI/codegen 동기화

**Goal:** 승인된 정책과 백엔드 응답을 문서 및 생성 클라이언트에 일치시킨다.
**Requirements:** R7, R8, R9, R10
**Dependencies:** U1, U2
**Files:**
- Modify: `docs/specs/consumer-mvp/policy-decisions.md`
- Modify: `docs/specs/consumer-mvp/session-api.md`
- Modify: `docs/specs/consumer-mvp/order-api.md`
- Modify: `frontend/openapi.json`
- Regenerate: `frontend/src/generated/**`
**Approach:**
- 정책 문서는 신규 주문만 차단/기존 조회 유지/재활성 자동 복구/QR 404 유지로 동기화한다.
- 현재 백엔드의 OpenAPI를 내려받아 전체 생성물을 재생성하고 예상 범위 외 드리프트를 검토한다.
- 프론트 런타임 코드는 수정하지 않고 후속 integration에 필요한 생성 타입/함수만 제공한다.
**Test scenarios:**
- Contract: OpenAPI 세션 모델에 주문 가능 여부와 차단 사유가 표현된다.
- Contract: 주문 충돌 설명에 `TABLE_INACTIVE`가 구분된다.
- Regression: 생성 클라이언트가 재생성 후 추가 diff 없이 재현된다.
**Verification:** 백엔드 계약/문서/OpenAPI/생성 클라이언트가 같은 상태 모델을 설명한다.

---

## System-Wide Impact

- **Interaction graph:** 테이블 관리 갱신과 Consumer 주문 생성이 같은 `table_info` 행 잠금으로 직렬화된다.
- **Error propagation:** 전용 예외 → 전역 핸들러 → `409`/`CommonResponse.error` → 후속 프론트 분기다.
- **State lifecycle risks:** 테이블 재활성화는 ACTIVE 방문만 복구하며 CLOSED/EXPIRED는 기존 방문 규칙을 따른다.
- **API surface parity:** 신규 QR, 메뉴/주문 조회, 직원 주문 처리 계약은 변경하지 않는다.
- **Integration coverage:** 실제 DB 동시성 테스트 기반이 없으므로 SQL 잠금 계약과 서비스 호출 순서를 자동화 테스트로 고정하고 실제 백엔드 QA에서 경합을 확인한다.

---

## Risks & Dependencies

| Risk | Mitigation |
|---|---|
| 테이블/방문 잠금 순서 역전으로 교착 | 모든 Consumer 생성 흐름의 잠금 순서를 테이블 → 방문으로 통일한다. |
| 세션 응답은 최신인데 주문 직전 상태가 바뀜 | POST 트랜잭션의 잠금 판정을 최종 기준으로 둔다. |
| 모든 `409`가 테이블 비활성으로 오인됨 | 전용 예외와 안정 코드만 분리하고 기존 충돌 테스트를 유지한다. |
| codegen이 무관한 타입까지 변경 | OpenAPI와 생성 diff를 검토하고 현재 백엔드 기준 재생성 재현성을 확인한다. |

---

## Documentation / Operational Notes

- 권장 브랜치: `feature/consumer-table-order-availability`
- 실제 프론트 연결 시 이 계획과 origin 요구사항의 R8/R11을 이어받는다.
- PIN은 후속 TODO로만 관리하며 이번 문서에 계약을 추가하지 않는다.
- 완료 조건: 백엔드 전체 테스트/QR·Consumer 조회·직원 주문 처리 회귀/OpenAPI 재생성 재현성을 통과하고, R8/R11 UI는 미완료로 인계한다.
- 실제 DB QA는 비활성화 선커밋/주문 선커밋 양방향 경합에서 각각 차단/단일 성공을 확인한다.

---

## Sources & References

- **Origin document:** [docs/brainstorms/2026-08-31-consumer-table-order-availability-requirements.md](../brainstorms/2026-08-31-consumer-table-order-availability-requirements.md)
- [docs/specs/consumer-mvp/session-api.md](../specs/consumer-mvp/session-api.md)
- [docs/specs/consumer-mvp/order-api.md](../specs/consumer-mvp/order-api.md)
- [docs/solutions/workflow-issues/consumer-order-session-contract-hardening-2026-08-28.md](../solutions/workflow-issues/consumer-order-session-contract-hardening-2026-08-28.md)
