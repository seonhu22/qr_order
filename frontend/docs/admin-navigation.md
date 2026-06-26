# 관리자 네비게이션

> 추가일: 2026-04-30

## 핵심 원칙

- `sys_menu`가 관리자 네비게이션의 단일 기준 데이터다.
- `ROOT` 바로 아래에는 `treeLevel 0`인 최상위 구분 메뉴(`ADMIN`, `CLIENT` 등)가 있고, 그 아래 메뉴를 헤더 섹션으로 사용한다.
- 각 섹션의 자식 메뉴로 사이드바를 만든다.
- 현재 URL로 `currentMenu`, breadcrumb, access-log용 `menuCd`를 계산한다.

## 현재 구조

- Header: 지정한 `rootMenuCd`(`treeLevel 0`) 아래 메뉴의 `menuNm`
- Sidebar: 현재 섹션의 자식 메뉴
- Breadcrumb: `depth1 / depth2 / current`
- Access Log: 현재 route에서 계산한 `menuCd`

## 루트 메뉴 코드 필터링

- `createAdminNavigationData(items, pathname, { rootMenuCd })`에 `rootMenuCd`를 넘기면, 해당 `treeLevel 0` 메뉴 하위에 속한 항목만으로 네비게이션 데이터를 만든다.
- `rootMenuCd`가 없거나 카탈로그에 해당 `treeLevel 0` 메뉴 자체가 없으면(0depth 구분이 없는 경우) 필터링 없이 전체 메뉴를 사용한다.
- 관리자 화면(`useAdminNavigationMenus`)은 `ADMIN_ROOT_MENU_CD`('ADMIN')로 필터링한다.
- 점주 화면(`useClientNavigationMenus`)도 같은 `createAdminNavigationData`를 `CLIENT_ROOT_MENU_CD`('CLIENT')로 호출해 재사용한다(`createClientNavigationData`). `sys_menu`에 `CLIENT` 트리가 아직 없으면 헤더 섹션이 비어 있으므로, 이때는 기존 정적 `CLIENT_SECTIONS` / `CLIENT_MENUS_BY_SECTION`으로 폴백한다.

## 저장 후 반영

- 메뉴 저장 성공 후 `menu/search`를 다시 조회한다.
- 백엔드가 신규 메뉴 `sysId`를 생성하므로, 저장 후 서버 응답 기준으로 트리를 다시 만든다.

## 현재 제한

- 사이드바는 3단 구조를 전제로 한다.
- breadcrumb UI도 `depth1 / depth2 / current` 3칸만 표시한다.
- 권한별 메뉴 필터는 아직 적용하지 않았다.
