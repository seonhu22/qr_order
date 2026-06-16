# 상태 관리 정책

> 서버 상태와 UI 상태를 분리하고, TanStack Query 캐시 키를 일관되게 관리하기 위한 기준이다.

## 기본 원칙

- 서버 데이터 조회: `TanStack Query`
- 전역 UI 상태: `Zustand`
- 선택 상태, 모달 열림, 입력 draft: 로컬 state 또는 feature hook

서버 상태와 UI 상태가 섞이면 화면이 복잡해지고 유지보수성이 크게 떨어진다. 서버에서 다시 받을 수 있는 데이터는 Query에 두고, 사용자의 현재 조작 상태만 UI 상태로 둔다.

## Query key 등록

`src/shared/api/queryKeys.ts`는 모든 TanStack Query 캐시 키의 단일 출처다.
새 feature의 조회 API를 추가할 때는 반드시 이 파일에 키를 등록하고, feature `api/*` 계층에서만 참조한다.

```ts
export const queryKeys = {
  myFeature: {
    list: (searchKeyword = '') =>
      ['settings', 'myFeature', 'list', { searchKeyword }] as const,
  },
};
```

```ts
return useGetMyFeature(params, {
  query: { queryKey: queryKeys.myFeature.list(searchKeyword) },
});
```

저장/삭제 후 목록을 갱신할 때도 `queryKeys`를 통해 참조한다.

```ts
queryClient.invalidateQueries({ queryKey: queryKeys.myFeature.list() });
```

## 관련 문서

- [TanStack Query 캐시 정책](../query-cache-policy.md)
- [Client Zustand Policy](../client-zustand-policy.md)
