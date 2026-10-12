---
title: "feat: 직원호출 개별 완료를 서버에 저장한다"
type: feat
status: completed
date: 2026-10-07
deepened: 2026-10-07
origin: conversation
---

# 직원호출 개별 완료 저장 API와 Client 연결

## Summary

주문현황의 직원호출 카드에서 "완료"를 누르면 현재 화면에서만 숨기지 않고 호출 마스터의 `read_yn`을 서버에 저장한다. 기존 DB 구조와 미확인 조회 캐시를 그대로 사용하며, 계약이 없는 주문 수정과 DB 컬럼이 필요한 메뉴별 `requestNote`는 후속 작업으로 분리한다.

---

## Requirements

- R1. Client 로그인 매장은 자신의 직원호출 마스터 한 건만 완료할 수 있어야 한다.
- R2. 같은 완료 요청은 여러 번 보내도 성공하는 멱등 동작이어야 한다.
- R3. 완료 API가 실패하면 카드가 화면에 남고 사용자가 다시 시도할 수 있어야 한다.
- R4. 성공 후 주문현황 카드와 헤더 미확인 배지가 같은 서버 상태를 반영해야 한다.
- R5. 기존 전체 읽음 API와 미확인 조회 계약은 유지해야 한다.

---

## Scope Boundaries

- DB 테이블/컬럼을 변경하지 않는다.
- 기존 `change_order` API를 주문 수정 draft에 연결하지 않는다. 이 API는 미결제 플래그만 변경해 현재 UI의 메뉴 삭제/추가/옵션 변경 의미와 일치하지 않는다.
- 메뉴별 `requestNote`는 저장 위치와 API 계약을 별도 설계할 때까지 전송하거나 저장하지 않는다.
- 이미 구현된 직원호출 설정 조회/저장 API는 변경하지 않는다.

### Deferred to Follow-Up Work

- 주문 수정 저장: 메뉴 추가/삭제/수량/옵션/가격 재검증과 트랜잭션 계약을 먼저 확정한다.
- 메뉴별 `requestNote`: 주문 상세 단위 저장 컬럼과 조회/생성 DTO를 먼저 확정한다.

---

## Context & Research

### Relevant Code and Patterns

- `qrorder/src/main/java/htms/QROrder/client/controller/StaffCallNotificationController.java`: 미확인 조회와 전체 읽음 HTTP 경계
- `qrorder/src/main/java/htms/QROrder/client/service/StaffCallNotificationService.java`: 읽음 처리 트랜잭션 경계
- `qrorder/src/main/resources/mapper/client/StaffCallNotificationMapper.xml`: `sysPlantCd`로 소유권을 제한하는 기존 SQL
- `frontend/src/apps/client/features/staff-call-notifications/api/staffCallNotificationApi.ts`: 미확인 query와 전체 읽음 mutation
- `frontend/src/apps/client/features/order-status-management/hooks/useStaffCallBoard.ts`: 현재 로컬 숨김 처리 경계

### Institutional Learnings

- `docs/solutions/integration-issues/staff-call-master-grouped-notification-contract-2026-09-29.md`: 호출 마스터 1건이 알림/카드 1건이다.
- `docs/solutions/integration-issues/preserve-api-contracts-during-frontend-design-merge-2026-10-07.md`: UI 변경과 실제 API 계약을 별도로 검증한다.

---

## Key Technical Decisions

- 개별 완료는 직원호출 마스터 ID를 받는 별도 POST 계약으로 추가한다. 상태 변경이므로 기존 조회 API와 분리한다.
- 계약은 `POST /api/client/staff-call/notifications/{masterSysId}/read`와 기존 `CommonResponse` 형식의 `200` 응답으로 고정한다.
- UPDATE 조건에 로그인 세션의 `sysPlantCd`와 마스터 ID를 모두 사용해 다른 매장의 호출을 변경하지 못하게 한다.
- 대상이 이미 읽음/미존재/타 매장이어서 변경 행이 0건이어도 서비스는 반환 행 수로 분기하지 않고 성공 처리한다. 데이터 존재 여부를 노출하지 않으면서 재시도를 안전하게 만든다.
- 프론트는 성공 전 카드를 제거하지 않는다. 성공 후 함수형 cache updater로 대상만 제거하고 재조회해 보드와 `ClientLayout`이 동기화하는 Zustand 헤더 배지를 서버 결과로 수렴시킨다.
- OpenAPI 전체 재생성은 하지 않는다. 현재 직원호출 알림이 사용하는 feature-local API 모듈을 확장한다.

---

## Implementation Units

### U1. Backend 개별 읽음 계약

**Goal:** 로그인 매장이 직원호출 마스터 한 건을 읽음 처리한다.

**Requirements:** R1, R2, R5

**Dependencies:** 기존 `consumer_staff_call_master.read_yn`

**Files:**
- Modify: `qrorder/src/main/java/htms/QROrder/client/controller/StaffCallNotificationController.java`
- Modify: `qrorder/src/main/java/htms/QROrder/client/service/StaffCallNotificationService.java`
- Modify: `qrorder/src/main/java/htms/QROrder/client/repository/StaffCallNotificationMapper.java`
- Modify: `qrorder/src/main/resources/mapper/client/StaffCallNotificationMapper.xml`
- Test: `qrorder/src/test/java/htms/QROrder/client/StaffCallNotificationServiceTest.java`
- Create: `qrorder/src/test/java/htms/QROrder/client/StaffCallNotificationControllerTest.java`

**Approach:** 기존 전체 읽음 경계를 확장하되 마스터 ID와 로그인 매장 코드를 함께 전달한다. DB 변경 행 수와 관계없이 요청을 멱등 성공으로 종료한다.

