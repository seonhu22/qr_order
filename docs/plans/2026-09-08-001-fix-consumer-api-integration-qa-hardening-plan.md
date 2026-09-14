---
title: Consumer API Integration / QA Hardening Plan
type: fix
status: active
date: 2026-09-08
origin: docs/brainstorms/2026-09-08-consumer-api-integration-qa-hardening-requirements.md
deepened: 2026-09-08
result: ../agent-reports/2026-09-08-consumer-api-integration-qa-hardening.md
---
# Consumer API Integration / QA Hardening Plan

## Summary

병합된 흐름을 특성 테스트로 먼저 고정하고, 실제 API 계약 불일치와 Client 운영 API의 권한/전이/결제 범위를 기존 패턴으로 보강한다. 마지막에는 `dev:real` QA와 자동 검사 결과를 요구사항/코드/커밋에 연결한 보고서를 남긴다.

---

## Problem Frame

Consumer와 Client 기능은 연결돼 있지만 병합 상태, 생성 타입, MyBatis 매핑과 방문 전체 결제는 화면만으로 증명되지 않는다. 다중 주문 영수증 범위와 상태 변경 API의 서버 검증이 주요 위험이다.

---

## Requirements

- R1. 병합 누락/충돌 잔재/API 계약 불일치를 검사한다.
- R2. 실제 백엔드 `dev:real`을 QA 기준으로 삼는다.
- R3. Consumer 세션/메뉴/주문 생성/목록/상세를 검증한다.
- R4. Client에서 Consumer 주문의 메뉴/옵션/수량/금액을 조회한다.
- R5. Client 상태 전이가 서버 규칙과 재조회에 일치한다.
- R6. 결제 완료가 방문 전체와 양쪽 앱에 일관되게 적용된다.
- R7. 불확실한 실패에서 장바구니/요청 식별자를 보존하고 성공 후 제거한다.
- R8. CLOSED/EXPIRED는 장바구니를 제거하고 TABLE_INACTIVE/일시 오류는 유지한다.
- R9. MSW는 전송 장애 보조에 한정한다.
- R10. 테스트/타입/린트/빌드/백엔드 검사와 재현 절차를 완료 근거로 삼는다.
- R11. 원인/선택 이유/영향/검증/커밋을 기록한다.
- R12. 로컬 커밋만 수행하고 push하지 않는다.
- R13. 2026-09-08에 검사/수정/검증/보고를 완료한다.

**Origin actors:** A1 Consumer 사용자, A2 Client 직원, A3 리뷰어/QA 담당자
**Origin flows:** F1 주문 생성/조회, F2 Client 운영/Consumer 반영, F3 장애/복구
**Origin acceptance examples:** AE1-AE6 전체

---

## Scope Boundaries

- DB 스키마/서버 영속 멱등성/`requestNote`
- Consumer SSE/참여 인원/직원 호출/서버 장바구니/PIN
- 통합 검증과 무관한 구조 개선 및 원격 push

---

## Context & Research

### Relevant Code and Patterns

- `frontend/src/apps/consumer/features/session/api/consumerSessionApi.ts`: 생성 응답을 화면 모델로 변환한다.
- `frontend/src/apps/consumer/features/order-shell/api/consumerOrderApi.ts`: 주문 DTO/15초 제한/조회 query를 소유한다.
- `frontend/src/apps/consumer/features/order-shell/hooks/useConsumerOrderPage.ts`: 오류별 보존/종료 정책을 조립한다.
- `frontend/src/apps/client/features/order-status-management/api/orderStatusBoardApi.ts`: Client 상태/결제 어댑터다.
- `qrorder/src/main/java/htms/QROrder/client/service/StatusService.java`: 매장 범위/방문 잠금/전이 검증 패턴이다.
- `qrorder/src/main/resources/mapper/client/StatusMapper.xml`: 조회/상태/영수증/결제 쿼리 범위다.

### Institutional Learnings

- `docs/solutions/integration-issues/consumer-session-order-api-integration-2026-09-01.md`: 세션 생명주기와 주문 가능 상태를 분리하고 성공 전 cart를 지우지 않는다.
- `docs/solutions/workflow-issues/consumer-order-session-contract-hardening-2026-08-28.md`: master 방문/group 진행/detail 정산 플래그를 분리하고 master-first 잠금을 유지한다.
- PostgreSQL timestamp는 `LocalDateTime`으로 받고 프론트는 날짜를 보존한 채 표시 시각만 파생한다.

---

## Key Technical Decisions

