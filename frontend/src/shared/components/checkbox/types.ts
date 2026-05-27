/**
 * @fileoverview Checkbox 컴포넌트 공통 타입 정의
 *
 * @module checkbox/types
 */

import type { ReactNode } from 'react';


/* =====================================================
 * 공용 열거형 타입
 * ===================================================== */

/**
 * 체크박스 크기
 * - `sm` : 16px — 조밀한 UI
 * - `md` : 20px — 기본값 (가장 많이 사용)
 * - `lg` : 24px — 주요 폼·설정 화면
 */
export type CheckboxSize = 'sm' | 'md' | 'lg';


/* =====================================================
 * CheckboxInput Props
 * ===================================================== */

/**
 * 체크박스 인풋 완성형 컴포넌트(CheckboxInput) Props
 */
export interface CheckboxInputProps {
  /**
   * 제어 컴포넌트용 체크 여부
   * 미입력 시 비제어(defaultChecked) 방식으로 동작
   */
  checked?: boolean;
  /** 비제어 모드 초기값 */
  defaultChecked?: boolean;
  /** 값 변경 콜백 */
  onChange?: (checked: boolean) => void;
  /** 체크박스 오른쪽 인라인 레이블 텍스트 */
  label?: string;
  /** 레이블 아래 부가 설명 */
  description?: string;
  /**
   * 컴포넌트 크기
   * @default 'md'
   */
  size?: CheckboxSize;
  /** 비활성화 여부 */
  disabled?: boolean;
  /**
   * 부분 선택 상태 (indeterminate)
   * — 전체 선택 체크박스에서 일부만 선택된 경우 사용
   * @default false
   */
  indeterminate?: boolean;
  /** 하단 도움말 텍스트 — errorText 가 없을 때 표시 */
  hint?: string;
  /** 에러 메시지 — 설정 시 체크박스가 에러 상태로 전환 */
  errorText?: string;
  /** 성공 메시지 — errorText 가 없을 때 표시 */
  successText?: string;
  /** 최상위 래퍼 div 에 추가할 CSS 클래스 */
  className?: string;
}


/* =====================================================
 * CheckboxGroup Props
 * ===================================================== */

/**
 * 체크박스 그룹 래퍼 Props
 */
export interface CheckboxGroupProps {
  /** 그룹 상단 레이블 */
  label?: string;
  /**
   * 정렬 방향
   * @default 'col'
   */
  direction?: 'row' | 'col';
  /** CheckboxInput 요소들 */
  children: ReactNode;
  /** 최상위 래퍼 div 에 추가할 CSS 클래스 */
  className?: string;
}
