---
title: 주문 수정 오프라인 mutation 대기와 자동 재전송 방지
date: 2026-11-05
category: ui-bugs
module: client-order-revision
problem_type: ui_bug
component: frontend_stimulus
severity: medium
symptoms:
  - 오프라인에서 주문 수정 확인 버튼을 누르면 화면이 멈춘 것처럼 보였다
  - 네트워크 복구 후 보류된 수정 요청이 사용자 확인 없이 전송될 수 있었다
root_cause: config_error
resolution_type: code_fix
tags:
  - order-revision
  - react-query
  - mutation
  - offline
  - network-mode
  - client-request-id
---

# 주문 수정 오프라인 mutation 대기와 자동 재전송 방지

## Problem

주문 수정 저장 중 네트워크가 끊기면 요청이 즉시 실패하지 않고 대기 상태에 머물렀다. 버튼은 무응답처럼 보였고, 연결이 복구되면 사용자가 다시 확인하지 않아도 이전 요청이 실행될 수 있었다.

## Symptoms

- Offline 상태에서 저장해도 오류와 Network 요청이 나타나지 않았다.
- 확인 버튼에 진행 상태가 표시되지 않아 화면이 멈춘 것처럼 보였다.
- Online 복구가 사용자 의사와 무관한 쓰기 요청의 실행 조건이 될 수 있었다.

## What Didn't Work

`mutateAsync()`의 예외 처리만으로는 충분하지 않았다. React Query의 기본 mutation 정책은 오프라인 요청을 즉시 실패시키는 대신 `paused`로 보관하고 연결 복구 후 재개할 수 있기 때문이다.

`navigator.onLine` 검사만 추가하는 것도 사전 검사와 실제 요청 사이에 연결이 끊기는 경우를 막지 못한다.

## Solution

저장 흐름과 전송 정책을 함께 수정했다.

1. `useOrderEditModalFlow.ts`에서 저장 직전 `window.navigator.onLine`을 검사한다.
2. 오프라인이면 mutation을 호출하지 않고 연결 오류를 표시한다.
3. `orderRevisionApi.ts`의 주문 수정 mutation에 `networkMode: 'always'`를 지정한다.
4. 실패 시 draft와 `clientRequestId`를 유지하고 성공 후에만 초기화한다.
5. `OrderStatusManagementPage.tsx`는 `isPending`을 확인 버튼의 로딩 상태로 표시한다.

`networkMode: 'always'`는 요청 성공을 보장하는 옵션이 아니다. 오프라인 요청을 React Query의 대기열에 숨겨두지 않고, 성공이나 실패를 애플리케이션이 즉시 처리하게 하는 정책이다.

## Why This Works

사전 검사는 이미 확인된 오프라인 상태를 빠르게 차단해 명확한 안내를 제공한다. `networkMode: 'always'`는 검사 직후 연결이 끊겨도 요청을 자동 재개 대기열에 넣지 않는다.

따라서 Online 전환만으로 수정이 실행되지 않으며, 사용자가 다시 저장할 때 동일한 draft와 `clientRequestId`로 명시적으로 재시도할 수 있다. 로딩 표시는 실제 요청 중 중복 클릭을 막고 진행 상태를 알린다.

## Prevention

- 사용자 확인이 필요한 쓰기 mutation은 오프라인 자동 재개 허용 여부를 명시한다.
- `navigator.onLine` 사전 검사와 mutation 전송 정책을 함께 검토한다.
- 실패 시 draft와 멱등성 식별자를 유지하고 성공 응답 이후에만 초기화한다.
- 테스트에서 오프라인 요청 없음, 상태 유지, Online 전환 후 자동 POST 없음, 사용자 재시도 1회를 검증한다.
- `dev:real` 수동 QA로 실제 브라우저의 Offline/Online 전환 동작을 확인한다.

## Verification

- 주문 수정 훅/API 테스트 2개 파일의 8개 테스트 통과
- typecheck, 대상 lint, build 통과
- 2026-11-05 `dev:real` QA에서 Offline 즉시 차단, draft 유지, Online 복구 후 자동 요청 없음, 사용자 재클릭 후 1회 성공 확인

## Related Issues

- [Consumer 세션/주문 API 통합](../integration-issues/consumer-session-order-api-integration-2026-09-01.md): mutation 성공 전 사용자 상태를 제거하지 않는 원칙
- [멱등성 예약과 잠금 순서](../database-issues/idempotency-reservation-lock-order-inversion-2026-10-13.md): 주문 수정 재시도 안전성의 백엔드 측 고려사항
