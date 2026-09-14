# TanStack Query 캐시 정책

> 작성일: 2026-06-09

## 목적

목록 화면이 오래된 데이터를 보여주지 않도록 캐시 시간을 기능 성격별로 통일한다.

## 기본 정책

| 구분 | staleTime | 사용처 |
| --- | ---: | --- |
| `instant` | 0초 | 로그, 변경이력, 상태 조회 |
| `short` | 1분 | 관리자/클라이언트 CRUD 목록 |
| `normal` | 5분 | 전역 기본값 |
| `session` | 30분 | `/auth/me` |

정책 값은 `src/shared/api/queryPolicies.ts`에서 관리한다.

## 기능별 기준

- 관리자 CRUD 목록: `queryPolicies.adminCrudList`
- 클라이언트 CRUD 목록: `queryPolicies.clientCrudList`
- 클라이언트 기준정보: `queryPolicies.clientReferenceData`
- 클라이언트 실시간 상태: `queryPolicies.clientRealtimeStatus`
- 검색 결과/로그: `queryPolicies.searchResult`
- 인증 정보: `queryPolicies.authMe` (`retry: false` — 미로그인 시 즉시 처리)
- 대시보드: `queryPolicies.dashboard` (`retry: false` — 진입 즉시 결과 확정. 재시도로 인한 지연보다 에러 UI 빠른 노출 우선)

## 클라이언트 앱 기준

클라이언트 앱은 화면 성격에 따라 아래 정책을 우선 선택한다.

| 화면 성격 | 정책 | 예시 |
| --- | --- | --- |
| 등록/수정/삭제가 있는 관리 목록 | `clientCrudList` | 메뉴 관리, 테이블 관리, 사용자 관리 |
| 자주 바뀌지 않는 기준정보 | `clientReferenceData` | 옵션 그룹, 매장 설정, 공지 목록 |
| 최신성이 중요한 운영 상태 | `clientRealtimeStatus` | 주문 현황, 결제 상태, 조리/서빙 상태 |

### 주문 상태 Polling

주문 상태 관리 화면은 `clientRealtimeStatus`를 실제로 사용한다.

| 옵션 | 값 | 이유 |
| --- | --- | --- |
| `staleTime` | `0` | 주문 상태를 항상 최신 조회 대상으로 취급 |
| `retry` | `false` | 최초 오류와 후속 동기화 오류를 즉시 구분해 표시 |
| `refetchInterval` | 5초 | 운영 중 주문 상태 자동 갱신 |
| `refetchIntervalInBackground` | `false` | 보이지 않는 탭의 불필요한 요청 방지 |
| `refetchOnWindowFocus` | `true` | 화면 복귀 시 즉시 최신 상태 확인 |

- 수동 `새로고침`은 같은 query의 `refetch()`를 호출한다.
- 최초 조회 실패는 전체 오류 화면으로 표시한다.
- 기존 데이터가 있는 후속 조회 실패는 카드를 유지하고 동기화 실패 상태만 표시한다.
- 상태 변경은 낙관적으로 캐시를 수정하지 않는다. mutation 성공 후 목록 prefix를 invalidate하고 재조회 결과를 반영한다.
- 처리 중인 주문 ID, 열린 모달 스냅샷, 화면에서 숨긴 카드 ID는 query cache와 분리한다.

## 저장/삭제 후 갱신

저장/삭제 성공 후에는 현재 검색어 키 하나만 갱신하지 않는다.

```ts
queryClient.invalidateQueries({ queryKey: queryKeys.notice.lists });
```

이렇게 prefix key를 사용하면 같은 목록의 다른 검색 조건 캐시도 함께 stale 처리된다.

## 검색 버튼 재조회 (searchResult 채택 시 필수)

`staleTime: 0`이어도 같은 조건으로 `setState`를 다시 호출하면 query key가 바뀌지 않으므로 refetch가 발동하지 않는다.

따라서 `queryPolicies.searchResult`를 채택하고 "조회" 버튼 UX가 있는 화면은 아래 패턴을 함께 구현한다.

```ts
import { areQueryParamsEqual } from '@/shared/utils/queryParams';

const handleSearch = () => {
  const nextParams = buildSearchParams(...);
  if (areQueryParamsEqual(nextParams, searchParams)) {
    void query.refetch();
  } else {
    setSearchParams(nextParams);
  }
};
```

현재 적용 화면:

- 접속정보조회 (`useAccessLogPageState.ts`)
- 변경이력조회 (`useChangeHistoryPageState.ts`)

## 주의사항

- generated API 파일은 수정하지 않는다.
- query key는 `src/shared/api/queryKeys.ts`에 먼저 추가한다.
- 두 곳 이상에서 같은 비교 로직이 필요하면 shared util을 우선 검토한다.
