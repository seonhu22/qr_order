# Client Zustand Policy

> 작성일: 2026-06-10

Client 앱에서 Zustand를 어디까지 사용할지 추적하기 위한 문서다.

## 결정

- 서버 상태는 `TanStack Query`가 담당한다.
- UI 상태는 필요할 때 `Zustand`로 분리한다.
- Client 앱의 첫 적용 대상은 `clientLayoutStore`다.
- 주문 목록, 주문 상세, loading, error 같은 서버 데이터는 Zustand에 넣지 않는다.

## 우선 적용

`clientLayoutStore`는 아래 UI 상태만 관리한다.

- `isSidebarOpen`
- `activeSection`
- 현재 메뉴 key 또는 path

이 값은 `ClientLayout`, `ClientHeader`, `ClientSidebar`, page breadcrumb/hint에서 공유할 수 있다.

## 보류

`clientOrderStore`는 지금 만들지 않는다.

주문 화면에서 필요해지면 Zustand에는 아래처럼 UI 상태만 둔다.

- 선택된 주문 ID
- 현재 주문 상태 필터
- 주문 상세 패널 열림 여부
- 알림 패널 열림 여부

주문 데이터 자체는 백엔드 계약 확정 후 `TanStack Query`로 구현한다.

## 구현 체크

- `apps/client/stores/clientLayoutStore.ts`에 둔다.
- `shared/stores`는 client/admin 공용 상태가 생길 때만 사용한다. (예: 이탈방지 가드 `shared/stores/preventLeaveStore.ts` — [`operations.md` §5-14](./operations.md#14-페이지-이탈방지미저장-변경-경고는-usepreventleave--useguardednavigate를-사용한다) 참고)
- `persist`는 적용하지 않는다. 새로고침 후 레이아웃 UI 상태는 초기화한다.
- `ClientLayout`의 prop drilling은 store 구독으로 줄인다.