**Execution note:** 소유권 조건과 멱등 재시도를 서비스 테스트로 먼저 고정한다.

**Test scenarios:**
- Happy path: 본인 매장의 미확인 마스터를 완료하면 두 식별자가 Mapper에 전달된다.
- Edge case: Mapper가 0행을 반환해도 서비스는 오류나 존재 여부별 응답 차이를 만들지 않는다.
- Security: 다른 매장의 마스터 ID를 보내도 매장 조건 때문에 변경되지 않는다.
- Contract: Controller가 path ID와 로그인 매장 코드를 전달하고 `200`/`success=true`를 반환한다.
- Regression: 전체 읽음은 기존처럼 매장 단위로 동작한다.

**Verification:** 관련 Backend 테스트와 전체 Backend 테스트가 통과하고, Mapper UPDATE에 두 소유권 조건이 존재한다.

### U2. Frontend mutation과 보드 완료 연결

**Goal:** 카드 완료를 로컬 숨김이 아닌 서버 저장 결과로 결정한다.

**Requirements:** R3, R4, R5

**Dependencies:** U1

**Files:**
- Modify: `frontend/src/apps/client/features/staff-call-notifications/api/staffCallNotificationApi.ts`
- Modify: `frontend/src/apps/client/features/order-status-management/hooks/useStaffCallBoard.ts`
- Modify: `frontend/src/apps/client/features/order-status-management/hooks/useOrderStatusBoardPage.ts`
- Delete: `frontend/src/apps/client/features/order-status-management/hooks/useDismissedOrderIds.ts`
- Delete: `frontend/src/apps/client/features/order-status-management/hooks/useDismissedOrderIds.test.tsx`
- Modify: `frontend/src/apps/client/features/order-status-management/components/OrderStatusBoard.tsx`
- Modify: `frontend/src/apps/client/features/order-status-management/components/StaffCallBoardColumn.tsx`
- Modify: `frontend/src/apps/client/features/order-status-management/components/StaffCallBoardCard.tsx`
- Test: `frontend/src/apps/client/features/staff-call-notifications/api/staffCallNotificationApi.test.ts`
- Create: `frontend/src/apps/client/features/order-status-management/hooks/useStaffCallBoard.test.tsx`

**Approach:** 개별 읽음 mutation을 추가하고 성공 시 unread cache에서 해당 마스터만 제거한 뒤 재조회한다. 로컬 dismiss를 제거하고 카드별 pending/error 상태를 Board→Column→Card로 전달한다. 처리 중인 카드만 비활성화하며 실패 메시지는 카드 안에 표시하고 재시도 시 지운다.

**Test scenarios:**
- Happy path: 완료 시 선택한 마스터 ID로 한 번 요청하고 카드가 사라진다.
- Contract: 정확한 POST path와 ID, 오류 전파, 기존 read-all 회귀를 검증한다.
- Integration: cache 변경 후 ClientLayout 동기화로 헤더 배지와 보드가 서버 재조회 결과에 수렴한다.
- Error path: 서버 실패 시 카드와 버튼이 복구되고 인라인 오류를 표시하며 재시도할 수 있다.
- Edge case: 처리 중 같은 카드를 다시 눌러도 중복 요청하지 않는다.
- Regression: 전체 읽음 mutation의 cache 처리는 유지된다.

**Verification:** 영향 범위 Vitest, typecheck, lint와 production build가 통과한다.

### U3. 계약 문서 동기화

**Goal:** 개별 완료/전체 읽음/보류 기능의 경계를 추적 가능하게 남긴다.

**Requirements:** R1~R5

**Dependencies:** U1, U2

**Files:**
- Modify: `frontend/docs/page/order-status-management.md`
- Modify: `frontend/docs/page/consumer-order.md`

**Approach:** 직원호출 완료가 DB에 저장됨을 기록하고, 주문 수정과 메뉴별 `requestNote`는 별도 계약이 필요한 후속 작업으로 링크 중심 정리한다.

**Test scenarios:**
- Test expectation: none -- 동작 변경이 없는 문서 동기화 단위다.

**Verification:** 문서가 실제 API/화면 동작과 일치하고 링크가 유효하다.

---

## System-Wide Impact

- **Interaction graph:** 완료 버튼 → 개별 read mutation → 소유권 제한 UPDATE → unread query cache → ClientLayout sync effect → Zustand 배지/보드
- **Error propagation:** Backend 실패는 mutation 오류로 남고 카드 제거를 수행하지 않는다.
- **State lifecycle risks:** 성공 직후 cache 갱신과 refetch가 겹쳐도 서버의 `read_yn=Y`가 최종 기준이다.
- **API surface parity:** 기존 read-all은 유지하며 개별 read만 추가한다.
- **Unchanged invariants:** 호출 마스터 1건/카드 1건, 매장 단위 접근권한, SSE의 unread query 갱신 계약은 바뀌지 않는다.

---

## Risks & Dependencies

| Risk | Mitigation |
|---|---|
| 다른 매장 호출 변경 | 모든 UPDATE에 세션 `sysPlantCd`와 마스터 ID를 함께 사용 |
| 성공 후 헤더/보드 불일치 | 두 화면이 공유하는 unread cache를 단일 갱신 지점으로 사용 |
| API 실패를 완료로 오인 | 성공 전에는 카드를 제거하지 않고 실패 상태를 유지 |
| 기존 API를 주문 수정에 잘못 재사용 | 이번 범위에서 명시적으로 제외하고 별도 계약으로 분리 |

---

## Documentation / Operational Notes

- DB 마이그레이션은 없다.
- 실제 서버 QA에서는 카드 완료 후 새로고침해 다시 나타나지 않는지 확인한다.
- 원격 push는 이 계획의 실행 범위가 아니다.
