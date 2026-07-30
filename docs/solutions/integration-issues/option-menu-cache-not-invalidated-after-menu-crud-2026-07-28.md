---
title: Option menu cache not invalidated after menu CRUD
date: 2026-07-28
last_updated: 2026-07-30
category: integration-issues
module: client-menu-management-and-menu-option
problem_type: integration_issue
component: frontend_stimulus
symptoms:
  - "메뉴 저장 또는 카테고리 삭제 후 옵션 관리에서 이전 메뉴 목록이 표시된다"
  - "query staleTime 동안 전체 메뉴 검색 결과가 서버 변경사항을 반영하지 않는다"
root_cause: missing_workflow_step
resolution_type: code_fix
severity: medium
related_components:
  - "tanstack-query"
  - "menu-management"
  - "menu-option"
tags:
  - "query-cache"
  - "cache-invalidation"
  - "menu-crud"
  - "menu-option"
  - "tanstack-query"
  - "n-plus-one"
  - "cross-feature-cache"
---

# Option menu cache not invalidated after menu CRUD

## Problem

옵션 관리의 메뉴 목록을 카테고리별 반복 요청에서 사업장 범위의 단일 검색 API로 교체했다. 최초 구현은 새 검색 캐시와 메뉴 관리 CRUD 사이의 갱신 연결을 빠뜨려, 저장 또는 삭제 직후 옵션 관리에 이전 메뉴가 노출될 수 있었다.

## Symptoms

- 카테고리 수만큼 메뉴 상세 요청이 반복됐다.
- 메뉴 상세 저장이나 메뉴가 포함된 카테고리 삭제 후 옵션 관리로 돌아오면 `staleTime` 동안 이전 목록이 표시될 수 있었다.
- 백엔드 접속 불가로 OpenAPI 클라이언트를 재생성할 수 없었다.

## What Didn't Work

- 기존 `/menu/detail/search/{masterSysId}`를 카테고리별로 호출하면 N+1 요청이 유지된다.
- 새 단일 조회 쿼리만 추가하면 메뉴 관리 mutation이 `menuOption` 캐시를 모르기 때문에 데이터가 갱신되지 않는다.
- OpenAPI 명세 갱신 전에 `httpClient`를 직접 호출하면 동작은 하지만 프로젝트의 Orval 생성 API 흐름을 우회하게 된다.

## Solution

백엔드의 최신 OpenAPI 명세를 받은 뒤 Orval을 재생성한다. feature-local wrapper는 유지하되, 직접 `httpClient`를 호출하지 않고 생성된 함수에 요청을 위임한다. 빈 검색어는 파라미터를 생략하고 입력값은 trim한다.

```ts
export function getMenuOptionMasterList(searchKeyword = '', signal?: AbortSignal) {
  const normalizedKeyword = searchKeyword.trim();

  return getMenuDetailSearchKeyword(
    normalizedKeyword ? { searchKeyword: normalizedKeyword } : undefined,
    undefined,
    signal,
  );
}
```

React Query wrapper도 Orval이 생성한 `useGetMenuDetailSearchKeyword`를 사용하고, 프로젝트의 query key와 정책만 주입한다.

메뉴 상세 저장과 카테고리 삭제가 성공하면 검색어별 옵션 메뉴 캐시 전체를 prefix 키로 무효화한다.

```ts
await Promise.all([
  queryClient.invalidateQueries({ queryKey: queryKeys.menuManagement.detailLists }),
  queryClient.invalidateQueries({ queryKey: queryKeys.menuOption.masterLists }),
]);
```

MSW의 정적 `/detail/search` 핸들러는 동적 `/detail/:masterSysId` 핸들러보다 먼저 등록한다. 테스트는 단일 요청, 공백 처리, trim, URL 인코딩을 확인한다.

## Why This Works

- 메뉴 목록 요청 횟수가 카테고리 수와 무관하게 한 번으로 고정된다.
- URL·파라미터·응답 타입은 OpenAPI 명세에서 생성되므로 프런트엔드의 수동 계약 중복이 사라진다.
- 사업장 제한은 세션의 `sysPlantCd`를 사용하는 백엔드 계약에 일관되게 위임된다.
- `menuOption.masterLists` prefix 무효화가 모든 검색어별 캐시를 갱신 대상으로 만든다.
- 정적 MSW 경로가 동적 ID 경로에 가로채이지 않는다.

## Prevention

- 새 쿼리 키를 추가할 때 해당 데이터를 변경하는 다른 feature의 mutation까지 추적한다.
- 교차 기능 데이터는 조회 주체뿐 아니라 수정 주체를 기준으로 invalidation 경로를 점검한다.
- API 전환 테스트에 요청 횟수와 검색어 정규화 동작을 포함한다.
- 백엔드 API가 추가되면 `openapi.json` 갱신과 Orval 재생성을 같은 작업 단위로 처리한다.
- 생성 함수가 없다는 이유로 직접 호출하기 전에 OpenAPI 명세가 최신인지 먼저 확인한다.

## Related Issues

- 관련 기존 solution 문서 및 GitHub 이슈 없음.
