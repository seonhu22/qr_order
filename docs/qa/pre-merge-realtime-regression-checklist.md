# 병합 전 실시간 회귀 체크리스트

> 대상: SSE, 주문, 결제, 직원 호출 또는 세션 코드를 변경한 PR. 전체 QA를 반복하지 않고 실패 영향이 큰 흐름만 확인한다.

## 자동 검사

- [ ] Backend 관련 테스트: `ConsumerOrderTransactionServiceTest`, `ConsumerEventServiceTest`, `ConsumerParticipantRegistryTest`, `StatusServiceTest`, `OrderRevisionTransactionServiceTest`, `ConsumerStaffCallServiceTest`
- [ ] Frontend 관련 테스트: `useConsumerEvents.test.tsx`, `useClientEvents.test.tsx`
- [ ] Frontend `typecheck`, `lint`, `build`
- [ ] 이벤트 이름, 채널, 수신 핸들러와 query key가 [계약표](../specs/realtime-contract-matrix.md)와 일치

## dev:real 핵심 QA

- [ ] Consumer 주문 성공 직후 Client 주문현황이 새로고침 없이 갱신
- [ ] Client 상태 변경 직후 같은 방문의 Consumer 화면이 갱신
- [ ] 주문 수정 후 Consumer와 Client 양쪽이 갱신
- [ ] 결제 또는 미결제 후 Consumer가 방문 종료 화면으로 전환
- [ ] 직원 호출 후 Client 배지와 목록이 갱신
- [ ] 일반 창과 시크릿 창으로 같은 QR 접속 시 양쪽이 `2명 이용중`, 한쪽 종료 후 `1명 이용중`
- [ ] 같은 브라우저 세션의 탭 추가는 인원을 늘리지 않음
- [ ] SSE 차단 시 fallback 조회가 시작되고 복구 후 중복 연결과 polling이 정리됨

## 실패 시 기록

1. 실패한 행위와 기대 이벤트를 계약표에서 선택한다.
2. Network EventStream에서 이벤트 이름과 payload를 저장한다.
3. 이어지는 HTTP 재조회 유무와 응답을 저장한다.
4. `서버 미발행 / 채널 불일치 / 프런트 미수신 / 캐시 미갱신 / 조회 응답 오류 / 렌더링 오류` 중 끊긴 경계를 기록한다.
5. 실패 테스트를 추가한 뒤 수정하고, 막힌 QA부터 재개한다.
