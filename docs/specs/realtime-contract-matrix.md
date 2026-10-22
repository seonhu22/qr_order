# 실시간 기능 계약표

> 목적: 기능별로 `DB commit → SSE 발행 → 채널 → 프런트 처리 → HTTP 재조회 → 화면` 연결을 한곳에서 추적한다. SSE payload는 변경 신호이며 최종 데이터 권위는 HTTP API다.

## 계약표

| 행위 | commit 후 이벤트와 채널 | 프런트 처리 | 화면 결과 | 자동 검증 | 상태 |
|---|---|---|---|---|---|
| Consumer 신규 주문 | Consumer `ORDER_CREATED` / `consumer:{plant}:{visit}` + Client `ORDER_STATUS_CHANGED` / `client:{plant}` | Consumer 주문 캐시 + Client 주문현황 캐시 무효화 | 양쪽 주문 목록 재조회 | `RealtimeContractIntegrationTest`, 양쪽 이벤트 훅 테스트 | 검증 |
| Client 주문 상태 변경 | Consumer `STATUS_CHANGED` / 방문 채널 | Consumer 주문 캐시 무효화 | Consumer 주문 상태 재조회 | `StatusServiceTest`, `useConsumerEvents.test.tsx` | 검증 |
| 주문 수정 | Consumer `STATUS_CHANGED` + Client `ORDER_STATUS_CHANGED` | 양쪽 주문 캐시 무효화 | 수정 결과 재조회 | `OrderRevisionTransactionServiceTest`, 양쪽 이벤트 훅 테스트 | 검증 |
| 결제 완료 또는 미결제 | Consumer `VISIT_CLOSED` / 방문 채널 | Consumer 세션과 주문 캐시 무효화 | 방문 종료 화면 | `StatusServiceTest`, `useConsumerEvents.test.tsx` | 검증 |
| 직원 호출 | Client `STAFF_CALLED` / 매장 채널 | unread 캐시 무효화 + 알림 store 갱신 | 배지와 호출 목록 갱신 | `ConsumerStaffCallServiceTest`, `useClientEvents.test.tsx` | 검증 |
| Consumer SSE 참여/이탈 | Consumer `PARTICIPANTS_CHANGED` / 방문 채널 | 참여 인원 store 갱신 | `N명 이용중` 갱신 | `ConsumerEventServiceTest`, `ConsumerParticipantRegistryTest`, `useConsumerEvents.test.tsx` | 검증 |

## 참여 인원 기준

- 한 명은 서버 `HttpSession` 하나다.
- 같은 일반 창의 여러 탭 또는 같은 시크릿 세션의 여러 탭은 한 명이다.
- 일반 창과 시크릿 창, 서로 다른 브라우저 또는 기기는 서로 다른 사람으로 센다.
- 따라서 “시크릿 탭 두 개가 2명”은 현재 계약의 통과 조건이 아니다.

## 확인된 후속 점검

- 여러 Client 브라우저를 동시에 사용하는 경우, Client가 수행한 일반 상태 변경과 결제 종료가 다른 Client 화면에도 즉시 반영돼야 하는지 정책과 발행 이벤트를 확정한다.
- Client SSE가 5회 연속 실패해 degraded 상태가 되기 전까지는 주문현황 30초 polling이 시작되지 않는다. 운영 허용 시간을 별도로 확인한다.
- 다중 서버에서는 메모리 emitter와 참여자 registry만으로 전달과 인원 일관성을 보장할 수 없으므로 Redis Pub/Sub 같은 공유 계층이 필요하다.

## 관련 문서

- [SSE 가이드](../guides/sse-guide.md)
- [Consumer 참여 인원 규약](./consumer-mvp/participants.md)
- [병합 전 실시간 회귀 체크리스트](../qa/pre-merge-realtime-regression-checklist.md)
