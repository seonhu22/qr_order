---
title: 종료 방문 재전송과 QR 재연결의 새 방문을 분리해 QA한다
date: 2026-09-15
category: workflow-issues
module: consumer-session-qa
problem_type: workflow_issue
component: payments
severity: medium
applies_when:
  - "결제 완료나 미결제로 종료된 방문의 주문 차단을 수동 QA할 때"
  - "같은 테이블 QR로 다음 방문을 시작하는 시나리오를 검증할 때"
related_components:
  - "consumer-order"
  - "consumer-session"
  - "qr-connection"
tags:
  - "consumer-session-id"
  - "visit-closure"
  - "http-410"
  - "qr-reconnect"
---

# 종료 방문 재전송과 QR 재연결의 새 방문을 분리해 QA한다

## Context

미결제 방문 종료 후 같은 정적 QR로 다시 접속해 주문이 성공한 것을 종료 세션 차단 실패로 오해했다. QR은 테이블 진입점이고 `consumerSessionId`는 개별 방문 식별자이므로 두 동작은 다른 계약이다.

## Guidance

- 종료 전 POST를 동일 브라우저 세션에서 재전송하면 기존 `consumerSessionId`가 유지되며 `410 Gone`이어야 한다.
- `/qr/{url}`을 다시 열면 기존 방문 바인딩을 제거한다. 열린 방문이 없으면 새 `consumerSessionId`를 발급하므로 다음 방문 주문은 허용된다.
- QA는 QR URL이 아니라 요청에 바인딩된 `consumerSessionId`가 같은지 확인한다.

## Why This Matters

종료된 방문을 차단해야 이전 방문에 주문이 섞이지 않는다. 반면 정적 QR까지 차단하면 다음 손님이 같은 테이블을 사용할 수 없다. 종료 방문 재전송과 다음 방문 생성을 분리해야 방문 격리와 테이블 재사용을 함께 보장한다.

## When to Apply

- 결제 완료/미결제 후 주문 생성 `410`을 확인할 때
- QR 연결이나 방문 바인딩 초기화 로직을 변경할 때
- 같은 테이블의 연속 방문 테스트 데이터를 구성할 때

## Examples

```text
종료 방문 A의 주문 POST 재전송 -> consumerSessionId A -> 410
같은 QR 재스캔 -> consumerSessionId B 발급 -> 다음 방문 주문 허용
```

## Related

- [Consumer 주문/세션 API는 master 종료 상태와 잠금 기준을 먼저 고정한다](./consumer-order-session-contract-hardening-2026-08-28.md)
- [Consumer 세션/주문 API 연동은 생명주기와 주문 가능 상태를 분리한다](../integration-issues/consumer-session-order-api-integration-2026-09-01.md)
