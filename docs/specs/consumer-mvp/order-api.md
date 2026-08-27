# Consumer 주문 API 계약

> 상위 문서: [Consumer MVP API 명세](../consumer-mvp-api-spec.md)  
> 세션 계약: [Consumer 세션 API](./session-api.md)  
> 정책 근거: [Consumer MVP 정책 결정](./policy-decisions.md)  
> 모델 원칙: 기존 설계 필드와 구조를 유지하며 회의 내용으로 새 필드를 추론하지 않는다.

## 공통 범위

- 주문 API는 `ACTIVE` Consumer 세션에서만 호출한다.
- 사업장·테이블·공유 방문은 서버 세션과 DB에서 가져온다.
- 한 번의 `POST /orders`는 기존 `order_group` 한 건이며 `orderId = order_group.sys_id`다.
- 공유 주문 목록은 같은 테이블의 현재 후결제 방문에 속한 `order_group`을 조회한다.
- 클라이언트 가격은 받지 않고 서버가 현재 메뉴·옵션과 최종 금액을 검증한다.

## `POST /api/consumer/orders`

요청 모델:

| 필드 | 타입 | 필수 | 규칙 |
|---|---|---:|---|
| `clientRequestId` | `string` | Y | 주문 시도별 ULID/UUID, 재시도 시 동일 값 |
| `items` | `OrderCreateItem[]` | Y | 1개 이상 |
| `requestNote` | `string \| null` | N | 저장 가능한 기존 컬럼 확인 후 사용 |

`OrderCreateItem`:

| 필드 | 타입 | 필수 | 규칙 |
|---|---|---:|---|
| `menuSysId` | `string` | Y | 현재 세션 사업장의 판매 가능 메뉴 |
| `quantity` | `integer` | Y | `1..99`, 후속 최대수량 정책 적용 가능 |
| `options` | `OrderCreateOption[]` | N | 없으면 빈 배열 |

`OrderCreateOption`:

| 필드 | 타입 | 필수 | 규칙 |
|---|---|---:|---|
| `optionSysId` | `string` | Y | 해당 메뉴와 연결된 활성 옵션 |
| `quantity` | `integer` | Y | 선택 유형과 `maximumNum` 충족 |

```json
{
  "clientRequestId": "01K...",
  "items": [
    {
      "menuSysId": "01JMENU...",
      "quantity": 2,
      "options": [
        { "optionSysId": "01JOPTION...", "quantity": 1 }
      ]
    }
  ],
  "requestNote": "덜 맵게 부탁드립니다."
}
```

서버 검증:

- 메뉴·옵션의 세션 사업장 소속
- 사용·삭제·판매중지·품절 상태
- 메뉴-옵션그룹-옵션 연결 관계
- 필수·단일·복수·수량 선택 규칙
- 메뉴와 옵션 수량 범위
- 주문 직전 서버 가격과 최종 합계

하나라도 실패하면 주문 전체를 저장하지 않는다. `order_master`, `order_group`, `order_detail`, `order_detail_option` 저장은 한 트랜잭션이다.

성공 `201`의 `data`:

| 필드 | 타입 | 설명 |
|---|---|---|
| `orderId` | `string` | 주문 티켓 식별자 |
| `orderNo` | `string` | 사용자 표시 주문번호 |
| `status` | `OrderStatus` | 최초 `RECEIVED` |
| `totalAmount` | `integer` | 서버 확정 총액 |
| `orderedAt` | `string` | `yyyy-MM-dd HH:mm:ss` |

## 동시 주문과 중복 요청

- 서로 다른 `clientRequestId`는 같은 테이블이어도 모두 정상 주문이다.
- 같은 `clientRequestId`는 첫 요청만 생성하고 재요청은 최초 결과를 반환하거나 `409`로 종료한다.
- 같은 공유 방문의 DB 쓰기는 안전하게 순서 처리하되 동시 주문 자체를 금지하지 않는다.
- 프런트는 제출 중 버튼을 비활성화하고, 성공 후 로컬 장바구니를 비운다.

`N`초 중복 판정과 다중 서버 멱등성은 저장소가 필요하다. 기존 컬럼으로 보장할 수 없으면 메모리 처리의 한계를 기록하고 백엔드 담당자에게 스키마 변경을 요청한다. 승인 전 DB는 수정하지 않는다.

