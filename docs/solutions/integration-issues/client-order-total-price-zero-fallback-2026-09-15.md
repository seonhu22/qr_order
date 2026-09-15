---
title: Client 주문 합계는 0원 footer와 양수 항목의 충돌을 복구한다
date: 2026-09-15
category: integration-issues
module: client-order-status
problem_type: integration_issue
component: payments
symptoms:
  - "메뉴 수량과 금액은 정상인데 주문 카드 하단 합계만 0원으로 표시됨"
root_cause: logic_error
resolution_type: code_fix
severity: medium
related_components:
  - "order-status-card"
  - "payment-total"
tags:
  - "order-total"
  - "footer-total"
  - "zero-fallback"
  - "client-payment"
---

# Client 주문 합계는 0원 footer와 양수 항목의 충돌을 복구한다

## Problem

주문 카드 본문은 수량 4개와 합계 32,000원을 표시했지만, 서버 `footer.totalPrice`가 `0`이면 카드 하단 합계가 0원으로 표시됐다.

## Symptoms

- 불고기 버거 4개 / 단가 8,000원 / 항목 합계 32,000원
- 카드 하단 합계 0원

## What Didn't Work

`row.totalPrice ?? itemsTotal`은 정의된 숫자 `0`을 결측값으로 취급하지 않는다. 반대로 `||`만 사용하면 실제 무료 주문과 불일치 응답을 구분하지 못한다.

## Solution

항목 합계를 먼저 계산한다. 서버 합계가 없거나 서버 합계는 0원이지만 항목 합계가 양수일 때만 항목 합계를 사용한다. 서버와 항목이 모두 0원이면 무료 주문의 0원을 유지한다.

```ts
const itemsTotal = row.menuItems.reduce(
  (sum, menu) => sum + calculateMenuItemTotal(menu),
  0,
);
if (row.totalPrice === undefined || (row.totalPrice === 0 && itemsTotal > 0)) {
  return itemsTotal;
}
return row.totalPrice;
```

## Why This Works

서버의 양수 합계는 계속 우선하면서 `서버 0/항목 양수`라는 모순만 복구한다. 화면의 무료 메뉴만 합산 결과가 0원인 경우도 그대로 유지된다.

## Prevention

- 합계 테스트에서 서버 양수/서버 누락/서버 0과 양수 항목/모두 0인 경계를 구분한다.
- 카드와 결제 모달은 같은 `calculateOrderTotal`을 사용한다.
- 실제 사례인 4개 × 8,000원 = 32,000원을 회귀 테스트로 유지한다.

## Related Issues

- [Consumer 세션/주문 API 연동은 생명주기와 주문 가능 상태를 분리한다](./consumer-session-order-api-integration-2026-09-01.md)
