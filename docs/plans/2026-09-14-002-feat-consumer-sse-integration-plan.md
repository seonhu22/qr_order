---
title: "feat: Consumer 전용 SSE 연동"
type: feat
status: active
date: 2026-09-14
scope: backend+frontend
ownership-note: 백엔드 서비스/로직 수정 허용. DB 스키마 변경 금지.
---

# feat: Consumer 전용 SSE 연동

## Summary

Consumer 세션으로 인증된 SSE 채널을 추가하고 주문/방문 변경 신호를 받은 프론트가 기존 HTTP API를 재조회하도록 한다. SSE를 데이터 원본으로 만들지 않고, 연결 장애 시 제한적인 polling으로 현재 동기 API 동작을 보존한다.

---

## Problem Frame

Consumer 주문/세션 API는 동작하지만 다른 고객의 주문과 직원의 상태/결제 변경을 즉시 알 수 없다. 기존 공용 SSE는 호출자가 `channelId`를 직접 지정하고 메모리에 emitter를 보관하므로 Consumer 방문 권한 경계로 그대로 사용할 수 없다.

---

## Requirements

- R1. `GET /api/client/consumer/events`는 유효한 Consumer 바인딩만 구독할 수 있다.
- R2. 채널은 요청값이 아니라 서버가 확인한 방문 master를 기준으로 정한다.
- R3. 주문 생성/상태 변경/결제 또는 미결제 종료 뒤 커밋된 변경만 알린다.
- R4. 이벤트는 변경 신호만 제공하고 주문/세션의 최종 상태는 기존 HTTP API가 결정한다.
- R5. 연결 종료/오류/timeout에서 emitter를 정리하고 자동 재연결 중에는 polling으로 보완한다.
- R6. 다른 매장/테이블/과거 방문의 이벤트가 노출되지 않는다.

---

## Scope Boundaries

- 조리 단계별 알림/토스트와 현장 주문 취소 알림 UI는 추가하지 않는다.
- 직원 호출 이벤트와 참여 인원은 해당 기능 브랜치에서 연결한다.
- 다중 서버 이벤트 브로커, 영구 이벤트 로그와 완전한 이벤트 재생은 이번 범위가 아니다.
- 기존 공용 `/api/sse/subscribe/{channelId}`의 전면 개편은 하지 않는다.
- DB 스키마를 변경하지 않는다.

---

## Context & Research

### Relevant Code and Patterns

- `qrorder/src/main/java/htms/QROrder/common/service/SSEEmitterService.java`: emitter 등록/정리의 기존 기반이다.
- `qrorder/src/main/java/htms/QROrder/config/WebConfig.java`: `/api/client/consumer/**` Consumer 인증 경계다.
- `frontend/src/apps/consumer/features/order-shell/api/consumerOrderApi.ts`: 이벤트 후 재조회할 주문 query 패턴이다.
- `frontend/src/apps/consumer/features/session/hooks/useConsumerSession.ts`: 방문 종료의 HTTP 권위 상태를 제공한다.

### Institutional Learnings

- `docs/solutions/integration-issues/consumer-session-order-api-integration-2026-09-01.md`: Consumer query key는 서버 방문 ID를 사용하고 세션 생명주기와 주문 가능 상태를 분리한다.

### External References

- Spring MVC `SseEmitter`는 timeout/완료/오류 callback과 named event/reconnect time을 지원하므로 현재 Spring MVC 구조를 유지한다.
- https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-async.html

---

## Key Technical Decisions

