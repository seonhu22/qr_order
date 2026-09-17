# SSE 가이드 (Server-Sent Events)

브랜치: `fix/consumer-sse-reconnect` | 갱신: 2026-09-15 | 원본 작성: 2026-08-18

---

## 01. 개요

소비자(Consumer) 화면에서 실시간 주문 상태 변경을 수신하기 위해 SSE를 사용한다.
WebSocket 대신 SSE를 선택한 이유: 단방향 서버 → 클라이언트 푸시만 필요하고, HTTP 기반이라 별도 프로토콜 업그레이드 없이 쿠키 세션을 그대로 활용할 수 있다.

---

## 02. 구현 상태

| 항목 | 상태 |
|---|---|
| 구독 엔드포인트 | 완료 |
| 채널 브로드캐스트 로직 | 완료 |
| 이벤트 발행 지점 연결 | 완료 |
| 프론트 구독 코드 | 완료 |
| 채널 ID 단위 결정 | 완료 — sysPlantCd + consumerSessionId 조합 |
| 인스턴스 간 emitter 공유 | 미해결 — 현재 단일 인스턴스 환경에서만 동작 |

---

## 03. 백엔드 구조

### 관련 파일

- `qrorder/src/main/java/htms/QROrder/consumer/event/controller/ConsumerEventController.java`
- `qrorder/src/main/java/htms/QROrder/consumer/event/service/ConsumerEventService.java`

### 엔드포인트

```
GET /api/client/consumer/events
```

경로 파라미터 없음. `HttpSession`에서 `sysPlantCd`와 `consumerSessionId`를 읽어 채널을 결정한다.

### 채널 키

```
채널 = sysPlantCd + consumerSessionId
```

원본에서 미정이었던 채널 ID 단위가 이 조합으로 확정됐다. 매장(sysPlantCd) + 소비자 세션(consumerSessionId) 단위로 격리되므로 다른 테이블/세션 이벤트가 섞이지 않는다.

### 이벤트 3종

| 이벤트명 | 발생 시점 |
|---|---|
| `ORDER_CREATED` | 주문 생성 |
| `STATUS_CHANGED` | 주문 상태 변경 |
| `VISIT_CLOSED` | 방문 세션 종료 |
| `PARTICIPANTS_CHANGED` | 같은 방문의 고유 QR 브라우저 세션 수 변경 |

### 발행 지점

```java
ConsumerEventService.publish(sysPlantCd, consumerSessionId, eventName)
```

주문/세션 처리 로직에서 직접 호출한다. 원본의 미완료 항목이었으나 현재 모두 연결됨.

### 미해결: 인스턴스 간 공유

현재 emitter 맵은 단일 JVM 메모리에 저장된다. 수평 확장(멀티 인스턴스) 시 인스턴스 A에 구독한 클라이언트가 인스턴스 B에서 발행한 이벤트를 수신하지 못한다. Redis Pub/Sub 등 외부 브로커 도입이 필요하다 — 현재 범위 밖.

---

## 04. 프론트엔드 구조

### 관련 파일

- `frontend/src/apps/consumer/features/events/api/consumerEventSource.ts`
- `frontend/src/apps/consumer/features/events/hooks/useConsumerEvents.ts`
- `frontend/src/apps/consumer/pages/order/ConsumerOrderPage.tsx`

### 상수

```ts
const DISCONNECTED_POLL_INTERVAL_MS = 5_000;  // 폴링 폴백 간격
const SSE_RECONNECT_INTERVAL_MS     = 3_000;  // 명시적 재연결 간격
```

### EventSource 팩토리

`consumerEventSource.ts`의 `createConsumerEventSource()`가 `EventSource` 인스턴스를 생성한다.

```ts
// consumerEventSource.ts
export function createConsumerEventSource() {
  return new EventSource('/api/client/consumer/events', { withCredentials: true });
}
```

### 이벤트 핸들링

| 이벤트 | 프론트 처리 |
|---|---|
| `ORDER_CREATED` | `invalidateOrders()` |
| `STATUS_CHANGED` | `invalidateOrders()` |
| `VISIT_CLOSED` | `invalidateSessionAndOrders()` |
| `PARTICIPANTS_CHANGED` | 참여 인원 store 갱신 |

---

## 05. 명시적 재연결 패턴

### 브라우저 자동 재연결을 사용하지 않는 이유

`EventSource`는 연결이 끊기면 브라우저가 자동으로 재연결을 시도한다. 그러나 이 프로젝트에서 자동 재연결을 사용했을 때 **서버 쿠키 세션과 충돌해 실제로 재연결에 실패하는 버그**가 발견됐다. 새 연결 요청이 유효한 세션 없이 도달하거나, 서버 측 emitter가 이미 정리된 채 응답하는 케이스가 재현됐다.

해결책으로 `onerror` 시 즉시 `source.close()`로 기존 연결을 완전히 닫고, 3초 뒤 새 `EventSource`를 생성하는 명시적 재연결 패턴을 채택했다.

### 패턴 요약

```ts
// useConsumerEvents.ts (핵심 흐름)
function connect() {
  const source = createConsumerEventSource();

  source.addEventListener('ORDER_CREATED',  () => invalidateOrders());
  source.addEventListener('STATUS_CHANGED', () => invalidateOrders());
  source.addEventListener('VISIT_CLOSED',   () => invalidateSessionAndOrders());

  source.onerror = () => {
    source.close();                          // 브라우저 자동 재연결 차단
    startPollingFallback();                  // 폴링 폴백 시작
    setTimeout(() => {
      stopPollingFallback();
      connect();                             // 3초 뒤 새 인스턴스로 재연결
    }, SSE_RECONNECT_INTERVAL_MS);
  };
}
```

---

## 06. 폴링 폴백 패턴

SSE 연결이 끊긴 동안 주문 상태가 변경돼도 화면이 굳지 않도록, 재연결 대기 중에는 TanStack Query invalidate를 5초 간격으로 실행한다.

```ts
let pollTimer: ReturnType<typeof setInterval> | null = null;

function startPollingFallback() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    invalidateOrders();
  }, DISCONNECTED_POLL_INTERVAL_MS);
}

function stopPollingFallback() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
```

SSE가 성공적으로 재연결되면 폴링을 중단한다. 폴링은 임시 보호 수단이며 SSE 정상 수신 시 비활성화된다.

---

## 07. 호출 지점

`ConsumerOrderPage.tsx`에서 `useConsumerEvents()`를 마운트 시 한 번 호출한다. 훅 내부에서 연결/재연결/폴백/정리를 모두 관리하므로 페이지는 훅만 호출하면 된다.

QR 참여 인원의 집계 기준, 중복 탭 처리와 QA는 [Consumer QR 참여 인원 규약](../specs/consumer-mvp/participants.md)을 따른다.

```tsx
// ConsumerOrderPage.tsx
export default function ConsumerOrderPage() {
  useConsumerEvents();
  // ...
}
```

---

## 08. 원본 대비 변경 요약

| 원본 미결 사항 | 결과 |
|---|---|
| 채널 ID 단위 미정 | sysPlantCd + consumerSessionId로 확정 |
| 이벤트 발행 지점 미연결 | ConsumerEventService.publish()로 연결 완료 |
| 프론트 구독 코드 미완성 | useConsumerEvents / createConsumerEventSource 구현 완료 |
| 인증 체크 없음 | HttpSession 기반 — 쿠키 세션이 인증 역할 대행 |
| emitter 타임아웃 0L (무제한) | 현재 유지 중 — 정책 미결정 |
| 인스턴스 간 공유 안 됨 | 미해결 — 단일 인스턴스 환경 전제 |
