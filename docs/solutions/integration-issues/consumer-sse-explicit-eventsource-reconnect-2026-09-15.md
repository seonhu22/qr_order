---
title: Consumer SSE 장애 후 새 EventSource로 명시적으로 재연결한다
date: 2026-09-15
category: integration-issues
module: consumer-sse
problem_type: integration_issue
component: frontend_stimulus
severity: medium
symptoms:
  - "SSE 차단 중 5초 polling은 동작하지만 차단 해제 후에도 SSE가 다시 연결되지 않음"
  - "SSE 복구 뒤에도 polling 요청이 계속됨"
root_cause: async_timing
resolution_type: code_fix
related_components:
  - "event-source"
  - "polling-fallback"
  - "consumer-session"
tags:
  - "consumer-sse"
  - "eventsource"
  - "reconnect"
  - "polling-fallback"
---

# Consumer SSE 장애 후 새 EventSource로 명시적으로 재연결한다

## Problem

요청 차단 중 HTTP polling은 정상 작동했지만, 차단 해제 후 SSE가 복구되지 않고 polling이 계속됐다. 브라우저의 동일 `EventSource` 자동 재연결에만 의존한 것이 원인이었다.

## Symptoms

- SSE 단절 중 세션/주문 GET이 5초마다 실행됐다.
- 차단 해제 후 새 SSE 요청이 Pending 상태로 열리지 않았다.
- 기존 테스트는 실패한 동일 source에 `open`을 직접 발생시켜 실제 수명주기를 검증하지 않았다.

## What Didn't Work

`onerror`에서 polling만 시작하면 브라우저가 기존 객체를 복구하지 못하는 환경에서 새 연결을 보장할 수 없다.

## Solution

- 오류 시 polling을 시작하고 실패한 source를 닫는다.
- 3초 뒤 새 `EventSource`를 생성한다.
- 새 source의 `open`을 받은 뒤에만 polling을 중단한다.
- 교체된 source의 늦은 이벤트를 무시하고 cleanup에서 두 타이머와 source를 정리한다.
- 테스트에서 `old close -> new instance -> new open -> polling stop`을 검증한다.

## Why This Works

polling이 연결 공백을 보완하고 명시적 source 생성이 브라우저별 자동 재연결 동작에 대한 의존을 제거한다. source 식별 검사와 timer cleanup은 중복 연결과 유령 polling을 막는다.

## Prevention

- SSE 복구 테스트는 동일 객체의 가짜 `open`이 아니라 새 객체 생성을 확인한다.
- Request blocking 해제 후 SSE 요청 하나가 Pending이고 반복 GET이 멈추는지 수동 QA한다.

## Related Issues

- [Consumer 세션/주문 API 연동은 생명주기와 주문 가능 상태를 분리한다](./consumer-session-order-api-integration-2026-09-01.md)