- Consumer 전용 controller가 인증된 방문 ID를 해석하고 공용 emitter 저장소에는 서버가 만든 채널 키만 전달한다.
- 이벤트 타입은 `ORDER_CREATED` / `STATUS_CHANGED` / `VISIT_CLOSED` 세 가지로 고정한다. 백엔드 발행 이름과 프론트 수신 이름이 일치해야 연결된다.
- 이벤트 payload는 빈 문자열(`""`)로 고정한다. 프론트는 이벤트 수신 시 무조건 HTTP API를 재조회하며, payload 데이터를 화면에 직접 쓰지 않는다. SSE 전송 실패가 업무 결과에 영향을 주지 않고, 항상 서버가 데이터 권위를 유지하기 위해서다.
- DB 쓰기 트랜잭션이 성공한 뒤에만 이벤트를 발행한다. 롤백된 상태를 클라이언트가 먼저 조회하지 않게 하기 위해서다.
- 프론트는 EventSource 이벤트마다 관련 React Query cache를 무효화한다. 연결이 끊긴 동안만 5초 polling을 사용하고 복구되면 중단한다.
- 단일 서버 MVP에서는 메모리 emitter를 재사용하되, 다중 서버 배포 전에는 외부 broker가 필요함을 운영 제약으로 남긴다.

---

## Implementation Units

### U1. Consumer 인증 구독 경계

**Goal:** 방문 식별자를 외부에서 지정할 수 없는 Consumer SSE endpoint를 제공한다.

**Requirements:** R1, R2, R5, R6

**Dependencies:** 없음

**Files:**
- Create: `qrorder/src/main/java/htms/QROrder/consumer/event/controller/ConsumerEventController.java`
- Create: `qrorder/src/main/java/htms/QROrder/consumer/event/service/ConsumerEventService.java`
- Modify: `qrorder/src/main/java/htms/QROrder/common/service/SSEEmitterService.java`
- Test: `qrorder/src/test/java/htms/QROrder/consumer/event/ConsumerEventControllerTest.java`
- Test: `qrorder/src/test/java/htms/QROrder/consumer/event/ConsumerEventServiceTest.java`

**Approach:** 기존 Consumer interceptor가 만든 바인딩과 현재 방문을 검증한 후 서버 내부 채널에 구독한다. connect/heartbeat/timeout/오류에서 emitter 생명주기를 정리하고 재연결 간격을 안내한다.

**Test scenarios:**
- 유효한 바인딩 -> 현재 방문 채널 구독/connect 이벤트.
- 바인딩 없음/만료/종료 -> 기존 Consumer 인증/세션 오류 계약.
- 조작한 방문 ID로 다른 채널 구독 -> 요청 모델 자체에서 불가능.
- timeout/오류/브라우저 종료 -> emitter 저장소에서 제거.

**Verification:** 구독 endpoint가 Consumer 인증 경계 안에 있고 외부 channel ID를 받지 않는다.

### U2. 커밋 이후 변경 이벤트 발행

**Goal:** 주문과 방문 상태가 실제 반영된 뒤 해당 방문 구독자에게 갱신 신호를 보낸다.

**Requirements:** R3, R4, R6

**Dependencies:** U1, 방문 결제 플랜 U1/U2

**Files:**
- Modify: `qrorder/src/main/java/htms/QROrder/consumer/order/service/ConsumerOrderCreationService.java`
- Modify: `qrorder/src/main/java/htms/QROrder/client/service/StatusService.java`
- Test: `qrorder/src/test/java/htms/QROrder/consumer/order/ConsumerOrderCreationServiceTest.java`
- Test: `qrorder/src/test/java/htms/QROrder/client/StatusServiceTest.java`

**Approach:** 주문 생성, 직원 상태 변경, 결제 완료/미결제 처리에서 방문 ID를 확인하고 transaction commit 이후 최소 이벤트를 발행한다. 이벤트 전송 실패는 이미 커밋된 업무 트랜잭션을 실패시키지 않는다.

**Test scenarios:**
- 주문/상태/결제 성공 commit -> 해당 방문에 한 번 발행.
- 검증 실패 또는 transaction rollback -> 발행 없음.
- 다른 매장 주문 변경 -> 현재 방문 채널에 발행 없음.
- emitter 전송 실패 -> 주문/결제 결과 유지, 실패 emitter 정리.

**Verification:** 이벤트 시점이 commit 이후이며 업무 성공 여부와 SSE 전송 성공 여부가 분리된다.

### U3. Consumer EventSource/캐시 갱신