- 특성 테스트 우선: 구현/병합된 기대 계약을 먼저 고정해야 회귀를 판별할 수 있다.
- 생성 클라이언트는 스키마에서 재생성하고 feature 어댑터가 UI 모델을 변환한다.
- 백엔드 수정은 재현된 계약 결함에 한정한다. 사용자가 이번 작업의 API 생성/수정을 허용했지만 DB 변경은 금지했다.
- 상태 변경은 로그인 매장/허용 전이/영향 행을 검증한다. 별도 Client 역할 정책은 없으므로 기존 로그인 사용자 정책을 유지하고 이를 한계로 기록한다.
- 결제 쓰기가 master 전체라면 영수증도 같은 master의 모든 유효 group을 보여준다.
- 쿠키/MyBatis/트랜잭션은 `dev:real`, 결정적 전송 실패 UI는 MSW로 검증한다.
- 보고서는 자동 완료/수동 완료/미검증을 구분한다.

---

## Open Questions

### Resolved During Planning

- TABLE_INACTIVE: 기존 Client 테이블 관리의 사용 여부 변경 기능으로 재현한다.
- 서버 영속 멱등성: DB가 필요하므로 프론트의 동일 ID 보존까지만 검증한다.
- 결제 후 Consumer: master 결제 완료 상태를 CLOSED로 표시하고 cart를 제거한다.

### Deferred to Implementation

- 실행 서버 OpenAPI가 백엔드 날짜 타입을 정확히 내보내는지 생성 diff로 확인한다.
- 다중 주문/만료 세션 데이터 준비 가능 여부를 확인하고 불가능하면 보고서에 선행조건을 남긴다.

---

## Implementation Units

### U1. 병합 상태와 Consumer 계약 특성화

**Goal/requirements:** 병합 잔재와 Consumer 성공/실패/복구 계약을 고정한다. R1, R3, R7-R9.
**Dependencies:** None
**Files:**
- Test: `frontend/src/apps/consumer/features/session/api/consumerSessionApi.test.ts`
- Test: `frontend/src/apps/consumer/routes/ConsumerSessionGuard.test.tsx`
- Test: `frontend/src/apps/consumer/features/order-shell/api/consumerOrderApi.test.ts`
- Test: `frontend/src/apps/consumer/features/order-shell/api/consumerMenuApi.ts`, `consumerMenuMapper.test.ts`
- Test: `frontend/src/apps/consumer/features/order-shell/stores/consumerCartStore.test.ts`
- Test: `frontend/src/apps/consumer/pages/order/ConsumerOrderPage.test.tsx`
- Test: `qrorder/src/test/java/htms/QROrder/consumer/**`
**Approach:** 충돌 표식/누락/생성 계약을 검사하고 기존 테스트와 겹치지 않는 경계만 보충한다.
**Execution note:** Characterization-first.
**Test scenarios:** 메뉴 목록/검색/상세 계약 / 성공 후 cart/ID 제거 / TABLE_INACTIVE와 일반 409 구분 / CLOSED/EXPIRED/410 제거 / 전송 실패 유지 / 같은 cart 재시도는 같은 ID / cart 수정 후 새 ID.
**Verification:** F1/F3와 AE3/AE4가 자동 테스트로 고정된다.

### U2. Client 주문 상태 변경 API 경계 보강

**Goal/requirements:** 상태 변경을 로그인 매장의 대상과 허용된 전이에만 적용한다. R4, R5.
**Dependencies:** U1
**Files:**
- Modify: `qrorder/src/main/java/htms/QROrder/client/controller/OrderManageController.java`
- Modify: `qrorder/src/main/java/htms/QROrder/client/service/StatusService.java`
- Modify: `qrorder/src/main/java/htms/QROrder/client/repository/StatusMapper.java`
- Modify: `qrorder/src/main/resources/mapper/client/StatusMapper.xml`
- Test: `qrorder/src/test/java/htms/QROrder/client/StatusServiceTest.java`
- Test: `qrorder/src/test/java/htms/QROrder/client/StatusMapperXmlTest.java`
- Test: `qrorder/src/test/java/htms/QROrder/client/OrderManageControllerTest.java`
- Test: `frontend/src/apps/client/features/order-status-management/api/orderStatusBoardApi.test.tsx`
**Approach:** 실패 재현 후 결제 API의 매장 범위/잠금/영향 행 패턴을 상태 변경/취소/변경/취소사유 조회에 확장한다.
**Test scenarios:** 지원 전이 / 무세션/다른 매장/없는 주문 거부 / 잘못된 상태 거부 / plant 전달 / 혼합 ID 원자적 거부 / HTTP 성공 본문의 실패 처리.
**Verification:** F2/AE2의 상태 변경을 서버/프론트 테스트가 증명한다.

### U3. 방문 전체 영수증/결제 범위 일치

