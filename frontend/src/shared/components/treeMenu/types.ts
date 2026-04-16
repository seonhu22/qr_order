/**
 * @fileoverview TreeMenu 컴포넌트 타입 정의
 * @module shared/components/treeMenu/types
 */

import type { ReactNode } from 'react';


/**
 * 트리 메뉴 노드 단일 항목
 * @template T - 노드에 첨부된 원본 데이터 타입
 */
export type TreeMenuNode<T = unknown> = {
  /** 고유 식별자 */
  id: string;
  /** 레이블 셀에 표시되는 텍스트 */
  label: string;
  /**
   * 비활성 여부
   * - true 이면 행 클릭 선택 불가, 스타일 dim 처리
   * - 행 추가/삭제 시 기존 항목을 잠글 때 사용
   */
  disabled?: boolean;
  /** 자식 노드 목록 — 존재하면 펼치기/접기 토글 표시 */
  children?: TreeMenuNode<T>[];
  /** 노드에 연결된 원본 데이터 */
  data?: T;
};


/**
 * 추가 컬럼 정의
 * @template T - 노드 데이터 타입
 *
 * @example
 * // SelectInput 컬럼
 * const col: TreeMenuColumn<MenuData> = {
 *   key: 'useYn',
 *   header: '사용여부',
 *   width: '8rem',
 *   render: (node) => (
 *     <SelectInput
 *       options={useYnOptions}
 *       value={node.data?.useYn}
 *       disabled={node.disabled}
 *     />
 *   ),
 * };
 */
export type TreeMenuColumn<T = unknown> = {
  /** 컬럼 고유 키 */
  key: string;
  /** 헤더 텍스트. 생략 시 빈 th */
  header?: string;
  /** 컬럼 너비 (CSS 값 또는 숫자 → px 변환) */
  width?: string | number;
  /**
   * 셀 렌더 함수
   * @param node  현재 노드
   * @param depth 트리 깊이 (루트 = 0)
   * @returns     렌더할 ReactNode (InputBase, SelectInput, 텍스트 등)
   */
  render: (node: TreeMenuNode<T>, depth: number) => ReactNode;
};
