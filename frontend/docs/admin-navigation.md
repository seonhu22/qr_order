# 관리자 네비게이션

> 추가일: 2026-04-30

## 핵심 원칙

- `sys_menu`가 관리자 네비게이션의 단일 기준 데이터다.
- `ROOT` 바로 아래 메뉴를 헤더 섹션으로 사용한다.
- 각 섹션의 자식 메뉴로 사이드바를 만든다.
- 현재 URL로 `currentMenu`, breadcrumb, access-log용 `menuCd`를 계산한다.

## 현재 구조

- Header: `ROOT` 아래 메뉴의 `menuNm`
- Sidebar: 현재 섹션의 자식 메뉴
- Breadcrumb: `depth1 / depth2 / current`
- Access Log: 현재 route에서 계산한 `menuCd`

## 저장 후 반영

- 메뉴 저장 성공 후 `menu/search`를 다시 조회한다.
- 백엔드가 신규 메뉴 `sysId`를 생성하므로, 저장 후 서버 응답 기준으로 트리를 다시 만든다.

## 현재 제한

- 사이드바는 3단 구조를 전제로 한다.
- breadcrumb UI도 `depth1 / depth2 / current` 3칸만 표시한다.
- 권한별 메뉴 필터는 아직 적용하지 않았다.
