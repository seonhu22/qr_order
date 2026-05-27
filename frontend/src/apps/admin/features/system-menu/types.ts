/**
 * @fileoverview 메뉴 관리 feature 전용 화면 모델 타입
 *
 * @description
 * - generated DTO를 그대로 쓰지 않고, 화면에서 다루기 편한 형태로 정리한 타입이다.
 * - 트리 구조는 TreeMenuNode<MenuData>를 그대로 사용한다.
 */

import type { TreeMenuNode } from '@/shared/components/treeMenu';

/**
 * 트리 노드 한 개에 담기는 메뉴 데이터
 */
export type MenuData = {
  /** 서버 식별자. 신규 행은 undefined */
  sysId?: string;
  /**
   * 상위 메뉴 코드. 루트 메뉴는 systemMenuApi의 ROOT_PARENT_MENU_CD를 사용한다.
   *
   * @description
   * 기존 mock에서는 parentSysId처럼 쓰였지만 백엔드 DTO/컬럼은 parentMenuCd다.
   */
  parentMenuCd?: string;
  /** 메뉴 코드 */
  code: string;
  /** 메뉴 명 */
  name: string;
  /**
   * 메뉴 경로 (/path 형태).
   * 값이 있으면 하위 메뉴 추가 불가 (리프 노드).
   */
  path?: string;
  /** 화면 정렬 순서 */
  ordNo: number;
  /** 트리 깊이. 루트는 1 */
  treeLevel?: number;
  /** 신규 행 여부 — 서버에 저장되지 않은 상태 */
  isNew?: boolean;
};

/** 트리 메뉴에서 사용하는 MenuData 노드 */
export type MenuNode = TreeMenuNode<MenuData>;

/**
 * 저장 유효성 검사 결과 — 필드별 오류 노드 ID 집합
 *
 * @property code  - 메뉴코드가 비어 있는 노드 ID 집합
 * @property name  - 메뉴 명이 비어 있는 노드 ID 집합
 * @property path  - 자식이 있는데 메뉴주소가 설정된 노드 ID 집합 (충돌)
 */
export type NodeFieldErrors = {
  code: Set<string>;
  name: Set<string>;
  path: Set<string>;
};
