---
title: 오래된 Vite HMR 상태로 인한 Client 옵션 관리 빈 화면
date: 2026-09-18
category: runtime-errors
module: client-menu-option-management
problem_type: runtime_error
component: frontend_stimulus
symptoms:
  - "옵션 그룹 API가 200으로 성공했지만 Client 옵션 관리 본문이 빈 화면으로 바뀜"
  - "콘솔에 MenuOptionManagementPage 렌더링 오류만 표시됨"
root_cause: incomplete_setup
resolution_type: test_fix
severity: medium
related_components:
  - "react"
  - "vite"
  - "testing_framework"
tags:
  - "client-menu-option"
  - "blank-screen"
  - "vite-hmr"
  - "stale-runtime-state"
  - "regression-test"
  - "api-contract"
---

# 오래된 Vite HMR 상태로 인한 Client 옵션 관리 빈 화면

## Problem

병합 후 장시간 실행 중이던 Vite 개발 환경에서 `/client/menu/info/option`의 본문이 비었다. 옵션 그룹 API는 실제 데이터로 `200 OK`를 반환했지만 React 렌더링 단계에서 오류가 발생했다.

## Symptoms

- 화면의 `root` 아래 본문이 사라졌다.
- `/api/client/menu_manage/option/group/search/{masterSysId}`는 정상 배열을 반환했다.
- 콘솔에는 `MenuOptionManagementPage`에서 오류가 발생했다는 일반 React 메시지만 남았다.
- 같은 응답을 사용한 새 테스트 런타임에서는 오류가 재현되지 않았다.

## What Didn't Work

- 응답의 `inputType`, `requiredYn`, `useYn`과 프론트엔드 매핑을 비교했지만 계약 불일치가 없었다.
- 실제 응답을 고정한 테스트와 `StrictMode` 테스트가 모두 통과해 응답 데이터와 이중 렌더링 가설을 기각했다.
- 임시 Error Boundary로 다시 실행했을 때는 명확한 제품 코드 예외가 재현되지 않았다.

## Solution

개발 서버와 React 런타임을 새로 시작하고 브라우저를 전체 새로고침했다. 이후 실제 메뉴 9개를 차례로 선택해 정상 렌더링을 확인했다.

실제 옵션 그룹 응답을 고정한 회귀 테스트도 추가했다.

```tsx
server.use(
  http.get(`/api/client/menu_manage/option/group/search/${MASTER_SYS_ID}`, () =>
    HttpResponse.json([
      {
        groupName: '사이드 추가',
        inputType: '02',
        requiredYn: 'N',
        useYn: 'Y',
      },
    ]),
  ),
);

await user.click(await screen.findByRole('button', { name: /테스트 메뉴/ }));
expect(await screen.findByDisplayValue('사이드 추가')).toBeInTheDocument();
```

검증 결과:

- 관련 테스트 13개 통과
- `npm run typecheck` 통과
- `npm run build` 통과
- 실제 로그인 세션에서 전체 새로고침 후 옵션 그룹 표시 확인

## Why This Works

병합 전후로 컴포넌트 상태 구조가 달라진 동안 Vite/HMR이 이전 React 상태를 보존한 상태 불일치로 판단했다. 새 개발 서버와 전체 새로고침은 이전 런타임 상태를 폐기한다.

회귀 테스트는 실제 API 응답이 현재 매핑 및 테이블 렌더러와 호환됨을 증명한다. 다만 HMR의 오래된 상태 자체를 재현하거나 예방하는 테스트는 아니다.

## Prevention

- 큰 병합이나 컴포넌트 상태 구조 변경 후에는 Vite 개발 서버를 재시작한다.
- API가 200인데 HMR 이후에만 빈 화면이 생기면, API 수정 전에 전체 새로고침과 새 런타임에서 재현 여부를 확인한다.
- 실제 응답을 사용하는 회귀 테스트로 데이터 계약 문제와 개발 환경 상태 문제를 분리한다.
- 운영 배포 환경에서 재현된다면 HMR 원인으로 보지 말고 별도의 제품 코드 오류로 다시 조사한다.

## Related Issues

- [옵션 메뉴 캐시 무효화 누락](../integration-issues/option-menu-cache-not-invalidated-after-menu-crud-2026-07-28.md): 같은 옵션 관리 영역이지만 React Query 캐시 갱신 누락을 다룬 별도 문제