## `GET /api/consumer/orders`

현재 공유 방문의 주문 티켓을 최신순으로 반환한다. Query와 Body는 없다.

성공 `200`의 `data.orders[]`:

| 필드 | 타입 | 설명 |
|---|---|---|
| `orderId` | `string` | 주문 티켓 ID |
| `orderNo` | `string` | 표시 주문번호 |
| `status` | `OrderStatus` | 서버 상태의 API 매핑값 |
| `totalAmount` | `integer` | 주문 총액 |
| `itemCount` | `integer` | 메뉴 총수량 |
| `orderedAt` | `string` | 주문 시각 |
| `updatedAt` | `string` | 최종 변경 시각 |

다른 고객이 생성한 주문도 같은 공유 방문이면 포함한다. 같은 테이블의 과거 결제 방문은 제외한다.

## `GET /api/consumer/orders/{orderId}`

현재 공유 방문에 속한 주문 한 건을 반환한다. `orderId`만 조회하지 않고 공유 방문과 사업장 조건을 함께 적용한다.

성공 `200`의 주문 필드:

| 필드 | 타입 |
|---|---|
| `orderId`, `orderNo`, `status` | `string` |
| `requestNote` | `string \| null` |
| `totalAmount` | `integer` |
| `orderedAt`, `updatedAt` | `string` |
| `items` | `OrderDetailItem[]` |

`OrderDetailItem`:

| 필드 | 타입 |
|---|---|
| `orderItemId`, `menuSysId`, `menuName` | `string` |
| `quantity`, `unitAmount`, `lineAmount` | `integer` |
| `options` | `OrderDetailOption[]` |

`OrderDetailOption`:

| 필드 | 타입 |
|---|---|
| `optionSysId`, `optionName` | `string` |
| `quantity`, `unitAmount`, `lineAmount` | `integer` |

금액 의미:

- 옵션 금액은 옵션 단가 × 옵션 수량 × 메뉴 수량이다.
- 메뉴 항목 `unitAmount`는 메뉴 1개 기준 메뉴 단가와 선택 옵션 합계다.
- 메뉴 항목 `lineAmount`는 `unitAmount × 메뉴 수량`이다.
- 주문 `totalAmount`는 모든 메뉴 `lineAmount` 합계다.

회의의 “결제 시 기준 보존”은 응답 모델을 변경하지 않는다. 기존 주문 테이블이 해당 정책을 보장할 수 있는지 확인하고, 불가능하면 가격 버전·스냅샷 필요성을 백엔드 요청으로 분리한다.

## `OrderStatus`

| API 값 | 기존 코드 | 의미 |
|---|---|---|
| `RECEIVED` | `01` | 접수 |
| `COOKING` | `02` | 조리중 |
| `SERVED` | `03` | 서빙완료 |
| `PAID` | 백엔드 확인 | 결제완료 |
| `UNPAID` | 백엔드 확인 | 미결제 종료 |
| `CANCELLED` | 기존 취소 코드 | 직원 취소 |

소비자 완료 안내는 `RECEIVED` 성공 문구만 사용한다. 상태 모델은 공유 목록과 향후 SSE 호환을 위해 유지한다.

## 오류

| HTTP | 조건 |
|---|---|
| `400` | 빈 주문, 수량·옵션 규칙 위반 |
| `401` | QR 바인딩 없음 |
| `404` | 현재 사업장·방문에서 메뉴·옵션·주문 조회 불가 |
| `409` | 품절·가격 변경·중복 요청·허용되지 않은 상태 |
| `410` | 결제완료 또는 만료 방문 |
| `500` | 처리되지 않은 서버 오류 |

## 프런트 처리

1. 주문 시도마다 `clientRequestId`를 생성하고 네트워크 재시도에서 재사용한다.
2. 제출 중 버튼을 비활성화한다.
3. 가격 변경 또는 품절 `409`면 장바구니를 유지하고 변경 내용을 안내한다.
4. 성공하면 장바구니를 비우고 공유 주문목록 query를 갱신한다.
5. 별도 “추가 주문” 버튼 없이 메뉴 화면에서 다시 담는다.

