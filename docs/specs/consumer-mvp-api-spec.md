# Consumer MVP API 문서 허브

> 상태: 구현 전 검토  
> 갱신일: 2026-08-27  
> 결제 방식: 현장 후결제

## 목표

현재 백엔드 API 모델을 기준으로 Consumer API를 구체화하고, 회의에서 확정한 제품 정책을 별도 근거로 연결한다. 문서 승인 후 세션/주문 API 구현, codegen, 프런트 연결, QA를 진행한다.

## 문서 읽는 순서

필요한 문서만 선택해서 읽는다.

| 목적 | 문서 |
|---|---|
| 회의에서 무엇을 결정했는가 | [Consumer MVP 정책 결정](./consumer-mvp/policy-decisions.md) |
| 현재 구현된 API 모델 확인 | [기존 Consumer API 계약](./consumer-mvp/existing-api.md) |
| 세션 API 구현 | [Consumer 세션 API 계약](./consumer-mvp/session-api.md) |
| 주문 생성/목록/상세 구현 | [Consumer 주문 API 계약](./consumer-mvp/order-api.md) |
| 작업 순서와 QA 확인 | [구현 및 검증 계획](./consumer-mvp/implementation-plan.md) |
| 현재 Consumer UI 확인 | [Consumer 주문 화면](../../frontend/docs/page/consumer-order.md) |
| QR 진입 UI 확인 | [Consumer QR 진입](../../frontend/docs/page/consumer-qr-entry.md) |

## 근거 우선순위

모델과 정책이 충돌하거나 표현이 다르면 아래 순서를 따른다.

1. 현재 백엔드 Controller/DTO/테스트와 OpenAPI
2. 이 문서 세트에서 이미 설계한 신규 API 모델
3. 회의에서 확정한 제품 정책
4. 회의 예시/건의/화면 모델

회의에서는 API 모델을 결정하지 않았다. 따라서 회의 자료의 `menuId`, `storeCode` 같은 화면 필드나 신규 DB 컬럼 제안을 현재 API 모델에 자동 반영하지 않는다.

## 확정 제약

- DB 스키마를 변경하지 않는다.
- 스키마가 필요한 요구는 근거/실패 시나리오/대안을 담아 백엔드 담당자에게 요청한다.
- 같은 테이블의 같은 후결제 방문 고객은 확정 주문내역을 공유한다.
- 여러 고객의 동시 주문을 허용한다.
- `order_master`는 한 테이블의 한 후결제 방문/정산 단위로 사용한다.
- QR 연결 또는 최초 세션 조회에서 활성 `order_master`를 생성/재사용하고 그 ID를 `consumerSessionId`로 반환한다.
- 주문 없이 5분 만료된 빈 master는 다음 방문에서 재사용하지 않는다.
- `payment_yn=Y` 반영 뒤 변경되는 `order_master` 결제완료 상태를 방문 종료 신호로 사용한다.
- 중복 제출은 프런트의 요청 진행 중 잠금으로 막으며, 서버 재시작/다중 서버 멱등성은 MVP 범위가 아니다.
- 주문 전 5분 무활동 만료, 주문 후 결제완료까지 유지한다.
- 직원 호출은 UI 작업 시점으로 미룬다.
- Consumer SSE는 동기 API 연결과 QA 뒤 마지막에 구현한다.

## API 목록

