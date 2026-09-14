# Consumer MVP 구현 및 검증 계획

> 상위 문서: [Consumer MVP API 명세](../consumer-mvp-api-spec.md)  
> 세션 계약: [Consumer 세션 API](./session-api.md)  
> 주문 계약: [Consumer 주문 API 계약](./order-api.md)
> 정책 근거: [Consumer MVP 정책 결정](./policy-decisions.md)
> 핵심 수동 QA: [001/002/003 통합 시나리오](./manual-qa-001-003.md)

## 제약

- DB 스키마를 변경하지 않는다.
- 기존 스키마로 보장할 수 없는 요구는 구현한 척하지 않고 백엔드 요청서로 분리한다.
- 직원 호출은 UI 작업 시점으로 미룬다.
- SSE는 동기 API와 QA가 끝난 뒤 구현하며, HTTP API를 데이터 원본으로 유지한다.
- `dev` 병합과 release는 허락을 받은 뒤 수행한다.

## 권장 순서

> **완료 기준점:** 단계 1~11은 `feature/consumer-api-integration-qa-hardening` 병합으로 완료.

1. 이 문서 세트의 API 모델과 보류 항목을 승인한다.
2. 현재 인증 경계와 메뉴 이미지 테스트를 기준점으로 보존한다.
3. QR/세션 시작 시 `order_master` 생성/재사용과 빈 master 만료 생명주기를 구현한다.
4. Consumer 5분 만료를 전역 세션 설정과 분리한다.
5. `GET /api/client/consumer/session`을 구현한다.
6. 메뉴 이미지 OpenAPI와 프런트 연결을 완료한다.
7. 주문 생성 트랜잭션과 동시성 경계를 구현한다.
8. 공유 주문 목록/상세를 구현한다.
9. OpenAPI를 추출하고 최신 프런트 브랜치에서 codegen한다.
10. 세션 stub, 고정 매장명, 비활성 guard를 실제 API로 교체한다.
11. QA 후 허락을 받아 `dev` 병합과 release를 시도한다.

## 백엔드 산출물

- Controller, DTO, Service, Mapper interface/XML
- 세션/주문 단위/통합 테스트
- 동시 첫 주문의 master 단일 생성과 주문 트랜잭션 테스트
- 갱신된 Swagger/OpenAPI
- 스키마 변경 필요 사유를 담은 백엔드 요청서

## 프런트 산출물

- 최신 OpenAPI 기반 generated client
- 세션 상태와 `ConsumerSessionGuard` 연결
- 메뉴 이미지 binary API와 404 fallback
- 로컬 장바구니 → 주문 payload mapper
- 주문 성공 시 장바구니 초기화와 공유 목록 갱신
- 주문 요청 중 버튼 잠금과 실패 시 잠금 해제
- 단일 서버 10분 주문 멱등성/프론트의 동일 키 재시도와 충돌 안내
- 주문 목록/상세 UI 연결
- 활성 방문 전용 SSE 구독과 이벤트별 주문/세션 HTTP 재조회
- SSE 단절 중 5초 polling/재연결 후 polling 정리

## 핵심 QA

- QR 진입 후 새로고침해도 현재 테이블 복구
- 주문 전 5분 무활동 시 Consumer 바인딩 만료
- 주문 후에는 5분이 지나도 결제 전 주문내역 접근 가능
- 같은 테이블의 두 휴대폰에서 서로의 확정 주문 확인
- 같은 테이블에서 서로 다른 주문을 동시에 제출해 둘 다 생성
- 주문 버튼 연속 클릭 시 진행 중 요청 하나만 전송
- 주문 실패 시 장바구니 유지와 버튼 잠금 해제
- 품절/판매중지/잘못된 옵션/수량 초과 거부
- 다른 사업장/과거 방문 주문 접근 시 `404`
- 결제완료 DB 상태 반영 후 방문 종료 처리
- 주문 생성 중간 실패 시 부분 데이터 없음
- 동일 키 순차/동시 요청은 주문 한 건과 같은 `201`로 수렴
- 동일 키의 다른 payload/10분 만료 요청은 주문을 추가하지 않고 `409`
- 백엔드 테스트, 프런트 타입체크/테스트/빌드 통과
- 개발자 도구에서 `/api/client/consumer/events`가 `text/event-stream`으로 유지
- 다른 고객 주문/직원 상태 변경 후 새로고침 없이 주문 목록/상세 갱신
- 결제완료/미결제 종료 후 `VISIT_CLOSED` 수신과 종료 화면/장바구니 정리
- SSE 연결 차단 중 5초 HTTP 재조회/연결 복구 후 중복 요청 중단

## 백업 지점

1. 세션 API 완료
2. 주문 생성 완료
3. 주문 조회 완료
4. codegen 완료
5. 프런트 연결/QA 완료

각 지점은 독립 커밋으로 남긴다. DB 변경은 수행하지 않는다.

## 후속 순서

1. 직원 호출 Consumer/직원 API와 UI
2. [Consumer 전용 SSE](../../plans/2026-09-14-002-feat-consumer-sse-integration-plan.md) / 구현 완료, `dev:real` 수동 QA 필요
3. 참여 인원
4. 정책 확정 시 세션 나가기/주문 미리보기/취소 요청
5. 필요가 확인된 경우 서버 장바구니
6. 메뉴별 `requestNote` 입력/저장/직원 화면 표시 / TODO, 별도 플랜 미작성
7. 운영 전 DB/Redis 기반 영속 멱등성 저장소 / 현재 단일 서버 구현은 [멱등성 플랜](../../plans/2026-09-14-003-feat-consumer-ttl-idempotency-plan.md) 참조

결제 완료/미결제 처리 보강은 [방문 결제 플랜](../../plans/2026-09-14-001-fix-client-visit-payment-flow-plan.md)을 따른다.

## Consumer SSE 운영 제약

- 현재 emitter는 서버 메모리에 있으므로 단일 애플리케이션 인스턴스에서만 전달을 보장한다.
- 다중 인스턴스 배포 전 Redis Pub/Sub 같은 외부 broker를 별도 설계한다.
- 이벤트 payload는 빈 문자열이며 화면은 기존 세션/주문 API 응답만 사용한다.
- 이벤트 전달 실패는 이미 커밋된 주문/상태 변경의 성공을 취소하지 않는다.

## Consumer SSE 검증 기록 / 2026-09-14

- 백엔드 전체 Gradle 테스트 통과.
- SSE 훅 6개/Consumer 주문 페이지 17개 테스트 격리 실행 통과.
- 프런트 typecheck/ESLint/production build 통과.
- 백엔드 실제 SSH/DB 연결 기동 성공, 무인증 SSE 요청의 `401` 계약 확인.
- 프런트 전체 병렬 테스트는 기존 관리자 MSW handler 간섭과 주문 페이지 timeout으로 중단됐다. 실패 파일은 격리 재실행 시 통과했다.
- 활성 QR 두 브라우저/Client 앱을 이용한 `dev:real` 이벤트 전이 QA는 미실행이다.
