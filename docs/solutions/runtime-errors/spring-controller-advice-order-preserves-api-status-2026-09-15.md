---
title: Spring ControllerAdvice 우선순위로 API 오류 상태 보존
date: 2026-09-15
category: runtime-errors
module: api-exception-handling
problem_type: runtime_error
component: payments
symptoms:
  - "멱등성 요청 내용 충돌이 감지됐지만 HTTP 409 대신 일반 500으로 응답함"
  - "결제 전제조건 위반도 감사 ControllerAdvice에 가로채져 HTTP 500으로 변환됨"
root_cause: logic_error
resolution_type: code_fix
severity: medium
related_components:
  - consumer-order
  - audit
  - common-exception-handling
tags:
  - spring-controller-advice
  - exception-handler-order
  - http-409
  - idempotency
  - payment
  - response-status-exception
---

# Spring ControllerAdvice 우선순위로 API 오류 상태 보존

## Problem

QA-3/QA-4에서 도메인이 판정한 `409` 예외가 `AuditController`의 광범위한 `RuntimeException` 처리기에 가로채져 일반 `500` 응답으로 변환됐다.

## Symptoms

- 같은 `clientRequestId`로 다른 주문을 보내면 `409`와 `IDEMPOTENCY_PAYLOAD_MISMATCH` 대신 일반 `500`이 반환됐다.
- 서빙 미완료 결제의 `ResponseStatusException(CONFLICT)`도 `500`으로 반환됐다.
- 서비스의 충돌 판단은 정확했지만 HTTP 상태와 응답 계약이 손실됐다.

## What Didn't Work

- 전용 예외 handler가 존재하는지만 검사했다. 여러 advice 사이에서는 예외 타입의 구체성보다 advice 우선순위가 먼저 적용될 수 있다.
- `GlobalExceptionHandler`만 등록한 standalone 테스트는 실제 애플리케이션의 advice 경쟁을 재현하지 못했다.
- Audit handler를 `Exception` 전체로 넓히려 했지만 `ErrorService`가 `RuntimeException`만 받는 기존 계약과 맞지 않았다.

## Solution

- 알려진 API 계약 예외를 담당하는 `GlobalExceptionHandler`를 `HIGHEST_PRECEDENCE`로 지정했다.
- `ResponseStatusException`의 상태와 안전한 reason을 `CommonResponse`로 보존했다.
- 알 수 없는 예외의 일반 `500` 처리를 별도 `GlobalFallbackExceptionHandler`로 분리했다.
- 감사 저장용 Runtime handler는 계약 handler 뒤, 일반 fallback 앞에 배치했다.
- 세 advice를 함께 등록한 `ApiExceptionHandlerPrecedenceTest`로 멱등성/결제 `409`를 검증했다.

```text
알려진 API 계약 예외
  -> 감사 대상 RuntimeException
  -> 알 수 없는 Exception fallback
```

## Why This Works

Spring MVC는 여러 `@ControllerAdvice`를 우선순위에 따라 탐색한다. 책임별 순서를 명시하면 넓은 Runtime handler가 구체적인 API 계약을 먼저 소비할 수 없다. 미분류 오류는 계속 상세정보를 숨긴 `500`으로 처리된다.

## Prevention

- catch-all handler를 추가할 때 모든 advice의 상대적인 `@Order`를 확인한다.
- 예외 테스트에는 운영 시 함께 활성화되는 advice를 모두 등록한다.
- HTTP 상태와 안정적인 오류 코드/메시지를 함께 단언한다.
- 알려진 계약 처리와 알 수 없는 오류 fallback을 분리한다.
- advice 변경 후 전체 백엔드 테스트를 실행한다.

## Related Issues

- [Consumer 주문/세션 계약 강화](../workflow-issues/consumer-order-session-contract-hardening-2026-08-28.md)
- [Consumer 세션/주문 API 통합](../integration-issues/consumer-session-order-api-integration-2026-09-01.md)
- 관련 GitHub Issue 없음