**Goal:** Consumer 화면이 SSE를 변경 신호로 사용해 세션과 주문을 재조회한다.

**Requirements:** R3, R4, R5

**Dependencies:** U1, U2

**Files:**
- Create: `frontend/src/apps/consumer/features/events/api/consumerEventSource.ts`
- Create: `frontend/src/apps/consumer/features/events/hooks/useConsumerEvents.ts`
- Test: `frontend/src/apps/consumer/features/events/hooks/useConsumerEvents.test.tsx`
- Modify: `frontend/src/apps/consumer/pages/order/ConsumerOrderPage.tsx`
- Test: `frontend/src/apps/consumer/pages/order/ConsumerOrderPage.test.tsx`

**Approach:** 활성 Consumer 방문에서만 EventSource를 열고 이벤트 종류에 따라 주문 목록/상세 또는 세션 query를 무효화한다. SSE 오류 중에는 5초 polling을 시작하고 연결 복구/화면 이탈/세션 종료 시 연결과 polling을 정리한다.

**Test scenarios:**
- 다른 고객 주문 생성 신호 -> 현재 방문 주문 목록 재조회.
- 직원 상태 변경 신호 -> 주문 목록/열린 상세 재조회.
- 결제/미결제 종료 신호 -> 세션 재조회 후 `CLOSED` 화면과 장바구니 정리.
- 연결 오류 -> 기존 화면 유지, polling 시작, 자동 재연결 허용.
- 연결 복구/컴포넌트 unmount -> 중복 연결과 timer 없음.
- 과거 방문 이벤트 -> 현재 session query key에 영향 없음.

**Verification:** SSE가 없어도 기존 HTTP 흐름이 동작하고, 연결 시 변경이 새로고침 없이 반영된다.

### U4. 실제 통합 QA/운영 제약 기록

**Goal:** 두 브라우저와 Client 앱 사이의 방문 단위 실시간 동작을 검증한다.

**Requirements:** R3, R5, R6

**Dependencies:** U1, U2, U3

**Files:**
- Modify: `docs/specs/consumer-mvp/implementation-plan.md`
- Modify: `docs/specs/consumer-mvp-api-spec.md`

**Approach:** 자동 테스트 이후 `dev:real`에서 동일 QR 브라우저 두 개와 Client 앱을 사용한다. 개발자 도구 Network에서 event stream 유지/재연결을 확인하고 결과와 단일 서버 제약을 문서화한다.

**Test scenarios:**
- Consumer A 주문 -> Consumer B 주문내역 자동 갱신.
- Client 상태 변경 -> 두 Consumer의 주문 재조회.
- Client 결제/미결제 -> 두 Consumer가 CLOSED로 전환.
- 한 Consumer 오프라인/복구 -> polling/재연결 뒤 최신 상태 수렴.
- 다른 테이블 Consumer -> 이벤트나 재조회 없음.

**Verification:** 자동 결과와 수동 QA 증거가 API/방문 ID/기대 결과에 연결된다.

---

## Risks & Dependencies

| Risk | Mitigation |
|---|---|
| 임의 channel ID로 타 방문 이벤트 구독 | 외부 channel 파라미터 제거, 서버 바인딩으로 채널 결정 |
| commit 전 알림으로 오래된 데이터 조회 | commit 이후 이벤트 발행 |
| 프록시 idle timeout/끊어진 emitter 누적 | heartbeat와 completion/timeout/error 정리 |
| 단일 서버 메모리 채널의 다중 서버 불일치 | MVP 제약 기록, 확장 시 Redis 등 broker 별도 계획 |
| EventSource 커스텀 헤더 불가 | WebConfig에 `allowCredentials(true)` 설정됨 — 브라우저가 쿠키를 자동 전송하므로 ConsumerAuthInterceptor와 호환. 프론트는 `new EventSource(url, { withCredentials: true })` 사용 필요. |

---

## Sources & References

- `docs/specs/consumer-mvp-api-spec.md`
- `docs/specs/consumer-mvp/policy-decisions.md`
- Spring MVC asynchronous requests: https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-async.html