| 단계 | Method | Path | 문서/상태 |
|---|---|---|---|
| 기존 | `GET` | `/api/qr/{url}` | [계약](./consumer-mvp/existing-api.md#get-apiqrurl) |
| 기존 | `GET` | `/api/consumer/menu/main` | [계약](./consumer-mvp/existing-api.md#get-apiconsumermenumain) |
| 기존 | `GET` | `/api/consumer/menu/search` | [계약](./consumer-mvp/existing-api.md#get-apiconsumermenusearch) |
| 기존 | `GET` | `/api/consumer/menu/{menuSysId}` | [계약](./consumer-mvp/existing-api.md#get-apiconsumermenumenusysid) |
| 오늘 | `GET` | `/api/consumer/session` | [신규 계약](./consumer-mvp/session-api.md) |
| 오늘 | `GET` | `/api/consumer/menu/{menuSysId}/image` | 백엔드 완료, [연결 계약](./consumer-mvp/existing-api.md#get-apiconsumermenumenusysidimage) |
| 오늘 | `POST` | `/api/consumer/orders` | [신규 계약](./consumer-mvp/order-api.md#post-apiconsumerorders) |
| 오늘 | `GET` | `/api/consumer/orders` | [신규 계약](./consumer-mvp/order-api.md#get-apiconsumerorders) |
| 오늘 | `GET` | `/api/consumer/orders/{orderId}` | [신규 계약](./consumer-mvp/order-api.md#get-apiconsumerordersorderid) |
| 후속 | `POST` | `/api/consumer/staff-calls` | 직원 호출 UI 이후 |
| 후속 | `GET` | `/api/consumer/staff-calls/active` | 직원 호출 UI 이후 |
| 마지막 | `GET` | `/api/consumer/events` | Consumer 전용 SSE |

제품 정책이 확정될 때만 추가한다.

- `POST /api/consumer/session/leave`
- `POST /api/consumer/orders/preview`
- `POST /api/consumer/orders/{orderId}/cancel-request`
- `GET /api/consumer/staff-call/types`
- `GET /api/consumer/staff-calls`
- `DELETE /api/consumer/staff-calls/{callId}`
- `GET /api/consumer/session/participants`
- 서버 장바구니 API 5개(경로 미정)

## 공통 보안/응답 원칙

- Consumer 인증은 직원 `loginUser`가 아니라 QR Consumer 바인딩만 인정한다.
- 사업장/테이블/방문 범위는 요청이 아니라 서버 세션과 DB에서 결정한다.
- JSON API는 기존 `CommonResponse`를 사용한다.
- 이미지 API만 binary 응답이다.
- 클라이언트의 가격/사업장/테이블 값을 신뢰하지 않는다.
- 다른 사업장/방문 리소스는 `404`로 처리해 존재 여부를 숨긴다.
- 주문 저장은 최종 검증부터 상세/옵션 저장까지 하나의 트랜잭션이다.

## 구현 시 확인

- 기존 컬럼으로 빈 master의 5분 만료와 정리를 표현하는 방법
- 활성 master 조회, 추가 주문 재사용, 결제 뒤 신규 master 생성 쿼리
- 같은 테이블의 동시 첫 주문에서 공유 master 중복을 막을 트랜잭션/잠금 기준
- 주문 당시 또는 결제 시 가격 보존을 기존 컬럼으로 충족하는지
- `requestNote` 저장 가능한 기존 컬럼이 있는지

확인 결과 기존 스키마로 불가능하면 임의 우회하지 않고 백엔드 요청서로 전환한다.

## 문서 완료 기준

- 정책과 API 모델이 분리되어 있다.
- 기존 API 모델은 현재 코드와 일치한다.
- 신규 세션/주문 모델은 기존 설계 필드를 유지한다.
- 각 endpoint의 입력/출력/오류/소유권 검증이 명시되어 있다.
- 모든 문서는 200줄 이하이며 허브에서 필요한 문서로 연결된다.
- 보류 항목과 백엔드 확인 항목이 구현 확정사항과 구분된다.

## 참고 Notion

- [문서 작성 규칙](https://app.notion.com/p/3c97bac9288d81af898ee101d3eed9ca)
- [v3 백엔드 위임/API 구현 주의사항](https://app.notion.com/p/3c37bac9288d80fbacd9f536419829eb)
- [v3 페이지별 데이터 타입](https://app.notion.com/p/72a7bac9288d839fb84f01c260c0ec5b)