**Goal/requirements:** 여러 주문의 영수증 범위와 실제 결제 범위를 일치시킨다. R4, R6.
**Dependencies:** U2
**Files:**
- Modify: `qrorder/src/main/java/htms/QROrder/client/service/StatusService.java`
- Modify: `qrorder/src/main/resources/mapper/client/StatusMapper.xml`
- Test: `qrorder/src/test/java/htms/QROrder/client/StatusServiceTest.java`
- Test: `qrorder/src/test/java/htms/QROrder/client/StatusMapperXmlTest.java`
- Test: `frontend/src/apps/client/features/order-status-management/api/orderStatusBoardApi.test.tsx`
**Approach:** 실패 재현 시 group으로 매장 내 master를 찾고 영수증/합계/결제를 동일한 방문 범위로 맞춘다. 클라이언트 금액은 신뢰하지 않고 master-first 잠금을 유지한다.
**Test scenarios:** 2개 주문 영수증/합계/결제 / 미서빙 혼합 무변경 / 취소/타 매장 제외 / 변조된 합계 무시. DB 동시성은 실제 테스트가 없으면 미검증으로 보고한다.
**Verification:** 영수증 읽기와 결제 쓰기가 동일한 방문 범위다.

### U4. 날짜 계약/생성 타입 정합성

**Goal/requirements:** timestamp 500과 생성 타입 우회를 제거하거나 근거 있는 경계로 격리한다. R1, R3-R5.
**Dependencies:** U1
**Files:**
- Modify: `qrorder/src/main/java/htms/QROrder/client/dto/StatusItem.java`
- Regenerate if required: `frontend/openapi.json`, `frontend/src/generated/**`
- Modify: `frontend/src/apps/client/features/order-status-management/api/orderStatusBoardApi.ts`
- Test: `frontend/src/apps/client/features/order-status-management/api/orderStatusBoardMapper.test.ts`
- Test: `qrorder/src/test/java/htms/QROrder/client/StatusMapperXmlTest.java`
**Approach:** 실제 OpenAPI를 권위로 생성 diff 전체를 검토해 무관한 변경은 제외하고, 날짜 전체를 표시 단계까지 보존한다.
**Test scenarios:** timestamp 조회 성공 / 날짜가 다른 같은 시각 구분 / OpenAPI와 생성 타입 일치.
**Verification:** 서버와 생성 타입이 같은 날짜/시각 계약을 표현한다.

### U5. 전체 검증/QA 보고/문서 동기화

**Goal/requirements:** 자동 검사와 `dev:real` 절차를 추적 가능한 보고서로 남긴다. R2, R10-R13.
**Dependencies:** U1-U4
**Files:**
- Create: `docs/agent-reports/2026-09-08-consumer-api-integration-qa-report.md`
- Modify: `frontend/docs/page/consumer-order.md`
- Modify: `frontend/docs/page/order-status-management.md`
**Approach:** 먼저 서비스/계정/QR/상태별 데이터 준비를 점검한다. 보고서에는 요구사항 표와 원인/선택/영향/검증/커밋을 가진 결함 기록을 두고 미실행 수동 항목은 완료로 표시하지 않는다.
**Test scenarios:** 세션→메뉴 목록/검색/상세→주문 생성/목록/상세 ID/금액 비교→Client 메뉴/옵션/수량/금액→상태→결제→재조회/CLOSED / 테이블 비활성/재활성 / 오프라인/15초 재시도 / 자동 검사.
**Verification:** 보고서에서 R1-R13/AE1-AE6 상태를 추적하며 실제 환경이 없으면 R2-R6/R13을 미충족으로 표시한다.

---

## System-Wide Impact / Risks

- 흐름: QR 쿠키→Consumer 세션/주문→Client polling/전이→master 결제→Consumer CLOSED.
- 오류는 서버 HTTP/공통 응답→feature 어댑터→React Query/UI 보존 정책 순서로 전달한다.
- 주요 위험은 POST 중복, 결제/신규 주문 경쟁, 성공 전 cart 삭제, 세션 교체 캐시, 다중 주문 정산 회귀다.
- backend/OpenAPI/generated client/feature mapper/MSW의 계약을 함께 확인한다.
- 실제 데이터 준비 실패 시 자동 검증은 진행하되 수동 미검증과 선행조건을 기록하고 전체 완료를 선언하지 않는다.

---

## Documentation / Operational Notes

- “로컬 주문/결제 미연동”이라는 오래된 문구를 정정한다.
- 수동 QA에 QR ID, Client 계정, 테이블 토글과 Network 확인점을 적는다.
- 커밋은 `feat : (consumer) 작업내용` 형식을 유지하고 push하지 않는다.

---

## Sources & References

- **Origin:** `docs/brainstorms/2026-09-08-consumer-api-integration-qa-hardening-requirements.md`
- `docs/solutions/integration-issues/consumer-session-order-api-integration-2026-09-01.md`
- `docs/solutions/workflow-issues/consumer-order-session-contract-hardening-2026-08-28.md`
