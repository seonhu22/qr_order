---
title: 중첩 개발 라우트 직접 진입 시 빈 화면
date: 2026-11-06
category: ui-bugs
module: frontend-routing
problem_type: ui_bug
component: frontend_stimulus
symptoms:
  - "직접 /dev/modal에 진입하면 HTTP 200이지만 #root가 비어 있었다"
  - "개발 가이드 모듈 요청이 성공해도 화면이 렌더링되지 않았다"
root_cause: logic_error
resolution_type: code_fix
severity: low
related_components:
  - testing_framework
  - development_workflow
tags:
  - "react-router"
  - "nested-routes"
  - "use-routes"
  - "lazy-loading"
  - "direct-entry"
---

# 중첩 개발 라우트 직접 진입 시 빈 화면

## Problem

페이지 단위 지연 로딩 적용 후 `/dev/modal`에 직접 진입하면 문서와 모듈 요청은 성공했지만 개발 가이드가 렌더링되지 않았다.

## Symptoms

- `/dev/modal`과 관련 JavaScript 모듈 요청은 모두 HTTP 200이었다.
- 콘솔의 라우팅 오류 없이 DOM의 `#root`가 비어 있었다.
- 프로덕션 빌드는 성공했지만 실제 개발 라우트 화면은 표시되지 않았다.

## What Didn't Work

- HTTP 200과 모듈 로딩 성공만으로 지연 라우트가 정상이라고 판단할 수 없었다.
- `npm run build`는 모듈 생성만 검증하므로 URL 매칭과 DOM 렌더링을 증명하지 못했다.

## Solution

상위 `AppRoutes`가 이미 `/dev/*`를 소유하므로 내부 `useRoutes`의 루트는 부모 기준 상대 경로로 선언했다.

```tsx
// Before: 부모 접두사를 내부 라우트에서 다시 선언
{ path: '/dev', element: <DevLayout />, children: [...] }

// After: /dev/* 부모를 기준으로 매칭
{ path: '/', element: <DevLayout />, children: [...] }
```

`AppRoutes.test.tsx`에는 `/dev/modal` 직접 진입 후 `WrapperModal Guide` 제목이 나타나는 회귀 테스트를 추가했다. 전체 테스트가 병렬 실행될 때 무거운 개발 가이드 청크가 기본 1초를 넘길 수 있어 이 비동기 탐색에만 5초 제한을 명시했다.

## Why This Works

중첩 라우터는 상위 `/dev/*`가 매칭한 경로 아래에서 자식 경로를 해석한다. 내부에서 `/dev`를 다시 사용하면 접두사를 중복 매칭하지만 `/`를 사용하면 `modal`, `table` 같은 자식이 올바르게 연결된다.

## Prevention

- 지연 라우트 변경 시 빌드뿐 아니라 대표 URL 직접 진입 테스트를 둔다.
- 중첩 `useRoutes`에서는 부모가 소유한 접두사를 자식 절대 경로로 반복하지 않는다.
- HTTP 응답, 모듈 로드, DOM 렌더링을 각각 별도 증거로 확인한다.

## Verification

- 브라우저: `/dev/modal`, `/dev/table` 렌더링 확인
- `npm run typecheck`, `npm run lint`, `npm run build` 통과
- 전체 테스트 142개 파일/612개 테스트 통과

## Related Issues

- [Consumer 세션/주문 API 통합](../integration-issues/consumer-session-order-api-integration-2026-09-01.md) — 비동기 라우트 테스트에서 실제 로딩 순서를 기다리는 관련 사례
