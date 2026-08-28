---
title: Consumer 주문/세션 API는 master 종료 상태와 잠금 기준을 먼저 고정한다
date: 2026-08-28
category: workflow-issues
module: consumer-order
problem_type: workflow_issue
component: development_workflow
severity: high
applies_when:
  - "order_master를 방문 단위 Consumer 세션으로 재사용할 때"
  - "주문 조회/생성 API가 결제 완료와 동시에 경쟁할 수 있을 때"
  - "MVP 문서와 구현 범위를 함께 확정해야 할 때"
related_components:
  - "consumer-session"
  - "consumer-orders"
  - "global-exception-handler"
  - "mybatis"
tags:
  - "consumer-order"
  - "consumer-session"
  - "order-master"
  - "row-lock"
  - "api-contract"
  - "error-handling"
---

# Consumer 주문/세션 API는 master 종료 상태와 잠금 기준을 먼저 고정한다

## Context

Consumer 주문/세션 MVP를 구현한 뒤 리뷰에서 네 가지가 함께 드러났다. `order_master` 종료 상태 `03`이 세션 API에서 미지원 상태로 남아 있었고, 주문 목록/상세 조회는 활성 세션을 먼저 확인한 뒤 조회해 결제 완료 직후에도 `200`이 나갈 수 있었다. 공통 `500` 응답은 내부 예외 문구를 그대로 노출했고, 주문 명세는 `requestNote`를 받을 수 있는 것처럼 보였지만 실제 구현은 공백만 허용했다.

## Guidance

Consumer 방문 API를 추가할 때는 아래 네 가지를 먼저 고정한다.

1. 세션 종료 매핑: `order_master.order_status`가 `02` 또는 `03`이면 모두 `CLOSED`로 본다.
2. 조회 선형화: 주문 생성/목록/상세는 모두 같은 `order_master` 행을 잠근 뒤 `ACTIVE` 여부를 확인하고 이어서 조회한다.
3. 내부 오류 차단: 처리되지 않은 예외는 로그에만 상세 원인을 남기고, 응답은 고정 메시지와 일반 에러 코드만 내려준다.
4. 문서 동기화: 저장 컬럼이 없는 필드는 "지원 예정"처럼 쓰지 말고 현재 허용 범위를 명시한다. 이번 MVP의 `requestNote`는 `null` 또는 빈 문자열만 허용한다.

## Why This Matters

`03`을 닫힌 방문으로 처리하지 않으면 미결제 종료 방문 조회가 정상 종료가 아니라 `500`으로 바뀐다. 잠금 없이 먼저 활성 여부를 확인하면 결제 스레드가 직후 `payment_yn='Y'`와 종료 상태를 반영해도 조회 스레드는 이미 열린 방문으로 판단한 채 응답을 만들 수 있다. 내부 예외 문구 노출과 잘못된 명세는 프론트 코드젠과 QA를 동시에 흔든다.

## When to Apply

- `order_master` 하나를 공유 방문/session 식별자로 사용할 때
- 결제 완료가 세션 종료와 동일한 의미를 가질 때
- Consumer API 문서를 먼저 확정하고 프론트 연동을 나중에 붙일 때

## Examples

Before:

```text
status 03 -> IllegalStateException -> 500
ACTIVE 확인 -> 결제 완료 반영 -> 주문 목록 200
error: "SQL relation order_master does not exist"
requestNote: 자유 입력 가능해 보이는 문서
```

After:

```text
status 02/03 -> CLOSED
master FOR UPDATE -> ACTIVE 재확인 -> 조회
message: "오류가 발생했습니다. 관리자에게 문의 바랍니다."
requestNote: null 또는 빈 문자열만 허용
```

테스트는 `ConsumerSessionServiceTest`, `ConsumerOrderQueryServiceTest`, `ConsumerOrderControllerTest`에서 각각 종료 상태 매핑/조회 잠금 경계/500 노출 차단을 검증한다.

## Related

- [Consumer 주문 API 계약](../../specs/consumer-mvp/order-api.md)
- [Consumer 세션 API 계약](../../specs/consumer-mvp/session-api.md)
- [Consumer 메뉴 옵션 계약은 실제 관계와 데이터 상태를 먼저 검증한다](./consumer-menu-option-contract-rollout-2026-08-24.md)
