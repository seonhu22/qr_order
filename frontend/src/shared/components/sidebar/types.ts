/**
 * @fileoverview 사이드바 공용 타입 정의
 *
 * @description
 * SidebarNav에서 사용하는 3계층 메뉴 구조 타입.
 * 어드민 전용 adminSidebarMenu.ts 같은 `as const` 상수와 호환된다.
 */

/** 3depth 메뉴: 최하위 페이지 링크 */
export type SidebarNavItem = {
  key: string;
  label: string;
  path: string;
};

/** 2depth 메뉴: 그룹 (페이지 링크 묶음) */
export type SidebarNavGroup = {
  key: string;
  label: string;
  items: readonly SidebarNavItem[];
};

/** 1depth 메뉴: 카테고리 */
export type SidebarNavDepth1 = {
  key: string;
  label: string;
  groups: readonly SidebarNavGroup[];
};
