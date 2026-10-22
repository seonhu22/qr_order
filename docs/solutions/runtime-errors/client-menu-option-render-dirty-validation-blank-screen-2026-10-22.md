---
title: 렌더링 중 저장 검증으로 발생한 Client 옵션 상세 빈 화면
date: 2026-10-22
category: runtime-errors
module: client-menu-option-management
problem_type: runtime_error
component: frontend_stimulus
symptoms:
  - "옵션 상세에서 빈 신규 행을 추가하면 페이지가 즉시 빈 화면으로 바뀜"
  - "콘솔에 옵션 가격을 숫자로 입력하라는 예외가 React 렌더링 중 표시됨"
root_cause: logic_error
resolution_type: code_fix
severity: high
related_components:
  - "react"
  - "form-draft-state"
  - "api-payload-validation"
tags:
  - "client-menu-option"
  - "blank-screen"
  - "dirty-check"
  - "render-purity"
  - "draft-validation"
  - "regression-test"
---

# 렌더링 중 저장 검증으로 발생한 Client 옵션 상세 빈 화면

## Problem

`/client/menu/info/option`에서 옵션 상세 행을 추가하면 사용자가 값을 입력하기도 전에 페이지 전체가 빈 화면이 됐다. 새 행의 빈 가격은 정상적인 편집 초안이지만, 렌더링 중 변경 여부를 계산하면서 저장용 숫자 검증까지 실행한 것이 원인이었다.

## Symptoms

- 옵션 그룹 저장 후 상세 영역의 `행 추가`를 누르면 화면이 사라졌다.
- 콘솔에 `옵션 가격을(를) 숫자로 입력해주세요.`가 표시됐다.
- 호출 흐름은 `isDetailDirty` → `buildMenuOptionDetailRequest` → `mapToMenuOptionDetailPayload` → `parseRequiredNumber`였다.
- API 요청 전에 예외가 발생하므로 Network 탭에는 실패 요청도 남지 않았다.

## What Didn't Work

- 저장 요청 객체를 만들어 원본과 비교하면 변경 여부도 정확히 판단할 수 있다고 가정했다.
- 그러나 저장 DTO는 완성된 값만 허용하고, UI 초안은 입력 전 빈 값을 정상 상태로 허용한다. 서로 다른 유효성 경계를 같은 함수로 처리할 수 없었다.
- 저장 검증을 느슨하게 만들면 잘못된 가격이 API로 전송될 수 있으므로 해결책이 아니다.

## Solution

렌더링 단계의 변경 감지와 저장 단계의 DTO 변환을 분리했다.

```ts
// 렌더링: 불완전한 초안도 안전하게 비교한다.
const isDetailDirty = hasMenuOptionDetailRowChanges(detailRows, originalDetailRows);

// 저장: 기존의 엄격한 숫자 변환과 필수값 검증을 유지한다.
const request = buildMenuOptionDetailRequest(detailRows, originalDetailRows);
```

`hasMenuOptionDetailRowChanges()`는 원시 UI 행을 비교해 다음 변경만 boolean으로 반환한다.

- 신규 행 추가
- 기존 행의 필드 또는 순서 변경
- 기존 행 삭제

회귀 테스트는 빈 가격(`menuOptionPrice: ''`)의 신규 행이 예외 없이 `dirty=true`가 되는지와 무변경, 수정, 삭제를 각각 확인한다. 저장 변환 테스트는 빈 가격이 계속 숫자 오류로 거부되는지 확인한다.

검증 결과:

- 메뉴 옵션 관련 15개 테스트 통과
- 전체 136개 테스트 파일, 589개 테스트 통과
- typecheck, lint, build 통과

## Why This Works

편집 화면의 draft 모델과 서버 저장 DTO는 생명주기가 다르다. draft는 입력 도중이라 불완전해도 정상이고, DTO는 제출 시점에 완전해야 한다.

렌더링과 `useMemo`에서는 예외를 던지지 않는 순수 비교만 수행하므로 빈 행 추가가 화면을 중단시키지 않는다. 저장 버튼을 누른 뒤에는 기존 변환 함수를 사용하므로 API 계약과 숫자 검증은 약해지지 않는다.

## Prevention

- React 렌더링, `useMemo`, selector, dirty 판정에서는 저장용 직렬화나 예외를 던지는 검증 함수를 호출하지 않는다.
- UI draft 비교와 API DTO 생성/검증을 별도 함수로 둔다.
- 폼 회귀 테스트에 `빈 신규 행 추가 → 렌더링 유지`를 포함한다.
- 저장 경계에는 `불완전한 값은 전송 전에 거부`하는 별도 테스트를 유지한다.
- 수동 QA에서 `행 추가 → 값 입력 → 저장 → 새로고침 후 유지`를 한 흐름으로 확인한다.

## Related Issues

- [오래된 Vite HMR 상태로 인한 Client 옵션 관리 빈 화면](./client-menu-option-stale-vite-hmr-blank-screen-2026-09-18.md): 같은 화면과 증상이지만 오래된 개발 런타임이 원인이었던 별도 사례

