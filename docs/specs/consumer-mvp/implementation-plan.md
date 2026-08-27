# Consumer MVP 구현 및 검증 계획

> 상위 문서: [Consumer MVP API 명세](../consumer-mvp-api-spec.md)  
> 세션 계약: [Consumer 세션 API](./session-api.md)  
> 주문 계약: [Consumer 주문 API 계약](./order-api.md)
> 정책 근거: [Consumer MVP 정책 결정](./policy-decisions.md)

## 제약

- DB 스키마를 변경하지 않는다.
- 기존 스키마로 보장할 수 없는 요구는 구현한 척하지 않고 백엔드 요청서로 분리한다.
- 직원 호출은 UI 작업 시점으로 미룬다.
- SSE는 동기 API와 QA가 끝난 뒤 마지막에 구현한다.
- `dev` 병합과 release는 허락을 받은 뒤 수행한다.

## 권장 순서

1. 이 문서 세트의 API 모델과 보류 항목을 승인한다.
2. 현재 인증 경계와 메뉴 이미지 테스트를 기준점으로 보존한다.
3. 기존 `order_master`의 방문·결제 의미와 활성 조회 조건을 확인한다.
4. Consumer 5분 만료를 전역 세션 설정과 분리한다.
5. `GET /api/consumer/session`을 구현한다.
6. 메뉴 이미지 OpenAPI와 프런트 연결을 완료한다.
7. 주문 생성 트랜잭션과 동시성 경계를 구현한다.
8. 공유 주문 목록·상세를 구현한다.
9. OpenAPI를 추출하고 최신 프런트 브랜치에서 codegen한다.
10. 세션 stub, 고정 매장명, 비활성 guard를 실제 API로 교체한다.
11. QA 후 허락을 받아 `dev` 병합과 release를 시도한다.

## 백엔드 산출물

- Controller, DTO, Service, Mapper interface/XML
- 세션·주문 단위/통합 테스트
- 동시 주문과 중복 요청 테스트
- 갱신된 Swagger/OpenAPI
- 스키마 변경 필요 사유를 담은 백엔드 요청서

## 프런트 산출물

- 최신 OpenAPI 기반 generated client
- 세션 상태와 `ConsumerSessionGuard` 연결
- 메뉴 이미지 binary API와 404 fallback
- 로컬 장바구니 → 주문 payload mapper
- 주문 성공 시 장바구니 초기화와 공유 목록 갱신
- 주문 목록·상세 UI 연결

## 핵심 QA

- QR 진입 후 새로고침해도 현재 테이블 복구
- 주문 전 5분 무활동 시 Consumer 바인딩 만료
- 주문 후에는 5분이 지나도 결제 전 주문내역 접근 가능
- 같은 테이블의 두 휴대폰에서 서로의 확정 주문 확인
- 같은 테이블에서 서로 다른 주문을 동시에 제출해 둘 다 생성
- 같은 `clientRequestId` 재전송 시 중복 주문 없음
- 품절·판매중지·잘못된 옵션·수량 초과 거부
- 다른 사업장·과거 방문 주문 접근 시 `404`
- 결제완료 DB 상태 반영 후 방문 종료 처리
- 주문 생성 중간 실패 시 부분 데이터 없음
- 백엔드 테스트, 프런트 타입체크·테스트·빌드 통과

## 백업 지점

1. 세션 API 완료
2. 주문 생성 완료
3. 주문 조회 완료
4. codegen 완료
5. 프런트 연결·QA 완료

각 지점은 독립 커밋으로 남긴다. DB 변경은 수행하지 않는다.

## 후속 순서

1. 직원 호출 Consumer/직원 API와 UI
2. Consumer 전용 SSE
3. 참여 인원
4. 정책 확정 시 세션 나가기·주문 미리보기·취소 요청
5. 필요가 확인된 경우 서버 장바구니
